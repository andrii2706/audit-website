import { describe, expect, it } from 'vitest';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

const headers = (h: Record<string, string>) => ({ get: (k: string) => h[k.toLowerCase()] ?? null });

describe('createRateLimiter', () => {
  it('allows `limit` hits per window, then blocks until the window moves on', () => {
    const l = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect([l.hit('a', 0), l.hit('a', 100), l.hit('a', 200), l.hit('a', 300)]).toEqual([true, true, true, false]);
    expect(l.hit('b', 300)).toBe(true); // other keys are independent
    expect(l.hit('a', 1001)).toBe(true); // the first hit has left the window
  });
  it('does not count blocked attempts', () => {
    const l = createRateLimiter({ limit: 1, windowMs: 1000 });
    l.hit('a', 0);
    for (let t = 1; t < 900; t += 100) expect(l.hit('a', t)).toBe(false);
    expect(l.hit('a', 1000)).toBe(true);
  });
  it('keeps memory bounded', () => {
    const l = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 100 });
    for (let i = 0; i < 1000; i++) l.hit(`ip-${i}`, 0);
    expect(l.size()).toBe(100);
  });
});

describe('clientIp', () => {
  it('prefers X-Real-IP set by nginx', () => {
    expect(clientIp(headers({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1, 203.0.113.7' }))).toBe('203.0.113.7');
  });
  it('uses the last X-Forwarded-For entry (the one our proxy added), not a forged first one', () => {
    expect(clientIp(headers({ 'x-forwarded-for': '6.6.6.6, 198.51.100.4' }))).toBe('198.51.100.4');
  });
  it('falls back to "unknown"', () => expect(clientIp(headers({}))).toBe('unknown'));
});
