/**
 * Data layer: reads content from the Strapi 5 REST API.
 * Every request is cached with the "strapi" tag and refreshed by the CMS webhook
 * (see src/app/api/revalidate/route.ts) or every REVALIDATE_SECONDS.
 * All getters take a locale; Strapi returns the matching localization (uk is the default).
 */
import type { Locale } from '@/i18n/config';

const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
export const REVALIDATE_SECONDS = 3600;
export const CACHE_TAG = 'strapi';

// ——— Types (mirror the schemas in cms/src/api)

export type Media = { url: string; alternativeText?: string | null; width?: number; height?: number } | null;
export type Bullet = { id: number; text: string };
export type Step = { id: number; title: string; text?: string | null; duration?: string | null };
export type Stat = { id: number; value: string; label: string };
export type TextItem = { id: number; title: string; text?: string | null };
export type LinkItem = { id: number; label: string; url: string };
export type Seo = { metaTitle?: string | null; metaDescription?: string | null } | null;
// Strapi Blocks — a node tree, rendered by components/Blocks.tsx
export type Blocks = Array<Record<string, unknown>> | null;

export type Category = { documentId: string; name: string; slug: string; intro?: string | null; order: number };

export type Service = {
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  description?: Blocks;
  badge?: string | null;
  priceFrom?: string | null;
  duration?: string | null;
  homeFeatured?: boolean;
  homeOrder?: number;
  order?: number;
  tags?: Bullet[];
  deliverables?: Bullet[];
  steps?: Step[];
  category?: Category | null;
  seo?: Seo;
  updatedAt?: string;
};

export type Audience = {
  documentId: string;
  label: string;
  title: string;
  description: string;
  order: number;
  services: Pick<Service, 'documentId' | 'title' | 'slug' | 'excerpt'>[];
};

export type TeamMember = {
  documentId: string;
  name: string;
  role: string;
  credential?: string | null;
  experience?: string | null;
  bio?: string | null;
  photo?: Media;
};

export type Faq = { documentId: string; question: string; answer: string };

export type Article = {
  documentId: string;
  title: string;
  slug: string;
  kind?: string | null;
  readingMinutes?: number | null;
  excerpt?: string | null;
  cover?: Media;
  content?: Blocks;
  publishedAt?: string;
  updatedAt?: string;
  seo?: Seo;
};

export type NewsItem = {
  documentId: string;
  title: string;
  slug: string;
  /** Publication date chosen by the editor (YYYY-MM-DD). */
  date: string;
  tag?: string | null;
  pinned?: boolean | null;
  excerpt?: string | null;
  cover?: Media;
  content?: Blocks;
  publishedAt?: string;
  updatedAt?: string;
  seo?: Seo;
};

export type ClientLogo = { documentId: string; name: string; url?: string | null; logo?: Media };

export type Global = {
  siteName: string;
  tagline?: string | null;
  legalName?: string | null;
  edrpou?: string | null;
  registryNumber?: string | null;
  phone?: string | null;
  /** Second office phone (TZ: two numbers in the header and footer). */
  phoneSecondary?: string | null;
  email?: string | null;
  address?: string | null;
  workingHours?: string | null;
  /** Saturday / Sunday note shown under the working hours. */
  workingHoursNote?: string | null;
  /** Text query for the embedded Google map, e.g. "вулиця Лемківська, 9А, Львів". */
  mapQuery?: string | null;
  /** "Open in Google Maps" link. */
  mapUrl?: string | null;
  telegramUrl?: string | null;
  viberUrl?: string | null;
  whatsappUrl?: string | null;
  socials?: LinkItem[];
  footerNote?: string | null;
  seo?: Seo;
};

export type Homepage = {
  heroBadge?: string | null;
  heroBadgeNote?: string | null;
  heroTitleStart: string;
  heroTitleAccent?: string | null;
  heroTitleEnd?: string | null;
  heroSubtitle?: string | null;
  quickServices?: Pick<Service, 'documentId' | 'title' | 'slug'>[];
  deadlineTitle?: string | null;
  deadlineDate?: string | null;
  deadlineService?: Pick<Service, 'title' | 'slug'> | null;
  googleRating?: number | null;
  googleReviewsCount?: number | null;
  trustTitle?: string | null;
  trustText?: string | null;
  servicesTitle?: string | null;
  audienceTitle?: string | null;
  processTitle?: string | null;
  processSteps?: Step[];
  stats?: Stat[];
  whyTitle?: string | null;
  reasons?: TextItem[];
  industriesTitle?: string | null;
  industries?: Bullet[];
  teamTitle?: string | null;
  teamSubtitle?: string | null;
  estimateTitle?: string | null;
  estimateText?: string | null;
  estimateBullets?: Bullet[];
  blogTitle?: string | null;
  faqTitle?: string | null;
  faqText?: string | null;
  ctaTitle?: string | null;
};

