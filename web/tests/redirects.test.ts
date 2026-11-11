import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { legacyRedirects } from '../legacy-redirects';
import { categories, services, articles } from '../../cms/src/seed/structure';
import { newServices, legacyArticles } from '../../cms/src/seed/legacy';

const serviceSlugs = new Set([...services, ...newServices].map((s) => s.slug));
const articleSlugs = new Set([...articles, ...legacyArticles].map((a) => a.slug));
const categorySlugs = new Set<string>(categories.map((c) => c.slug));
const sections = new Set(readdirSync(new URL('../src/app/[locale]', import.meta.url)).filter((n) => !n.includes('.') && !n.startsWith('(') && !n.startsWith('[')));

describe('old Joomla URLs → new pages', () => {
  it('are permanent and unique', () => {
    const sources = legacyRedirects.map((r) => r.source);
    expect(new Set(sources).size).toBe(sources.length);
    expect(legacyRedirects.every((r) => r.permanent && r.source.startsWith('/'))).toBe(true);
  });
  it('never redirect a page to itself', () => {
    expect(legacyRedirects.filter((r) => r.source === r.destination.split('#')[0])).toEqual([]);
  });
  it('point to sections, services, articles and anchors that exist', () => {
    for (const { destination } of legacyRedirects) {
      const [path, hash] = destination.split('#');
      const [, locale, section, slug] = path.split('/');
      expect(['uk', 'en'], destination).toContain(locale);
      if (!section) continue;
      expect(sections.has(section), destination).toBe(true);
      if (section === 'services' && slug) expect(serviceSlugs.has(slug), destination).toBe(true);
      if (section === 'blog' && slug) expect(articleSlugs.has(slug), destination).toBe(true);
      if (section === 'services' && hash) expect(categorySlugs.has(hash), destination).toBe(true);
    }
  });
  it('keep the real English pages /en/about and /en/news', () => {
    expect(legacyRedirects.some((r) => r.source === '/en/about' || r.source === '/en/news')).toBe(false);
  });
});
