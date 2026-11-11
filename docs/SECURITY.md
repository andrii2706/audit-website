# Security

What protects the site, the CMS, the data and the server — and where each measure lives in the code.
Checked on 2026-11-09 (production build + CMS + nginx config from `scripts/server`, unit/component/e2e tests).

## Overview

| Layer | Threat | Measure | Where |
| --- | --- | --- | --- |
| Browser | XSS, injected scripts, data exfiltration | Content-Security-Policy: code/styles/fonts/data only from the site, images also from the CMS, frames only Google Maps, `object-src 'none'`, `base-uri`/`form-action 'self'` | `web/next.config.ts` (`CSP`) |
| Browser | Clickjacking, embedding the site elsewhere | `frame-ancestors 'none'` + `X-Frame-Options: DENY` (site and CMS) | `web/next.config.ts`, `cms/config/middlewares.ts` |
| Browser | Downgrade to http, cookie theft | HSTS 1 year (only when the site URL is https), `upgrade-insecure-requests` | `web/next.config.ts`, `cms/config/middlewares.ts` |
| Browser | MIME sniffing, referrer leaks, unwanted APIs | `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, mic, geolocation, payment, usb, FLoC/Topics off), `Cross-Origin-Opener-Policy: same-origin` | `web/next.config.ts` |
| Lead form | Spam bots | Hidden honeypot field + minimum fill time 2.5 s → bots get a silent "ok", nothing is stored or sent | `web/src/lib/lead.ts`, `LeadForm.tsx` |
| Lead form | Flooding the CMS / mailbox | 5 leads per IP per 10 min, 200 per hour in total (app) + 10 POST/min per IP (nginx) | `web/src/lib/rate-limit.ts`, `scripts/server/nginx/bp-audit-http.conf` |
| Lead form | Header/log injection, oversized input | Control and bidi characters stripped, one-line fields, strict length limits, phone/e-mail validation | `web/src/lib/lead.ts` |
| Lead form | CSRF | Next.js server actions reject calls whose `Origin` is not the site | Next.js (built in) |
| Website ↔ CMS | Forged cache refresh | `/api/revalidate` needs `REVALIDATE_SECRET` (constant-time compare) and is blocked in nginx — only reachable from the server itself | `web/src/app/api/revalidate/route.ts`, `web/src/lib/secret.ts`, nginx template |
| CMS API | Downloading the whole site as JSON | Content API **closed to anonymous requests** (Public role has no read permissions, removed on every start; `PUBLIC_CONTENT_API=true` reopens) and to the internet (`location /api/ { return 403; }` in nginx). The site reads it server-side with its token | `cms/src/seed/index.ts` (`ensurePublicPermissions`), nginx template, `web/src/lib/strapi.ts` |
| CMS API | Reading leads / personal data | No public role or token can read leads; lead permissions are removed from Public/Authenticated on every start | `ensureSecurityBaseline` |
| CMS API | Misuse of the website token | Token «web-site» may only read published site content and **create** leads (no read/update/delete of leads); extra rights are reset on every start; stored only in `web.env.local` | `cms/src/seed/index.ts` (`ensureWebToken`) |
| CMS API | Leaking drafts | Anonymous `?status=draft` is dropped, so unpublished content is never served | `cms/src/index.ts` |
| CMS API | Fake visitor accounts | Public sign-up (`/api/auth/local/register`) disabled on every start | `ensureSecurityBaseline` |
| CMS API | Calls from other websites | CORS allow-list: the site and the CMS only (`SITE_URL`, `PUBLIC_URL`, or `CORS_ORIGINS`) | `cms/config/middlewares.ts` |
| CMS API | Big uploads / bodies | JSON/forms ≤ 1 MB, uploads ≤ 50 MB (nginx: site 2 MB, CMS 50 MB) | `cms/config/middlewares.ts`, nginx template |
| CMS uploads | Malicious files | SVG and executables refused; only images, video, audio, PDF, Office, text | `cms/config/plugins.ts` |
| CMS uploads | Hotlinking (other sites using the files) | nginx `valid_referers` on `/uploads/` (search engines allowed) | nginx template |
| CMS admin | Password guessing | Strapi: 5 attempts / 5 min per account + IP; nginx: 10/min per IP; fail2ban blocks repeat offenders for 1 h | `cms/config/admin.ts`, nginx template, `fail2ban-jail.local` |
| CMS admin | Over-privileged editors | Roles: Super Admin (owner), **Editor** for staff (content + leads, no settings/users) | `ensureEditorPermissions` |
| CMS admin | Information leaks | No `X-Powered-By: Strapi`; no NPS/promo pop-ups | `cms/config/middlewares.ts`, `cms/config/admin.ts` |
| Content | Casual copying | Selection/copy/right-click/print/save/shortcut blocking (switchable in the CMS); when copying is allowed, long fragments get «Джерело: <URL>» | `web/src/lib/protection.ts`, `ContentProtection.tsx`, `globals.css` |
| Content | AI crawlers and scraping tools | **Hard 403** for AI crawlers, scraping libraries/site downloaders/headless browsers and empty User-Agents (search engines and link previews allowed; HEAD and local requests allowed); follows «Без ботів ШІ»; `robots.txt` (38 AI crawlers), `noai`, `tdm-reservation` header + `/.well-known/tdmrep.json` | `web/src/lib/bots.ts`, `web/src/proxy.ts`, `robots.ts`, `public/.well-known/tdmrep.json` |
| Content | Bulk download of all pages | nginx: 5 page requests/s per IP after a burst of 120 → 429 (static JS/CSS unlimited) | `bp-audit-http.conf` (`bp_site_get`), nginx template |
| Content | Reuse of certificate / letter scans | Shown only as watermarked copies («bp-audit.com.ua» across the image, ≤ 1600 px, metadata stripped) from `/api/document/{id}`; originals' URLs never appear in the HTML; switchable («Водяний знак на документах») | `web/src/lib/watermark.ts`, `src/app/api/document/[id]/route.ts` |
| Content | Embedding our images elsewhere | Hotlink protection on CMS `/uploads/` and the site's `/_next/image` | nginx template |
| Content | Scripts planted through rich text | Links in CMS texts allow only http(s)/mailto/tel/relative (no `javascript:`/`data:`), text is never rendered as HTML | `web/src/components/Blocks.tsx` (`safeHref`) |
| Secrets | Leaks via git / deploys | `.env` files, database and uploads are never committed or uploaded (`.gitignore`, `.deployignore`); on the server they live in `shared/` with `chmod 600`; GitHub keeps only the SSH key | `.gitignore`, `.deployignore`, `scripts/server/setup.sh` |
| Server | Open ports | ufw: only SSH, 80, 443. Strapi and Next listen on 127.0.0.1 only | `setup.sh`, `cms.env` (`HOST=127.0.0.1`), `server-deploy.sh` |
| Server | SSH brute force | Keys only, no passwords, root only with a key, `MaxAuthTries 4`, fail2ban | `setup.sh` |
| Server | Unpatched OS | `unattended-upgrades` installs security updates daily | `setup.sh` |
| Server | Version disclosure, slow clients | `server_tokens off`, body/header timeouts | `bp-audit-http.conf` |
| Server | Dotfiles | nginx denies `/.*` except `/.well-known/` | nginx template |
| Data | Loss | Nightly SQLite snapshot + uploads archive, 14 days; copy off-server weekly | `scripts/server/backup.sh` |
| Deploys | Broken release taking the site down | Health checks + automatic rollback; production deploys can require your approval in GitHub | `scripts/server-deploy.sh`, GitHub environment |

## Verified

- Production build: no CSP violations on 9 page types, Google Maps embed and the lead form work.
- `GET /api/leads` without a token → 403; with the website token → 403; `POST /api/leads` without a token → 403.
- `POST /api/auth/local/register` → "Register action is currently disabled"; `/api/users` → 403; drafts not returned.
- 6th lead from one address within 10 minutes → "Too many requests" message; 6th wrong admin password → 429.
- nginx: `/api/revalidate` and `/.env` → 403, `/.well-known/` → 200, admin login → 429 after the burst, site POSTs →
  429 after 11, hotlinked upload → 403, `Server: nginx` without a version.
- Closed API: `GET /api/services|global|news-items` anonymously → 403 (directly and through nginx); with the website token → 200; `GET /api/leads` with the token → 403.
- Through nginx with an outside client address: GPTBot, ClaudeBot, python-requests, wget, curl, empty User-Agent → 403; Chrome, Googlebot, TelegramBot → 200; `curl -I` → 200. 200 page requests in a row → 122 × 200, then 429.
- Certificates: the About page links only to `/api/document/{id}` (watermarked JPEG); the original upload URL is absent from the HTML; `/_next/image` with a foreign Referer → 403.
- Tests: web 168 unit/component tests (98 % lines), CMS 48, Playwright e2e 79 (desktop + phone) incl. headers, bots, closed API, protection, form.
- `npm audit --omit=dev`: website 0 vulnerabilities. CMS: Strapi 5.61.0 with `nodemailer` and `zod` 4.x pinned to
  fixed versions — no critical; the remaining "high" entries are `zod` 3.x inside `koa-body`/`koa-session`, which only
  validate their own options at start-up (not visitor input). Re-check after each Strapi update.

## Operating rules

- Change the cPanel/FTP password (it was sent by e-mail in plain text). Never put it in the repository, docs or CI.
- Create the first Strapi admin right after the first deploy (until then the registration page is open).
- Give staff the **Editor** role; keep Super Admin for the owner and the developer. Remove people who leave.
- Use long unique passwords (a password manager); Strapi has no 2FA in the Community edition.
- Keep `REVALIDATE_SECRET`, `APP_KEYS` and the other secrets only in `shared/*.env`; rotating `APP_KEYS`/JWT secrets logs everyone out.
- Update regularly: `npm outdated` in `cms/` and `web/`, test on staging, then production.
- Don't set `PUBLIC_CONTENT_API=true` or point `STRAPI_URL` at the public CMS address: the site must read the CMS on 127.0.0.1 with its token.
- What a browser displays can always be photographed or retyped; the measures above stop tools and bots and make copies traceable. For a found copy, the watermark, the «Джерело» line and the dated publication in the CMS are the evidence.
- Leads contain personal data (name, phone, e-mail): delete old ones in the admin when they are no longer needed.
