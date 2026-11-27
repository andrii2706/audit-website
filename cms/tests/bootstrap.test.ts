import { describe, expect, it, vi } from 'vitest';
import { ensureOfficeLocation, ensureSecurityBaseline } from '../src/seed';

/** Fake Strapi with just the store/db calls these helpers use. */
function fakeStrapi({ advanced = {} as Record<string, unknown>, roles = [{ id: 1 }, { id: 2 }], removed = 0, updated = 0 } = {}) {
  const store = { get: vi.fn(async () => advanced), set: vi.fn(async () => undefined) };
  const deleteMany = vi.fn(async () => ({ count: removed }));
  const updateMany = vi.fn(async () => ({ count: updated }));
  const query = vi.fn((uid: string) => ({
    findMany: vi.fn(async () => (uid.includes('role') ? roles : [])),
    deleteMany,
    updateMany,
  }));
  const log = { info: vi.fn(), warn: vi.fn() };
  return { strapi: { store: vi.fn(() => store), db: { query }, log } as any, store, deleteMany, updateMany, log };
}

describe('ensureSecurityBaseline', () => {
  it('turns public sign-up off', async () => {
    const f = fakeStrapi({ advanced: { allow_register: true, email_confirmation: false } });
    await ensureSecurityBaseline(f.strapi);
    expect(f.store.set).toHaveBeenCalledWith({ key: 'advanced', value: { allow_register: false, email_confirmation: false } });
  });
  it('leaves settings alone when sign-up is already off', async () => {
    const f = fakeStrapi({ advanced: { allow_register: false } });
    await ensureSecurityBaseline(f.strapi);
    expect(f.store.set).not.toHaveBeenCalled();
  });
  it('removes any lead permission from the Public and Authenticated roles', async () => {
    const f = fakeStrapi({ advanced: { allow_register: false }, removed: 2 });
    await ensureSecurityBaseline(f.strapi);
    expect(f.deleteMany).toHaveBeenCalledWith({ where: { role: { id: { $in: [1, 2] } }, action: { $startsWith: 'api::lead.' } } });
    expect(f.log.warn).toHaveBeenCalled();
  });
});

describe('ensureOfficeLocation', () => {
  it('moves only databases that still hold an old shipped point (or none)', async () => {
    const f = fakeStrapi({ updated: 2 });
    await ensureOfficeLocation(f.strapi);
    const [{ where, data }] = f.updateMany.mock.calls[0] as any;
    expect(where.$or[0].mapQuery.$in).toContain('49.8525392,24.02329');
    expect(where.$or[0].mapQuery.$in).not.toContain('49.8531048,24.0258748');
    expect(data.mapQuery).toBe('49.8531048,24.0258748');
  });
});

describe('ensureAdminLabels', () => {
  it('replaces raw field names with Ukrainian labels and help texts, but keeps custom labels', async () => {
    const conf = {
      metadatas: {
        title: { edit: { label: 'title', description: '' }, list: { label: 'title' } },
        slug: { edit: { label: 'slug', description: '' }, list: { label: 'slug' } },
        excerpt: { edit: { label: 'Мій підпис', description: '' }, list: { label: 'excerpt' } },
      },
    };
    const store = { get: vi.fn(async () => conf), set: vi.fn(async () => undefined) };
    const strapi = { store: () => store, contentTypes: { 'api::news-item.news-item': {} }, components: {}, log: { info: vi.fn() } } as any;
    const { ensureAdminLabels } = await import('../src/seed');
    await ensureAdminLabels(strapi);
    expect(conf.metadatas.title.edit.label).toBe('Назва');
    expect(conf.metadatas.slug.edit.description).toMatch(/Латиниця/);
    expect(conf.metadatas.excerpt.edit.label).toBe('Мій підпис');
    expect(conf.metadatas.excerpt.list.label).toBe('Короткий опис');
  });
});
