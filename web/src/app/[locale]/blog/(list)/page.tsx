import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd, PageHero, PostCard } from '@/components/bits';
import { container } from '@/components/ui';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { breadcrumbLd, buildMetadata, pageUrl } from '@/lib/seo';
import { getArticles } from '@/lib/strapi';

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
      <PageHero crumbLabel={dict.nav.breadcrumbs} crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.blog }]} title={dict.pages.blogTitle} intro={dict.pages.blogIntro} />
      <div className={`${container} pb-16 sm:pb-24`}>
        {posts.length ? (
          <div data-stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <PostCard key={p.documentId} locale={locale} post={p} minutes={dict.common.minutes} />)}</div>
        ) : (
          <p className="text-lg text-muted">{dict.pages.blogEmpty}</p>
        )}
      </div>
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.blog, url: pageUrl(locale, '/blog') }])} />
    </>
  );
}
