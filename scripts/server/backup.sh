#!/usr/bin/env bash
# Nightly backup of the production CMS data: SQLite database (content + leads) and uploaded files.
# Installed by setup.sh as /usr/local/bin/bp-audit-backup and run by /etc/cron.d/bp-audit-backup as `deploy`.
# Restore: stop the CMS (pm2 stop audit-cms), copy data-<date>.db over /srv/audit/shared/cms-tmp/data.db,
# untar uploads-<date>.tgz into /srv/audit/shared, start the CMS again.
set -euo pipefail
APP_DIR="${APP_DIR:-/srv/audit}"
DEST="${BACKUP_DIR:-/srv/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%F)"
umask 077
mkdir -p "$DEST"
if [ -f "$APP_DIR/shared/cms-tmp/data.db" ]; then
  # .backup is safe while Strapi is running (consistent snapshot).
  sqlite3 "$APP_DIR/shared/cms-tmp/data.db" ".backup '$DEST/data-$STAMP.db'"
fi
if [ -d "$APP_DIR/shared/uploads" ]; then
  tar czf "$DEST/uploads-$STAMP.tgz" -C "$APP_DIR/shared" uploads
fi
find "$DEST" -maxdepth 1 -type f \( -name 'data-*.db' -o -name 'uploads-*.tgz' \) -mtime +"$KEEP_DAYS" -delete
echo "Backup $STAMP done → $DEST"
