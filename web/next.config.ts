import path from 'node:path';
import type { NextConfig } from 'next';
import { legacyRedirects } from './legacy-redirects';

const strapi = new URL(process.env.STRAPI_URL || 'http://localhost:1337');
// Public CMS address used in links and <img> (see STRAPI_PUBLIC_URL in .env.example); defaults to STRAPI_URL.
const strapiPublic = new URL(process.env.STRAPI_PUBLIC_URL || strapi.href);

/**
 * PAGES_DEMO=1 builds a static, server-less copy of the site for GitHub Pages (client preview).
 * It is only used by .github/workflows/pages-demo.yml after scripts/prepare-pages-demo.mjs has removed
 * the server-only parts (proxy, API route, server action, ISR). Normal builds are unaffected.
 */
const demo = process.env.PAGES_DEMO === '1';
const basePath = demo ? (process.env.PAGES_BASE_PATH ?? '').replace(/\/$/, '') : '';

const dev = process.env.NODE_ENV !== 'production';
const httpsSite = (process.env.SITE_URL ?? '').startsWith('https://');

/**
 * Content-Security-Policy: the page may only load code, styles, fonts and data from this site; images also from the
 * CMS; frames only from Google Maps (office map). `frame-ancestors 'none'` stops other sites from embedding these
 * pages (clickjacking, content theft). 'unsafe-inline' scripts are needed by Next.js' inline bootstrap without
 * per-request nonces (which would turn every static page dynamic). Dev adds eval + websockets for hot reload.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${[...new Set([strapi.origin, strapiPublic.origin])].join(' ')}`,
  "font-src 'self' data:",
  `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
  'frame-src https://www.google.com https://maps.google.com',
  // The hero video is uploaded to the CMS.
  `media-src 'self' ${[...new Set([strapi.origin, strapiPublic.origin])].join(' ')}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  ...(httpsSite && !dev ? ['upgrade-insecure-requests'] : []),
].join('; ');

/**
 * Sent with every page (not in the static Pages demo, which can't set headers). See docs/SECURITY.md.
 * `tdm-reservation` opts the content out of text-and-data mining (W3C TDMRep).
 */
const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'tdm-reservation', value: '1' },
  // HTTPS only from now on (1 year). Only for the real https site, never on localhost or http staging.
  ...(httpsSite && !dev ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Do not let `next dev` (re)create AGENTS.md — project guidance lives in ../CLAUDE.md
  agentRules: false,
  // VPS/Docker: a self-contained server in .next/standalone. Pages demo: plain static files in out/.
  output: demo ? 'export' : 'standalone',
  ...(demo ? { basePath, trailingSlash: true } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Old bp-audit.com.ua (Joomla) URLs → new pages. Static export can't redirect, so the demo skips them.
  ...(demo ? {} : { redirects: async () => legacyRedirects, headers: async () => [{ source: '/:path*', headers: SECURITY_HEADERS }] }),
  // Fonts read from disk by the Open Graph image routes must ship with the standalone build.
  // The project root is this web/ folder, always. Without it Next.js guesses the root from lockfiles and, when another
  // package-lock.json sits higher up (e.g. C:\Users\<name>\package-lock.json on Windows), takes that folder instead:
  // the dev server then watches the whole tree, cms/ included, and every database write of a running Strapi
  // (cms/.tmp/data.db, cms/dist) makes it rebuild and reload the open pages again and again.
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
  outputFileTracingIncludes: { '/**': ['./src/assets/fonts/**'] },
  images: {
    // Static hosting has no image optimizer.
    unoptimized: demo,
    // Next 16 refuses to optimise images from private IPs. Strapi usually runs on the same server
    // (STRAPI_URL=http://127.0.0.1:1337), so allow it — only for that host, see remotePatterns below.
    dangerouslyAllowLocalIP: /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(strapi.hostname),
    remotePatterns: [strapi, strapiPublic].map((u) => ({
      protocol: u.protocol.replace(':', '') as 'http' | 'https',
      hostname: u.hostname,
      port: u.port,
      pathname: '/uploads/**',
    })),
  },
};

export default nextConfig;
