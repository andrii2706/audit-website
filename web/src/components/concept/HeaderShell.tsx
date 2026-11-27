'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Sticky header that hides while the visitor scrolls down and comes back on the way up (or when it gets focus).
 * Named for view transitions so it stays still while pages change.
 */
export default function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();
  // A new page starts with the header shown (state adjusted during render, not in an effect).
  const [shownPath, setShownPath] = useState(pathname);
  if (shownPath !== pathname) {
    setShownPath(pathname);
    setHidden(false);
  }
  useEffect(() => {
    let lastY = window.scrollY, frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY, d = y - lastY;
        if (y < 160 || ref.current?.contains(document.activeElement)) setHidden(false);
        else if (d > 6) setHidden(true);
        else if (d < -6) setHidden(false);
        if (Math.abs(d) > 6) lastY = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); };
  }, []);
  return (
    <header ref={ref} className={`header${hidden ? ' is-hidden' : ''}`} onFocus={() => setHidden(false)} style={{ viewTransitionName: 'site-header' }}>
      {children}
    </header>
  );
}

/** Desktop menu; the current section is marked with aria-current (underlined in concept.css). */
export function ConceptNav({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const pathname = usePathname() ?? '';
  return (
    <nav className="nav" aria-label={label}>
      {items.map((n) => (
        <Link key={n.href} href={n.href} aria-current={pathname === n.href || pathname.startsWith(`${n.href}/`) ? 'page' : undefined}>
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
