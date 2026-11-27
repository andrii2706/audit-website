import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileMenu from "@/components/MobileMenu";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Global } from "@/lib/strapi";
import HeaderShell, { ConceptNav } from "./HeaderShell";
import { UpRight } from "./parts";
import ThemeToggle from './ThemeToggle';

export function conceptNav(locale: Locale, d: Dictionary) {
  return [
    { href: `/${locale}/services`, label: d.nav.services },
    { href: `/${locale}/about`, label: d.nav.about },
    { href: `/${locale}/audiences`, label: d.nav.audiences },
    { href: `/${locale}/team`, label: d.nav.team },
    { href: `/${locale}/career`, label: d.nav.career },
    { href: `/${locale}/reports`, label: d.nav.reports },
    { href: `/${locale}/news`, label: d.nav.news },
    { href: `/${locale}/blog`, label: d.nav.blog },
    { href: `/${locale}/contacts`, label: d.nav.contacts },
  ];
}

/** Square editorial header: logo, menu, language, "Send a request"; a full-screen menu below 1280px. */
export default function SiteHeader({
  locale,
  dict,
  global,
}: {
  locale: Locale;
  dict: Dictionary;
  global: Global | null;
}) {
  const name = global?.siteName ?? dict.meta.siteName;
  const nav = conceptNav(locale, dict);
  return (
    <HeaderShell>
      <div className="wrap">
        <div className="bar">
          <Link className="brand" href={`/${locale}`} aria-label={name}>
            <BrandMark className="logo-mark" />
            <span>{name}</span>
          </Link>
          <ConceptNav items={nav} label={dict.nav.mainMenu} />
          <div className="bar-end">

            <ThemeToggle locale={locale} />
            <div className="max-md:hidden">
              <LanguageSwitcher
                locale={locale}
                label={dict.nav.language}
              />
            </div>
            <Link
              className="btn btn-accent btn-sm max-[420px]:hidden"
              href={`/${locale}/request`}
            >
              {dict.nav.consultation} <UpRight />
            </Link>
            <MobileMenu
              locale={locale}
              nav={nav}
              phones={[global?.phone, global?.phoneSecondary].filter(
                (p): p is string => !!p,
              )}
              email={global?.email ?? null}
              hours={[global?.workingHours, global?.workingHoursNote].filter(
                (h): h is string => !!h,
              )}
              name={name}
              labels={{
                open: dict.nav.openMenu,
                close: dict.nav.closeMenu,
                menu: dict.nav.menu,
                cta: dict.nav.getConsultation,
                language: dict.nav.language,
                switching: dict.common.switchingLanguage,
              }}
            />
          </div>
        </div>
      </div>
    </HeaderShell>
  );
}
