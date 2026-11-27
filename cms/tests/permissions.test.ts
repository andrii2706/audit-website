import { afterEach, describe, expect, it, vi } from 'vitest';
import { ensurePublicPermissions, ensureWebToken, WEB_TOKEN_PERMISSIONS } from '../src/seed';

afterEach(() => {
  delete process.env.PUBLIC_CONTENT_API;
});

function fakeStrapi({ token = null as null | { id: number; permissions: { action: string }[] }, publicPerms = [] as { action: string }[] } = {}) {
  const perm = { findMany: vi.fn(async () => publicPerms), create: vi.fn(async () => ({})), deleteMany: vi.fn(async () => ({ count: 3 })) };
  const role = { findOne: vi.fn(async () => ({ id: 7 })) };
  const apiToken = { findOne: vi.fn(async () => token) };
  const tokenService = { update: vi.fn(async () => ({})), create: vi.fn(async () => ({ accessKey: 'new-key' })) };
  const query = vi.fn((uid: string) => (uid === 'plugin::users-permissions.permission' ? perm : uid === 'admin::api-token' ? apiToken : role));
  const log = { info: vi.fn(), warn: vi.fn() };
  return { strapi: { db: { query }, service: vi.fn(() => tokenService), log } as any, perm, tokenService, log };
}

describe('website token permissions', () => {
  it('reads every site content type and creates leads, but can never read leads', () => {
    expect(WEB_TOKEN_PERMISSIONS).toContain('api::lead.lead.create');
    expect(WEB_TOKEN_PERMISSIONS).toContain('api::service.service.find');
    expect(WEB_TOKEN_PERMISSIONS).toContain('api::global.global.find');
    expect(WEB_TOKEN_PERMISSIONS.filter((p) => p.startsWith('api::lead.'))).toEqual(['api::lead.lead.create']);
    expect(WEB_TOKEN_PERMISSIONS.every((p) => /\.(find|findOne|create)$/.test(p))).toBe(true);
  });

  it('upgrades an old create-only token (same key, so web.env.local stays valid)', async () => {
    const f = fakeStrapi({ token: { id: 5, permissions: [{ action: 'api::lead.lead.create' }] } });
    await ensureWebToken(f.strapi);
    expect(f.tokenService.update).toHaveBeenCalledWith(5, expect.objectContaining({ type: 'custom', permissions: WEB_TOKEN_PERMISSIONS }));
    expect(f.tokenService.create).not.toHaveBeenCalled();
  });
  it('removes permissions someone added to the token by hand (e.g. reading leads)', async () => {
    const f = fakeStrapi({ token: { id: 5, permissions: [...WEB_TOKEN_PERMISSIONS, 'api::lead.lead.find'].map((action) => ({ action })) } });
    await ensureWebToken(f.strapi);
    expect(f.tokenService.update).toHaveBeenCalledWith(5, expect.objectContaining({ permissions: WEB_TOKEN_PERMISSIONS }));
  });
  it('leaves an up-to-date token alone', async () => {
    const f = fakeStrapi({ token: { id: 5, permissions: WEB_TOKEN_PERMISSIONS.map((action) => ({ action })) } });
    await ensureWebToken(f.strapi);
    expect(f.tokenService.update).not.toHaveBeenCalled();
  });
});

describe('public content API', () => {
  it('is closed by default: the Public role loses content and upload read access', async () => {
    const f = fakeStrapi();
    await ensurePublicPermissions(f.strapi);
    expect(f.perm.deleteMany).toHaveBeenCalledWith({
      where: { role: 7, $or: [{ action: { $startsWith: 'api::' } }, { action: { $startsWith: 'plugin::upload.content-api.' } }] },
    });
    expect(f.perm.create).not.toHaveBeenCalled();
  });
  it('can be reopened with PUBLIC_CONTENT_API=true (read-only, never leads)', async () => {
    process.env.PUBLIC_CONTENT_API = 'true';
    const f = fakeStrapi({ publicPerms: [{ action: 'api::faq.faq.find' }] });
    await ensurePublicPermissions(f.strapi);
    const granted = f.perm.create.mock.calls.map((c: any) => c[0].data.action);
    expect(granted).not.toContain('api::faq.faq.find'); // already there
    expect(granted).toContain('api::service.service.find');
    expect(granted.some((a: string) => a.startsWith('api::lead.'))).toBe(false);
    expect(f.perm.deleteMany).not.toHaveBeenCalled();
  });
});
