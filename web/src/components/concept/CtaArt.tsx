import './cta-art.css';

/** Radii of the arcs that grow out of the block's lower-left corner (viewBox 560 × 360, corner at 0,360). */
const ARCS = [70, 120, 170, 220, 270, 320];

/**
 * Line art in the empty lower-left part of the request block (approved design 27.11, variant C): concentric arcs
 * from the corner with a square mark, like the glyphs of the service tiles. Lines draw themselves when the block
 * scrolls into view (`.fx-glyph [data-draw]` in concept.css). Decoration only; hidden below 1024px, where the form
 * takes the full width.
 */
export default function CtaArt() {
  return (
    <svg className="fx-glyph cta-art" viewBox="0 0 560 360" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {ARCS.map((r, i) => (
        <path
          key={r}
          d={`M0 ${360 - r} A${r} ${r} 0 0 1 ${r} 360`}
          pathLength={1}
          data-draw=""
          opacity={i === ARCS.length - 1 ? 0.55 : 1}
          style={{ '--d': i } as React.CSSProperties}
        />
      ))}
      <line x1="0" y1="360" x2="250" y2="110" pathLength={1} data-draw="" opacity="0.6" style={{ '--d': ARCS.length } as React.CSSProperties} />
      <rect className="cta-art-dot" x="244" y="104" width="12" height="12" fill="currentColor" stroke="none" />
    </svg>
  );
}
