import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { ogSize, renderOg } from '@/lib/og';
import { getGlobal, getServiceBySlug } from '@/lib/strapi';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Audit Consultant — service';

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : 'uk';
  const [d, g, s] = await Promise.all([getDictionary(locale), getGlobal(locale), getServiceBySlug(locale, slug)]);
  return renderOg({ site: g?.siteName ?? d.meta.siteName, title: s?.title ?? d.meta.defaultTitle, subtitle: s?.excerpt, tag: s?.category?.name ?? s?.badge });
}
