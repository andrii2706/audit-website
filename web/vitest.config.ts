import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * `npm test`           — unit tests (pure logic, Node) + component tests (`*.test.tsx`, jsdom, Testing Library).
 * `npm run test:coverage` — the same with a coverage report in coverage/ (thresholds below fail the run).
 * End-to-end tests against a running site live in e2e/ (Playwright, `npm run test:e2e`).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `import 'server-only'` throws outside a React Server Component bundle; tests run modules directly.
      'server-only': fileURLToPath(new URL('./tests/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    env: { SITE_URL: 'https://bp-audit.com.ua', STRAPI_URL: 'http://cms.test' },
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text', 'html'],
      include: ['src/lib/**', 'src/proxy.ts', 'src/app/api/**', 'src/components/{Blocks,ContentProtection,LeadForm,MapEmbed}.tsx'],
      // og.tsx draws social images with next/og (covered by the build); mail.ts needs an SMTP server (npm run check-mail).
      exclude: ['src/lib/og.tsx', 'src/lib/mail.ts'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
