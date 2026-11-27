import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/bits';
import CountUp from '@/components/CountUp';
import ContactSection from '@/components/concept/ContactSection';
import TextParas from '@/components/concept/TextParas';
import Glyph, { HeroArt } from '@/components/concept/Glyph';
import LogoMarquee from '@/components/concept/LogoMarquee';
import HomeHero from '@/components/concept/HomeHero';
import { Arrow, FaqList, Label, MapCard, memberAnchor, PersonCard, PostCard, QuoteMark, ShieldMark, SvcCard, UpRight, num } from '@/components/concept/parts';
import ScrollWords from '@/components/concept/ScrollWords';
import Story from '@/components/concept/Story';
import { isLocale } from '@/i18n/config';
import { plural, t } from '@/i18n/format';
import { getDictionary } from '@/i18n/get-dictionary';
import { daysUntil, formatDate } from '@/lib/format';
import { buildMetadata, faqLd } from '@/lib/seo';
import {
  getAllServices, getArticles, getAudiences, getCategories, getClients, getFaqs, getFeaturedServices, getGlobal, getHomepage, getNews, getTeam, mediaUrl,
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

/** Words of the hero headline, each rising in turn (concept.css `.w`). */
function Words({ text, start, accent = false }: { text?: string | null; start: number; accent?: boolean }) {
  const words = (text ?? '').split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span className="w">
            <span className={accent ? 'acc' : undefined} style={{ '--i': start + i } as React.CSSProperties}>{w}</span>
          </span>{' '}
        </span>
      ))}
    </>
  );
}
const wordCount = (s?: string | null) => (s ?? '').split(/\s+/).filter(Boolean).length;

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, home, global, featured, allServices, audiences, team, faqs, clients, posts, news, categories] = await Promise.all([
    getDictionary(locale), getHomepage(locale), getGlobal(locale), getFeaturedServices(locale), getAllServices(locale),
    getAudiences(locale), getTeam(locale), getFaqs(locale), getClients(locale), getArticles(locale, 3), getNews(locale, 3), getCategories(locale),
  ]);
  const c = dict.concept, h = dict.hero, s = dict.sections;
  const days = daysUntil(home?.deadlineDate);
  const stat0 = home?.stats?.[0];
  const n1 = wordCount(home?.heroTitleStart), n2 = wordCount(home?.heroTitleAccent);
  const steps = home?.processSteps ?? [];
  const reasons = home?.reasons ?? [];
  const mapLabels = {
    title: t(dict.pages.mapTitle, { address: global?.address ?? '' }), heading: dict.pages.contactsMap, office: dict.pages.mapOffice,
    phone: dict.pages.mapPhone, email: dict.pages.mapEmail, hours: dict.footer.hours, open: dict.pages.mapOpen, route: dict.pages.mapRoute,
  };

  return (
    <>
      <HomeHero
        labelledBy="hero-title"
        videoSrc={mediaUrl(home?.heroVideo ?? null)}
        head={
          <>
            <HeroArt />
            <div className="wrap hero-head-in">
              {(home?.heroBadge || home?.heroBadgeNote) && (
                <div className="hero-badges">
                  {home?.heroBadge && <span className="badge">{home.heroBadge}</span>}
                  {home?.heroBadgeNote && <span>{home.heroBadgeNote}</span>}
                </div>
              )}
              <h1 id="hero-title" className="display hero-title">
                <Words text={home?.heroTitleStart} start={0} />
                <Words text={home?.heroTitleAccent} start={n1} accent />
                <Words text={home?.heroTitleEnd} start={n1 + n2} />
              </h1>
              <div className="hero-cta">
                <Link className="btn btn-dark" href="#contact">{h.estimate} <UpRight /></Link>
                <Link className="fxlink" href="#process">{c.howWeWork} <Arrow /></Link>
              </div>
              <a className="cue" href="#intro">
                <span className="cue-label">{c.scroll}</span>
                <span className="cue-circle">
                  <svg width="12" height="18" viewBox="0 0 12 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M6 0v16M1 11l5 5 5-5" /></svg>
                </span>
              </a>
            </div>
          </>
        }
        mediaTitle={<>{home?.heroTitleStart} <span className="lime">{home?.heroTitleAccent}</span> {home?.heroTitleEnd}</>}
        mediaFoot={<>{home?.heroBadge && <span>{home.heroBadge}</span>}<span className="mono">{c.mediaFoot}</span></>}
      />

      {/* ——— What is relevant now */}
      <section className="section now" aria-label={h.relevantNow}>
        <div className="wrap now-grid">
          <div className="card now-main">
            {home?.trustTitle && (
              <div className="trust">
                <span className="accent-c"><ShieldMark /></span>
                <div>
                  <p className="trust-title">{home.trustTitle}</p>
                  {home.trustText && <p className="muted small-t">{home.trustText}</p>}
                </div>
              </div>
            )}
            {!!home?.quickServices?.length && (
              <div className="need">
                <span className="muted small-t">{h.whatNeed}</span>
                <div className="chips">
                  {home.quickServices.map((q) => (
                    <Link key={q.documentId} className="chip" href={`/${locale}/services/${q.slug}`}>{q.title}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="now-side">
            {home?.deadlineTitle && (
              <div className="card dark deadline">
                <div className="row-between">
                  <span className="soft">{days !== null ? h.deadlineSoon : h.relevantNow}</span>
                  <span className="badge badge-lime">{days === null ? h.season : days === 0 ? h.today : t(h.inDays, { n: days, days: plural(locale, days, h.days) })}</span>
                </div>
                <p className="deadline-title">{home.deadlineTitle}</p>
                <div className="row-between">
                  <span className="mono soft">{home.deadlineDate ? t(h.until, { date: formatDate(home.deadlineDate, locale) }) : h.deadlineTbd}</span>
                  <Link className="ulink" href={home.deadlineService ? `/${locale}/services/${home.deadlineService.slug}` : '#contact'}>{h.catchUp.replace(/\s*→$/, '')}</Link>
                </div>
              </div>
            )}
            {(home?.googleRating || stat0) && (
              <div className="card stat">
                <span className="stat-big display">{home?.googleRating ? home.googleRating.toFixed(1) : stat0?.value}</span>
                <span className="muted small-t">
                  {home?.googleRating ? `${h.googleRating}${home.googleReviewsCount ? ` · ${home.googleReviewsCount} ${h.reviews}` : ''}` : stat0?.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ——— Statement + clients */}
      {home?.heroSubtitle && (
        <section className="section" id="intro" aria-label={s.about}>
          <div className="wrap">
            <Label>{s.about}</Label>
            <ScrollWords className="display statement" text={home.heroSubtitle} />
          </div>
          {clients.length > 0 && (
            <div className="clients">
              <p className="wrap c-center muted">{stat0 ? t(dict.common.trustedBy, { n: stat0.value }) : dict.common.trustedByShort}</p>
              <LogoMarquee label={c.clients}>
                {clients.map((cl) => {
                  const logo = mediaUrl(cl.logo ?? null);
                  return (
                    <li key={cl.documentId}>
                      <span className="logo-tile">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {logo ? <img src={logo} alt={cl.name} loading="lazy" draggable={false} style={{ maxHeight: 32, width: 'auto', filter: 'grayscale(1)', opacity: 0.8 }} /> : cl.name}
                      </span>
                    </li>
                  );
                })}
              </LogoMarquee>
            </div>
          )}
        </section>
      )}

      {/* ——— Services */}
      <section className="section" id="services" aria-labelledby="svc-title">
        <div className="wrap">
          <Label>{s.services}</Label>
          <h2 id="svc-title" className="display h2 c-center">{home?.servicesTitle || dict.pages.servicesTitle}</h2>
          <ul className="svc-grid">
            {featured.slice(0, 7).map((sv, i) => <SvcCard key={sv.documentId} locale={locale} s={sv} i={i} />)}
            <li>
              <Link className="svc svc-all" href={`/${locale}/services`}>
                <span className="mono svc-n">( {allServices.length} )</span>
                <Glyph i={7} className="svc-glyph" />
                <div className="svc-foot">
                  <span>{t(dict.common.allServices, { n: allServices.length })}</span>
                  <span className="round"><UpRight /></span>
                </div>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* ——— Numbers */}
      {!!home?.stats?.length && (
        <section className="section" aria-label={c.numbers}>
          <div className="wrap">
            <Label>{c.numbers}</Label>
            <dl className="nums">
              {home.stats.map((st) => (
                <div key={st.id} className="num">
                  <dd className="display num-v"><CountUp value={st.value} /></dd>
                  <dt>{st.label}</dt>
                </div>
              ))}
            </dl>
            <TextParas text={home.statsText} className="nums-text" />
          </div>
        </section>
      )}

      {/* ——— Process (pinned story) */}
      {steps.length > 0 && (
        <section className="section" id="process" aria-labelledby="proc-title">
          <div className="wrap">
            <Label>{c.howWeWork}</Label>
            <Story
              aside={<h2 id="proc-title" className="display h2-left">{home?.processTitle}</h2>}
              items={steps.map((st, i) => ({
                title: st.title,
                body: (
                  <article className="step">
                    <Glyph i={i + 3} className="step-glyph" />
                    <div className="row-between"><span className="mono muted">{t(c.stepOf, { n: num(i), total: String(steps.length).padStart(2, '0') })}</span></div>
                    <span className="display step-n">{num(i)}</span>
                    <h3 className="display step-t">{st.title}</h3>
                    {st.text && <p className="muted step-p">{st.text}</p>}
                  </article>
                ),
              }))}
            />
          </div>
        </section>
      )}

      {/* ——— Audiences */}
      {audiences.length > 0 && (
        <section className="section" id="audience" aria-labelledby="aud-title">
          <div className="wrap">
            <Label>{s.audiences}</Label>
            <h2 id="aud-title" className="display h2 c-center">{home?.audienceTitle || dict.pages.audiencesTitle}</h2>
            <ul className="aud-grid">
              {audiences.map((a, i) => (
                <li key={a.documentId}>
                  <Link className="aud" href={`/${locale}/audiences#aud-${i}`}>
                    <Glyph i={i + 1} className="aud-glyph" />
                    <span className="mono muted">{num(i)}</span>
                    <h3>{a.title}</h3>
                    {a.description && <p className="muted">{a.description}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ——— Why us (dark pinned story) */}
      {reasons.length > 0 && (
        <section className="section why-sec" id="why" aria-labelledby="why-title">
          <div className="why-box">
            <div className="why-in">
              <Label dark>{c.why}</Label>
              <TextParas text={home?.whyText} className="why-text" />
              <Story
                dark
                aside={<h2 id="why-title" className="display why-title">{home?.whyTitle}</h2>}
                items={reasons.map((r, i) => ({
                  title: r.title,
                  body: (
                    <article className="reason">
                      <QuoteMark />
                      <h3 className="display reason-t">{r.title}</h3>
                      {r.text && <p className="reason-p">{r.text}</p>}
                      <span className="mono dim">{num(i)} / {String(reasons.length).padStart(2, '0')}</span>
                    </article>
                  ),
                }))}
              />
            </div>
          </div>
        </section>
      )}

      {/* ——— Industries */}
      {!!home?.industries?.length && (
        <section className="section" id="industries" aria-labelledby="ind-title">
          <div className="wrap">
            <Label>{s.industries}</Label>
            <h2 id="ind-title" className="display h2 c-center">{home.industriesTitle}</h2>
            <ul className="tags">
              {home.industries.map((it, i) => (
                <li key={it.id} className="tag"><span className="mono">{num(i)}</span><span>{it.text}</span></li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ——— Team */}
      {team.length > 0 && (
        <section className="section" id="team" aria-labelledby="team-title">
          <div className="wrap">
            <Label>{s.team}</Label>
            <h2 id="team-title" className="display h2 c-center">{home?.teamTitle || dict.pages.teamTitle}</h2>
            {home?.teamSubtitle && <p className="lead c-center muted">{home.teamSubtitle}</p>}
            <ul className="team">
              {team.slice(0, 4).map((m, i) => (
                <PersonCard key={m.documentId} m={m} i={i} href={`/${locale}/team#${memberAnchor(m)}`} labels={{ bio: dict.pages.teamMore, qualification: dict.pages.teamQualification }} />
              ))}
            </ul>
            <div className="c-right"><Link className="fxlink" href={`/${locale}/team`}>{t(c.wholeTeam, { n: team.length })} <Arrow /></Link></div>
          </div>
        </section>
      )}

      {/* ——— Request */}
      <ContactSection locale={locale} dict={dict} home={home} serviceOptions={[...categories.map((cat) => cat.name), dict.form.other]} sourcePage={`/${locale}#contact`} />

      {/* ——— News + blog */}
      {news.length > 0 && (
        <section className="section" id="home-news" aria-labelledby="hn-title">
          <div className="wrap">
            <Label>{s.news}</Label>
            <h2 id="hn-title" className="display h2 c-center">{dict.pages.newsTitle}</h2>
            <ul className="posts">
              {news.map((n, i) => (
                <PostCard key={n.documentId} href={`/${locale}/news/${n.slug}`} i={i} kicker={n.tag} meta={formatDate(n.date, locale)} title={n.title} excerpt={n.excerpt} cover={mediaUrl(n.cover ?? null)} />
              ))}
            </ul>
            <div className="c-right"><Link className="fxlink" href={`/${locale}/news`}>{dict.common.allNews} <Arrow /></Link></div>
          </div>
        </section>
      )}
      {posts.length > 0 && (
        <section className="section" id="home-blog" aria-labelledby="hb-title">
          <div className="wrap">
            <Label>{s.blog}</Label>
            <h2 id="hb-title" className="display h2 c-center">{home?.blogTitle || dict.pages.blogTitle}</h2>
            <ul className="posts">
              {posts.map((a, i) => (
                <PostCard
                  key={a.documentId}
                  href={`/${locale}/blog/${a.slug}`}
                  i={i}
                  kicker={a.kind}
                  meta={[a.publishedAt && formatDate(a.publishedAt, locale), a.readingMinutes && t(dict.common.minutes, { n: a.readingMinutes })].filter(Boolean).join(' · ')}
                  title={a.title}
                  excerpt={a.excerpt}
                  cover={mediaUrl(a.cover ?? null)}
                />
              ))}
            </ul>
            <div className="c-right"><Link className="fxlink" href={`/${locale}/blog`}>{c.allArticles} <Arrow /></Link></div>
          </div>
        </section>
      )}

      {/* ——— FAQ */}
      {faqs.length > 0 && (
        <section className="section" id="faq" aria-labelledby="faq-title">
          <div className="wrap">
            <Label>{s.faq}</Label>
            <div className="faq">
              <div>
                <h2 id="faq-title" className="display h2-left">{home?.faqTitle}</h2>
                {home?.faqText && <p className="lead muted">{home.faqText}</p>}
              </div>
              <FaqList items={faqs.map((f) => ({ id: f.documentId, question: f.question, answer: f.answer }))} />
            </div>
          </div>
        </section>
      )}

      {/* ——— Map */}
      {global && (global.mapQuery || global.address) && (
        <section className="section" id="map" aria-label={dict.pages.contactsMap}>
          <div className="wrap">
            <Label>{c.office}</Label>
            <div className="map-wrap"><MapCard locale={locale} g={global} labels={mapLabels} /></div>
          </div>
        </section>
      )}
      {faqs.length > 0 && <JsonLd data={faqLd(faqs)} />}
    </>
  );
}
