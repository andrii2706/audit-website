'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { JUMP_EVENT } from './events';

/**
 * GSAP + ScrollTrigger, registered once and bundled from npm (no third-party script; CSP stays `script-src 'self'`).
 * Pinned scenes run on any width as long as the window is tall enough and motion is allowed (`PIN`); otherwise the
 * same markup is an ordinary flowing page.
 */
gsap.registerPlugin(ScrollTrigger, useGSAP);

export const MOTION = '(prefers-reduced-motion: no-preference)';
export const PIN = '(min-height: 500px) and (prefers-reduced-motion: no-preference)';
export { PALETTE_EVENT } from './events';

// After a jump made by code (back to top), every scroll scene takes the state of the new position at once: without
// this, scrubbed scenes (the hero video, the lit-up words) would catch up visibly for a moment.
if (typeof window !== 'undefined') {
  window.addEventListener(JUMP_EVENT, () => {
    ScrollTrigger.update();
    ScrollTrigger.getAll().forEach((st) => st.getTween()?.progress(1));
  });
}

export { gsap, ScrollTrigger, useGSAP };
