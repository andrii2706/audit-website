import { expect, test } from '@playwright/test';

/**
 * Content protection with the default CMS settings (everything on): what a visitor can and can't do.
 * Selection/copy/menu blocking is checked through the same DOM events a browser fires.
 */
test.beforeEach(async ({ page }) => {
  // networkidle: the JavaScript half of the protection attaches after hydration.
  await page.goto('/uk/about', { waitUntil: 'networkidle' });
});

test('the page is marked for every protection from the first paint', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('data-protect', /copy.*menu.*images.*print.*keys/);
  expect(await page.locator('meta[name="robots"][content*="noai"]').count()).toBeGreaterThan(0);
});

test('text can’t be selected or copied, phone numbers can', async ({ page }) => {
  const result = await page.evaluate(() => {
    const p = document.querySelector('main p')!;
    const copy = (el: Element) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      getSelection()!.removeAllRanges();
      getSelection()!.addRange(r);
      const e = new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() });
      el.dispatchEvent(e);
      return e.defaultPrevented;
    };
    const tel = document.querySelector('a[href^="tel:"]');
    return { userSelect: getComputedStyle(p).userSelect, text: copy(p), phone: tel ? copy(tel) : false };
  });
  expect(result.userSelect).toBe('none');
  expect(result.text).toBe(true);
  expect(result.phone).toBe(false);
});

test('right-click menu and shortcuts are blocked outside form fields', async ({ page }) => {
  const blocked = await page.evaluate(() => {
    const fire = (el: Element, e: Event) => (el.dispatchEvent(e), e.defaultPrevented);
    const main = document.querySelector('main')!;
    return {
      menu: fire(main, new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
      save: fire(main, new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true })),
      source: fire(main, new KeyboardEvent('keydown', { key: 'u', ctrlKey: true, bubbles: true, cancelable: true })),
    };
  });
  expect(blocked).toEqual({ menu: true, save: true, source: true });
});

test('printing shows a notice instead of the page', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('main')).toBeHidden();
});

test('images can’t be dragged out', async ({ page }) => {
  const img = page.locator('main img').first();
  test.skip((await img.count()) === 0, 'no images on the page');
  expect(await img.evaluate((el) => getComputedStyle(el).getPropertyValue('-webkit-user-drag') || el.getAttribute('draggable'))).toMatch(/none|false/);
});

test('certificate scans are served with the watermark, not as originals', async ({ page, request }) => {
  const links = page.locator('#documents a, #recommendations a');
  test.skip((await links.count()) === 0, 'no scans uploaded in this CMS');
  const href = await links.first().getAttribute('href');
  expect(href).toMatch(/^\/api\/document\//);
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('image/jpeg');
});
