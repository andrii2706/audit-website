import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/bits';
import { Label, PageHead, SvcCard } from '@/components/concept/parts';
import { isLocale } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { buildMetadata, pageUrl } from '@/lib/seo';
import { getAllServices, getCategories } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDictionary(locale);
  return buildMetadata({ locale, path: '/services', title: d.pages.servicesTitle, description: d.pages.servicesDescription });
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, categories, services] = await Promise.all([getDictionary(locale), getCategories(locale), getAllServices(locale)]);
  const groups = categories.map((c) => ({ c, list: services.filter((s) => s.category?.slug === c.slug) })).filter((g) => g.list.length);

  return (
    <>
      <PageHead locale={locale} crumbs={trail(dict, 'services')} crumbsLabel={dict.nav.breadcrumbs} title={dict.pages.servicesTitle} intro={t(dict.pages.servicesIntro, { n: services.length })}>
        <nav className="chips page-chips" aria-label={dict.nav.services}>
          {groups.map(({ c, list }) => (
            <a key={c.documentId} className="chip chip-light" href={`#${c.slug}`}>{c.name} <span className="mono">{list.length}</span></a>
          ))}
        </nav>
      </PageHead>
      {groups.map(({ c, list }) => (
        <section key={c.documentId} className="section section-tight" id={c.slug} aria-labelledby={`h-${c.slug}`}>
          <div className="wrap">
            <Label>{c.name}</Label>
            <div className="cat-head">
              <h2 id={`h-${c.slug}`} className="display h2-left">{c.name}</h2>
              {c.intro && <p className="muted">{c.intro}</p>}
            </div>
            <ul className="svc-grid svc-grid-3">
              {list.map((s, i) => <SvcCard key={s.documentId} locale={locale} s={s} i={i} withExcerpt />)}
            </ul>
          </div>
        </section>
      ))}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: services.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: pageUrl(locale, `/services/${s.slug}`), name: s.title })),
        }}
      />
    </>
  );
}
