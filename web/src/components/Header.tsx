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
      <div className="mx-auto flex h-10 max-w-[1240px] items-center gap-5 px-6 lg:gap-6 2xl:max-w-[1400px]">
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
  // Phones: a solid strip behind the pill (also painted upwards with a shadow, so nothing shows under the status bar or an
  // in-app browser's top bar). From `sm` the pill floats on its own over the page.
  return (
    <ScrollHeader className="group/header sticky top-0 z-30 border-b border-transparent bg-bg px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2 shadow-[0_-100vh_0_0_var(--color-bg)] transition-[padding,border-color] duration-500 ease-(--ease-out-expo) group-data-scrolled/header:border-line sm:border-b-0 sm:bg-transparent sm:px-6 sm:pt-4 sm:pb-0 sm:shadow-none sm:group-data-scrolled/header:pt-2.5">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 rounded-full 2xl:max-w-[1400px] border border-line bg-white py-2 pr-2 pl-4 transition-[background-color,box-shadow,border-color] duration-500 ease-(--ease-out-expo) group-data-scrolled/header:border-line-strong group-data-scrolled/header:shadow-[0_14px_40px_-22px_rgba(11,18,32,0.35)] sm:gap-6 xl:gap-4 2xl:gap-6 sm:bg-white/85 sm:py-2.5 sm:pr-2.5 sm:pl-5 sm:backdrop-blur-md sm:group-data-scrolled/header:bg-white/92">
        <Logo name={name} locale={locale} tagline={global?.tagline} />
        <nav aria-label={dict.nav.mainMenu} className="hidden min-w-0 flex-1 justify-center gap-1 text-[14px] font-medium xl:flex 2xl:gap-1.5">
          <NavLinks items={nav} />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSwitcher locale={locale} label={dict.nav.language} busyLabel={dict.common.switchingLanguage} />
          </div>
          {global?.phone && (
            <a href={telHref(global.phone)} className={`${iconBtn} max-sm:hidden xl:max-2xl:hidden`} aria-label={`${dict.nav.call} ${formatPhone(global.phone)}`}>
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
