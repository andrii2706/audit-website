# CI/CD with GitHub Actions

## Client preview on GitHub Pages (no server needed)

`.github/workflows/pages-demo.yml` publishes a **static preview** on every push to `main` (or by hand: Actions → *Pages demo* → *Run workflow*):

1. The runner starts Strapi with a fresh database seeded with the starter content in both languages (uk, en).
2. It builds the website against it as static files and publishes them at `https://<user>.github.io/<repo>/`.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. On GitHub Free, Pages works only for **public** repositories. If the repo is private, make it public or use a paid plan. Another option: the static `web/out` folder also works on Netlify or Cloudflare Pages.

How the preview differs from the real site:
- the form validates and shows the success screen with the note "demo — not sent";
- the content is the seed data (the news templates are drafts, so the news page shows its empty state);
- per-page social preview images are off;
- search engines are blocked.

How it works: `web/scripts/prepare-pages-demo.mjs` removes the server-only parts in the CI checkout:
- the proxy;
- `/api/revalidate`;
- the server action (replaced by `web/demo/actions.ts`);
- ISR;
- the dynamic OG images.

Then `PAGES_DEMO=1` switches `next.config.ts` to `output: 'export'` with the Pages `basePath`, and `scripts/finish-pages-demo.mjs` adds the language-redirect `index.html`. The real code and the VPS deploy are unaffected.

---

## Deploy to a VPS

`.github/workflows/deploy.yml` checks every change and deploys automatically to a VPS. While an environment has no server configured, its deploy is **skipped with a warning** (not failed):

| Event | What happens |
| --- | --- |
| Pull request to `main` / `staging` | **check** only: install, lint, build, type-check |
| Push to `staging` | check → deploy to the **staging** environment |
| Push to `main` | check → deploy to the **production** environment (or **staging**, see below) |
| Actions → *CI / Deploy* → *Run workflow* | choose `staging` / `production` by hand, or `auto` (rules above) |

**MVP with only a staging server.** Create only the `staging` environment and add the repository variable `MAIN_DEPLOYS_TO=staging` (Settings → Secrets and variables → Actions → *Variables*). Pushes to `main` then deploy to staging. When production is ready, create the `production` environment and delete the variable (or set it to `production`).

```
GitHub Actions ──rsync over SSH──► $APP_DIR/releases/<id>/ ──► scripts/server-deploy.sh (on the server)
                                                                  1. npm ci + build Strapi admin   (old version still serving)
                                                                  2. start new CMS → health check   (rollback if it fails)
                                                                  3. build website against new CMS (rollback if it fails)
                                                                  4. start new website → health check (rollback if it fails)
                                                                  5. current → releases/<id>, pm2 save, refresh page cache
```

The site is unavailable for about a second, only while the website process is swapped. If anything fails, the previous release keeps running or is started again, and the job turns red. Secrets and data (`.env` files, the SQLite database, uploaded images) live in `$APP_DIR/shared` and are linked into every release, so a deploy never touches them.

Tested end-to-end: a first deploy on an empty server, a redeploy over a live site, and a deploy of broken code (rolled back, site stayed up).

---

## 1. First-time server setup (once per server)

Ubuntu 24.04, 4 GB RAM recommended. Run as root, then work as the `deploy` user.

```bash
# Packages: Node 22 LTS, PM2, Nginx, rsync, certbot
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs nginx rsync curl certbot python3-certbot-nginx
npm i -g pm2
node -v                      # must be 22.19 or newer

# 2 GB swap: the Strapi admin build is memory-hungry
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Deploy user and folders (one APP_DIR per environment)
adduser --disabled-password --gecos "" deploy
mkdir -p /srv/audit/shared /srv/audit-staging/shared
chown -R deploy:deploy /srv/audit /srv/audit-staging

# PM2 restarts the apps after a reboot
sudo -u deploy pm2 startup systemd -u deploy --hp /home/deploy   # run the command it prints
```

### Secrets: `shared/cms.env` and `shared/web.env.local`

Create them as `deploy` from the templates in the repo (`cms/.env.example`, `web/.env.example`). Generate every secret with:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

**`/srv/audit/shared/cms.env`** (production):

```ini
HOST=127.0.0.1
PORT=1337
PUBLIC_URL=https://cms.bp-audit.com.ua
APP_KEYS="<4 random values, comma-separated>"
API_TOKEN_SALT=<random>
ADMIN_JWT_SECRET=<random>
TRANSFER_TOKEN_SALT=<random>
JWT_SECRET=<random>
ENCRYPTION_KEY=<random>
WEB_REVALIDATE_URL=http://127.0.0.1:3000/api/revalidate
REVALIDATE_SECRET=<random — same value in web.env.local>
SEED_ON_EMPTY=true            # first start fills the content; set false afterwards
DATABASE_CLIENT=sqlite        # or postgres + DATABASE_URL
DATABASE_FILENAME=.tmp/data.db
```

**`/srv/audit/shared/web.env.local`** (production):

```ini
STRAPI_URL=http://127.0.0.1:1337
STRAPI_WEB_TOKEN=               # leave empty: the first deploy fills it in automatically
REVALIDATE_SECRET=<same as cms.env>
SITE_URL=https://bp-audit.com.ua
NO_INDEX=
# SMTP_HOST=… SMTP_USER=… SMTP_PASS=… MAIL_FROM=…   (lead e-mails, see web/.env.example)
```

