import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getGlobal = vi.fn();
vi.mock('@/lib/strapi', () => ({ getGlobal: (...a: unknown[]) => getGlobal(...a) }));

const { proxy, resetBotSetting } = await import('@/proxy');

const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const call = (path: string, headers: Record<string, string> = {}, method = 'GET') =>
  proxy(new NextRequest(`https://bp-audit.com.ua${path}`, { headers: { 'user-agent': BROWSER, ...headers }, method }));
const go = async (path: string, headers: Record<string, string> = {}) => {
  const res = await call(path, headers);
  return res ? new URL(res.headers.get('location')!).pathname : null;
};

beforeEach(() => {
  resetBotSetting();
  getGlobal.mockReset().mockResolvedValue(null);
  delete process.env.BLOCK_BOTS;
});

describe('language redirects', () => {
  it('leaves localized URLs alone', async () => {
    expect(await go('/uk/team')).toBeNull();
    expect(await go('/en')).toBeNull();
  });
  it('uses the language cookie first', async () => expect(await go('/team', { cookie: 'NEXT_LOCALE=en', 'accept-language': 'uk' })).toBe('/en/team'));
  it('follows the browser language', async () => expect(await go('/', { 'accept-language': 'uk-UA,uk;q=0.9,en;q=0.8' })).toBe('/uk'));
  it('sends ru/be browsers to Ukrainian', async () => expect(await go('/contacts', { 'accept-language': 'ru-RU,ru;q=0.9' })).toBe('/uk/contacts'));
  it('sends other languages to English', async () => expect(await go('/', { 'accept-language': 'de-DE,de;q=0.9' })).toBe('/en'));
  it('defaults to Ukrainian without a header', async () => expect(await go('/about')).toBe('/uk/about'));
  it('respects q-values', async () => expect(await go('/', { 'accept-language': 'uk;q=0.3, en;q=0.9' })).toBe('/en'));
});

describe('bot blocking', () => {
  const outside = { 'x-real-ip': '203.0.113.7' };

  it('answers 403 to AI crawlers and scraping tools coming through nginx', async () => {
    for (const ua of ['GPTBot/1.2', 'python-requests/2.32', '']) {
      resetBotSetting();
      const res = await call('/uk/services', { ...outside, 'user-agent': ua });
      expect(res?.status, ua).toBe(403);
      expect(await res!.text()).toContain('Автоматизоване копіювання');
    }
  });
  it('serves browsers and search engines normally', async () => {
    expect(await call('/uk/services', outside)).toBeUndefined();
    expect(await call('/uk/services', { ...outside, 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' })).toBeUndefined();
  });
  it('never blocks the server itself (no nginx headers) or HEAD requests', async () => {
    expect(await call('/uk', { 'user-agent': 'curl/8.5.0' })).toBeUndefined();
    expect(await call('/uk', { ...outside, 'user-agent': 'curl/8.5.0' }, 'HEAD')).toBeUndefined();
  });
  it('follows «Без ботів ШІ» in the CMS and caches the setting', async () => {
    getGlobal.mockResolvedValue({ protection: { blockAiCrawlers: false } });
    expect(await call('/uk', { ...outside, 'user-agent': 'GPTBot/1.2' })).toBeUndefined();
    expect(await call('/uk', { ...outside, 'user-agent': 'GPTBot/1.2' })).toBeUndefined();
    expect(getGlobal).toHaveBeenCalledTimes(1);
  });
  it('keeps blocking when the CMS is unreachable', async () => {
    getGlobal.mockRejectedValue(new Error('down'));
    expect((await call('/uk', { ...outside, 'user-agent': 'GPTBot/1.2' }))?.status).toBe(403);
  });
  it('can be switched off with BLOCK_BOTS=false', async () => {
    process.env.BLOCK_BOTS = 'false';
    expect(await call('/uk', { ...outside, 'user-agent': 'GPTBot/1.2' })).toBeUndefined();
    expect(getGlobal).not.toHaveBeenCalled();
  });
  it('checks bots before redirecting', async () => {
    expect((await call('/', { ...outside, 'user-agent': 'Scrapy/2.11' }))?.status).toBe(403);
  });
});
