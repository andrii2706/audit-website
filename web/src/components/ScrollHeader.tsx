'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Sticky header shell: sets data-scrolled once the page is scrolled, so the bar can tighten and gain a
 * shadow (styles use `group-data-scrolled/header:`). Named for view transitions so it stays still while
 * pages change.
 */
export default function ScrollHeader({ children, className }: { children: ReactNode; className?: string }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 12));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
    };
  }, []);
  return (
    <header data-scrolled={scrolled ? '' : undefined} className={className} style={{ viewTransitionName: 'site-header' }}>
      {children}
    </header>
  );
}
