import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/bits';
import Glyph from '@/components/concept/Glyph';
import { PageHead, PostCard } from '@/components/concept/parts';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { formatDate } from '@/lib/format';
import { buildMetadata, pageUrl } from '@/lib/seo';
import { getNews, mediaUrl } from '@/lib/strapi';

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

  return (
    <>
      <PageHead locale={locale} crumbs={trail(dict, 'news')} crumbsLabel={dict.nav.breadcrumbs} title={dict.pages.newsTitle} intro={dict.pages.newsIntro}>
        <p className="c-mt-s">
          <a className="mono muted" href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/${locale}/news/rss.xml`}>RSS · {dict.pages.newsRss}</a>
        </p>
      </PageHead>
      <section className="section section-tight">
        <div className="wrap">
          {news.length ? (
            <ul className="posts">
              {news.map((n, i) => (
                <PostCard
                  key={n.documentId}
                  href={`/${locale}/news/${n.slug}`}
                  i={i}
                  kicker={n.pinned ? dict.pages.newsPinned : n.tag}
                  meta={[formatDate(n.date, locale), n.pinned && n.tag].filter(Boolean).join(' · ')}
                  title={n.title}
                  excerpt={n.excerpt}
                  cover={mediaUrl(n.cover ?? null)}
                />
              ))}
            </ul>
          ) : (
            <div className="empty">
              <Glyph i={6} className="empty-glyph" />
              <p>{dict.pages.newsEmpty}</p>
            </div>
          )}
        </div>
      </section>

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
