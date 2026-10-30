/**
 * "bp" logo mark of Бізнес Партнери, drawn as inline SVG so it needs no request and works with any basePath.
 * TEMPORARY: redrawn from the PNG in the client's brief. Replace the paths (and public/logo.svg, app/icon.svg)
 * with the original vector file once the client sends it.
 */
export const BRAND_SWOOSH = '#4cb6dc';
export const BRAND_LETTERS = '#3c8ec8';

export const BRAND_PATHS = {
  swooshTop: 'M38 14C61 6 82 26 76 56c-4-18-17-34-38-42z',
  swooshBottom: 'M50 89C27 97 7 76 14 46c3 18 16 34 36 43z',
  b: 'M27 23h8.5v24A12.5 12.5 0 1 1 27 59zm12.5 25.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
  p: 'M50.5 47h8v2A12.5 12.5 0 1 1 58.5 69.5V90h-8zm13 1.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
};

export default function BrandMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 90 102" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path fill={BRAND_SWOOSH} d={BRAND_PATHS.swooshTop} />
      <path fill={BRAND_SWOOSH} d={BRAND_PATHS.swooshBottom} />
      <g fill={BRAND_LETTERS} transform="translate(20 0) skewX(-16) scale(.78 1)">
        <path fillRule="evenodd" d={BRAND_PATHS.b} />
        <path fillRule="evenodd" d={BRAND_PATHS.p} />
      </g>
    </svg>
  );
}
