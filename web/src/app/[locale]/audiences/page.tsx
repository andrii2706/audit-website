import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AudienceTabs from '@/components/AudienceTabs';
import { JsonLd, PageHero } from '@/components/bits';
import { EstimateSection } from '@/components/sections';
import { container } from '@/components/ui';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { breadcrumbLd, buildMetadata, pageUrl } from '@/lib/seo';
import { getAudiences, getCategories, getHomepage } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDictionary(locale);
  return buildMetadata({ locale, path: '/audiences', title: d.pages.audiencesTitle, description: d.pages.audiencesIntro });
}

export default async function AudiencesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, audiences, home, categories] = await Promise.all([getDictionary(locale), getAudiences(locale), getHomepage(locale), getCategories(locale)]);
  return (
    <>
      <PageHero crumbLabel={dict.nav.breadcrumbs} crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.audiences }]} title={dict.pages.audiencesTitle} intro={dict.pages.audiencesIntro} />
      <section data-reveal className={`${container} pb-16 sm:pb-24`}>
        <AudienceTabs locale={locale} items={audiences} labels={{ details: dict.common.details, pickFormat: dict.common.pickFormat, tablist: dict.nav.audiences }} />
      </section>
      <EstimateSection locale={locale} dict={dict} home={home} categories={categories} num="02" />
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.audiences, url: pageUrl(locale, '/audiences') }])} />
    </>
  );
}
