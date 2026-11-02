import type { MetadataRoute } from 'next';
import { AI_CRAWLERS, resolveProtection } from '@/lib/protection';
import { SITE_URL } from '@/lib/seo';
import { getGlobal } from '@/lib/strapi';

export const revalidate = 3600;

/**
 * Set NO_INDEX=true on staging so search engines don't index it. With «Захист контенту → blockAiCrawlers» (Strapi)
 * the AI-training and AI-answer crawlers are shut out completely; ordinary search engines keep access.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (process.env.NO_INDEX === 'true') return { rules: [{ userAgent: '*', disallow: '/' }] };
  const protection = resolveProtection(await getGlobal('uk').catch(() => null));
  const rules: MetadataRoute.Robots['rules'] = [{ userAgent: '*', allow: '/', disallow: ['/api/'] }];
  if (protection.blockAiCrawlers) rules.push({ userAgent: AI_CRAWLERS, disallow: '/' });
  return { rules, sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
