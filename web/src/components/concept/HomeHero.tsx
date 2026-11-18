'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createScene, type Scene } from './globe';
import { gsap, PALETTE_EVENT, PIN, ScrollTrigger, useGSAP } from './gsap';

type Props = { head: ReactNode; mediaTitle: ReactNode; mediaFoot: ReactNode; labelledBy: string };

/**
 * Home hero (as on fintexinc.com): the headline sits over a small rounded window into a moving picture. While the
 * visitor scrolls, the section stays pinned, the window opens to the whole screen (`--p` 0 → 1 drives its clip-path
 * in concept.css), the headline fades and its white copy rises over the picture. The picture is the canvas globe
 * (globe.ts) until the client has video: put a `<video className="media-video">` in `.media` and drop the canvas.
 * Short windows and reduced motion: the headline, then the picture as an ordinary rounded block.
 */
export default function HomeHero({ head, mediaTitle, mediaFoot, labelledBy }: Props) {
  const root = useRef<HTMLElement>(null);
  const scene = useRef<Scene | null>(null);
  const state = useRef({ visible: false, opened: true });
  const sync = () => (state.current.visible && state.current.opened ? scene.current?.play() : scene.current?.pause());

  useEffect(() => {
    const el = root.current!;
    const canvas = el.querySelector<HTMLCanvasElement>('[data-media-canvas]')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scene.current = createScene(canvas, reduce);
    scene.current.frame();
    const io = new IntersectionObserver(([en]) => { state.current.visible = en.isIntersecting; sync(); }, { threshold: 0.05 });
    io.observe(canvas);
    const recolour = () => scene.current?.recolour();
    window.addEventListener(PALETTE_EVENT, recolour);
    return () => {
      io.disconnect();
      window.removeEventListener(PALETTE_EVENT, recolour);
      scene.current?.destroy();
      scene.current = null;
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PIN, () => {
        const hero = root.current!;
        const headEl = hero.querySelector<HTMLElement>('[data-hero-head]')!;
        const stage = hero.querySelector<HTMLElement>('[data-hero-stage]')!;
        const setTop = () => stage.style.setProperty('--top', `${headEl.offsetHeight + 8}px`);
        setTop();
        window.addEventListener('resize', setTop);
        state.current.opened = false;
        sync();
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: hero, start: 'top top', end: '+=120%', scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
              onUpdate: (self) => {
                const o = self.progress > 0.01;
                if (o !== state.current.opened) { state.current.opened = o; sync(); }
              },
            },
          })
          .to(stage, { '--p': 1, duration: 1 }, 0)
          .to(headEl, { autoAlpha: 0, yPercent: -12, duration: 0.55 }, 0)
          .fromTo(hero.querySelector('.media-title'), { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0.5)
          .to({}, { duration: 0.35 });
        return () => {
          window.removeEventListener('resize', setTop);
          state.current.opened = true;
          sync();
        };
      });
      // Pinned scenes add height after the browser has already jumped to /uk#estimate etc.: once every trigger on the
      // page exists (next frame), recalculate and jump to the anchor again.
      const hash = window.location.hash.slice(1);
      if (hash) {
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          document.getElementById(decodeURIComponent(hash))?.scrollIntoView();
        });
      }
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="hero" id="top" aria-labelledby={labelledBy}>
      <div className="hero-head" data-hero-head>{head}</div>
      <div className="hero-stage" data-hero-stage>
        <div className="media" data-media>
          <canvas className="media-canvas" data-media-canvas aria-hidden="true" />
          <div className="media-shade" aria-hidden="true" />
          <div className="wrap media-in">
            <p className="display media-title" aria-hidden="true">{mediaTitle}</p>
            <div className="media-foot">{mediaFoot}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
