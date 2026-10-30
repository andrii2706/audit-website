#!/usr/bin/env node
/**
 * Pre-flight check before `npm run dev` / `npm run build` (see package.json pre-scripts):
 *  1. Node.js version: 22.19+ or 24.x (Strapi's undici@8 needs >= 22.19; odd versions lack native binaries).
 *  2. Dependencies installed: every package from package.json exists in node_modules.
 *  3. (web only) No leftover files from older versions of the project that break routing.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

const [maj, min] = process.versions.node.split('.').map(Number);
if (!((maj === 22 && min >= 19) || maj === 24)) {
  problems.push(`Node.js ${process.versions.node} is not supported. Use 22.19+ (recommended 22.22.0, see .nvmrc) or 24.x:\n    nvm install 22.22.0 && nvm use 22.22.0`);
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const missing = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter(
  (name) => !existsSync(join(root, 'node_modules', ...name.split('/'), 'package.json')),
);
if (missing.length) {
  problems.push(`Dependencies are not installed (missing: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''}).\n    Run: npm install`);
}

// Files that existed in early versions of the web app and conflict with app/[locale]/ (two root layouts, old routes).
const stale = [
  'src/app/layout.tsx', 'src/app/page.tsx', 'src/app/not-found.tsx', 'src/app/favicon.ico',
  'src/app/posluhy', 'src/app/korysne', 'src/middleware.ts', 'AGENTS.md',
  // moved into the (home) route group / replaced by CSS scroll-driven animations
  'src/app/[locale]/page.tsx', 'src/components/Motion.tsx',
  // list pages moved into (list) route groups so their skeletons don't break 404s of detail pages
  'src/app/[locale]/loading.tsx', 'src/app/[locale]/services/page.tsx', 'src/app/[locale]/services/loading.tsx',
  'src/app/[locale]/blog/page.tsx', 'src/app/[locale]/blog/loading.tsx',
  // languages reduced to uk + en
  'src/i18n/dictionaries/pl.json', 'src/i18n/dictionaries/fr.json', 'src/i18n/dictionaries/de.json', 'src/i18n/dictionaries/es.json',
].filter((p) => existsSync(join(root, p)));
if (stale.length && existsSync(join(root, 'src/app/[locale]'))) {
  problems.push(`Leftover files from an older version of the project (probably unzipped over an old copy):\n    ${stale.join('\n    ')}\n    Delete them (and the .next folder), or unpack the project into an empty folder.`);
}

if (problems.length) {
  console.error(`\n✖ Can't start yet:\n\n  - ${problems.join('\n\n  - ')}\n`);
  process.exit(1);
}
