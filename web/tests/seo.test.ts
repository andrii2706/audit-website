import { describe, expect, it } from 'vitest';
import { languageAlternates, organizationLd, seoDescription, seoTitle } from '@/lib/seo';
import type { Global } from '@/lib/strapi';

describe('seoTitle', () => {
  it('adds the brand when the result fits in 60 characters', () => {
    expect(seoTitle('uk', 'Контакти')).toBe('Контакти — Бізнес Партнери');
    expect(seoTitle('en', 'Contacts')).toBe('Contacts — Business Partners');
  });
  it('keeps long titles as they are instead of letting Google cut the brand', () => {
    const long = 'Перевірка річного та початкового звіту резидента Дія Сіті';
    expect(seoTitle('uk', long)).toBe(long);
  });
  it('does not repeat the brand', () => expect(seoTitle('uk', 'Про Бізнес Партнери')).toBe('Про Бізнес Партнери'));
});

describe('seoDescription', () => {
  it('pads short descriptions with the brand line', () => {
    const d = seoDescription('uk', 'Аудит для ОСББ')!;
    expect(d.startsWith('Аудит для ОСББ.')).toBe(true);
    expect(d).toContain('Бізнес Партнери');
    expect(d.length).toBeLessThanOrEqual(160);
  });
  it('trims long descriptions on a word boundary with an ellipsis', () => {
    const d = seoDescription('uk', 'слово '.repeat(60))!;
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith('слово…')).toBe(true);
  });
  it('returns undefined for empty text', () => expect(seoDescription('uk', '   ')).toBeUndefined());
});

describe('alternates and JSON-LD', () => {
  it('lists every language plus x-default', () => {
    expect(languageAlternates('/team')).toMatchObject({
      uk: 'https://bp-audit.com.ua/uk/team',
      en: 'https://bp-audit.com.ua/en/team',
      'x-default': 'https://bp-audit.com.ua/uk/team',
    });
  });
  it('adds geo coordinates when the map point is coordinates', () => {
    const ld = organizationLd('uk', { siteName: 'Бізнес Партнери', mapQuery: '49.8531048,24.0258748' } as Global)!;
    expect(ld.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 49.8531048, longitude: 24.0258748 });
  });
  it('leaves geo out for a text address', () => {
    const ld = organizationLd('uk', { siteName: 'X', mapQuery: 'Львів, Лемківська 9А' } as Global)!;
    expect(ld.geo).toBeUndefined();
  });
});
