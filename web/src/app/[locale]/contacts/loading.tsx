import { SkForm, SkHero, SkPage } from '@/components/Skeletons';
import { container } from '@/components/ui';

export default function Loading() {
  return (
    <SkPage>
      <SkHero />
      <div className={`${container} grid items-start gap-8 pb-16 sm:pb-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12`}>
        <div className="flex flex-col gap-6 rounded-card border border-line bg-card p-6 sm:p-8">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 border-b border-line pb-5 last:border-0">
              <div className="skeleton h-3.5 w-24" />
              <div className="skeleton h-6 w-2/3" />
            </div>
          ))}
        </div>
        <SkForm fields={3} />
      </div>
      <div className={`${container} pb-16 sm:pb-24`}>
        <div className="skeleton mb-6 h-8 w-56" />
        <div className="skeleton h-[320px] rounded-card sm:h-[420px] sm:rounded-block" />
      </div>
    </SkPage>
  );
}
