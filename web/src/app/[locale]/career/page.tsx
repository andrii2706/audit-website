import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Blocks from '@/components/Blocks';
import { FaqList, JsonLd, PageHero, SectionHead } from '@/components/bits';
import { ArrowRight, Mail } from '@/components/Icons';
import { badge, btn, container, eyebrow, h2 } from '@/components/ui';
import { isLocale } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { breadcrumbLd, buildMetadata, faqLd, pageUrl, SITE_URL } from '@/lib/seo';
import { getAboutPage, getCareerPage, getGlobal, getVacancies, type Vacancy } from '@/lib/strapi';

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

  return (
    <>
      <PageHero
        crumbLabel={dict.nav.breadcrumbs}
        crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.career }]}
        title={page?.heroTitle ?? p.careerTitle}
        intro={page?.heroIntro ?? p.careerIntro}
      >
        {email && (
          <a href={`mailto:${email}`} className={`${btn.dark} mt-7 w-full sm:w-auto`}>
            <Mail size={18} /> {p.vacancyApply}
          </a>
        )}
      </PageHero>

      {/* ——— Vacancies */}
      <section id="vacancies" className={`${container} pt-6 pb-16 sm:pb-24`}>
        <SectionHead eyebrowText={`01 / ${dict.sections.vacancies}`} title={page?.vacanciesTitle ?? dict.sections.vacancies} />
        {vacancies.length ? (
          <div data-stagger className="flex flex-col gap-2.5">
            {vacancies.map((v, i) => <VacancyItem key={v.documentId} v={v} open={i === 0} email={email} dict={dict} />)}
          </div>
        ) : (
          <div data-reveal className="flex flex-col items-start gap-5 rounded-card border border-dashed border-line-strong bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{page?.vacanciesEmpty || p.vacanciesFallback}</p>
            {email && (
              <a href={`mailto:${email}`} className={`${btn.outline} shrink-0`}>{p.vacancyApply} <ArrowRight /></a>
            )}
          </div>
        )}
      </section>

      {/* ——— Working here + FAQ */}
      {!!(page?.about?.length || faqs.length) && (
        <section className="border-y border-line bg-card py-16 sm:py-24">
          <div className={`${container} grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14`}>
            {!!page?.about?.length && (
              <div data-reveal className="flex min-w-0 flex-col gap-4">
                <span className={eyebrow}>02 / {dict.sections.work}</span>
                <h2 className={h2}>{page.aboutTitle ?? dict.sections.work}</h2>
                <div className="mt-2"><Blocks content={page.about} /></div>
              </div>
            )}
            {faqs.length > 0 && (
              <div className="flex min-w-0 flex-col gap-5 lg:pt-10">
                <h3 data-reveal className="text-2xl font-semibold tracking-tight sm:text-3xl">{page?.faqTitle ?? dict.sections.faq}</h3>
                <FaqList items={faqs} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ——— Methodology: quality management system (ISQM 1). Text lives in the "Про компанію" single type. */}
      {!!about?.quality?.length && (
        <section id="quality" className={`${container} scroll-mt-28 py-16 sm:py-24`}>
          <div data-reveal className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)] lg:gap-12">
            <div className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
              <span className={eyebrow}>03 / {dict.sections.quality}</span>
              <h2 className={h2}>{about.qualityTitle ?? p.qualityLink}</h2>
              <span className={`${badge.accent} self-start`}>МСУЯ 1 · ISQM 1</span>
            </div>
            <div className="min-w-0 rounded-card border border-line bg-card p-6 sm:p-10">
              <Blocks content={about.quality} />
            </div>
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
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.career, url: pageUrl(locale, '/career') }])} />
    </>
  );
}

function VacancyItem({ v, open, email, dict }: { v: Vacancy; open: boolean; email?: string | null; dict: Awaited<ReturnType<typeof getDictionary>> }) {
  const p = dict.pages;
  const groups = [
    { label: p.vacancyDuties, items: lines(v.duties) },
    { label: p.vacancyRequirements, items: lines(v.requirements) },
    { label: p.vacancyConditions, items: lines(v.conditions) },
  ].filter((g) => g.items.length);
  return (
    <details open={open} className="faq group rounded-tile border border-line bg-card transition-[border-color,box-shadow] duration-500 ease-(--ease-out-expo) open:border-line-strong open:shadow-[0_18px_40px_-28px_rgba(11,18,32,0.3)] hover:border-line-strong">
      <summary className="no-marker flex min-h-18 cursor-pointer items-center justify-between gap-4 px-5 py-4 sm:px-7">
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="text-lg font-semibold sm:text-xl">{v.title}</span>
          {v.employment && <span className="text-sm text-muted">{p.vacancyEmployment}: {v.employment}</span>}
        </span>
        <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-bg text-xl transition-[rotate,background-color,color] duration-500 ease-(--ease-out-expo) group-open:rotate-45 group-open:bg-ink group-open:text-white">+</span>
      </summary>
      <div className="flex flex-col gap-6 px-5 pb-6 sm:px-7 sm:pb-7">
        {groups.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {groups.map((g) => (
              <div key={g.label} className="flex flex-col gap-2.5">
                <b className="text-[13px] font-semibold tracking-wide text-muted uppercase">{g.label}</b>
                <ul className="flex flex-col gap-2 text-[15px] leading-relaxed">
                  {g.items.map((it) => (
                    <li key={it} className="flex gap-2.5"><span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {email && (
          <a href={`mailto:${email}?subject=${encodeURIComponent(t(p.vacancyApplySubject, { title: v.title }))}`} className={`${btn.accentSm} self-start`}>
            {p.vacancyApply} <ArrowRight />
          </a>
        )}
      </div>
    </details>
  );
}
