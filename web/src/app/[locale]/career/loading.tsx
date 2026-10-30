import { SkHero, SkPage, SkProse, SkSectionHead } from '@/components/Skeletons';
import { container } from '@/components/ui';

/** Mirrors the career page: hero with a button, vacancy list, "working here" text + FAQ. */
export default function Loading() {
  return (
    <SkPage>
      <SkHero />
      <div className={`${container} pt-6 pb-16 sm:pb-24`}>
        <SkSectionHead />
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 2 }, (_, i) => <div key={i} className="skeleton h-24 rounded-tile" />)}
        </div>
      </div>
      <div className={`${container} grid gap-10 pb-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14`}>
        <SkProse paragraphs={3} />
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 2 }, (_, i) => <div key={i} className="skeleton h-16 rounded-tile" />)}
        </div>
      </div>
    </SkPage>
  );
}
