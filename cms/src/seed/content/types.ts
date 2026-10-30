import type { Block, CategoryKey } from '../structure';

type Item = { title: string; text: string };

/** All translatable starter content for one locale. Keys match ../structure.ts. */
export type SiteContent = {
  categories: Record<CategoryKey, { name: string; intro: string }>;
  steps: { title: string; text: string }[];
  services: Record<string, { title: string; excerpt: string; badge?: string; tags?: string[]; deliverables?: string[]; body?: Block[] }>;
  audiences: { label: string; title: string; description: string }[];
  team: { name: string; role: string; credential: string; experience: string; bio: string }[];
  faqs: { q: string; a: string }[];
  articles: Record<string, { title: string; kind: string; excerpt: string; content: Block[] }>;
  global: {
    siteName: string;
    tagline: string;
    legalName: string;
    address: string;
    workingHours: string;
    workingHoursNote: string;
    footerNote: string;
    seo: { metaTitle: string; metaDescription: string };
  };
  homepage: {
    heroBadge: string;
    heroBadgeNote: string;
    heroTitleStart: string;
    heroTitleAccent: string;
    heroTitleEnd: string;
    heroSubtitle: string;
    deadlineTitle: string;
    trustTitle: string;
    trustText: string;
    servicesTitle: string;
    audienceTitle: string;
    processTitle: string;
    processSteps: Item[];
    stats: { value: string; label: string }[];
    whyTitle: string;
    reasons: Item[];
    industriesTitle: string;
    industries: string[];
    teamTitle: string;
    teamSubtitle: string;
    estimateTitle: string;
    estimateText: string;
    estimateBullets: string[];
    blogTitle: string;
    faqTitle: string;
    faqText: string;
    ctaTitle: string;
  };
  about: {
    heroTitle: string;
    heroIntro: string;
    intro: Block[];
    reasonsTitle: string;
    reasons: Item[];
    missionTitle: string;
    mission: string;
    valuesTitle: string;
    values: Item[];
    principlesTitle: string;
    principlesIntro: string;
    principles: Item[];
    principlesOutro: string;
    historyTitle: string;
    history: Block[];
    requestsTitle: string;
    requests: string[];
    registryTitle: string;
    registry: Block[];
    qualityTitle: string;
    quality: Block[];
    seo: { metaTitle: string; metaDescription: string };
  };
  career: {
    heroTitle: string;
    heroIntro: string;
    aboutTitle: string;
    about: Block[];
    faqTitle: string;
    faqs: Item[];
    vacanciesTitle: string;
    vacanciesEmpty: string;
    seo: { metaTitle: string; metaDescription: string };
  };
};
