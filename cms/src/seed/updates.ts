import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Core } from '@strapi/strapi';
import * as structure from './structure';
import uk from './content/uk';
import en from './content/en';
import { seoFor } from './seo';
import { allServices } from './services-order';
import * as legacy from './legacy';

/**
 * One-time content changes for databases that already have content (the seed only fills an empty one).
 * Each update runs once: its id is remembered in the core store, so editors' later changes in Strapi stay.
 * On a freshly seeded database every update finds the content already as it should be and changes nothing.
 */
const CONTENT = { uk, en } as const;
const LOCALES = ['uk', 'en'] as const;
const SVC = 'api::service.service' as any;
const TEAM = 'api::team-member.team-member' as any;
const HOME = 'api::homepage.homepage' as any;
const CAT = 'api::service-category.service-category' as any;
const ABOUT = 'api::about-page.about-page' as any;
const CAREER = 'api::career-page.career-page' as any;
const GLOBAL = 'api::global.global' as any;
const ARTICLE = 'api::article.article' as any;
const STORE_KEY = 'content-updates';

type Strapi = Core.Strapi;
export type ContentUpdate = { id: string; run: (strapi: Strapi) => Promise<string[]> };

/** Writes a localization; publishes it too when the type has drafts (otherwise the change would stay a draft). */
async function save(strapi: Strapi, uid: any, documentId: string, locale: string, data: Record<string, unknown>) {
  const drafts = !!(strapi.contentType(uid) as any)?.options?.draftAndPublish;
  await strapi.documents(uid).update({ documentId, locale, data, ...(drafts ? { status: 'published' } : {}) } as any);
}

/**
 * Client's changes of 27.11.2026: audit first. Accounting service removed; «Передпродажний аудит» and
 * «Підготовка до е-аудиту (SAF-T UA)» added; home tiles 03 = Дія Сіті, 05 = Надання впевненості, 07 = Передпродажний
 * аудит (audit only); «Надання впевненості» word for word from the brief (p. 3); no biography for Natalia Tsupryk;
 * search titles for the audit services; home services heading «Аудиторські послуги».
 */
