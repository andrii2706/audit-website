#!/usr/bin/env node
/**
 * Turns a THROWAWAY checkout of web/ into a static, server-less demo for GitHub Pages.
 * Run only in CI (.github/workflows/pages-demo.yml) — it edits and deletes source files.
 *
 * Removes what static hosting can't run (see Next.js "Static Exports → Unsupported features"):
 *   proxy (locale redirect)  → replaced by a small index.html redirect (scripts/finish-pages-demo.mjs)
 *   /api/revalidate route    → deleted (nothing to revalidate)
 *   [...rest] catch-all      → deleted (GitHub Pages serves 404.html)
 *   per-page OG images       → deleted (social previews aren't needed for a preview link)
 *   server action (form)     → demo/actions.ts (validates, shows success, sends nothing)
 *   ISR / dynamicParams      → every page is prerendered once at build time
 */
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
if (process.env.CI !== 'true' && !process.argv.includes('--force')) {
  console.error('This script rewrites source files. It runs in CI only (pass --force to run it locally on a copy).');
  process.exit(1);
}

const rm = (p) => {
  const full = join(web, p);
  if (existsSync(full)) {
    rmSync(full, { recursive: true, force: true });
    console.log(`  removed ${p}`);
  }
};
rm('src/proxy.ts');
rm('src/app/api');
rm('src/app/[locale]/[...rest]');
// Per-page social preview images are generated on demand; not needed for a client preview.
rm('src/app/[locale]/opengraph-image.tsx');
rm('src/app/[locale]/services/[slug]/opengraph-image.tsx');

copyFileSync(join(web, 'demo/actions.ts'), join(web, 'src/app/actions.ts'));
console.log('  src/app/actions.ts → demo version');

// Segment config: no ISR, no on-demand params; force static output for route handlers.
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mjs)$/.test(n) ? [p] : [];
});
let edited = 0;
for (const file of walk(join(web, 'src/app'))) {
  const before = readFileSync(file, 'utf8');
  let after = before
    .replace(/^export const revalidate = .*;\n/m, '')
    .replace(/^export const dynamicParams = true;/m, 'export const dynamicParams = false;');
  // Static export refuses an empty generateStaticParams() (e.g. no published news yet). Fall back to one
  // placeholder slug: its [slug]/layout.tsx check fails and the page is exported as "not found".
  if (/[\\/]\[slug\][\\/]page\.tsx$/.test(file)) {
    after = after.replace(/^  return all\.flat\(\);$/m, "  const list = all.flat();\n  return list.length ? list : [{ locale: 'uk', slug: 'none' }];");
  }
  // Route handlers and metadata routes (OG images, icons, sitemap, robots, manifest) must be marked static.
  const isRoute = /[\\/](route\.ts|opengraph-image\.tsx|twitter-image\.tsx|apple-icon\.tsx|icon\.tsx|sitemap\.ts|robots\.ts|manifest\.ts)$/.test(file);
  if (isRoute && !/export const dynamic\b/.test(after)) after = `export const dynamic = 'force-static';\n${after}`;
  if (after !== before) {
    writeFileSync(file, after);
    edited++;
  }
}
console.log(`  segment config adjusted in ${edited} files`);
console.log('✔ demo source ready');
