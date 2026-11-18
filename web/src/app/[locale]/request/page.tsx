import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConceptForm from '@/components/concept/ConceptForm';
import { PageHead, Phones, Tick } from '@/components/concept/parts';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { getCategories, getGlobal, getHomepage } from '@/lib/strapi';

export const revalidate = 3600;
/** Used until the dictionaries have the request-page texts (scripts/apply-form-update.mjs adds them). */
const FALLBACK = {
  uk: { requestTitle: 'Залишити заявку', requestIntro: 'Розкажіть коротко про задачу — відповімо там, де вам зручно: у Telegram, Viber, WhatsApp, дзвінком або на e-mail.', requestAbout: 'Як з нами зв’язатися' },
  en: { requestTitle: 'Send a request', requestIntro: 'Tell us briefly about the task and we will reply where it suits you: Telegram, Viber, WhatsApp, a call or e-mail.', requestAbout: 'How to reach us' },
} as const;
const texts = (locale: 'uk' | 'en', dictPages: object) => {
  const pages = dictPages as Partial<Record<keyof (typeof FALLBACK)['uk'], string>>;
  return {
    requestTitle: pages.requestTitle ?? FALLBACK[locale].requestTitle,
    requestIntro: pages.requestIntro ?? FALLBACK[locale].requestIntro,
    requestAbout: pages.requestAbout ?? FALLBACK[locale].requestAbout,
  };
};
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDictionary(locale);
  const p = texts(locale, d.pages);
  return buildMetadata({ locale, path: '/request', title: p.requestTitle, description: p.requestIntro });
}

/**
 * The request form on a page of its own (header and footer buttons lead here): the full form with service and revenue
 * questions (three steps on phones) next to the request text and bullets of the home page and the contacts from the CMS.
 */
export default async function RequestPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, g, home, categories] = await Promise.all([getDictionary(locale), getGlobal(locale), getHomepage(locale), getCategories(locale)]);
  const f = dict.footer;
  const p = texts(locale, dict.pages);

  return (
    <>
      <PageHead locale={locale} crumbs={trail(dict, 'request')} crumbsLabel={dict.nav.breadcrumbs} title={p.requestTitle} intro={p.requestIntro} />
      <section className="section section-tight">
        <div className="wrap contacts request">
          <div className="card contacts-card">
            <h2 className="display req-t">{home?.estimateTitle || p.requestAbout}</h2>
            {home?.estimateText && <p className="muted c-mt-s">{home.estimateText}</p>}
            {!!home?.estimateBullets?.length && (
              <ul className="bullets">
                {home.estimateBullets.map((b) => <li key={b.id}><Tick />{b.text}</li>)}
              </ul>
            )}
            <dl className="map-dl map-dl-light">
              {g?.phone && <div><dt>{g.phoneSecondary ? f.phones : f.phone}</dt><dd><Phones g={g} /></dd></div>}
              {g?.email && <div><dt>{f.email}</dt><dd><a href={`mailto:${g.email}`}>{g.email}</a></dd></div>}
              {(g?.workingHours || g?.workingHoursNote) && <div><dt>{f.hours}</dt><dd>{g?.workingHours}{g?.workingHoursNote && <><br />{g.workingHoursNote}</>}</dd></div>}
            </dl>
          </div>
          <ConceptForm
            locale={locale}
            dict={dict.form}
            variant="estimate"
            serviceOptions={[...categories.map((c) => c.name), dict.form.other]}
            sourcePage={`/${locale}/request`}
          />
        </div>
      </section>
    </>
  );
}
