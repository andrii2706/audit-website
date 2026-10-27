import 'server-only';
import type { Locale } from './config';
import uk from './dictionaries/uk.json';

export type Dictionary = typeof uk;

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  uk: async () => uk,
  en: () => import('./dictionaries/en.json').then((m) => m.default as Dictionary),
  pl: () => import('./dictionaries/pl.json').then((m) => m.default as Dictionary),
  fr: () => import('./dictionaries/fr.json').then((m) => m.default as Dictionary),
  de: () => import('./dictionaries/de.json').then((m) => m.default as Dictionary),
  es: () => import('./dictionaries/es.json').then((m) => m.default as Dictionary),
};

export const getDictionary = (locale: Locale) => loaders[locale]();
