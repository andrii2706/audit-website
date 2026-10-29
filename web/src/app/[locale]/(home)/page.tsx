import type { Metadata } from 'next';
import FadeImage from '@/components/FadeImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/bits';
import { ArrowRight, Shield, Telegram } from '@/components/Icons';
import { AudienceSection, BlogSection, EstimateSection, FaqSection, NewsSection, ProcessSection, ServicesBento, StatsWhy, TeamSection } from '@/components/sections';
import { badge, btn, chipCell, chipGrid, container } from '@/components/ui';
import { isLocale } from '@/i18n/config';
import { plural, t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { daysUntil, formatDate } from '@/lib/format';
import { buildMetadata, faqLd } from '@/lib/seo';
import {
  getAllServices, getArticles, getAudiences, getCategories, getClients, getFaqs,
  getFeaturedServices, getGlobal, getHomepage, getNews, getTeam, mediaUrl,
} from '@/lib/strapi';

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [g, d] = await Promise.all([getGlobal(locale), getDictionary(locale)]);
  return buildMetadata({
    locale,
    path: '',
    title: g?.seo?.metaTitle || d.meta.defaultTitle,
    description: g?.seo?.metaDescription || d.meta.defaultDescription,
    absoluteTitle: true,
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, home, global, featured, allServices, audiences, team, faqs, clients, posts, categories, news] = await Promise.all([
    getDictionary(locale), getHomepage(locale), getGlobal(locale), getFeaturedServices(locale), getAllServices(locale),
    getAudiences(locale), getTeam(locale), getFaqs(locale), getClients(locale), getArticles(locale, 3), getCategories(locale), getNews(locale, 3),
  ]);
  const h = dict.hero;
  const days = daysUntil(home?.deadlineDate);
  const companiesStat = home?.stats?.find((s) => s.value.includes('300')) ?? home?.stats?.[1];

  return (
    <>
      {/* ——— HERO */}
      <section className="pt-8 pb-12 sm:pt-14 sm:pb-14 lg:pt-[72px]">
        <div className={`${container} grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12`}>
          <div className="flex min-w-0 animate-stagger flex-col gap-6 [--stagger-step:90ms] sm:gap-7">
            {(home?.heroBadge || home?.heroBadgeNote) && (
              <div className="inline-flex max-w-full flex-wrap items-center gap-x-2.5 gap-y-1.5 self-start rounded-2xl border border-line bg-card py-1.5 pr-3 pl-1.5 text-[12px] font-medium xs:text-[13px] sm:rounded-full sm:pr-3.5 sm:text-sm">
                {home?.heroBadge && <span className={badge.accent}>{home.heroBadge}</span>}
                {home?.heroBadgeNote}
              </div>
            )}
            <h1 className="text-[38px] leading-[1.03] font-semibold tracking-[-0.04em] xs:text-[44px] sm:text-[56px] lg:text-[64px] xl:text-[72px]">
              {home?.heroTitleStart} {home?.heroTitleAccent && <span className="marker text-accent">{home.heroTitleAccent}</span>} {home?.heroTitleEnd}
            </h1>
            {home?.heroSubtitle && <p className="max-w-[600px] text-[17px] leading-relaxed text-muted sm:text-xl">{home.heroSubtitle}</p>}

            {!!home?.quickServices?.length && (
              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-muted">{h.whatNeed}</span>
                {/* Phones: 2-column grid (labels wrap); tablets and up: wrapping chips */}
                <div className={`${chipGrid} animate-stagger [--stagger-base:420ms] [--stagger-step:45ms]`}>
                  {home.quickServices.map((s) => (
                    <Link key={s.documentId} href={`/${locale}/services/${s.slug}`} className={chipCell}>{s.title}</Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-1 grid gap-3 sm:flex sm:flex-wrap">
              <Link href={`/${locale}#estimate`} className={`${btn.dark} w-full sm:w-auto`}>{h.estimate} <ArrowRight /></Link>
              {global?.telegramUrl && (
                <a href={global.telegramUrl} target="_blank" rel="noopener noreferrer" className={`${btn.light} w-full sm:w-auto`}><Telegram /> {h.telegram}</a>
              )}
            </div>
          </div>

          <div className="grid min-w-0 animate-stagger grid-cols-1 gap-3 [--stagger-base:220ms] [--stagger-step:110ms] xs:grid-cols-2">
            {home?.deadlineTitle && (
              <div className="flex min-h-[220px] flex-col gap-4 rounded-card bg-ink p-6 text-white xs:col-span-2 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-dark-muted">{days !== null ? h.deadlineSoon : h.relevantNow}</span>
                  <span className={badge.lime}>
                    {days === null ? h.season : days === 0 ? h.today : t(h.inDays, { n: days, days: plural(locale, days, h.days) })}
                  </span>
                </div>
                <div className="text-[22px] leading-tight font-semibold tracking-tight sm:text-[26px]">{home.deadlineTitle}</div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-sm text-dark-muted">{home.deadlineDate ? t(h.until, { date: formatDate(home.deadlineDate, locale) }) : h.deadlineTbd}</span>
                  {home.deadlineService && (
                    <Link href={`/${locale}/services/${home.deadlineService.slug}`} className="cursor-pointer border-b border-muted-2 pb-0.5 text-[15px] font-semibold text-white hover:text-lime">{h.catchUp}</Link>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2 rounded-card border border-line bg-card p-6">
              {home?.googleRating ? (
                <>
                  <span className="text-[44px] leading-tight font-semibold tracking-tight">{home.googleRating.toFixed(1)}</span>
                  <span className="text-sm text-muted">{h.googleRating}{home.googleReviewsCount ? ` · ${home.googleReviewsCount} ${h.reviews}` : ''}</span>
                  <span aria-hidden="true" className="mt-auto tracking-[2px] text-star">★★★★★</span>
                </>
              ) : (
                <>
                  <span className="text-[44px] leading-tight font-semibold tracking-tight">{companiesStat?.value ?? '300+'}</span>
                  <span className="text-sm text-muted">{companiesStat?.label ?? h.companiesFallback}</span>
                  <span className="mt-auto font-mono text-sm text-muted">{h.standards}</span>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2.5 rounded-card bg-accent-soft p-6">
              <Shield />
              <span className="text-[17px] leading-snug font-semibold">{home?.trustTitle}</span>
              {home?.trustText && <span className="text-sm text-[#3b4556]">{home.trustText}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* ——— CLIENTS */}
      {clients.length > 0 && (
        <section aria-label={dict.common.trustedByShort} className={`${container} pb-12 sm:pb-16`}>
          <div className="flex flex-col gap-5 border-t border-line pt-7 lg:flex-row lg:items-center lg:gap-8">
            <span className="shrink-0 text-sm font-medium text-muted">{companiesStat ? t(dict.common.trustedBy, { n: companiesStat.value }) : dict.common.trustedByShort}</span>
            <div data-stagger className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
              {clients.map((c) => {
                const logo = mediaUrl(c.logo ?? null);
                const inner = logo ? <FadeImage src={logo} alt={c.name} width={120} height={28} className="max-h-7 w-auto object-contain opacity-80 grayscale" /> : c.name;
                const cls = 'flex h-13 items-center justify-center rounded-[14px] bg-placeholder px-3 text-center text-sm font-semibold text-muted-2';
                return c.url ? (
                  <a key={c.documentId} href={c.url} target="_blank" rel="noopener noreferrer" className={`${cls} cursor-pointer hover:text-ink`}>{inner}</a>
                ) : (
                  <span key={c.documentId} className={cls}>{inner}</span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <ServicesBento locale={locale} dict={dict} featured={featured} total={allServices.length} title={home?.servicesTitle} />
      <AudienceSection locale={locale} dict={dict} items={audiences} title={home?.audienceTitle} />
      <ProcessSection locale={locale} dict={dict} home={home} />
      <StatsWhy home={home} />
      <TeamSection locale={locale} dict={dict} home={home} team={team} />
      <EstimateSection locale={locale} dict={dict} home={home} categories={categories} />
      <NewsSection locale={locale} dict={dict} news={news} num="06" />
      <BlogSection locale={locale} dict={dict} home={home} posts={posts} num={news.length ? '07' : '06'} />
      <FaqSection locale={locale} dict={dict} home={home} faqs={faqs} num={news.length ? '08' : '07'} />
      {faqs.length > 0 && <JsonLd data={faqLd(faqs)} />}
    </>
  );
}
