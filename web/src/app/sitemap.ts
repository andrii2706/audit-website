import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { languageAlternates, pageUrl } from '@/lib/seo';
import { getAllServices, getArticles, getNews } from '@/lib/strapi';

export const revalidate = 3600;

/** One entry per page and language, each listing all its language versions (hreflang). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, posts, news] = await Promise.all([getAllServices('uk'), getArticles('uk'), getNews('uk', 500)]);
  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency']; lastModified?: string }[] = [
    { path: '', priority: 1, freq: 'weekly' },
    { path: '/services', priority: 0.9, freq: 'weekly' },
    { path: '/audiences', priority: 0.7, freq: 'monthly' },
    { path: '/about', priority: 0.6, freq: 'monthly' },
    { path: '/team', priority: 0.6, freq: 'monthly' },
    { path: '/career', priority: 0.5, freq: 'weekly' },
    { path: '/reports', priority: 0.5, freq: 'yearly' },
    { path: '/news', priority: 0.7, freq: 'daily' },
    { path: '/blog', priority: 0.6, freq: 'weekly' },
    { path: '/contacts', priority: 0.7, freq: 'yearly' },
    ...services.map((s) => ({ path: `/services/${s.slug}`, priority: 0.8, freq: 'monthly' as const, lastModified: s.updatedAt })),
    ...news.map((n) => ({ path: `/news/${n.slug}`, priority: 0.6, freq: 'monthly' as const, lastModified: n.updatedAt ?? n.date })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, priority: 0.5, freq: 'monthly' as const, lastModified: p.updatedAt ?? p.publishedAt })),
  ];
  return pages.flatMap((p) =>
    locales.map((locale) => ({
      url: pageUrl(locale, p.path),
      lastModified: p.lastModified,
      changeFrequency: p.freq,
      priority: p.priority,
      alternates: { languages: languageAlternates(p.path) },
    })),
  );
}
