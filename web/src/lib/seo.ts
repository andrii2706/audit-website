import type { Metadata } from 'next';
import { defaultLocale, locales, ogLocale, type Locale } from '@/i18n/config';
import type { Global } from './strapi';

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
  /** Use the title as-is (skip the "— Site name" template). */
  absoluteTitle?: boolean;
};

/** Full metadata for a page: title, description, canonical, hreflang, Open Graph and Twitter. */
export function buildMetadata(m: MetaInput): Metadata {
  const url = pageUrl(m.locale, m.path);
  const description = m.description ?? undefined;
  return {
    title: m.absoluteTitle ? { absolute: m.title } : m.title,
    description,
    alternates: { canonical: url, languages: languageAlternates(m.path) },
    openGraph: {
      type: m.type ?? 'website',
      url,
      title: m.title,
      description,
      locale: ogLocale[m.locale],
      alternateLocale: locales.filter((l) => l !== m.locale).map((l) => ogLocale[l]),
      // Fall back to the locale's branded preview (app/[locale]/opengraph-image.tsx).
      images: [{ url: m.image || `/${m.locale}/opengraph-image`, width: 1200, height: 630 }],
      ...(m.publishedTime ? { publishedTime: m.publishedTime } : {}),
      ...(m.modifiedTime ? { modifiedTime: m.modifiedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title: m.title, description, images: [m.image || `/${m.locale}/opengraph-image`] },
  };
}

// ——— Schema.org (JSON-LD)

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
    address: { '@type': 'PostalAddress', addressLocality: 'Lviv', addressCountry: 'UA' },
    areaServed: { '@type': 'Country', name: 'Ukraine' },
    sameAs: g.socials?.map((s) => s.url),
    contactPoint: g.phone
      ? [{ '@type': 'ContactPoint', telephone: g.phone, email: g.email ?? undefined, contactType: 'customer service', availableLanguage: ['uk', 'en', 'pl', 'fr', 'de', 'es'] }]
      : undefined,
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
