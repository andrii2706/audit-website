import sharp from 'sharp';

/**
 * Visible watermark for scans of certificates and recommendation letters (About page): the picture a visitor sees,
 * opens or saves always carries the site's name, so a copy can't be passed off as someone else's document.
 * The originals stay in the CMS media library; the site only links to the watermarked version
 * (src/app/api/document/[id]/route.ts).
 */

/** Longest side of the served picture: readable on screen, not a print-quality original. */
export const WATERMARK_MAX_SIDE = 1600;

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * SVG overlay of the same size as the picture: the text repeated in diagonal rows across the whole image
 * (cropping one corner doesn't remove it). Latin text in DejaVu/Liberation/sans-serif, so it renders with the
 * fonts any Linux server has (setup.sh installs fonts-dejavu-core).
 */
export function watermarkSvg(width: number, height: number, text: string) {
  const size = Math.max(14, Math.round(Math.min(width, height) / 22));
  const stepX = Math.round(size * text.length * 0.62 + size * 3);
  const stepY = Math.round(size * 4.2);
  const diag = Math.ceil(Math.hypot(width, height));
  const rows: string[] = [];
  let i = 0;
  for (let y = -diag; y < diag; y += stepY, i += 1) {
    const offset = (i % 2) * (stepX / 2);
    for (let x = -diag + offset; x < diag; x += stepX) {
      rows.push(`<text x="${Math.round(x)}" y="${y}">${escapeXml(text)}</text>`);
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<g transform="translate(${width / 2} ${height / 2}) rotate(-30)" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" ` +
    `font-size="${size}" font-weight="700" fill="#1d2b4f" fill-opacity="0.16" stroke="#ffffff" stroke-opacity="0.18" stroke-width="${Math.max(1, size / 16)}">` +
    rows.join('') +
    '</g></svg>'
  );
}

/** Resizes the picture (≤ WATERMARK_MAX_SIDE), stamps the watermark and returns a JPEG without metadata. */
export async function watermarkImage(input: Buffer, text: string): Promise<Buffer> {
  // limitInputPixels guards against "decompression bomb" files; .rotate() applies the EXIF orientation.
  const base = sharp(input, { limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: WATERMARK_MAX_SIDE, height: WATERMARK_MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' });
  const { data, info } = await base.toBuffer({ resolveWithObject: true });
  return sharp(data)
    .composite([{ input: Buffer.from(watermarkSvg(info.width, info.height, text)), top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
