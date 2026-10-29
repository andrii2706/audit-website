import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { t } from '@/i18n/format';
import type { Article, Category, Faq, Homepage, NewsItem, Service, TeamMember } from '@/lib/strapi';
import AudienceTabs from './AudienceTabs';
import CountUp from './CountUp';
import { FaqList, NewsCard, PersonCard, PostCard, SectionHead, Steps } from './bits';
import { ArrowUpRight } from './Icons';
import LeadForm from './LeadForm';
import { badge, btn, cardHover, container, eyebrow, h2 } from './ui';
import type { Audience } from '@/lib/strapi';

type Base = { locale: Locale; dict: Dictionary };

/** 7-card bento: 1 large, 4 small, 2 wide. Collapses to 2 columns on tablets and 1 on phones. */
export function ServicesBento({ locale, dict, featured, total, title, num = '01' }: Base & { featured: Service[]; total: number; title?: string | null; num?: string }) {
  const [big, ...rest] = featured;
  const small = rest.slice(0, 4);
  const wide = rest.slice(4, 6);
  return (
    <section id="services" className="pt-6 pb-16 sm:pt-8 sm:pb-24">
      <div className={container}>
        <SectionHead
          eyebrowText={`${num} / ${dict.sections.services}`}
          title={title ?? dict.nav.services}
          action={<Link href={`/${locale}/services`} className={btn.outline}>{t(dict.common.allServices, { n: total })}</Link>}
        />
        <div data-stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {big && (
            <Link
              href={`/${locale}/services/${big.slug}`}
              className="group relative flex min-h-[340px] cursor-pointer flex-col gap-4 overflow-hidden rounded-panel border border-transparent bg-accent p-6 text-white transition-[translate,box-shadow] duration-500 ease-(--ease-out-expo) hover:-translate-y-1 hover:shadow-[0_32px_64px_-28px_rgba(35,70,255,0.55)] sm:col-span-2 sm:min-h-[420px] sm:p-9 lg:row-span-2"
            >
              <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/15 blur-3xl transition-[translate] duration-1000 ease-(--ease-out-expo) group-hover:translate-x-[-40px] group-hover:translate-y-[30px]" />
              <div className="relative flex items-center justify-between gap-3">
                <span className={badge.glass}>{big.badge ?? dict.common.popular}</span>
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-white text-ink transition-[rotate] duration-500 ease-(--ease-out-expo) group-hover:rotate-45 sm:size-13"><ArrowUpRight size={22} /></span>
              </div>
              <h3 className="mt-auto text-[28px] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-4xl lg:text-[40px]">{big.title}</h3>
              <p className="max-w-md text-base leading-relaxed text-accent-on sm:text-[17px]">{big.excerpt}</p>
              {!!big.tags?.length && (
                <div className="flex flex-wrap gap-2">
                  {big.tags.map((tg) => <span key={tg.id} className="rounded-full border border-white/40 px-3 py-1.5 text-[13px]">{tg.text}</span>)}
                </div>
              )}
            </Link>
          )}
          {small.map((s, i) => (
            <Link key={s.documentId} href={`/${locale}/services/${s.slug}`} className={`${cardHover} flex min-h-[200px] flex-col gap-3 rounded-card border border-line bg-card p-6`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[13px] text-muted">{String(i + 2).padStart(2, '0')}</span>
                {s.badge && <span className={badge.lime}>{s.badge}</span>}
              </div>
              <h3 className="mt-auto text-xl leading-tight font-semibold tracking-tight sm:text-[22px]">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{s.excerpt}</p>
            </Link>
          ))}
          {wide.map((s, i) => (
            <Link key={s.documentId} href={`/${locale}/services/${s.slug}`} className={`${cardHover} flex min-h-40 flex-wrap items-end justify-between gap-5 rounded-card border border-line bg-card p-6 sm:col-span-2`}>
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5">
                <span className="font-mono text-[13px] text-muted">{String(i + 6).padStart(2, '0')}{s.badge ? ` · ${s.badge}` : ''}</span>
                <h3 className="text-xl leading-tight font-semibold tracking-tight sm:text-[22px]">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{s.excerpt}</p>
              </div>
              <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-full border border-line transition-[background-color,color,border-color,translate] duration-500 ease-(--ease-out-expo) group-hover:translate-x-1 group-hover:border-ink group-hover:bg-ink group-hover:text-white">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AudienceSection({ locale, dict, items, title, num = '02' }: Base & { items: Audience[]; title?: string | null; num?: string }) {
  if (!items.length) return null;
  return (
    <section id="audience" className="border-y border-line bg-card py-16 sm:py-24">
      <div className={container}>
        <SectionHead eyebrowText={`${num} / ${dict.sections.audiences}`} title={title ?? dict.pages.audiencesTitle} />
        <AudienceTabs locale={locale} items={items} labels={{ details: dict.common.details, pickFormat: dict.common.pickFormat, tablist: dict.sections.audiences }} />
      </div>
    </section>
  );
}

export function ProcessSection({ dict, home, num = '03' }: Base & { home: Homepage | null; num?: string }) {
  if (!home?.processSteps?.length) return null;
  return (
    <section id="process" className="py-16 sm:py-24">
      <div className={container}>
        <SectionHead eyebrowText={`${num} / ${dict.sections.process}`} title={home.processTitle ?? dict.nav.about} />
        <Steps steps={home.processSteps} />
      </div>
    </section>
  );
}

export function StatsWhy({ home }: { home: Homepage | null }) {
  if (!home?.stats?.length && !home?.reasons?.length) return null;
  return (
    <section className={`${container} pb-2`}>
      <div data-reveal className="flex flex-col gap-12 rounded-card bg-ink px-5 py-12 text-white sm:gap-14 sm:rounded-block sm:px-10 sm:py-16 lg:px-14 lg:py-[72px]">
        {!!home.stats?.length && (
          <div data-stagger className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-4 lg:gap-8">
            {home.stats.map((s) => (
              <div key={s.id} className="flex flex-col gap-1.5 border-l border-dark-line pl-4 sm:pl-5">
                <b className="text-[34px] leading-none font-semibold tracking-[-0.04em] xs:text-[40px] md:text-5xl lg:text-[56px]"><CountUp value={s.value} /></b>
                <span className="text-sm text-dark-muted sm:text-[15px]">{s.label}</span>
              </div>
            ))}
          </div>
        )}
        {!!home.reasons?.length && (
          <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-10">
            <h2 className="text-3xl leading-[1.08] font-semibold tracking-[-0.03em] sm:text-4xl lg:text-[44px]">{home.whyTitle}</h2>
            <div data-stagger className="grid gap-7 sm:grid-cols-2 sm:gap-x-8">
              {home.reasons.map((r) => (
                <div key={r.id}>
                  <b className="mb-2 block text-lg font-semibold">{r.title}</b>
                  <span className="text-[15px] leading-relaxed text-dark-muted">{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function TeamSection({ dict, home, team, num = '04' }: Base & { home: Homepage | null; team: TeamMember[]; num?: string }) {
  if (!team.length) return null;
  return (
    <section id="team" className="py-16 sm:py-24">
      <div className={container}>
        <SectionHead eyebrowText={`${num} / ${dict.sections.team}`} title={home?.teamTitle ?? dict.pages.teamTitle} intro={home?.teamSubtitle} />
        <div data-stagger className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => <PersonCard key={m.documentId} m={m} />)}
        </div>
      </div>
    </section>
  );
}

export function EstimateSection({ locale, dict, home, categories, num = '05' }: Base & { home: Homepage | null; categories: Category[]; num?: string }) {
  return (
    <section id="estimate" className={`${container} pb-16 sm:pb-24`}>
      <div data-reveal className="grid gap-8 rounded-card bg-accent-soft p-4 py-7 sm:rounded-block sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12 lg:p-14">
        <div className="flex flex-col gap-5 px-1 sm:px-0">
          <span className={`${eyebrow} text-[#3b4556]`}>{num} / {dict.sections.pricing}</span>
          <h2 className={h2}>{home?.estimateTitle ?? dict.form.submit}</h2>
          {home?.estimateText && <p className="text-base leading-relaxed text-[#3b4556] sm:text-lg">{home.estimateText}</p>}
          {!!home?.estimateBullets?.length && (
            <ul className="mt-2 flex flex-col gap-3 text-base">
              {home.estimateBullets.map((b) => (
                <li key={b.id} className="flex items-center gap-2.5">
                  <i aria-hidden="true" className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-accent-ink not-italic">✓</i>
                  {b.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <LeadForm locale={locale} dict={dict.form} variant="estimate" serviceOptions={[...categories.map((c) => c.name), dict.form.other]} sourcePage={`/${locale} (estimate)`} />
      </div>
    </section>
  );
}

/** Latest company news on the home page (hidden when nothing is published). */
export function NewsSection({ locale, dict, news, num = '06' }: Base & { news: NewsItem[]; num?: string }) {
  if (!news.length) return null;
  return (
    <section id="news" className={`${container} pb-16 sm:pb-24`}>
      <SectionHead
        eyebrowText={`${num} / ${dict.sections.news}`}
        title={dict.pages.newsTitle}
        action={<Link href={`/${locale}/news`} className={btn.outline}>{dict.common.allNews}</Link>}
      />
      <div data-stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((n) => <NewsCard key={n.documentId} locale={locale} n={n} labels={{ pinned: dict.pages.newsPinned, more: dict.common.details }} />)}
      </div>
    </section>
  );
}

export function BlogSection({ locale, dict, home, posts, num = '06' }: Base & { home: Homepage | null; posts: Article[]; num?: string }) {
  if (!posts.length) return null;
  return (
    <section id="blog" className={`${container} pb-16 sm:pb-24`}>
      <SectionHead
        eyebrowText={`${num} / ${dict.sections.blog}`}
        title={home?.blogTitle ?? dict.pages.blogTitle}
        action={<Link href={`/${locale}/blog`} className={btn.outline}>{dict.common.allPosts}</Link>}
      />
      <div data-stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => <PostCard key={p.documentId} locale={locale} post={p} minutes={dict.common.minutes} />)}
      </div>
    </section>
  );
}

export function FaqSection({ dict, home, faqs, num = '07' }: Base & { home: Homepage | null; faqs: Faq[]; num?: string }) {
  if (!faqs.length) return null;
  return (
    <section className={`${container} grid gap-8 pb-16 sm:pb-24 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)] lg:gap-12`}>
      <div data-reveal className="flex flex-col gap-4">
        <span className={eyebrow}>{num} / {dict.sections.faq}</span>
        <h2 className={h2}>{home?.faqTitle ?? dict.sections.faq}</h2>
        {home?.faqText && <p className="text-base leading-relaxed text-muted">{home.faqText}</p>}
      </div>
      <FaqList items={faqs} />
    </section>
  );
}
