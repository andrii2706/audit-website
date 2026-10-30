'use client';

import { useEffect, useState } from 'react';

/**
 * "Back to top" button: appears after scrolling down a screen and a half, scrolls smoothly
 * (instantly under prefers-reduced-motion). Sits above the mobile action bar on phones.
 */
export default function ScrollToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVisible(window.scrollY > window.innerHeight * 1.5));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={label}
      title={label}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-ink text-white shadow-[0_14px_34px_-14px_rgba(11,18,32,0.6)] transition-[opacity,translate,scale,background-color] duration-500 ease-(--ease-out-expo) hover:bg-accent active:scale-95 sm:right-6 md:bottom-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="M6 11l6-6 6 6" />
      </svg>
    </button>
  );
}
