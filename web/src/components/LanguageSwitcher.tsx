'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { LOCALE_COOKIE, localeNames, locales, type Locale } from '@/i18n/config';
import { cx } from '@/lib/format';
import { Check, Chevron, Globe } from './Icons';
import Spinner from './Spinner';

type Props = { locale: Locale; label: string; busyLabel?: string; dark?: boolean };

const remember = (l: Locale) => {
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
};

/** Same page in another language: swap the first path segment. */
function useHrefFor(locale: Locale) {
  const pathname = usePathname() || `/${locale}`;
  const rest = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '');
  return (l: Locale) => `/${l}${rest}`;
}

/**
 * Header language dropdown, styled like the rest of the UI (the native <select> list can't be styled on Windows).
 * Options are real links with hreflang, so they work without JS and are crawlable.
 * Keyboard: Enter/Space/↓ opens, ↑/↓/Home/End move, Esc closes and returns focus.
 */
export default function LanguageSwitcher({ locale, label, busyLabel }: Props) {
  const hrefFor = useHrefFor(locale);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<Locale | null>(null);
  // Navigation finished (locale prop changed) → clear the pending state.
  const [shownLocale, setShownLocale] = useState(locale);
  if (shownLocale !== locale) {
    setShownLocale(locale);
    setSwitching(null);
  }
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const menuId = useId();

  // Close on outside click / focus leaving the component.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const focusItem = (i: number) => itemRefs.current[(i + locales.length) % locales.length]?.focus();

  function openAndFocus(index = locales.indexOf(locale)) {
    setOpen(true);
    requestAnimationFrame(() => focusItem(index));
  }

  function onButtonKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openAndFocus(e.key === 'ArrowUp' ? locales.length - 1 : locales.indexOf(locale));
    }
  }

  function onMenuKey(e: KeyboardEvent) {
    const i = itemRefs.current.findIndex((el) => el === document.activeElement);
    const map: Record<string, number> = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: locales.length - 1 };
    if (e.key in map) {
      e.preventDefault();
      focusItem(map[e.key]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${label}: ${localeNames[locale]}`}
        aria-busy={!!switching}
        onClick={() => (open ? setOpen(false) : openAndFocus())}
        onKeyDown={onButtonKey}
        className={cx(
          'inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors',
          open ? 'border-ink bg-bg' : 'border-line hover:border-ink',
        )}
      >
        {switching ? <Spinner size={16} /> : <Globe size={16} />}
        <span aria-hidden="true">{(switching ?? locale).toUpperCase()}</span>
        <span className={cx('transition-[rotate] duration-300 ease-(--ease-out-expo)', open && 'rotate-180')}><Chevron /></span>
      </button>
      {switching && busyLabel && <span role="status" className="sr-only">{busyLabel}</span>}

      <div
        id={menuId}
        hidden={!open}
        onKeyDown={onMenuKey}
        className="absolute top-[calc(100%+8px)] right-0 z-40 w-56 origin-top-right animate-[menu-in_0.35s_var(--ease-out-expo)] rounded-2xl border border-line bg-card p-1.5 shadow-[0_12px_40px_-12px_rgba(11,18,32,0.25)]"
      >
        <p className="px-3 pt-2 pb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
        <ul className="flex flex-col">
          {locales.map((l, i) => {
            const current = l === locale;
            return (
              <li key={l}>
                <Link
                  ref={(el) => { itemRefs.current[i] = el; }}
                  href={hrefFor(l)}
                  hrefLang={l}
                  lang={l}
                  aria-current={current ? 'true' : undefined}
                  onClick={(e) => {
                    setOpen(false);
                    if (current) { e.preventDefault(); btnRef.current?.focus(); return; }
                    remember(l);
                    setSwitching(l);
                  }}
                  className={cx(
                    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] outline-none transition-colors hover:bg-bg focus-visible:bg-bg',
                    current ? 'font-semibold text-ink' : 'text-ink/85',
                  )}
                >
                  <span className="inline-flex w-7 font-mono text-xs text-muted uppercase">{l}</span>
                  <span className="flex-1">{localeNames[l]}</span>
                  {current && <span className="text-accent"><Check /></span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Mobile menu variant: all languages visible at once as chips (no nested popup inside a full-screen dialog). */
export function LanguageChips({ locale, label, onNavigate }: { locale: Locale; label: string; onNavigate?: () => void }) {
  const hrefFor = useHrefFor(locale);
  return (
    <nav aria-label={label}>
      <p className="mb-2.5 text-xs font-semibold tracking-wide text-dark-muted uppercase">{label}</p>
      <ul className="flex flex-wrap gap-2">
        {locales.map((l) => {
          const current = l === locale;
          return (
            <li key={l}>
              <Link
                href={hrefFor(l)}
                hrefLang={l}
                lang={l}
                aria-current={current ? 'true' : undefined}
                onClick={() => { if (!current) remember(l); onNavigate?.(); }}
                className={cx(
                  'inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors',
                  current ? 'border-lime bg-lime text-ink' : 'border-dark-line text-white hover:border-white',
                )}
              >
                <span className="font-mono text-xs uppercase opacity-70">{l}</span>
                {localeNames[l]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
