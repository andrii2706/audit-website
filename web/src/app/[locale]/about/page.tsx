import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Blocks from '@/components/Blocks';
import { JsonLd, PageHero, SectionHead } from '@/components/bits';
import CountUp from '@/components/CountUp';
import FadeImage from '@/components/FadeImage';
import { ArrowRight, FileText } from '@/components/Icons';
import { FaqSection } from '@/components/sections';
import { btn, cardHover, container, eyebrow, h2 } from '@/components/ui';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { cx } from '@/lib/format';
import { breadcrumbLd, buildMetadata, faqLd, pageUrl } from '@/lib/seo';
import { getAboutPage, getDocumentImages, getFaqs, getHomepage, mediaUrl } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [d, about] = await Promise.all([getDictionary(locale), getAboutPage(locale)]);
  return buildMetadata({
    locale,
    path: '/about',
    title: about?.seo?.metaTitle || d.pages.aboutTitle,
    description: about?.seo?.metaDescription || about?.heroIntro || d.pages.aboutIntro,
  });
}

const sectionY = 'py-16 sm:py-24';

/** About the firm: intro + key numbers, reasons, mission & values, principles, history, register and quality. Content: Strapi "Про компанію". */
export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, about, home, faqs, docs] = await Promise.all([getDictionary(locale), getAboutPage(locale), getHomepage(locale), getFaqs(locale), getDocumentImages(locale)]);
  const s = dict.sections;
  let n = 0;
  const num = () => String(++n).padStart(2, '0');

  return (
    <>
      <PageHero
        crumbLabel={dict.nav.breadcrumbs}
        crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.about }]}
        title={about?.heroTitle ?? dict.pages.aboutTitle}
        intro={about?.heroIntro ?? dict.pages.aboutIntro}
        badge={home?.heroBadgeNote}
      />

      {/* ——— Intro + key numbers */}
      {!!(about?.intro?.length || home?.stats?.length) && (
        <section className={`${container} grid gap-8 pb-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12`}>
          <div data-reveal className="min-w-0">
            <Blocks content={about?.intro} />
          </div>
          {!!home?.stats?.length && (
            <div data-stagger className="grid grid-cols-2 gap-3 self-start">
              {home.stats.map((st, i) => (
                <div key={st.id} className={cx('flex min-h-36 flex-col justify-between gap-3 rounded-card p-5 sm:p-6', i === 0 ? 'bg-accent text-white' : 'border border-line bg-card')}>
                  <b className="text-[34px] leading-none font-semibold tracking-[-0.04em] sm:text-[44px]"><CountUp value={st.value} /></b>
                  <span className={cx('text-sm leading-snug', i === 0 ? 'text-accent-on' : 'text-muted')}>{st.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ——— Why us (7 reasons): the first card is wide and highlighted */}
      {!!about?.reasons?.length && (
        <section className={sectionY}>
          <div className={container}>
            <SectionHead eyebrowText={`${num()} / ${s.about}`} title={about.reasonsTitle ?? s.about} />
            <ol data-stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {about.reasons.map((r, i) => (
                <li
                  key={r.id}
                  className={cx(
                    'flex min-h-48 flex-col gap-3 rounded-card p-6',
                    i === 0 ? 'bg-ink text-white sm:col-span-2' : 'border border-line bg-card',
                  )}
                >
                  <span className={cx('font-mono text-[13px]', i === 0 ? 'text-dark-muted' : 'text-muted')}>{String(i + 1).padStart(2, '0')}</span>
                  <h3 className={cx('mt-auto font-semibold tracking-tight', i === 0 ? 'text-2xl sm:text-[28px]' : 'text-lg sm:text-xl')}>{r.title}</h3>
                  {r.text && <p className={cx('text-[15px] leading-relaxed', i === 0 ? 'text-dark-muted' : 'text-muted')}>{r.text}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ——— Mission + values (dark block) */}
      {!!(about?.mission || about?.values?.length) && (
        <section className={`${container} pb-16 sm:pb-24`}>
          <div data-reveal className="grid gap-10 rounded-card bg-ink px-5 py-12 text-white sm:rounded-block sm:px-10 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-14 lg:px-14 lg:py-[72px]">
            {about?.mission && (
              <div className="flex flex-col gap-4">
                <span className={`${eyebrow} text-dark-muted`}>{num()} / {s.mission}</span>
                <h2 className="text-3xl leading-[1.08] font-semibold tracking-[-0.03em] sm:text-4xl lg:text-[44px]">{about.missionTitle ?? s.mission}</h2>
                <p className="text-base leading-relaxed text-dark-muted sm:text-[17px]">{about.mission}</p>
              </div>
            )}
            {!!about?.values?.length && (
              <div className="flex flex-col gap-6">
                <h3 className="text-xl font-semibold sm:text-2xl">{about.valuesTitle ?? s.values}</h3>
                <div data-stagger className="grid gap-6 sm:grid-cols-2 sm:gap-x-8">
                  {about.values.map((v) => (
                    <div key={v.id} className="border-t border-dark-line pt-4">
                      <b className="mb-2 block text-lg font-semibold text-lime">{v.title}</b>
                      <span className="text-[15px] leading-relaxed text-dark-muted">{v.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ——— People & principles */}
      {!!about?.principles?.length && (
        <section className={`${container} pb-16 sm:pb-24`}>
          <SectionHead eyebrowText={`${num()} / ${s.people}`} title={about.principlesTitle ?? s.people} intro={about.principlesIntro} />
          <div data-stagger className="grid gap-3 md:grid-cols-3">
            {about.principles.map((p, i) => (
              <div key={p.id} className="flex flex-col gap-3 rounded-card border border-line bg-card p-6 sm:p-7">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-ink">{i + 1}</span>
                <h3 className="text-lg font-semibold sm:text-xl">{p.title}</h3>
                {p.text && <p className="text-[15px] leading-relaxed text-muted">{p.text}</p>}
              </div>
            ))}
          </div>
          {about.principlesOutro && (
            <p data-reveal className="mt-6 max-w-3xl text-lg leading-relaxed font-medium sm:mt-8 sm:text-xl">{about.principlesOutro}</p>
          )}
        </section>
      )}

      {/* ——— History + "clients come to us when…" */}
      {!!(about?.history?.length || about?.requests?.length) && (
        <section className="border-y border-line bg-card py-16 sm:py-24">
          <div className={`${container} grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-14`}>
            <div data-reveal className="flex min-w-0 flex-col gap-4">
              <span className={eyebrow}>{num()} / {s.history}</span>
              <h2 className={h2}>{about?.historyTitle ?? s.history}</h2>
              <div className="mt-2"><Blocks content={about?.history} /></div>
            </div>
            {!!about?.requests?.length && (
              <div data-reveal className="self-start rounded-card bg-accent-soft p-6 sm:p-8">
                <h3 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">{about.requestsTitle}</h3>
                <ul data-stagger className="flex flex-col gap-3.5">
                  {about.requests.map((r) => (
                    <li key={r.id} className="flex gap-3 text-base leading-snug">
                      <i aria-hidden="true" className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-accent-ink not-italic">✓</i>
                      {r.text}
                    </li>
                  ))}
                </ul>
                <Link href={`/${locale}#estimate`} className={`${btn.accent} mt-7 w-full`}>{dict.nav.getConsultation} <ArrowRight /></Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ——— Register (sections 3 and 4) + quality check */}
      {about?.registry?.length ? (
        <section id="registry" className={`${container} ${sectionY}`}>
          <div data-reveal className="grid gap-8 rounded-card border border-line bg-card p-6 sm:rounded-block sm:p-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-12 lg:p-14">
            <div className="flex flex-col gap-4">
              <span className={eyebrow}>{num()} / {s.registry}</span>
              <h2 className="text-3xl leading-[1.08] font-semibold tracking-[-0.03em] sm:text-4xl">{about.registryTitle ?? s.registry}</h2>
              {home?.trustText && <span className="self-start rounded-2xl bg-lime px-3 py-1.5 text-[13px] leading-snug font-semibold text-ink">{home.trustText}</span>}
            </div>
            <div className="min-w-0">
              <Blocks content={about.registry} />
              {!!about.quality?.length && (
                <Link href={`/${locale}/career#quality`} className="mt-6 inline-flex cursor-pointer items-center gap-2 font-semibold text-accent-ink hover:underline">
                  {about.qualityTitle ?? s.quality} <ArrowRight />
                </Link>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* ——— Company details (requisites) */}
      {!!about?.requisites?.length && (
        <section id="requisites" className={`${container} pb-16 sm:pb-24`}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)] lg:gap-12">
            <div data-reveal className="flex flex-col gap-4">
              <span className={eyebrow}>{num()} / {s.requisites}</span>
              <h2 className={h2}>{about.requisitesTitle ?? s.requisites}</h2>
            </div>
            <div data-reveal className="min-w-0 rounded-card border border-line bg-card p-6 sm:p-8 [&_p]:border-b [&_p]:border-line [&_p]:pb-4 [&_p:last-child]:border-0 [&_p:last-child]:pb-0">
              <Blocks content={about.requisites} />
            </div>
          </div>
        </section>
      )}

      {/* ——— Quality policy (from the old site) */}
      {!!about?.policy?.length && (
        <section id="policy" className="border-y border-line bg-card py-16 sm:py-24">
          <div className={`${container} grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)] lg:gap-12`}>
            <div data-reveal className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
              <span className={eyebrow}>{num()} / {s.policy}</span>
              <h2 className={h2}>{about.policyTitle ?? s.policy}</h2>
            </div>
            <div data-reveal className="min-w-0"><Blocks content={about.policy} /></div>
          </div>
        </section>
      )}

      {/* ——— Certificates and recommendation letters (only entries with an uploaded image) */}
      {[
        { kind: 'certificate' as const, title: about?.documentsTitle, id: 'documents' },
        { kind: 'recommendation' as const, title: about?.recommendationsTitle, id: 'recommendations' },
      ].map(({ kind, title, id }) => {
        const list = docs.filter((d) => d.kind === kind);
        if (!list.length) return null;
        return (
          <section key={kind} id={id} className={`${container} ${sectionY}`}>
            <SectionHead eyebrowText={`${num()} / ${s.documents}`} title={title ?? s.documents} />
            <ul data-stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((d) => {
                const src = mediaUrl(d.image ?? null)!;
                const isImage = !d.image?.mime || d.image.mime.startsWith('image/');
                return (
                  <li key={d.documentId}>
                    <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`${dict.pages.openDocument}: ${d.title}`} className={`${cardHover} flex h-full flex-col gap-3 rounded-card border border-line bg-card p-2.5 pb-4`}>
                      <span className="skeleton relative block aspect-[3/4] overflow-hidden rounded-[18px] bg-bg">
                        {isImage ? (
                          <FadeImage src={src} alt={d.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px" className="object-contain p-2 group-hover:scale-[1.03]" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-accent-ink"><FileText size={40} /></span>
                        )}
                      </span>
                      <span className="px-2 text-sm leading-snug font-medium">{d.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <FaqSection locale={locale} dict={dict} home={home} faqs={faqs} num={num()} />
      {faqs.length > 0 && <JsonLd data={faqLd(faqs)} />}
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.about, url: pageUrl(locale, '/about') }])} />
    </>
  );
}
