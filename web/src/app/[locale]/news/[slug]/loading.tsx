import { SkHero, SkPage, SkProse } from '@/components/Skeletons';
import { container } from '@/components/ui';

export default function Loading() {
  return (
    <SkPage>
      <SkHero meta />
      <div className={`${container} flex flex-col gap-10 pb-16 sm:pb-24`}>
        <SkProse paragraphs={3} />
      </div>
    </SkPage>
  );
}