async function auditFocus(strapi: Strapi): Promise<string[]> {
  const notes: string[] = [];

  // 1. «Бухгалтерське обслуговування» is no longer offered.
  const accounting = await strapi.documents(SVC).findFirst({ filters: { slug: 'bukhhalterske-obsluhovuvannia' } } as any);
  if (accounting) {
    await strapi.documents(SVC).delete({ documentId: accounting.documentId, locale: '*' } as any);
    notes.push('removed «Бухгалтерське обслуговування»');
  }

  // 2. Two new audit services.
  const list = allServices();
  const audit = await strapi.documents(CAT).findFirst({ filters: { slug: 'audyt' } } as any);
  for (const slug of ['peredprodazhnyi-audyt', 'pidhotovka-do-e-audytu']) {
    if (await strapi.documents(SVC).findFirst({ filters: { slug } } as any)) continue;
    const s = list.find((x) => x.slug === slug)!;
    let documentId = '';
    for (const locale of LOCALES) {
      const tr = CONTENT[locale].services[slug];
      const data: any = {
        title: tr.title,
        slug,
        excerpt: tr.excerpt,
        description: tr.body ?? [structure.p(tr.excerpt)],
        category: audit?.documentId ?? null,
        steps: s.steps ? CONTENT[locale].steps.map(({ title, text }) => ({ title, text })) : [],
        homeFeatured: !!s.homeOrder,
        homeOrder: s.homeOrder ?? 0,
        order: list.indexOf(s) + 1,
        seo: seoFor(locale, slug),
      };
      if (!documentId) {
        const doc = await strapi.documents(SVC).create({ locale, data, status: 'published' } as any);
        documentId = doc.documentId;
      } else {
        await strapi.documents(SVC).update({ documentId, locale, data, status: 'published' } as any);
      }
    }
    notes.push(`added «${CONTENT.uk.services[slug].title}»`);
  }

  // 3. Order of the services and the home tiles (fields shared by all languages, drafts included).
  for (const [i, s] of list.entries()) {
    await strapi.db.query(SVC).updateMany({ where: { slug: s.slug }, data: { order: i + 1, homeOrder: s.homeOrder ?? 0, homeFeatured: !!s.homeOrder } });
  }
  notes.push('home tiles: 03 Дія Сіті, 05 Надання впевненості, 07 Передпродажний аудит');

  // 4. «Надання впевненості» as in the brief, and 5. search titles of the audit services.
  for (const locale of LOCALES) {
    const tr = CONTENT[locale].services['nadannia-vpevnenosti'];
    const doc = await strapi.documents(SVC).findFirst({ filters: { slug: 'nadannia-vpevnenosti' }, locale } as any);
    if (doc) {
      await save(strapi, SVC, doc.documentId, locale, {
        excerpt: tr.excerpt,
        deliverables: (tr.deliverables ?? []).map((text) => ({ text })),
        description: tr.body ?? [],
      });
    }
    for (const s of list.filter((x) => x.cat === 'audit')) {
      const seo = seoFor(locale, s.slug);
      if (!seo) continue;
      const d = await strapi.documents(SVC).findFirst({ filters: { slug: s.slug }, locale, populate: ['seo'] } as any);
      if (!d || d.seo?.metaTitle) continue; // keep a title an editor wrote
      const { id: _id, ...rest } = (d.seo ?? {}) as Record<string, unknown>;
      await save(strapi, SVC, d.documentId, locale, { seo: { ...rest, ...seo } });
    }
  }
  notes.push('«Надання впевненості» from the brief, search titles of the audit services');

  // 6. No biography for Natalia Tsupryk.
  for (const [locale, name] of [['uk', 'Цуприк'], ['en', 'Tsupryk']] as const) {
    const people = await strapi.documents(TEAM).findMany({ filters: { name: { $containsi: name } }, locale } as any);
    for (const m of people) if (m.bio) await save(strapi, TEAM, m.documentId, locale, { bio: null });
  }
  notes.push('Tsupryk: biography removed');

  // 7. Home services heading, unless an editor already changed it.
  const oldTitles: Record<string, string> = { uk: 'Аудит, консалтинг і правова підтримка', en: 'Audit, consulting and legal support' };
  for (const locale of LOCALES) {
    const home = await strapi.documents(HOME).findFirst({ locale } as any);
    if (home && (!home.servicesTitle || home.servicesTitle === oldTitles[locale])) {
      await save(strapi, HOME, home.documentId, locale, { servicesTitle: CONTENT[locale].homepage.servicesTitle });
    }
  }
  return notes;
}

/** Old texts the seed had before the brief was carried over word for word; only these are replaced. */
const OLD_CONSULTING_INTRO: Record<string, string> = {
  uk: 'Стратегічні рішення для складних фінансових та податкових завдань: допомагаємо приймати правильні управлінські рішення й мінімізувати ризики.',
  en: 'Strategic solutions for complex financial and tax challenges: we help you make the right management decisions and minimise risks.',
};

/**
 * The rest of the client's brief (27.11.2026): «Чому обирають нас?» on the home page also lists «15+ років досвіду»
 * and «Оптимальна вартість»; the consulting category gets the brief's own introduction. Items an editor already has
 * are not added twice, an intro an editor changed is kept.
 */
