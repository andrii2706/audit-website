import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/bits';
import ArticleView from '@/components/concept/ArticleView';
import { PostCard } from '@/components/concept/parts';
import { isLocale, locales } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { formatDate } from '@/lib/format';
import { articleLd, buildMetadata } from '@/lib/seo';
import { getArticleBySlug, getArticles, getGlobal, mediaUrl } from '@/lib/strapi';

export const revalidate = 3600;
export const dynamicParams = true;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const all = await Promise.all(locales.map(async (locale) => (await getArticles(locale)).map((p) => ({ locale, slug: p.slug }))));
  return all.flat();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const a = await getArticleBySlug(locale, slug);
  if (!a) return {};
  return buildMetadata({
    locale,
    path: `/blog/${a.slug}`,
    title: a.seo?.metaTitle || a.title,
    description: a.seo?.metaDescription || a.excerpt,
    image: mediaUrl(a.cover ?? null),
    type: 'article',
    publishedTime: a.publishedAt,
    modifiedTime: a.updatedAt,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, a, all, global] = await Promise.all([getDictionary(locale), getArticleBySlug(locale, slug), getArticles(locale, 4), getGlobal(locale)]);
  if (!a) notFound();
  const cover = mediaUrl(a.cover ?? null);
  const meta = [a.kind, a.readingMinutes ? t(dict.common.minutesRead, { n: a.readingMinutes }) : null, formatDate(a.publishedAt, locale)].filter(Boolean).join(' · ');
  const more = all.filter((x) => x.slug !== a.slug).slice(0, 3);
  const index = Math.max(0, all.findIndex((x) => x.slug === a.slug));

  return (
    <>
      <ArticleView
        locale={locale}
        labels={{ crumbs: dict.nav.breadcrumbs, section: dict.nav.blog, more: dict.concept.moreArticles, back: dict.concept.allArticles, ask: dict.pages.askAuditor, email: dict.pages.emailUs }}
        trail={trail(dict, 'blog', { name: a.title, path: `/blog/${a.slug}` })}
        title={a.title}
        intro={a.excerpt}
        meta={meta}
        cover={cover}
        coverAlt={a.cover?.alternativeText ?? ''}
        content={a.content}
        i={index}
        mailto={global?.email ? `mailto:${global.email}?subject=${encodeURIComponent(a.title)}` : null}
        hasMore={more.length > 0}
        more={
          <ul className="posts">
            {more.map((m, i) => (
              <PostCard
                key={m.documentId}
                href={`/${locale}/blog/${m.slug}`}
                i={i}
                kicker={m.kind}
                meta={[formatDate(m.publishedAt, locale), m.readingMinutes && t(dict.common.minutes, { n: m.readingMinutes })].filter(Boolean).join(' · ')}
                title={m.title}
                excerpt={m.excerpt}
                cover={mediaUrl(m.cover ?? null)}
              />
            ))}
          </ul>
        }
      />
      <JsonLd data={articleLd(locale, { title: a.title, excerpt: a.excerpt, slug: a.slug, publishedAt: a.publishedAt, updatedAt: a.updatedAt, image: cover })} />
    </>
  );
}
