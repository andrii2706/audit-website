import { isLocale } from '@/i18n/config';
import type { LeadInput } from './strapi';

/**
 * Pure lead-form logic (no Next.js / network): parsing, sanitising and validating the submitted fields.
 * Used by the server action in app/actions.ts and covered by unit tests (lead.test.ts).
 */

export const CHANNELS = ['telegram', 'viber', 'whatsapp', 'call', 'email'] as const;
export type FieldErrorKey = 'errName' | 'errPhone' | 'errEmail' | 'errContact';
export type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'contact', FieldErrorKey>>;

/** A person needs at least this long to fill the form in; faster submissions are treated as bots. */
export const MIN_FILL_MS = 2500;

/** Control characters except tab/newline (kept in the comment only). Stops header/log injection via form fields. */
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

/** Trimmed, length-limited, single-line text from a form value. */
export function cleanLine(v: unknown, max = 500): string {
  if (typeof v !== 'string') return '';
  return v.replace(CONTROL, '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

/** Like cleanLine, but keeps line breaks (comment field). */
export function cleanText(v: unknown, max = 2000): string {
  if (typeof v !== 'string') return '';
  return v.replace(CONTROL, '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export function isValidEmail(email: string) {
  return email.length <= 150 && EMAIL.test(email);
}

/** Ukrainian and international numbers: 9–15 digits, only phone characters. */
export function isValidPhone(phone: string) {
  if (!/^[\d\s()+\-.]+$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, '').length;
  return digits >= 9 && digits <= 15;
}

type Getter = { get(name: string): FormDataEntryValue | null };

export type ParsedLead =
  | { kind: 'bot' }
  | { kind: 'invalid'; fieldErrors: FieldErrors }
  | { kind: 'ok'; lead: LeadInput };

/**
 * Reads a submitted lead form. `bot` = honeypot filled or the form was sent faster than a person could;
 * the caller answers "ok" without sending anything, so bots learn nothing.
 */
export function parseLead(form: Getter, now = Date.now()): ParsedLead {
  if (cleanLine(form.get('company_site'))) return { kind: 'bot' };

  const name = cleanLine(form.get('name'), 100);
  const phone = cleanLine(form.get('phone'), 40);
  const email = cleanLine(form.get('email'), 150);
  const channel = cleanLine(form.get('channel'), 20);

  const fieldErrors: FieldErrors = {};
  if (name.length < 2) fieldErrors.name = 'errName';
  if (!phone && !email) fieldErrors.contact = 'errContact';
  if (phone && !isValidPhone(phone)) fieldErrors.phone = 'errPhone';
  if (email && !isValidEmail(email)) fieldErrors.email = 'errEmail';
  // "Answer by e-mail" needs an address.
  if (channel === 'email' && !email && !fieldErrors.contact) fieldErrors.email = 'errEmail';
  // Validation first: a person who presses «Надіслати» on an empty form right away must see what is missing,
  // not a fake "thank you". Bots fill everything in, so they still meet the timing check below.
  if (Object.keys(fieldErrors).length) return { kind: 'invalid', fieldErrors };

  const startedAt = Number(cleanLine(form.get('startedAt'), 20));
  if (startedAt > 0 && now - startedAt < MIN_FILL_MS) return { kind: 'bot' };

  const locale = cleanLine(form.get('locale'), 5);
  return {
    kind: 'ok',
    lead: {
      name,
      phone: phone || undefined,
      email: email || undefined,
      service: cleanLine(form.get('service'), 200) || undefined,
      revenue: cleanLine(form.get('revenue'), 50) || undefined,
      channel: (CHANNELS as readonly string[]).includes(channel) ? (channel as LeadInput['channel']) : 'telegram',
      comment: cleanText(form.get('comment'), 2000) || undefined,
      sourcePage: cleanLine(form.get('sourcePage'), 200) || undefined,
      locale_code: isLocale(locale) ? locale : undefined,
    },
  };
}
