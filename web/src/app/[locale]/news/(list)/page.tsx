import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd, NewsCard, PageHero } from '@/components/bits';
import { container } from '@/components/ui';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { breadcrumbLd, buildMetadata, pageUrl } from '@/lib/seo';
import { getNews } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDictionary(locale);
  const m = buildMetadata({ locale, path: '/news', title: d.pages.newsTitle, description: d.pages.newsDescription });
  // Lets feed readers and browsers discover the RSS feed of this language.
  return { ...m, alternates: { ...m.alternates, types: { 'application/rss+xml': [{ url: pageUrl(locale, '/news/rss.xml'), title: d.pages.newsTitle }] } } };
}

export default async function NewsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, news] = await Promise.all([getDictionary(locale), getNews(locale)]);
  const [first, ...rest] = news;
  const labels = { pinned: dict.pages.newsPinned, more: dict.common.details };

  return (
    <>
      <PageHero
        crumbLabel={dict.nav.breadcrumbs}
        crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.news }]}
        title={dict.pages.newsTitle}
        intro={dict.pages.newsIntro}
      >
        <a href={`/${locale}/news/rss.xml`} className="mt-5 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted hover:text-accent">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="19" r="2.2" /><path d="M3 10.5v3a7.5 7.5 0 0 1 7.5 7.5h3A10.5 10.5 0 0 0 3 10.5Zm0-6v3A13.5 13.5 0 0 1 16.5 21h3A16.5 16.5 0 0 0 3 4.5Z" /></svg>
          {dict.pages.newsRss}
        </a>
      </PageHero>

      <div className={`${container} flex flex-col gap-3 pb-16 sm:pb-24`}>
        {first ? (
          <>
            <NewsCard locale={locale} n={first} labels={labels} featured />
            {rest.length > 0 && (
              <div data-stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((n) => <NewsCard key={n.documentId} locale={locale} n={n} labels={labels} />)}
              </div>
            )}
          </>
        ) : (
          <p className="rounded-card border border-dashed border-line-strong bg-card px-6 py-12 text-center text-lg text-muted">{dict.pages.newsEmpty}</p>
        )}
      </div>

      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.news, url: pageUrl(locale, '/news') }])} />
      {news.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: news.map((n, i) => ({ '@type': 'ListItem', position: i + 1, url: pageUrl(locale, `/news/${n.slug}`), name: n.title })),
          }}
        />
      )}
    </>
  );
}
