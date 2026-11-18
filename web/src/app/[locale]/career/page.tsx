import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/bits';
import Glyph from '@/components/concept/Glyph';
import { Arrow, FaqList, Label, PageHead, Prose, Tick, UpRight } from '@/components/concept/parts';
import { isLocale } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { buildMetadata, faqLd, SITE_URL } from '@/lib/seo';
import { getAboutPage, getCareerPage, getGlobal, getVacancies } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [d, page] = await Promise.all([getDictionary(locale), getCareerPage(locale)]);
  return buildMetadata({
    locale,
    path: '/career',
    title: page?.seo?.metaTitle || d.pages.careerTitle,
    description: page?.seo?.metaDescription || d.pages.careerIntro,
  });
}

/** Multi-line text from Strapi → list items (one per line, leading "-" or "•" removed). */
const lines = (text?: string | null) =>
  (text ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*[-•–]\s*/, '').trim())
    .filter(Boolean);

export default async function CareerPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, page, vacancies, about, global] = await Promise.all([
    getDictionary(locale), getCareerPage(locale), getVacancies(locale), getAboutPage(locale), getGlobal(locale),
  ]);
  const p = dict.pages;
  const faqs = (page?.faqs ?? []).map((f) => ({ documentId: String(f.id), question: f.title, answer: f.text ?? '' }));
  const email = global?.email;

  const apply = (subject?: string) => `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

  return (
    <>
      <PageHead locale={locale} crumbs={trail(dict, 'career')} crumbsLabel={dict.nav.breadcrumbs} title={page?.heroTitle ?? p.careerTitle} intro={page?.heroIntro ?? p.careerIntro}>
        {email && <div className="hero-cta left"><a className="btn btn-dark" href={apply()}>{p.vacancyApply} <UpRight /></a></div>}
      </PageHead>

      <section className="section section-tight" id="vacancies">
        <div className="wrap">
          <Label>{page?.vacanciesTitle ?? dict.sections.vacancies}</Label>
          {vacancies.length ? (
            <ul className="vgrid vgrid-3">
              {vacancies.map((v) => {
                const groups = [
                  { label: p.vacancyDuties, items: lines(v.duties) },
                  { label: p.vacancyRequirements, items: lines(v.requirements) },
                  { label: p.vacancyConditions, items: lines(v.conditions) },
                ].filter((g) => g.items.length);
                return (
                  <li key={v.documentId} className="vac">
                    <h3>{v.title}</h3>
                    {v.employment && <p className="mono muted">{p.vacancyEmployment}: {v.employment}</p>}
                    {groups.map((g) => (
                      <div key={g.label}>
                        <p className="muted small-t">{g.label}</p>
                        <ul className="bullets c-mt-s">{g.items.map((it) => <li key={it}><Tick />{it}</li>)}</ul>
                      </div>
                    ))}
                    {email && <a className="btn btn-ghost" href={apply(t(p.vacancyApplySubject, { title: v.title }))}>{p.vacancyApply} <Arrow /></a>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty empty-row">
              <Glyph i={0} className="empty-glyph" />
              <p>{page?.vacanciesEmpty || p.vacanciesFallback}</p>
              {email && <a className="btn btn-ghost" href={apply()}>{p.vacancyApply} <Arrow /></a>}
            </div>
          )}
        </div>
      </section>

      {!!page?.about?.length && (
        <section className="section">
          <div className="wrap two-col">
            <div>
              <Label>{dict.concept.firmWork}</Label>
              <h2 className="display h2-left c-mt">{page.aboutTitle ?? dict.sections.work}</h2>
            </div>
            <Prose content={page.about} />
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="section">
          <div className="wrap faq">
            <div><h2 className="display h2-left">{page?.faqTitle ?? dict.sections.faq}</h2></div>
            <FaqList items={faqs.map((f) => ({ id: f.documentId, question: f.question, answer: f.answer }))} />
          </div>
        </section>
      )}

      {/* Methodology: quality management system (ISQM 1). Text lives in the "Про компанію" single type. */}
      {!!about?.quality?.length && (
        <section className="section" id="quality">
          <div className="wrap two-col">
            <div>
              <Label>{dict.sections.quality}</Label>
              <h2 className="display h2-left c-mt">{about.qualityTitle ?? p.qualityLink}</h2>
              <p className="c-mt"><span className="badge">МСУЯ 1 · ISQM 1</span></p>
            </div>
            <Prose content={about.quality} />
          </div>
        </section>
      )}

      {faqs.length > 0 && <JsonLd data={faqLd(faqs)} />}
      {vacancies.map((v) => (
        <JsonLd
          key={v.documentId}
          data={{
            '@context': 'https://schema.org',
            '@type': 'JobPosting',
            title: v.title,
            description: [v.duties, v.requirements, v.conditions].filter(Boolean).join('\n\n') || v.title,
            employmentType: v.employment ?? undefined,
            hiringOrganization: { '@id': `${SITE_URL}/#organization` },
            jobLocation: global?.address ? { '@type': 'Place', address: { '@type': 'PostalAddress', streetAddress: global.address, addressLocality: 'Lviv', addressCountry: 'UA' } } : undefined,
          }}
        />
      ))}
    </>
  );
}
