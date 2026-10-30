#!/usr/bin/env node
/**
 * `npm run import-media` — starts the CMS in development mode once with IMPORT_MEDIA=true:
 * downloads the client logos, certificate/recommendation scans and transparency-report PDFs from the old site
 * (https://bp-audit.com.ua, see src/seed/legacy.ts) into the media library and attaches them to their entries.
 * Run it on a machine with internet access. Already attached files are skipped, so it is safe to run again.
 */
import { spawn } from 'node:child_process';

console.log('\n⬇ Importing images and PDFs from the old site into the media library…\n');
const child = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true, env: { ...process.env, IMPORT_MEDIA: 'true' } });
child.on('exit', (code) => process.exit(code ?? 0));
