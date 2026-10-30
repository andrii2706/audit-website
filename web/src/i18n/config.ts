/** Supported languages. Ukrainian is the default and the source language of all content. */
export const locales = ['uk', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'uk';

export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

/** Native names for the language switcher. */
export const localeNames: Record<Locale, string> = {
  uk: 'Українська',
  en: 'English',
};

/** Open Graph locale codes. */
export const ogLocale: Record<Locale, string> = {
  uk: 'uk_UA',
  en: 'en_US',
};

/** BCP-47 tags for Intl formatting. */
export const intlLocale: Record<Locale, string> = {
  uk: 'uk-UA',
  en: 'en-GB',
};

export const LOCALE_COOKIE = 'NEXT_LOCALE';
