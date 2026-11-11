import { defineConfig } from 'vitest/config';

// Unit tests for the seed data, helpers and config (no database, no running Strapi): `npm test`.
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
