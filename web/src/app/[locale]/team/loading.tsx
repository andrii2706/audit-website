import { SkGrid, SkHero, SkPage, SkPersonCard } from '@/components/Skeletons';
import { container } from '@/components/ui';

export default function Loading() {
  return (
    <SkPage>
      <SkHero />
      <div className={`${container} pb-16 sm:pb-24`}>
        <SkGrid count={8} card={SkPersonCard} className="grid-cols-1 xs:grid-cols-2 lg:grid-cols-4" />
      </div>
    </SkPage>
  );
}
