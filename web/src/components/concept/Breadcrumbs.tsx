import Link from 'next/link';
import { JsonLd } from '@/components/bits';
import type { Locale } from '@/i18n/config';
import { crumbHref, trailLd, type Crumb } from '@/lib/breadcrumbs';
import './breadcrumbs.css';

/**
 * Visible breadcrumbs and their schema.org data from one trail (lib/breadcrumbs.ts), so the two never differ.
 * Every crumb but the last is a link; the last one is the current page (aria-current) and is cut with "…" on phones.
 */
export default function Breadcrumbs({ locale, crumbs, label }: { locale: Locale; crumbs: Crumb[]; label: string }) {
  if (crumbs.length < 2) return null;
  return (
    <>
      <nav className="crumbs" aria-label={label}>
        <ol>
          {crumbs.map((c, i) =>
            i < crumbs.length - 1 ? (
              <li key={`${c.path}-${i}`}>
                <Link href={crumbHref(locale, c)}>{c.name}</Link>
              </li>
            ) : (
              <li key={`${c.path}-${i}`} aria-current="page" title={c.name}>
                {c.name}
              </li>
            ),
          )}
        </ol>
      </nav>
      <JsonLd data={trailLd(locale, crumbs)} />
    </>
  );
}
