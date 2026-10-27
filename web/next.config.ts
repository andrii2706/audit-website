import type { NextConfig } from 'next';

const strapi = new URL(process.env.STRAPI_URL || 'http://localhost:1337');

const nextConfig: NextConfig = {
  // Do not let `next dev` (re)create AGENTS.md — project guidance lives in ../CLAUDE.md
  agentRules: false,
  // For VPS/Docker: `npm run build` produces a self-contained server in .next/standalone
  output: 'standalone',
  // Fonts read from disk by the Open Graph image routes must ship with the standalone build.
  outputFileTracingIncludes: { '/**': ['./src/assets/fonts/**'] },
  images: {
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
