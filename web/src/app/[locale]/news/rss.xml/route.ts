import { isLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { pageUrl } from '@/lib/seo';
import { getGlobal, getNews } from '@/lib/strapi';

/** RSS 2.0 feed of company news, one per language: /{locale}/news/rss.xml */
export const revalidate = 3600;
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response('Not found', { status: 404 });
  const [dict, news, global] = await Promise.all([getDictionary(locale), getNews(locale, 50), getGlobal(locale)]);
  const site = global?.siteName ?? dict.meta.siteName;
  const self = pageUrl(locale, '/news/rss.xml');
  const items = news
    .map((n) => {
      const url = pageUrl(locale, `/news/${n.slug}`);
      return `    <item>
      <title>${esc(n.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${n.date}T09:00:00Z`).toUTCString()}</pubDate>${n.tag ? `\n      <category>${esc(n.tag)}</category>` : ''}${n.excerpt ? `\n      <description>${esc(n.excerpt)}</description>` : ''}
    </item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${dict.pages.newsTitle} — ${site}`)}</title>
    <link>${pageUrl(locale, '/news')}</link>
    <description>${esc(dict.pages.newsDescription)}</description>
    <language>${locale}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' } });
}
