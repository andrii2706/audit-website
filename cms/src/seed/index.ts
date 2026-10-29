import fs from 'fs';
import path from 'path';
import type { Core } from '@strapi/strapi';
import * as data from './data';
import type { LocaleContent } from './translations/types';
import en from './translations/en';
import pl from './translations/pl';
import fr from './translations/fr';
import de from './translations/de';
import es from './translations/es';

const PUBLIC_READ: Record<string, string[]> = {
  'api::service-category.service-category': ['find', 'findOne'],
  'api::service.service': ['find', 'findOne'],
  'api::audience.audience': ['find', 'findOne'],
  'api::team-member.team-member': ['find', 'findOne'],
  'api::faq.faq': ['find', 'findOne'],
  'api::article.article': ['find', 'findOne'],
  'api::news-item.news-item': ['find', 'findOne'],
  'api::client-logo.client-logo': ['find', 'findOne'],
  'api::global.global': ['find'],
  'api::homepage.homepage': ['find'],
};

/** Grants the Public role read access to site content (leads are never readable). */
export async function ensurePublicPermissions(strapi: Core.Strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  if (!role) return;
  const existing = await strapi.db
    .query('plugin::users-permissions.permission')
    .findMany({ where: { role: role.id } });
  const have = new Set(existing.map((p: { action: string }) => p.action));
  for (const [uid, actions] of Object.entries(PUBLIC_READ)) {
    for (const a of actions) {
      const action = `${uid}.${a}`;
      if (!have.has(action)) {
        await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
      }
    }
  }
}

/**
 * Creates the "web-site" API token that Next.js uses to create leads.
 * Strapi shows the key only once, so it is written to .tmp/web-token.txt (never committed).
 */
export async function ensureWebToken(strapi: Core.Strapi) {
  const tokenService = strapi.service('admin::api-token') as any;
  const exists = await tokenService.exists({ name: 'web-site' });
  if (exists) return;
  const token = await tokenService.create({
    name: 'web-site',
    description: 'Next.js: create leads from website forms',
    type: 'custom',
    lifespan: null,
    permissions: ['api::lead.lead.create'],
  });
  const dir = path.join(process.cwd(), '.tmp');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'web-token.txt'), token.accessKey + '\n');
  strapi.log.info('[seed] API token for the website saved to cms/.tmp/web-token.txt');

  // Local dev convenience: put the token into ../web/.env.local if it has an empty STRAPI_WEB_TOKEN.
  const webEnv = path.join(process.cwd(), '..', 'web', '.env.local');
  if (process.env.NODE_ENV !== 'production' && fs.existsSync(webEnv)) {
    const text = fs.readFileSync(webEnv, 'utf8');
    if (/^STRAPI_WEB_TOKEN=\s*$/m.test(text)) {
      fs.writeFileSync(webEnv, text.replace(/^STRAPI_WEB_TOKEN=\s*$/m, `STRAPI_WEB_TOKEN=${token.accessKey}`));
      strapi.log.info('[seed] STRAPI_WEB_TOKEN written to web/.env.local');
    }
  }
}