For **staging** on the same server, use other ports and block search engines:

| | production | staging |
| --- | --- | --- |
| `APP_DIR` | `/srv/audit` | `/srv/audit-staging` |
| `APP_NAME` (PM2 names) | `audit` | `audit-staging` |
| CMS `PORT` / `STRAPI_URL` | `1337` | `1338` |
| website port / `WEB_REVALIDATE_URL` | `3000` | `3001` |
| `SITE_URL` | `https://bp-audit.com.ua` | `https://staging.bp-audit.com.ua` |
| `NO_INDEX` | *(empty)* | `true` |

Two environments on one server need about 1.5 GB of RAM at runtime. 4 GB plus swap is enough, and 8 GB is comfortable.

### Nginx + HTTPS

`/etc/nginx/sites-available/audit` (production; copy it for staging with ports 3001/1338 and the staging domains):

```nginx
server {
  server_name bp-audit.com.ua www.bp-audit.com.ua;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
server {
  server_name cms.bp-audit.com.ua;
  client_max_body_size 50m;
  location / {
    proxy_pass http://127.0.0.1:1337;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Optional password for staging, so only the client sees it: `apt-get install -y apache2-utils && htpasswd -c /etc/nginx/.htpasswd client`. Then add these lines inside the staging website `location /`:

```nginx
auth_basic "Staging";
auth_basic_user_file /etc/nginx/.htpasswd;
```

```bash
ln -s /etc/nginx/sites-available/audit /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d bp-audit.com.ua -d www.bp-audit.com.ua -d cms.bp-audit.com.ua
```

## 2. SSH key for GitHub Actions

On your computer:

```bash
ssh-keygen -t ed25519 -f audit_deploy -N "" -C "github-actions-deploy"
ssh-copy-id -i audit_deploy.pub deploy@<server-ip>     # or append the .pub to ~deploy/.ssh/authorized_keys
ssh-keyscan -H <server-ip>                            # output → SSH_KNOWN_HOSTS secret
```

`audit_deploy` (the private key) goes into GitHub, and only there. Delete the local copy afterwards.

## 3. GitHub settings

**Settings → Environments → New environment**: create `production` and `staging`. For each one, add:

| Kind | Name | Example (production) |
| --- | --- | --- |
| Secret | `SSH_HOST` | `203.0.113.10` |
| Secret | `SSH_USER` | `deploy` |
| Secret | `SSH_PRIVATE_KEY` | contents of `audit_deploy` |
| Secret | `SSH_KNOWN_HOSTS` | output of `ssh-keyscan -H <server-ip>` (recommended) |
| Variable | `APP_DIR` | `/srv/audit` |
| Variable | `APP_NAME` | `audit` |
| Variable | `CMS_PORT` | `1337` |
| Variable | `WEB_PORT` | `3000` |
| Variable | `SITE_URL` | `https://bp-audit.com.ua` (shown as the deployment link) |
| Variable | `SSH_PORT` | `22` (only if different) |

Recommended for `production`:
- **Required reviewers.** Every production deploy waits for your click.
- **Deployment branches:** `main` only.
- A branch protection rule on `main` that requires the *Lint, build, type-check* check.

## 4. Everyday flow

```bash
git checkout staging && git merge my-feature && git push   # → staging deploy, show it to the client
# client approves → open a PR staging → main, merge          # → production deploy
```

The first deploy creates the content (with `SEED_ON_EMPTY=true`) and writes `STRAPI_WEB_TOKEN`. Afterwards, open `https://cms.…/admin`, create the administrator and set `SEED_ON_EMPTY=false` in `shared/cms.env`.

## 5. Manual rollback

Releases stay in `$APP_DIR/releases` (the last 3 plus the current one). To go back without rebuilding:

```bash
cd /srv/audit && ls -1t releases            # pick the previous release
PREV=/srv/audit/releases/<id>
pm2 delete audit-cms audit-web
NODE_ENV=production PORT=1337 pm2 start npm --name audit-cms --cwd $PREV/cms --time -- run start
NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1 pm2 start $PREV/web/scripts/start-standalone.mjs --name audit-web --cwd $PREV/web --time
ln -sfn $PREV current && pm2 save
```

Or: Actions → *CI / Deploy* → *Run workflow* on an older commit / tag.

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `SSH_HOST is not set for the 'production' environment` | The push went to `main`, which deploys to production. Either fill in the `production` environment, or set the repository variable `MAIN_DEPLOYS_TO=staging`, or push to the `staging` branch. Secrets saved in one environment are not visible in another. |
| `Host key verification failed` | Update `SSH_KNOWN_HOSTS` (the server was reinstalled or its IP changed). |
| `Missing …/shared/cms.env` | Create the shared env files (section 1). |
| Build killed / `JavaScript heap out of memory` | Add swap, or use a server with more RAM. |
| `The new CMS did not become healthy` | The log above the error shows `pm2 logs`. Usually a wrong value in `cms.env` or the database. |
| Deploy is green but content is missing | Check `STRAPI_URL` in `web.env.local` (it must point to this environment's CMS port). |
| Logs | `pm2 logs audit-web`, `pm2 logs audit-cms`, `pm2 monit` |
