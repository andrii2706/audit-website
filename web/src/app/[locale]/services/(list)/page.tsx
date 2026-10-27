import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd, PageHero, ServiceCard } from '@/components/bits';
import { chipCell, chipGrid, container } from '@/components/ui';
import { isLocale } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { breadcrumbLd, buildMetadata, pageUrl } from '@/lib/seo';
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

  return (
    <>
      <PageHero
        crumbLabel={dict.nav.breadcrumbs}
        crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.services }]}
        title={dict.pages.servicesTitle}
        intro={t(dict.pages.servicesIntro, { n: services.length })}
      >
        <nav aria-label={dict.nav.services} className={`${chipGrid} mt-7`}>
          {categories.map((c) => <a key={c.documentId} href={`#${c.slug}`} className={chipCell}>{c.name}</a>)}
        </nav>
      </PageHero>

      <div className={`${container} pb-16 sm:pb-24`}>
        {categories.map((c, i) => {
          const list = services.filter((s) => s.category?.slug === c.slug);
          if (!list.length) return null;
          return (
            <section key={c.documentId} id={c.slug} aria-labelledby={`h-${c.slug}`} className={i === 0 ? 'pb-10 sm:pb-12' : 'border-t border-line py-10 sm:py-12'}>
              <div data-reveal className="mb-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
                <h2 id={`h-${c.slug}`} className="text-[26px] font-semibold tracking-tight sm:text-3xl lg:text-[40px]">{c.name}</h2>
                {c.intro && <p className="max-w-lg text-muted">{c.intro}</p>}
              </div>
              <div data-stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => <ServiceCard key={s.documentId} locale={locale} s={s} more={dict.common.details} />)}
              </div>
            </section>
          );
        })}
      </div>
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.services, url: pageUrl(locale, '/services') }])} />
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
