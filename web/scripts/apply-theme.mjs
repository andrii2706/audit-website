/**
 * One-off helper for the light / dark theme (run from web/: `node scripts/apply-theme.mjs`). Safe to run again.
 * Adds two lines each to your own files instead of replacing them:
 *  1. src/app/[locale]/layout.tsx — <ThemeBoot /> first inside <body> (puts the theme on <html> before the first
 *     paint and loads the dark colours);
 *  2. src/components/concept/SiteHeader.tsx — the theme button <ThemeToggle locale={locale} /> at the start of the
 *     header's right-hand group (`bar-end`), before the language switcher.
 * When a file doesn't look as expected the script changes nothing in it and says what to add by hand.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');

function patch(file, { done, importLine, insert, hand }) {
  if (!existsSync(file)) return console.log(`${file} not found — is this script inside web/scripts?`);
  let src = readFileSync(file, 'utf8');
  if (done.test(src)) return console.log(`${file}: already done, nothing to change`);
  const next = insert(src);
  if (!next) return console.log(`${file}: not changed (unexpected layout). Add by hand: ${hand}`);
  src = next;
  // The new import goes after the last import at the top of the file.
  const imports = [...src.matchAll(/^import [^;]+;[ \t]*$/gm)];
  const at = imports.length ? imports[imports.length - 1].index + imports[imports.length - 1][0].length : 0;
  src = `${src.slice(0, at)}\n${importLine}${src.slice(at)}`;
  writeFileSync(file, src);
  console.log(`${file}: updated`);
}

patch(join(web, 'src', 'app', '[locale]', 'layout.tsx'), {
  done: /<ThemeBoot\b/,
  importLine: "import { ThemeBoot } from '@/components/concept/ThemeToggle';",
  insert: (src) => {
    // The element itself (a line starting with <body), not the word in a comment.
    const body = src.match(/^[ \t]*<body\b[^>]*>[^\n]*\n/m);
    if (!body) return null;
    const indent = (src.slice(body.index + body[0].length).match(/^\s*/) ?? [''])[0];
    const line = `${indent}{/* Light / dark theme (the visitor's choice or the device setting), applied before the first paint. */}\n${indent}<ThemeBoot />\n`;
    const end = body.index + body[0].length;
    return src.slice(0, end) + line + src.slice(end);
  },
  hand: 'import { ThemeBoot } from \'@/components/concept/ThemeToggle\'; and <ThemeBoot /> as the first element inside <body>',
});

patch(join(web, 'src', 'components', 'concept', 'SiteHeader.tsx'), {
  done: /<ThemeToggle\b/,
  importLine: "import ThemeToggle from './ThemeToggle';",
  insert: (src) => {
    const bar = src.match(/^(\s*)<div className="bar-end">\s*\n/m);
    if (!bar) return null;
    const end = bar.index + bar[0].length;
    return `${src.slice(0, end)}${bar[1]}  <ThemeToggle locale={locale} />\n${src.slice(end)}`;
  },
  hand: 'import ThemeToggle from \'./ThemeToggle\'; and <ThemeToggle locale={locale} /> first inside <div className="bar-end">',
});

console.log('Done. Restart the dev server (npm run dev).');
