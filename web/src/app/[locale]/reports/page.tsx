import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd, PageHero } from '@/components/bits';
import { Download, FileText } from '@/components/Icons';
import { badge, container } from '@/components/ui';
import { isLocale } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { cx, formatDate } from '@/lib/format';
import { breadcrumbLd, buildMetadata, pageUrl } from '@/lib/seo';
import { getTransparencyReports, mediaUrl, type TransparencyReport } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDictionary(locale);
  return buildMetadata({ locale, path: '/reports', title: d.pages.reportsTitle, description: d.pages.reportsIntro });
}

const fileSize = (kb?: number) => (kb ? (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`) : null);

/**
 * Transparency reports for the last 7 calendar years (required by law). Corrected versions stay
 * published next to the original, so every version of a year is listed. Content: Strapi "Звіт про прозорість".
 */
export default async function ReportsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, reports] = await Promise.all([getDictionary(locale), getTransparencyReports(locale)]);
  const p = dict.pages;

  const years = new Map<number, TransparencyReport[]>();
  for (const r of reports) years.set(r.year, [...(years.get(r.year) ?? []), r]);

  return (
    <>
      <PageHero
        crumbLabel={dict.nav.breadcrumbs}
        crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.reports }]}
        title={p.reportsTitle}
        intro={p.reportsIntro}
      />
      <section className={`${container} pb-16 sm:pb-24`}>
        {years.size === 0 ? (
          <div data-reveal className="flex items-center gap-4 rounded-card border border-dashed border-line-strong bg-card p-6 text-muted sm:p-8">
            <FileText />
            <p className="text-base sm:text-lg">{p.reportsEmpty}</p>
          </div>
        ) : (
          <ol data-stagger className="flex flex-col gap-3">
            {[...years].map(([year, items]) => (
              <li key={year} className="grid gap-4 rounded-card border border-line bg-card p-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start sm:gap-6 sm:p-6">
                <b className="font-mono text-[34px] leading-none font-semibold tracking-tight sm:pt-3 sm:text-[40px]">{year}</b>
                <ul className="flex flex-col gap-2.5">
                  {items.map((r) => {
                    const url = mediaUrl(r.file ?? null);
                    const meta = [r.publishedOn && t(p.reportsPublished, { date: formatDate(r.publishedOn, locale) }), r.file?.ext?.replace('.', '').toUpperCase(), fileSize(r.file?.size)].filter(Boolean).join(' · ');
                    return (
                      <li key={r.documentId} className={cx('flex flex-wrap items-center gap-x-5 gap-y-3 rounded-tile p-4 sm:p-5', r.isCorrection ? 'border border-line' : 'bg-bg')}>
                        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-accent-ink"><FileText size={20} /></span>
                        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{r.title || t(p.reportsYear, { year })}</span>
                            {r.docType === 'balance' ? (
                              <span className={badge.accent}>{p.reportsBalance}</span>
                            ) : (
                              <span className={r.isCorrection ? badge.lime : badge.accent}>{r.isCorrection ? p.reportsCorrection : p.reportsOriginal}</span>
                            )}
                          </div>
                          {(meta || r.note) && <span className="text-sm text-muted">{[meta, r.note].filter(Boolean).join(' — ')}</span>}
                        </div>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" download className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-ink px-4 text-[15px] font-semibold transition-colors hover:bg-ink hover:text-white">
                            <Download /> {p.reportsDownload}
                          </a>
                        ) : (
                          <span className="text-sm text-muted">{p.reportsNoFile}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.reports, url: pageUrl(locale, '/reports') }])} />
    </>
  );
}
