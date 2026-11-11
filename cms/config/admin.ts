import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET')!,
  },
  apiToken: {
    salt: env('API_TOKEN_SALT')!,
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT')!,
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY')!,
  },
  // Brute-force protection for the admin login: 5 attempts per 5 minutes per IP + e-mail (Strapi default, set explicitly).
  rateLimit: {
    enabled: env.bool('ADMIN_RATE_LIMIT', true),
    interval: 5 * 60 * 1000,
    max: 5,
  },
  flags: {
    // No survey pop-ups or Enterprise promos for the client's editors.
    nps: env.bool('FLAG_NPS', false),
    promoteEE: env.bool('FLAG_PROMOTE_EE', false),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
});

export default config;
