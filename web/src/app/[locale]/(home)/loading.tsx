import { SkGrid, SkPage, SkSectionHead, SkServiceCard } from '@/components/Skeletons';
import { container } from '@/components/ui';

/** Home page skeleton: hero (text + side cards) and the services bento. Lives in the (home) route group so it is used only for the home page. */
export default function Loading() {
  return (
    <SkPage>
      <section className="pt-8 pb-12 sm:pt-14 sm:pb-14 lg:pt-[72px]">
        <div className={`${container} grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12`}>
          <div className="flex flex-col gap-5">
            <div className="skeleton h-9 w-72 rounded-full" />
            <div className="skeleton h-12 w-full sm:h-16" />
            <div className="skeleton h-12 w-4/5 sm:h-16" />
            <div className="skeleton h-5 w-full max-w-xl" />
            <div className="skeleton h-5 w-3/4 max-w-lg" />
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {['sm:w-36', 'sm:w-44', 'sm:w-56', 'sm:w-48'].map((c) => <div key={c} className={`skeleton h-11 rounded-full ${c}`} />)}
            </div>
            <div className="grid gap-3 sm:flex">
              <div className="skeleton h-13 rounded-full sm:w-60" />
              <div className="skeleton h-13 rounded-full sm:w-52" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
            <div className="skeleton min-h-[220px] rounded-card xs:col-span-2" />
            <div className="skeleton min-h-40 rounded-card" />
            <div className="skeleton min-h-40 rounded-card" />
          </div>
        </div>
      </section>
      <section className={`${container} pb-16`}>
        <SkSectionHead />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <div className="skeleton min-h-[340px] rounded-panel sm:col-span-2 lg:row-span-2" />
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton min-h-[200px] rounded-card" />)}
        </div>
      </section>
      <section className={`${container} pb-16`}>
        <SkGrid count={3} card={SkServiceCard} />
      </section>
    </SkPage>
  );
}
