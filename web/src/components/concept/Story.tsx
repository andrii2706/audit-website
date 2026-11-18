'use client';

import { useRef, type ReactNode } from 'react';
import { cx } from '@/lib/format';
import { gsap, PIN, ScrollTrigger, useGSAP } from './gsap';

const num = (i: number) => String(i + 1).padStart(2, '0');

/**
 * Pinned story (process steps, reasons): the block stays in place while its items replace each other, a side list
 * shows where the visitor is and jumps to an item on click. Pins only when the whole block fits on the screen under
 * the header; otherwise (small phones, reduced motion) the items are an ordinary list.
 */
export default function Story({ aside, items, dark = false }: { aside: ReactNode; items: { title: string; body: ReactNode }[]; dark?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PIN, () => {
        const story = root.current!;
        const els = gsap.utils.toArray<HTMLElement>('[data-story-item]', story);
        const buttons = gsap.utils.toArray<HTMLButtonElement>('[data-go]', story);
        const fill = story.querySelector<HTMLElement>('.fill')!;
        const last = els.length - 1;
        if (last < 1) return;
        story.dataset.fx = 'pin';
        if (story.getBoundingClientRect().height > window.innerHeight - 110) {
          delete story.dataset.fx;
          return;
        }
        gsap.set(els, { autoAlpha: 0, y: 28 });
        gsap.set(els[0], { autoAlpha: 1, y: 0 });
        let current = 0;
        const mark = (i: number) => {
          buttons.forEach((b, k) => (k === i ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
          fill.style.height = `calc((100% - 16px) * ${i / last})`;
        };
        const st = ScrollTrigger.create({
          trigger: story, start: 'top top+=96', end: () => `+=${last * window.innerHeight * 0.55}`, pin: true, anticipatePin: 1,
          onUpdate: (self) => {
            const i = Math.min(last, Math.round(self.progress * last));
            if (i === current) return;
            const dir = i > current ? 1 : -1;
            gsap.to(els[current], { autoAlpha: 0, y: -28 * dir, duration: 0.45, ease: 'power2.out', overwrite: true });
            gsap.fromTo(els[i], { autoAlpha: 0, y: 28 * dir }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', overwrite: true });
            current = i;
            mark(i);
          },
        });
        const onClick = (ev: MouseEvent) => {
          const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-go]');
          if (!b) return;
          const i = Number(b.dataset.go);
          window.scrollTo({ top: st.start + (st.end - st.start) * (i / last) + 2, behavior: 'smooth' });
        };
        story.addEventListener('click', onClick);
        return () => {
          story.removeEventListener('click', onClick);
          delete story.dataset.fx;
          mark(0);
          fill.style.height = '0';
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={cx('story', dark && 'story-dark')} data-story>
      <div className="story-aside">
        {aside}
        <ol className="story-nav">
          <span className="track" aria-hidden="true" />
          <span className="fill" aria-hidden="true" />
          {items.map((it, i) => (
            <li key={i}>
              <button type="button" data-go={i} aria-current={i === 0 ? 'step' : undefined}>
                <span className="mono">{num(i)}</span>
                <span>{it.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="story-stack">
        {items.map((it, i) => (
          <div key={i} className="story-item" data-story-item>{it.body}</div>
        ))}
      </div>
    </div>
  );
}
