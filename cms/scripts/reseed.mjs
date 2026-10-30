#!/usr/bin/env node
/**
 * `npm run reseed` — starts the CMS in development mode once with RESEED_CONTENT=true:
 * the site content (services, team, pages, articles, news templates…) is replaced with the current
 * starter content from src/seed. Admin users, leads, vacancies, transparency reports and uploaded files stay.
 * After it has started you can keep working; the next `npm run dev` won't reseed again.
 */
import { spawn } from 'node:child_process';

console.log('\n⚠ Replacing the site content with the starter content (admin users, leads and uploads are kept)…\n');
const child = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true, env: { ...process.env, RESEED_CONTENT: 'true' } });
child.on('exit', (code) => process.exit(code ?? 0));
