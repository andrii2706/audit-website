# Architecture

```
 Browser ──► Next.js (web, :3000) ──REST──► Strapi (cms, :1337) ──► SQLite / Postgres / MySQL
                ▲   │ server action (create lead, API token)          │
                │   └──────────────────────────────────────────────────┤
                └──── POST /api/revalidate (x-revalidate-secret) ◄─────┘  after every content change
```

- **Strapi** owns all content and leads. Editors work only in the admin panel.
- **Next.js** prerenders every page for every locale at build time (SSG) and caches CMS responses with the tag `strapi` (fallback revalidation: 1 hour). When content changes, Strapi calls the revalidation endpoint and the cache expires immediately.
- The browser never talks to Strapi directly, except for media files (`/uploads/...`), which are served through `next/image`.

## Content model (Strapi)

All types except **Lead** are localized (i18n plugin). Shared, non-localized fields (phone, e-mail, EDRPOU, messenger links, client names/URLs…) are identical in every language.

| Type (UID)                     | Kind       | Purpose                                                       |
| ------------------------------ | ---------- | ------------------------------------------------------------- |
| `service-category`             | collection | Groups services: audit & assurance, consulting, legal & tax   |
| `service`                      | collection | Service page: excerpt, rich description, price/duration, deliverables, steps, tags, SEO; `featured` + `order` control the home bento |
| `audience`                     | collection | "Who we help" tabs, each with related services                |
| `team-member`                  | collection | Name, role, experience, credential, bio (full text on `/team`), photo |
| `faq`                          | collection | Question / answer, ordered                                    |
| `article`                      | collection | Blog / insights: cover, kind, reading time, rich body, SEO    |
| `news-item`                    | collection | Company news: date, tag, `pinned`, excerpt, cover, rich body, SEO. Shown on `/news`, on the home page and in RSS |
| `client-logo`                  | collection | Client name, optional logo and URL                            |
| `lead`                         | collection | Form submissions (not localized; `status` for the sales pipeline, `locale_code` = site language) |
| `vacancy`                      | collection | Career page openings: title, employment, duties / requirements / conditions (one item per line) |
| `transparency-report`          | collection | `/reports`: year, title, PDF, `isCorrection`, `publishedOn`, note. Corrected versions are extra entries; originals stay |
| `global`                       | single     | Site name, contacts (2 phones, e-mail, address, `mapQuery`/`mapUrl`, hours + note), registry data, socials, footer, default SEO |
| `homepage`                     | single     | Hero, deadline card, stats, reasons, industries, section titles, process steps, request block, CTA |
| `about-page`                   | single     | `/about`: intro, reasons, mission, values, principles, history, "clients come to us when…", register, quality system |
| `career-page`                  | single     | `/career`: intro, "working here", FAQ, empty-vacancies note (the quality system from `about-page` is shown here too) |

Shared components (`cms/src/components/shared`): `seo`, `stat`, `text-item`, `step`, `bullet`, `link`.

### Bootstrap (`cms/src/index.ts`, `cms/src/seed/index.ts`)

On every start, in this order (all steps are idempotent):

1. `ensureLocales` creates uk/en and sets `uk` as the default.
   Before seeding, `reseedIfRequested` (only with `RESEED_CONTENT=true`, i.e. `npm run reseed`) deletes all seeded types and any other locales.
2. `ensurePublicPermissions` lets the Public role `find`/`findOne` the content types. Leads are never readable publicly.
3. `ensureWebToken` creates the custom API token "web-site" with only `api::lead.lead.create`, and writes it to `.tmp/web-token.txt`.
4. `seedIfEmpty` runs only if there are no services and `SEED_ON_EMPTY` is not `false`. Data: `seed/structure.ts` (slugs, ordering, contacts) + `seed/content/{uk,en}.ts` (texts). It creates the Ukrainian documents, then adds each translation to the same document (`documents.update({ documentId, locale })`). Relations are linked per locale.

The `strapi.documents.use` middleware POSTs to `WEB_REVALIDATE_URL` after create/update/delete/publish/unpublish of any site type.

## Website (Next.js 16)

```
web/src/
├── proxy.ts                    Locale detection & redirect (cookie → Accept-Language → uk)
├── app/
│   ├── [locale]/layout.tsx     Root layout: <html lang>, header/footer, JSON-LD, motion
│   ├── [locale]/(home)/        Home page + its skeleton (route group, URL is /{locale})
│   ├── [locale]/services/…     (list)/ catalogue + [slug]/ detail (layout checks the slug → real 404; opengraph-image)
│   ├── [locale]/news/…         (list)/ news feed, [slug]/ news item, rss.xml/ RSS 2.0 feed per language
│   ├── [locale]/about|team|career|reports|audiences|blog|blog/[slug]|contacts
│   ├── [locale]/**/loading.tsx Per-route skeletons mirroring each page layout
│   ├── [locale]/not-found.tsx  Localized 404 ([...rest] catches unknown paths)
│   ├── actions.ts              submitLead server action
│   ├── api/revalidate/route.ts Cache invalidation webhook
│   └── sitemap.ts, robots.ts, manifest.ts, icon.svg, apple-icon.tsx
├── components/                 UI; ui.ts holds Tailwind class recipes
├── i18n/                       config.ts, dictionaries/*.json, format.ts (t, plural)
└── lib/                        strapi.ts (typed queries), seo.ts, og.tsx, format.ts
```

