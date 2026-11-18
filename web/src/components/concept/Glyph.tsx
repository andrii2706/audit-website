/**
 * Line-art glyphs of the editorial design: eight abstract figures (bars, rhombi, arcs, frames, a checklist, rays,
 * circles, a grid). Strokes draw themselves when they scroll into view (concept.css `[data-draw]`); inside a card the
 * marked group shifts on hover (`data-shift`). Pure markup: usable from server and client components.
 */

type Shape = ['line', number[]] | ['rect', number[]] | ['circle', number[]] | ['path', string];
type Variant = { shapes: Shape[]; shift: 'up' | 'spin' | 'grow' | 'left'; dot: [number, number] | null };

const r1 = (n: number) => Math.round(n * 10) / 10;

const VARIANTS: Variant[] = [
  { shapes: Array.from({ length: 15 }, (_, i): Shape => ['line', [22 + i * 4, 82, 22 + i * 4, r1(82 - (28 - Math.abs(i - 7) * 4) * 1.6)]]), shift: 'up', dot: null },
  { shapes: Array.from({ length: 5 }, (_, i): Shape => ['path', `M50 ${14 + i * 7} L${86 - i * 7} 50 L50 ${86 - i * 7} L${14 + i * 7} 50 Z`]), shift: 'spin', dot: [47, 47] },
  { shapes: Array.from({ length: 6 }, (_, i): Shape => ['path', `M18 ${82 - (12 + i * 10)} A${12 + i * 10} ${12 + i * 10} 0 0 1 ${30 + i * 10} 82`]), shift: 'grow', dot: [16, 80] },
  { shapes: Array.from({ length: 6 }, (_, i): Shape => ['rect', [20 + i * 8, 20 + i * 8, 62 - i * 8, 62 - i * 8]]), shift: 'left', dot: [41, 41] },
  {
    shapes: [...Array.from({ length: 6 }, (_, i): Shape => ['line', [18, 24 + i * 10, i % 2 ? 62 : 74, 24 + i * 10]]), ['path', 'M62 74 L70 82 L86 62']],
    shift: 'up',
    dot: null,
  },
  {
    shapes: Array.from({ length: 9 }, (_, i): Shape => ['line', [18, 82, r1(18 + Math.cos((Math.PI / 2) * (i / 8)) * 64), r1(82 - Math.sin((Math.PI / 2) * (i / 8)) * 64)]]),
    shift: 'spin',
    dot: [15, 79],
  },
  { shapes: Array.from({ length: 5 }, (_, i): Shape => ['circle', [50 + i * 3, 50 - i * 3, 34 - i * 7]]), shift: 'grow', dot: [59, 37] },
  {
    shapes: [
      ...Array.from({ length: 5 }, (_, i): Shape => ['line', [18 + i * 16, 18, 18 + i * 16, 82]]),
      ...Array.from({ length: 5 }, (_, i): Shape => ['line', [18, 18 + i * 16, 82, 18 + i * 16]]),
    ],
    shift: 'left',
    dot: [51, 35],
  },
];

function Shapes({ shapes }: { shapes: Shape[] }) {
  return (
    <>
      {shapes.map((s, i) => {
        const a = { pathLength: 1, 'data-draw': '', style: { '--d': i } as React.CSSProperties };
        if (s[0] === 'line') return <line key={i} x1={s[1][0]} y1={s[1][1]} x2={s[1][2]} y2={s[1][3]} {...a} />;
        if (s[0] === 'rect') return <rect key={i} x={s[1][0]} y={s[1][1]} width={s[1][2]} height={s[1][3]} {...a} />;
        if (s[0] === 'circle') return <circle key={i} cx={s[1][0]} cy={s[1][1]} r={s[1][2]} {...a} />;
        return <path key={i} d={s[1]} {...a} />;
      })}
    </>
  );
}

export default function Glyph({ i, className = '' }: { i: number; className?: string }) {
  const v = VARIANTS[((i % VARIANTS.length) + VARIANTS.length) % VARIANTS.length];
  return (
    <svg className={`fx-glyph glyph ${className}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <g data-shift={v.shift}>
        <Shapes shapes={v.shapes} />
      </g>
      {v.dot && <rect x={v.dot[0]} y={v.dot[1]} width="6" height="6" fill="currentColor" stroke="none" />}
    </svg>
  );
}

/** Perspective lines and an open box behind the hero headline; the small square drifts. */
export function HeroArt() {
  const shapes: Shape[] = [
    ...Array.from({ length: 13 }, (_, i): Shape => ['line', [600, 120, -600 + i * 200, 420]]),
    ...[170, 230, 320].map((y): Shape => ['line', [0, y, 1200, y]]),
    ['rect', [470, 60, 260, 200]],
    ['path', 'M470 60 L540 20 L800 20 L730 60'],
    ['path', 'M730 260 L800 220 L800 20'],
  ];
  return (
    <svg className="fx-glyph fx-art hero-art" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <g>
        <Shapes shapes={shapes} />
      </g>
      <rect className="drift" x="588" y="128" width="18" height="18" style={{ fill: 'var(--lime)' }} stroke="none" />
    </svg>
  );
}
