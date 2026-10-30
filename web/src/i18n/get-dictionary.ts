import 'server-only';
import type { Locale } from './config';
import uk from './dictionaries/uk.json';

export type Dictionary = typeof uk;

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  uk: async () => uk,
  en: () => import('./dictionaries/en.json').then((m) => m.default as Dictionary),
};

export const getDictionary = (locale: Locale) => loaders[locale]();
