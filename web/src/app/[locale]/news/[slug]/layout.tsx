import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { slugExists } from '@/lib/strapi';

/**
 * Validates the slug BEFORE the page's loading.tsx boundary starts streaming,
 * so unknown URLs return a real HTTP 404 (not a "soft 404" with status 200).
 */
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !(await slugExists('news-items', locale, slug))) notFound();
  return children;
}
