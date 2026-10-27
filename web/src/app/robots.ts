import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/** Set NO_INDEX=true on staging so search engines don't index it. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.NO_INDEX === 'true') return { rules: [{ userAgent: '*', disallow: '/' }] };
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }], sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
