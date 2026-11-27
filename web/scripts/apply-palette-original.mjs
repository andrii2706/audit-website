/**
 * One-off helper for palette O (run from anywhere: `node web/scripts/apply-palette-original.mjs`). Safe to run again.
 * Adds the switcher label "Оригінал" / "Original" (concept.paletteO) to the uk and en dictionaries.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const [lang, label] of [['uk', 'Оригінал'], ['en', 'Original']]) {
  const file = join(web, 'src', 'i18n', 'dictionaries', `${lang}.json`);
  const dict = JSON.parse(readFileSync(file, 'utf8'));
  if (dict.concept && !('paletteO' in dict.concept)) {
    // keep it next to the other palette labels
    const entries = Object.entries(dict.concept);
    const at = entries.findIndex(([k]) => k === 'paletteC');
    entries.splice(at === -1 ? entries.length : at + 1, 0, ['paletteO', label]);
    dict.concept = Object.fromEntries(entries);
    writeFileSync(file, `${JSON.stringify(dict, null, 2)}\n`);
    console.log(`${lang}.json: added concept.paletteO = "${label}"`);
  } else {
    console.log(`${lang}.json: nothing to add`);
  }
}
console.log('Done. Restart the dev server (npm run dev).');
