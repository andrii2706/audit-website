import { NextResponse, type NextRequest } from 'next/server';
import { resolveProtection } from '@/lib/protection';
import { SITE_URL } from '@/lib/seo';
import { getDocumentImages, getGlobal, mediaUrl, uploadSourceUrl } from '@/lib/strapi';
import { watermarkImage } from '@/lib/watermark';

/**
 * GET /api/document/{documentId} — a certificate / recommendation scan with the site's watermark (lib/watermark.ts).
 * Only published document images are served; the source is always this CMS's /uploads/ (no other hosts).
 * Results are kept in memory, so each scan is processed once per server start (and again after it is replaced).
 */
const cache = new Map<string, Buffer>();
const CACHE_MAX = 60;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

const notFound = () => new NextResponse('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return notFound();
  const doc = (await getDocumentImages('uk')).find((d) => d.documentId === id);
  if (!doc?.image || (doc.image.mime && !doc.image.mime.startsWith('image/'))) return notFound();

  // Watermark switched off in the CMS: send visitors to the original file.
  if (!resolveProtection(await getGlobal('uk').catch(() => null)).watermarkDocuments) {
    const original = mediaUrl(doc.image);
    return original ? NextResponse.redirect(original, 307) : notFound();
  }

  const key = `${id}|${doc.image.url}`;
  let body = cache.get(key);
  if (!body) {
    const src = uploadSourceUrl(doc.image);
    if (!src) return notFound();
    const res = await fetch(src, { cache: 'no-store' }).catch(() => null);
    if (!res?.ok || Number(res.headers.get('content-length') ?? 0) > MAX_SOURCE_BYTES) return notFound();
    const input = Buffer.from(await res.arrayBuffer());
    if (input.byteLength > MAX_SOURCE_BYTES) return notFound();
    try {
      body = await watermarkImage(input, new URL(SITE_URL).host.replace(/^www\./, ''));
    } catch (err) {
      console.error(`[document] ${id}: ${(err as Error).message}`);
      return notFound();
    }
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
    cache.set(key, body);
  }
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'content-type': 'image/jpeg',
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
      'content-disposition': `inline; filename="${id}.jpg"`,
      'x-robots-tag': 'noimageai',
    },
  });
}
