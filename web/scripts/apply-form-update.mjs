/**
 * One-off helper for the request-form update (run from web/: `node scripts/apply-form-update.mjs`). Safe to run again.
 *  1. Adds the new form / request-page texts to the uk and en dictionaries (keys that already exist are kept).
 *  2. Removes an old "Request form" block from src/app/concept.css if one was pasted there by hand: the styles now
 *     live in src/components/concept/concept-form.css, which ConceptForm imports itself.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Paths are taken from the script's own place (web/scripts), so it works from any folder.
const web = join(dirname(fileURLToPath(import.meta.url)), '..');

const texts = {
  uk: {
    form: {
      q1: '1. Яка послуга?', q2: '2. Річна виручка компанії, грн', q3: '3. Куди відповісти?', where: 'Куди відповісти?',
      revenue: ['до 10 млн', '10–100 млн', '100+ млн'], other: 'Інше', call: 'Дзвінок', channelEmail: 'E-mail',
      email: 'E-mail', emailPlaceholder: 'name@company.com', contactHint: 'Достатньо телефону або e-mail.', errContact: 'Вкажіть телефон або e-mail',
      stepOf: 'Крок {n} з {total}', steps: ['Ваш запит', 'Контакти', 'Куди відповісти'], next: 'Далі', back: 'Назад',
    },
    pages: {
      requestTitle: 'Залишити заявку',
      requestIntro: 'Розкажіть коротко про задачу — відповімо там, де вам зручно: у Telegram, Viber, WhatsApp, дзвінком або на e-mail.',
      requestAbout: 'Як з нами зв’язатися',
    },
  },
  en: {
    form: {
      q1: '1. Which service?', q2: '2. Annual company revenue, UAH', q3: '3. Where should we reply?', where: 'Where should we reply?',
      revenue: ['up to 10M', '10–100M', '100M+'], other: 'Other', call: 'Call', channelEmail: 'E-mail',
      email: 'E-mail', emailPlaceholder: 'name@company.com', contactHint: 'A phone number or an e-mail is enough.', errContact: 'Enter a phone number or an e-mail',
      stepOf: 'Step {n} of {total}', steps: ['Your request', 'Contacts', 'Where to reply'], next: 'Next', back: 'Back',
    },
    pages: {
      requestTitle: 'Send a request',
      requestIntro: 'Tell us briefly about the task and we will reply where it suits you: Telegram, Viber, WhatsApp, a call or e-mail.',
      requestAbout: 'How to reach us',
    },
  },
};

for (const [lang, groups] of Object.entries(texts)) {
  const file = join(web, 'src', 'i18n', 'dictionaries', `${lang}.json`);
  const dict = JSON.parse(readFileSync(file, 'utf8'));
  const added = [];
  for (const [group, values] of Object.entries(groups)) {
    dict[group] ??= {};
    for (const [key, value] of Object.entries(values)) {
      if (!(key in dict[group])) { dict[group][key] = value; added.push(`${group}.${key}`); }
    }
  }
  writeFileSync(file, `${JSON.stringify(dict, null, 2)}\n`);
  console.log(`${file}: ${added.length ? `added ${added.join(', ')}` : 'nothing to add'}`);
}

const css = join(web, 'src', 'app', 'concept.css');
if (existsSync(css)) {
  const src = readFileSync(css, 'utf8');
  const start = src.indexOf('/* ——— Request form');
  if (start === -1) {
    console.log(`${css}: no old form block, nothing to remove`);
  } else {
    // The old block (either version) ends with the `.done-mark-demo` rule.
    const last = src.indexOf('.done-mark-demo', start);
    const end = last === -1 ? -1 : src.indexOf('\n', last);
    if (end === -1) {
      console.log(`${css}: found the start of an old form block but not its end; delete it by hand (from "/* ——— Request form" to the ".done-mark-demo" rule)`);
    } else {
      writeFileSync(css, src.slice(0, start).trimEnd() + '\n' + src.slice(end + 1));
      console.log(`${css}: removed the old form block (styles now come from components/concept/concept-form.css)`);
    }
  }
} else {
  console.log(`${css} not found — is this script inside web/scripts?`);
}
console.log('Done. Restart the dev server (npm run dev).');
