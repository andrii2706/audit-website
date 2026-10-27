import { SkGrid, SkHero, SkPage, SkPostCard } from '@/components/Skeletons';
import { container } from '@/components/ui';

export default function Loading() {
  return (
    <SkPage>
      <SkHero />
      <div className={`${container} pb-16 sm:pb-24`}>
        <SkGrid count={6} card={SkPostCard} />
      </div>
    </SkPage>
  );
}
