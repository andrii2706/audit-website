import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/bits';
import CountUp from '@/components/CountUp';
import FadeImage from '@/components/FadeImage';
import Glyph from '@/components/concept/Glyph';
import { Arrow, FaqList, Label, PageHead, Prose, UpRight, num } from '@/components/concept/parts';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { trail } from '@/lib/breadcrumbs';
import { buildMetadata, faqLd } from '@/lib/seo';
import { resolveProtection } from '@/lib/protection';
import { documentImageUrl, getAboutPage, getDocumentImages, getFaqs, getGlobal, getHomepage, type TextItem } from '@/lib/strapi';

export const revalidate = 3600;
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [d, about] = await Promise.all([getDictionary(locale), getAboutPage(locale)]);
  return buildMetadata({
    locale,
    path: '/about',
    title: about?.seo?.metaTitle || d.pages.aboutTitle,
    description: about?.seo?.metaDescription || about?.heroIntro || d.pages.aboutIntro,
  });
}


/** Cards with a small glyph, title and text (reasons, values, principles). */
function Cards({ items, from = 0, className = '' }: { items: TextItem[]; from?: number; className?: string }) {
  return (
    <ul className={`vgrid ${className}`}>
      {items.map((it, i) => (
        <li key={it.id} className="vcard">
          <Glyph i={from + i} className="tiny-glyph" />
          <h3>{it.title}</h3>
          {it.text && <p className="muted">{it.text}</p>}
        </li>
      ))}
    </ul>
  );
}

