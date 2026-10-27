/**
 * Shared Tailwind class recipes so buttons, chips and cards look the same everywhere.
 * Every interactive recipe includes `cursor-pointer`.
 */

const btnBase =
  'inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full border font-semibold transition-[background-color,border-color,transform,color] duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0';

export const btn = {
  dark: `${btnBase} h-13 px-6 text-base border-transparent bg-ink text-white hover:bg-ink-2 sm:h-14 sm:px-7`,
  accent: `${btnBase} h-13 px-6 text-base border-transparent bg-accent text-white hover:bg-accent-hover sm:h-14 sm:px-7`,
  light: `${btnBase} h-13 px-6 text-base bg-card border-line text-ink hover:border-ink sm:h-14`,
  outline: `${btnBase} h-12 px-5 text-[15px] border-ink text-ink hover:bg-ink hover:text-white`,
  white: `${btnBase} h-13 px-6 text-base border-transparent bg-white text-ink hover:bg-bg`,
  accentSm: `${btnBase} h-11 px-5 text-[15px] border-transparent bg-accent text-white hover:bg-accent-hover`,
};

export const chip =
  'inline-flex h-11 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border border-line bg-card px-4 text-[15px] font-medium text-ink transition-[border-color,transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white';

export const iconBtn =
  'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-transparent text-ink transition-colors hover:border-ink';

/** Card that lifts and gets a dark border on hover (used for links). */
export const cardHover = 'cursor-pointer transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-ink';

export const container = 'mx-auto w-full max-w-[1240px] px-4 sm:px-6';

export const eyebrow = 'font-mono text-[13px] uppercase tracking-wide text-muted';

export const h2 = 'text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] xs:text-[34px] md:text-[42px] lg:text-[48px]';

export const field =
  'min-h-[50px] w-full rounded-[14px] border border-line-strong bg-white px-3.5 text-base font-normal text-ink outline-none transition focus:border-transparent focus:ring-2 focus:ring-accent aria-invalid:border-danger aria-invalid:bg-danger-soft';

/** Pill badge whose text and padding scale with the screen: 11px on small phones → 12px → 13px on tablets+. */
const badgeBase = 'inline-flex max-w-full items-center rounded-full font-semibold leading-tight whitespace-nowrap px-2 py-0.5 text-[11px] xs:px-2.5 xs:text-xs md:py-1 md:text-[13px]';
export const badge = {
  lime: `${badgeBase} bg-lime text-ink`,
  accent: `${badgeBase} bg-accent-soft text-accent-ink`,
  glass: `${badgeBase} bg-white/20 text-white`,
};

/**
 * Chip row that is a 2-column grid on phones (labels wrap, nothing gets cut off)
 * and a wrapping flex row from `sm` up. Use `chipCell` on each child.
 */
export const chipGrid = 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap [&>*:last-child:nth-child(odd)]:col-span-2';
// Standalone (not built on `chip`): combining utilities that set the same property (h-11 + h-auto,
// whitespace-nowrap + whitespace-normal) has no guaranteed winner in Tailwind v4.
export const chipCell =
  'inline-flex min-h-11 min-w-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card px-3 py-2 text-center text-[13px] leading-tight font-medium break-words text-ink transition-[border-color,transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-ink xs:px-4 xs:text-sm sm:shrink-0 sm:justify-start sm:py-2.5 sm:text-left sm:text-[15px]';
