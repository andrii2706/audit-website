# CLAUDE.md

Guidance for Claude Code (and any other coding agent) working in this repository.

## What this is

Marketing website for **Аудит Консультант / Audit Consultant**, an audit and accounting firm in Ukraine. Monorepo with two independent Node apps:

| Dir    | App                                  | Port | Role                                     |
| ------ | ------------------------------------ | ---- | ---------------------------------------- |
| `cms/` | Strapi 5 (TypeScript)                | 1337 | Headless CMS: content + leads, admin UI  |
| `web/` | Next.js 16 App Router, React 19, TS  | 3000 | Public site, reads Strapi REST API       |

Languages: **uk** (default), en, pl, fr, de, es. Every page lives under `/{locale}/…`.

Human-facing docs: `README.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/CONTENT-EDITING.md`, `docs/TROUBLESHOOTING.md`.

## Requirements

- **Node.js 22.19+** (`.nvmrc` = 22.22.0) or 24.x. Strapi's `undici@8` needs ≥ 22.19; odd versions (23, 25) have no `better-sqlite3` binaries. `cms/scripts/check-node.mjs` / `web/scripts/check-node.mjs` runs before dev/build and fails fast.
- npm (lockfiles are committed: use `npm ci` in CI).

## Commands

```bash
# One-time: generate cms/.env + web/.env.local with random secrets
node scripts/setup.mjs

# CMS
cd cms && npm install
npm run dev          # http://localhost:1337/admin (auto-seeds an empty DB in all 6 languages)
npm run build && npm run start

# Web
cd web && npm install      # STRAPI_WEB_TOKEN is filled by the CMS on first start (dev)
npm run dev          # http://localhost:3000
npm run typecheck && npm run lint
npm run build && npm start   # standalone server via scripts/start-standalone.mjs
```

Always run `npm run typecheck`, `npm run lint` and `npm run build` in `web/` after changes. The build needs Strapi running to prerender pages (without it, pages render empty and are revalidated later).

## Next.js 16 specifics — read before writing code

This is **Next.js 16**; APIs differ from older versions you may know. Bundled docs are in `web/node_modules/next/dist/docs/` — check them when unsure.

- `params` / `searchParams` are **Promises**: `const { locale } = await params;`
- Middleware is called **`proxy.ts`** (`web/src/proxy.ts`): redirects locale-less URLs using the `NEXT_LOCALE` cookie, then `Accept-Language`.
- `revalidateTag(tag, { expire: 0 })` takes a second argument.
- `app/[locale]/layout.tsx` is the **root layout**; the home page is `app/[locale]/(home)/page.tsx` (route group, URL unchanged) (renders `<html lang>`); there is no `app/layout.tsx`.
- `output: 'standalone'`; `agentRules: false` in `next.config.ts` stops Next from generating `AGENTS.md` — this file replaces it. Do not re-create AGENTS.md.

## Conventions

