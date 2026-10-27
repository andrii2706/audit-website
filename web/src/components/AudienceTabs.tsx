'use client';

import Link from 'next/link';
import { useRef, useState, type KeyboardEvent } from 'react';
import type { Locale } from '@/i18n/config';
import type { Audience } from '@/lib/strapi';
import { cardHover } from './ui';

type Props = { locale: Locale; items: Audience[]; labels: { details: string; pickFormat: string; tablist: string } };

/**
 * Tabs that behave like native app tabs: on phones the tab row scrolls sideways with snapping,
 * arrow keys move between tabs (WAI-ARIA tabs pattern).
 */
export default function AudienceTabs({ locale, items, labels }: Props) {
  const [active, setActive] = useState(Math.min(1, items.length - 1));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
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
          className="scrollbar-none flex snap-x snap-mandatory scroll-px-1.5 gap-1.5 overflow-x-auto rounded-full bg-bg p-1.5 sm:inline-flex sm:flex-wrap sm:overflow-visible"
        >
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
              className="h-11 shrink-0 cursor-pointer snap-start rounded-full px-5 text-[15px] font-semibold whitespace-nowrap text-ink transition-colors aria-selected:bg-ink aria-selected:text-white"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div key={active} id="aud-panel" role="tabpanel" aria-labelledby={`aud-tab-${active}`} className="grid animate-fade-in gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
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
