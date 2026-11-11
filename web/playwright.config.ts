import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against a running website + CMS (`npm run test:e2e`).
 *
 *   cd cms && npm run dev                      # CMS with the seeded content (or npm run build && npm start)
 *   cd web && npm run build && npm start       # the site in production mode (headers, caching, image optimiser)
 *   cd web && npm run test:e2e                 # E2E_BASE_URL / E2E_CMS_URL override the addresses
 *
 * Desktop Chrome + a phone (Pixel 7). CI: the "E2E" job in .github/workflows/deploy.yml.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    locale: 'uk-UA',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
