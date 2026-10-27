import { SkGrid, SkHero, SkPage, SkServiceCard } from '@/components/Skeletons';
import { container } from '@/components/ui';

export default function Loading() {
  return (
    <SkPage>
      <SkHero chips={6} />
      <div className={`${container} pb-16 sm:pb-24`}>
        {[0, 1].map((i) => (
          <section key={i} className={i ? 'border-t border-line py-10' : 'pb-10'}>
            <div className="skeleton mb-6 h-8 w-64 sm:h-10" />
            <SkGrid count={6} card={SkServiceCard} />
          </section>
        ))}
      </div>
    </SkPage>
  );
}
