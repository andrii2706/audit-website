import { AI_CRAWLERS } from './protection';

/**
 * Recognises automated clients by their User-Agent, so the site can refuse to serve them (robots.txt is only a
 * request; this is a hard 403). Used by src/proxy.ts. Search engines and link previews are always allowed.
 *
 * - `ai`    — crawlers that collect pages for AI training / AI answers (same list as robots.txt);
 * - `tool`  — scraping libraries, site downloaders, headless browsers, vulnerability scanners;
 * - `empty` — no User-Agent at all (real browsers always send one).
 *
 * A determined scraper can fake a browser User-Agent; this stops the ready-made tools and the honest bots,
 * the rate limits in nginx slow down the rest. See docs/SECURITY.md → "Content".
 */
export type BotKind = 'ai' | 'tool' | 'empty';

/** Search engines, link previews (messengers, social networks), Google/Bing site tools: never blocked. */
const ALLOWED = [
  'Googlebot', 'Google-InspectionTool', 'Storebot-Google', 'AdsBot-Google', 'Mediapartners-Google', 'Google-Site-Verification',
  'Chrome-Lighthouse', 'bingbot', 'BingPreview', 'msnbot', 'DuckDuckBot', 'YandexBot', 'Applebot/',
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot', 'TelegramBot', 'WhatsApp', 'Viber', 'Slackbot',
  'Slack-ImgProxy', 'Discordbot', 'Pinterestbot', 'SkypeUriPreview', 'redditbot',
];

/** Libraries and programs used to copy websites (their default User-Agents). */
const TOOLS = [
  'python-requests', 'python-urllib', 'python-httpx', 'aiohttp', 'httpx/', 'Scrapy', 'curl/', 'Wget', 'HTTrack',
  'Go-http-client', 'node-fetch', 'axios/', 'undici', 'okhttp', 'Java/', 'Apache-HttpClient', 'libwww-perl', 'LWP::',
  'GuzzleHttp', 'PHP/', 'Mechanize', 'colly', 'HeadlessChrome', 'PhantomJS', 'Puppeteer', 'Playwright', 'Selenium',
  'SiteSucker', 'WebCopier', 'Teleport Pro', 'Offline Explorer', 'WebZIP', 'WebReaper', 'Website Extractor',
  'Zgrab', 'masscan', 'Nikto', 'sqlmap', 'Nuclei', 'WPScan',
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const list = (items: readonly string[]) => new RegExp(items.map(escape).join('|'), 'i');
const ALLOWED_RE = list(ALLOWED);
const AI_RE = list(AI_CRAWLERS);
const TOOLS_RE = list(TOOLS);

/** What kind of automated client a User-Agent belongs to, or `null` for browsers and allowed bots. */
export function botKind(userAgent: string | null | undefined): BotKind | null {
  const ua = (userAgent ?? '').trim();
  if (!ua) return 'empty';
  if (ALLOWED_RE.test(ua)) return null;
  if (AI_RE.test(ua)) return 'ai';
  if (TOOLS_RE.test(ua)) return 'tool';
  return null;
}

/** Requests from the server itself (health checks, deploy scripts) and from the local network are never blocked. */
export function isLocalAddress(ip: string) {
  if (!ip || ip === 'unknown') return true;
  const v4 = ip.replace(/^::ffff:/, '');
  return (
    v4 === '::1' ||
    /^127\./.test(v4) ||
    /^10\./.test(v4) ||
    /^192\.168\./.test(v4) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v4) ||
    /^f[cd][0-9a-f]{2}:/i.test(v4)
  );
}

/**
 * Should this request be refused? Only page downloads (GET) from outside are checked: HEAD stays open for uptime
 * monitors and `curl -I`, and requests that come straight to Next.js (no nginx in front, i.e. local development
 * and the server's own checks) are never blocked.
 */
export function shouldBlockBot({ method, userAgent, ip }: { method: string; userAgent: string | null; ip: string }) {
  if (method !== 'GET') return null;
  if (isLocalAddress(ip)) return null;
  return botKind(userAgent);
}
