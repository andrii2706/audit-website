import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd, PageHero, PersonCard } from '@/components/bits';
import { container } from '@/components/ui';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { breadcrumbLd, buildMetadata, pageUrl, SITE_URL } from '@/lib/seo';
import { getHomepage, getTeam } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [d, home] = await Promise.all([getDictionary(locale), getHomepage(locale)]);
  return buildMetadata({ locale, path: '/team', title: home?.teamTitle ?? d.pages.teamTitle, description: home?.teamSubtitle });
}

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, home, team] = await Promise.all([getDictionary(locale), getHomepage(locale), getTeam(locale)]);
  return (
    <>
      <PageHero crumbLabel={dict.nav.breadcrumbs} crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.team }]} title={home?.teamTitle ?? dict.pages.teamTitle} intro={home?.teamSubtitle} />
      <section className={`${container} pb-16 sm:pb-24`}>
        <div data-stagger className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => <PersonCard key={m.documentId} m={m} />)}
        </div>
      </section>
      {team.map((m) => (
        <JsonLd
          key={m.documentId}
          data={{ '@context': 'https://schema.org', '@type': 'Person', name: m.name, jobTitle: m.role, description: m.bio ?? undefined, worksFor: { '@id': `${SITE_URL}/#organization` } }}
        />
      ))}
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.team, url: pageUrl(locale, '/team') }])} />
    </>
  );
}
