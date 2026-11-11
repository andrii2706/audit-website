import type { StrapiApp } from '@strapi/strapi/admin';

/**
 * Admin panel customisation. Ukrainian is offered as an interface language next to English: each editor picks it
 * under Profile → Interface language (the user manual is written for the Ukrainian interface).
 */
export default {
  config: {
    locales: ['uk'],
    // No "What's new" / tutorial pop-ups for the client's editors.
    tutorials: false,
    notifications: { releases: false },
  },
  bootstrap(_app: StrapiApp) {},
};
