#!/usr/bin/env node
/**
 * Pre-flight check before `npm run dev` / `npm run build` (see package.json pre-scripts):
 *  1. Node.js version: 22.19+ or 24.x (Strapi's undici@8 needs >= 22.19; odd versions lack native binaries).
 *  2. Dependencies installed: every package from package.json exists in node_modules.
 *  3. No leftover seed files from older versions (they no longer compile).
 *  4. Stale generated types: types/generated is written by Strapi on start. If it was made by an older version
 *     (a content type in src/api is missing from it), TypeScript fails before Strapi can regenerate it, so delete it.
 */
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
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

// The seed was rewritten for the Бізнес Партнери brief (structure.ts + content/{uk,en}.ts).
const stale = ['src/seed/data.ts', 'src/seed/translations'].filter((p) => existsSync(join(root, p)));
if (stale.length) {
  problems.push(`Leftover files from an older version of the project (probably unzipped over an old copy):\n    ${stale.join('\n    ')}\n    Delete them, or unpack the project into an empty folder.`);
}

const generated = join(root, 'types', 'generated', 'contentTypes.d.ts');
if (existsSync(generated)) {
  const known = readFileSync(generated, 'utf8');
  const apiDir = join(root, 'src', 'api');
  const uids = existsSync(apiDir)
    ? readdirSync(apiDir).flatMap((api) => {
        const ct = join(apiDir, api, 'content-types');
        return existsSync(ct) ? readdirSync(ct).map((name) => `api::${api}.${name}`) : [];
      })
    : [];
  const missingTypes = uids.filter((uid) => !known.includes(`'${uid}'`));
  if (missingTypes.length) {
    rmSync(join(root, 'types', 'generated'), { recursive: true, force: true });
    console.log(`ℹ Deleted outdated types/generated (no ${missingTypes.join(', ')}). Strapi regenerates it on start.`);
  }
}

if (problems.length) {
  console.error(`\n✖ Can't start yet:\n\n  - ${problems.join('\n\n  - ')}\n`);
  process.exit(1);
}
