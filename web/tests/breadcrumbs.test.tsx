// @vitest-environment jsdom
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Breadcrumbs from '@/components/concept/Breadcrumbs';
import en from '@/i18n/dictionaries/en.json';
import uk from '@/i18n/dictionaries/uk.json';
import type { Dictionary } from '@/i18n/get-dictionary';
import { SECTIONS, crumbHref, trail, trailLd } from '@/lib/breadcrumbs';

const dicts = { uk: uk as unknown as Dictionary, en: en as unknown as Dictionary };
const app = join(process.cwd(), 'src', 'app', '[locale]');

describe('breadcrumb config', () => {
  it.each(Object.entries(SECTIONS))('%s points to a page that exists and has a label in both languages', (_, s) => {
    const seg = s.path.slice(1);
    expect(existsSync(join(app, seg, 'page.tsx')) || existsSync(join(app, seg, '(list)', 'page.tsx'))).toBe(true);
    for (const d of Object.values(dicts)) expect(s.label(d)).toMatch(/\S/);
  });

  it('builds Home → section → deeper crumbs, the last one being the current page', () => {
    const t = trail(dicts.uk, 'services', { name: 'Податки', path: '/services#tax' }, { name: 'Аудит', path: '/services/audit' });
    expect(t.map((c) => c.name)).toEqual([uk.nav.home, uk.nav.services, 'Податки', 'Аудит']);
    expect(t.map((c) => crumbHref('en', c))).toEqual(['/en', '/en/services', '/en/services#tax', '/en/services/audit']);
    expect(trail(dicts.en, 'team').map((c) => c.name)).toEqual([en.nav.home, en.nav.team]);
  });

  it('gives search engines the same trail with absolute URLs, leaving out in-page anchors', () => {
    const ld = trailLd('uk', trail(dicts.uk, 'services', { name: 'Податки', path: '/services#tax' }, { name: 'Аудит', path: '/services/audit' }));
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: uk.nav.home, item: 'https://bp-audit.com.ua/uk' },
      { '@type': 'ListItem', position: 2, name: uk.nav.services, item: 'https://bp-audit.com.ua/uk/services' },
      { '@type': 'ListItem', position: 3, name: 'Аудит', item: 'https://bp-audit.com.ua/uk/services/audit' },
    ]);
  });
});

describe('<Breadcrumbs>', () => {
  it('links every crumb but the current page and adds the matching JSON-LD', () => {
    const crumbs = trail(dicts.uk, 'blog', { name: 'Стаття', path: '/blog/x' });
    const { container } = render(<Breadcrumbs locale="uk" crumbs={crumbs} label={uk.nav.breadcrumbs} />);
    const nav = screen.getByRole('navigation', { name: uk.nav.breadcrumbs });
    expect([...nav.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      [uk.nav.home, '/uk'],
      [uk.nav.blog, '/uk/blog'],
    ]);
    const current = nav.querySelector('[aria-current="page"]')!;
    expect(current.textContent).toBe('Стаття');
    expect(current.tagName).toBe('LI');
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(ld.itemListElement.map((i: { name: string }) => i.name)).toEqual([uk.nav.home, uk.nav.blog, 'Стаття']);
  });

  it('renders nothing for a trail without a current page', () => {
    const { container } = render(<Breadcrumbs locale="uk" crumbs={[{ name: 'x', path: '' }]} label="b" />);
    expect(container.innerHTML).toBe('');
  });
});

