/**
 * One-off fix (run from web/: `node scripts/fix-language-switcher-props.mjs`). Safe to run again.
 * Your LanguageSwitcher has no `busyLabel` prop, but Header.tsx and concept/SiteHeader.tsx pass one, so `next build`
 * stops at the type check (TS2322). This removes that one attribute from both files and changes nothing else
 * (line endings stay as they are).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const rel of ['src/components/Header.tsx', 'src/components/concept/SiteHeader.tsx']) {
  const file = join(web, rel);
  if (!existsSync(file)) { console.log(`${rel}: not found, skipped`); continue; }
  const src = readFileSync(file, 'utf8');
  // On its own line (with the line break before it) or inline after another attribute.
  const next = src
    .replace(/[ \t]*\r?\n[ \t]*busyLabel=\{[^}]*\}(?=[ \t]*\r?\n)/g, '')
    .replace(/[ \t]+busyLabel=\{[^}]*\}/g, '');
  if (next === src) { console.log(`${rel}: nothing to change`); continue; }
  writeFileSync(file, next);
  console.log(`${rel}: busyLabel removed`);
}
