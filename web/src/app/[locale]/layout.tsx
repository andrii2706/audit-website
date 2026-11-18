import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '@fontsource-variable/onest';
import '@fontsource/jetbrains-mono/500.css';
import '../globals.css';
import '../concept.css';
import SiteFooter from '@/components/concept/SiteFooter';
import SiteHeader from '@/components/concept/SiteHeader';
import PaletteSwitcher, { PaletteBoot } from '@/components/concept/PaletteSwitcher';
import ScrollToTop from '@/components/ScrollToTop';
import ContentProtection from '@/components/ContentProtection';
import { protectionTokens, resolveProtection } from '@/lib/protection';
import NavProgress from '@/components/NavProgress';
import { JsonLd } from '@/components/bits';
import { isLocale, locales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { buildMetadata, organizationLd, SITE_URL, websiteLd } from '@/lib/seo';
import { getCategories, getGlobal, getHomepage } from '@/lib/strapi';

export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [g, d] = await Promise.all([getGlobal(locale), getDictionary(locale)]);
  const siteName = g?.siteName ?? d.meta.siteName;
  const base = buildMetadata({
    locale,
    path: '',
    title: g?.seo?.metaTitle || d.meta.defaultTitle,
    description: g?.seo?.metaDescription || d.meta.defaultDescription,
    absoluteTitle: true,
  });
  // No canonical/hreflang here: every page sets its own, and the 404 page must not inherit the home page's.
  const { alternates: _alternates, ...shared } = base;
  void _alternates;
  return {
    ...shared,
    metadataBase: new URL(SITE_URL),
    title: { default: g?.seo?.metaTitle || d.meta.defaultTitle, template: `%s — ${siteName}` },
    applicationName: siteName,
    openGraph: { ...base.openGraph, siteName },
    // Only preview directives: index/follow is the default, and setting it here would contradict the 404 page's noindex.
    robots: { googleBot: { 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    formatDetection: { telephone: true, email: true, address: true },
    // AI-training opt-out (read by DeviantArt-style "noai" crawlers) and the W3C TDM reservation.
    other: resolveProtection(g).blockAiCrawlers ? { robots: 'noai, noimageai', 'tdm-reservation': '1' } : undefined,
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
    },
  };
}

/** Palette of the site: B (graphite, default) or C (warm). NEXT_PUBLIC_PALETTE_SWITCHER=0 hides the demo switcher. */
const PALETTE = process.env.NEXT_PUBLIC_PALETTE === 'c' ? 'c' : 'b';
const SHOW_SWITCHER = process.env.NEXT_PUBLIC_PALETTE_SWITCHER !== '0';

export const viewport: Viewport = { themeColor: '#1c2128', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const [dict, global, categories, home] = await Promise.all([getDictionary(locale), getGlobal(locale), getCategories(locale), getHomepage(locale)]);

  const protection = resolveProtection(global);
  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      data-palette={PALETTE}
      data-protect={protectionTokens(protection) || undefined}
      style={protection.blockPrint ? ({ '--print-note': JSON.stringify(dict.common.printBlocked) } as React.CSSProperties) : undefined}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: browser extensions (Grammarly, password managers) inject attributes into <body> before React hydrates. Affects only this element’s own attributes. */}
      <body className="min-h-dvh" suppressHydrationWarning>
        {/* Images fade in over their skeleton (FadeImage). Without JavaScript nothing would reveal them, so show them right away. */}
        <noscript>
          <style>{'img[data-fade]{opacity:1!important}'}</style>
        </noscript>
        {/* The visitor's palette choice from the demo switcher, applied before the first paint. */}
        {SHOW_SWITCHER && <PaletteBoot />}
        <NavProgress label={dict.common.loading} />
        <a href="#main" className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          {dict.nav.skip}
        </a>
        <SiteHeader locale={locale} dict={dict} global={global} />
        <main id="main" tabIndex={-1} className="outline-none">{children}</main>
        <SiteFooter locale={locale} dict={dict} global={global} categories={categories} ctaTitle={home?.ctaTitle} />
        {SHOW_SWITCHER && <PaletteSwitcher labels={{ palette: dict.concept.palette, b: dict.concept.paletteB, c: dict.concept.paletteC }} />}
        <ScrollToTop label={dict.common.toTop} />
        {protection.enabled && (
          <ContentProtection copy={protection.blockCopy} menu={protection.blockContextMenu} images={protection.blockImageSaving} keys={protection.blockShortcuts} contacts={protection.allowContactCopy} sourceLabel={dict.common.copySource} />
        )}
        <JsonLd data={organizationLd(locale, global)} />
        <JsonLd data={websiteLd(locale, global?.siteName ?? dict.meta.siteName)} />
      </body>
    </html>
  );
}
