import { intlLocale, type Locale } from './config';

/** Replaces {name} placeholders: t('Hello {n}', { n: 3 }) */
export function t(template: string, vars: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Picks a plural form from a { one, few, many, other } map using Intl.PluralRules. */
export function plural(locale: Locale, n: number, forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }) {
  const rule = new Intl.PluralRules(intlLocale[locale]).select(n);
  return forms[rule] ?? forms.other;
}
