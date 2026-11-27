import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Glyph from '@/components/concept/Glyph';
import { Arrow, PageHead } from '@/components/concept/parts';
import { isLocale } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
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
      <PageHead locale={locale} crumbs={trail(dict, 'reports')} crumbsLabel={dict.nav.breadcrumbs} title={p.reportsTitle} intro={p.reportsIntro} />
      <section className="section section-tight">
        <div className="wrap">
          {years.size === 0 ? (
            <div className="empty">
              <Glyph i={6} className="empty-glyph" />
              <p>{p.reportsEmpty}</p>
            </div>
          ) : (
            [...years].map(([year, items]) => (
              <div key={year} className="year">
                <h2 className="display year-n">{year}</h2>
                <ul className="reps">
                  {items.map((r) => {
                    const url = mediaUrl(r.file ?? null);
                    const meta = [r.publishedOn && t(p.reportsPublished, { date: formatDate(r.publishedOn, locale) }), fileSize(r.file?.size)].filter(Boolean).join(' · ');
                    const tag = r.docType === 'balance' ? p.reportsBalance : r.isCorrection ? p.reportsCorrection : p.reportsOriginal;
                    return (
                      <li key={r.documentId} className="rep">
                        <span className="rep-ic" aria-hidden="true">{r.file?.ext?.replace('.', '').toUpperCase() || 'PDF'}</span>
                        <div>
                          <p className="rep-t">{r.title || t(p.reportsYear, { year })} <span className={`badge${r.isCorrection ? ' badge-lime' : r.docType === 'balance' ? ' badge-soft' : ''}`}>{tag}</span></p>
                          {(meta || r.note) && <p className="muted small-t">{[meta, r.note].filter(Boolean).join(' — ')}</p>}
                        </div>
                        {url ? (
                          <a className="btn btn-ghost" href={url} target="_blank" rel="noopener noreferrer" download>{p.reportsDownload} <Arrow /></a>
                        ) : (
                          <span className="muted small-t">{p.reportsNoFile}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
