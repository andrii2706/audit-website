import { describe, expect, it } from 'vitest';
import * as structure from '../src/seed/structure';
import { LEGACY, legacyArticles, newServices, reports, teamRegistry } from '../src/seed/legacy';
import uk from '../src/seed/content/uk';
import en from '../src/seed/content/en';
import { seoFor } from '../src/seed/seo';

const content = { uk, en };
const allServices = [...structure.services, ...newServices].map((s) => s.slug);
const allArticles = [...structure.articles, ...legacyArticles].map((a) => a.slug);
const dupes = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);

describe('seed structure', () => {
  it('has unique, URL-safe slugs', () => {
    for (const slugs of [allServices, allArticles, structure.categories.map((c) => c.slug)]) {
      expect(dupes(slugs)).toEqual([]);
      for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
  it('quick links and the deadline service point to real services', () => {
    for (const s of [...structure.quickServices, structure.deadlineService]) expect(allServices).toContain(s);
  });
  it('office point is the client’s Google Maps pin «вулиця Лемківська, 9а»', () => {
    expect(structure.contacts.mapQuery).toBe('49.8531048,24.0258748');
    expect(structure.contacts.mapUrl).toContain('place_id:ChIJBQeoDAndOkcRrtekOqNKLRY');
  });
  it('contacts match the brief', () => {
    expect(structure.contacts).toMatchObject({ phone: '+380673705846', phoneSecondary: '+380503173661', email: 'businesspartners@ukr.net', edrpou: '37741155', registryNumber: '4463' });
  });
  it('content protection is on by default', () => {
    expect(Object.values(structure.contacts.protection).every(Boolean)).toBe(true);
  });
});

describe.each(['uk', 'en'] as const)('texts (%s)', (locale) => {
  const c = content[locale];
  it('every service in the structure has a title and an excerpt', () => {
    for (const { slug } of structure.services) {
      expect(c.services[slug]?.title, slug).toBeTruthy();
      expect(c.services[slug]?.excerpt, slug).toBeTruthy();
    }
    for (const { slug } of newServices) expect(LEGACY[locale].newServices[slug]?.title, slug).toBeTruthy();
  });
  it('every article has a title and content', () => {
    for (const { slug } of structure.articles) expect(c.articles[slug]?.content.length, slug).toBeGreaterThan(0);
    for (const { slug } of legacyArticles) expect(LEGACY[locale].articles[slug]?.content.length, slug).toBeGreaterThan(0);
  });
  it('has one team member per registry slot', () => {
    expect(c.team).toHaveLength(structure.teamCount);
    expect(teamRegistry).toHaveLength(structure.teamCount);
  });
  it('every report has a caption', () => {
    for (const r of reports) expect(LEGACY[locale].reports[r.key], r.key).toBeTruthy();
  });
  it('SEO titles fit Strapi’s 70-character limit', () => {
    for (const slug of [...allServices, ...allArticles]) {
      const seo = seoFor(locale, slug);
      if (seo) expect(seo.metaTitle.length, slug).toBeLessThanOrEqual(70);
    }
  });
});

/** Copied word for word from the old site; its English pages had no «Інші надання впевненості» section. */
const UK_ONLY = new Set(['nadannia-vpevnenosti']);

it('uk and en old-site texts cover the same entries', () => {
  for (const key of ['serviceExtras', 'newServices', 'articles', 'documents', 'reports'] as const) {
    const ukKeys = Object.keys(LEGACY.uk[key]).filter((k) => !UK_ONLY.has(k)).sort();
    expect(Object.keys(LEGACY.en[key]).sort(), key).toEqual(ukKeys);
  }
});
