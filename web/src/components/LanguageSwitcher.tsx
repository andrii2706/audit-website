"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LOCALE_COOKIE,
  localeNames,
  locales,
  type Locale,
} from "@/i18n/config";

type Props = {
  locale: Locale;
  label: string;
  dark?: boolean;
  onNavigate?: () => void;
};

export default function LanguageToggle({
  locale,
  label,
  dark = false,
  onNavigate,
}: Props) {
  const pathname = usePathname() || `/${locale}`;
  const rest = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");

  return (
    <nav className={`lang${dark ? " lang-dark" : ""}`} aria-label={label}>
      {locales.map((l) => {
        const current = l === locale;
        return (
          <Link
            key={l}
            href={`/${l}${rest}`}
            hrefLang={l}
            lang={l}
            title={localeNames[l]}
            aria-current={current ? "true" : undefined}
            onClick={(e) => {
              if (current) {
                e.preventDefault();
                return;
              }
              document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
              onNavigate?.();
            }}
          >
            <span aria-hidden="true">{l.toUpperCase()}</span>
            <span className="sr-only">{localeNames[l]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
