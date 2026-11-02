import type { ContentProtection, Global } from './strapi';

/** Everything on: used when Strapi has no «Захист контенту» block yet (older databases, CMS unreachable). */
const DEFAULTS: ContentProtection = {
  enabled: true,
  blockCopy: true,
  blockContextMenu: true,
  blockImageSaving: true,
  blockPrint: true,
  blockShortcuts: true,
  blockAiCrawlers: true,
  allowContactCopy: true,
};

/** Effective protection settings: CMS values over the defaults; `enabled: false` switches every blocker off. */
export function resolveProtection(g: Global | null | undefined): ContentProtection {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(g?.protection ?? {}).filter(([, v]) => typeof v === 'boolean')) };
  if (!p.enabled) return { ...p, blockCopy: false, blockContextMenu: false, blockImageSaving: false, blockPrint: false, blockShortcuts: false, blockAiCrawlers: false };
  return p;
}

/**
 * Tokens for `<html data-protect="…">`; globals.css keys its rules off them, so selection, image dragging and
 * printing are blocked by CSS from the first paint, before any JavaScript runs.
 */
export function protectionTokens(p: ContentProtection) {
  return [
    p.blockCopy && 'copy',
    p.blockContextMenu && 'menu',
    p.blockImageSaving && 'images',
    p.blockPrint && 'print',
    p.blockShortcuts && 'keys',
    p.allowContactCopy && 'contacts',
  ].filter(Boolean).join(' ');
}

/** Crawlers that collect pages for AI training or AI answers (robots.txt user-agents). */
export const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai',
  'Google-Extended', 'GoogleOther', 'Applebot-Extended', 'CCBot', 'PerplexityBot', 'Perplexity-User', 'Bytespider',
  'Amazonbot', 'Meta-ExternalAgent', 'Meta-ExternalFetcher', 'FacebookBot', 'cohere-ai', 'cohere-training-data-crawler',
  'Diffbot', 'ImagesiftBot', 'Omgilibot', 'omgili', 'YouBot', 'AI2Bot', 'Ai2Bot-Dolma', 'DuckAssistBot', 'MistralAI-User',
  'PetalBot', 'Timpibot', 'Scrapy', 'img2dataset', 'Kangaroo Bot', 'webzio-extended', 'TikTokSpider',
];
