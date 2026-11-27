import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/bits';
import ArticleView from '@/components/concept/ArticleView';
import { PostCard } from '@/components/concept/parts';
import { isLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { formatDate } from '@/lib/format';
import { buildMetadata, newsLd } from '@/lib/seo';
import { getGlobal, getNews, getNewsBySlug, mediaUrl } from '@/lib/strapi';

export const revalidate = 3600;
export const dynamicParams = true;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const all = await Promise.all(locales.map(async (locale) => (await getNews(locale)).map((n) => ({ locale, slug: n.slug }))));
  return all.flat();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const n = await getNewsBySlug(locale, slug);
  if (!n) return {};
  return buildMetadata({
    locale,
    path: `/news/${n.slug}`,
    title: n.seo?.metaTitle || n.title,
    description: n.seo?.metaDescription || n.excerpt,
    image: mediaUrl(n.cover ?? null),
    type: 'article',
    publishedTime: n.date,
    modifiedTime: n.updatedAt,
  });
}

export default async function NewsItemPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, n, all, global] = await Promise.all([getDictionary(locale), getNewsBySlug(locale, slug), getNews(locale, 4), getGlobal(locale)]);
  if (!n) notFound();
  const cover = mediaUrl(n.cover ?? null);
  const more = all.filter((x) => x.slug !== n.slug).slice(0, 3);

  return (
    <>
      <ArticleView
        locale={locale}
        labels={{ crumbs: dict.nav.breadcrumbs, section: dict.nav.news, more: dict.pages.newsMore, back: dict.pages.newsBack, ask: dict.pages.askAuditor, email: dict.pages.emailUs }}
        trail={trail(dict, 'news', { name: n.title, path: `/news/${n.slug}` })}
        title={n.title}
        intro={n.excerpt}
        meta={<><time dateTime={n.date}>{formatDate(n.date, locale)}</time>{n.tag ? ` · ${n.tag}` : ''}</>}
        cover={cover}
        coverAlt={n.cover?.alternativeText ?? ''}
        content={n.content}
        i={0}
        mailto={global?.email ? `mailto:${global.email}?subject=${encodeURIComponent(n.title)}` : null}
        hasMore={more.length > 0}
        more={
          <ul className="posts">
            {more.map((m, i) => (
              <PostCard key={m.documentId} href={`/${locale}/news/${m.slug}`} i={i} kicker={m.tag} meta={formatDate(m.date, locale)} title={m.title} excerpt={m.excerpt} cover={mediaUrl(m.cover ?? null)} />
            ))}
          </ul>
        }
      />
      <JsonLd data={newsLd(locale, { title: n.title, excerpt: n.excerpt, slug: n.slug, date: n.date, updatedAt: n.updatedAt, image: cover })} />
    </>
  );
}