export const LOCALES = [
  { code: 'uk', name: 'Українська' },
  { code: 'en', name: 'English' },
  { code: 'pl', name: 'Polski' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
] as const;

/** Creates the site locales in Strapi i18n and makes Ukrainian the default. */
export async function ensureLocales(strapi: Core.Strapi) {
  const svc = strapi.plugin('i18n').service('locales') as any;
  for (const l of LOCALES) {
    if (!(await svc.findByCode(l.code))) await svc.create({ code: l.code, name: l.name });
  }
  const def = await svc.getDefaultLocale?.();
  if (def !== 'uk') await svc.setDefaultLocale({ code: 'uk' });
}

/** Ukrainian content expressed in the same shape as the translation files. */
function ukContent(): LocaleContent {
  const svc: LocaleContent['services'] = {};
  for (const s of data.services) svc[s.slug] = { title: s.title, excerpt: s.excerpt, badge: s.badge, tags: s.tags, deliverables: s.deliverables };
  return {
    categories: Object.fromEntries(data.categories.map((c) => [c.key, { name: c.name, intro: c.intro }])),
    auditSteps: data.auditSteps,
    services: svc,
    audiences: data.audiences.map((a) => ({ label: a.label, title: a.title, description: a.description })),
    team: data.team.map((m) => ({ name: m.name, role: m.role, credential: m.credential, experience: m.experience, bio: m.bio })),
    faqs: data.faqs,
    articles: Object.fromEntries(data.articles.map((a) => [a.slug, { title: a.title, kind: a.kind, excerpt: a.excerpt }])),
    articlePlaceholder: '[Повний текст статті — додайте в адмінці Strapi.]',
    global: {
      siteName: data.global.siteName, tagline: data.global.tagline, legalName: data.global.legalName,
      address: data.global.address, footerNote: data.global.footerNote, seo: data.global.seo,
    },
    homepage: { ...data.homepage, estimateBullets: data.homepage.estimateBullets.map((b) => b.text) },
  };
}

const CONTENT: Record<string, () => LocaleContent> = { uk: ukContent, en: () => en, pl: () => pl, fr: () => fr, de: () => de, es: () => es };

/**
 * Fills an empty database with the initial content in all 6 languages.
 * Ukrainian documents are created first; every other locale is added to the same documentId.
 */
export async function seedIfEmpty(strapi: Core.Strapi) {
  const hasGlobal = await strapi.db.query('api::global.global').count();
  if (hasGlobal > 0) return;
  strapi.log.info('[seed] Empty database — adding initial content in 6 languages…');

  const ids = { cat: {} as Record<string, string>, svc: {} as Record<string, string>, aud: [] as string[], team: [] as string[], faq: [] as string[], art: {} as Record<string, string>, global: '', home: '' };

  // Client logos are not localized (brand names).
  let ci = 0;
  for (const name of data.clients) await strapi.documents('api::client-logo.client-logo').create({ data: { name, order: ++ci } as any });

  for (const { code: locale } of LOCALES) {
    const t = CONTENT[locale]();
    const first = locale === 'uk';
    // create() for Ukrainian, update() adds a localization to the existing document.
    const put = async (uid: any, key: string | undefined, payload: any, published = false): Promise<{ documentId: string }> => {
      const opts: any = { locale, data: payload, ...(published ? { status: 'published' } : {}) };
      const doc = first || !key
        ? await strapi.documents(uid).create(opts)
        : await strapi.documents(uid).update({ ...opts, documentId: key });
      if (!doc) throw new Error(`[seed] could not save ${uid} (${locale})`);
      return doc as { documentId: string };
    };

    for (const c of data.categories) {
      const d = await put('api::service-category.service-category', ids.cat[c.key], { ...t.categories[c.key], slug: c.slug, order: c.order });
      if (first) ids.cat[c.key] = d.documentId;
    }

    let i = 0;
    for (const s of data.services) {
      i += 1;
      const tr = t.services[s.slug];
      const d = await put('api::service.service', ids.svc[s.slug], {
        title: tr.title,
        slug: s.slug,
        excerpt: tr.excerpt,
        description: s.body,
        category: ids.cat[s.cat],
        badge: tr.badge,
        tags: (tr.tags ?? []).map((text) => ({ text })),
        deliverables: (tr.deliverables ?? []).map((text) => ({ text })),
        steps: s.steps ? t.auditSteps : [],
        homeFeatured: !!s.homeFeatured,
        homeOrder: s.homeOrder ?? 0,
        order: i,
      }, true);
      if (first) ids.svc[s.slug] = d.documentId;
    }

    for (const [k, a] of data.audiences.entries()) {
      const d = await put('api::audience.audience', ids.aud[k], { ...t.audiences[k], order: a.order, services: a.services.map((s) => ids.svc[s]).filter(Boolean) });
      if (first) ids.aud[k] = d.documentId;
    }

    for (const [k, m] of data.team.entries()) {
      const d = await put('api::team-member.team-member', ids.team[k], { ...t.team[k], order: m.order });
      if (first) ids.team[k] = d.documentId;
    }

    for (const [k] of data.faqs.entries()) {
      const d = await put('api::faq.faq', ids.faq[k], { question: t.faqs[k].q, answer: t.faqs[k].a, order: k + 1 });
      if (first) ids.faq[k] = d.documentId;
    }

    for (const a of data.articles) {
      const tr = t.articles[a.slug];
      const d = await put('api::article.article', ids.art[a.slug], {
        ...tr, slug: a.slug, readingMinutes: a.readingMinutes,
        content: [data.p(tr.excerpt), data.p(t.articlePlaceholder)],
      }, true);
      if (first) ids.art[a.slug] = d.documentId;
    }

    const g = await put('api::global.global', ids.global || undefined, {
      ...t.global,
      ...(first ? { edrpou: data.global.edrpou, registryNumber: data.global.registryNumber, phone: data.global.phone, email: data.global.email, telegramUrl: data.global.telegramUrl, socials: data.global.socials } : {}),
    });
    if (first) ids.global = g.documentId;

    const h = t.homepage;
    const hp = await put('api::homepage.homepage', ids.home || undefined, {
      ...h,
      estimateBullets: h.estimateBullets.map((text) => ({ text })),
      quickServices: ['audyt-diia-city', 'initiatyvnyy-audyt', 'msfz', 'vedennya-tov-sproshchena', 'zvitnist-po-kik', 'otrymannya-krytychnosti'].map((s) => ids.svc[s]),
      deadlineService: ids.svc['audyt-diia-city'],
    });
    if (first) ids.home = hp.documentId;
    strapi.log.info(`[seed] ${locale}: done`);
  }

  strapi.log.info(`[seed] Ready: ${data.services.length} services × ${LOCALES.length} languages.`);
}
