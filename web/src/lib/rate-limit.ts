/**
 * Small in-memory sliding-window rate limiter (one Node process, as on the VPS). Used for the lead form so one
 * address can't flood the CMS and the company mailbox. nginx limits requests in front of it as well
 * (scripts/nginx/*.conf); this layer still works if the site runs without that config.
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, number[]>();

  return {
    /** Records a hit for `key`; returns false when the key is over the limit (the hit is not recorded then). */
    hit(key: string, now = Date.now()): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.delete(key); // re-insert so the Map stays ordered by last use
      hits.set(key, recent);
      // Bounded memory: drop the least recently used keys.
      while (hits.size > maxKeys) hits.delete(hits.keys().next().value as string);
      return true;
    },
    size: () => hits.size,
  };
}

type HeaderGetter = { get(name: string): string | null };

/**
 * The visitor's IP behind our nginx. nginx sets X-Real-IP to the connecting address; without it the LAST
 * X-Forwarded-For entry is the one our proxy appended (earlier entries can be forged by the client).
 */
export function clientIp(h: HeaderGetter): string {
  const real = h.get('x-real-ip')?.trim();
  if (real) return real;
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts.at(-1)!;
  }
  return 'unknown';
}

/** Lead form: 5 submissions per address per 10 minutes, at most 200 per hour from all addresses together. */
export const leadLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });
export const leadGlobalLimiter = createRateLimiter({ limit: 200, windowMs: 60 * 60_000 });
