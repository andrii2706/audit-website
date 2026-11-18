'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { PALETTE_EVENT } from './gsap';

export const PALETTES = ['b', 'c'] as const;
export type Palette = (typeof PALETTES)[number];
const KEY = 'bp-palette';

/**
 * Inline script for <head>: applies the palette the visitor picked earlier before the first paint (no flash).
 * Kept tiny and self-contained; the CSP allows inline scripts (Next.js needs them anyway).
 */
export const paletteBootScript = `try{var p=localStorage.getItem('${KEY}');if(p==='b'||p==='c')document.documentElement.setAttribute('data-palette',p)}catch(e){}`;

const noop = () => () => {};

/**
 * Puts the visitor's palette on <html> before the first paint and keeps it there.
 * - First load: an inline <script> rendered on the server runs before the page paints (no flash). During hydration
 *   React keeps that server-rendered tag; it is never created again in the browser, because React does not run
 *   scripts it renders on the client (and warns about them) — e.g. after switching the language, when the
 *   [locale] layout renders anew.
 * - Every render after that (language switch included): the layout sets <html data-palette> back to the default,
 *   so the stored choice is put back right after React's DOM update, before the browser paints.
 * Render it first inside <body>, only when the switcher is shown.
 */
export function PaletteBoot() {
  const serverHtml = useSyncExternalStore(noop, () => false, () => true); // true on the server and during hydration
  useLayoutEffect(() => {
    try {
      const p = localStorage.getItem(KEY);
      if ((p === 'b' || p === 'c') && document.documentElement.getAttribute('data-palette') !== p) {
        document.documentElement.setAttribute('data-palette', p);
        window.dispatchEvent(new Event(PALETTE_EVENT));
      }
    } catch {}
  });
  return serverHtml ? <script id="palette-boot" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: paletteBootScript }} /> : null;
}

/** Demo control (bottom left): switch between palette B (graphite) and C (warm) to show both to the client. */
export default function PaletteSwitcher({ labels }: { labels: { palette: string; b: string; c: string } }) {
  // The palette lives on <html data-palette>; read it from there (null on the server, so nothing is pressed until hydration).
  const current = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(PALETTE_EVENT, onChange);
      return () => window.removeEventListener(PALETTE_EVENT, onChange);
    },
    () => (document.documentElement.getAttribute('data-palette') === 'c' ? 'c' : 'b'),
    () => null,
  );
  const pick = (p: Palette) => {
    document.documentElement.setAttribute('data-palette', p);
    try { localStorage.setItem(KEY, p); } catch {}
    window.dispatchEvent(new Event(PALETTE_EVENT));
  };
  const swatch = { b: '#1c2128', c: '#c2a878' };
  return (
    <div className="pal" role="group" aria-label={labels.palette}>
      <span className="pal-l">{labels.palette}</span>
      {PALETTES.map((p) => (
        <button key={p} type="button" aria-pressed={current === p} onClick={() => pick(p)}>
          <i style={{ background: swatch[p] }} />
          {p.toUpperCase()}
          <span className="pal-n"> · {labels[p]}</span>
        </button>
      ))}
    </div>
  );
}
