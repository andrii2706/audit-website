import { expect, test } from '@playwright/test';

/** The visible trail and the BreadcrumbList data come from one config, so they must always say the same. */
async function check(page: import('@playwright/test').Page, path: string, expected: string[]) {
  await page.goto(path);
  const nav = page.locator('.pagehead nav.crumbs');
  const visible = (await nav.locator('li').allTextContents()).map((t) => t.trim());
  if (expected.length) expect(visible).toEqual(expected);
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t)).find((d) => d['@type'] === 'BreadcrumbList');
  expect(ld, 'BreadcrumbList on the page').toBeTruthy();
  const names = ld.itemListElement.map((i: { name: string }) => i.name);
  // Every JSON-LD item is a visible crumb, in the same order (in-page anchors like a category are visible only).
  expect(visible.filter((v) => names.includes(v))).toEqual(names);
  expect(names[names.length - 1]).toBe(visible[visible.length - 1]);
  // On phones the trail stays on one line and never pushes the page sideways.
  const overflow = await nav.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  return visible;
}

test('section pages: Home / section', async ({ page }) => {
  await check(page, '/uk/team', ['Головна', 'Команда']);
  await check(page, '/en/contacts', ['Home', 'Contacts']);
  await check(page, '/uk/request', ['Головна', 'Залишити заявку']);
});

test('a service and an article: Home / section / … / the page itself', async ({ page }) => {
  await page.goto('/uk/services');
  const href = await page.locator('a.svc').first().getAttribute('href');
  const title = (await page.locator('a.svc h3').first().textContent())!.trim();
  const crumbs = await check(page, href!, []);
  expect(crumbs[0]).toBe('Головна');
  expect(crumbs[crumbs.length - 1]).toBe(title);
  await page.locator('.pagehead nav.crumbs').getByRole('link', { name: 'Послуги', exact: true }).click();
  await expect(page).toHaveURL(/\/uk\/services$/);

  await page.goto('/uk/blog');
  const post = page.locator('a.post').first();
  if (await post.count()) {
    const postHref = await post.getAttribute('href');
    const postTitle = (await post.locator('h3').textContent())!.trim();
    const c = await check(page, postHref!, []);
    expect(c).toEqual(['Головна', 'Блог', postTitle]);
  }
});
