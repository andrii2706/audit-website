import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/bits';
import ConceptForm from '@/components/concept/ConceptForm';
import DeliverableCards from '@/components/concept/DeliverableCards';
import { Label, PageHead, Prose, SvcCard, Tick, num } from '@/components/concept/parts';
import { isLocale, locales } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { deliverableCards } from '@/lib/deliverables';
import { formatPhone, telHref } from '@/lib/format';
import { buildMetadata, serviceLd } from '@/lib/seo';
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
  // Items written as «Title: text» (as in the client's brief) are shown as cards, other lists stay a plain list.
  const cards = deliverableCards((s.deliverables ?? []).map((x) => x.text));
  const related = all.filter((x) => x.category?.slug === s.category?.slug && x.slug !== s.slug).slice(0, 3);
  const facts = [
    { label: d.price, value: s.priceFrom || d.priceDefault },
    { label: d.duration, value: s.duration || d.durationDefault },
    { label: d.format, value: d.formatValue },
  ];
  const crumbs = trail(
    dict,
    'services',
    ...(s.category ? [{ name: s.category.name, path: `/services#${s.category.slug}` }] : []),
    { name: s.title, path: `/services/${s.slug}` },
  );

  return (
    <>
      <PageHead locale={locale} crumbs={crumbs} crumbsLabel={dict.nav.breadcrumbs} title={s.title} intro={s.excerpt}>
        {(s.badge || !!s.tags?.length) && (
          <div className="tagrow">
            {s.badge && <span className="badge badge-lime">{s.badge}</span>}
            {s.tags?.map((tg) => <span key={tg.id} className="tagpill">{tg.text}</span>)}
          </div>
        )}
      </PageHead>

      <div className="wrap svc-detail">
        <div className="svc-main">
          <dl className="meta">
            {facts.map((f) => (
              <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
            ))}
          </dl>
          {!!s.deliverables?.length && (
            <section className="sblock">
              <h2 className="display h3">{d.deliverables}</h2>
              {cards ? (
                <DeliverableCards items={cards} locale={locale} />
              ) : (
                <ul className="bullets bullets-2">
                  {s.deliverables.map((x) => <li key={x.id}><Tick />{x.text}</li>)}
                </ul>
              )}
            </section>
          )}
          {!!s.description?.length && (
            <section className="sblock">
              <h2 className="display h3">{d.about}</h2>
              <Prose content={s.description} />
            </section>
          )}
          {steps.length > 0 && (
            <section className="sblock">
              <h2 className="display h3">{d.howWorks}</h2>
              <ol className="steps-list">
                {steps.map((st, i) => (
                  <li key={st.id} className="step-row">
                    <span className="display step-row-n">{num(i)}</span>
                    <div>
                      <h3>{st.title}</h3>
                      {st.text && <p className="muted">{st.text}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
        <aside className="svc-aside" aria-label={t(d.order, { title: s.title })}>
          <ConceptForm
            locale={locale}
            dict={dict.form}
            title={t(d.order, { title: s.title })}
            service={s.title}
            sourcePage={`/${locale}/services/${s.slug}`}
          />
          {global?.phone && (
            <p className="muted small-t">{d.orCall} <a href={telHref(global.phone)}>{formatPhone(global.phone)}</a></p>
          )}
          {global?.email && (
            <p className="muted small-t">{dict.form.orEmail} <a href={`mailto:${global.email}?subject=${encodeURIComponent(s.title)}`}>{global.email}</a></p>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="section section-tight">
          <div className="wrap">
            <Label>{t(d.alsoIn, { category: s.category?.name ?? '' })}</Label>
            <ul className="svc-grid svc-grid-3">
              {related.map((r, i) => <SvcCard key={r.documentId} locale={locale} s={r} i={i} withExcerpt />)}
            </ul>
          </div>
        </section>
      )}

      <JsonLd data={serviceLd(locale, { title: s.title, excerpt: s.excerpt, slug: s.slug, category: s.category?.name, items: s.deliverables?.map((x) => x.text) })} />
    </>
  );
}
