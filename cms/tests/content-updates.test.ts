import { describe, expect, it, vi } from 'vitest';
import { applyContentUpdates, CONTENT_UPDATES } from '../src/seed/updates';

/** A strapi stand-in with just the core store the updates runner uses. */
function fakeStrapi(initial: string[] | null = null) {
  let value: unknown = initial;
  return {
    store: () => ({ get: async () => value, set: async ({ value: v }: { value: unknown }) => { value = v; } }),
    log: { info: vi.fn() },
    stored: () => value,
  };
}

describe('applyContentUpdates', () => {
  it('runs each update once and remembers it', async () => {
    const strapi = fakeStrapi();
    const run = vi.fn(async () => ['changed']);
    await applyContentUpdates(strapi as any, [{ id: 'a', run }]);
    await applyContentUpdates(strapi as any, [{ id: 'a', run }]);
    expect(run).toHaveBeenCalledTimes(1);
    expect(strapi.stored()).toEqual(['a']);
    expect(strapi.log.info).toHaveBeenCalledWith('[content] a: changed');
  });
  it('skips updates the database already had and runs only the new ones, in order', async () => {
    const strapi = fakeStrapi(['a']);
    const calls: string[] = [];
    const mk = (id: string) => ({ id, run: async () => { calls.push(id); return []; } });
    await applyContentUpdates(strapi as any, [mk('a'), mk('b'), mk('c')]);
    expect(calls).toEqual(['b', 'c']);
    expect(strapi.stored()).toEqual(['a', 'b', 'c']);
  });
  it('does not mark an update as done when it fails, so the next start retries it', async () => {
    const strapi = fakeStrapi();
    await expect(applyContentUpdates(strapi as any, [{ id: 'x', run: async () => { throw new Error('db down'); } }])).rejects.toThrow('db down');
    expect(strapi.stored()).toBeNull();
  });
  it('ships the 27.11.2026 audit-focus update with a unique id', () => {
    const ids = CONTENT_UPDATES.map((u) => u.id);
    expect(ids).toContain('2026-11-27-audit-focus');
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('2026-11-27-brief-complete', () => {
  const run = CONTENT_UPDATES.find((u) => u.id === '2026-11-27-brief-complete')!.run;
  /** Documents service stand-in: one homepage and the consulting category per locale. */
  function fakeDocs(reasons: Record<string, { title: string; text: string }[]>, intro: Record<string, string>) {
    const updates: { uid: string; locale: string; data: any }[] = [];
    const strapi = {
      contentType: () => ({ options: { draftAndPublish: false } }),
      documents: (uid: string) => ({
        findFirst: async ({ locale }: any) =>
          uid.includes('homepage') ? { documentId: 'h', reasons: reasons[locale] } : { documentId: 'c', intro: intro[locale] },
        update: async ({ locale, data }: any) => { updates.push({ uid, locale, data }); },
      }),
    };
    return { strapi, updates };
  }

  it('adds «15+ років досвіду» first and «Оптимальна вартість» before the English item, replaces the old consulting intro', async () => {
    const r = (title: string) => ({ title, text: '…' });
    const { strapi, updates } = fakeDocs(
      { uk: [r('Бездоганна репутація'), r('Можемо співпрацювати англійською мовою')], en: [r('Impeccable reputation')] },
      {
        uk: 'Стратегічні рішення для складних фінансових та податкових завдань: допомагаємо приймати правильні управлінські рішення й мінімізувати ризики.',
        en: 'An editor wrote this.',
      },
    );
    await run(strapi as any);
    const ukHome = updates.find((u) => u.uid.includes('homepage') && u.locale === 'uk')!;
    expect(ukHome.data.reasons.map((x: any) => x.title)).toEqual(['15+ років досвіду', 'Бездоганна репутація', 'Оптимальна вартість', 'Можемо співпрацювати англійською мовою']);
    const enHome = updates.find((u) => u.uid.includes('homepage') && u.locale === 'en')!;
    expect(enHome.data.reasons.map((x: any) => x.title)).toEqual(['15+ years of experience', 'Impeccable reputation', 'Optimal cost']);
    expect(updates.find((u) => u.uid.includes('category') && u.locale === 'uk')!.data.intro).toMatch(/^Ми допомагаємо власникам/);
    // An intro an editor changed stays.
    expect(updates.find((u) => u.uid.includes('category') && u.locale === 'en')).toBeUndefined();
  });

  it('changes nothing when the items are already there', async () => {
    const r = (title: string) => ({ title, text: '…' });
    const { strapi, updates } = fakeDocs(
      { uk: [r('15+ років досвіду'), r('Оптимальна вартість')], en: [r('15+ years of experience'), r('Optimal cost')] },
      { uk: 'x', en: 'y' },
    );
    await run(strapi as any);
    expect(updates).toEqual([]);
  });
});

describe('2026-11-27-no-bios', () => {
  it('clears every biography in both languages and leaves members without one alone', async () => {
    const run = CONTENT_UPDATES.find((u) => u.id === '2026-11-27-no-bios')!.run;
    const people: Record<string, { documentId: string; bio: string | null }[]> = {
      uk: [{ documentId: 'a', bio: 'Текст' }, { documentId: 'b', bio: null }],
      en: [{ documentId: 'a', bio: 'Text' }],
    };
    const updates: any[] = [];
    const strapi = {
      contentType: () => ({ options: { draftAndPublish: false } }),
      documents: () => ({
        findMany: async ({ locale }: any) => people[locale],
        update: async (args: any) => { updates.push(args); },
      }),
    };
    expect(await run(strapi as any)).toEqual(['biographies removed: 2']);
    expect(updates).toEqual([
      { documentId: 'a', locale: 'uk', data: { bio: null } },
      { documentId: 'a', locale: 'en', data: { bio: null } },
    ]);
  });
});

describe('2026-11-27-hero-video', () => {
  const run = CONTENT_UPDATES.find((u) => u.id === '2026-11-27-hero-video')!.run;
  const fake = (heroVideo: unknown, root: string) => {
    const uploads: any[] = [];
    const updates: any[] = [];
    return {
      uploads,
      updates,
      strapi: {
        dirs: { app: { root } },
        contentType: () => ({ options: { draftAndPublish: false } }),
        documents: () => ({
          findFirst: async () => ({ documentId: 'h', heroVideo }),
          update: async (a: any) => { updates.push(a); },
        }),
        plugin: () => ({ service: () => ({ upload: async (a: any) => { uploads.push(a); return [{ id: 7 }]; } }) }),
      },
    };
  };

  it('keeps a video an editor already chose', async () => {
    const f = fake({ id: 1 }, process.cwd());
    expect(await run(f.strapi as any)).toEqual(['home page already has a video, kept']);
    expect(f.uploads).toEqual([]);
  });
  it('uploads the shipped file and puts it on the home page in both languages', async () => {
    const f = fake(null, process.cwd());
    await run(f.strapi as any);
    expect(f.uploads[0].files.mimetype).toBe('video/mp4');
    expect(f.updates.map((u) => [u.locale, u.data.heroVideo])).toEqual([['uk', 7], ['en', 7]]);
  });
  it('fails loudly (and is retried next start) when the file is missing', async () => {
    const f = fake(null, '/nowhere');
    await expect(run(f.strapi as any)).rejects.toThrow('not found');
  });
});
