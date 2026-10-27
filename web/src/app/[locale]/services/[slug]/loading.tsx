import { SkForm, SkHero, SkPage, SkProse, SkSteps } from '@/components/Skeletons';
import { container } from '@/components/ui';

export default function Loading() {
  return (
    <SkPage>
      <SkHero facts={3} />
      <div className={`${container} grid items-start gap-10 pb-16 sm:pb-24 lg:grid-cols-[minmax(0,1fr)_360px]`}>
        <div className="flex min-w-0 flex-col gap-12">
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-[72px] rounded-tile" />)}
          </div>
          <SkProse paragraphs={2} />
          <SkSteps count={4} />
        </div>
        <SkForm />
      </div>
    </SkPage>
  );
}
