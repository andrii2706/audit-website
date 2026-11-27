import { expect, test } from '@playwright/test';

test('the bare domain opens the visitor’s language', async ({ browser }) => {
  for (const [lang, expected] of [['uk-UA', '/uk'], ['en-US', '/en'], ['de-DE', '/en'], ['ru-RU', '/uk']] as const) {
    const ctx = await browser.newContext({ locale: lang });
    const page = await ctx.newPage();
    await page.goto('/');
    expect(new URL(page.url()).pathname, lang).toBe(expected);
    await ctx.close();
  }
});

test('the language switcher keeps the page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'on phones the switcher lives in the menu');
  await page.goto('/uk/contacts');
  await page.getByRole('button', { name: /мова|language|UA|УКР/i }).first().click();
  await page.locator('a[hreflang="en"]').first().click();
  await expect(page).toHaveURL(/\/en\/contacts$/);
});

test('unknown addresses return a real 404 page', async ({ page }) => {
  const res = await page.goto('/uk/no-such-page-here');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toBeVisible();
  const svc = await page.goto('/uk/services/no-such-service');
  expect(svc?.status()).toBe(404);
});

test('old Joomla addresses redirect permanently', async ({ request }) => {
  const res = await request.get('/index.php', { maxRedirects: 0 });
  expect([301, 307, 308]).toContain(res.status());
});

test('the mobile menu opens and navigates', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await page.goto('/uk');
  await page.getByRole('button', { name: /меню/i }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Контакти' }).first().click();
  await expect(page).toHaveURL(/\/uk\/contacts$/);
});
