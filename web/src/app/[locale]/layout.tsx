import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '@fontsource-variable/onest';
import '@fontsource/jetbrains-mono/500.css';
import '../globals.css';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import MobileActionBar from '@/components/MobileActionBar';
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
  return {
    ...base,
    metadataBase: new URL(SITE_URL),
    title: { default: g?.seo?.metaTitle || d.meta.defaultTitle, template: `%s — ${siteName}` },
    applicationName: siteName,
    openGraph: { ...base.openGraph, siteName },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    formatDetection: { telephone: true, email: true, address: true },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
    },
  };
}

export const viewport: Viewport = { themeColor: '#0B1220', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const [dict, global, categories, home] = await Promise.all([getDictionary(locale), getGlobal(locale), getCategories(locale), getHomepage(locale)]);

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (Grammarly, password managers) inject attributes into <body> before React hydrates. Affects only this element’s own attributes. */}
      <body className="min-h-dvh" suppressHydrationWarning>
        {/* Marks that JS runs (used to fade images in over their skeleton without hiding them for no-JS visitors). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <NavProgress label={dict.common.loading} />
        <a href="#main" className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          {dict.nav.skip}
        </a>
        <Header locale={locale} dict={dict} global={global} />
        <main id="main">{children}</main>
        <Footer locale={locale} dict={dict} global={global} categories={categories} ctaTitle={home?.ctaTitle} />
        <MobileActionBar locale={locale} phone={global?.phone} telegramUrl={global?.telegramUrl} labels={{ call: dict.nav.call, consultation: dict.nav.consultation }} />
        <JsonLd data={organizationLd(locale, global)} />
        <JsonLd data={websiteLd(locale, global?.siteName ?? dict.meta.siteName)} />
      </body>
    </html>
  );
}
