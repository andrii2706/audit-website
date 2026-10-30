import { SkHero, SkPage, SkProse, SkSectionHead } from '@/components/Skeletons';
import { container } from '@/components/ui';

/** Mirrors the about page: hero, intro text + number tiles, the reasons grid and the dark mission block. */
export default function Loading() {
  return (
    <SkPage>
      <SkHero />
      <div className={`${container} grid gap-8 pb-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12`}>
        <SkProse paragraphs={2} />
        <div className="grid grid-cols-2 gap-3 self-start">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton min-h-36 rounded-card" />)}
        </div>
      </div>
      <div className={`${container} py-16 sm:py-24`}>
        <SkSectionHead />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="skeleton min-h-48 rounded-card sm:col-span-2" />
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton min-h-48 rounded-card" />)}
        </div>
      </div>
      <div className={`${container} pb-16`}>
        <div className="skeleton h-[420px] rounded-card sm:rounded-block" />
      </div>
    </SkPage>
  );
}
