#!/usr/bin/env bash
# One-time preparation of a fresh Ubuntu 24.04 VPS (e.g. UAhosting CX-23 / UAX-1) for bp-audit.com.ua.
# Safe to run again: existing secrets, users and settings are kept.
#
# On your computer:   scp -r scripts/server root@<IP>:/root/bp-setup
# On the server:      DOMAIN=bp-audit.com.ua STAGING_LEAD_TO=you@example.com bash /root/bp-setup/setup.sh
#
# What it does (docs/HOSTING-UAHOSTING.md, docs/SECURITY.md):
#   packages (Node 22, nginx, PM2, certbot, sqlite3, fail2ban, unattended-upgrades) · 2 GB swap · user `deploy` ·
#   /srv/audit (production) + /srv/audit-staging · secrets in shared/cms.env + shared/web.env.local · nginx sites with
#   rate limits · password on the staging website · firewall (SSH + HTTP/HTTPS only) · fail2ban · automatic security
#   updates · nightly backups · SSH key-only login · a deploy key for GitHub Actions.
# It does NOT touch DNS and does not request certificates (DNS must point here first): see the summary at the end.
#
# Variables (all optional):
#   DOMAIN            main domain                         (bp-audit.com.ua)
#   LEAD_TO           where production leads are e-mailed (businesspartners@ukr.net)
#   SMTP_USER         mailbox the site sends from         (site@$DOMAIN; password goes into web.env.local by hand)
#   STAGING_LEAD_TO   where staging leads go; empty = staging sends no e-mail at all
#   STAGING_USER      login for the staging website       (client)
#   STAGING_PASSWORD  password for it                     (generated and shown once if empty)
#   SKIP_STAGING=1    production only
#   RENDER_ONLY=<dir> write the nginx and env files into <dir> and exit (used by the tests; changes nothing)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${DOMAIN:-bp-audit.com.ua}"
LEAD_TO="${LEAD_TO:-businesspartners@ukr.net}"
SMTP_USER="${SMTP_USER:-site@$DOMAIN}"
STAGING_LEAD_TO="${STAGING_LEAD_TO:-}"
STAGING_USER="${STAGING_USER:-client}"
STAGING_PASSWORD="${STAGING_PASSWORD:-}"
SKIP_STAGING="${SKIP_STAGING:-0}"
RENDER_ONLY="${RENDER_ONLY:-}"

log() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok() { printf '\033[1;32m✔ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

secret() { node -e "console.log(require('crypto').randomBytes(24).toString('base64'))" 2>/dev/null || openssl rand -base64 24; }

# ——— Renders one environment's nginx site from the template.
# render_site <out-file> <site-hosts> <cms-host> <web-port> <cms-port> <auth: yes|no>
render_site() {
  local auth=""
  if [ "$6" = yes ]; then
    auth='    auth_basic "Staging";\n    auth_basic_user_file /etc/nginx/.htpasswd-bp-audit;'
  fi
  sed -e "s|{{SITE_HOSTS}}|$2|g" -e "s|{{CMS_HOST}}|$3|g" -e "s|{{WEB_PORT}}|$4|g" -e "s|{{CMS_PORT}}|$5|g" \
      -e "s|{{STAGING_AUTH}}|$auth|g" "$HERE/nginx/site.conf.template" > "$1"
}

# ——— Writes cms.env + web.env.local for one environment, only if they don't exist yet (secrets are never replaced).
# make_env <shared-dir> <cms-port> <web-port> <site-url> <cms-url> <no-index> <lead-to> <smtp-on: yes|no>
make_env() {
  local dir="$1" rev
  mkdir -p "$dir"
  if [ -f "$dir/cms.env" ] && [ -f "$dir/web.env.local" ]; then
    ok "$dir: env files already exist — kept"
    return
  fi
  rev="$(secret)"
  cat > "$dir/cms.env" <<EOF
HOST=127.0.0.1
PORT=$2
PUBLIC_URL=$5
SITE_URL=$4
APP_KEYS="$(secret),$(secret),$(secret),$(secret)"
API_TOKEN_SALT=$(secret)
ADMIN_JWT_SECRET=$(secret)
TRANSFER_TOKEN_SALT=$(secret)
JWT_SECRET=$(secret)
ENCRYPTION_KEY=$(secret)
WEB_REVALIDATE_URL=http://127.0.0.1:$3/api/revalidate
REVALIDATE_SECRET=$rev
SEED_ON_EMPTY=true
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
EOF
  local smtp_host=""
  [ "$8" = yes ] && smtp_host="mail.$DOMAIN"
  cat > "$dir/web.env.local" <<EOF
STRAPI_URL=http://127.0.0.1:$2
STRAPI_PUBLIC_URL=$5
STRAPI_WEB_TOKEN=
REVALIDATE_SECRET=$rev
SITE_URL=$4
NO_INDEX=$6
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=
SMTP_HOST=$smtp_host
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=$SMTP_USER
SMTP_PASS=
MAIL_FROM="Бізнес Партнери <$SMTP_USER>"
LEAD_EMAIL_TO=$7
LEAD_CONFIRMATION=true
EOF
  chmod 600 "$dir/cms.env" "$dir/web.env.local"
  ok "$dir: cms.env + web.env.local created (secrets generated)"
}

PROD_SITE="$DOMAIN www.$DOMAIN"
STG_SITE="staging.$DOMAIN"
STG_SMTP=no
[ -n "$STAGING_LEAD_TO" ] && STG_SMTP=yes

if [ -n "$RENDER_ONLY" ]; then
  mkdir -p "$RENDER_ONLY"
  render_site "$RENDER_ONLY/bp-audit.conf" "$PROD_SITE" "cms.$DOMAIN" 3000 1337 no
  render_site "$RENDER_ONLY/bp-audit-staging.conf" "$STG_SITE" "cms-staging.$DOMAIN" 3001 1338 yes
  make_env "$RENDER_ONLY/prod" 1337 3000 "https://$DOMAIN" "https://cms.$DOMAIN" "" "$LEAD_TO" yes
  make_env "$RENDER_ONLY/staging" 1338 3001 "https://$STG_SITE" "https://cms-staging.$DOMAIN" true "$STAGING_LEAD_TO" "$STG_SMTP"
  exit 0
fi

[ "$(id -u)" = 0 ] || fail "Run as root (sudo bash setup.sh)"
grep -q 'Ubuntu' /etc/os-release || warn "Not Ubuntu — the commands are written for Ubuntu 24.04"

# ——— 1. Packages
log "Packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
if ! command -v node >/dev/null || ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit((a===22&&b>=19)||a===24?0:1)'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
fi
apt-get install -yq nodejs nginx rsync curl sqlite3 certbot python3-certbot-nginx apache2-utils fail2ban unattended-upgrades ufw fonts-dejavu-core
command -v pm2 >/dev/null || npm i -g pm2
ok "node $(node -v), nginx $(nginx -v 2>&1 | cut -d/ -f2), pm2 $(pm2 -v)"

# ——— 2. Swap (the Strapi admin build needs memory)
log "Swap"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "2 GB swap on"
else
  ok "swap already on"
fi

# ——— 3. User `deploy`, folders
log "User deploy and folders"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
if [ -s /root/.ssh/authorized_keys ]; then
  # Your own key(s): you can log in as deploy too.
  while read -r line; do grep -qxF "$line" /home/deploy/.ssh/authorized_keys || echo "$line" >> /home/deploy/.ssh/authorized_keys; done < /root/.ssh/authorized_keys
fi
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
install -d -m 750 -o deploy -g deploy /srv/audit /srv/audit/shared /srv/backups
[ "$SKIP_STAGING" = 1 ] || install -d -m 750 -o deploy -g deploy /srv/audit-staging /srv/audit-staging/shared
env PATH="$PATH:/usr/bin" pm2 startup systemd -u deploy --hp /home/deploy >/dev/null
ok "deploy user ready, PM2 starts with the server"

# ——— 4. Secrets
log "Secrets (shared/cms.env, shared/web.env.local)"
sudo -u deploy bash -c "$(declare -f secret ok make_env); DOMAIN='$DOMAIN' SMTP_USER='$SMTP_USER' make_env /srv/audit/shared 1337 3000 'https://$DOMAIN' 'https://cms.$DOMAIN' '' '$LEAD_TO' yes"
if [ "$SKIP_STAGING" != 1 ]; then
  sudo -u deploy bash -c "$(declare -f secret ok make_env); DOMAIN='$DOMAIN' SMTP_USER='$SMTP_USER' make_env /srv/audit-staging/shared 1338 3001 'https://$STG_SITE' 'https://cms-staging.$DOMAIN' true '$STAGING_LEAD_TO' $STG_SMTP"
  [ "$STG_SMTP" = no ] && warn "Staging sends no e-mail (set STAGING_LEAD_TO to get its leads in your mailbox)"
fi

# ——— 5. nginx
log "nginx"
install -m 644 "$HERE/nginx/bp-audit-http.conf" /etc/nginx/conf.d/bp-audit-http.conf
render_site /etc/nginx/sites-available/bp-audit "$PROD_SITE" "cms.$DOMAIN" 3000 1337 no
ln -sfn /etc/nginx/sites-available/bp-audit /etc/nginx/sites-enabled/bp-audit
GENERATED_PW=""
if [ "$SKIP_STAGING" != 1 ]; then
  render_site /etc/nginx/sites-available/bp-audit-staging "$STG_SITE" "cms-staging.$DOMAIN" 3001 1338 yes
  ln -sfn /etc/nginx/sites-available/bp-audit-staging /etc/nginx/sites-enabled/bp-audit-staging
  if [ ! -f /etc/nginx/.htpasswd-bp-audit ] || [ -n "$STAGING_PASSWORD" ]; then
    if [ -z "$STAGING_PASSWORD" ]; then STAGING_PASSWORD="$(openssl rand -base64 12 | tr -d '/+=')"; GENERATED_PW="$STAGING_PASSWORD"; fi
    htpasswd -bc /etc/nginx/.htpasswd-bp-audit "$STAGING_USER" "$STAGING_PASSWORD" >/dev/null 2>&1
    chown root:www-data /etc/nginx/.htpasswd-bp-audit && chmod 640 /etc/nginx/.htpasswd-bp-audit
  fi
fi
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "nginx sites ready (production$([ "$SKIP_STAGING" = 1 ] || echo " + staging"))"

# ——— 6. Firewall, fail2ban, automatic security updates
log "Firewall, fail2ban, security updates"
ufw allow OpenSSH >/dev/null && ufw allow 'Nginx Full' >/dev/null && ufw --force enable >/dev/null
install -m 644 "$HERE/fail2ban-jail.local" /etc/fail2ban/jail.d/bp-audit.local
systemctl enable --now fail2ban >/dev/null 2>&1 && systemctl restart fail2ban
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
ok "ufw: SSH + HTTP/HTTPS only · fail2ban: sshd + nginx limits · unattended security upgrades on"

# ——— 7. Backups
log "Nightly backups"
install -m 755 "$HERE/backup.sh" /usr/local/bin/bp-audit-backup
cat > /etc/cron.d/bp-audit-backup <<'EOF'
# Nightly backup of the CMS database and uploads (scripts/server/backup.sh), kept 14 days in /srv/backups.
15 3 * * * deploy /usr/local/bin/bp-audit-backup >> /srv/backups/backup.log 2>&1
EOF
ok "03:15 every night → /srv/backups (14 days)"

# ——— 8. SSH: keys only (only when a key is installed, so you can't lock yourself out)
log "SSH"
if [ -s /root/.ssh/authorized_keys ]; then
  cat > /etc/ssh/sshd_config.d/99-bp-audit.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
MaxAuthTries 4
EOF
  # Some images set PasswordAuthentication yes in 50-cloud-init.conf, which is read first and would win.
  sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config.d/*.conf 2>/dev/null || true
  sshd -t && systemctl reload ssh
  ok "password login off, keys only"
else
  warn "No key in /root/.ssh/authorized_keys — password login left ON. Add your key and run this script again."
fi

# ——— 9. Key for GitHub Actions
log "Deploy key for GitHub Actions"
KEY=/home/deploy/.ssh/github_actions
if [ ! -f "$KEY" ]; then
  sudo -u deploy ssh-keygen -q -t ed25519 -N "" -C github-actions-deploy -f "$KEY"
  cat "$KEY.pub" >> /home/deploy/.ssh/authorized_keys
fi
IP="$(curl -fsS -4 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')"
OUT=/root/github-secrets.txt
{
  echo "# Copy into GitHub → Settings → Environments → production AND staging, then delete this file: rm $OUT"
  echo "SSH_HOST=$IP"
  echo "SSH_USER=deploy"
  echo "SSH_KNOWN_HOSTS (one line):"; ssh-keyscan -H "$IP" 2>/dev/null
  echo; echo "SSH_PRIVATE_KEY:"; cat "$KEY"
} > "$OUT"
chmod 600 "$OUT"
ok "GitHub secrets written to $OUT"

# ——— Summary
cat <<EOF

────────────────────────────────────────────────────────────
 Server ready. Next steps (docs/HOSTING-UAHOSTING.md):

 1. DNS (cPanel → Zone Editor): A records cms, staging, cms-staging → $IP
 2. HTTPS:  certbot --nginx -d cms.$DOMAIN -d $STG_SITE -d cms-staging.$DOMAIN
 3. Mail password: nano /srv/audit/shared/web.env.local   (SMTP_PASS=…, mailbox $SMTP_USER)
 4. GitHub: secrets from $OUT, variables per environment (APP_DIR, APP_NAME, CMS_PORT, WEB_PORT, SITE_URL)
 5. Actions → CI / Deploy → Run workflow (staging, then main); create the admins right after
 6. Launch day: A records $DOMAIN + www → $IP, then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN
EOF
if [ -n "$GENERATED_PW" ]; then
  echo " Staging website login: $STAGING_USER / $GENERATED_PW   (shown once — save it in your password manager)"
fi
echo "────────────────────────────────────────────────────────────"
