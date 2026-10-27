import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { CACHE_TAG } from '@/lib/strapi';

/**
 * Called by Strapi (cms/src/index.ts) after every content change.
 * Expires the cached CMS data for all pages, so admin edits appear on the site within seconds.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidateTag(CACHE_TAG, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: CACHE_TAG, at: new Date().toISOString() });
}