async function briefComplete(strapi: Strapi): Promise<string[]> {
  const notes: string[] = [];
  for (const locale of LOCALES) {
    const seed = CONTENT[locale].homepage.reasons;
    const first = seed[0];
    const optimal = seed.find((r) => /^(Оптимальна вартість|Optimal cost)$/.test(r.title))!;
    const home = await strapi.documents(HOME).findFirst({ locale, populate: { reasons: true } } as any);
    if (home) {
      const reasons: { title: string; text: string }[] = (home.reasons ?? []).map((r: any) => ({ title: r.title, text: r.text }));
      const has = (t: string) => reasons.some((r) => r.title?.trim() === t);
      const next = [...reasons];
      if (!has(first.title)) next.unshift({ title: first.title, text: first.text ?? '' });
      // After the last reason from the brief, before the one carried over from the old site (English).
      if (!has(optimal.title)) {
        const old = next.findIndex((r) => /англійськ|English/i.test(r.title));
        next.splice(old === -1 ? next.length : old, 0, { title: optimal.title, text: optimal.text ?? '' });
      }
      if (next.length !== reasons.length) {
        await save(strapi, HOME, home.documentId, locale, { reasons: next });
        notes.push(`${locale}: «Чому нас обирають» +${next.length - reasons.length}`);
      }
    }
    const cat = await strapi.documents(CAT).findFirst({ filters: { slug: 'konsaltynh' }, locale } as any);
    if (cat && (!cat.intro || cat.intro === OLD_CONSULTING_INTRO[locale])) {
      await save(strapi, CAT, cat.documentId, locale, { intro: CONTENT[locale].categories.consulting.intro });
      notes.push(`${locale}: consulting intro from the brief`);
    }
  }
  return notes;
}

/** Client, 27.11.2026: no biographies on the site for anyone (the cards keep name, role, credentials, experience). */
async function noBiographies(strapi: Strapi): Promise<string[]> {
  let n = 0;
  for (const locale of LOCALES) {
    const people = await strapi.documents(TEAM).findMany({ locale, limit: 200 } as any);
    for (const m of people) {
      if (!m.bio) continue;
      await save(strapi, TEAM, m.documentId, locale, { bio: null });
      n++;
    }
  }
  return [`biographies removed: ${n}`];
}

/** The hero video shipped with the code (cms/seed-assets, see its README for the source and licence). */
export const HERO_VIDEO = { file: 'hero-signing.mp4', alt: { uk: 'Підписання договору', en: 'Signing an agreement' } };

/**
 * Puts the shipped hero video into the media library and onto the home page, unless an editor already chose one.
 * The file isn't in the database or in cms/public/uploads (neither is deployed), so every database, local or on the
 * server, gets it this way.
 */
