import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, PAGES, watchErrors } from './helpers';

for (const locale of ['uk', 'en'] as const) {
  for (const path of PAGES) {
    test(`/${locale}${path} renders without errors`, async ({ page }) => {
      const errors = watchErrors(page);
      const res = await page.goto(`/${locale}${path}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page).toHaveTitle(/.{5,}/);
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toContain(`/${locale}${path}`);
      await expectNoHorizontalScroll(page);
      errors.check();
    });
  }
}

test('a service page opens from the list and has its order form', async ({ page }) => {
  await page.goto('/uk/services');
  const first = page.locator('main a[href^="/uk/services/"]').first();
  const href = await first.getAttribute('href');
  await page.goto(href!);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('form button[type="submit"]')).toBeVisible();
});

test('the reports page links to the transparency reports', async ({ page }) => {
  await page.goto('/uk/reports');
  await expect(page.locator('main h1')).toBeVisible();
  expect(await page.locator('main a, main [data-pending-file]').count()).toBeGreaterThan(0);
});
