import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/bits';
import { PageHead, PersonCard } from '@/components/concept/parts';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { buildMetadata, SITE_URL } from '@/lib/seo';
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
      <PageHead locale={locale} crumbs={trail(dict, 'team')} crumbsLabel={dict.nav.breadcrumbs} title={home?.teamTitle ?? dict.pages.teamTitle} intro={home?.teamSubtitle} />
      <section className="section section-tight">
        <div className="wrap">
          <ul className="team team-page">
            {team.map((m, i) => <PersonCard key={m.documentId} m={m} i={i} full labels={{ bio: dict.pages.teamMore, qualification: dict.pages.teamQualification }} />)}
          </ul>
        </div>
      </section>
      {team.map((m) => (
        <JsonLd
          key={m.documentId}
          data={{ '@context': 'https://schema.org', '@type': 'Person', name: m.name, jobTitle: m.role, description: m.bio ?? undefined, worksFor: { '@id': `${SITE_URL}/#organization` } }}
        />
      ))}
    </>
  );
}
