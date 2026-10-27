import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // Public URL of the CMS behind a reverse proxy (admin links, media URLs), e.g. https://cms.consulting.lviv.ua
  url: env('PUBLIC_URL', ''),
  proxy: env.bool('IS_PROXIED', !!env('PUBLIC_URL', '')),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});

export default config;
