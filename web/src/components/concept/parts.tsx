import Link from 'next/link';
import type { ReactNode } from 'react';
import Blocks from '@/components/Blocks';
import FadeImage from '@/components/FadeImage';
import type { Locale } from '@/i18n/config';
import { cx, formatPhone, initials, telHref } from '@/lib/format';
import { mediaUrl, type Blocks as BlocksData, type Global, type Service, type TeamMember } from '@/lib/strapi';
import type { Crumb } from '@/lib/breadcrumbs';
import Breadcrumbs from './Breadcrumbs';
import Glyph from './Glyph';

/** Building blocks of the editorial design (concept.css). Server-safe: no hooks. */

export const num = (i: number) => String(i + 1).padStart(2, '0');

export const Arrow = () => (
  <svg className="arr" width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M0 6h18M13 1l5 5-5 5" />
  </svg>
);

export const UpRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 12 12 4M5.5 4H12v6.5" />
  </svg>
);

export const ShieldMark = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />
    <path d="m8.8 12 2.2 2.2 4.3-4.4" />
  </svg>
);

export const QuoteMark = () => (
  <svg width="56" height="44" viewBox="0 0 56 44" style={{ fill: 'var(--lime)' }} aria-hidden="true">
    <path d="M0 44V26C0 11 7 2 21 0l2 6C14 9 11 15 11 22h10v22H0Zm33 0V26C33 11 40 2 54 0l2 6c-9 3-12 9-12 16h10v22H33Z" />
  </svg>
);

export const Tick = () => <span className="tick" aria-hidden="true" />;

/** Hairline section label with a small square: "■ Послуги". */
export function Label({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className={cx('label', dark && 'label-dark')}>
      <i aria-hidden="true" />
      {children}
    </div>
  );
}

/** Rich text from Strapi in the editorial typography. */
export function Prose({ content, className }: { content?: BlocksData; className?: string }) {
  if (!content?.length) return null;
  return (
    <div className={cx('prose', className)}>
      <Blocks content={content} bare />
    </div>
  );
}

/** Page head of inner pages: breadcrumbs (with their schema.org data), a large light title, the intro and extra content. */
export function PageHead({
  locale,
  crumbs,
  crumbsLabel,
  title,
  intro,
  children,
}: {
  locale: Locale;
  /** The trail from lib/breadcrumbs.ts: `trail(dict, 'team')`. */
  crumbs: Crumb[];
  crumbsLabel: string;
  title: string;
  intro?: string | null;
  children?: ReactNode;
}) {
  return (
    <header className="pagehead">
      <div className="wrap">
        <Breadcrumbs locale={locale} crumbs={crumbs} label={crumbsLabel} />
        <h1 className="display pagehead-t">{title}</h1>
        {intro && <p className="lead muted">{intro}</p>}
        {children}
      </div>
    </header>
  );
}

/** Service tile: number, badge, glyph, title (+ excerpt on list pages); dark on hover. */
export function SvcCard({ locale, s, i, withExcerpt = false }: { locale: Locale; s: Pick<Service, 'slug' | 'title' | 'excerpt' | 'badge'>; i: number; withExcerpt?: boolean }) {
  return (
    <li>
      <Link className={cx('svc', withExcerpt && 'svc-row')} href={`/${locale}/services/${s.slug}`}>
        <div className="row-between">
          <span className="mono muted svc-n">( {num(i)} )</span>
          {s.badge && <span className="badge badge-lime">{s.badge}</span>}
        </div>
        <Glyph i={i} className="svc-glyph" />
        <div className="svc-foot">
          {withExcerpt ? (
            <div>
              <h3>{s.title}</h3>
              {s.excerpt && <p className="muted svc-ex">{s.excerpt}</p>}
            </div>
          ) : (
            <h3>{s.title}</h3>
          )}
          <Arrow />
        </div>
      </Link>
    </li>
  );
}

