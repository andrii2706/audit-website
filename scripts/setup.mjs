#!/usr/bin/env node
/**
 * One-time local setup (Windows/macOS/Linux):
 *   node scripts/setup.mjs
 * Creates cms/.env and web/.env.local from the .env.example files, fills every secret with a
 * random value and uses the same REVALIDATE_SECRET in both. Existing files are never overwritten.
 * The website API token is filled into web/.env.local by the CMS on its first start.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rand = (n = 24) => randomBytes(n).toString('base64');
const revalidate = randomBytes(24).toString('hex');

function setVar(text, key, value) {
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(text) ? text.replace(re, `${key}=${value}`) : `${text.trimEnd()}\n${key}=${value}\n`;
}

function create(target, example, vars) {
  const t = join(root, target);
  if (existsSync(t)) return console.log(`• ${target} already exists — left unchanged`);
  let text = readFileSync(join(root, example), 'utf8');
  for (const [k, v] of Object.entries(vars)) text = setVar(text, k, v);
  writeFileSync(t, text);
  console.log(`✔ created ${target}`);
}

create('cms/.env', 'cms/.env.example', {
  APP_KEYS: `"${[rand(16), rand(16), rand(16), rand(16)].join(',')}"`,
  API_TOKEN_SALT: rand(),
  ADMIN_JWT_SECRET: rand(),
  TRANSFER_TOKEN_SALT: rand(),
  JWT_SECRET: rand(),
  ENCRYPTION_KEY: rand(),
  REVALIDATE_SECRET: revalidate,
  DATABASE_FILENAME: '.tmp/data.db',
});
create('web/.env.local', 'web/.env.example', {
  REVALIDATE_SECRET: revalidate,
  SITE_URL: 'http://localhost:3000',
});

if (existsSync(join(root, 'cms/.env')) && existsSync(join(root, 'web/.env.local'))) {
  const a = readFileSync(join(root, 'cms/.env'), 'utf8').match(/^REVALIDATE_SECRET=(.*)$/m)?.[1];
  const b = readFileSync(join(root, 'web/.env.local'), 'utf8').match(/^REVALIDATE_SECRET=(.*)$/m)?.[1];
  if (a !== b) console.warn('⚠ REVALIDATE_SECRET differs between cms/.env and web/.env.local — make them equal.');
}
console.log('\nNext: cd cms && npm install && npm run dev   (then: cd web && npm install && npm run dev)');
