import type { Locale } from '@/i18n/config';
import type { Deliverable } from '@/lib/deliverables';
import { num } from './parts';
import './deliverable-cards.css';

/** Full names of the regulators the client's brief lists in brackets; an unknown tag is shown on its own. */
const FULL_NAMES: Record<string, Record<Locale, string>> = {
  'АМКУ': { uk: 'Антимонопольний комітет України', en: 'Antimonopoly Committee of Ukraine' },
  AMCU: { uk: 'Антимонопольний комітет України', en: 'Antimonopoly Committee of Ukraine' },
  'НКЦПФР': { uk: 'Комісія з цінних паперів та фондового ринку', en: 'Securities and Stock Market Commission' },
  NSSMC: { uk: 'Комісія з цінних паперів та фондового ринку', en: 'Securities and Stock Market Commission' },
  'НБУ': { uk: 'Національний банк України', en: 'National Bank of Ukraine' },
  NBU: { uk: 'Національний банк України', en: 'National Bank of Ukraine' },
};

/**
 * "What you get" of a service as numbered cards (approved design 27.11). With an odd number of cards the last one
 * spans the row in the dark style; its tags (the regulators) are listed beside the text.
 */
export default function DeliverableCards({ items, locale }: { items: Deliverable[]; locale: Locale }) {
  const wideLast = items.length % 2 === 1 && items.length > 1;
  return (
    <div className="dcards-wrap">
      <ol className="dcards">
        {items.map((x, i) => {
          const wide = wideLast && i === items.length - 1;
          return (
            <li key={i} className={wide ? 'dcard dcard-wide' : 'dcard'}>
              <div className="dcard-body">
                <span className="mono dcard-n" aria-hidden="true">( {num(i)} )</span>
                <h3 className="dcard-title">{x.title}</h3>
                <p className="dcard-text">{x.text}</p>
              </div>
              {x.tags.length > 0 && (
                <ul className="dcard-tags">
                  {x.tags.map((tag) => (
                    <li key={tag}>
                      <b>{tag}</b>
                      {FULL_NAMES[tag] && <span>{FULL_NAMES[tag][locale]}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
