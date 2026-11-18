# Breadcrumbs: one config for the whole site

Install: unzip into the project root (the folder that CONTAINS `web/`), allow overwriting, restart `npm run dev`.
Install the form zip (concept-form-full.zip) first — the request, contacts and service pages here already include it.
Nothing to paste, no dictionary changes.

## How it works now
- `web/src/lib/breadcrumbs.ts` — the config. `SECTIONS` lists every section with its path and label (labels come
  from `dict.nav`, so crumbs always match the menu in uk/en). Add a new page there and nowhere else.
- A page says only where it is:
      <PageHead crumbs={trail(dict, 'team')} … />                                       Головна / Команда
      trail(dict, 'services', { name: category, path: '/services#slug' }, { name: s.title, path: `/services/${slug}` })
                                                                     Головна / Послуги / Аудиторські послуги / Обов’язковий аудит
      trail(dict, 'blog', { name: a.title, path: `/blog/${a.slug}` })                    Головна / Блог / <стаття>
- `components/concept/Breadcrumbs.tsx` (used by PageHead) renders the visible trail AND the Google BreadcrumbList
  JSON-LD from the same data — the separate `breadcrumbLd(...)` block on each page is gone, so they can't differ.

## What's better
- The current page is now the last crumb (no more "Головна /" with a hanging slash), marked aria-current.
- Phones: one line, Головна / section / current page; a long title is cut with "…"; a category crumb is hidden.
- JSON-LD has absolute URLs and skips in-page "#category" crumbs (Google wants real pages).
- Styles in `breadcrumbs.css` next to the component; concept.css isn't touched.

## Files
New: lib/breadcrumbs.ts, concept/Breadcrumbs.tsx, concept/breadcrumbs.css, tests/breadcrumbs.test.tsx, e2e/breadcrumbs.spec.ts
Changed: concept/parts.tsx (PageHead: `crumbs` instead of `homeLabel`), concept/ArticleView.tsx (`trail` instead of
`section`), and the pages: about, audiences, blog list + article, career, contacts, news list + item, reports,
request, services list + service, team.
Not touched: your SiteHeader, MobileMenu, language button, concept.css, layout, home page.

Checked: typecheck, lint, 195 unit tests (breadcrumbs.ts 100% covered), production build, 91 e2e (desktop + phone),
including "visible crumbs = JSON-LD" on section pages, a service and a blog article.
