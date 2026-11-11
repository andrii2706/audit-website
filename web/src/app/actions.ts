'use server';

import { headers } from 'next/headers';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { sendLeadEmails } from '@/lib/mail';
import { cleanLine, parseLead, type FieldErrors } from '@/lib/lead';
import { clientIp, leadGlobalLimiter, leadLimiter } from '@/lib/rate-limit';
import { createLead, getGlobal, type LeadInput } from '@/lib/strapi';

export type LeadState = {
  ok: boolean;
  error?: boolean;
  /** Too many requests from this address (rate limit); the form asks to try later or call. */
  rateLimited?: boolean;
  /** Set only by the GitHub Pages demo build (demo/actions.ts): nothing was sent. */
  demo?: boolean;
  /** Values are dictionary keys in `form` so the client shows them in its language. `contact` = neither phone nor e-mail. */
  fieldErrors?: FieldErrors;
};

/**
 * Receives a lead from any site form, validates it (lib/lead.ts), stores it in Strapi (collection "Lead") and
 * e-mails it to the company (+ a confirmation to the client). The client needs a phone OR an e-mail.
 * The request counts as delivered if it reached at least one destination (Strapi or e-mail).
 * Abuse protection: honeypot + minimum fill time (bots get a silent "ok"), per-address and global rate limits.
 * Next.js itself rejects server-action calls whose Origin doesn't match the site (CSRF).
 */
export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const parsed = parseLead(form);
  if (parsed.kind === 'bot') return { ok: true };
  if (parsed.kind === 'invalid') return { ok: false, fieldErrors: parsed.fieldErrors };

  const h = await headers();
  if (!leadLimiter.hit(clientIp(h)) || !leadGlobalLimiter.hit('all')) return { ok: false, rateLimited: true };

  const lead = parsed.lead;
  lead.sourcePage ??= cleanLine(h.get('referer'), 200) || undefined;
  const loc: Locale = isLocale(lead.locale_code ?? '') ? (lead.locale_code as Locale) : 'uk';
  const [global, dict] = await Promise.all([getGlobal(loc), getDictionary(loc)]);
  const [saved, mailed] = await Promise.all([
    createLead(lead),
    sendLeadEmails(lead, loc, { site: global?.siteName ?? dict.meta.siteName, companyEmail: global?.email, phone: global?.phone }),
  ]);
  if (!saved && !mailed) return { ok: false, error: true };
  await notifyTelegram(lead);
  return { ok: true };
}

/** Optional Telegram notification (when TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set). */
async function notifyTelegram(lead: LeadInput) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const lines = [
    '🆕 Нова заявка з сайту',
    `Ім'я: ${lead.name}`,
    lead.phone && `Телефон: ${lead.phone}`,
    lead.email && `E-mail: ${lead.email}`,
    lead.service && `Послуга: ${lead.service}`,
    lead.revenue && `Виручка: ${lead.revenue}`,
    lead.channel && `Відповісти в: ${lead.channel}`,
    lead.comment && `Коментар: ${lead.comment}`,
    lead.locale_code && `Мова: ${lead.locale_code}`,
    lead.sourcePage && `Сторінка: ${lead.sourcePage}`,
  ].filter(Boolean);
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n') }),
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[telegram]', (err as Error).message);
  }
}
