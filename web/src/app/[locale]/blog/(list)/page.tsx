import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Glyph from '@/components/concept/Glyph';
import { PageHead, PostCard } from '@/components/concept/parts';
import { isLocale } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { getArticles, mediaUrl } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDictionary(locale);
  return buildMetadata({ locale, path: '/blog', title: d.pages.blogTitle, description: d.pages.blogIntro });
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, posts] = await Promise.all([getDictionary(locale), getArticles(locale)]);
  return (
    <>
      <PageHead locale={locale} crumbs={trail(dict, 'blog')} crumbsLabel={dict.nav.breadcrumbs} title={dict.pages.blogTitle} intro={dict.pages.blogIntro} />
      <section className="section section-tight">
        <div className="wrap">
          {posts.length ? (
            <ul className="posts">
              {posts.map((p, i) => (
                <PostCard
                  key={p.documentId}
                  href={`/${locale}/blog/${p.slug}`}
                  i={i}
                  kicker={p.kind}
                  meta={[formatDate(p.publishedAt, locale), p.readingMinutes && t(dict.common.minutes, { n: p.readingMinutes })].filter(Boolean).join(' · ')}
                  title={p.title}
                  excerpt={p.excerpt}
                  cover={mediaUrl(p.cover ?? null)}
                />
              ))}
            </ul>
          ) : (
            <div className="empty"><Glyph i={6} className="empty-glyph" /><p>{dict.pages.blogEmpty}</p></div>
          )}
        </div>
      </section>
    </>
  );
}
