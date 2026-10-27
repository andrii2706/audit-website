import { SkHero, SkPage, SkProse } from '@/components/Skeletons';
import { container } from '@/components/ui';

export default function Loading() {
  return (
    <SkPage>
      <SkHero meta />
      <div className={`${container} flex flex-col gap-10 pb-16 sm:pb-24`}>
        <div className="skeleton aspect-[16/8] max-w-5xl rounded-card" />
        <SkProse paragraphs={4} />
      </div>
    </SkPage>
  );
}
