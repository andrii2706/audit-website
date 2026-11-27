import Link from 'next/link';
import type { ReactNode } from 'react';
import FadeImage from '@/components/FadeImage';
import type { Locale } from '@/i18n/config';
import { crumbHref, type Crumb } from '@/lib/breadcrumbs';
import type { Blocks as BlocksData } from '@/lib/strapi';
import Glyph from './Glyph';
import { Arrow, Label, PageHead, Prose } from './parts';

type Props = {
  locale: Locale;
  labels: { crumbs: string; section: string; more: string; back: string; ask: string; email: string };
  /** Breadcrumb trail (lib/breadcrumbs.ts): Home → section → this article. */
  trail: Crumb[];
  title: string;
  intro?: string | null;
  meta: ReactNode;
  cover?: string | null;
  coverAlt?: string;
  content?: BlocksData;
  i: number;
  mailto?: string | null;
  more: ReactNode;
  hasMore: boolean;
};

/** Article / news page: head with meta, a cover (photo or a large glyph), the text, contact buttons, more items. */
export default function ArticleView({ locale, labels, trail, title, intro, meta, cover, coverAlt, content, i, mailto, more, hasMore }: Props) {
  return (
    <>
      <article>
        <PageHead locale={locale} crumbs={trail} crumbsLabel={labels.crumbs} title={title} intro={intro}>
          <p className="mono muted post-meta">{meta}</p>
        </PageHead>
        <section className="section section-tight">
          <div className="wrap">
            <div className="post-hero skeleton" style={{ position: 'relative', overflow: 'hidden' }}>
              {cover ? <FadeImage src={cover} alt={coverAlt ?? ''} fill priority sizes="(max-width: 1300px) 100vw, 1240px" className="object-cover" /> : <Glyph i={i + 2} className="post-hero-glyph" />}
            </div>
            <Prose content={content} className="article" />
            <div className="hero-cta left c-mt-lg">
              <Link className="btn btn-accent" href={`/${locale}#contact`}>{labels.ask}</Link>
              {mailto && <a className="fxlink" href={mailto}>{labels.email} <Arrow /></a>}
            </div>
          </div>
        </section>
      </article>
      {hasMore && (
        <section className="section section-tight">
          <div className="wrap">
            <Label>{labels.more}</Label>
            {more}
            <div className="c-right"><Link className="fxlink" href={crumbHref(locale, trail[trail.length - 2])}>{labels.back} <Arrow /></Link></div>
          </div>
        </section>
      )}
    </>
  );
}
