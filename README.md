# Audit Consultant — website

Multilingual marketing site for the audit firm **Аудит Консультант** (consulting.lviv.ua): services catalogue, audiences, team, blog, FAQ and lead forms. Content is managed in **Strapi 5**; the public site is **Next.js 16** with **Tailwind CSS v4**.

- 🌍 6 languages: Ukrainian (default), English, Polish, French, German, Spanish
- 🔎 SEO: canonical + hreflang, sitemap with alternates, robots, JSON-LD (Organization, Service, Article, FAQ, Breadcrumbs), per-page Open Graph images
- 📱 Responsive from 320px to 4K, native-feeling swipe tabs and a mobile action bar
- ✨ CSS scroll animations, navigation progress bar, per-page skeleton screens and image placeholders, animated form states (respecting reduced motion)
- ⚡ Static generation + on-demand revalidation: edits in the CMS appear on the site within seconds
- 📰 Company news: feed page, news pages, home section, RSS per language, NewsArticle markup
- 📨 Leads by phone **or** e-mail: stored in Strapi, e-mailed to the company (SMTP) with a localized confirmation to the client, optional Telegram

## Repository layout

```
.
├── cms/                  Strapi 5 (content types, seed data, admin)
│   ├── src/api/          Content types (service, article, team-member, lead…)
│   ├── src/components/   Shared components (seo, step, stat…)
│   ├── src/seed/         Starter content + translations (5 languages)
│   └── src/index.ts      Bootstrap: locales, permissions, API token, seeding, revalidation hook
├── web/                  Next.js 16 site
│   ├── src/app/[locale]/ Pages (home, services, audiences, about, team, blog, contacts)
│   ├── src/components/   UI (Tailwind)
│   ├── src/i18n/         Locale config + UI dictionaries
│   ├── src/lib/          Strapi client, SEO helpers, OG images
│   └── scripts/          Cross-platform standalone launcher
├── docs/                 Architecture, deployment, content editing, troubleshooting
├── ecosystem.config.cjs  PM2 config for both apps
└── CLAUDE.md             Guidance for AI coding agents
```

## Requirements

- **Node.js 22.19+** (recommended 22.22.0, see `.nvmrc`; 24.x also works). **Don't use Node 23/25**: `better-sqlite3` has no prebuilt binaries for odd versions and will try to compile with Visual Studio / build tools.
- npm 10+

```bash
nvm install 22.22.0 && nvm use 22.22.0   # nvm-windows: same commands, run the terminal as administrator
```

## Quick start (local development)

```bash
cd cms
npm install
npm run dev                     # http://localhost:1337/admin — create the first administrator
```

`npm run dev` first runs `cms/scripts/ensure-env.mjs`, which creates `cms/.env` (and `web/.env.local`) with random secrets if they are missing. It never overwrites real values. `node scripts/setup.mjs` from the repo root does the same explicitly.

On the first start with an empty database the CMS automatically:

- creates the locales uk (default), en, pl, fr, de, es;
- fills all content in all 6 languages;
- gives the Public role read access to content;
- creates the website API token, saves it to `cms/.tmp/web-token.txt` and writes it into `web/.env.local` (development only).

Then, in a second terminal:

```bash
cd web
npm install
npm run dev                     # http://localhost:3000 → redirects to your browser language
```

Manual alternative: copy `cms/.env.example` → `cms/.env` and `web/.env.example` → `web/.env.local`, replace every `tobemodified`, use the same `REVALIDATE_SECRET` in both, and paste `cms/.tmp/web-token.txt` into `STRAPI_WEB_TOKEN`.

## Scripts

| Where | Command             | What it does                                      |
| ----- | ------------------- | ------------------------------------------------- |
| cms   | `npm run dev`       | Strapi with admin auto-reload                     |
| cms   | `npm run build`     | Build the admin panel                             |
| cms   | `npm run start`     | Production Strapi                                 |
| web   | `npm run dev`       | Next.js dev server                                |
| web   | `npm run build`     | Production build (Strapi must be reachable)       |
| web   | `npm start`         | Run the standalone build (loads `.env.local`)     |
| web   | `npm run typecheck` | TypeScript check                                  |
| web   | `npm run lint`      | ESLint                                            |

## Environment variables

**`cms/.env`**: `HOST`, `PORT`, `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`, `DATABASE_*`, `WEB_REVALIDATE_URL`, `REVALIDATE_SECRET`, `SEED_ON_EMPTY`.

**`web/.env.local`**: `STRAPI_URL`, `STRAPI_WEB_TOKEN`, `REVALIDATE_SECRET`, `SITE_URL`, optional `SMTP_*` / `MAIL_FROM` / `LEAD_EMAIL_TO` / `LEAD_CONFIRMATION` (lead e-mails), `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, `NO_INDEX`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

All variables are described in the `.env.example` files.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): content model, i18n, rendering and caching, SEO, leads
- [CI/CD](docs/CI-CD.md): GitHub Actions checks every PR and deploys `staging` / `main` to a VPS with automatic rollback
- [Deployment](docs/DEPLOYMENT.md): VPS with PM2 + Nginx, Docker, Postgres, shared hosting, Vercel, checklist
- [Content editing](docs/CONTENT-EDITING.md): guide for editors working in the Strapi admin
- [Troubleshooting](docs/TROUBLESHOOTING.md): common install and runtime errors

## Placeholders to fill before launch

Some facts were not available and are placeholders in the CMS. Fill them in the admin under **Global** and **Homepage**:

- registry number, EDRPOU, address;
- Google rating and review count;
- team photos;
- deadline date;
- client logos.

Nothing has been invented on the client's behalf.
