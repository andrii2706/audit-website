#!/usr/bin/env node
/**
 * After `next build` with PAGES_DEMO=1: adds the files GitHub Pages needs to out/.
 *   index.html — sends visitors to their browser language (what the proxy does on the real server)
 *   .nojekyll  — serve the _next/ folder as-is
 */
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
if (!existsSync(out)) {
  console.error('out/ not found — run the demo build first');
  process.exit(1);
}
const base = (process.env.PAGES_BASE_PATH ?? '').replace(/\/$/, '');
const html = `<!doctype html>
<html lang="uk"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Аудит Консультант</title>
<script>
  var locales = ['uk', 'en', 'pl', 'fr', 'de', 'es'], pick = 'uk';
  try {
    var saved = (document.cookie.match(/(?:^|; )NEXT_LOCALE=([a-z]{2})/) || [])[1];
    var langs = saved ? [saved] : (navigator.languages || [navigator.language || 'uk']);
    for (var i = 0; i < langs.length; i++) {
      var l = String(langs[i]).slice(0, 2).toLowerCase();
      if (l === 'ru' || l === 'be') l = 'uk';
      if (locales.indexOf(l) !== -1) { pick = l; break; }
    }
  } catch (e) {}
  location.replace('${base}/' + pick + '/');
</script>
<noscript><meta http-equiv="refresh" content="0; url=${base}/uk/"></noscript>
</head><body><a href="${base}/uk/">Аудит Консультант</a></body></html>
`;
writeFileSync(join(out, 'index.html'), html);
writeFileSync(join(out, '.nojekyll'), '');
console.log(`✔ out/index.html (redirect to ${base || ''}/<lang>/) and .nojekyll written`);
