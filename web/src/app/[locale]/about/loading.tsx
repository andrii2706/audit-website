import { SkHero, SkPage, SkSectionHead, SkSteps } from '@/components/Skeletons';
import { container } from '@/components/ui';

export default function Loading() {
  return (
    <SkPage>
      <SkHero />
      <div className={`${container} pb-16`}>
        <div className="skeleton h-[420px] rounded-card sm:rounded-block" />
      </div>
      <div className={`${container} pb-16`}>
        <SkSectionHead />
        <SkSteps />
      </div>
    </SkPage>
  );
}
