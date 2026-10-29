#!/usr/bin/env bash
# Builds and activates one release ON THE SERVER. Called by .github/workflows/deploy.yml after the code
# was uploaded to $APP_DIR/releases/<id>; can also be run by hand:
#
#   APP_NAME=audit CMS_PORT=1337 WEB_PORT=3000 bash /srv/audit/releases/<id>/scripts/server-deploy.sh /srv/audit/releases/<id>
#
# Layout on the server (APP_DIR, e.g. /srv/audit — one APP_DIR per environment):
#   shared/cms.env          CMS secrets (never in git)          → linked as releases/<id>/cms/.env
#   shared/web.env.local    website secrets                     → linked as releases/<id>/web/.env.local
#   shared/cms-tmp/         SQLite database (if used)           → linked as releases/<id>/cms/.tmp
#   shared/uploads/         images uploaded in the admin        → linked as releases/<id>/cms/public/uploads
#   releases/<id>/          one folder per deploy (last $KEEP_RELEASES are kept)
#   current → releases/<id> the active release
#
# Order: build CMS → switch CMS → build website against the new CMS → switch website → revalidate.
# The old version keeps serving while everything builds. If the new CMS or website doesn't answer its
# health check, the previous release is started again and the script exits with an error.
set -Eeuo pipefail

REL="$(cd "${1:?usage: server-deploy.sh <release-dir>}" && pwd)"
APP_DIR="$(cd "$REL/../.." && pwd)"
APP_NAME="${APP_NAME:-audit}"
CMS_PORT="${CMS_PORT:-1337}"
WEB_PORT="${WEB_PORT:-3000}"
KEEP_RELEASES="${KEEP_RELEASES:-3}"
SHARED="$APP_DIR/shared"
CMS_PM2="$APP_NAME-cms"
WEB_PM2="$APP_NAME-web"

log() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok() { printf '\033[1;32m✔ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

# One deploy at a time per APP_DIR.
exec 9>"$APP_DIR/.deploy.lock"
flock -n 9 || fail "Another deploy is running for $APP_DIR"

# ——— 0. Prerequisites
log "Checking the server ($APP_NAME → $APP_DIR)"
for bin in node npm pm2 curl flock; do command -v "$bin" >/dev/null || fail "'$bin' is not installed (see docs/CI-CD.md → First-time server setup)"; done
node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit((a===22&&b>=19)||a===24?0:1)' \
  || fail "Node $(node -v) is not supported — install 22.19+ (22.22.0 recommended) or 24.x"
[ -f "$SHARED/cms.env" ] || fail "Missing $SHARED/cms.env (copy cms/.env.example, fill in the secrets)"
[ -f "$SHARED/web.env.local" ] || fail "Missing $SHARED/web.env.local (copy web/.env.example, fill it in)"
mkdir -p "$SHARED/cms-tmp" "$SHARED/uploads" "$APP_DIR/releases"
PREV=""
[ -L "$APP_DIR/current" ] && PREV="$(readlink -f "$APP_DIR/current")"
[ "$PREV" = "$REL" ] && PREV=""
ok "node $(node -v), release $(basename "$REL"), previous: ${PREV:+$(basename "$PREV")}${PREV:-none}"

# ——— 1. Link shared state (secrets, database, uploads) into the release
ln -sfn "$SHARED/cms.env" "$REL/cms/.env"
ln -sfn "$SHARED/web.env.local" "$REL/web/.env.local"
rm -rf "$REL/cms/.tmp" "$REL/cms/public/uploads"
ln -sfn "$SHARED/cms-tmp" "$REL/cms/.tmp"
ln -sfn "$SHARED/uploads" "$REL/cms/public/uploads"

# ——— Process helpers (PM2). Bound to 127.0.0.1: Nginx is the only public entry point.
start_cms() {
  pm2 delete "$CMS_PM2" >/dev/null 2>&1 || true
  NODE_ENV=production PORT="$CMS_PORT" pm2 start npm --name "$CMS_PM2" --cwd "$1/cms" --time -- run start >/dev/null
}
start_web() {
  pm2 delete "$WEB_PM2" >/dev/null 2>&1 || true
  NODE_ENV=production PORT="$WEB_PORT" HOSTNAME=127.0.0.1 pm2 start "$1/web/scripts/start-standalone.mjs" --name "$WEB_PM2" --cwd "$1/web" --time >/dev/null
}
wait_http() { # url, regex for the expected status, seconds
  local code
  for _ in $(seq 1 "${3:-90}"); do
    code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' "$1" || true)"
    [[ "$code" =~ $2 ]] && return 0
    sleep 1
  done
  echo "last status from $1: ${code:-none}" >&2
  return 1
}
rollback() { # what to restart from the previous release: cms | web | both
  [ -n "$PREV" ] || { echo "No previous release to roll back to." >&2; return 0; }
  log "Rolling back to $(basename "$PREV")"
  [[ "$1" == cms || "$1" == both ]] && start_cms "$PREV"
  [[ "$1" == web || "$1" == both ]] && start_web "$PREV"
  pm2 save >/dev/null || true
}

# ——— 2. Build the CMS (old version still running)
log "Installing CMS dependencies"
(cd "$REL/cms" && npm ci --no-audit --no-fund)
log "Building the Strapi admin panel"
(cd "$REL/cms" && NODE_ENV=production npm run build)

log "Installing website dependencies"
(cd "$REL/web" && npm ci --no-audit --no-fund)

# ——— 3. Switch the CMS (schema/content changes must be live before the website is built)
log "Starting the new CMS"
start_cms "$REL"
if ! wait_http "http://127.0.0.1:$CMS_PORT/_health" '^20[04]$' 120; then
  pm2 logs "$CMS_PM2" --lines 60 --nostream || true
  rollback cms
  fail "The new CMS did not become healthy — previous version restored"
fi
ok "CMS is up on :$CMS_PORT"

# First deploy: the CMS creates the website's API token in .tmp/web-token.txt. Fill it in if still empty.
if grep -qE '^STRAPI_WEB_TOKEN=[[:space:]]*$' "$SHARED/web.env.local" && [ -s "$SHARED/cms-tmp/web-token.txt" ]; then
  token="$(tr -d '[:space:]' < "$SHARED/cms-tmp/web-token.txt")"
  sed -i "s|^STRAPI_WEB_TOKEN=.*$|STRAPI_WEB_TOKEN=$token|" "$SHARED/web.env.local"
  ok "STRAPI_WEB_TOKEN written to shared/web.env.local"
fi

# ——— 4. Build the website against the live CMS (old website still serving)
log "Building the website"
if ! (cd "$REL/web" && NEXT_TELEMETRY_DISABLED=1 npm run build); then
  rollback cms
  fail "Website build failed — previous CMS restored, website unchanged"
fi

# ——— 5. Switch the website
log "Starting the new website"
start_web "$REL"
if ! wait_http "http://127.0.0.1:$WEB_PORT/uk" '^200$' 60; then
  pm2 logs "$WEB_PM2" --lines 60 --nostream || true
  rollback both
  fail "The new website did not answer — previous version restored"
fi
ok "Website is up on :$WEB_PORT"

# ——— 6. Activate, persist the process list, refresh caches
ln -sfn "$REL" "$APP_DIR/current.new" && mv -Tf "$APP_DIR/current.new" "$APP_DIR/current"
pm2 save >/dev/null
secret="$(grep -E '^REVALIDATE_SECRET=' "$SHARED/web.env.local" | tail -n1 | cut -d= -f2- | tr -d '"' || true)"
if [ -n "$secret" ]; then
  curl -s -o /dev/null -m 10 -X POST -H "x-revalidate-secret: $secret" "http://127.0.0.1:$WEB_PORT/api/revalidate" && ok "Page cache refreshed" || true
fi

# ——— 7. Keep only the newest releases (never the current or previous one)
cd "$APP_DIR/releases"
ls -1dt -- */ 2>/dev/null | sed 's:/$::' | tail -n +"$((KEEP_RELEASES + 1))" | while read -r old; do
  [ "$APP_DIR/releases/$old" = "$REL" ] || [ "$APP_DIR/releases/$old" = "$PREV" ] || rm -rf -- "$old"
done

ok "Deployed $(basename "$REL") for $APP_NAME"
