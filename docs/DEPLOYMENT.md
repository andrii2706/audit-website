# Deployment

> **Automatic deploys:** once a VPS is prepared as in Option A, `.github/workflows/deploy.yml` deploys every push to `staging` / `main`. See [CI-CD.md](CI-CD.md).

The project is two Node.js processes: **Strapi** (`cms`, port 1337) and **Next.js** (`web`, port 3000). Both need **Node.js 22.19+** (recommended 22.22.0) or 24.x; odd versions don't work.

Typical production layout:

```
https://bp-audit.com.ua       → Nginx → Next.js :3000
https://cms.bp-audit.com.ua   → Nginx → Strapi  :1337   (admin + /uploads)
```

## Option A — VPS (Ubuntu) with PM2 and Nginx (recommended)

### 1. Server prerequisites

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx build-essential
sudo npm i -g pm2
```

For production, use PostgreSQL instead of SQLite (optional but recommended):

```bash
sudo apt-get install -y postgresql
sudo -u postgres psql -c "CREATE USER audit WITH PASSWORD 'change-me';"
sudo -u postgres psql -c "CREATE DATABASE audit OWNER audit;"
```

### 2. Code and CMS

```bash
git clone <repo> /srv/audit && cd /srv/audit/cms
npm ci
cp .env.example .env
```

Edit `cms/.env`:

```ini
HOST=127.0.0.1
PORT=1337
APP_KEYS=<4 random base64 strings, comma-separated>
API_TOKEN_SALT=<random>
ADMIN_JWT_SECRET=<random>
TRANSFER_TOKEN_SALT=<random>
JWT_SECRET=<random>
ENCRYPTION_KEY=<random>
WEB_REVALIDATE_URL=http://127.0.0.1:3000/api/revalidate
REVALIDATE_SECRET=<random, same as web>
SEED_ON_EMPTY=true             # set to false after the first start
DATABASE_CLIENT=postgres
DATABASE_URL=postgres://audit:change-me@127.0.0.1:5432/audit
```

Generate random values with:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

Also set `PUBLIC_URL=https://cms.bp-audit.com.ua` so admin and media links use the public https address (proxy mode turns on automatically).

```bash
NODE_ENV=production npm run build
pm2 start npm --name audit-cms -- run start
cat .tmp/web-token.txt          # API token for the website (created on first start)
```

Open `https://cms.…/admin`, create the administrator, then set `SEED_ON_EMPTY=false`.

### 3. Website

```bash
cd /srv/audit/web
npm ci
cp .env.example .env.local
```

Edit `web/.env.local`:

```ini
STRAPI_URL=http://127.0.0.1:1337       # internal URL is fine for data…
SITE_URL=https://bp-audit.com.ua
STRAPI_WEB_TOKEN=<from cms/.tmp/web-token.txt>
REVALIDATE_SECRET=<same as cms>
```

> Media URLs: if images are uploaded, `STRAPI_URL` must also be reachable by the optimizer at that host. For a separate public CMS domain, set `STRAPI_URL=https://cms.bp-audit.com.ua` (it is added to `images.remotePatterns` at build time).

```bash
npm run build                  # Strapi must be running: pages are prerendered from it
pm2 start npm --name audit-web -- start
pm2 save && pm2 startup
```

Alternatively, after building both apps run `pm2 start ecosystem.config.cjs` from the repo root.