### Rendering and caching

- `generateStaticParams` prerenders all 6 locales × all routes, including every service and article slug (≈270 pages).
- `fetch(..., { next: { tags: ['strapi'], revalidate: 3600 } })` serves cached data. `revalidateTag('strapi', { expire: 0 })` drops the cache on a webhook.
- New slugs added after the build are rendered on first request (`dynamicParams = true` on detail routes).
- If Strapi is unreachable, queries return empty data instead of crashing. The page fills in on the next revalidation.

### Internationalization

- URLs: `/{locale}/…` for every page. `/` redirects (307) to the best locale: the `NEXT_LOCALE` cookie first, then `Accept-Language`, with `ru`/`be` mapped to `uk`, falling back to `uk`.
- UI strings come from `i18n/dictionaries/*.json` (same keys in every file). CMS content comes from Strapi with `?locale=`.
- The language switcher keeps the current path, sets the cookie and shows a spinner and the progress bar while navigating.
- Plurals use `Intl.PluralRules`, so Ukrainian and Polish get correct forms (1 день / 2 дні / 5 днів).

### SEO

- `buildMetadata()` sets the title template, description, `canonical`, `alternates.languages` for all locales plus `x-default`, Open Graph (with `og:locale` and `og:locale:alternate`) and a Twitter card.
- JSON-LD:
  - every page: Organization + AccountingService, WebSite;
  - home: FAQPage;
  - services: ItemList, Service, BreadcrumbList;
  - blog: Article.
- `sitemap.xml` lists every URL in every locale with hreflang alternates and `lastModified` from Strapi `updatedAt`. `robots.txt` points to it; `NO_INDEX=true` blocks crawling on staging.
- Open Graph images (1200×630) are generated per locale and per service with `next/og`. Fonts are bundled locally, so no network access is needed.
- Optional verification meta tags: `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`.
- Semantic HTML: one `h1` per page, breadcrumbs, `lang` on `<html>` and on language options.

### UI, responsiveness, motion

- Tailwind CSS v4: tokens in `globals.css` (`@theme`), recipes in `components/ui.ts`. All interactive elements use `cursor-pointer`.
- Breakpoints: `xs` 400, `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536, `3xl` 1800. Verified at 320–1920px with no horizontal overflow.
- Phones:
  - chip and tab rows become swipeable snap rows;
  - a fixed bottom action bar (call / Telegram / consultation);
  - a full-screen menu, rendered in a portal.
- Motion and loading:
  - CSS entrance for the hero;
  - scroll reveal with pure-CSS scroll-driven animations (`data-reveal`, `data-stagger`), with no JS and no hydration impact;
  - top progress bar on navigation;
  - a skeleton `loading.tsx` per route, plus image skeletons with fade-in (`FadeImage`);
  - a submit spinner, an animated success check and a shake on validation errors.

  Everything is off under `prefers-reduced-motion`, and content stays visible without JS.

### News

Editors publish news in Strapi under **Новина**. Pinned news is listed first, the rest are sorted by date. The site shows them in three places:

- `/{locale}/news`: the newest or pinned item as a wide card, the rest in a grid;
- a news-item page with `NewsArticle` JSON-LD and "more news" links;
- the home page "News" section (latest 3, hidden when nothing is published).

There is an RSS 2.0 feed per language at `/{locale}/news/rss.xml`, announced in `<head>`. The sitemap lists news URLs in all languages. Publishing or unpublishing triggers revalidation, so new items appear within seconds, and an unpublished item returns 404.

### Leads

1. A form posts to the `submitLead` server action. The client leaves a **phone or an e-mail** (one is required) and picks a reply channel (Telegram, Viber, WhatsApp, call or **e-mail**).
2. The action:
   - drops honeypot submissions;
   - validates name, phone and e-mail, returning localized field errors;
   - records the source page and locale;
   - creates the Lead in Strapi with the create-only API token.
3. In parallel, `lib/mail.ts` e-mails the lead over SMTP:
   - to the company (`LEAD_EMAIL_TO`, or the e-mail in Strapi Global), with Reply-To set to the client;
   - to the client, a confirmation in the page's language (when they left an e-mail; `LEAD_CONFIRMATION=false` turns it off).

   The request counts as delivered if it reached Strapi **or** the company mailbox, so a CMS outage doesn't lose leads.
4. It also sends an optional Telegram message (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
5. Editors process leads in Strapi (Content Manager → Lead, `status` field).

## Security notes

- The API token can only create leads. Even if leaked, it can't read data.
- The revalidation endpoint requires a shared secret.
- Secrets live only in `cms/.env` and `web/.env.local`, both git-ignored.
- JSON-LD is serialized with `<` escaped.
- Anonymous API requests can't read drafts: Strapi 5 normally allows `?status=draft`, so `cms/src/index.ts` strips it unless an Authorization header is present.
- Unknown URLs return a real HTTP 404 (slug checked before streaming), so search engines don't see soft 404s.
