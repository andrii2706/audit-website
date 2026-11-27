/**
 * Window events shared by the design's client components. Kept apart from gsap.ts, so components that only send or
 * hear an event (the palette switcher, the back-to-top button) don't pull GSAP into every page.
 */

/** The palette changed (PaletteSwitcher): canvas scenes re-read their colours. */
export const PALETTE_EVENT = 'bp-palette';

/**
 * The page was moved in one jump by code, not scrolled by the visitor (ScrollToTop): scroll scenes go straight to the
 * state of the new position instead of playing the way there (gsap.ts).
 */
export const JUMP_EVENT = 'bp-jump';
