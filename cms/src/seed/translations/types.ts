/** Shape of one locale's seed translations. Keys match cms/src/seed/data.ts (category keys, service slugs, article slugs). */
export type Step = { title: string; text?: string };

export type LocaleContent = {
  categories: Record<string, { name: string; intro: string }>;
  auditSteps: Step[];
  services: Record<string, { title: string; excerpt: string; badge?: string; tags?: string[]; deliverables?: string[] }>;
  /** Same order as data.audiences */
  audiences: { label: string; title: string; description: string }[];
  /** Same order as data.team */
  team: { name: string; role: string; credential: string; experience: string; bio: string }[];
  /** Same order as data.faqs */
  faqs: { q: string; a: string }[];
  articles: Record<string, { title: string; kind: string; excerpt: string }>;
  articlePlaceholder: string;
  global: {
    siteName: string;
    tagline: string;
    legalName: string;
    address: string;
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
    processSteps: Step[];
    stats: { value: string; label: string }[];
    whyTitle: string;
    reasons: { title: string; text: string }[];
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
};
