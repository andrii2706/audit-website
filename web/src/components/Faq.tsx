import type { Faq as FaqItem } from '@/lib/strapi';

/** Акордеон на нативних <details> — працює без JavaScript і доступний з клавіатури. */
export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="faq__list">
      {items.map((f, i) => (
        <details key={f.documentId} className="faq__item" open={i === 0}>
          <summary>
            {f.question}
            <span className="faq__sign" aria-hidden="true">+</span>
          </summary>
          <p>{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