### 4. Nginx + HTTPS

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

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bp-audit.com.ua -d www.bp-audit.com.ua -d cms.bp-audit.com.ua
```

### 5. Updating

```bash
cd /srv/audit && git pull
(cd cms && npm ci && NODE_ENV=production npm run build && pm2 restart audit-cms)
(cd web && npm ci && npm run build && pm2 restart audit-web)
```

Content changes do **not** need a redeploy. Strapi triggers revalidation automatically.

## Option B — Docker

Example `docker-compose.yml` (adjust secrets):

```yaml
services:
  db:
    image: postgres:16
    environment: { POSTGRES_USER: audit, POSTGRES_PASSWORD: change-me, POSTGRES_DB: audit }
    volumes: [db:/var/lib/postgresql/data]
  cms:
    image: node:22-alpine
    working_dir: /app
    command: sh -c "npm ci && npm run build && npm run start"
    env_file: cms/.env
    environment: { DATABASE_CLIENT: postgres, DATABASE_URL: postgres://audit:change-me@db:5432/audit, HOST: 0.0.0.0, WEB_REVALIDATE_URL: http://web:3000/api/revalidate }
    volumes: [./cms:/app, uploads:/app/public/uploads]
    ports: ["1337:1337"]
    depends_on: [db]
  web:
    image: node:22-alpine
    working_dir: /app
    command: sh -c "npm ci && npm run build && npm start"
    env_file: web/.env.local
    environment: { STRAPI_URL: http://cms:1337 }
    volumes: [./web:/app]
    ports: ["3000:3000"]
    depends_on: [cms]
volumes: { db: {}, uploads: {} }
```

For real production, build images with multi-stage Dockerfiles. Copy `web/.next/standalone`, `.next/static` and `public` into the runtime image.

## Option C — The client's existing hosting (UAhosting, cPanel)

bp-audit.com.ua is registered at **UAhosting** (shared hosting with cPanel, DNS `ns5.uahosting-dns.net` / `ns6.uahosting-dns.net`, mail server `mail.bp-audit.com.ua`). The old Joomla site lives in `public_html`.

Shared PHP hosting cannot keep two Node processes (Next.js + Strapi) running, so the recommended setup is:

1. **Apps on a small VPS** (Option A — 2 GB RAM is enough for both).
2. **Domain and e-mail stay at UAhosting.** In cPanel → *Zone Editor* change only these records to the VPS IP:

   | Type | Name | Value |
   | ---- | ---- | ----- |
   | A | `bp-audit.com.ua.` | VPS IP |
   | A | `www.bp-audit.com.ua.` | VPS IP (or CNAME to `bp-audit.com.ua.`) |
   | A | `cms.bp-audit.com.ua.` | VPS IP |

   Do **not** touch `MX`, `mail`, `webmail` or the SPF `TXT` record: the mailboxes keep working at UAhosting.
3. **Lead e-mails through the hosting's mailbox.** In cPanel → *Email Accounts* create e.g. `site@bp-audit.com.ua`, then in `web/.env.local` on the VPS:

   ```env
   SMTP_HOST=mail.bp-audit.com.ua
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=site@bp-audit.com.ua
   SMTP_PASS=<mailbox password>
   MAIL_FROM="Бізнес Партнери <site@bp-audit.com.ua>"
   LEAD_EMAIL_TO=businesspartners@ukr.net
   ```

   Add `include` of the VPS IP to the SPF record only if you send from the VPS with another server; with the hosting's SMTP nothing changes.
4. **Content from the old site.** Before switching DNS, run `npm run import-media` in `cms/` on any machine with internet access while the old site is still online: it downloads client logos, certificates, recommendation letters and the 2025 transparency report into Strapi. Then upload the remaining report PDFs in Strapi (they are listed on `/reports` as «Файл ще не завантажено»).
5. **Old URLs keep working.** `web/legacy-redirects.ts` sends the Joomla addresses (`/about`, `/service/...`, `/zvity/zvit-pro-prozorist`, `/news/123-...`, `/contact-us`, `/en/...`, `/index.php`) to the new pages with permanent redirects — nothing to configure.
6. Switch DNS (TTL is usually 1–4 h), get certificates on the VPS (`certbot --nginx -d bp-audit.com.ua -d www.bp-audit.com.ua -d cms.bp-audit.com.ua`) and keep the old `public_html` as a backup for a few weeks.

If UAhosting confirms that the plan has **"Setup Node.js App"** (CloudLinux), the website alone can run there: build in CI, upload `web/.next/standalone` with startup file `server.js` (or `scripts/start-standalone.mjs`), and keep Strapi on a VPS or Strapi Cloud — it needs a persistent process, native `better-sqlite3`/`sharp` binaries and ≥1 GB RAM. A PHP-only plan can't run either app.

> Security: the cPanel/FTP password was sent in plain text by e-mail — change it in the UAhosting billing panel and never put it into the repository or CI secrets. Deployment uses SSH keys to the VPS only.

## Option D — Vercel (web) + Strapi Cloud / VPS (cms)

1. Import the repo into Vercel with **Root Directory** `web`. Set the env vars from `web/.env.example`. `output: 'standalone'` is ignored by Vercel, which is fine.
2. Point `WEB_REVALIDATE_URL` in the CMS to `https://<site>/api/revalidate`.
3. Strapi Cloud: connect the repo with root `cms`. Use its managed Postgres; uploads go to its media storage.

## Production checklist

- [ ] Node 22.19+ (22.22.0) on the server
- [ ] All `tobemodified` secrets replaced; `REVALIDATE_SECRET` is identical in both apps
- [ ] `SITE_URL` is the real https domain (canonical, sitemap and OG depend on it)
- [ ] `SEED_ON_EMPTY=false` after the first launch
- [ ] Postgres (or regular SQLite backups of `cms/.tmp/data.db`) and backups of `cms/public/uploads`
- [ ] HTTPS on both domains
- [ ] `npm run import-media` done while the old site is online; remaining report PDFs uploaded; team photos added
- [ ] Old-site redirects checked: `curl -I https://bp-audit.com.ua/contact-us` → 308 to `/uk/contacts`
- [ ] Google Search Console and Bing Webmaster verified (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`), `https://<site>/sitemap.xml` submitted
- [ ] Staging environments use `NO_INDEX=true`
- [ ] E-mail for leads: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` in `web/.env.local`. Set SPF/DKIM for the sender domain so mail doesn't land in spam, then send a test request.
- [ ] Optional: Telegram lead notifications (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)
- [ ] Test a lead submission on production and confirm it appears in Strapi → Lead
