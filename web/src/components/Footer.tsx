import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { t } from '@/i18n/format';
import type { Category, Global } from '@/lib/strapi';
import { formatPhone, telHref } from '@/lib/format';
import { MapPin } from './Icons';
import { container } from './ui';

type Props = { locale: Locale; dict: Dictionary; global: Global | null; categories: Category[]; ctaTitle?: string | null };

const link = 'cursor-pointer text-white transition-colors hover:text-lime';

export default function Footer({ locale, dict, global, categories, ctaTitle }: Props) {
  const f = dict.footer;
  const phones = [global?.phone, global?.phoneSecondary].filter((p): p is string => !!p);
  const msgs = [
    { label: 'Telegram', url: global?.telegramUrl },
    { label: 'Viber', url: global?.viberUrl },
    { label: 'WhatsApp', url: global?.whatsappUrl },
  ].filter((m) => !!m.url);

  return (
    <footer id="contacts" className="bg-ink pb-24 text-white md:pb-0">
      <div className={`${container} flex flex-col gap-10 pt-14 pb-8 sm:gap-12 sm:pt-[72px]`}>
        <div className="flex flex-wrap items-end justify-between gap-6 sm:gap-8">
          <div className="flex max-w-2xl flex-col gap-4">
            <h2 className="text-[34px] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-5xl lg:text-[56px]">{ctaTitle || dict.nav.getConsultation}</h2>
            {global?.footerNote && <p className="text-[15px] leading-relaxed text-dark-muted">{global.footerNote}</p>}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href={`/${locale}#estimate`} className="inline-flex h-13 cursor-pointer items-center rounded-full border border-white bg-white px-6 font-semibold text-ink transition-colors hover:bg-bg">
              {dict.nav.getConsultation}
            </Link>
            {global?.email && (
              <a href={`mailto:${global.email}`} className="inline-flex h-13 cursor-pointer items-center rounded-full border border-[#3a4458] px-6 font-semibold text-white transition-colors hover:border-white">
                {dict.pages.emailUs}
              </a>
            )}
            {msgs.length > 0 && (
              msgs.map((m) => (
                <a
                  key={m.label}
                  href={m.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-13 cursor-pointer items-center rounded-full border border-[#3a4458] px-6 font-semibold text-white transition-colors hover:border-white"
                >
                  {m.label}
                </a>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 border-t border-dark-line pt-10 xs:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2.5 text-[15px]">
            {phones.length > 0 && (
              <>
                <span className="text-[13px] text-dark-muted">{phones.length > 1 ? f.phones : f.phone}</span>
                {phones.map((p) => (
                  <a key={p} href={telHref(p)} className={`${link} text-xl font-semibold whitespace-nowrap`}>{formatPhone(p)}</a>
                ))}
              </>
            )}
            {global?.email && (
              <>
                <span className="mt-2.5 text-[13px] text-dark-muted">{f.email}</span>
                <a href={`mailto:${global.email}`} className={`${link} break-all`}>{global.email}</a>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2.5 text-[15px]">
            <span className="text-[13px] text-dark-muted">{f.services}</span>
            {categories.map((c) => (
              <Link key={c.documentId} href={`/${locale}/services#${c.slug}`} className={link}>{c.name}</Link>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 text-[15px]">
            <span className="text-[13px] text-dark-muted">{f.company}</span>
            <Link href={`/${locale}/about`} className={link}>{dict.nav.about}</Link>
            <Link href={`/${locale}/team`} className={link}>{dict.nav.team}</Link>
            <Link href={`/${locale}/career`} className={link}>{dict.nav.career}</Link>
            <Link href={`/${locale}/reports`} className={link}>{dict.nav.reports}</Link>
            <Link href={`/${locale}/news`} className={link}>{dict.nav.news}</Link>
            <Link href={`/${locale}/blog`} className={link}>{dict.nav.blog}</Link>
            <Link href={`/${locale}/contacts`} className={link}>{dict.nav.contacts}</Link>
            {global?.socials?.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className={link}>{s.label}</a>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 text-[15px]">
            <span className="text-[13px] text-dark-muted">{f.office}</span>
            {global?.address && <span>{global.address}</span>}
            {global?.mapUrl && (
              <a href={global.mapUrl} target="_blank" rel="noopener noreferrer" className={`${link} inline-flex items-center gap-1.5 self-start text-lime hover:text-white`}>
                <MapPin /> {f.map}
              </a>
            )}
            {(global?.workingHours || global?.workingHoursNote) && <span className="mt-2.5 text-[13px] text-dark-muted">{f.hours}</span>}
            {global?.workingHours && <span>{global.workingHours}</span>}
            {global?.workingHoursNote && <span className="text-dark-muted">{global.workingHoursNote}</span>}
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-4 border-t border-dark-line pt-6 text-[13px] text-dark-muted">
          <span>
            {[global?.legalName, global?.edrpou && t(f.edrpou, { code: global.edrpou }), global?.registryNumber && t(f.registry, { n: global.registryNumber })]
              .filter(Boolean)
              .join(' · ')}
          </span>
          <span>© {new Date().getFullYear()} {global?.siteName ?? dict.meta.siteName}</span>
        </div>
      </div>
    </footer>
  );
}
