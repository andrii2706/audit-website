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
  await expect(page.getByRole('status').filter({ hasText: f.successTitle })).toContainText('Viber');
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

test('the request page: three steps on phones, the whole form on wide screens', async ({ page, isMobile }) => {
  await page.goto('/uk/request');
  const form = page.locator('form.form-steps');
  const name = form.locator('input[name="name"]');
  if (!isMobile) {
    await expect(name).toBeVisible();
    await expect(form.getByRole('button', { name: 'Viber' })).toBeVisible();
    await expect(form.getByText(/Крок 1 з 3/)).toBeHidden();
    return;
  }
  await expect(form.getByText(/Крок 1 з 3/)).toBeVisible();
  await expect(name).toBeHidden();
  await form.getByRole('button', { name: 'Далі' }).click();
  await expect(name).toBeVisible();
  // Enter in a field checks the step instead of sending the form.
  await name.press('Enter');
  await expect(form.getByText(f.errName)).toBeVisible();
  await name.fill('Олена');
  await form.locator('input[name="phone"]').fill('+380671234567');
  await form.getByRole('button', { name: 'Далі' }).click();
  await expect(form.getByRole('button', { name: 'Viber' })).toBeVisible();
  await expect(form.locator('button[type="submit"]')).toBeVisible();
  await form.getByRole('button', { name: 'Назад' }).click();
  await expect(name).toHaveValue('Олена');
});

test('the request form asks who is asking and for a short question, not for revenue', async ({ page }) => {
  await page.goto('/uk/request');
  const form = page.locator('form.form-steps');
  await expect(form.getByText(f.clientQ)).toBeVisible();
  await form.getByRole('button', { name: f.clientTypes[1] }).click();
  await expect(form.getByRole('button', { name: f.clientTypes[1] })).toHaveAttribute('aria-pressed', 'true');
  await expect(form.locator('input[name="clientType"]')).toHaveValue('individual');
  await expect(form.locator('textarea[name="comment"]')).toBeVisible();
  await expect(form.getByText(f.q2)).toHaveCount(0);
});
