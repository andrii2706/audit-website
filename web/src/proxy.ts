import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, isLocale, LOCALE_COOKIE, locales, type Locale } from '@/i18n/config';

/** Picks the best supported locale from the cookie, then the Accept-Language header. */
function detectLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && isLocale(cookie)) return cookie;
  const header = req.headers.get('accept-language') ?? '';
  const prefs = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.toLowerCase().split('-')[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of prefs) {
    if (isLocale(lang)) return lang;
    if (lang === 'ru' || lang === 'be') return 'uk';
  }
  // Visitors whose browser asks for some other language get the English version.
  return prefs.some((p) => p.lang && p.lang !== '*') ? 'en' : defaultLocale;
}

/** Every page lives under /{locale}/…; requests without a locale prefix are redirected. */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;
  const url = req.nextUrl.clone();
  url.pathname = `/${detectLocale(req)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Skip API routes, Next internals, metadata files and anything with a file extension.
  matcher: ['/((?!api|_next|.*\\..*|sitemap.xml|robots.txt|manifest.webmanifest|icon|apple-icon|opengraph-image).*)'],
};
