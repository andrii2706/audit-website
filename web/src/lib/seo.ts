import type { Metadata } from 'next';
import { defaultLocale, locales, ogLocale, type Locale } from '@/i18n/config';
import type { Global } from './strapi';
import uk from '@/i18n/dictionaries/uk.json';
import en from '@/i18n/dictionaries/en.json';

const META: Record<Locale, { siteName: string; descriptionTail: string }> = { uk: uk.meta, en: en.meta };

/** Google shows about 60 characters of a title and ~155–160 of a description. */
const TITLE_MAX = 60;
const DESC_MIN = 100;
const DESC_MAX = 160;

/**
 * Search-result title: "Page — Brand" when that fits in 60 characters, otherwise just the page title
 * (the brand is dropped rather than truncated by Google). Titles that already name the brand stay as they are.
 */
export function seoTitle(locale: Locale, title: string) {
  const brand = META[locale].siteName;
  if (title.toLowerCase().includes(brand.toLowerCase())) return title;
  const full = `${title} — ${brand}`;
  return full.length <= TITLE_MAX ? full : title;
}

/** Pads very short descriptions with the brand and city so snippets aren't thin; long ones are trimmed on a word. */
export function seoDescription(locale: Locale, text?: string | null) {
  let d = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!d) return undefined;
  const tail = META[locale].descriptionTail;
  if (d.length < DESC_MIN && d.length + tail.length + 1 <= DESC_MAX) d = `${d.replace(/[.\s]*$/, '.')} ${tail}`;
  if (d.length > DESC_MAX) d = `${d.slice(0, DESC_MAX - 1).replace(/\s+\S*$/, '')}…`;
  return d;
}

export const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Absolute URL of a page in a given locale. `path` starts with "/" or is "" for the home page. */
export const pageUrl = (locale: Locale, path = '') => `${SITE_URL}/${locale}${path}`;

/** hreflang map for one logical page across all locales (+ x-default → Ukrainian). */
export function languageAlternates(path = '') {
  const map: Record<string, string> = {};
  for (const l of locales) map[l] = pageUrl(l, path);
  map['x-default'] = pageUrl(defaultLocale, path);
  return map;
}

type MetaInput = {
  locale: Locale;
  /** Path without the locale prefix, e.g. "/services/msfz". */
  path: string;
  title: string;
  description?: string | null;
  image?: string | null;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  /** Use the title as-is (never add the "— Site name" suffix). */
  absoluteTitle?: boolean;
};

/** Full metadata for a page: title, description, canonical, hreflang, Open Graph and Twitter. */
export function buildMetadata(m: MetaInput): Metadata {
  const url = pageUrl(m.locale, m.path);
  const description = seoDescription(m.locale, m.description);
  const title = m.absoluteTitle ? m.title : seoTitle(m.locale, m.title);
  return {
    // Always absolute: the "— Brand" suffix is added by seoTitle() only when it fits.
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: languageAlternates(m.path) },
    openGraph: {
      type: m.type ?? 'website',
      url,
      title,
      description,
      locale: ogLocale[m.locale],
      alternateLocale: locales.filter((l) => l !== m.locale).map((l) => ogLocale[l]),
      // Fall back to the locale's branded preview (app/[locale]/opengraph-image.tsx).
      images: [{ url: m.image || `/${m.locale}/opengraph-image`, width: 1200, height: 630 }],
      ...(m.publishedTime ? { publishedTime: m.publishedTime } : {}),
      ...(m.modifiedTime ? { modifiedTime: m.modifiedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, images: [m.image || `/${m.locale}/opengraph-image`] },
  };
}

// ——— Schema.org (JSON-LD)

/** "49.85,24.02" (the map query in Strapi) → GeoCoordinates; a street address yields nothing. */
function geoFromQuery(q?: string | null) {
  const m = q?.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
  return m ? { '@type': 'GeoCoordinates', latitude: Number(m[1]), longitude: Number(m[2]) } : undefined;
}

export function organizationLd(locale: Locale, g: Global | null) {
  if (!g) return null;
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'AccountingService'],
    '@id': `${SITE_URL}/#organization`,
    name: g.siteName,
    legalName: g.legalName ?? undefined,
    url: pageUrl(locale),
    logo: `${SITE_URL}/icon.svg`,
    image: `${SITE_URL}/${locale}/opengraph-image`,
    description: g.seo?.metaDescription ?? undefined,
    telephone: g.phone ?? undefined,
    email: g.email ?? undefined,
    taxID: g.edrpou ?? undefined,
    address: { '@type': 'PostalAddress', streetAddress: g.address ?? undefined, addressLocality: 'Lviv', addressCountry: 'UA' },
    hasMap: g.mapUrl ?? undefined,
    geo: geoFromQuery(g.mapQuery),
    // Mon–Fri 9:00–18:30 (TZ); Saturday by appointment is not a regular opening and is left out.
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:30' }],
    foundingDate: '2011',
    areaServed: { '@type': 'Country', name: 'Ukraine' },
    sameAs: g.socials?.map((s) => s.url),
    contactPoint: [g.phone, g.phoneSecondary].filter(Boolean).map((tel) => ({
      '@type': 'ContactPoint', telephone: tel, email: g.email ?? undefined, contactType: 'customer service', availableLanguage: ['uk', 'en'],
    })),
  };
}

export function websiteLd(locale: Locale, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: pageUrl(locale),
    name,
    inLanguage: locale,
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

export function serviceLd(locale: Locale, s: { title: string; excerpt: string; slug: string; category?: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.title,
    description: s.excerpt,
    serviceType: s.category ?? undefined,
    url: pageUrl(locale, `/services/${s.slug}`),
    inLanguage: locale,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: { '@type': 'Country', name: 'Ukraine' },
  };
}

export function articleLd(locale: Locale, a: { title: string; excerpt?: string | null; slug: string; publishedAt?: string; updatedAt?: string; image?: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.excerpt ?? undefined,
    url: pageUrl(locale, `/blog/${a.slug}`),
    inLanguage: locale,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt ?? a.publishedAt,
    image: a.image ?? `${SITE_URL}/${locale}/opengraph-image`,
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function newsLd(locale: Locale, n: { title: string; excerpt?: string | null; slug: string; date: string; updatedAt?: string; image?: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: n.title,
    description: n.excerpt ?? undefined,
    url: pageUrl(locale, `/news/${n.slug}`),
    mainEntityOfPage: pageUrl(locale, `/news/${n.slug}`),
    inLanguage: locale,
    datePublished: n.date,
    dateModified: n.updatedAt ?? n.date,
    image: n.image ? [n.image] : [`${SITE_URL}/${locale}/opengraph-image`],
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function faqLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };
}
