'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { Locale } from '@/i18n/config';
import './theme-dark.css';

/**
 * Light and dark theme (approved design 27.11). The theme lives on <html data-theme="light|dark">; the colours of
 * the dark variant of every palette are in theme-dark.css, which this module imports, so it ships with ThemeBoot
 * (rendered by the root layout on every page).
 *
 * The visitor's choice is kept in localStorage ('light' | 'dark'). Without a choice the site follows the device
 * setting (prefers-color-scheme) and keeps following it while the page is open.
 */
export type Theme = 'light' | 'dark';
const KEY = 'bp-theme';
export const THEME_EVENT = 'bp-theme';

/**
 * Inline script for the start of <body>: puts the theme on <html> before the first paint, so a dark page never
 * flashes white. Tiny and self-contained; the CSP allows inline scripts (Next.js needs them anyway).
 */
export const themeBootScript = `try{var t=localStorage.getItem('${KEY}');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

function stored(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

function apply(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  window.dispatchEvent(new Event(THEME_EVENT));
}

const noop = () => () => {};

/**
 * Render once, first inside <body> (root layout). On the server it outputs the boot script; in the browser it keeps
 * following the device setting until the visitor picks a theme. React leaves <html data-theme> alone afterwards: the
 * layout doesn't render that attribute, so re-renders (a language switch) never reset it.
 */
export function ThemeBoot() {
  const serverHtml = useSyncExternalStore(noop, () => false, () => true); // true on the server and during hydration
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const follow = () => { if (!stored()) apply(mq.matches ? 'dark' : 'light'); };
    mq.addEventListener('change', follow);
    return () => mq.removeEventListener('change', follow);
  }, []);
  return serverHtml ? <script id="theme-boot" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootScript }} /> : null;
}

const TEXT: Record<Locale, { toDark: string; toLight: string }> = {
  uk: { toDark: 'Увімкнути темну тему', toLight: 'Увімкнути світлу тему' },
  en: { toDark: 'Switch to dark theme', toLight: 'Switch to light theme' },
};

/**
 * Header button: a moon in the light theme, a sun in the dark one. Put it into SiteHeader's `.bar-end`, before the
 * language switcher; it stays visible on phones too.
 */
export default function ThemeToggle({ locale, labels }: { locale: Locale; labels?: Partial<(typeof TEXT)['uk']> }) {
  const theme = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(THEME_EVENT, onChange);
      return () => window.removeEventListener(THEME_EVENT, onChange);
    },
    () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'),
    () => null,
  );
  const text = { ...(TEXT[locale] ?? TEXT.uk), ...labels };
  const dark = theme === 'dark';
  const label = dark ? text.toLight : text.toDark;
  const toggle = () => {
    const next: Theme = dark ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch {}
    apply(next);
  };
  return (
    // Until hydration the theme is unknown on the server: both icons are rendered and CSS shows the right one.
    <button type="button" className="theme-btn" onClick={toggle} aria-label={theme ? label : text.toDark} title={theme ? label : undefined}>
      <svg className="theme-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
      </svg>
      <svg className="theme-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
