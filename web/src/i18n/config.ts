/** Supported languages. Ukrainian is the default and the source language of all content. */
export const locales = ['uk', 'en', 'pl', 'fr', 'de', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'uk';

export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

/** Native names for the language switcher. */
export const localeNames: Record<Locale, string> = {
  uk: 'Українська',
  en: 'English',
  pl: 'Polski',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
};

/** Open Graph locale codes. */
export const ogLocale: Record<Locale, string> = {
  uk: 'uk_UA',
  en: 'en_US',
  pl: 'pl_PL',
  fr: 'fr_FR',
  de: 'de_DE',
  es: 'es_ES',
};

/** BCP-47 tags for Intl formatting. */
export const intlLocale: Record<Locale, string> = {
  uk: 'uk-UA',
  en: 'en-GB',
  pl: 'pl-PL',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
};

export const LOCALE_COOKIE = 'NEXT_LOCALE';
