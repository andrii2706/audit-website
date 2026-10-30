# Content editing guide (Strapi admin)

Admin panel: `https://cms.<domain>/admin` (locally http://localhost:1337/admin). The interface language is set per user under **Profile → Interface language** (Ukrainian or English).

## Languages

Every piece of content exists in 2 languages: **uk** (main) and **en**.

- Use the **locale switcher** at the top right of an entry to choose the language you're editing.
- Fields with a 🌐 icon are translated per language. Other fields (phone, e-mail, links, logos) are shared and change everywhere at once.
- To add a new service, create it in Ukrainian first, then switch the locale and fill each translation. A language without a translation won't show the item on that language's site.
- **Slug** (the URL part) can differ per language, but keep it lowercase Latin with hyphens.

## Publishing

Entries have **Draft** and **Published** states. Only published content appears on the site. After you click **Publish** (or **Save** on a published entry), the site updates within a few seconds. No developer is needed.

## Where things are

| On the site                          | In the admin (Content Manager)                    |
| ------------------------------------ | ------------------------------------------------- |
| Phones (2), e-mail, address, map link, working hours, messengers, footer, default SEO | **Налаштування сайту** (Global) |
| Home hero, deadline card, stats, "why us", industries, section titles, process, request form block | **Головна сторінка** (Homepage) |
| About page: intro, reasons, mission, values, principles, history, register, quality system | **Сторінка «Про компанію»** |
| Career page: intro, "working here", FAQ, empty-vacancies note | **Сторінка «Кар'єра»** (+ **Вакансія** for each opening) |
| Certificates and recommendation letters (About page) | **Документ (сертифікат / рекомендація)**: title, kind, image. Shown only when an image is uploaded |
| Client logos (home «Нам довіряють») | **Client logo**: name + logo (a name without a logo is shown as text) |
| Transparency reports (`/reports`) | **Звіт про прозорість**: one entry per file; a corrected report is a new entry with «Виправлена версія» on, keep the original published |
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

## Transparency reports

The law requires the reports for the last 7 calendar years on the site, and a corrected report must not replace the original.

1. **Content Manager → Звіт про прозорість → Create new entry**.
2. Fill **year**, **title** (e.g. «Звіт про прозорість за 2025 рік»), **publishedOn** and upload the PDF into **file**.
3. Balance sheets are entries with **docType = balance** for the same year.
4. For a corrected version create a **new** entry for the same year with **«Виправлена версія» (isCorrection)** switched on and, optionally, a short **note** (what was corrected). Leave the original published: the page lists both, original first.
5. Switch the locale to **en** and fill the title there too (the file and dates are shared).

## Vacancies

**Вакансія**: title, employment (e.g. «Повна зайнятість»), duties, requirements, conditions. Write one item per line in the three text fields; the site turns lines into bullet lists. While there are no published vacancies, the career page shows the note from **Сторінка «Кар'єра» → vacanciesEmpty** and a «Надіслати резюме» button (mailto to the e-mail in site settings).

## Map

The contacts page embeds Google Maps by the text in **Налаштування сайту → mapQuery** (e.g. «вулиця Лемківська, 9А, Львів»); **mapUrl** is the «Відкрити на карті» link in the footer and on the contacts page.

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
