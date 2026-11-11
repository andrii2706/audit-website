import { describe, expect, it } from 'vitest';
import uk from '@/i18n/dictionaries/uk.json';
import en from '@/i18n/dictionaries/en.json';

const PLURAL = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
/** Plural-form objects ({ one, few, many, other }) differ per language by design: treat them as one value. */
const isPlural = (o: object) => Object.keys(o).every((k) => PLURAL.has(k)) && 'other' in o;

/** All key paths of a nested dictionary ("form.errName", …). */
const keys = (o: unknown, prefix = ''): string[] =>
  o && typeof o === 'object' && !Array.isArray(o) && !isPlural(o)
    ? Object.entries(o).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
    : [prefix];

const leaves = (o: unknown): unknown[] => (o && typeof o === 'object' ? Object.values(o).flatMap(leaves) : [o]);

describe('dictionaries', () => {
  it('uk and en have exactly the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(uk).sort());
  });
  it('have no empty strings', () => {
    for (const d of [uk, en]) expect(leaves(d).filter((v) => v === '')).toEqual([]);
  });
  it('use the same {placeholders} in both languages', () => {
    const placeholders = (s: unknown) => (typeof s === 'string' ? (s.match(/\{\w+\}/g) ?? []).sort() : []);
    const get = (d: unknown, path: string) => path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], d);
    for (const k of keys(uk)) expect(placeholders(get(en, k)), k).toEqual(placeholders(get(uk, k)));
  });
});
