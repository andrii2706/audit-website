import sharp from 'sharp';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const docs = vi.fn();
const global = vi.fn();
vi.mock('@/lib/strapi', async (orig) => ({
  ...(await orig<typeof import('@/lib/strapi')>()),
  getDocumentImages: () => docs(),
  getGlobal: () => global(),
}));
const { GET } = await import('@/app/api/document/[id]/route');

const ID = 'k3j4h5g6f7d8s9a0';
const call = (id: string) => GET(new NextRequest(`https://bp-audit.com.ua/api/document/${id}`), { params: Promise.resolve({ id }) });
const fetchMock = vi.fn();

beforeEach(async () => {
  vi.stubGlobal('fetch', fetchMock);
  const png = await sharp({ create: { width: 300, height: 400, channels: 3, background: '#fff' } }).png().toBuffer();
  fetchMock.mockReset().mockResolvedValue(new Response(new Uint8Array(png), { status: 200 }));
  docs.mockReset().mockResolvedValue([{ documentId: ID, title: 'Сертифікат', kind: 'certificate', image: { url: `/uploads/${ID}.png`, mime: 'image/png' } }]);
  global.mockReset().mockResolvedValue(null);
});

describe('GET /api/document/[id]', () => {
  it('serves the scan as a watermarked JPEG', async () => {
    const res = await call(ID);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect((await sharp(Buffer.from(await res.arrayBuffer())).metadata()).format).toBe('jpeg');
    expect(String(fetchMock.mock.calls[0][0])).toBe(`http://cms.test/uploads/${ID}.png`);
  });
  it('processes each scan once (memory cache)', async () => {
    await call(ID);
    await call(ID);
    expect(fetchMock).toHaveBeenCalledTimes(0); // already cached by the previous test
  });
  it('answers 404 for unknown ids, odd ids and non-image files', async () => {
    expect((await call('zzzzzzzzzzzzzz')).status).toBe(404);
    expect((await call('../../etc')).status).toBe(404);
    docs.mockResolvedValue([{ documentId: ID, title: 'PDF', kind: 'certificate', image: { url: '/uploads/x.pdf', mime: 'application/pdf' } }]);
    expect((await call(ID)).status).toBe(404);
  });
  it('never fetches files from other hosts', async () => {
    docs.mockResolvedValue([{ documentId: 'other1234567', title: 'x', kind: 'certificate', image: { url: 'https://evil.example/x.png', mime: 'image/png' } }]);
    expect((await call('other1234567')).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('redirects to the original when the watermark is switched off in the CMS', async () => {
    global.mockResolvedValue({ protection: { watermarkDocuments: false } });
    const res = await call(ID);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`http://cms.test/uploads/${ID}.png`);
  });
});
