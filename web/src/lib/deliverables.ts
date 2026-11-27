/**
 * A service's "what you get" item written as «Title: text» (the client's brief does this everywhere) split for the
 * card layout of the service page. A parenthesised list of short names in the title, like «(АМКУ, НКЦПФР та НБУ)»,
 * becomes separate tags.
 */
export type Deliverable = { title: string; text: string; tags: string[] };

const JOIN = /\s*,\s*|\s+(?:та|і|й|and)\s+/;

export function splitDeliverable(raw: string): Deliverable | null {
  const at = raw.indexOf(': ');
  if (at < 3 || at > 120) return null;
  let title = raw.slice(0, at).trim();
  const text = raw.slice(at + 2).trim().replace(/\s*[;.]?\s*$/, '');
  if (!text) return null;
  let tags: string[] = [];
  const paren = title.match(/\s*\(([^()]+)\)\s*$/);
  if (paren) {
    const parts = paren[1].split(JOIN).map((x) => x.trim()).filter(Boolean);
    // Only short names (abbreviations), not a remark in brackets.
    if (parts.length > 1 && parts.every((x) => x.length <= 12)) {
      tags = parts;
      title = title.slice(0, paren.index).trim();
    }
  }
  return { title, text: text.charAt(0).toUpperCase() + text.slice(1) + '.', tags };
}

/** Cards only when every item has the «Title: text» form; otherwise the page keeps the plain list. */
export function deliverableCards(items: string[]): Deliverable[] | null {
  const cards = items.map(splitDeliverable);
  return items.length > 0 && cards.every((c): c is Deliverable => c !== null) ? cards : null;
}
