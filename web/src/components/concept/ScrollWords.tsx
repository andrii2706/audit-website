'use client';

import { useRef } from 'react';
import { gsap, MOTION, useGSAP } from './gsap';

/** Statement whose words light up one after another while it scrolls through the screen (full text for everyone else). */
export default function ScrollWords({ text, className }: { text: string; className?: string }) {
  const root = useRef<HTMLParagraphElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        gsap.fromTo(root.current!.querySelectorAll('[data-w]'), { opacity: 0.2 }, {
          opacity: 1, ease: 'none', stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: 'top 82%', end: 'bottom 48%', scrub: 0.4 },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <p ref={root} className={className} data-scroll-words>
      {words.map((w, i) => (
        <span key={i} data-w>{w}{i < words.length - 1 ? ' ' : ''}</span>
      ))}
    </p>
  );
}
