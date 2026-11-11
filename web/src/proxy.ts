import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, isLocale, LOCALE_COOKIE, locales, type Locale } from '@/i18n/config';
import { shouldBlockBot } from '@/lib/bots';
import { resolveProtection } from '@/lib/protection';
import { clientIp } from '@/lib/rate-limit';
import { getGlobal } from '@/lib/strapi';

/**
 * «Захист контенту → Без ботів ШІ» (Strapi), re-read at most every 5 minutes. CMS unreachable = blocking stays on.
 * BLOCK_BOTS=false (web env) switches the hard block off regardless of the CMS.
 */
let botSetting: { at: number; on: boolean } | null = null;
async function botBlockingOn(): Promise<boolean> {
  if (process.env.BLOCK_BOTS === 'false') return false;
  if (botSetting && Date.now() - botSetting.at < 5 * 60_000) return botSetting.on;
  const on = resolveProtection(await getGlobal('uk').catch(() => null)).blockAiCrawlers;
  botSetting = { at: Date.now(), on };
  return on;
}

/** For tests: forget the cached CMS setting. */
export function resetBotSetting() {
  botSetting = null;
}

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

/**
 * 1. AI crawlers, scraping tools and clients without a User-Agent get 403 (see lib/bots.ts).
 * 2. Every page lives under /{locale}/…; requests without a locale prefix are redirected.
 */
export async function proxy(req: NextRequest) {
  const bot = shouldBlockBot({ method: req.method, userAgent: req.headers.get('user-agent'), ip: clientIp(req.headers) });
  if (bot && (await botBlockingOn())) {
    return new NextResponse('403 Forbidden: automated copying of this website is not allowed. / Автоматизоване копіювання сайту заборонено.\n', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
    });
  }
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
