#!/usr/bin/env node
/**
 * Cross-platform (Windows/macOS/Linux) launcher for the standalone production build.
 * 1. Copies .next/static and public/ into .next/standalone (Next.js does not do this itself).
 * 2. Loads .env.local / .env if present (real environment variables take precedence).
 * 3. Starts .next/standalone/server.js.
 * Usage: npm run build && npm start
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const standalone = join(root, '.next', 'standalone');
if (!existsSync(join(standalone, 'server.js'))) {
  console.error('No standalone build found. Run `npm run build` first.');
  process.exit(1);
}

for (const [from, to] of [
  [join(root, '.next', 'static'), join(standalone, '.next', 'static')],
  [join(root, 'public'), join(standalone, 'public')],
]) {
  rmSync(to, { recursive: true, force: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

for (const file of ['.env.local', '.env']) {
  const p = join(root, file);
  if (!existsSync(p)) continue;
  const before = { ...process.env };
  process.loadEnvFile(p);
  Object.assign(process.env, before); // keep variables that were already set
}

process.env.PORT ??= '3000';
process.env.HOSTNAME ??= '0.0.0.0';
process.chdir(standalone);
await import(join(standalone, 'server.js'));
