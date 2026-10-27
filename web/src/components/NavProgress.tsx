'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/** Fire this to show the bar for programmatic navigations (e.g. the language switcher). */
export const NAV_START_EVENT = 'nav:start';

/**
 * Thin progress bar at the top of the page during client-side navigation.
 * Starts on clicks on internal links (or NAV_START_EVENT), completes when the pathname changes.
 */
export default function NavProgress({ label }: { label: string }) {
  const pathname = usePathname();
  const [progress, setProgress] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const start = () => {
      if (timer.current) window.clearInterval(timer.current);
      setProgress(8);
      // Trickle towards 90% while waiting.
      timer.current = window.setInterval(() => setProgress((p) => (p === null || p >= 100 ? p : p + (90 - p) * 0.12)), 200);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest('a');
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return; // hash links / same page
      start();
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener(NAV_START_EVENT, start);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener(NAV_START_EVENT, start);
    };
  }, []);

  // Route committed → jump to 100% (state adjusted during render, no effect needed)…
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (progress !== null) setProgress(100);
  }
  // …then stop trickling and fade out.
  useEffect(() => {
    if (progress !== 100) return;
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    const t = window.setTimeout(() => setProgress(null), 350);
    return () => window.clearTimeout(t);
  }, [progress]);

  if (progress === null) return null;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
    >
      <div
        className="h-full bg-accent shadow-[0_0_10px_var(--color-accent)] transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  );
}
