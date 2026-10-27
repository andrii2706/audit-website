# Content editing guide (Strapi admin)

Admin panel: `https://cms.<domain>/admin` (locally http://localhost:1337/admin). The interface language is set per user under **Profile → Interface language** (Ukrainian or English).

## Languages

Every piece of content exists in 6 languages: **uk** (main), en, pl, fr, de, es.

- Use the **locale switcher** at the top right of an entry to choose the language you're editing.
- Fields with a 🌐 icon are translated per language. Other fields (phone, e-mail, links, logos) are shared and change everywhere at once.
- To add a new service, create it in Ukrainian first, then switch the locale and fill each translation. A language without a translation won't show the item on that language's site.
- **Slug** (the URL part) can differ per language, but keep it lowercase Latin with hyphens.

## Publishing

Entries have **Draft** and **Published** states. Only published content appears on the site. After you click **Publish** (or **Save** on a published entry), the site updates within a few seconds. No developer is needed.

## Where things are

| On the site                          | In the admin (Content Manager)                    |
| ------------------------------------ | ------------------------------------------------- |
| Phone, e-mail, address, messengers, footer, default SEO | **Global** (single type)          |
| Home hero, deadline card, stats, "why us", section titles, process, estimate block | **Homepage** (single type) |
| Services list and pages              | **Service** (+ **Service category**)              |
| Large tiles on the home page         | Service → `featured` = true, sorted by `order`    |
| "Who we help" tabs                   | **Audience** (pick related services)              |
| Team                                 | **Team member**                                   |
| FAQ                                  | **FAQ** (sorted by `order`)                       |
| Company news                         | **Новина** (News): date, tag, «pinned», cover, text |
| Blog / insights                      | **Article**                                       |
| "Trusted by" logos                   | **Client logo**                                   |
| Form submissions                     | **Lead**: change `status` as you process them      |

## Publishing news

1. **Content Manager → Новина → Create new entry** (or open one of the two `[Шаблон]` templates: they are drafts with instructions).
2. Fill in:
   - **Title** and a short **excerpt** of 1–2 sentences, shown in lists, search results and RSS;
   - **date**;
   - optionally a **tag** (e.g. "Законодавство") and a **cover** image;
   - the **content**.
3. **Pinned** keeps an important item at the top of the news page.
4. Switch the locale (top right) and translate. Each language is published separately.
5. Click **Publish**. The news appears on `/news`, on the home page and in the RSS feed within seconds. **Unpublish** removes it just as quickly.

Delete the two templates once you have your own news. They won't come back.

## Requests by e-mail

Every request from a site form arrives in **Lead** and, when SMTP is configured, also by e-mail to the address in **Global → e-mail** (or `LEAD_EMAIL_TO`). Click **Reply** in your mail client to answer the client directly. Clients who leave an e-mail get an automatic confirmation in their language.

## SEO fields

Services, articles and Global have an **SEO** component:

- **Meta title**: up to about 60 characters. If empty, the page title is used.
- **Meta description**: 140–160 characters. If empty, the excerpt is used.

Preview images for social networks are generated automatically from the title. Write unique titles and descriptions for every language.

## Images

- Upload through **Media Library**. Use JPG/WebP for photos and PNG/SVG for logos.
- Upload originals at least 1600px wide. The site resizes them automatically.
- Always fill **Alternative text** (describe the image). It matters for accessibility and search.

## Rich text

Service descriptions and articles use the block editor. Use **Heading 2/3** for structure, not bold text. Keep paragraphs short. Links should have meaningful text, not "click here".

## Don'ts

- Don't delete a locale or rename slugs of popular pages without telling the developer. Old links would break.
- Don't put phone numbers or prices into images. Search engines can't read them.
- Don't publish invented reviews, ratings or certificates.
