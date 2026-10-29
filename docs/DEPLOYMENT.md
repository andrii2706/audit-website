# Deployment

> **Automatic deploys:** once a VPS is prepared as in Option A, `.github/workflows/deploy.yml` deploys every push to `staging` / `main`. See [CI-CD.md](CI-CD.md).

The project is two Node.js processes: **Strapi** (`cms`, port 1337) and **Next.js** (`web`, port 3000). Both need **Node.js 22.19+** (recommended 22.22.0) or 24.x; odd versions don't work.

Typical production layout:

```
https://consulting.lviv.ua       → Nginx → Next.js :3000
https://cms.consulting.lviv.ua   → Nginx → Strapi  :1337   (admin + /uploads)
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

Also set `PUBLIC_URL=https://cms.consulting.lviv.ua` so admin and media links use the public https address (proxy mode turns on automatically).

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
SITE_URL=https://consulting.lviv.ua
STRAPI_WEB_TOKEN=<from cms/.tmp/web-token.txt>
REVALIDATE_SECRET=<same as cms>
```

> Media URLs: if images are uploaded, `STRAPI_URL` must also be reachable by the optimizer at that host. For a separate public CMS domain, set `STRAPI_URL=https://cms.consulting.lviv.ua` (it is added to `images.remotePatterns` at build time).

```bash
npm run build                  # Strapi must be running: pages are prerendered from it
pm2 start npm --name audit-web -- start
pm2 save && pm2 startup
```

Alternatively, after building both apps run `pm2 start ecosystem.config.cjs` from the repo root.

### 4. Nginx + HTTPS

```nginx
server {
  server_name consulting.lviv.ua www.consulting.lviv.ua;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
server {
  server_name cms.consulting.lviv.ua;
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
sudo certbot --nginx -d consulting.lviv.ua -d www.consulting.lviv.ua -d cms.consulting.lviv.ua
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

## Option C — The client's existing hosting

- **Shared hosting with Node.js support** (cPanel "Setup Node.js App", Plesk): deploy `web` as a Node app with startup file `scripts/start-standalone.mjs`, after building locally or in CI and uploading `web/.next`, `public`, `scripts` and `package.json`. Strapi needs a persistent Node process and ≥1 GB RAM. If the plan can't run it, host the CMS on a small VPS or Strapi Cloud and keep only the site on the shared hosting.
- **PHP-only hosting** can't run either app. Keep the domain there and point DNS to a VPS, Vercel or Strapi Cloud.

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
- [ ] Placeholders filled in the admin (registry data, rating, photos, logos)
- [ ] Google Search Console and Bing Webmaster verified (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`), `https://<site>/sitemap.xml` submitted
- [ ] Staging environments use `NO_INDEX=true`
- [ ] E-mail for leads: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` in `web/.env.local`. Set SPF/DKIM for the sender domain so mail doesn't land in spam, then send a test request.
- [ ] Optional: Telegram lead notifications (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)
- [ ] Test a lead submission on production and confirm it appears in Strapi → Lead
