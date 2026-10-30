'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animates the number inside a stat ("300+", "15 років", "4.9") from 0 when it scrolls into view
 * (identifiers such as "№ 1234" are left as they are).
 * The server (and search engines) always get the final text; the count only runs in the browser,
 * only for blocks that start below the fold, and never with prefers-reduced-motion.
 */
export default function CountUp({ value, duration = 1600 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<string | null>(null); // null = render the final value as-is
  useEffect(() => {
    const el = ref.current;
    const m = value.match(/^(\D*)(\d+(?:[.,]\d+)?)([\s\S]*)$/);
    if (!el || !m || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already visible: don't re-animate
    const [, pre, num, post] = m;
    if (/[№#]/.test(pre)) return; // identifiers (registry №) are not quantities — don't count them
    const sep = num.includes(',') ? ',' : '.';
    const target = parseFloat(num.replace(',', '.'));
    const decimals = (num.split(/[.,]/)[1] ?? '').length;
    const fmt = (n: number) => `${pre}${n.toFixed(decimals).replace('.', sep)}${post}`;
    let frame = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(2, -10 * p); // expo-out
          setShown(p < 1 ? fmt(target * eased) : null);
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    // Reset to 0 in the next frame (the block is below the fold, so nobody sees the swap), then wait to be seen.
    frame = requestAnimationFrame(() => {
      setShown(fmt(0));
      io.observe(el);
    });
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {shown ?? value}
    </span>
  );
}
