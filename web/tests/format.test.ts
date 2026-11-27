import { describe, expect, it } from 'vitest';
import { cx, formatPhone, initials, telHref } from '@/lib/format';
import { plural, t } from '@/i18n/format';

describe('phones', () => {
  it('formats Ukrainian numbers', () => expect(formatPhone('+380673705846')).toBe('+38 067 370 58 46'));
  it('leaves other numbers alone', () => expect(formatPhone('+48124004703')).toBe('+48124004703'));
  it('builds tel: links with digits only', () => {
    expect(telHref('+38 (067) 370-58-46')).toBe('tel:+380673705846');
    expect(telHref(null)).toBe('#');
  });
});

describe('text helpers', () => {
  it('initials from the first two words', () => expect(initials('Цуприк Наталія Андріївна')).toBe('ЦН'));
  it('cx skips empty values', () => expect(cx('a', false, null, undefined, 'b')).toBe('a b'));
  it('t fills placeholders and keeps unknown ones', () => expect(t('Hello {name}, {x}', { name: 'Олена' })).toBe('Hello Олена, {x}'));
  it('plural picks Ukrainian forms', () => {
    const forms = { one: 'рік', few: 'роки', many: 'років', other: 'року' };
    expect([1, 3, 5, 21].map((n) => plural('uk', n, forms))).toEqual(['рік', 'роки', 'років', 'рік']);
  });
});
