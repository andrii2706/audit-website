import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ContactSection from '@/components/concept/ContactSection';
import Glyph from '@/components/concept/Glyph';
import { Arrow, PageHead, num } from '@/components/concept/parts';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { getAudiences, getCategories, getHomepage } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDictionary(locale);
  return buildMetadata({ locale, path: '/audiences', title: d.pages.audiencesTitle, description: d.pages.audiencesIntro });
}

/** Who we work for: one row per audience with the services it usually needs, then the request form. */
export default async function AudiencesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, audiences, home, categories] = await Promise.all([getDictionary(locale), getAudiences(locale), getHomepage(locale), getCategories(locale)]);
  return (
    <>
      <PageHead locale={locale} crumbs={trail(dict, 'audiences')} crumbsLabel={dict.nav.breadcrumbs} title={home?.audienceTitle || dict.pages.audiencesTitle} intro={dict.pages.audiencesIntro} />
      {audiences.map((a, i) => (
        <section key={a.documentId} className="section section-tight" id={`aud-${i}`} aria-labelledby={`aud-${i}-title`}>
          <div className="wrap aud-row">
            <div className="aud-intro">
              <Glyph i={i + 1} className="aud-big" />
              <span className="mono muted">{num(i)}{a.label ? ` · ${a.label}` : ''}</span>
              <h2 id={`aud-${i}-title`} className="display h3">{a.title}</h2>
              {a.description && <p className="muted">{a.description}</p>}
            </div>
            <ul className="svc-links">
              {a.services.map((sv) => (
                <li key={sv.documentId}>
                  <Link className="svc-link" href={`/${locale}/services/${sv.slug}`}><span>{sv.title}</span><Arrow /></Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
      <ContactSection locale={locale} dict={dict} home={home} serviceOptions={[...categories.map((cat) => cat.name), dict.form.other]} id="aud-contact" sourcePage={`/${locale}/audiences`} />
    </>
  );
}
