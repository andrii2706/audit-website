import { SkGrid, SkHero, SkPage, SkPostCard } from '@/components/Skeletons';
import { container } from '@/components/ui';

export default function Loading() {
  return (
    <SkPage>
      <SkHero />
      <div className={`${container} flex flex-col gap-3 pb-16 sm:pb-24`}>
        <div className="skeleton min-h-[260px] rounded-card lg:min-h-[340px]" />
        <SkGrid count={3} card={SkPostCard} />
      </div>
    </SkPage>
  );
}
