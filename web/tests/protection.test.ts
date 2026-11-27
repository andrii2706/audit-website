import { describe, expect, it } from 'vitest';
import { AI_CRAWLERS, protectionTokens, resolveProtection } from '@/lib/protection';
import type { Global } from '@/lib/strapi';

describe('content protection settings', () => {
  it('is fully on when the CMS has no settings yet', () => {
    const p = resolveProtection(null);
    expect(protectionTokens(p)).toBe('copy menu images print keys contacts');
    expect(p.blockAiCrawlers).toBe(true);
  });
  it('applies single switches from the CMS', () => {
    const p = resolveProtection({ protection: { blockPrint: false, blockCopy: false } } as Global);
    expect(protectionTokens(p)).toBe('menu images keys contacts');
  });
  it('turns every blocker off with the main switch', () => {
    const p = resolveProtection({ protection: { enabled: false } } as Global);
    expect(protectionTokens(p)).toBe('contacts');
    expect(p.blockAiCrawlers).toBe(false);
  });
  it('ignores non-boolean values', () => {
    expect(resolveProtection({ protection: { blockCopy: 'no' as unknown as boolean } } as Global).blockCopy).toBe(true);
  });
  it('lists the main AI crawlers without duplicates', () => {
    expect(AI_CRAWLERS).toEqual(expect.arrayContaining(['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'PerplexityBot']));
    expect(new Set(AI_CRAWLERS).size).toBe(AI_CRAWLERS.length);
  });
});
