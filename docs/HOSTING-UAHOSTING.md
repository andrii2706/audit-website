# Going live on a UAhosting VPS

The client's current UAhosting plan is shared PHP hosting (cPanel, 512 MB–1 GB RAM per account, PHP only): it can't
run Strapi + Next.js. The project goes to a **UAhosting VPS** (same provider and billing; tested target:
**CX-23** — 2 vCPU, 4 GB RAM, Germany — or **UAX-1** — Ukraine). Domain, DNS and the mailboxes stay on the
existing account; only the website's A records change.

```
visitors ─► bp-audit.com.ua ─┐                     ┌─ Next.js :3000 ─┐
editors  ─► cms.bp-audit…  ──┼─► nginx (VPS) ──────┤                 ├─► SQLite + uploads (shared/)
                              │   HTTPS, limits     └─ Strapi  :1337 ─┘
GitHub Actions ── rsync/SSH ─► releases/<id> ─► scripts/server-deploy.sh (build, health check, rollback)
UAhosting cPanel: DNS zone (A records) + mail (mail.bp-audit.com.ua, SMTP for the lead e-mails)
```

A step-by-step version with screenshots of each check lives in the Claude Doc «Запуск bp-audit.com.ua на VPS
UAhosting». This file is the short technical path.

## 0. Before you start

- VPS ordered (Ubuntu 24.04), its IP and root access. Put your SSH key on it:
  `type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@<IP> "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"` (PowerShell).
- cPanel access for the DNS zone (the client changes the cPanel password first — the old one was e-mailed in plain text).
- Mailbox `site@bp-audit.com.ua` created in cPanel → Email Accounts (the website sends lead e-mails from it).
- Private GitHub repository with branches `main` and `staging`.

## 1. Prepare the server — one command

```bash
scp -r scripts/server root@<IP>:/root/bp-setup                       # from the project folder
ssh root@<IP> 'STAGING_LEAD_TO=you@example.com bash /root/bp-setup/setup.sh'
```

`scripts/server/setup.sh` (safe to re-run; never replaces existing secrets):

| Step | Result |
| --- | --- |
| Packages | Node 22, nginx, PM2, certbot, sqlite3, fail2ban, unattended-upgrades, ufw, fonts-dejavu-core (watermark text) |
| Swap | 2 GB (the Strapi admin build needs it) |
| User `deploy` | Owns `/srv/audit` (production) and `/srv/audit-staging`; PM2 starts with the server |
| Secrets | `shared/cms.env` + `shared/web.env.local` per environment, all keys generated, `chmod 600`; `STRAPI_URL` internal, `STRAPI_PUBLIC_URL` = the `cms.` address |
| nginx | `scripts/server/nginx/*` → sites for `bp-audit.com.ua`, `cms.`, `staging.`, `cms-staging.`; rate limits; password on the staging website |
| Security | ufw (SSH + HTTP/HTTPS only), fail2ban (SSH + nginx limits), automatic security updates, SSH keys only |
| Backups | `/usr/local/bin/bp-audit-backup` every night 03:15 → `/srv/backups`, 14 days |
| GitHub | Deploy key for Actions; the values for the GitHub secrets are written to `/root/github-secrets.txt` |

It prints the staging website password once (or set `STAGING_PASSWORD=`). Variables: see the header of the script.

Then on the server:

```bash
nano /srv/audit/shared/web.env.local            # SMTP_PASS= password of site@bp-audit.com.ua (staging too, if it sends mail)
```

## 2. DNS for the new subdomains (old site keeps working)

cPanel → Domains → **Zone Editor** → Manage `bp-audit.com.ua` → add A records **cms**, **staging**, **cms-staging** → VPS IP.
Don't touch `MX`, `mail`, `webmail`, `autodiscover`, `TXT` (mail). Check: `nslookup cms.bp-audit.com.ua`.

```bash
certbot --nginx -d cms.bp-audit.com.ua -d staging.bp-audit.com.ua -d cms-staging.bp-audit.com.ua
```

## 3. GitHub

Settings → Environments → `production` and `staging` (details: [CI-CD.md](CI-CD.md#3-github-settings)):

| | production | staging |
| --- | --- | --- |
| Secrets `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS` | from `/root/github-secrets.txt` | same |
| Variable `APP_DIR` / `APP_NAME` | `/srv/audit` / `audit` | `/srv/audit-staging` / `audit-staging` |
| Variable `CMS_PORT` / `WEB_PORT` | `1337` / `3000` | `1338` / `3001` |
| Variable `SITE_URL` | `https://bp-audit.com.ua` | `https://staging.bp-audit.com.ua` |

Then `rm /root/github-secrets.txt` on the server. Production: enable **Required reviewers** and allow only `main`.

## 4. First deploy and admins

1. Actions → **CI / Deploy** → Run workflow → `staging`. The first run builds, seeds the content (uk + en) and writes
   `STRAPI_WEB_TOKEN` into `shared/web.env.local` itself.
2. **Right away** open `https://cms-staging.bp-audit.com.ua/admin` and register the first admin (until then anyone
   who finds the page could).
3. Same for production (`main`) → `https://cms.bp-audit.com.ua/admin`.
4. `sed -i 's/^SEED_ON_EMPTY=.*/SEED_ON_EMPTY=false/' /srv/audit*/shared/cms.env && pm2 restart audit-cms audit-staging-cms` (as `deploy`).
5. Invite the client's people: Settings → Users → Invite new user → role **Editor** (owner: a second Super Admin).
   Manual for them: the Claude Doc «Як користуватися адмінкою сайту».

## 5. Content from the old site (before switching the domain)

As `deploy`, while the old site is still online:

```bash
pm2 stop audit-cms
cd /srv/audit/current/cms && IMPORT_MEDIA=true NODE_ENV=production npm run start   # wait for "[import-media] N files imported", Ctrl+C
pm2 start audit-cms
```

Then upload what's missing in the admin (team photos, report PDFs marked «Файл ще не завантажено») and replace the
temporary logo (`web/src/components/BrandMark.tsx`) with the client's vector file.

Preview production before the switch: add `<IP> bp-audit.com.ua` to your `hosts` file, open http://bp-audit.com.ua, remove the line.

## 6. Launch day

1. cPanel → Backup: download `public_html` + the Joomla database (keep the old site on the hosting for 2–4 weeks).
2. Zone Editor: A `bp-audit.com.ua` and `www` → VPS IP. Wait until `nslookup` shows it (up to 4 h).
3. `certbot --nginx -d bp-audit.com.ua -d www.bp-audit.com.ua`
4. `pm2 restart audit-cms` (as `deploy`) — refreshes the site's page cache.
5. Checks: [DEPLOYMENT.md → Production checklist](DEPLOYMENT.md#production-checklist), `npm run check-mail -- you@example.com` in `/srv/audit/current/web`.
6. Google Search Console / Bing: verification codes → `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` in
   `shared/web.env.local`, redeploy, submit `https://bp-audit.com.ua/sitemap.xml`.

Rollback of the switch: put the old IP back in the two A records.

## Everyday

- Content: editors change it in the admin — no deploy.
- Code: push to `staging` → check → PR `staging → main` → production. A failed deploy keeps the previous version running.
- Logs: `pm2 logs audit-web`, `pm2 logs audit-cms`. Backups: `/srv/backups` (copy them off the server weekly:
  `scp deploy@<IP>:/srv/backups/* D:\backups\bp-audit\`).
- Restore a backup: see the header of `scripts/server/backup.sh`.
