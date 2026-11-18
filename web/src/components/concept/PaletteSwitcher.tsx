'use client';

import { useSyncExternalStore } from 'react';
import { PALETTE_EVENT } from './gsap';

export const PALETTES = ['b', 'c'] as const;
export type Palette = (typeof PALETTES)[number];
const KEY = 'bp-palette';

/**
 * Inline script for <head>: applies the palette the visitor picked earlier before the first paint (no flash).
 * Kept tiny and self-contained; the CSP allows inline scripts (Next.js needs them anyway).
 */
export const paletteBootScript = `try{var p=localStorage.getItem('${KEY}');if(p==='b'||p==='c')document.documentElement.setAttribute('data-palette',p)}catch(e){}`;

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
