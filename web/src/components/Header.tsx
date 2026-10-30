import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import type { Global } from '@/lib/strapi';
import { formatPhone, telHref } from '@/lib/format';
import BrandMark from './BrandMark';
import { ArrowUpRight, Clock, Mail, Phone } from './Icons';
import LanguageSwitcher from './LanguageSwitcher';
import NavLinks from './NavLinks';
import ScrollHeader from './ScrollHeader';
import MobileMenu from './MobileMenu';
import { btn, iconBtn } from './ui';

export type NavItem = { href: string; label: string };

export function navItems(locale: Locale, d: Dictionary): NavItem[] {
  return [
    { href: `/${locale}/services`, label: d.nav.services },
    { href: `/${locale}/about`, label: d.nav.about },
    { href: `/${locale}/team`, label: d.nav.team },
    { href: `/${locale}/career`, label: d.nav.career },
    { href: `/${locale}/reports`, label: d.nav.reports },
    { href: `/${locale}/news`, label: d.nav.news },
    { href: `/${locale}/blog`, label: d.nav.blog },
    { href: `/${locale}/contacts`, label: d.nav.contacts },
  ];
}

export function Logo({ name, locale, tagline }: { name: string; locale: Locale; tagline?: string | null }) {
  return (
    <Link href={`/${locale}`} aria-label={name} className="flex min-w-0 cursor-pointer items-center gap-2.5 text-ink">
      <BrandMark className="h-9 w-auto shrink-0 sm:h-10" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-base font-bold tracking-tight sm:text-lg">{name}</span>
        {tagline && <span className="hidden truncate text-[11px] font-medium text-muted 2xl:block">{tagline}</span>}
      </span>
    </Link>
  );
}

/** Thin contact strip above the header (tablets and up): hours, e-mail, both phones, "Have a question?". */
export function TopBar({ locale, dict, global }: { locale: Locale; dict: Dictionary; global: Global | null }) {
  if (!global) return null;
  const phones = [global.phone, global.phoneSecondary].filter((p): p is string => !!p);
  const link = 'cursor-pointer whitespace-nowrap transition-colors hover:text-accent-ink';
  return (
    <div className="hidden text-[13px] text-muted md:block">
      <div className="mx-auto flex h-10 max-w-[1240px] items-center gap-5 px-6 lg:gap-6">
        {global.workingHours && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Clock /> {global.workingHours}
          </span>
        )}
        {global.email && (
          <a href={`mailto:${global.email}`} className={`${link} inline-flex items-center gap-1.5 max-lg:hidden`}>
            <Mail /> {global.email}
          </a>
        )}
        <div className="ml-auto flex items-center gap-4 lg:gap-5">
          {phones.map((p) => (
            <a key={p} href={telHref(p)} className={`${link} font-semibold text-ink`}>{formatPhone(p)}</a>
          ))}
          <Link href={`/${locale}/contacts`} className={`${link} font-semibold text-accent-ink underline decoration-accent/30 underline-offset-4 hover:decoration-accent`}>
            {dict.nav.questions}
          </Link>
        </div>
      </div>
    </div>
  );
}

type Props = { locale: Locale; dict: Dictionary; global: Global | null };

export default function Header({ locale, dict, global }: Props) {
  const name = global?.siteName ?? dict.meta.siteName;
  const nav = navItems(locale, dict);
  return (
    <ScrollHeader className="group/header sticky top-0 z-30 px-3 pt-2.5 transition-[padding] duration-500 ease-(--ease-out-expo) sm:px-6 sm:pt-4 sm:group-data-scrolled/header:pt-2.5">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 rounded-full border border-line bg-white/85 py-2 pr-2 pl-4 backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-500 ease-(--ease-out-expo) group-data-scrolled/header:border-line-strong group-data-scrolled/header:bg-white/92 group-data-scrolled/header:shadow-[0_14px_40px_-22px_rgba(11,18,32,0.35)] sm:gap-6 sm:py-2.5 sm:pr-2.5 sm:pl-5">
        <Logo name={name} locale={locale} tagline={global?.tagline} />
        <nav aria-label={dict.nav.mainMenu} className="hidden min-w-0 flex-1 justify-center gap-0 text-[14px] font-medium xl:flex">
          <NavLinks items={nav} />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSwitcher locale={locale} label={dict.nav.language} busyLabel={dict.common.switchingLanguage} />
          </div>
          {global?.phone && (
            <a href={telHref(global.phone)} className={`${iconBtn} max-sm:hidden`} aria-label={`${dict.nav.call} ${formatPhone(global.phone)}`}>
              <Phone />
            </a>
          )}
          <Link href={`/${locale}#estimate`} title={dict.nav.orderAudit} className={`${btn.accentSm} max-sm:hidden`}>
            {dict.nav.consultation} <ArrowUpRight />
          </Link>
          <MobileMenu
            locale={locale}
            nav={nav}
            phones={[global?.phone, global?.phoneSecondary].filter((p): p is string => !!p)}
            email={global?.email ?? null}
            hours={[global?.workingHours, global?.workingHoursNote].filter((h): h is string => !!h)}
            name={name}
            labels={{ open: dict.nav.openMenu, close: dict.nav.closeMenu, menu: dict.nav.menu, cta: dict.nav.getConsultation, language: dict.nav.language, switching: dict.common.switchingLanguage }}
          />
        </div>
      </div>
    </ScrollHeader>
  );
}
