import FadeImage from './FadeImage';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { t } from '@/i18n/format';
import { cx, formatDate, initials } from '@/lib/format';
import { mediaUrl, type Article, type Faq, type NewsItem, type Service, type TeamMember } from '@/lib/strapi';
import { badge as badgeCls, cardHover, container, eyebrow, h2 } from './ui';

/** Renders a JSON-LD <script>. Pass null to render nothing. */
export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export function SectionHead({ eyebrowText, title, intro, action }: { eyebrowText?: string; title: string; intro?: string | null; action?: ReactNode }) {
  return (
    <div data-reveal className="mb-7 flex flex-wrap items-end justify-between gap-6 sm:mb-8">
      <div className="flex max-w-3xl flex-col gap-3">
        {eyebrowText && <span className={eyebrow}>{eyebrowText}</span>}
        <h2 className={h2}>{title}</h2>
        {intro && <p className="text-base leading-relaxed text-muted sm:text-lg">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumbs({ items, label }: { items: { name: string; href?: string }[]; label: string }) {
  return (
    <nav aria-label={label} className="mb-5 text-sm text-muted sm:mb-6">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {it.href ? <Link href={it.href} className="cursor-pointer hover:text-accent">{it.name}</Link> : <span aria-current="page" className="text-ink">{it.name}</span>}
            {i < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({ crumbs, crumbLabel, title, intro, badge, children }: { crumbs: { name: string; href?: string }[]; crumbLabel: string; title: string; intro?: string | null; badge?: string | null; children?: ReactNode }) {
  return (
    <section className="pt-10 pb-8 sm:pt-14 sm:pb-10">
      <div className={`${container} animate-stagger [--stagger-step:80ms]`}>
        <Breadcrumbs items={crumbs} label={crumbLabel} />
        {badge && <span className={`${badgeCls.lime} mb-4`}>{badge}</span>}
        <h1 className="max-w-4xl text-[34px] leading-[1.05] font-semibold tracking-[-0.035em] xs:text-[40px] md:text-5xl lg:text-[60px]">{title}</h1>
        {intro && <p className="mt-4 max-w-3xl text-[17px] text-muted sm:mt-5 sm:text-lg lg:text-[19px]">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function ServiceCard({ locale, s, more }: { locale: Locale; s: Pick<Service, 'documentId' | 'slug' | 'title' | 'excerpt' | 'badge'>; more: string }) {
  return (
    <Link href={`/${locale}/services/${s.slug}`} className={`${cardHover} flex min-h-[170px] flex-col gap-2.5 rounded-tile border border-line bg-card p-5 sm:p-6`}>
      {s.badge && <span className={`${badgeCls.lime} self-start`}>{s.badge}</span>}
      <b className="text-lg leading-snug font-semibold tracking-tight">{s.title}</b>
      <span className="text-sm leading-relaxed text-muted">{s.excerpt}</span>
      <span className="mt-auto inline-block text-sm font-semibold text-accent-ink transition-[translate] duration-500 ease-(--ease-out-expo) group-hover:translate-x-1">{more}</span>
    </Link>
  );
}

export function PostCard({ locale, post, minutes }: { locale: Locale; post: Article; minutes: string }) {
  const cover = mediaUrl(post.cover ?? null);
  const meta = [post.kind, post.readingMinutes ? t(minutes, { n: post.readingMinutes }) : null].filter(Boolean).join(' · ');
  return (
    <Link href={`/${locale}/blog/${post.slug}`} className={`${cardHover} flex flex-col gap-4 rounded-card border border-line bg-card p-2.5 pb-6`}>
      <div className={cx('relative h-44 overflow-hidden rounded-[20px] bg-placeholder sm:h-[200px]', cover && 'skeleton')}>
        {cover && <FadeImage src={cover} alt={post.cover?.alternativeText ?? ''} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover group-hover:scale-[1.04]" />}
      </div>
      <div className="flex flex-col gap-2.5 px-3.5">
        {meta && <span className="text-[13px] text-muted">{meta}</span>}
        <span className="text-lg leading-snug font-semibold tracking-tight sm:text-xl">{post.title}</span>
      </div>
    </Link>
  );
}

/**
 * News card. `featured` = wide card (cover beside the text on large screens) for the top item on /news.
 * Without a cover the card is text-only — no grey placeholder for news.
 */
export function NewsCard({ locale, n, labels, featured = false }: { locale: Locale; n: NewsItem; labels: { pinned: string; more: string }; featured?: boolean }) {
  const cover = mediaUrl(n.cover ?? null);
  return (
    <Link
      href={`/${locale}/news/${n.slug}`}
      className={cx(
        cardHover,
        'flex flex-col overflow-hidden rounded-card border border-line bg-card',
        featured && cover && 'lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]',
      )}
    >
      {cover && (
        <div className={cx('skeleton relative m-2.5 mb-0 overflow-hidden rounded-[20px]', featured ? 'aspect-[16/9] lg:m-2.5 lg:aspect-auto lg:min-h-[320px]' : 'aspect-[16/9]')}>
          <FadeImage src={cover} alt={n.cover?.alternativeText ?? ''} fill sizes={featured ? '(max-width: 1024px) 100vw, 640px' : '(max-width: 768px) 100vw, 400px'} className="object-cover group-hover:scale-[1.04]" />
        </div>
      )}
      <div className={cx('flex flex-1 flex-col gap-3 p-5 sm:p-6', featured && 'lg:justify-center lg:p-10')}>
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          {n.pinned && <span className={badgeCls.lime}>{labels.pinned}</span>}
          <time dateTime={n.date}>{formatDate(n.date, locale)}</time>
          {n.tag && <><span aria-hidden="true">·</span><span>{n.tag}</span></>}
        </div>
        <span className={cx('font-semibold tracking-tight', featured ? 'text-2xl leading-tight sm:text-3xl lg:text-[34px]' : 'text-lg leading-snug sm:text-xl')}>{n.title}</span>
        {n.excerpt && <span className={cx('leading-relaxed text-muted', featured ? 'text-base sm:text-lg' : 'text-[15px]')}>{n.excerpt}</span>}
        <span className="mt-auto inline-block pt-1 text-sm font-semibold text-accent-ink transition-[translate] duration-500 ease-(--ease-out-expo) group-hover:translate-x-1">{labels.more}</span>
      </div>
    </Link>
  );
}

export function PersonCard({ m }: { m: TeamMember }) {
  const photo = mediaUrl(m.photo ?? null);
  return (
    <article className="flex flex-col gap-3.5 rounded-card border border-line bg-card p-2.5 pb-5">
      <div className={cx('relative flex aspect-[4/3.6] items-center justify-center overflow-hidden rounded-[20px] bg-placeholder text-5xl font-semibold tracking-tight text-muted-2', photo && 'skeleton')}>
        {photo ? <FadeImage src={photo} alt={m.name} fill sizes="(max-width: 640px) 100vw, 300px" className="object-cover" /> : <span aria-hidden="true">{initials(m.name)}</span>}
      </div>
      <div className="flex flex-col gap-1.5 px-3">
        <span className="text-lg font-semibold">{m.name}</span>
        <span className="text-sm text-muted">{[m.role, m.experience].filter(Boolean).join(' · ')}</span>
        {m.credential && <span className="mt-1.5 self-start rounded-full bg-bg px-2.5 py-1 font-mono text-xs text-[#3b4556]">{m.credential}</span>}
      </div>
    </article>
  );
}

/** FAQ accordion on native <details>: works without JavaScript and with the keyboard. */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div data-stagger className="flex min-w-0 flex-col gap-2.5">
      {items.map((f, i) => (
        <details key={f.documentId} open={i === 0} className="faq group rounded-tile border border-line bg-card transition-[border-color,box-shadow] duration-500 ease-(--ease-out-expo) open:border-line-strong open:shadow-[0_18px_40px_-28px_rgba(11,18,32,0.3)] hover:border-line-strong">
          <summary className="no-marker flex min-h-16 cursor-pointer items-center justify-between gap-4 px-5 py-4 text-base font-semibold sm:px-6 sm:text-lg">
            {f.question}
            <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-bg text-xl transition-[rotate,background-color,color] duration-500 ease-(--ease-out-expo) group-open:rotate-45 group-open:bg-ink group-open:text-white">+</span>
          </summary>
          <p className="px-5 pb-5 text-base leading-relaxed text-muted sm:px-6 sm:pb-6">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function Steps({ steps, className }: { steps: { id: number; title: string; text?: string | null; duration?: string | null }[]; className?: string }) {
  return (
    <ol data-stagger className={cx('grid gap-3', className ?? 'sm:grid-cols-2 lg:grid-cols-4')}>
      {steps.map((s, i) => (
        <li key={s.id} className="flex flex-col gap-3.5 rounded-3xl border border-line bg-card p-6">
          <span className={cx('inline-flex size-11 items-center justify-center rounded-full font-semibold text-white', i === 0 ? 'bg-accent' : 'bg-ink')}>{i + 1}</span>
          <h3 className="text-lg font-semibold sm:text-xl">{s.title}</h3>
          {s.text && <p className="text-[15px] leading-relaxed text-muted">{s.text}</p>}
          {s.duration && <span className="mt-auto font-mono text-[13px] text-muted">{s.duration}</span>}
        </li>
      ))}
    </ol>
  );
}

export type Dict = Dictionary;
