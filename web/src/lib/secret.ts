import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time comparison of a provided secret with the expected one (both hashed first, so lengths always match).
 * An empty expected secret never matches: the protected endpoint stays closed until it is configured.
 */
export function secretMatches(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (!expected || !provided) return false;
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
