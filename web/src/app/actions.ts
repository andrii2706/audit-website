'use server';

import { headers } from 'next/headers';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { sendLeadEmails } from '@/lib/mail';
import { createLead, getGlobal, type LeadInput } from '@/lib/strapi';

export type LeadState = {
  ok: boolean;
  error?: boolean;
  /** Values are dictionary keys in `form` so the client shows them in its language. `contact` = neither phone nor e-mail. */
  fieldErrors?: Partial<Record<'name' | 'phone' | 'email' | 'contact', 'errName' | 'errPhone' | 'errEmail' | 'errContact'>>;
};

const CHANNELS = ['telegram', 'viber', 'whatsapp', 'call', 'email'] as const;
const str = (v: FormDataEntryValue | null, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Receives a lead from any site form, validates it, stores it in Strapi (collection "Lead") and
 * e-mails it to the company (+ a confirmation to the client). The client needs a phone OR an e-mail.
 * The request counts as delivered if it reached at least one destination (Strapi or e-mail).
 */
export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  // Bot trap: the field is hidden from people.
  if (str(form.get('company_site'))) return { ok: true };

  const name = str(form.get('name'), 100);
  const phone = str(form.get('phone'), 40);
  const email = str(form.get('email'), 150);
  const fieldErrors: LeadState['fieldErrors'] = {};
  if (name.length < 2) fieldErrors.name = 'errName';
  const channel = str(form.get('channel'), 20);
  if (!phone && !email) fieldErrors.contact = 'errContact';
  if (phone && phone.replace(/\D/g, '').length < 9) fieldErrors.phone = 'errPhone';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = 'errEmail';
  // "Answer by e-mail" needs an address.
  if (channel === 'email' && !email && !fieldErrors.contact) fieldErrors.email = 'errEmail';
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const locale = str(form.get('locale'), 5);
  const lead: LeadInput = {
    name,
    phone: phone || undefined,
    email: email || undefined,
    service: str(form.get('service'), 200) || undefined,
    revenue: str(form.get('revenue'), 50) || undefined,
    channel: (CHANNELS as readonly string[]).includes(channel) ? (channel as LeadInput['channel']) : 'telegram',
    comment: str(form.get('comment'), 2000) || undefined,
    sourcePage: str(form.get('sourcePage'), 200) || (await headers()).get('referer') || undefined,
    locale_code: isLocale(locale) ? locale : undefined,
  };

  const loc: Locale = isLocale(locale) ? locale : 'uk';
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
