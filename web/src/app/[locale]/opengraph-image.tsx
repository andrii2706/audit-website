import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { ogSize, renderOg } from '@/lib/og';
import { getGlobal, getHomepage } from '@/lib/strapi';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Audit Consultant';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'uk';
  const [d, g, h] = await Promise.all([getDictionary(locale), getGlobal(locale), getHomepage(locale)]);
  const title = h ? [h.heroTitleStart, h.heroTitleAccent, h.heroTitleEnd].filter(Boolean).join(' ') : d.meta.defaultTitle;
  return renderOg({ site: g?.siteName ?? d.meta.siteName, title, subtitle: h?.heroSubtitle, tag: h?.heroBadge });
}
