import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Blocks from '@/components/Blocks';
import { JsonLd, PageHero, ServiceCard, Steps } from '@/components/bits';
import LeadForm from '@/components/LeadForm';
import { container } from '@/components/ui';
import { isLocale, locales } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { formatPhone, telHref } from '@/lib/format';
import { breadcrumbLd, buildMetadata, pageUrl, serviceLd } from '@/lib/seo';
import { getAllServices, getGlobal, getHomepage, getServiceBySlug } from '@/lib/strapi';

export const revalidate = 3600;
export const dynamicParams = true;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const all = await Promise.all(locales.map(async (locale) => (await getAllServices(locale)).map((s) => ({ locale, slug: s.slug }))));
  return all.flat();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const s = await getServiceBySlug(locale, slug);
  if (!s) return {};
  return buildMetadata({
    locale,
    path: `/services/${s.slug}`,
    title: s.seo?.metaTitle || s.title,
    description: s.seo?.metaDescription || s.excerpt,
    image: `/${locale}/services/${s.slug}/opengraph-image`,
  });
}

export default async function ServicePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, s, all, global, home] = await Promise.all([getDictionary(locale), getServiceBySlug(locale, slug), getAllServices(locale), getGlobal(locale), getHomepage(locale)]);
  if (!s) notFound();
  const d = dict.service;

  // Without its own steps a service shows the general process from the home page.
  const steps = s.steps?.length ? s.steps : home?.processSteps ?? [];
  const related = all.filter((x) => x.category?.slug === s.category?.slug && x.slug !== s.slug).slice(0, 3);
  const facts = [
    { label: d.price, value: s.priceFrom || d.priceDefault },
    { label: d.duration, value: s.duration || d.durationDefault },
    { label: d.format, value: d.formatValue },
  ];
  const crumbs = [
    { name: dict.nav.home, href: `/${locale}` },
    { name: dict.nav.services, href: `/${locale}/services` },
    ...(s.category ? [{ name: s.category.name, href: `/${locale}/services#${s.category.slug}` }] : []),
    { name: s.title },
  ];

  return (
    <>
      <PageHero crumbLabel={dict.nav.breadcrumbs} crumbs={crumbs} title={s.title} intro={s.excerpt} badge={s.badge}>
        <dl className="mt-7 grid max-w-3xl gap-3 sm:mt-8 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col gap-1.5 rounded-tile border border-line bg-card p-5">
              <dt className="text-[13px] text-muted">{f.label}</dt>
              <dd className="text-lg font-semibold tracking-tight sm:text-xl">{f.value}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      <div className={`${container} grid items-start gap-10 pb-16 sm:pb-24 lg:grid-cols-[minmax(0,1fr)_360px]`}>
        <div className="flex min-w-0 flex-col gap-12 sm:gap-14">
          {!!s.deliverables?.length && (
            <section>
              <h2 className="mb-5 text-2xl font-semibold tracking-tight sm:text-3xl">{d.deliverables}</h2>
              <ul data-stagger className="grid gap-3 sm:grid-cols-2">
                {s.deliverables.map((x) => (
                  <li key={x.id} className="flex gap-3 rounded-tile border border-line bg-card p-5 text-base leading-snug">
                    <i aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-ink not-italic">✓</i>
                    {x.text}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!!s.description?.length && (
            <section>
              <h2 className="mb-5 text-2xl font-semibold tracking-tight sm:text-3xl">{d.about}</h2>
              <Blocks content={s.description} />
            </section>
          )}
          {steps.length > 0 && (
            <section>
              <h2 className="mb-5 text-2xl font-semibold tracking-tight sm:text-3xl">{d.howWorks}</h2>
              <Steps steps={steps} className="sm:grid-cols-2" />
            </section>
          )}
          {related.length > 0 && (
            <section>
              <h2 className="mb-5 text-2xl font-semibold tracking-tight sm:text-3xl">{t(d.alsoIn, { category: s.category?.name ?? '' })}</h2>
              <div data-stagger className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => <ServiceCard key={r.documentId} locale={locale} s={r} more={dict.common.details} />)}
              </div>
            </section>
          )}
        </div>

        <aside aria-label={t(d.order, { title: s.title })} className="min-w-0 lg:sticky lg:top-28">
          <div className="animate-fade-up rounded-card border border-line bg-card px-5 pt-6 [animation-delay:150ms] sm:px-6">
            <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">{t(d.order, { title: s.title })}</h2>
            <p className="mt-1.5 text-sm text-muted">{d.orderNote}</p>
            <LeadForm locale={locale} dict={dict.form} variant="compact" service={s.title} sourcePage={`/${locale}/services/${s.slug}`} className="pt-5 pb-6" />
          </div>
          {(global?.phone || global?.email) && (
            <p className="mt-4 flex flex-col gap-1 text-[15px] text-muted">
              {global?.phone && (
                <span>{d.orCall} <a href={telHref(global.phone)} className="cursor-pointer font-semibold text-ink hover:text-accent">{formatPhone(global.phone)}</a></span>
              )}
              {global?.email && (
                <span>
                  {dict.form.orEmail}{' '}
                  <a href={`mailto:${global.email}?subject=${encodeURIComponent(s.title)}`} className="cursor-pointer font-semibold break-all text-ink hover:text-accent">{global.email}</a>
                </span>
              )}
            </p>
          )}
        </aside>
      </div>

      <JsonLd data={serviceLd(locale, { title: s.title, excerpt: s.excerpt, slug: s.slug, category: s.category?.name })} />
      <JsonLd
        data={breadcrumbLd([
          { name: dict.nav.home, url: pageUrl(locale) },
          { name: dict.nav.services, url: pageUrl(locale, '/services') },
          { name: s.title, url: pageUrl(locale, `/services/${s.slug}`) },
        ])}
      />
    </>
  );
}
