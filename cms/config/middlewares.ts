import type { Core } from '@strapi/strapi';

/**
 * Security notes (docs/SECURITY.md):
 * - `strapi::poweredBy` is left out, so responses don't advertise "X-Powered-By: Strapi".
 * - CORS: browsers may call the API only from the site and the CMS itself. The website reads the API server-side,
 *   so this only matters for scripts running on other sites. CORS_ORIGINS overrides the list (comma-separated).
 * - Request bodies are capped (uploads 50 MB, JSON/forms 1 MB); nginx enforces the same upload limit.
 * - strapi::security keeps Strapi's default CSP/HSTS/nosniff headers for the admin panel.
 */
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => {
  const publicUrl = env('PUBLIC_URL', '');
  const site = env('SITE_URL', '');
  const origins = env.array('CORS_ORIGINS', [publicUrl, site].filter(Boolean) as string[]);
  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'img-src': ["'self'", 'data:', 'blob:'],
            'media-src': ["'self'", 'data:', 'blob:'],
            upgradeInsecureRequests: null,
          },
        },
        // HSTS only behind https (production); a plain-http local admin must keep working.
        hsts: publicUrl.startsWith('https://') ? { maxAge: 31536000, includeSubDomains: false } : false,
        frameguard: { action: 'deny' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      },
    },
    {
      name: 'strapi::cors',
      config: {
        // No configured public URL (local development) → any origin, like Strapi's default.
        origin: origins.length ? origins : ['*'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        keepHeaderOnError: true,
      },
    },
    'strapi::query',
    {
      name: 'strapi::body',
      config: {
        formLimit: '1mb',
        jsonLimit: '1mb',
        textLimit: '1mb',
        formidable: { maxFileSize: 50 * 1024 * 1024 },
      },
    },
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};

export default config;
