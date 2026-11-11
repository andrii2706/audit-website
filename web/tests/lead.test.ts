import { describe, expect, it } from 'vitest';
import { cleanLine, cleanText, isValidEmail, isValidPhone, MIN_FILL_MS, parseLead } from '@/lib/lead';

const form = (fields: Record<string, string>) => ({ get: (k: string) => (k in fields ? fields[k] : null) });
const NOW = 1_800_000_000_000;
const valid = { name: 'Олена Коваль', phone: '+380 67 370 58 46', channel: 'viber', locale: 'uk', startedAt: String(NOW - 10_000) };

describe('cleanLine / cleanText', () => {
  it('trims, limits length and drops control and bidi characters', () => {
    expect(cleanLine('  Іван\u0000 ‮Петренко  ')).toBe('Іван Петренко');
    expect(cleanLine('a'.repeat(50), 10)).toHaveLength(10);
    expect(cleanLine(42 as unknown)).toBe('');
  });
  it('makes single-line fields single-line (no header injection)', () => {
    expect(cleanLine('Name\r\nBcc: x@evil.com')).toBe('Name Bcc: x@evil.com');
  });
  it('keeps paragraphs in the comment but collapses long gaps', () => {
    expect(cleanText('Рядок 1\r\n\r\n\r\n\r\nРядок 2')).toBe('Рядок 1\n\nРядок 2');
  });
});

describe('isValidPhone / isValidEmail', () => {
  it.each(['+380673705846', '067 370 58 46', '(050) 317-36-61', '+48 12 400 47 03'])('accepts %s', (p) => expect(isValidPhone(p)).toBe(true));
  it.each(['12345', 'call me', '+38067abc5846', '1'.repeat(16)])('rejects %s', (p) => expect(isValidPhone(p)).toBe(false));
  it.each(['name@company.com', 'a.b+c@sub.domain.ua'])('accepts %s', (e) => expect(isValidEmail(e)).toBe(true));
  it.each(['name@', '@company.com', 'name@company', 'a b@c.com', 'x<y>@c.com'])('rejects %s', (e) => expect(isValidEmail(e)).toBe(false));
});

describe('parseLead', () => {
  it('treats a filled honeypot as a bot', () => {
    expect(parseLead(form({ ...valid, company_site: 'https://spam.example' }), NOW)).toEqual({ kind: 'bot' });
  });
  it('shows field errors even for an instant empty submit (never a fake "thank you")', () => {
    expect(parseLead(form({ startedAt: String(NOW - 100) }), NOW).kind).toBe('invalid');
  });
  it('treats a form sent faster than a person can as a bot', () => {
    expect(parseLead(form({ ...valid, startedAt: String(NOW - MIN_FILL_MS + 100) }), NOW)).toEqual({ kind: 'bot' });
  });
  it('does not block when the start time is missing (no JavaScript)', () => {
    const noTime: Record<string, string> = { ...valid };
    delete noTime.startedAt;
    expect(parseLead(form(noTime), NOW).kind).toBe('ok');
  });
  it('needs a name and a phone or an e-mail', () => {
    expect(parseLead(form({ name: 'A' }), NOW)).toEqual({ kind: 'invalid', fieldErrors: { name: 'errName', contact: 'errContact' } });
  });
  it('flags a bad phone and a bad e-mail', () => {
    const r = parseLead(form({ name: 'Ок', phone: '123', email: 'nope' }), NOW);
    expect(r).toEqual({ kind: 'invalid', fieldErrors: { phone: 'errPhone', email: 'errEmail' } });
  });
  it('needs an e-mail when the answer should come by e-mail', () => {
    const r = parseLead(form({ name: 'Ок', phone: '+380673705846', channel: 'email' }), NOW);
    expect(r).toEqual({ kind: 'invalid', fieldErrors: { email: 'errEmail' } });
  });
  it('returns a clean lead', () => {
    const r = parseLead(form({ ...valid, comment: ' ТОВ «Приклад»\n\nАудит 2026 ', service: 'Аудиторські послуги' }), NOW);
    expect(r).toEqual({
      kind: 'ok',
      lead: {
        name: 'Олена Коваль', phone: '+380 67 370 58 46', email: undefined, service: 'Аудиторські послуги', revenue: undefined,
        channel: 'viber', comment: 'ТОВ «Приклад»\n\nАудит 2026', sourcePage: undefined, locale_code: 'uk',
      },
    });
  });
  it('falls back to Telegram for an unknown channel and ignores an unknown locale', () => {
    const r = parseLead(form({ ...valid, channel: 'carrier-pigeon', locale: 'ru' }), NOW);
    expect(r.kind === 'ok' && [r.lead.channel, r.lead.locale_code]).toEqual(['telegram', undefined]);
  });
});