/** About the firm: intro + key numbers, reasons, mission & values, principles, history, register, requisites, quality policy, documents, FAQ. Content: Strapi "Про компанію". */
export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, about, home, faqs, docs, global] = await Promise.all([getDictionary(locale), getAboutPage(locale), getHomepage(locale), getFaqs(locale), getDocumentImages(locale), getGlobal(locale)]);
  const { watermarkDocuments } = resolveProtection(global);
  const s = dict.sections, c = dict.concept;

  return (
    <>
      <PageHead locale={locale} crumbs={trail(dict, 'about')} crumbsLabel={dict.nav.breadcrumbs} title={about?.heroTitle ?? dict.pages.aboutTitle} intro={about?.heroIntro ?? dict.pages.aboutIntro} />

      {!!home?.stats?.length && (
        <section className="section section-tight" aria-label={c.numbers}>
          <div className="wrap">
            <Label>{c.numbers}</Label>
            <dl className="nums">
              {home.stats.map((st) => (
                <div key={st.id} className="num"><dd className="display num-v"><CountUp value={st.value} /></dd><dt>{st.label}</dt></div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {!!about?.intro?.length && (
        <section className="section section-tight">
          <div className="wrap two-col">
            <Prose content={about.intro} />
            <aside className="card dark side-card">
              <h2 className="display h3">{c.readyTitle}</h2>
              <p className="soft">{c.readyText}</p>
              <Link className="btn btn-lime" href={`/${locale}/contacts`}>{dict.nav.consultation} <UpRight /></Link>
            </aside>
          </div>
        </section>
      )}

      {!!about?.reasons?.length && (
        <section className="section">
          <div className="wrap">
            <Label>{c.why}</Label>
            <h2 className="display h2 c-center">{about.reasonsTitle ?? s.about}</h2>
            <Cards items={about.reasons} />
          </div>
        </section>
      )}

      {(about?.mission || !!about?.values?.length) && (
        <section className="section why-sec">
          <div className="why-box">
            <div className="why-in">
              <Label dark>{about?.missionTitle ?? s.mission}</Label>
              {about?.mission && <p className="display mission">{about.mission}</p>}
              {!!about?.values?.length && (
                <>
                  <h3 className="display h3 on-dark-t">{about.valuesTitle ?? s.values}</h3>
                  <Cards items={about.values} from={2} className="vgrid-dark" />
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {!!about?.principles?.length && (
        <section className="section">
          <div className="wrap">
            <Label>{c.principles}</Label>
            <h2 className="display h2 c-center">{about.principlesTitle}</h2>
            {about.principlesIntro && <p className="lead muted c-center">{about.principlesIntro}</p>}
            <Cards items={about.principles} from={4} className="vgrid-3" />
            {about.principlesOutro && <p className="lead c-center">{about.principlesOutro}</p>}
          </div>
        </section>
      )}

      {(!!about?.history?.length || !!about?.requests?.length) && (
        <section className="section">
          <div className="wrap two-col">
            {!!about?.history?.length && (
              <div>
                <Label>{about.historyTitle ?? s.history}</Label>
                <Prose content={about.history} className="c-mt" />
              </div>
            )}
            {!!about?.requests?.length && (
              <div>
                <Label>{c.requests}</Label>
                {about.requestsTitle && <h3 className="display h3 c-mt">{about.requestsTitle}</h3>}
                <ul className="tags tags-1">
                  {about.requests.map((r, i) => <li key={r.id} className="tag"><span className="mono">{num(i)}</span><span>{r.text}</span></li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {!!about?.registry?.length && (
        <section className="section" id="registry">
          <div className="wrap two-col">
            <div>
              <Label>{s.registry}</Label>
              <h2 className="display h2-left c-mt">{about.registryTitle ?? s.registry}</h2>
            </div>
            <div>
              <Prose content={about.registry} />
              {!!about.quality?.length && (
                <Link className="fxlink c-mt" href={`/${locale}/career#quality`}>{about.qualityTitle ?? s.quality} <Arrow /></Link>
              )}
            </div>
          </div>
        </section>
      )}

      {!!about?.requisites?.length && (
        <section className="section" id="requisites">
          <div className="wrap">
            <Label>{s.requisites}</Label>
            <h2 className="display h2-left c-mt">{about.requisitesTitle ?? s.requisites}</h2>
            <div className="two-col c-mt">
              <div data-allow-copy><Prose content={about.requisites} className="card requisites" /></div>
              {!!about.quality?.length && (
                <div>
                  <h3 className="display h3">{about.qualityTitle ?? s.quality}</h3>
                  <Prose content={about.quality.slice(0, 4)} className="c-mt-s" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!!about?.policy?.length && (
        <section className="section" id="policy">
          <div className="wrap">
            <Label>{s.quality}</Label>
            <h2 className="display h2-left c-mt">{about.policyTitle ?? s.policy}</h2>
            <Prose content={about.policy} className="prose-cols c-mt" />
          </div>
        </section>
      )}

      {[
        { kind: 'certificate' as const, title: about?.documentsTitle, id: 'documents' },
        { kind: 'recommendation' as const, title: about?.recommendationsTitle, id: 'recommendations' },
      ].map(({ kind, title, id }) => {
        const list = docs.filter((d) => d.kind === kind);
        if (!list.length) return null;
        return (
          <section key={kind} id={id} className="section">
            <div className="wrap">
              <Label>{s.documents}</Label>
              <h2 className="display h2 c-center">{title ?? s.documents}</h2>
              <ul className="docs">
                {list.map((d) => {
                  const src = documentImageUrl(d, watermarkDocuments)!;
                  const isImage = !d.image?.mime || d.image.mime.startsWith('image/');
                  return (
                    <li key={d.documentId} className="doc">
                      <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`${dict.pages.openDocument}: ${d.title}`} style={{ display: 'contents' }}>
                        <span className="doc-sheet skeleton">
                          {isImage ? <FadeImage src={src} alt={d.title} fill sizes="(max-width: 640px) 50vw, 240px" className="object-contain p-2" /> : <Glyph i={4} className="doc-glyph" />}
                        </span>
                        <p>{d.title}</p>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}

      {faqs.length > 0 && (
        <section className="section" id="faq" aria-labelledby="about-faq-title">
          <div className="wrap">
            <Label>{s.faq}</Label>
            <div className="faq">
              <div>
                <h2 id="about-faq-title" className="display h2-left">{home?.faqTitle}</h2>
                {home?.faqText && <p className="lead muted">{home.faqText}</p>}
              </div>
              <FaqList items={faqs.map((f) => ({ id: f.documentId, question: f.question, answer: f.answer }))} />
            </div>
          </div>
        </section>
      )}
      {faqs.length > 0 && <JsonLd data={faqLd(faqs)} />}
    </>
  );
}
