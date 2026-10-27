#!/usr/bin/env node
/**
 * Runs automatically before `npm run dev` / `npm run develop` (see package.json "predev").
 * Makes the CMS start with zero manual setup on a fresh checkout:
 *  - creates cms/.env from .env.example if it is missing;
 *  - fills every empty or "tobemodified" secret with a random value (existing real values are kept);
 *  - creates web/.env.local (if ../web exists and the file is missing) with the same REVALIDATE_SECRET.
 * Secrets stay local: both files are git-ignored.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cms = join(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(cms, '..', 'web');
const rand = (n = 24) => randomBytes(n).toString('base64');

const envPath = join(cms, '.env');
const created = !existsSync(envPath);
let text = created ? readFileSync(join(cms, '.env.example'), 'utf8') : readFileSync(envPath, 'utf8');

const get = (k) => text.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim().replace(/^"|"$/g, '') ?? '';
const needs = (k) => {
  const v = get(k);
  return !v || /tobemodified/i.test(v);
};
const set = (k, v) => {
  const re = new RegExp(`^${k}=.*$`, 'm');
  text = re.test(text) ? text.replace(re, `${k}=${v}`) : `${text.trimEnd()}\n${k}=${v}\n`;
};

const generators = {
  APP_KEYS: () => `"${[rand(16), rand(16), rand(16), rand(16)].join(',')}"`,
  API_TOKEN_SALT: rand,
  ADMIN_JWT_SECRET: rand,
  TRANSFER_TOKEN_SALT: rand,
  JWT_SECRET: rand,
  ENCRYPTION_KEY: rand,
  REVALIDATE_SECRET: () => randomBytes(24).toString('hex'),
  DATABASE_CLIENT: () => 'sqlite',
  DATABASE_FILENAME: () => '.tmp/data.db',
};
const filled = [];
for (const [k, gen] of Object.entries(generators)) {
  if (needs(k)) {
    set(k, gen());
    filled.push(k);
  }
}
if (created || filled.length) {
  writeFileSync(envPath, text);
  console.log(created ? '✔ created cms/.env with random secrets' : `✔ cms/.env: generated ${filled.join(', ')}`);
}

// Website env (local dev only): same revalidation secret; the API token is written by the CMS on first start.
const webEnv = join(web, '.env.local');
if (existsSync(join(web, '.env.example')) && !existsSync(webEnv)) {
  let w = readFileSync(join(web, '.env.example'), 'utf8');
  w = w.replace(/^REVALIDATE_SECRET=.*$/m, `REVALIDATE_SECRET=${get('REVALIDATE_SECRET')}`);
  w = w.replace(/^SITE_URL=.*$/m, 'SITE_URL=http://localhost:3000');
  writeFileSync(webEnv, w);
  console.log('✔ created web/.env.local (STRAPI_WEB_TOKEN will be filled when the CMS starts)');
}
