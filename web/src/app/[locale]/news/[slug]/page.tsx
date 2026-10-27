import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Blocks from '@/components/Blocks';
import FadeImage from '@/components/FadeImage';
import { JsonLd, NewsCard, PageHero } from '@/components/bits';
import { btn, container } from '@/components/ui';
import { isLocale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { formatDate } from '@/lib/format';
import { breadcrumbLd, buildMetadata, newsLd, pageUrl } from '@/lib/seo';
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
  const labels = { pinned: dict.pages.newsPinned, more: dict.common.details };

  return (
    <>
      <article>
        <PageHero
          crumbLabel={dict.nav.breadcrumbs}
          crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.news, href: `/${locale}/news` }, { name: n.title }]}
          title={n.title}
          intro={n.excerpt}
        >
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
            <time dateTime={n.date}>{formatDate(n.date, locale)}</time>
            {n.tag && <><span aria-hidden="true">·</span><span>{n.tag}</span></>}
          </p>
        </PageHero>
        <div className={`${container} flex animate-fade-up flex-col gap-10 pb-12 [animation-delay:100ms] sm:pb-16`}>
          {cover && (
            <div className="skeleton relative aspect-[16/8] max-w-5xl overflow-hidden rounded-card">
              <FadeImage src={cover} alt={n.cover?.alternativeText ?? ''} fill priority sizes="(max-width: 1100px) 100vw, 1000px" className="object-cover" />
            </div>
          )}
          {!!n.content?.length && <Blocks content={n.content} />}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={`/${locale}#estimate`} className={`${btn.accent} w-full sm:w-auto`}>{dict.pages.askAuditor}</Link>
            {global?.email && <a href={`mailto:${global.email}?subject=${encodeURIComponent(n.title)}`} className={`${btn.light} w-full sm:w-auto`}>{dict.pages.emailUs}</a>}
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className={`${container} pb-16 sm:pb-24`}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.pages.newsMore}</h2>
            <Link href={`/${locale}/news`} className={btn.outline}>{dict.pages.newsBack}</Link>
          </div>
          <div data-stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((m) => <NewsCard key={m.documentId} locale={locale} n={m} labels={labels} />)}
          </div>
        </section>
      )}

      <JsonLd data={newsLd(locale, { title: n.title, excerpt: n.excerpt, slug: n.slug, date: n.date, updatedAt: n.updatedAt, image: cover })} />
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.news, url: pageUrl(locale, '/news') }, { name: n.title, url: pageUrl(locale, `/news/${n.slug}`) }])} />
    </>
  );
}