export type AboutPage = {
  heroTitle: string;
  heroIntro?: string | null;
  intro?: Blocks;
  reasonsTitle?: string | null;
  reasons?: TextItem[];
  missionTitle?: string | null;
  mission?: string | null;
  valuesTitle?: string | null;
  values?: TextItem[];
  principlesTitle?: string | null;
  principlesIntro?: string | null;
  principles?: TextItem[];
  principlesOutro?: string | null;
  historyTitle?: string | null;
  history?: Blocks;
  requestsTitle?: string | null;
  requests?: Bullet[];
  registryTitle?: string | null;
  registry?: Blocks;
  qualityTitle?: string | null;
  quality?: Blocks;
  requisitesTitle?: string | null;
  requisites?: Blocks;
  policyTitle?: string | null;
  policy?: Blocks;
  documentsTitle?: string | null;
  recommendationsTitle?: string | null;
  seo?: Seo;
};

/** Certificate / licence scan or recommendation letter (About page galleries). */
export type DocumentImage = {
  documentId: string;
  title: string;
  kind: 'certificate' | 'recommendation';
  image?: (NonNullable<Media> & { ext?: string; mime?: string }) | null;
};

export type CareerPage = {
  heroTitle: string;
  heroIntro?: string | null;
  aboutTitle?: string | null;
  about?: Blocks;
  faqTitle?: string | null;
  faqs?: TextItem[];
  vacanciesTitle?: string | null;
  vacanciesEmpty?: string | null;
  seo?: Seo;
};

export type Vacancy = {
  documentId: string;
  title: string;
  employment?: string | null;
  duties?: string | null;
  requirements?: string | null;
  conditions?: string | null;
};

export type TransparencyReport = {
  documentId: string;
  year: number;
  title?: string | null;
  file?: (NonNullable<Media> & { name?: string; ext?: string; size?: number }) | null;
  isCorrection?: boolean | null;
  /** report = transparency report, balance = annual balance sheet. */
  docType?: 'report' | 'balance' | null;
  publishedOn?: string | null;
  note?: string | null;
};

// ——— Base request

type Query = Record<string, string | number | boolean | undefined>;

async function strapi<T>(path: string, query: Query = {}): Promise<T | null> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined) qs.set(k, String(v));
  const url = `${STRAPI_URL}/api/${path}${qs.size ? `?${qs}` : ''}`;
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS, tags: [CACHE_TAG] } });
    if (!res.ok) {
      if (res.status !== 404) console.error(`[strapi] ${res.status} ${url}`);
      return null;
    }
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch (err) {
    // CMS unreachable (e.g. during a CI build) — the page renders with empty data.
    console.error(`[strapi] ${url}: ${(err as Error).message}`);
    return null;
  }
}

export function mediaUrl(m: Media): string | null {
  if (!m?.url) return null;
  return m.url.startsWith('http') ? m.url : `${STRAPI_URL}${m.url}`;
}

// ——— Page queries

export const getGlobal = (locale: Locale) =>
  strapi<Global>('global', {
    locale, 'populate[socials]': true, 'populate[seo]': true });

export const getHomepage = (locale: Locale) =>
  strapi<Homepage>('homepage', {
    locale,
    'populate[quickServices][fields][0]': 'title',
    'populate[quickServices][fields][1]': 'slug',
    'populate[deadlineService][fields][0]': 'title',
    'populate[deadlineService][fields][1]': 'slug',
    'populate[processSteps]': true,
    'populate[stats]': true,
    'populate[reasons]': true,
    'populate[industries]': true,
    'populate[estimateBullets]': true,
  });

export const getAboutPage = (locale: Locale) =>
  strapi<AboutPage>('about-page', {
    locale,
    'populate[reasons]': true,
    'populate[values]': true,
    'populate[principles]': true,
    'populate[requests]': true,
    'populate[seo]': true,
  });

/** Document scans that have an image (entries without one are not shown). */
export const getDocumentImages = async (locale: Locale) =>
  ((await strapi<DocumentImage[]>('document-images', {
    locale, sort: 'order:asc', 'populate[image]': true, 'pagination[pageSize]': 100 })) ?? []).filter((d) => !!d.image?.url);

export const getCareerPage = (locale: Locale) =>
  strapi<CareerPage>('career-page', { locale, 'populate[faqs]': true, 'populate[seo]': true });

export const getVacancies = async (locale: Locale) =>
  (await strapi<Vacancy[]>('vacancies', { locale, sort: 'order:asc', 'pagination[pageSize]': 50 })) ?? [];

/** Transparency reports, newest year first; within a year: report, its corrections, then the balance sheet. */
export const getTransparencyReports = async (locale: Locale) =>
  (await strapi<TransparencyReport[]>('transparency-reports', {
    locale,
    'sort[0]': 'year:desc',
    'sort[1]': 'docType:desc',
    'sort[2]': 'isCorrection:asc',
    'sort[3]': 'publishedOn:asc',
    'populate[file]': true,
    'pagination[pageSize]': 100,
  })) ?? [];

export const getFeaturedServices = async (locale: Locale) =>
  (await strapi<Service[]>('services', {
    locale,
    'filters[homeFeatured][$eq]': true,
    sort: 'homeOrder:asc',
    'populate[tags]': true,
    'pagination[pageSize]': 7,
  })) ?? [];

