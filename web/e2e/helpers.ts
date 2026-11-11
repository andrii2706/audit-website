import { expect, type Page } from '@playwright/test';

export const CMS_URL = (process.env.E2E_CMS_URL || 'http://localhost:1337').replace(/\/$/, '');

/** Main pages of both languages (the detail pages are reached by clicking through lists). */
export const PAGES = ['', '/services', '/audiences', '/about', '/team', '/reports', '/news', '/blog', '/career', '/contacts'];

/** Fails the test on JavaScript errors and failed requests to the site itself (CSP violations included). */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Google Maps' own iframe noise is not ours.
    if (/google|gstatic|Failed to load resource: net::ERR_(BLOCKED|NAME|CONNECTION|ABORTED)/i.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return {
    check: () => expect(errors, errors.join('\n')).toEqual([]),
  };
}

/** No element may stick out sideways (a horizontal scrollbar on phones). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1);
}
