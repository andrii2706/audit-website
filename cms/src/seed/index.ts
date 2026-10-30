import fs from 'fs';
import path from 'path';
import type { Core } from '@strapi/strapi';
import * as structure from './structure';
import type { SiteContent } from './content/types';
import uk from './content/uk';
import en from './content/en';
import * as legacy from './legacy';
import { seoFor } from './seo';

const PUBLIC_READ: Record<string, string[]> = {
  'api::service-category.service-category': ['find', 'findOne'],
  'api::service.service': ['find', 'findOne'],
  'api::audience.audience': ['find', 'findOne'],
  'api::team-member.team-member': ['find', 'findOne'],
  'api::faq.faq': ['find', 'findOne'],
  'api::article.article': ['find', 'findOne'],
  'api::news-item.news-item': ['find', 'findOne'],
  'api::about-page.about-page': ['find'],
  'api::career-page.career-page': ['find'],
  'api::vacancy.vacancy': ['find', 'findOne'],
  'api::transparency-report.transparency-report': ['find', 'findOne'],
  'api::client-logo.client-logo': ['find', 'findOne'],
  'api::document-image.document-image': ['find', 'findOne'],
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
] as const;

const CONTENT: Record<(typeof LOCALES)[number]['code'], SiteContent> = { uk, en };

/** Creates the site locales in Strapi i18n and makes Ukrainian the default. */
export async function ensureLocales(strapi: Core.Strapi) {
  const svc = strapi.plugin('i18n').service('locales') as any;
  for (const l of LOCALES) {
    if (!(await svc.findByCode(l.code))) await svc.create({ code: l.code, name: l.name });
  }
  const def = await svc.getDefaultLocale?.();
  if (def !== 'uk') await svc.setDefaultLocale({ code: 'uk' });
}

/** Content types filled by the seed (leads, admin users and uploaded files are never touched). */
const SEEDED_UIDS = [
  'api::service.service',
  'api::service-category.service-category',
  'api::audience.audience',
  'api::team-member.team-member',
  'api::faq.faq',
  'api::article.article',
  'api::client-logo.client-logo',
  'api::document-image.document-image',
  'api::global.global',
  'api::homepage.homepage',
  'api::about-page.about-page',
  'api::career-page.career-page',
  'api::news-item.news-item',
] as const;

/**
 * `npm run reseed` (RESEED_CONTENT=true): replaces the site content of an existing database with the
 * current seed — e.g. after the starter content changed. Removes the content types above and languages
 * that are no longer used; keeps admin users, leads, vacancies, transparency reports and the media library.
 */
export async function reseedIfRequested(strapi: Core.Strapi) {
  if (process.env.RESEED_CONTENT !== 'true') return false;
  strapi.log.warn('[seed] RESEED_CONTENT=true — replacing site content with the starter content…');
  for (const uid of SEEDED_UIDS) await strapi.db.query(uid as any).deleteMany({ where: {} });
  const keep: string[] = LOCALES.map((l) => l.code);
  await strapi.db.query('plugin::i18n.locale').deleteMany({ where: { code: { $notIn: keep } } });
  await strapi.store({ type: 'core', name: 'seed' }).delete({ key: 'newsSamples' });
  return true;
}

/**
 * Fills an empty database with the starter content in Ukrainian and English.
 * Ukrainian documents are created first; English is added to the same documentId.
 */
