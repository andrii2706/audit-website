import { expect, test } from '@playwright/test';
import { CMS_URL } from './helpers';

const OUTSIDE = { 'x-real-ip': '203.0.113.7' }; // what nginx adds for a visitor from the internet

test('pages carry the security headers', async ({ request }) => {
  const h = (await request.get('/uk')).headers();
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['content-security-policy']).toContain("object-src 'none'");
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['cross-origin-opener-policy']).toBe('same-origin');
  expect(h['tdm-reservation']).toBe('1');
  expect(h['x-powered-by']).toBeUndefined();
});

test('AI crawlers and scraping tools get 403, browsers and Google don’t', async ({ request }) => {
  for (const ua of ['Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)', 'python-requests/2.32.3', 'Wget/1.21', 'curl/8.5.0']) {
    const res = await request.get('/uk/services', { headers: { ...OUTSIDE, 'user-agent': ua } });
    expect(res.status(), ua).toBe(403);
  }
  for (const ua of ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36']) {
    const res = await request.get('/uk/services', { headers: { ...OUTSIDE, 'user-agent': ua } });
    expect(res.status(), ua).toBe(200);
  }
  // HEAD (uptime monitors, `curl -I`) stays open.
  expect((await request.head('/uk', { headers: { ...OUTSIDE, 'user-agent': 'curl/8.5.0' } })).status()).toBe(200);
});

test('robots.txt shuts out AI crawlers but keeps search engines', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toMatch(/User-Agent: \*\s+Allow: \//i);
  for (const bot of ['GPTBot', 'ClaudeBot', 'CCBot', 'PerplexityBot']) expect(txt).toContain(bot);
  expect(txt).toContain('Sitemap:');
  const tdm = await request.get('/.well-known/tdmrep.json');
  expect(tdm.status()).toBe(200);
  expect(await tdm.json()).toEqual([{ location: '/', 'tdm-reservation': 1 }]);
});

test('the cache refresh hook needs the secret', async ({ request }) => {
  expect((await request.post('/api/revalidate')).status()).toBe(401);
  expect((await request.post('/api/revalidate', { headers: { 'x-revalidate-secret': 'guess' } })).status()).toBe(401);
  expect((await request.get('/api/revalidate')).status()).toBe(405);
});

test.describe('CMS', () => {
  test.skip(!!process.env.E2E_SKIP_CMS, 'E2E_SKIP_CMS is set');

  test('content and leads can’t be downloaded from the API without the token', async ({ request }) => {
    for (const path of ['/api/services?locale=uk', '/api/global', '/api/news-items', '/api/leads', '/api/users', '/api/upload/files']) {
      const res = await request.get(`${CMS_URL}${path}`);
      expect([401, 403, 404], path).toContain(res.status());
    }
  });
  test('nobody can sign up or create leads anonymously', async ({ request }) => {
    const reg = await request.post(`${CMS_URL}/api/auth/local/register`, { data: { username: 'x', email: 'x@example.com', password: 'Passw0rd!!' } });
    expect(reg.ok()).toBe(false);
    const lead = await request.post(`${CMS_URL}/api/leads`, { data: { data: { name: 'x', email: 'x@example.com' } } });
    expect([401, 403]).toContain(lead.status());
  });
  test('the CMS does not advertise itself', async ({ request }) => {
    const h = (await request.get(`${CMS_URL}/_health`)).headers();
    expect(h['x-powered-by']).toBeUndefined();
  });
});
