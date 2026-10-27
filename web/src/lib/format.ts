import { intlLocale, type Locale } from '@/i18n/config';

/** +380736730887 → +38 073 673 08 87 */
export function formatPhone(raw?: string | null): string {
  if (!raw) return '';
  const d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('380')) {
    return `+38 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
  }
  return raw;
}

export const telHref = (raw?: string | null) => (raw ? `tel:${raw.replace(/[^\d+]/g, '')}` : '#');

/** Days until a date (Kyiv time), or null when the date is empty or in the past. */
export function daysUntil(isoDate?: string | null): number | null {
  if (!isoDate) return null;
  const today = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Kyiv' }));
  const days = Math.round((new Date(isoDate).getTime() - today.getTime()) / 86_400_000);
  return days >= 0 ? days : null;
}

export const formatDate = (iso: string | null | undefined, locale: Locale) =>
  iso ? new Date(iso).toLocaleDateString(intlLocale[locale], { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Joins class names, skipping falsy values. */
export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