/** Article / news card: a dark cover (photo when the CMS has one, otherwise a glyph), meta line, title, excerpt. */
export function PostCard({ href, i, kicker, meta, title, excerpt, cover }: { href: string; i: number; kicker?: string | null; meta: string; title: string; excerpt?: string | null; cover?: string | null }) {
  return (
    <li>
      <Link className="post" href={href}>
        <div className={cx('post-cover', cover && 'skeleton')}>
          {cover ? <FadeImage src={cover} alt="" fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" /> : <Glyph i={i + 2} className="post-glyph" />}
          {kicker && <span className="mono">{kicker}</span>}
        </div>
        <div className="post-body">
          <span className="mono muted">{meta}</span>
          <h3>{title}</h3>
          {excerpt && <p className="muted">{excerpt}</p>}
        </div>
      </Link>
    </li>
  );
}

/** Team member: photo from the CMS (initials over a glyph until there is one), name, role; full cards add credentials and a bio. */
export function PersonCard({ m, i, full = false, labels }: { m: TeamMember; i: number; full?: boolean; labels: { bio: string; qualification: string } }) {
  const photo = mediaUrl(m.photo ?? null);
  return (
    <li className={cx('person', full && 'person-full')}>
      <div className={cx('avatar', photo && 'skeleton')}>
        {photo ? (
          <FadeImage src={photo} alt={m.name} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover object-[50%_25%]" />
        ) : (
          <>
            <Glyph i={i + 2} className="avatar-glyph" />
            <span className="display" aria-hidden="true">{initials(m.name)}</span>
          </>
        )}
      </div>
      <div className="person-body">
        <h3>{m.name}</h3>
        {m.role && <p className="muted">{m.role}</p>}
        {full && m.credential && (
          <p className="cred mono">
            <span className="sr-only">{labels.qualification}: </span>
            {m.credential}
          </p>
        )}
        {full && m.experience && <p className="exp">{m.experience}</p>}
        {full && m.bio && (
          <details className="bio">
            <summary>
              {labels.bio}
              <span aria-hidden="true" className="plus" />
            </summary>
            <p className="muted">{m.bio}</p>
          </details>
        )}
      </div>
    </li>
  );
}

/** Accordion on native <details> (works without JavaScript and with the keyboard). */
export function FaqList({ items }: { items: { id: string; question: string; answer?: string | null }[] }) {
  return (
    <div className="faq-list">
      {items.map((f) => (
        <details key={f.id}>
          <summary>
            {f.question}
            <span aria-hidden="true" className="plus" />
          </summary>
          {f.answer && <p className="muted">{f.answer}</p>}
        </details>
      ))}
    </div>
  );
}

/** Phone numbers as call links, one per line. */
export function Phones({ g }: { g: Global | null }) {
  const phones = [g?.phone, g?.phoneSecondary].filter((p): p is string => !!p);
  return (
    <>
      {phones.map((p, k) => (
        <span key={p}>
          {k > 0 && <br />}
          <a href={telHref(p)}>{formatPhone(p)}</a>
        </span>
      ))}
    </>
  );
}

type MapLabels = { title: string; heading: string; office: string; phone: string; email: string; hours: string; open: string; route: string };

/** Office map card: dark contact panel + toned Google Maps embed (no API key), route and "open in Maps" links. */
export function MapCard({ locale, g, labels }: { locale: Locale; g: Global; labels: MapLabels }) {
  const query = (g.mapQuery || g.address)!;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(g.mapPlace || query)}&hl=${locale}&z=17&output=embed`;
  const placeId = g.mapUrl?.match(/place_id:([\w-]+)/)?.[1];
  const route = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}${placeId ? `&destination_place_id=${placeId}` : ''}`;
  const open = g.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return (
    <div className="mapcard">
      <div className="map-info">
        <h3 className="display map-t">{labels.heading}</h3>
        <dl className="map-dl">
          {g.address && (
            <div>
              <dt>{labels.office}</dt>
              <dd>{g.address}</dd>
            </div>
          )}
          {g.phone && (
            <div>
              <dt>{labels.phone}</dt>
              <dd><Phones g={g} /></dd>
            </div>
          )}
          {g.email && (
            <div>
              <dt>{labels.email}</dt>
              <dd><a href={`mailto:${g.email}`}>{g.email}</a></dd>
            </div>
          )}
          {g.workingHours && (
            <div>
              <dt>{labels.hours}</dt>
              <dd>
                {g.workingHours}
                {g.workingHoursNote && <><br />{g.workingHoursNote}</>}
              </dd>
            </div>
          )}
        </dl>
        <div className="map-btns">
          <a className="btn btn-lime" href={open} target="_blank" rel="noopener noreferrer">
            {labels.open} <UpRight />
          </a>
          <a className="fxlink fxlink-dark" href={route} target="_blank" rel="noopener noreferrer">
            {labels.route} <Arrow />
          </a>
        </div>
      </div>
      <div className="map-art skeleton">
        <iframe title={labels.title} src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </div>
    </div>
  );
}
