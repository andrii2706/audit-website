/**
 * Canvas scene of the home hero, standing in for the client's video until there is footage: a slowly turning globe
 * of points with "hot spots" and dashed data arcs, over floor lines that run to the horizon. Colours come from the
 * palette tokens (`--cv-*` in concept.css) and are re-read with `recolour()` when the palette changes.
 * Nothing moves until `play()`; `frame()` draws one still frame (the only one with reduced motion).
 */
export type Scene = { play: () => void; pause: () => void; frame: () => void; recolour: () => void; destroy: () => void };

type Colours = { s1: string; s2: string; s3: string; glow: string; line: string; lo: number[]; hi: number[]; arc: string; hot: string };

const N = 2400;
const GA = Math.PI * (3 - Math.sqrt(5));
const HOT = [74, 302, 520, 684, 910, 1060, 1222, 1400, 1576, 1690, 1860, 2020, 2176, 2300];
const ARCS: [number, number][] = [[0, 3], [1, 6], [2, 9], [4, 11], [5, 12], [7, 13], [8, 10], [3, 8]];
const PTS: number[][] = Array.from({ length: N }, (_, i) => {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = i * GA;
  return [Math.cos(th) * r, y, Math.sin(th) * r];
});

const rot = (v: number[], a: number, tilt: number) => {
  const x = v[0] * Math.cos(a) + v[2] * Math.sin(a);
  const z = -v[0] * Math.sin(a) + v[2] * Math.cos(a);
  return [x, v[1] * Math.cos(tilt) - z * Math.sin(tilt), v[1] * Math.sin(tilt) + z * Math.cos(tilt)];
};

export function createScene(canvas: HTMLCanvasElement, reduce: boolean): Scene {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, raf = 0, running = false, t0 = 0, acc = 0;
  let C: Colours;

  const readColours = () => {
    const cs = getComputedStyle(document.documentElement);
    const v = (k: string) => cs.getPropertyValue(`--cv-${k}`).trim();
    const rgb = (k: string) => v(k).split(',').map(Number);
    C = { s1: v('1'), s2: v('2'), s3: v('3'), glow: v('glow'), line: v('line'), lo: rgb('dot-lo'), hi: rgb('dot-hi'), arc: v('arc'), hot: v('hot') };
  };
  const size = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  };

  const sphereLine = (pts: () => Generator<number[]>, cx: number, cy: number, R: number, a: number, tilt: number) => {
    if (!ctx) return;
    ctx.beginPath();
    let on = false;
    for (const p of pts()) {
      const q = rot(p, a, tilt);
      if (q[2] < 0) { on = false; continue; }
      const x = cx + q[0] * R, y = cy + q[1] * R;
      if (on) ctx.lineTo(x, y); else { ctx.moveTo(x, y); on = true; }
    }
    ctx.stroke();
  };

  const draw = (t: number) => {
    if (!ctx) return;
    if (!w) size();
    if (!w || !h) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = w * 0.5, cy = h * 0.6, R = Math.min(w * 0.36, h * 0.46);
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, Math.max(w, h) * 0.8);
    g.addColorStop(0, C.s1); g.addColorStop(0.45, C.s2); g.addColorStop(1, C.s3);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // floor lines running to the horizon
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${C.line},0.07)`;
    ctx.beginPath();
    for (let i = -12; i <= 12; i++) { ctx.moveTo(cx, cy + R * 0.15); ctx.lineTo(cx + i * w * 0.12, h); }
    for (let k = 1; k < 9; k++) { const y = cy + R * 0.15 + Math.pow(k / 8, 1.8) * (h - cy); ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    const a = t * 0.00011, tilt = 0.38;
    // glow behind the globe
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25);
    glow.addColorStop(0, `rgba(${C.glow},0.42)`); glow.addColorStop(1, `rgba(${C.glow},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2); ctx.fill();
    // a few meridians and parallels, front halves only
    ctx.strokeStyle = `rgba(${C.line},0.16)`;
    for (let m = 0; m < 12; m++) {
      const lon = (m / 12) * Math.PI;
      sphereLine(function* () { for (let k = 0; k <= 64; k++) { const lat = -Math.PI / 2 + (k / 64) * Math.PI; yield [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]; } }, cx, cy, R, a, tilt);
    }
    for (let l = 1; l < 6; l++) {
      const lat = -Math.PI / 2 + (l / 6) * Math.PI;
      sphereLine(function* () { for (let k = 0; k <= 96; k++) { const lon = (k / 96) * Math.PI * 2; yield [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]; } }, cx, cy, R, a, tilt);
    }
    const P = PTS.map((v) => rot(v, a, tilt));
    for (let i = 0; i < N; i++) {
      const p = P[i], d = (p[2] + 1) / 2, s = 0.9 + 2.1 * d;
      const c = (k: number) => (C.lo[k] + (C.hi[k] - C.lo[k]) * d) | 0;
      ctx.fillStyle = `rgba(${c(0)},${c(1)},${c(2)},${0.14 + 0.8 * d})`;
      ctx.fillRect(cx + p[0] * R - s / 2, cy + p[1] * R - s / 2, s, s);
    }
    // data arcs between hot spots (front side only), with a moving dash
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 10]);
    ctx.lineDashOffset = -t * 0.04;
    ctx.strokeStyle = `rgba(${C.arc},0.75)`;
    for (const [i, j] of ARCS) {
      const A = PTS[HOT[i]], B = PTS[HOT[j]];
      ctx.beginPath();
      let started = false;
      for (let k = 0; k <= 40; k++) {
        const u = k / 40, lift = 1 + 0.28 * Math.sin(Math.PI * u);
        const v = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u];
        const n = Math.hypot(v[0], v[1], v[2]) || 1;
        const q = rot(v.map((x) => (x / n) * lift), a, tilt);
        if (q[2] < -0.15) { started = false; continue; }
        const x = cx + q[0] * R, y = cy + q[1] * R;
        if (started) ctx.lineTo(x, y); else { ctx.moveTo(x, y); started = true; }
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // hot spots: bright points with a pulsing ring
    HOT.forEach((idx, n) => {
      const p = P[idx];
      if (p[2] < -0.1) return;
      const x = cx + p[0] * R, y = cy + p[1] * R, d = (p[2] + 1) / 2, ph = (t / 2600 + n * 0.17) % 1;
      ctx.fillStyle = `rgba(${C.hot},${0.5 + 0.5 * d})`;
      ctx.beginPath(); ctx.arc(x, y, 2.2 + 1.6 * d, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(${C.hot},${(1 - ph) * 0.55 * d})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 4 + ph * 22, 0, Math.PI * 2); ctx.stroke();
    });
  };

  readColours();
  const loop = (now: number) => {
    if (!running) return;
    draw(acc + (now - t0));
    raf = requestAnimationFrame(loop);
  };
  const onResize = () => { size(); if (!running) draw(acc); };
  window.addEventListener('resize', onResize);

  return {
    play: () => { if (running || reduce) return; running = true; t0 = performance.now(); raf = requestAnimationFrame(loop); },
    pause: () => { if (!running) return; running = false; acc += performance.now() - t0; cancelAnimationFrame(raf); },
    frame: () => { size(); draw(acc); },
    recolour: () => { readColours(); if (!running && canvas.clientWidth) { size(); draw(acc); } },
    destroy: () => { running = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); },
  };
}
