import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    // Extra admin UI languages (English is built in). Each editor picks one in their profile.
    locales: ['uk'],
  },
  bootstrap(_app: StrapiApp) {},
};
