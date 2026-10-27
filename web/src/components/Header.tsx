import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import type { Global } from '@/lib/strapi';
import { formatPhone, telHref } from '@/lib/format';
import { ArrowUpRight, Phone } from './Icons';
import LanguageSwitcher from './LanguageSwitcher';
import NavLinks from './NavLinks';
import MobileMenu from './MobileMenu';
import { btn, iconBtn } from './ui';

export type NavItem = { href: string; label: string };

export function navItems(locale: Locale, d: Dictionary): NavItem[] {
  return [
    { href: `/${locale}/services`, label: d.nav.services },
    { href: `/${locale}/audiences`, label: d.nav.audiences },
    { href: `/${locale}/about`, label: d.nav.about },
    { href: `/${locale}/team`, label: d.nav.team },
    { href: `/${locale}/news`, label: d.nav.news },
    { href: `/${locale}/blog`, label: d.nav.blog },
    { href: `/${locale}/contacts`, label: d.nav.contacts },
  ];
}

export function Logo({ name, locale }: { name: string; locale: Locale }) {
  const mark = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <Link href={`/${locale}`} aria-label={name} className="flex min-w-0 cursor-pointer items-center gap-2.5 text-base font-bold tracking-tight text-ink sm:text-lg">
      <span aria-hidden="true" className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-ink text-xs font-bold text-white">
        {mark}
      </span>
      <span className="hidden truncate sm:inline">{name}</span>
    </Link>
  );
}

type Props = { locale: Locale; dict: Dictionary; global: Global | null };

export default function Header({ locale, dict, global }: Props) {
  const name = global?.siteName ?? dict.meta.siteName;
  const nav = navItems(locale, dict);
  return (
    <header className="sticky top-0 z-30 px-3 pt-2.5 sm:px-6 sm:pt-4">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 rounded-full border border-line bg-white/85 py-2 pr-2 pl-4 backdrop-blur-md sm:gap-6 sm:py-2.5 sm:pr-2.5 sm:pl-5">
        <Logo name={name} locale={locale} />
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
          <Link href={`/${locale}#estimate`} className={`${btn.accentSm} max-sm:hidden`}>
            {dict.nav.consultation} <ArrowUpRight />
          </Link>
          <MobileMenu
            locale={locale}
            nav={nav}
            phone={global?.phone ?? null}
            name={name}
            labels={{ open: dict.nav.openMenu, close: dict.nav.closeMenu, menu: dict.nav.menu, cta: dict.nav.getConsultation, language: dict.nav.language, switching: dict.common.switchingLanguage }}
          />
        </div>
      </div>
    </header>
  );
}