### Styling — Tailwind CSS v4
- Tokens live in `web/src/app/globals.css` under `@theme` (`bg-accent`, `text-muted`, `border-line`, `rounded-card`, breakpoints `xs` = 400px and `3xl`). No `tailwind.config.js`.
- Shared class recipes in `web/src/components/ui.ts` (`btn.*`, `chip`, `iconBtn`, `cardHover`, `container`, `field`…). Reuse them.
- **Every clickable element must have `cursor-pointer`** (links, buttons, summary, select, role=tab…). Base CSS also enforces it, but add the class explicitly in new components.
- Mobile-first. Check widths 320, 375, 768, 1024, 1280, 1920: no horizontal scroll, tap targets ≥ 44px.
- Don't combine `hidden sm:inline-flex` with a recipe that already sets `inline-flex` — use `max-sm:hidden` instead.
- Chip rows (quick services, category nav): `chipGrid` + `chipCell` from `ui.ts` — 2-column grid with wrapping labels on phones, flex-wrap from `sm`. Tabs (`AudienceTabs`) stay a swipeable `snap-x` row.
- Badges: always `badge.lime | badge.accent | badge.glass` from `ui.ts` (text 11px → 12px → 13px by breakpoint).
- Never stack two utilities for the same property on one element (`h-11` + `h-auto`, `whitespace-nowrap` + `whitespace-normal`): Tailwind v4 gives no ordering guarantee. Write a standalone recipe instead.
- Language switcher: custom dropdown of `<Link hrefLang>` items (desktop) and `LanguageChips` (mobile menu); no native `<select>` (its list can't be styled on Windows).
- `<html>` and `<body>` carry `suppressHydrationWarning` because browser extensions (Grammarly etc.) inject attributes there.
- Ancestors with `backdrop-filter`/`transform` trap `position: fixed` — render overlays through `createPortal(…, document.body)` (see `MobileMenu.tsx`).

### Motion & loading states
- **Curves:** use the tokens in `globals.css` (`--ease-out-expo` everywhere, `--ease-spring` for pops). Tailwind: `ease-(--ease-out-expo)`.
- **Tailwind v4 gotcha:** `translate-*`, `scale-*` and `rotate-*` set the CSS properties `translate` / `scale` / `rotate`, *not* `transform`. Transition those properties (`transition-[translate,box-shadow]`); `transition-transform` won't animate them.
- **Page transitions:** React `<ViewTransition>` in `app/[locale]/template.tsx` (class `page`). The header (`site-header`) and the mobile bar (`action-bar`) are named so they stay still. Skeletons hand over via `skeleton-out` (in `SkPage`).
- **Hero / page heads:** `animate-stagger` utility (children rise one after another; tune with `[--stagger-base:…]`, `[--stagger-step:…]`); `marker` utility for the highlighter under accent words.
- **Scroll reveal** is pure CSS (scroll-driven animations, `animation-timeline: view()`): add `data-reveal` (element) or `data-stagger` (each direct child). No JS and nothing to hydrate; browsers without support just show the content. Don't reintroduce JS that mutates attributes of server-rendered elements, because it causes hydration mismatches.
- **Hover:** `cardHover` adds `group`, so children use `group-hover:translate-x-1` (arrows) and `group-hover:scale-[1.04]` (images). Buttons lift, press (`active:scale`) and nudge their trailing icon.
- **Widgets:**
  - `AudienceTabs`: sliding pill, measured in a layout effect; until measured, the active tab keeps its own background;
  - `CountUp`: stats count from 0 on first view, but never identifiers like "№" and never with reduced motion;
  - FAQ: smooth `::details-content` height;
  - `ScrollHeader`: `data-scrolled`.
- Above-the-fold content never waits for JS. Everything is disabled under `prefers-reduced-motion`.
- **Route skeletons:** every route has a `loading.tsx` built from `components/Skeletons.tsx` that mirrors its real layout. When you add a route, add its `loading.tsx`.
- **Loading boundaries vs. 404s.** A `loading.tsx` makes the response stream, and a streamed response can't change its status to 404 any more. So:
  - list pages with skeletons live in route groups (`services/(list)/`, `news/(list)/`, `blog/(list)/`, `(home)/`), so their skeleton never wraps the detail pages;
  - every `[slug]/layout.tsx` checks `slugExists()` *before* the page's own skeleton starts streaming;
  - there is no `[locale]/loading.tsx`.

  Keep this structure: unknown URLs must return a real HTTP 404.
- **Images:** use `components/FadeImage.tsx` inside a container with the `skeleton` class (shimmer, then fade and settle from a slight zoom).
- **Loaders:** `Spinner.tsx`, `NavProgress.tsx` (top bar; dispatch `NAV_START_EVENT` for programmatic navigation). Pending buttons: `disabled` + `aria-busy` + spinner + text.

### i18n
- Config: `web/src/i18n/config.ts`. UI strings: `web/src/i18n/dictionaries/{locale}.json` — **all six files must have identical keys**; `uk.json` is the source of truth for the `Dictionary` type.
- Interpolation: `t('Hello {name}', { name })`; plurals: `plural(locale, n, forms)` (Intl.PluralRules).
- CMS content is localized in Strapi (i18n plugin); every data getter in `web/src/lib/strapi.ts` takes `locale`.
- Adding a language: add it to `locales` in both `web/src/i18n/config.ts` and `cms/src/seed/index.ts` (`LOCALES`), add a dictionary JSON, add seed translations in `cms/src/seed/translations/`.

### SEO
- Use `buildMetadata()` from `web/src/lib/seo.ts` in every `generateMetadata` (canonical, hreflang incl. `x-default`, OG, Twitter).
- JSON-LD helpers in `seo.ts`; render with `<JsonLd data={…} />`.
- Sitemap (`app/sitemap.ts`) lists every locale with alternates — add new routes there.
- OG images: `opengraph-image.tsx` + `lib/og.tsx` (fonts vendored in `web/src/assets/fonts`, no network).

### News
- Strapi type `api::news-item.news-item` ("Новина"): title, slug, date, tag, pinned, excerpt, cover, content, seo. Sorted pinned → date desc.
- Site: `/{locale}/news` (featured first card + grid), `/{locale}/news/[slug]` (NewsArticle JSON-LD), home `NewsSection` (latest 3, hidden when empty), RSS at `/{locale}/news/rss.xml` (linked via `alternates.types`), included in the sitemap.
- Seed: two **templates as drafts** (`cms/src/seed/news.ts`), created once — never invent published company news.

### Data / CMS
- Content types: `cms/src/api/*/content-types/*/schema.json`; shared components: `cms/src/components/shared`.
- Seed data (uk) in `cms/src/seed/data.ts`, translations in `cms/src/seed/translations/*.ts`. Seeding runs only on an empty DB (`SEED_ON_EMPTY`).
- Strapi writes trigger `POST /api/revalidate` on the web app (`cms/src/index.ts` → `web/src/app/api/revalidate/route.ts`), secured by `REVALIDATE_SECRET`.
- Leads: server action `web/src/app/actions.ts`. The client must give a phone **or** an e-mail. The lead goes to:
  - Strapi `Lead`, via the create-only API token;
  - e-mail via `lib/mail.ts` (nodemailer, SMTP env): a notification to the company (Reply-To = client) and a localized confirmation to the client;
  - optionally Telegram.

  It counts as delivered if Strapi **or** e-mail succeeded. The Public role can read content but never leads.
- Strapi drops `?status=draft` on anonymous API requests (`cms/src/index.ts`), so unpublished content never leaks.
- **Do not invent client facts** (registry numbers, prices, people, reviews). Unknown values stay as visible placeholders the client fills in Strapi.

## CI/CD

- `.github/workflows/deploy.yml`:
  - every PR runs lint + build + type-check;
  - a push to `staging` / `main` rsyncs the code to the VPS and runs `scripts/server-deploy.sh`.
- `scripts/server-deploy.sh` builds in `releases/<id>`, health-checks, rolls back on failure, and links secrets/data from `shared/`.
- What is uploaded is controlled by `.deployignore`. Setup: `docs/CI-CD.md`.
- The CMS must type-check **without** `cms/types/generated` (it isn't in git), so don't rely on generated Strapi types.

## GitHub Pages preview

`.github/workflows/pages-demo.yml` + `web/scripts/prepare-pages-demo.mjs` build a static export (`PAGES_DEMO=1`).

- Anything you add that needs a server (route handlers reading the request, server actions, cookies, ISR, dynamic OG images) must either work under `output: 'export'` or be removed or replaced in `prepare-pages-demo.mjs`.
- Raw `<a href>` to internal non-page URLs must prefix `process.env.NEXT_PUBLIC_BASE_PATH`. `<Link>` handles it automatically.

## Never commit

`cms/.env`, `web/.env.local`, `cms/.tmp/` (SQLite DB + `web-token.txt`), `cms/public/uploads/`, `node_modules/`, `.next/`, `cms/dist/`, `*.log`.

## Code style

- TypeScript strict, server components by default; `'use client'` only for interactivity.
- Comments and docs in **English**. User-facing text goes into dictionaries/CMS, never hard-coded.
- Accessibility: semantic HTML, labelled controls, WAI-ARIA tabs pattern, visible focus, `prefers-reduced-motion`.
