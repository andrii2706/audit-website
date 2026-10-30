import type { Core } from '@strapi/strapi';
import { ensureLocales, ensurePublicPermissions, ensureWebToken, importLegacyMedia, LOCALES, reseedIfRequested, seedIfEmpty, seedLegacyReports } from './seed';
import { ensureNewsSamples } from './seed/news';

/** Content types whose changes must refresh the website. */
const SITE_UIDS = new Set([
  'api::document-image.document-image',
  'api::service-category.service-category',
  'api::service.service',
  'api::audience.audience',
  'api::team-member.team-member',
  'api::faq.faq',
  'api::article.article',
  'api::news-item.news-item',
  'api::about-page.about-page',
  'api::career-page.career-page',
  'api::vacancy.vacancy',
  'api::transparency-report.transparency-report',
  'api::client-logo.client-logo',
  'api::global.global',
  'api::homepage.homepage',
]);
const WRITE_ACTIONS = new Set(['create', 'update', 'delete', 'publish', 'unpublish', 'discardDraft']);

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    // After any content write, ask Next.js to refresh its cache (on-demand revalidation).
    strapi.documents.use(async (ctx, next) => {
      const result = await next();
      const url = process.env.WEB_REVALIDATE_URL;
      const secret = process.env.REVALIDATE_SECRET;
      if (url && secret && SITE_UIDS.has(ctx.uid) && WRITE_ACTIONS.has(ctx.action)) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
          body: JSON.stringify({ uid: ctx.uid, action: ctx.action }),
        }).catch((err) => strapi.log.warn(`[revalidate] ${err.message}`));
      }
      return result;
    });
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Strapi 5 lets anyone request unpublished drafts via `?status=draft`. Anonymous (public) API
    // requests may only see published content, so the parameter is dropped unless a token is sent.
    strapi.server.use(async (ctx: any, next: () => Promise<void>) => {
      if (ctx.path.startsWith('/api/') && !ctx.get('authorization') && ctx.query?.status) {
        const { status: _drop, ...rest } = ctx.query;
        ctx.query = rest;
      }
      await next();
    });
    await ensureLocales(strapi);
    await ensurePublicPermissions(strapi);
    await ensureWebToken(strapi);
    // `npm run reseed` empties the site content first, so the seed below fills it again.
    const reseeded = await reseedIfRequested(strapi);
    if (reseeded || process.env.SEED_ON_EMPTY !== 'false') {
      await seedIfEmpty(strapi);
      await seedLegacyReports(strapi);
      await ensureNewsSamples(strapi, LOCALES);
    }
    await importLegacyMedia(strapi);
  },
};
