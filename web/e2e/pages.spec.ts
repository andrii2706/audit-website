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

test('client logos: pause on hover, drag and swipe sideways', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/uk');
  const strip = page.locator('.clients .marquee');
  await strip.scrollIntoViewIfNeeded();
  await expect(strip).toHaveClass(/is-live/);
  const track = strip.locator('.marquee-track');
  const pos = () => track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  // runs by itself
  const a = await pos();
  await page.waitForTimeout(600);
  expect(await pos()).toBeLessThan(a);
  const box = (await strip.boundingBox())!;
  const y = box.y + box.height / 2;
  if (!isMobile) {
    // hover pauses it
    await page.mouse.move(box.x + box.width / 2, y);
    await page.waitForTimeout(200);
    const h = await pos();
    await page.waitForTimeout(500);
    expect(Math.abs((await pos()) - h)).toBeLessThan(2);
  }
  // drag to the right moves the strip right by about the drag distance
  const before = await pos();
  await page.mouse.move(box.x + 200, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 260, y, { steps: 4 });
  await page.mouse.move(box.x + 320, y, { steps: 4 });
  await page.waitForTimeout(150); // hold still: no throw on release
  await page.mouse.up();
  const after = await pos();
  const half = await track.evaluate((el) => el.scrollWidth / 2);
  const moved = (((after - before) % half) + half) % half; // the loop may wrap
  expect(moved).toBeGreaterThan(90);
  expect(moved).toBeLessThan(150);
  // ← / → when focused
  await strip.focus();
  const k = await pos();
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(500);
  const kk = await pos();
  expect((((kk - k) % half) + half) % half).toBeGreaterThan(50);
});

test('the chosen palette survives a language switch and a reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' && /script tag/i.test(m.text())) errors.push(m.text()); });
  await page.goto('/uk/about');
  const pal = page.locator('.pal');
  test.skip(!(await pal.count()), 'palette switcher is off in this build');
  await pal.getByRole('button', { name: /^C/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'c');
  // client-side switch to English: the [locale] layout renders anew with the default palette
  await page.locator('a[hreflang="en"]').first().dispatchEvent('click');
  await expect(page).toHaveURL(/\/en\/about$/);
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'c');
  await expect(pal.getByRole('button', { name: /^C/ })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'c');
  expect(errors).toEqual([]);
});

test('back to top jumps without playing the scroll scenes in reverse', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/uk');
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(800);
  const from = await page.evaluate(() => window.scrollY);
  expect(from).toBeGreaterThan(2000);
  await page.evaluate(() => {
    const w = window as unknown as { __ys: number[] };
    w.__ys = [];
    window.addEventListener('scroll', () => w.__ys.push(Math.round(window.scrollY)), { passive: true });
  });
  await page.getByRole('button', { name: 'Нагору' }).click();
  await page.waitForFunction(() => window.scrollY === 0);
  // the hero is at its start at once (no catch-up of the scrubbed scene)
  const p = await page.locator('[data-hero-stage]').evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--p') || 0));
  expect(p).toBeLessThan(0.02);
  await page.waitForTimeout(600);
  // no smooth ride through the page: only the start and the top, nothing in between
  const ys = await page.evaluate(() => (window as unknown as { __ys: number[] }).__ys);
  expect(ys.filter((y) => y > 0 && y < from - 5)).toEqual([]);
  await expect(page.locator('body')).toHaveCSS('opacity', '1');
});

test('palette O uses the colours of the client\'s current site', async ({ page }) => {
  await page.goto('/uk/about');
  const pal = page.locator('.pal');
  test.skip(!(await pal.count()), 'palette switcher is off in this build');
  await pal.getByRole('button', { name: /^O/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'o');
  const v = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return ['--accent', '--ink', '--muted', '--bg'].map((k) => cs.getPropertyValue(k).trim());
  });
  expect(v.map((c) => (c === '#fff' ? '#ffffff' : c))).toEqual(['#0080fe', '#303030', '#656565', '#ffffff']);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'o');
});

test('a team card on the home page opens that person on the team page', async ({ page }) => {
  await page.goto('/uk');
  const card = page.locator('#team a.person-link').first();
  await card.scrollIntoViewIfNeeded();
  const name = (await card.locator('h3').textContent())!.trim();
  await card.click();
  await expect(page).toHaveURL(/\/uk\/team#m-[\w-]+$/);
  const target = page.locator('.team-page .person[data-hit]');
  await expect(target).toHaveCount(1);
  await expect(target.locator('h3')).toHaveText(name);
  await expect(target).toBeInViewport();
  // its biography is open (when the member has one)
  const bio = target.locator('details.bio');
  if (await bio.count()) await expect(bio).toHaveAttribute('open', '');
  // a typed or reloaded address does the same
  await page.reload();
  await expect(page.locator('.team-page .person[data-hit] h3')).toHaveText(name);
  await expect(page.locator('.team-page .person[data-hit]')).toBeInViewport();
});

test('«Надання впевненості» shows the brief’s three checks, the regulators in the last card', async ({ page }) => {
  await page.goto('/uk/services/nadannia-vpevnenosti');
  const cards = page.locator('.dcards > li');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText('Дія Сіті');
  await expect(cards.nth(1)).toContainText('Дефенс Сіті');
  const last = cards.nth(2);
  await expect(last).toHaveClass(/dcard-wide/);
  for (const r of ['АМКУ', 'НКЦПФР', 'НБУ']) await expect(last.locator('.dcard-tags b', { hasText: r })).toBeVisible();
});

test('dark theme: follows the device, the header button switches it and the choice survives a reload', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('/uk');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  // The page itself is dark, not only the attribute.
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const [r, g, b] = bg.match(/\d+/g)!.map(Number);
  expect(r + g + b).toBeLessThan(150);
  await page.getByRole('button', { name: 'Увімкнути світлу тему' }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Увімкнути темну тему' })).toBeVisible();
  await ctx.close();
});
