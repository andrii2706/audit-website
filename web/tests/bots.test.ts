import { describe, expect, it } from 'vitest';
import { botKind, isLocalAddress, shouldBlockBot } from '@/lib/bots';

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

describe('botKind', () => {
  it('lets real browsers through', () => {
    expect(botKind(CHROME)).toBeNull();
    expect(botKind('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')).toBeNull();
  });
  it('never blocks search engines and link previews', () => {
    for (const ua of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'TelegramBot (like TwitterBot)',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'WhatsApp/2.23.20.0',
      'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 Chrome-Lighthouse',
    ]) expect(botKind(ua), ua).toBeNull();
  });
  it('recognises AI crawlers', () => {
    expect(botKind('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)')).toBe('ai');
    expect(botKind('Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)')).toBe('ai');
    expect(botKind('CCBot/2.0 (https://commoncrawl.org/faq/)')).toBe('ai');
    expect(botKind('Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)')).toBe('ai');
    expect(botKind('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0)')).toBe('ai');
  });
  it('recognises scraping tools and headless browsers', () => {
    for (const ua of ['python-requests/2.32.3', 'curl/8.5.0', 'Wget/1.21.4', 'Go-http-client/2.0',
      'node-fetch/1.0', 'axios/1.7.2', 'Mozilla/4.5 (compatible; HTTrack 3.0x; Windows 98)', 'Java/17.0.2',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36'])
      expect(botKind(ua), ua).toBe('tool');
    // Scrapy is also on the robots.txt list, so it counts as an AI crawler — blocked either way.
    expect(botKind('Scrapy/2.11 (+https://scrapy.org)')).not.toBeNull();
  });
  it('treats a missing User-Agent as a bot', () => {
    expect(botKind('')).toBe('empty');
    expect(botKind(null)).toBe('empty');
    expect(botKind('   ')).toBe('empty');
  });
});

describe('isLocalAddress', () => {
  it('knows loopback and private networks', () => {
    for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1', '10.1.2.3', '192.168.0.10', '172.16.0.1', '172.31.255.255', 'fd12::1', 'unknown', ''])
      expect(isLocalAddress(ip), ip).toBe(true);
  });
  it('treats public addresses as outside', () => {
    for (const ip of ['203.0.113.7', '8.8.8.8', '172.32.0.1', '2001:db8::1']) expect(isLocalAddress(ip), ip).toBe(false);
  });
});

describe('shouldBlockBot', () => {
  it('blocks bots downloading pages from outside', () => {
    expect(shouldBlockBot({ method: 'GET', userAgent: 'python-requests/2.32', ip: '203.0.113.7' })).toBe('tool');
    expect(shouldBlockBot({ method: 'GET', userAgent: '', ip: '203.0.113.7' })).toBe('empty');
  });
  it('lets HEAD requests, local requests and browsers through', () => {
    expect(shouldBlockBot({ method: 'HEAD', userAgent: 'curl/8.5.0', ip: '203.0.113.7' })).toBeNull();
    expect(shouldBlockBot({ method: 'GET', userAgent: 'curl/8.5.0', ip: '127.0.0.1' })).toBeNull();
    expect(shouldBlockBot({ method: 'GET', userAgent: 'curl/8.5.0', ip: 'unknown' })).toBeNull();
    expect(shouldBlockBot({ method: 'GET', userAgent: CHROME, ip: '203.0.113.7' })).toBeNull();
  });
});