export const getAllServices = async (locale: Locale) =>
  (await strapi<Service[]>('services', {
    locale,
    sort: 'order:asc',
    'fields[0]': 'title',
    'fields[1]': 'slug',
    'fields[2]': 'excerpt',
    'fields[3]': 'badge',
    'fields[4]': 'updatedAt',
    'populate[category][fields][0]': 'slug',
    'pagination[pageSize]': 200,
  })) ?? [];

export const getServiceBySlug = async (locale: Locale, slug: string) => {
  const list = await strapi<Service[]>('services', {
    locale,
    'filters[slug][$eq]': slug,
    'populate[tags]': true,
    'populate[deliverables]': true,
    'populate[steps]': true,
    'populate[seo]': true,
    'populate[category]': true,
  });
  return list?.[0] ?? null;
};

export const getCategories = async (locale: Locale) =>
  (await strapi<Category[]>('service-categories', {
    locale, sort: 'order:asc', 'pagination[pageSize]': 50 })) ?? [];

export const getAudiences = async (locale: Locale) =>
  (await strapi<Audience[]>('audiences', {
    locale,
    sort: 'order:asc',
    'populate[services][fields][0]': 'title',
    'populate[services][fields][1]': 'slug',
    'populate[services][fields][2]': 'excerpt',
  })) ?? [];

export const getTeam = async (locale: Locale) =>
  (await strapi<TeamMember[]>('team-members', {
    locale, sort: 'order:asc', 'populate[photo]': true })) ?? [];

export const getFaqs = async (locale: Locale) => (await strapi<Faq[]>('faqs', { locale, sort: 'order:asc' })) ?? [];

export const getClients = async (locale: Locale) =>
  (await strapi<ClientLogo[]>('client-logos', {
    locale, sort: 'order:asc', 'populate[logo]': true, 'pagination[pageSize]': 100 })) ?? [];

export const getArticles = async (locale: Locale, limit = 50) =>
  (await strapi<Article[]>('articles', {
    locale,
    sort: 'publishedAt:desc',
    'fields[0]': 'title',
    'fields[1]': 'slug',
    'fields[2]': 'kind',
    'fields[3]': 'readingMinutes',
    'fields[4]': 'excerpt',
    'fields[5]': 'publishedAt',
    'fields[6]': 'updatedAt',
    'populate[cover]': true,
    'pagination[pageSize]': limit,
  })) ?? [];

export const getArticleBySlug = async (locale: Locale, slug: string) => {
  const list = await strapi<Article[]>('articles', {
    locale,
    'filters[slug][$eq]': slug,
    'populate[cover]': true,
    'populate[seo]': true,
  });
  return list?.[0] ?? null;
};

/** Published news, pinned first, then newest by date. */
export const getNews = async (locale: Locale, limit = 50) =>
  (await strapi<NewsItem[]>('news-items', {
    locale,
    'sort[0]': 'pinned:desc',
    'sort[1]': 'date:desc',
    'sort[2]': 'publishedAt:desc',
    'populate[cover]': true,
    'fields[0]': 'title',
    'fields[1]': 'slug',
    'fields[2]': 'date',
    'fields[3]': 'tag',
    'fields[4]': 'pinned',
    'fields[5]': 'excerpt',
    'fields[6]': 'publishedAt',
    'fields[7]': 'updatedAt',
    'pagination[pageSize]': limit,
  })) ?? [];

export const getNewsBySlug = async (locale: Locale, slug: string) => {
  const list = await strapi<NewsItem[]>('news-items', {
    locale,
    'filters[slug][$eq]': slug,
    'populate[cover]': true,
    'populate[seo]': true,
  });
  return list?.[0] ?? null;
};

/**
 * Cheap existence check for a detail page (only the slug field). Used by the [slug] layouts so an
 * unknown URL gets a real 404 status before the page starts streaming its loading skeleton.
 * Cached with the same tag as everything else, so publishing in Strapi updates it.
 */
export const slugExists = async (collection: 'services' | 'articles' | 'news-items', locale: Locale, slug: string) =>
  ((await strapi<{ slug: string }[]>(collection, { locale, 'filters[slug][$eq]': slug, 'fields[0]': 'slug' })) ?? []).length > 0;

// ——— Lead creation (server only, uses the API token)

export type LeadInput = {
  name: string;
  /** At least one of phone / email is present (validated in app/actions.ts). */
  phone?: string;
  email?: string;
  service?: string;
  revenue?: string;
  channel?: 'telegram' | 'viber' | 'whatsapp' | 'call' | 'email';
  comment?: string;
  sourcePage?: string;
  locale_code?: string;
};

export async function createLead(data: LeadInput): Promise<boolean> {
  const token = process.env.STRAPI_WEB_TOKEN;
  if (!token) {
    console.error('[strapi] STRAPI_WEB_TOKEN is not set — lead not saved');
    return false;
  }
  const res = await fetch(`${STRAPI_URL}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data }),
    cache: 'no-store',
  });
  if (!res.ok) console.error(`[strapi] lead ${res.status}: ${await res.text()}`);
  return res.ok;
}
