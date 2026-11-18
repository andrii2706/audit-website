'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import './logo-marquee.css';

/**
 * Endless strip of client logos. Before hydration it runs on the CSS animation from concept.css; then this takes over
 * from the same spot and adds control: drag with the mouse or swipe with a finger (with inertia), scroll sideways with a
 * trackpad, ←/→ when focused. It pauses while hovered, focused or dragged and then carries on by itself.
 * The second copy of the list is only there to make the loop seamless (hidden from screen readers).
 * With reduced motion nothing moves: concept.css shows the logos as a wrapped grid.
 */
export default function LogoMarquee({ label, children }: { label: string; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const track = trackRef.current;
    if (!box || !track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Take over from the CSS animation at its current position, so nothing jumps.
    const m = getComputedStyle(track).transform;
    let x = m && m !== 'none' ? new DOMMatrixReadOnly(m).m41 : 0;
    box.classList.add('is-live');

    let half = track.scrollWidth / 2; // width of one copy of the list
    const LOOP_MS = 60_000; // one copy per minute, as the CSS animation
    let v = 0; // inertia, px per ms
    let hover = false, focus = false, visible = true, raf = 0, last = 0;
    let drag: { id: number; startX: number; startPos: number; lastX: number; lastT: number } | null = null;

    const wrap = (n: number) => {
      if (!half) return n;
      const r = n % half;
      return r > 0 ? r - half : r;
    };
    const paint = () => { track.style.transform = `translate3d(${x}px,0,0)`; };
    const frame = (t: number) => {
      const dt = last ? Math.min(t - last, 64) : 16;
      last = t;
      if (!drag) {
        if (Math.abs(v) > 0.02) {
          x += v * dt;
          v *= Math.pow(0.94, dt / 16);
        } else {
          v = 0;
          if (!hover && !focus) x -= (half / LOOP_MS) * dt;
        }
      }
      x = wrap(x);
      paint();
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, startX: e.clientX, startPos: x, lastX: e.clientX, lastT: e.timeStamp };
      v = 0;
      box.setPointerCapture(e.pointerId);
      box.classList.add('is-dragging');
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dt = Math.max(1, e.timeStamp - drag.lastT);
      v = 0.8 * ((e.clientX - drag.lastX) / dt) + 0.2 * v; // smoothed, for the throw on release
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
      x = drag.startPos + (e.clientX - drag.startX);
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (e.timeStamp - drag.lastT > 80) v = 0; // held still before letting go: no throw
      v = Math.max(-3, Math.min(3, v));
      drag = null;
      box.classList.remove('is-dragging');
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical scrolling stays with the page
      e.preventDefault();
      x -= e.deltaX;
      v = 0;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      v = e.key === 'ArrowLeft' ? 0.9 : -0.9;
    };
    const enter = () => { hover = true; };
    const leave = () => { hover = false; };
    const onFocus = () => { focus = true; };
    const onBlur = () => { focus = false; };
    const onVisibility = () => (document.hidden ? stop() : start());
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); else stop(); });
    const ro = new ResizeObserver(() => { half = track.scrollWidth / 2; });

    box.addEventListener('pointerdown', onDown);
    box.addEventListener('pointermove', onMove);
    box.addEventListener('pointerup', onUp);
    box.addEventListener('pointercancel', onUp);
    box.addEventListener('wheel', onWheel, { passive: false });
    box.addEventListener('keydown', onKey);
    box.addEventListener('mouseenter', enter);
    box.addEventListener('mouseleave', leave);
    box.addEventListener('focus', onFocus);
    box.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    io.observe(box);
    ro.observe(track);
    paint();
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      box.removeEventListener('pointerdown', onDown);
      box.removeEventListener('pointermove', onMove);
      box.removeEventListener('pointerup', onUp);
      box.removeEventListener('pointercancel', onUp);
      box.removeEventListener('wheel', onWheel);
      box.removeEventListener('keydown', onKey);
      box.removeEventListener('mouseenter', enter);
      box.removeEventListener('mouseleave', leave);
      box.removeEventListener('focus', onFocus);
      box.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      box.classList.remove('is-live', 'is-dragging');
      track.style.transform = '';
    };
  }, []);

  return (
    <div ref={boxRef} className="marquee" role="region" aria-label={label} tabIndex={0}>
      <div ref={trackRef} className="marquee-track">
        <ul>{children}</ul>
        <ul aria-hidden="true" inert>{children}</ul>
      </div>
    </div>
  );
}
