import { describe, expect, it } from 'vitest';
import { secretMatches } from '@/lib/secret';

describe('secretMatches', () => {
  it('matches only the exact secret', () => {
    expect(secretMatches('s3cr3t', 's3cr3t')).toBe(true);
    expect(secretMatches('s3cr3', 's3cr3t')).toBe(false);
    expect(secretMatches('S3CR3T', 's3cr3t')).toBe(false);
  });
  it('stays closed when no secret is configured or none is sent', () => {
    expect(secretMatches('', '')).toBe(false);
    expect(secretMatches('anything', undefined)).toBe(false);
    expect(secretMatches(null, 's3cr3t')).toBe(false);
  });
});
