import { beforeEach, describe, expect, it, vi } from 'vitest';

const createLead = vi.fn();
const sendLeadEmails = vi.fn();
const hdrs = new Headers();
vi.mock('next/headers', () => ({ headers: async () => hdrs }));
vi.mock('@/lib/mail', () => ({ sendLeadEmails: (...a: unknown[]) => sendLeadEmails(...a) }));
vi.mock('@/lib/strapi', () => ({ createLead: (...a: unknown[]) => createLead(...a), getGlobal: async () => ({ siteName: 'BP', email: 'office@example.com' }) }));

const { submitLead } = await import('@/app/actions');

let ipCounter = 1;
const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ startedAt: String(Date.now() - 10_000), locale: 'uk', channel: 'telegram', ...fields })) f.set(k, v);
  return f;
};
const send = (fields: Record<string, string>) => submitLead({ ok: false }, form(fields));

beforeEach(() => {
  createLead.mockReset().mockResolvedValue(true);
  sendLeadEmails.mockReset().mockResolvedValue(true);
  hdrs.set('x-real-ip', `198.51.100.${ipCounter++}`);
  hdrs.set('referer', 'https://bp-audit.com.ua/uk/services/audyt');
});

describe('submitLead (server action)', () => {
  it('saves a valid lead to the CMS and e-mails it', async () => {
    expect(await send({ name: 'Олена', phone: '+380 67 123 45 67' })).toEqual({ ok: true });
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ name: 'Олена', locale_code: 'uk', sourcePage: 'https://bp-audit.com.ua/uk/services/audyt' }));
    expect(sendLeadEmails.mock.calls[0][1]).toBe('uk');
  });
  it('returns field errors and stores nothing for invalid input', async () => {
    const res = await send({ name: '', phone: '', email: '' });
    expect(res.ok).toBe(false);
    expect(res.fieldErrors).toMatchObject({ name: 'errName', contact: 'errContact' });
    expect(createLead).not.toHaveBeenCalled();
  });
  it('answers bots with a silent "ok" and stores nothing', async () => {
    expect(await send({ name: 'Bot', phone: '+380671234567', company_site: 'http://spam.example' })).toEqual({ ok: true });
    expect(await send({ name: 'Bot', phone: '+380671234567', startedAt: String(Date.now()) })).toEqual({ ok: true });
    expect(createLead).not.toHaveBeenCalled();
    expect(sendLeadEmails).not.toHaveBeenCalled();
  });
  it('limits one address to 5 leads per 10 minutes', async () => {
    hdrs.set('x-real-ip', '198.51.100.250');
    for (let i = 0; i < 5; i++) expect((await send({ name: 'Ira', email: 'ira@example.com' })).ok).toBe(true);
    expect(await send({ name: 'Ira', email: 'ira@example.com' })).toEqual({ ok: false, rateLimited: true });
  });
  it('counts as delivered when only one of CMS / e-mail worked', async () => {
    createLead.mockResolvedValue(false);
    expect((await send({ name: 'Анна', email: 'a@example.com' })).ok).toBe(true);
    createLead.mockResolvedValue(true);
    sendLeadEmails.mockResolvedValue(false);
    expect((await send({ name: 'Богдан', email: 'b@example.com' })).ok).toBe(true);
  });
  it('reports an error when neither CMS nor e-mail worked', async () => {
    createLead.mockResolvedValue(false);
    sendLeadEmails.mockResolvedValue(false);
    expect(await send({ name: 'Світлана', email: 'c@example.com' })).toEqual({ ok: false, error: true });
  });
});
