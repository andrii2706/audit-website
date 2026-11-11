import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as S from '@/lib/strapi';
import { createLead, documentImageUrl, getFaqs, getGlobal, mediaUrl, uploadSourceUrl } from '@/lib/strapi';

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.STRAPI_WEB_TOKEN;
  delete process.env.PAGES_DEMO;
});
const json = (data: unknown, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { 'content-type': 'application/json' } });

describe('CMS requests', () => {
  it('reads the content API with the website token (the API is closed to the public)', async () => {
    process.env.STRAPI_WEB_TOKEN = 'tok123';
    fetchMock.mockResolvedValue(json({ siteName: 'BP' }));
    expect(await getGlobal('uk')).toEqual({ siteName: 'BP' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/^http:\/\/cms\.test\/api\/global\?locale=uk&/);
    expect(init.headers).toEqual({ Authorization: 'Bearer tok123' });
    expect(init.next.tags).toEqual(['strapi']);
  });
  it('sends no Authorization header without a token', async () => {
    fetchMock.mockResolvedValue(json([]));
    await getFaqs('uk');
    expect(fetchMock.mock.calls[0][1].headers).toBeUndefined();
  });
  it('returns empty data and explains the token when the CMS answers 403', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 403 }));
    expect(await getFaqs('uk')).toEqual([]);
    expect(String((console.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain('STRAPI_WEB_TOKEN');
  });
  it('survives an unreachable CMS', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    expect(await getFaqs('uk')).toEqual([]);
  });
  it('falls back to settings without «Захист контенту» when the CMS schema is older', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"error":{"message":"Invalid key protection"}}', { status: 400 })).mockResolvedValueOnce(json({ siteName: 'BP' }));
    expect(await getGlobal('uk')).toEqual({ siteName: 'BP' });
    expect(String(fetchMock.mock.calls[1][0])).not.toContain('protection');
  });
});

describe('media URLs', () => {
  it('builds absolute URLs for uploads', () => {
    expect(mediaUrl({ url: '/uploads/a.jpg' })).toBe('http://cms.test/uploads/a.jpg');
    expect(mediaUrl({ url: 'https://cdn.example.com/a.jpg' })).toBe('https://cdn.example.com/a.jpg');
    expect(mediaUrl(null)).toBeNull();
  });
  it('fetches originals only from this CMS (no other hosts, no path tricks)', () => {
    expect(uploadSourceUrl({ url: '/uploads/scan.png' })).toBe('http://cms.test/uploads/scan.png');
    expect(uploadSourceUrl({ url: 'http://cms.test/uploads/scan.png' })).toBe('http://cms.test/uploads/scan.png');
    expect(uploadSourceUrl({ url: 'https://evil.example/uploads/x.png' })).toBeNull();
    expect(uploadSourceUrl({ url: '/uploads/../admin' })).toBeNull();
    expect(uploadSourceUrl({ url: '/etc/passwd' })).toBeNull();
  });
  it('points document scans to the watermarked version', () => {
    const d = { documentId: 'abc123def456', image: { url: '/uploads/c.jpg', mime: 'image/jpeg' } };
    expect(documentImageUrl(d, true)).toBe('/api/document/abc123def456');
    expect(documentImageUrl(d, false)).toBe('http://cms.test/uploads/c.jpg');
    expect(documentImageUrl({ ...d, image: { url: '/uploads/c.pdf', mime: 'application/pdf' } }, true)).toBe('http://cms.test/uploads/c.pdf');
    process.env.PAGES_DEMO = '1';
    expect(documentImageUrl(d, true)).toBe('http://cms.test/uploads/c.jpg');
  });
});

describe('page queries', () => {
  const getters: [string, () => Promise<unknown>, string][] = [
    ['homepage', () => S.getHomepage('uk'), 'homepage?'],
    ['about', () => S.getAboutPage('uk'), 'about-page?'],
    ['documents', () => S.getDocumentImages('uk'), 'document-images?'],
    ['career', () => S.getCareerPage('en'), 'career-page?locale=en'],
    ['vacancies', () => S.getVacancies('uk'), 'vacancies?'],
    ['reports', () => S.getTransparencyReports('uk'), 'transparency-reports?'],
    ['featured', () => S.getFeaturedServices('uk'), 'filters%5BhomeFeatured%5D%5B%24eq%5D=true'],
    ['all services', () => S.getAllServices('uk'), 'services?'],
    ['service', () => S.getServiceBySlug('uk', 'audyt'), 'filters%5Bslug%5D%5B%24eq%5D=audyt'],
    ['categories', () => S.getCategories('uk'), 'service-categories?'],
    ['audiences', () => S.getAudiences('uk'), 'audiences?'],
    ['team', () => S.getTeam('uk'), 'team-members?'],
    ['clients', () => S.getClients('uk'), 'client-logos?'],
    ['articles', () => S.getArticles('uk', 3), 'articles?'],
    ['article', () => S.getArticleBySlug('uk', 'a'), 'articles?'],
    ['news', () => S.getNews('uk', 3), 'news-items?'],
    ['news item', () => S.getNewsBySlug('uk', 'n'), 'news-items?'],
    ['slug check', () => S.slugExists('services', 'uk', 'x'), 'services?'],
  ];
  it.each(getters)('%s asks the right endpoint and survives an empty CMS', async (_n, get, part) => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 404 }));
    const res = await get();
    expect(String(fetchMock.mock.calls[0][0])).toContain(part);
    expect(res === null || res === false || (Array.isArray(res) && res.length === 0)).toBe(true);
  });
  it('returns the first match for slug lookups and drops documents without a picture', async () => {
    fetchMock.mockResolvedValueOnce(json([{ slug: 'audyt', title: 'Аудит' }]));
    expect(await S.getServiceBySlug('uk', 'audyt')).toMatchObject({ title: 'Аудит' });
    fetchMock.mockResolvedValueOnce(json([{ documentId: 'a', image: { url: '/uploads/a.jpg' } }, { documentId: 'b', image: null }]));
    expect((await S.getDocumentImages('uk')).map((d) => d.documentId)).toEqual(['a']);
    fetchMock.mockResolvedValueOnce(json([{ slug: 'x' }]));
    expect(await S.slugExists('news-items', 'uk', 'x')).toBe(true);
  });
});

describe('createLead', () => {
  const lead = { name: 'Олена', phone: '+380671234567' };
  it('refuses to send without the token', async () => {
    expect(await createLead(lead)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('posts the lead with the token and reports the result', async () => {
    process.env.STRAPI_WEB_TOKEN = 'tok';
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 201 }));
    expect(await createLead(lead)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://cms.test/api/leads');
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', headers: { Authorization: 'Bearer tok' } });
    expect(JSON.parse(init.body)).toEqual({ data: lead });
    fetchMock.mockResolvedValueOnce(new Response('bad', { status: 400 }));
    expect(await createLead(lead)).toBe(false);
  });
});

describe('public media address', () => {
  it('links media to the public CMS address while reading data internally', async () => {
    vi.resetModules();
    vi.stubEnv('STRAPI_PUBLIC_URL', 'https://cms.bp-audit.com.ua/');
    const fresh = await import('@/lib/strapi');
    expect(fresh.mediaUrl({ url: '/uploads/report.pdf' })).toBe('https://cms.bp-audit.com.ua/uploads/report.pdf');
    expect(fresh.uploadSourceUrl({ url: '/uploads/report.pdf' })).toBe('http://cms.test/uploads/report.pdf');
    vi.unstubAllEnvs();
  });
});
