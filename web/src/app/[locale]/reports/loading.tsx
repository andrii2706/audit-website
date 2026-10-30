import { SkHero, SkPage } from '@/components/Skeletons';
import { container } from '@/components/ui';

/** Mirrors the reports page: one row per year with a report card. */
export default function Loading() {
  return (
    <SkPage>
      <SkHero />
      <div className={`${container} flex flex-col gap-3 pb-16 sm:pb-24`}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="grid gap-4 rounded-card border border-line bg-card p-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:p-6">
            <div className="skeleton h-10 w-24" />
            <div className="skeleton h-16 rounded-tile" />
          </div>
        ))}
      </div>
    </SkPage>
  );
}
