import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { breadcrumbLd, pageUrl } from './seo';

/** One breadcrumb: its label and the path without the locale ('' is the home page, '/services', '/services#tax'). */
export type Crumb = { name: string; path: string };

/**
 * Every section of the site and its breadcrumb label — the single place to rename a crumb or add a page.
 * Labels come from the dictionaries (`nav`), so the trail always matches the main menu in both languages.
 */
export const SECTIONS = {
  services: { path: '/services', label: (d: Dictionary) => d.nav.services },
  audiences: { path: '/audiences', label: (d: Dictionary) => d.nav.audiences },
  about: { path: '/about', label: (d: Dictionary) => d.nav.about },
  team: { path: '/team', label: (d: Dictionary) => d.nav.team },
  reports: { path: '/reports', label: (d: Dictionary) => d.nav.reports },
  news: { path: '/news', label: (d: Dictionary) => d.nav.news },
  blog: { path: '/blog', label: (d: Dictionary) => d.nav.blog },
  career: { path: '/career', label: (d: Dictionary) => d.nav.career },
  contacts: { path: '/contacts', label: (d: Dictionary) => d.nav.contacts },
  request: { path: '/request', label: (d: Dictionary) => d.nav.consultation },
} as const;

export type Section = keyof typeof SECTIONS;

/**
 * The trail of a page: Home → section → any deeper crumbs (a category, then the service or article itself).
 * The last crumb is the current page.
 *   trail(dict, 'team')                                          → Головна / Команда
 *   trail(dict, 'blog', { name: a.title, path: `/blog/${slug}` }) → Головна / Блог / <article>
 */
export function trail(dict: Dictionary, section: Section, ...deeper: Crumb[]): Crumb[] {
  const s = SECTIONS[section];
  return [{ name: dict.nav.home, path: '' }, { name: s.label(dict), path: s.path }, ...deeper];
}

/** Link of a crumb in the given language. */
export const crumbHref = (locale: Locale, c: Crumb) => `/${locale}${c.path}`;

/**
 * schema.org BreadcrumbList for the same trail, with absolute URLs. Crumbs that point inside a page (a "#" anchor,
 * like a service category) are left out: search engines expect every item to be a page of its own.
 */
export function trailLd(locale: Locale, crumbs: Crumb[]) {
  return breadcrumbLd(crumbs.filter((c) => !c.path.includes('#')).map((c) => ({ name: c.name, url: pageUrl(locale, c.path) })));
}
