import { expect, test } from '@playwright/test';
import uk from '../src/i18n/dictionaries/uk.json' with { type: 'json' };

const f = uk.form;

test('the form explains what is missing instead of sending', async ({ page }) => {
  await page.goto('/uk/contacts');
  const form = page.locator('form').filter({ has: page.locator('input[name="name"]') }).first();
  await form.locator('button[type="submit"]').click();
  await expect(form.getByText(f.errName)).toBeVisible();
  await expect(form.getByText(f.errContact)).toBeVisible();
  await expect(form.locator('input[name="name"]')).toHaveAttribute('aria-invalid', 'true');
});

test('a filled-in lead is accepted', async ({ page, isMobile }) => {
  test.skip(isMobile, 'one real lead per run is enough');
  await page.goto('/uk/contacts');
  const form = page.locator('form').filter({ has: page.locator('input[name="name"]') }).first();
  await form.locator('input[name="name"]').fill('E2E тест (видаліть)');
  await form.locator('input[name="email"]').fill('e2e-test@example.com');
  await form.getByRole('button', { name: 'Viber' }).click();
  // The server treats forms sent faster than 2.5 s as bots (silent "ok", nothing saved): fill like a person.
  await page.waitForTimeout(2800);
  await form.locator('button[type="submit"]').click();
  await expect(page.getByRole('status').filter({ hasText: f.successTitle })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Viber');
});

test('the bot trap is invisible and skipped by the keyboard', async ({ page }) => {
  await page.goto('/uk/contacts');
  const trap = page.locator('input[name="company_site"]').first();
  await expect(trap).toHaveAttribute('tabindex', '-1');
  // Moved far off-screen and hidden from screen readers (display:none would tip off simple bots).
  const box = await trap.boundingBox();
  if (box) expect(box.x + box.width).toBeLessThan(0);
  await expect(trap.locator('xpath=ancestor::*[@aria-hidden="true"]')).toHaveCount(1);
});
