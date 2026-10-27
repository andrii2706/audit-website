import type { Metadata } from 'next';
import FadeImage from '@/components/FadeImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Blocks from '@/components/Blocks';
import { JsonLd, PageHero } from '@/components/bits';
import { btn, container } from '@/components/ui';
import { isLocale, locales } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { formatDate } from '@/lib/format';
import { articleLd, breadcrumbLd, buildMetadata, pageUrl } from '@/lib/seo';
import { getArticleBySlug, getArticles, mediaUrl } from '@/lib/strapi';

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
  const [dict, a] = await Promise.all([getDictionary(locale), getArticleBySlug(locale, slug)]);
  if (!a) notFound();
  const cover = mediaUrl(a.cover ?? null);
  const meta = [a.kind, a.readingMinutes ? t(dict.common.minutesRead, { n: a.readingMinutes }) : null, formatDate(a.publishedAt, locale)].filter(Boolean).join(' · ');

  return (
    <article>
      <PageHero crumbLabel={dict.nav.breadcrumbs} crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.blog, href: `/${locale}/blog` }, { name: a.title }]} title={a.title} intro={a.excerpt}>
        <p className="mt-4 text-sm text-muted">{meta}</p>
      </PageHero>
      <div className={`${container} flex animate-fade-up flex-col gap-10 pb-16 [animation-delay:100ms] sm:pb-24`}>
        {cover && (
          <div className="skeleton relative aspect-[16/8] max-w-5xl overflow-hidden rounded-card">
            <FadeImage src={cover} alt={a.cover?.alternativeText ?? ''} fill priority sizes="(max-width: 1100px) 100vw, 1000px" className="object-cover" />
          </div>
        )}
        <Blocks content={a.content} />
        <Link href={`/${locale}#estimate`} className={`${btn.accent} self-start`}>{dict.pages.askAuditor}</Link>
      </div>
      <JsonLd data={articleLd(locale, { title: a.title, excerpt: a.excerpt, slug: a.slug, publishedAt: a.publishedAt, updatedAt: a.updatedAt, image: cover })} />
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.blog, url: pageUrl(locale, '/blog') }, { name: a.title, url: pageUrl(locale, `/blog/${a.slug}`) }])} />
    </article>
  );
}
