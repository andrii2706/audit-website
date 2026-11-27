/**
 * One-off helper for the 27.11 changes (run from web/: `node scripts/apply-2711.mjs`). Safe to run again.
 *  1. Adds the texts of the new form questions («Хто звертається?», «Коротко про ваше питання») to the uk and en
 *     dictionaries. Keys that already exist are kept, so your own wording stays. (The form has the same texts built
 *     in and works without this step; the dictionaries are where you change them.)
 *  2. Passes the hero video from the CMS to <HomeHero> in the home page, without replacing the rest of your file.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');

const texts = {
  uk: {
    clientQ: '2. Хто звертається?',
    clientTypes: ['Юридична особа', 'Фізична особа'],
    questionQ: '3. Коротко про ваше питання',
    optional: '(необов’язково)',
    questionPlaceholder: 'Наприклад: обов’язковий аудит звітності за 2026 рік',
    whereQ: '4. Куди відповісти?',
  },
  en: {
    clientQ: '2. Who is asking?',
    clientTypes: ['Company', 'Individual'],
    questionQ: '3. Your question in short',
    optional: '(optional)',
    questionPlaceholder: 'For example: statutory audit of the 2026 financial statements',
    whereQ: '4. Where should we reply?',
  },
};

for (const [lang, values] of Object.entries(texts)) {
  const file = join(web, 'src', 'i18n', 'dictionaries', `${lang}.json`);
  const dict = JSON.parse(readFileSync(file, 'utf8'));
  dict.form ??= {};
  const added = [];
  for (const [key, value] of Object.entries(values)) {
    if (!(key in dict.form)) { dict.form[key] = value; added.push(`form.${key}`); }
  }
  writeFileSync(file, `${JSON.stringify(dict, null, 2)}\n`);
  console.log(`${file}: ${added.length ? `added ${added.join(', ')}` : 'nothing to add'}`);
}

const home = join(web, 'src', 'app', '[locale]', '(home)', 'page.tsx');
if (!existsSync(home)) {
  console.log(`${home} not found — is this script inside web/scripts?`);
} else {
  let src = readFileSync(home, 'utf8');
  if (src.includes('videoSrc=')) {
    console.log(`${home}: the hero video is already passed, nothing to change`);
  } else {
    const anchor = src.match(/<HomeHero\s*\n(\s*)/);
    if (!anchor) {
      console.log(`${home}: <HomeHero> not found; add videoSrc={mediaUrl(home?.heroVideo ?? null)} to it by hand`);
    } else {
      src = src.replace(anchor[0], `${anchor[0]}videoSrc={mediaUrl(home?.heroVideo ?? null)}\n${anchor[1]}`);
      // mediaUrl comes from '@/lib/strapi' (the home page already imports it for logos and photos).
      if (!/\bmediaUrl\b[^;]*from '@\/lib\/strapi'/s.test(src.split('export default')[0])) {
        src = `import { mediaUrl } from '@/lib/strapi';\n${src}`;
      }
      writeFileSync(home, src);
      console.log(`${home}: <HomeHero> now gets the video uploaded in Strapi (Головна сторінка → «Головний екран: відео»)`);
    }
  }
}
console.log('Done. Restart the dev server (npm run dev).');
