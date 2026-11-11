import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { WATERMARK_MAX_SIDE, watermarkImage, watermarkSvg } from '@/lib/watermark';

const scan = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#ffffff' } }).png().toBuffer();

describe('watermarkSvg', () => {
  it('covers the whole picture with repeated text', () => {
    const svg = watermarkSvg(800, 1100, 'bp-audit.com.ua');
    expect(svg).toContain('width="800" height="1100"');
    expect(svg.match(/<text /g)!.length).toBeGreaterThan(20);
    expect(svg).toContain('rotate(-30)');
  });
  it('escapes the text', () => {
    expect(watermarkSvg(100, 100, '<a&b>')).toContain('&#60;a&#38;b&#62;');
  });
});

describe('watermarkImage', () => {
  it('returns a smaller JPEG with the watermark drawn on it', async () => {
    const out = await watermarkImage(await scan(2400, 3200), 'bp-audit.com.ua');
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('jpeg');
    expect(Math.max(meta.width!, meta.height!)).toBe(WATERMARK_MAX_SIDE);
    // A plain white page is no longer plain white.
    const { channels } = await sharp(out).stats();
    expect(channels[0].min).toBeLessThan(240);
  });
  it('keeps small pictures at their size and strips metadata', async () => {
    const out = await watermarkImage(await sharp(await scan(600, 800)).withMetadata({ exif: { IFD0: { Copyright: 'x' } } }).jpeg().toBuffer(), 'site');
    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height]).toEqual([600, 800]);
    expect(meta.exif).toBeUndefined();
  });
  it('rejects files that are not images', async () => {
    await expect(watermarkImage(Buffer.from('%PDF-1.7 not an image'), 'site')).rejects.toThrow();
  });
});
