import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const ogSize = { width: 1200, height: 630 };

async function fonts() {
  const dir = join(process.cwd(), 'src/assets/fonts');
  const load = (f: string) => readFile(join(dir, f));
  const [l4, l6, le4, le6, c4, c6] = await Promise.all([
    load('onest-latin-400-normal.woff'), load('onest-latin-600-normal.woff'),
    load('onest-latin-ext-400-normal.woff'), load('onest-latin-ext-600-normal.woff'),
    load('onest-cyrillic-400-normal.woff'), load('onest-cyrillic-600-normal.woff'),
  ]);
  return [
    { name: 'Onest', data: l4, weight: 400 as const, style: 'normal' as const },
    { name: 'Onest', data: l6, weight: 600 as const, style: 'normal' as const },
    { name: 'OnestExt', data: le4, weight: 400 as const, style: 'normal' as const },
    { name: 'OnestExt', data: le6, weight: 600 as const, style: 'normal' as const },
    { name: 'OnestCyr', data: c4, weight: 400 as const, style: 'normal' as const },
    { name: 'OnestCyr', data: c6, weight: 600 as const, style: 'normal' as const },
  ];
}

/** Branded 1200×630 social preview: site name, page title and a short line. */
export async function renderOg({ site, title, subtitle, tag }: { site: string; title: string; subtitle?: string | null; tag?: string | null }) {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#F4F5F7', padding: 64, fontFamily: 'Onest, OnestCyr, OnestExt' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#0B1220', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600 }}>
            {site.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, color: '#0B1220' }}>{site}</div>
          {tag && <div style={{ marginLeft: 'auto', background: '#D7F75B', color: '#0B1220', borderRadius: 999, padding: '8px 20px', fontSize: 24, fontWeight: 600 }}>{tag}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: title.length > 60 ? 56 : 68, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2, color: '#0B1220' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 28, lineHeight: 1.4, color: '#4A5363', maxWidth: 1000 }}>{subtitle.length > 160 ? `${subtitle.slice(0, 157)}…` : subtitle}</div>}
        </div>
        <div style={{ display: 'flex', height: 12, borderRadius: 999, background: '#2346FF', width: 200 }} />
      </div>
    ),
    { ...ogSize, fonts: await fonts() },
  );
}
