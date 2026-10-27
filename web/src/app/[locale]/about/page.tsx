import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd, PageHero } from '@/components/bits';
import { FaqSection, ProcessSection, StatsWhy } from '@/components/sections';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { breadcrumbLd, buildMetadata, faqLd, pageUrl } from '@/lib/seo';
import { getFaqs, getHomepage } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDictionary(locale);
  return buildMetadata({ locale, path: '/about', title: d.pages.aboutTitle, description: d.pages.aboutIntro });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, home, faqs] = await Promise.all([getDictionary(locale), getHomepage(locale), getFaqs(locale)]);
  return (
    <>
      <PageHero crumbLabel={dict.nav.breadcrumbs} crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.about }]} title={dict.pages.aboutTitle} intro={dict.pages.aboutIntro} />
      <div className="pb-16 sm:pb-24"><StatsWhy home={home} /></div>
      <ProcessSection locale={locale} dict={dict} home={home} num="01" />
      <FaqSection locale={locale} dict={dict} home={home} faqs={faqs} num="02" />
      {faqs.length > 0 && <JsonLd data={faqLd(faqs)} />}
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.about, url: pageUrl(locale, '/about') }])} />
    </>
  );
}
