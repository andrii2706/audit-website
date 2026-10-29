import type { NextConfig } from 'next';

const strapi = new URL(process.env.STRAPI_URL || 'http://localhost:1337');

/**
 * PAGES_DEMO=1 builds a static, server-less copy of the site for GitHub Pages (client preview).
 * It is only used by .github/workflows/pages-demo.yml after scripts/prepare-pages-demo.mjs has removed
 * the server-only parts (proxy, API route, server action, ISR). Normal builds are unaffected.
 */
const demo = process.env.PAGES_DEMO === '1';
const basePath = demo ? (process.env.PAGES_BASE_PATH ?? '').replace(/\/$/, '') : '';

const nextConfig: NextConfig = {
  // Do not let `next dev` (re)create AGENTS.md — project guidance lives in ../CLAUDE.md
  agentRules: false,
  // VPS/Docker: a self-contained server in .next/standalone. Pages demo: plain static files in out/.
  output: demo ? 'export' : 'standalone',
  ...(demo ? { basePath, trailingSlash: true } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Fonts read from disk by the Open Graph image routes must ship with the standalone build.
  outputFileTracingIncludes: { '/**': ['./src/assets/fonts/**'] },
  images: {
    // Static hosting has no image optimizer.
    unoptimized: demo,
    remotePatterns: [
      {
        protocol: strapi.protocol.replace(':', '') as 'http' | 'https',
        hostname: strapi.hostname,
        port: strapi.port,
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
