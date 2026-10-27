/**
 * Loading skeletons that mirror the real page blocks (same grid, paddings and radii), so the switch
 * from skeleton to content doesn't shift the layout. Used by the `loading.tsx` files of each route.
 * Server components — no JS needed; the shimmer is the `skeleton` utility in globals.css.
 */
import type { ReactNode } from 'react';
import { cx } from '@/lib/format';
import SkeletonStatus from './SkeletonStatus';
import { container } from './ui';

const Bar = ({ className }: { className?: string }) => <div className={cx('skeleton', className)} />;

/** Page wrapper: announces loading to screen readers, fades in so very fast loads don't flash. */
export function SkPage({ children }: { children: ReactNode }) {
  return (
    <div aria-busy="true" className="animate-[fade-in_0.3s_ease-out_0.12s_both]">
      <SkeletonStatus />
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/** Breadcrumbs + h1 + intro (+ optional chip grid / fact tiles), like <PageHero>. */
export function SkHero({ chips = 0, facts = 0, meta = false }: { chips?: number; facts?: number; meta?: boolean }) {
  return (
    <section className="pt-10 pb-8 sm:pt-14 sm:pb-10">
      <div className={container}>
        <Bar className="mb-5 h-4 w-44 sm:mb-6" />
        <Bar className="h-9 w-full max-w-3xl sm:h-12 lg:h-14" />
        <Bar className="mt-3 h-9 w-2/3 max-w-xl sm:h-12 lg:h-14" />
        <Bar className="mt-5 h-5 w-full max-w-3xl" />
        <Bar className="mt-2.5 h-5 w-3/4 max-w-2xl" />
        {meta && <Bar className="mt-4 h-4 w-40" />}
        {chips > 0 && (
          <div className="mt-7 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {Array.from({ length: chips }, (_, i) => <Bar key={i} className={cx('h-11 rounded-full', ['sm:w-32', 'sm:w-44', 'sm:w-36', 'sm:w-52', 'sm:w-28', 'sm:w-40'][i % 6])} />)}
          </div>
        )}
        {facts > 0 && (
          <div className="mt-7 grid max-w-3xl gap-3 sm:mt-8 sm:grid-cols-3">
            {Array.from({ length: facts }, (_, i) => (
              <div key={i} className="flex flex-col gap-2.5 rounded-tile border border-line bg-card p-5">
                <Bar className="h-3.5 w-20" />
                <Bar className="h-6 w-28" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function SkServiceCard() {
  return (
    <div className="flex min-h-[170px] flex-col gap-3 rounded-tile border border-line bg-card p-5 sm:p-6">
      <Bar className="h-5 w-4/5" />
      <Bar className="h-3.5 w-full" />
      <Bar className="h-3.5 w-11/12" />
      <Bar className="mt-auto h-3.5 w-24" />
    </div>
  );
}

export function SkPostCard() {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-card p-2.5 pb-6">
      <Bar className="h-44 rounded-[20px] sm:h-[200px]" />
      <div className="flex flex-col gap-2.5 px-3.5">
        <Bar className="h-3.5 w-28" />
        <Bar className="h-5 w-full" />
        <Bar className="h-5 w-2/3" />
      </div>
    </div>
  );
}

export function SkPersonCard() {
  return (
    <div className="flex flex-col gap-3.5 rounded-card border border-line bg-card p-2.5 pb-5">
      <Bar className="aspect-[4/3.6] rounded-[20px]" />
      <div className="flex flex-col gap-2 px-3">
        <Bar className="h-5 w-3/4" />
        <Bar className="h-3.5 w-1/2" />
        <Bar className="mt-1.5 h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function SkGrid({ count, card, className }: { count: number; card: () => ReactNode; className?: string }) {
  return <div className={cx('grid gap-3', className ?? 'sm:grid-cols-2 lg:grid-cols-3')}>{Array.from({ length: count }, (_, i) => <div key={i}>{card()}</div>)}</div>;
}

/** Section title block, like <SectionHead>. */
export function SkSectionHead() {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:mb-8">
      <Bar className="h-3.5 w-28" />
      <Bar className="h-8 w-full max-w-md sm:h-10" />
    </div>
  );
}

export function SkSteps({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3.5 rounded-3xl border border-line bg-card p-6">
          <Bar className="size-11 rounded-full" />
          <Bar className="h-5 w-3/4" />
          <Bar className="h-3.5 w-full" />
          <Bar className="h-3.5 w-5/6" />
        </div>
      ))}
    </div>
  );
}

/** Lead form card (sidebar / contacts). */
export function SkForm({ fields = 3 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5 rounded-card border border-line bg-card p-5 sm:p-6">
      <Bar className="h-6 w-2/3" />
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Bar className="h-3.5 w-24" />
          <Bar className="h-[50px] rounded-[14px]" />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">{['w-24', 'w-20', 'w-28', 'w-16'].map((w) => <Bar key={w} className={cx('h-11 rounded-full', w)} />)}</div>
      <Bar className="h-13 rounded-full" />
    </div>
  );
}

/** Rich-text body (article / service description). */
export function SkProse({ paragraphs = 3 }: { paragraphs?: number }) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {Array.from({ length: paragraphs }, (_, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-11/12" />
          <Bar className="h-4 w-3/5" />
        </div>
      ))}
    </div>
  );
}
