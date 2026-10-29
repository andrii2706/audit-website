'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Locale } from '@/i18n/config';
import type { Audience } from '@/lib/strapi';
import { cardHover } from './ui';

type Props = { locale: Locale; items: Audience[]; labels: { details: string; pickFormat: string; tablist: string } };

/**
 * Tabs that behave like native app tabs: on phones the tab row scrolls sideways with snapping,
 * arrow keys move between tabs (WAI-ARIA tabs pattern).
 */
// useLayoutEffect warns on the server; this component only measures in the browser.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function AudienceTabs({ locale, items, labels }: Props) {
  const [active, setActive] = useState(Math.min(1, items.length - 1));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  // Sliding pill behind the active tab. Until it is measured (server render, first paint)
  // the active tab keeps its own dark background, so there is never a frame without a highlight.
  const [pill, setPill] = useState<{ x: number; y: number; w: number } | null>(null);
  const measure = useCallback(() => {
    const el = refs.current[active];
    // offsetTop too: on tablets/desktop the tab row may wrap onto two lines.
    if (el) setPill({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth });
  }, [active]);
  useIsoLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);
  if (!items.length) return null;
  const cur = items[active];

  function select(i: number) {
    setActive(i);
    refs.current[i]?.focus();
    refs.current[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') select((active + 1) % items.length);
    if (e.key === 'ArrowLeft') select((active - 1 + items.length) % items.length);
  }

  return (
    <>
      <div className="-mx-4 mb-7 px-4 sm:mx-0 sm:px-0">
        <div
          role="tablist"
          aria-label={labels.tablist}
          onKeyDown={onKey}
          className="scrollbar-none relative flex snap-x snap-mandatory scroll-px-1.5 gap-1.5 overflow-x-auto rounded-full bg-bg p-1.5 sm:inline-flex sm:flex-wrap sm:overflow-visible"
        >
          {pill && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 h-11 rounded-full bg-ink shadow-[0_8px_20px_-10px_rgba(11,18,32,0.6)] transition-[translate,width] duration-500 ease-(--ease-out-expo)"
              style={{ translate: `${pill.x}px ${pill.y}px`, width: pill.w }}
            />
          )}
          {items.map((a, i) => (
            <button
              key={a.documentId}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="tab"
              id={`aud-tab-${i}`}
              aria-selected={i === active}
              aria-controls="aud-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => select(i)}
              className={`relative h-11 shrink-0 cursor-pointer snap-start rounded-full px-5 text-[15px] font-semibold whitespace-nowrap text-ink transition-colors duration-300 hover:text-accent-ink aria-selected:text-white aria-selected:hover:text-white ${pill ? '' : 'aria-selected:bg-ink'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div key={active} id="aud-panel" role="tabpanel" aria-labelledby={`aud-tab-${active}`} className="grid animate-panel-in gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {cur.services.map((s) => (
            <Link key={s.documentId} href={`/${locale}/services/${s.slug}`} className={`${cardHover} flex flex-col gap-2 rounded-tile border border-line bg-card p-5 sm:p-6`}>
              <b className="text-lg font-semibold tracking-tight">{s.title}</b>
              <span className="text-sm leading-relaxed text-muted">{s.excerpt}</span>
              <span className="mt-auto pt-1.5 text-sm font-semibold text-accent-ink">{labels.details}</span>
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-4 rounded-card bg-ink p-6 text-white sm:p-8">
          <span className="text-sm text-dark-muted">{cur.title}</span>
          <p className="text-xl leading-snug font-medium tracking-tight sm:text-[22px]">{cur.description}</p>
          <Link
            href={`/${locale}#estimate`}
            className="mt-auto inline-flex min-h-13 cursor-pointer items-center justify-center rounded-full bg-white px-5 py-3 text-center font-semibold text-ink transition-colors hover:bg-bg"
          >
            {labels.pickFormat}
          </Link>
        </div>
      </div>
    </>
  );
}
