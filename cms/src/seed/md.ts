import type { Block } from './structure';

type Inline = { type: 'text'; text: string; bold?: true };

/** "a **b** c" → text nodes with bold runs. */
function inline(s: string): Inline[] {
  const out: Inline[] = [];
  s.split(/(\*\*[^*]+\*\*)/).forEach((part) => {
    if (!part) return;
    if (part.startsWith('**') && part.endsWith('**')) out.push({ type: 'text', text: part.slice(2, -2), bold: true });
    else out.push({ type: 'text', text: part });
  });
  return out.length ? out : [{ type: 'text', text: '' }];
}

/**
 * Tiny Markdown → Strapi blocks converter for seed texts copied word for word from the old site.
 * Supports: blank-line separated paragraphs, `## ` / `### ` headings, `- ` bullet lists and `**bold**`.
 */
export function md(source: string): Block[] {
  const blocks: Block[] = [];
  const chunks = source.replace(/\r/g, '').trim().split(/\n\s*\n/);
  for (const raw of chunks) {
    const chunk = raw.trim();
    if (!chunk) continue;
    const lines = chunk.split('\n').map((l) => l.trim());
    if (lines.every((l) => l.startsWith('- '))) {
      blocks.push({ type: 'list', format: 'unordered', children: lines.map((l) => ({ type: 'list-item', children: inline(l.slice(2)) })) });
      continue;
    }
    const h = chunk.match(/^(#{2,4}) (.+)$/);
    if (h && lines.length === 1) {
      blocks.push({ type: 'heading', level: h[1].length, children: inline(h[2]) });
      continue;
    }
    blocks.push({ type: 'paragraph', children: inline(lines.join(' ')) });
  }
  return blocks;
}