export async function seedIfEmpty(strapi: Core.Strapi) {
  const hasGlobal = await strapi.db.query('api::global.global').count();
  if (hasGlobal > 0) return;
  strapi.log.info(`[seed] Empty database — adding starter content in ${LOCALES.length} languages…`);

  const ids = { cat: {} as Record<string, string>, svc: {} as Record<string, string>, aud: [] as string[], team: [] as string[], faq: [] as string[], art: {} as Record<string, string>, client: [] as string[], docs: [] as string[], global: '', home: '', about: '', career: '' };
  const items = (list: { title: string; text: string }[]) => list.map(({ title, text }) => ({ title, text }));
  const bullets = (list: string[]) => list.map((text) => ({ text }));

  for (const { code: locale } of LOCALES) {
    const t = CONTENT[locale];
    const L = legacy.LEGACY[locale as 'uk' | 'en'];
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

    for (const c of structure.categories) {
      const d = await put('api::service-category.service-category', ids.cat[c.key], { ...t.categories[c.key], slug: c.slug, order: c.order });
      if (first) ids.cat[c.key] = d.documentId;
    }

    let order = 0;
    for (const s of allServices()) {
      order += 1;
      const tr = t.services[s.slug] ?? L.newServices[s.slug];
      if (!tr) throw new Error(`[seed] missing ${locale} text for service ${s.slug}`);
      const d = await put('api::service.service', ids.svc[s.slug], {
        title: tr.title,
        slug: s.slug,
        excerpt: tr.excerpt,
        description: [...(tr.body ?? [structure.p(tr.excerpt)]), ...(L.serviceExtras[s.slug] ?? [])],
        category: ids.cat[s.cat],
        badge: tr.badge ?? null,
        tags: ('tags' in tr ? tr.tags ?? [] : []).map((text) => ({ text })),
        deliverables: ('deliverables' in tr ? tr.deliverables ?? [] : []).map((text) => ({ text })),
        steps: 'steps' in s && s.steps ? items(t.steps) : [],
        homeFeatured: 'homeOrder' in s && !!s.homeOrder,
        homeOrder: ('homeOrder' in s && s.homeOrder) || 0,
        order,
        seo: seoFor(locale, s.slug),
      }, true);
      if (first) ids.svc[s.slug] = d.documentId;
    }

    for (const [k, a] of structure.audiences.entries()) {
      const d = await put('api::audience.audience', ids.aud[k], { ...t.audiences[k], order: a.order, services: a.services.map((s) => ids.svc[s]).filter(Boolean) });
      if (first) ids.aud[k] = d.documentId;
    }

    for (let k = 0; k < structure.teamCount; k++) {
      const m = t.team[k];
      const reg = legacy.teamRegistry[k];
      const d = await put('api::team-member.team-member', ids.team[k], {
        ...m,
        // Auditor register numbers and the lawyer's certificate come from the old site.
        credential: reg ? [m.credential, L.registryLabel(reg)].filter(Boolean).join(' · ') : m.credential,
        bio: k === 2 ? `${m.bio} ${L.kovalBio}` : m.bio,
        order: k + 1,
      });
      if (first) ids.team[k] = d.documentId;
    }

    for (const [k, f] of t.faqs.entries()) {
      const d = await put('api::faq.faq', ids.faq[k], { question: f.q, answer: f.a, order: k + 1 });
      if (first) ids.faq[k] = d.documentId;
    }

    for (const a of [...structure.articles, ...legacy.legacyArticles]) {
      const tr = t.articles[a.slug] ?? L.articles[a.slug];
      const d = await put('api::article.article', ids.art[a.slug], {
        title: tr.title, kind: tr.kind, excerpt: tr.excerpt, content: tr.content, slug: a.slug, readingMinutes: a.readingMinutes,
        seo: seoFor(locale, a.slug),
      }, true);
      if (first) ids.art[a.slug] = d.documentId;
    }

    const c = structure.contacts;
    const g = await put('api::global.global', ids.global || undefined, {
      ...t.global,
      address: L.address,
      ...(first ? {
        phone: c.phone, phoneSecondary: c.phoneSecondary, email: c.email, edrpou: c.edrpou || null, registryNumber: c.registryNumber || null,
        mapQuery: c.mapQuery, mapUrl: c.mapUrl, telegramUrl: c.telegramUrl || null, viberUrl: c.viberUrl || null, whatsappUrl: c.whatsappUrl || null, socials: [],
      } : {}),
    });
    if (first) ids.global = g.documentId;

    const h = t.homepage;
    const hp = await put('api::homepage.homepage', ids.home || undefined, {
      ...h,
      processSteps: items(h.processSteps),
      reasons: items([...h.reasons, L.homeReason]),
      industries: bullets(h.industries),
      estimateBullets: bullets(h.estimateBullets),
      quickServices: structure.quickServices.map((s) => ids.svc[s]),
      deadlineService: ids.svc[structure.deadlineService],
    });
    if (first) ids.home = hp.documentId;

    const ab = t.about;
    const about = await put('api::about-page.about-page', ids.about || undefined, {
      ...ab,
      reasons: items(ab.reasons),
      values: items(ab.values),
      principles: items(ab.principles),
      requests: bullets(ab.requests),
      intro: [...ab.intro, ...L.introExtra],
      ...L.about,
    }, true);
    if (first) ids.about = about.documentId;

    const cr = t.career;
    const career = await put('api::career-page.career-page', ids.career || undefined, { ...cr, faqs: items(cr.faqs) }, true);
    if (first) ids.career = career.documentId;

    // Client logos and document scans from the old site (images arrive with `npm run import-media`).
    for (const [k, c] of legacy.clients.entries()) {
      const d = await put('api::client-logo.client-logo', ids.client[k], { name: c.name, sourceUrl: c.sourceUrl, order: k + 1 });
      if (first) ids.client[k] = d.documentId;
    }
    for (const [k, doc] of legacy.documents.entries()) {
      const d = await put('api::document-image.document-image', ids.docs[k], { title: L.documents[doc.key], kind: doc.kind, sourceUrl: doc.sourceUrl, order: k + 1 }, true);
      if (first) ids.docs[k] = d.documentId;
    }

    strapi.log.info(`[seed] ${locale}: done`);
  }

  // Old-site publications keep their original date (otherwise they would show up as the newest posts).
  for (const a of legacy.legacyArticles) {
    await strapi.db.query('api::article.article').updateMany({ where: { slug: a.slug, publishedAt: { $notNull: true } }, data: { publishedAt: a.date } });
  }

  strapi.log.info(`[seed] Ready: ${allServices().length} services, ${structure.teamCount} team members × ${LOCALES.length} languages.`);
}

