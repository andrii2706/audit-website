import { SkGrid, SkHero, SkPage, SkServiceCard } from '@/components/Skeletons';
import { container } from '@/components/ui';

export default function Loading() {
  return (
    <SkPage>
      <SkHero />
      <div className={`${container} pb-16 sm:pb-24`}>
        <div className="mb-7 flex gap-1.5 overflow-hidden rounded-full bg-bg p-1.5 sm:inline-flex">
          {['w-28', 'w-36', 'w-32', 'w-40', 'w-28'].map((w, i) => <div key={i} className={`skeleton h-11 shrink-0 rounded-full ${w}`} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <SkGrid count={4} card={SkServiceCard} className="sm:grid-cols-2" />
          <div className="skeleton min-h-72 rounded-card" />
        </div>
      </div>
    </SkPage>
  );
}
