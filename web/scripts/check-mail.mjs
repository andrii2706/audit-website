#!/usr/bin/env node
/**
 * Checks the lead e-mail settings on this machine: connects to the SMTP server from the environment
 * (or web/.env.local) and sends one test message.  Usage:  npm run check-mail [-- someone@example.com]
 * Without an address the test goes to LEAD_EMAIL_TO.
 */
import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';

const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const { SMTP_HOST, SMTP_PORT = '587', SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM, LEAD_EMAIL_TO } = process.env;
const to = process.argv[2] || LEAD_EMAIL_TO;
if (!SMTP_HOST) {
  console.error('✖ SMTP_HOST is empty: the site sends no e-mails. Fill the SMTP_* variables (see .env.example).');
  process.exit(1);
}
if (!to) {
  console.error('✖ No recipient: pass an address (npm run check-mail -- you@example.com) or set LEAD_EMAIL_TO.');
  process.exit(1);
}
const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === 'true',
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});
try {
  await transport.verify();
  console.log(`✔ Connected to ${SMTP_HOST}:${SMTP_PORT} as ${SMTP_USER || '(no login)'}`);
  const info = await transport.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject: 'Перевірка пошти сайту / Site e-mail test',
    text: 'Якщо ви бачите цей лист, сайт може надсилати заявки та підтвердження.\nIf you can read this, the site can send leads and confirmations.',
  });
  console.log(`✔ Test e-mail sent to ${to} (${info.response}). Check the inbox and the spam folder.`);
} catch (err) {
  console.error(`✖ ${err.message}`);
  console.error('  Check SMTP_HOST/PORT/SECURE (465 → SMTP_SECURE=true), the login and password, and that the server allows this IP.');
  process.exit(1);
}
