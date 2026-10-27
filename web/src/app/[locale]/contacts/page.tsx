import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd, PageHero } from '@/components/bits';
import LeadForm from '@/components/LeadForm';
import { container } from '@/components/ui';
import { isLocale } from '@/i18n/config';
import { t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { formatPhone, telHref } from '@/lib/format';
import { breadcrumbLd, buildMetadata, pageUrl } from '@/lib/seo';
import { getGlobal } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDictionary(locale);
  return buildMetadata({ locale, path: '/contacts', title: d.pages.contactsTitle, description: d.pages.contactsIntro });
}

const row = 'flex flex-col gap-1 border-b border-line py-4 last:border-0';
const label = 'text-[13px] text-muted';

export default async function ContactsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, g] = await Promise.all([getDictionary(locale), getGlobal(locale)]);
  const f = dict.footer;
  const msgs = [
    { label: 'Telegram', url: g?.telegramUrl },
    { label: 'Viber', url: g?.viberUrl },
    { label: 'WhatsApp', url: g?.whatsappUrl },
  ].filter((m) => !!m.url);

  return (
    <>
      <PageHero crumbLabel={dict.nav.breadcrumbs} crumbs={[{ name: dict.nav.home, href: `/${locale}` }, { name: dict.nav.contacts }]} title={dict.pages.contactsTitle} intro={dict.pages.contactsIntro} />
      <div className={`${container} grid items-start gap-8 pb-16 sm:pb-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12`}>
        <div className="animate-fade-up rounded-card border border-line bg-card px-6 py-2 sm:px-8">
          {g?.phone && (
            <div className={row}><span className={label}>{f.phone}</span><a href={telHref(g.phone)} className="cursor-pointer text-xl font-semibold hover:text-accent sm:text-2xl">{formatPhone(g.phone)}</a></div>
          )}
          {g?.email && (
            <div className={row}><span className={label}>{f.email}</span><a href={`mailto:${g.email}`} className="cursor-pointer break-all text-lg hover:text-accent">{g.email}</a></div>
          )}
          {g?.address && (
            <div className={row}><span className={label}>{f.address}</span><span className="text-lg">{g.address}</span><span className="text-sm text-muted">{f.online}</span></div>
          )}
          {msgs.length > 0 && (
            <div className={row}>
              <span className={label}>{dict.pages.messengers}</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {msgs.map((m) => (
                  <a key={m.label} href={m.url!} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 cursor-pointer items-center rounded-full border border-line px-4 font-semibold hover:border-ink">{m.label}</a>
                ))}
              </div>
            </div>
          )}
          <div className={row}>
            <span className={label}>{dict.pages.requisites}</span>
            <span>{g?.legalName}</span>
            <span className="text-sm text-muted">{[g?.edrpou && t(f.edrpou, { code: g.edrpou }), g?.registryNumber && t(f.registry, { n: g.registryNumber })].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
        <div className="animate-fade-up rounded-card bg-accent-soft p-2 [animation-delay:120ms] sm:p-3">
          <h2 className="px-4 pt-4 text-2xl font-semibold tracking-tight sm:px-6 sm:pt-6">{dict.pages.contactsForm}</h2>
          <LeadForm locale={locale} dict={dict.form} variant="compact" sourcePage={`/${locale}/contacts`} className="rounded-card bg-card p-5 sm:p-6 mt-4" />
        </div>
      </div>
      <JsonLd data={breadcrumbLd([{ name: dict.nav.home, url: pageUrl(locale) }, { name: dict.nav.contacts, url: pageUrl(locale, '/contacts') }])} />
    </>
  );
}
