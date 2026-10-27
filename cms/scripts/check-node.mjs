#!/usr/bin/env node
/**
 * Pre-flight check before `npm run dev` / `npm run build` (see package.json pre-scripts):
 *  1. Node.js version: 22.19+ or 24.x (Strapi's undici@8 needs >= 22.19; odd versions lack native binaries).
 *  2. Dependencies installed: every package from package.json exists in node_modules.
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

if (problems.length) {
  console.error(`\n✖ Can't start yet:\n\n  - ${problems.join('\n\n  - ')}\n`);
  process.exit(1);
}
