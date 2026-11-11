import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const revalidateTag = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag: (...a: unknown[]) => revalidateTag(...a) }));
const { POST } = await import('@/app/api/revalidate/route');

const call = (secret?: string) =>
  POST(new NextRequest('http://127.0.0.1:3000/api/revalidate', { method: 'POST', headers: secret ? { 'x-revalidate-secret': secret } : {} }));

beforeEach(() => {
  revalidateTag.mockReset();
  process.env.REVALIDATE_SECRET = 'right-secret-value';
});

describe('POST /api/revalidate', () => {
  it('refreshes the CMS cache with the right secret', async () => {
    const res = await call('right-secret-value');
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith('strapi', { expire: 0 });
  });
  it('rejects a wrong or missing secret', async () => {
    expect((await call('wrong')).status).toBe(401);
    expect((await call()).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
  it('rejects everything when no secret is configured', async () => {
    delete process.env.REVALIDATE_SECRET;
    expect((await call('')).status).toBe(401);
  });
});