async function heroVideo(strapi: Strapi): Promise<string[]> {
  const home = await strapi.documents(HOME).findFirst({ locale: 'uk', populate: { heroVideo: true } } as any);
  if (!home) return ['no home page yet'];
  if (home.heroVideo) return ['home page already has a video, kept'];
  const src = path.join(strapi.dirs.app.root, 'seed-assets', HERO_VIDEO.file);
  if (!fs.existsSync(src)) throw new Error(`${src} not found`);
  // The upload service may move the file it gets, so it gets a copy.
  const tmp = path.join(os.tmpdir(), `bp-${Date.now()}-${HERO_VIDEO.file}`);
  fs.copyFileSync(src, tmp);
  try {
    const [file]: any[] = await strapi.plugin('upload').service('upload').upload({
      data: { fileInfo: { name: HERO_VIDEO.file, alternativeText: HERO_VIDEO.alt.uk } },
      files: { filepath: tmp, originalFilename: HERO_VIDEO.file, mimetype: 'video/mp4', size: fs.statSync(tmp).size } as any,
    });
    for (const locale of LOCALES) {
      const doc = await strapi.documents(HOME).findFirst({ locale } as any);
      if (doc) await save(strapi, HOME, doc.documentId, locale, { heroVideo: file.id });
    }
    return [`home page video: ${HERO_VIDEO.file}`];
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/**
 * Client, 27.11.2026: «всі тексти мають бути дослівно перенесені в сайт». The brief's texts are now in the seed word
 * for word; this writes them into databases seeded earlier (a shortened version is replaced). It touches only the
 * fields that come from the brief: services (title, excerpt, list and its heading, description), category intros, the
 * home page's hero text, numbers, «why us», industries, team heading and request text, the About and Career pages,
 * the working hours and the three blog titles. Other fields, uploads and the leads stay as they are.
 */
async function briefVerbatim(strapi: Strapi): Promise<string[]> {
  const notes: string[] = [];
  const items = (xs: { title: string; text?: string }[]) => xs.map(({ title, text }) => ({ title, text: text ?? null }));
  const bullets = (xs: string[]) => xs.map((text) => ({ text }));
  const one = (uid: string, locale: string, filters?: object) => strapi.documents(uid as any).findFirst({ locale, ...(filters ? { filters } : {}) } as any);
  for (const locale of LOCALES) {
    const t = CONTENT[locale];
    const L = legacy.LEGACY[locale];
    let n = 0;
    for (const [slug, tr] of Object.entries(t.services)) {
      const doc = await one(SVC, locale, { slug });
      if (!doc) continue;
      await save(strapi, SVC, doc.documentId, locale, {
        title: tr.title,
        excerpt: tr.excerpt,
        pageTitle: tr.pageTitle ?? null,
        deliverablesTitle: tr.deliverablesTitle ?? null,
        deliverables: bullets(tr.deliverables ?? []),
        description: [...(tr.body ?? [structure.p(tr.excerpt)]), ...(L.serviceExtras[slug] ?? [])],
      });
      n++;
    }
    for (const c of structure.categories) {
      const doc = await one(CAT, locale, { slug: c.slug });
      if (doc) await save(strapi, CAT, doc.documentId, locale, { intro: t.categories[c.key].intro });
    }
    const h = t.homepage;
    const home = await one(HOME, locale);
    if (home) {
      await save(strapi, HOME, home.documentId, locale, {
        heroSubtitle: h.heroSubtitle,
        stats: h.stats.map(({ value, label }) => ({ value, label })),
        statsText: h.statsText ?? null,
        whyTitle: h.whyTitle,
        whyText: h.whyText ?? null,
        reasons: items([...h.reasons, L.homeReason]),
        industries: bullets(h.industries),
        teamTitle: h.teamTitle,
        teamSubtitle: h.teamSubtitle,
        estimateText: h.estimateText,
      });
    }
    const ab = t.about;
    const about = await one(ABOUT, locale);
    if (about) {
      await save(strapi, ABOUT, about.documentId, locale, {
        intro: [...ab.intro, ...L.introExtra],
        reasons: items(ab.reasons),
        mission: ab.mission,
        values: items(ab.values),
        principlesIntro: ab.principlesIntro,
        principles: items(ab.principles),
        history: ab.history,
        requests: bullets(ab.requests),
        registry: ab.registry,
        quality: ab.quality,
      });
    }
    const cr = t.career;
    const career = await one(CAREER, locale);
    if (career) await save(strapi, CAREER, career.documentId, locale, { heroIntro: cr.heroIntro, about: cr.about, faqs: items(cr.faqs) });
    const global = await one(GLOBAL, locale);
    if (global) await save(strapi, GLOBAL, global.documentId, locale, { workingHours: t.global.workingHours, workingHoursNote: t.global.workingHoursNote });
    for (const a of structure.articles) {
      const doc = await one(ARTICLE, locale, { slug: a.slug });
      if (doc) await save(strapi, ARTICLE, doc.documentId, locale, { title: t.articles[a.slug].title });
    }
    notes.push(`${locale}: ${n} services, categories, home, about, career, hours, blog titles`);
  }
  return notes;
}

export const CONTENT_UPDATES: ContentUpdate[] = [
  { id: '2026-11-27-audit-focus', run: auditFocus },
  { id: '2026-11-27-brief-complete', run: briefComplete },
  { id: '2026-11-27-no-bios', run: noBiographies },
  { id: '2026-11-27-hero-video', run: heroVideo },
  { id: '2026-11-27-brief-verbatim', run: briefVerbatim },
];

/** Runs every update this database hasn't had yet (after the seed, so a fresh database is marked as up to date too). */
export async function applyContentUpdates(strapi: Strapi, updates: ContentUpdate[] = CONTENT_UPDATES) {
  const store = strapi.store({ type: 'core', name: 'bp' });
  const done = ((await store.get({ key: STORE_KEY })) as string[] | null) ?? [];
  for (const u of updates) {
    if (done.includes(u.id)) continue;
    const notes = await u.run(strapi);
    done.push(u.id);
    await store.set({ key: STORE_KEY, value: done });
    strapi.log.info(`[content] ${u.id}: ${notes.join('; ') || 'nothing to change'}`);
  }
}
