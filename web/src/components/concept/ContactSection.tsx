import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import type { Homepage } from '@/lib/strapi';
import ConceptForm from './ConceptForm';
import CtaArt from './CtaArt';
import { Label, Tick } from './parts';

/** "Request" block: title, text and bullets from the CMS home page next to the short request form. */
/** `serviceOptions`: answers to "Which service?" (service category names + "Other"). */
export default function ContactSection({ locale, dict, home, serviceOptions, id = 'contact', sourcePage }: { locale: Locale; dict: Dictionary; home: Homepage | null; serviceOptions: string[]; id?: string; sourcePage: string }) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      {/* Old links point at #estimate. */}
      {id === 'contact' && <span id="estimate" aria-hidden="true" />}
      <div className="wrap">
        <Label>{dict.sections.pricing}</Label>
        <div className="cta">
          <CtaArt />
          <div className="cta-text">
            <h2 id={`${id}-title`} className="display h2-left">{home?.estimateTitle || dict.pages.contactsForm}</h2>
            {home?.estimateText && <p className="lead muted">{home.estimateText}</p>}
            {!!home?.estimateBullets?.length && (
              <ul className="bullets">
                {home.estimateBullets.map((b) => <li key={b.id}><Tick />{b.text}</li>)}
              </ul>
            )}
          </div>
          <ConceptForm locale={locale} dict={dict.form} variant="estimate" serviceOptions={serviceOptions} sourcePage={sourcePage} />
        </div>
      </div>
    </section>
  );
}