/** Services from the brief plus the old-site services, each inserted after the last one of its category. */
function allServices() {
  const list: { slug: string; cat: structure.CategoryKey; homeOrder?: number; steps?: boolean }[] = [...structure.services];
  for (const extra of legacy.newServices) {
    let at = -1;
    list.forEach((s, i) => { if (s.cat === extra.cat) at = i; });
    list.splice(at + 1, 0, extra);
  }
  return list;
}

/**
 * Transparency reports listed on the old site (2019–2025, incl. corrected versions and balance sheets).
 * Created once, only when there are no reports yet — `npm run reseed` keeps reports the editor added.
 */
export async function seedLegacyReports(strapi: Core.Strapi) {
  const uid = 'api::transparency-report.transparency-report' as any;
  if ((await strapi.db.query(uid).count()) > 0) return;
  for (const r of legacy.reports) {
    const base = { year: r.year, isCorrection: r.isCorrection, docType: r.docType, publishedOn: r.publishedOn ?? null, sourceUrl: r.sourceUrl ?? null };
    const doc: any = await strapi.documents(uid).create({ locale: 'uk', status: 'published', data: { ...base, title: legacy.LEGACY.uk.reports[r.key] } } as any);
    await strapi.documents(uid).update({ documentId: doc.documentId, locale: 'en', status: 'published', data: { ...base, title: legacy.LEGACY.en.reports[r.key] } } as any);
  }
  strapi.log.info(`[seed] ${legacy.reports.length} transparency reports from the old site added (files: upload in Strapi or run npm run import-media)`);
}

/**
 * `npm run import-media` (IMPORT_MEDIA=true): downloads images/PDFs from the old site (sourceUrl on client logos,
 * document scans and transparency reports) into the media library and attaches them. Needs internet access;
 * entries that already have a file are skipped, failed downloads are listed and can be retried.
 * IMPORT_MEDIA_BASE overrides the origin (default https://bp-audit.com.ua).
 */
export async function importLegacyMedia(strapi: Core.Strapi) {
  if (process.env.IMPORT_MEDIA !== 'true') return;
  const base = (process.env.IMPORT_MEDIA_BASE || legacy.LEGACY_SITE).replace(/\/$/, '');
  const targets: { uid: string; field: string; publish: boolean }[] = [
    { uid: 'api::client-logo.client-logo', field: 'logo', publish: false },
    { uid: 'api::document-image.document-image', field: 'image', publish: true },
    { uid: 'api::transparency-report.transparency-report', field: 'file', publish: true },
  ];
  const os = await import('node:os');
  const upload = strapi.plugin('upload').service('upload');
  let ok = 0;
  const failed: string[] = [];
  for (const t of targets) {
    const rows: any[] = await strapi.db.query(t.uid as any).findMany({ where: { locale: 'uk', sourceUrl: { $notNull: true } }, populate: { [t.field]: true } });
    const seen = new Set<string>();
    for (const row of rows) {
      if (seen.has(row.documentId) || row[t.field] || !row.sourceUrl) continue;
      seen.add(row.documentId);
      const url = /^https?:/.test(row.sourceUrl) ? row.sourceUrl : `${base}${row.sourceUrl}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const name = decodeURIComponent(url.split('/').pop() || 'file');
        const tmp = path.join(os.tmpdir(), `bp-import-${Date.now()}-${name}`);
        fs.writeFileSync(tmp, buf);
        const mimetype = res.headers.get('content-type')?.split(';')[0] || 'application/octet-stream';
        const [file]: any[] = await upload.upload({
          data: { fileInfo: { name, alternativeText: row.name ?? row.title ?? name } },
          files: { filepath: tmp, originalFilename: name, mimetype, size: buf.length } as any,
        });
        fs.rmSync(tmp, { force: true });
        for (const locale of LOCALES.map((l) => l.code)) {
          await strapi.documents(t.uid as any).update({ documentId: row.documentId, locale, data: { [t.field]: file.id }, ...(t.publish ? { status: 'published' } : {}) } as any);
        }
        ok += 1;
      } catch (err) {
        failed.push(`${url} (${(err as Error).message})`);
      }
    }
  }
  strapi.log.info(`[import-media] ${ok} files imported from ${base}`);
  if (failed.length) strapi.log.warn(`[import-media] ${failed.length} failed:\n  ${failed.join('\n  ')}`);
}
