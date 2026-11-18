'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * GSAP + ScrollTrigger, registered once and bundled from npm (no third-party script; CSP stays `script-src 'self'`).
 * Pinned scenes run on any width as long as the window is tall enough and motion is allowed (`PIN`); otherwise the
 * same markup is an ordinary flowing page.
 */
gsap.registerPlugin(ScrollTrigger, useGSAP);

export const MOTION = '(prefers-reduced-motion: no-preference)';
export const PIN = '(min-height: 500px) and (prefers-reduced-motion: no-preference)';
/** Fired on window by the palette switcher, so canvas scenes can re-read their colours. */
export const PALETTE_EVENT = 'bp-palette';

export { gsap, ScrollTrigger, useGSAP };
