import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConceptForm from '@/components/concept/ConceptForm';
import { Label, MapCard, PageHead, Phones } from '@/components/concept/parts';
import { isLocale } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { getGlobal } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDictionary(locale);
  return buildMetadata({ locale, path: '/contacts', title: d.pages.contactsTitle, description: d.pages.contactsIntro });
}

export default async function ContactsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, g] = await Promise.all([getDictionary(locale), getGlobal(locale)]);
  const f = dict.footer;
  const requisites = [g?.edrpou && t(f.edrpou, { code: g.edrpou }), g?.registryNumber && t(f.registry, { n: g.registryNumber })].filter(Boolean).join(' · ');
  const msgs = [
    { label: 'Telegram', url: g?.telegramUrl },
    { label: 'Viber', url: g?.viberUrl },
    { label: 'WhatsApp', url: g?.whatsappUrl },
  ].filter((m) => !!m.url);

  return (
    <>
      <PageHead locale={locale} crumbs={trail(dict, 'contacts')} crumbsLabel={dict.nav.breadcrumbs} title={dict.pages.contactsTitle} intro={dict.pages.contactsIntro} />
      <section className="section section-tight">
        <div className="wrap contacts">
          <div className="card contacts-card">
            <dl className="map-dl map-dl-light">
              {g?.phone && <div><dt>{g.phoneSecondary ? f.phones : f.phone}</dt><dd><Phones g={g} /></dd></div>}
              {g?.email && <div><dt>{f.email}</dt><dd><a href={`mailto:${g.email}`}>{g.email}</a></dd></div>}
              {g?.address && <div><dt>{f.address}</dt><dd>{g.address}</dd></div>}
              {(g?.workingHours || g?.workingHoursNote) && <div><dt>{f.hours}</dt><dd>{g?.workingHours}{g?.workingHoursNote && <><br />{g.workingHoursNote}</>}</dd></div>}
              {msgs.length > 0 && (
                <div><dt>{dict.pages.messengers}</dt><dd className="chips c-mt-s">{msgs.map((m) => <a key={m.label} className="chip" href={m.url!} target="_blank" rel="noopener noreferrer">{m.label}</a>)}</dd></div>
              )}
              {g?.legalName && <div><dt>{dict.pages.requisites}</dt><dd data-allow-copy>{g.legalName}{requisites && <><br /><span className="mono">{requisites}</span></>}</dd></div>}
            </dl>
          </div>
          <ConceptForm locale={locale} dict={dict.form} title={dict.pages.contactsForm} sourcePage={`/${locale}/contacts`} />
        </div>
      </section>
      {g && (g.mapQuery || g.address) && (
        <section className="section section-tight" id="contacts-map" aria-label={dict.pages.contactsMap}>
          <div className="wrap">
            <Label>{dict.pages.contactsMap}</Label>
            <div className="map-wrap">
              <MapCard
                locale={locale}
                g={g}
                labels={{ title: t(dict.pages.mapTitle, { address: g.address ?? '' }), heading: dict.pages.contactsMap, office: dict.pages.mapOffice, phone: dict.pages.mapPhone, email: dict.pages.mapEmail, hours: f.hours, open: dict.pages.mapOpen, route: dict.pages.mapRoute }}
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
