import { describe, expect, it } from 'vitest';
import { md } from '../src/seed/md';

describe('md() — Markdown → Strapi blocks', () => {
  it('turns blank-line separated text into paragraphs (lines joined)', () => {
    expect(md('Перший\nрядок\n\nДругий')).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: 'Перший рядок' }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'Другий' }] },
    ]);
  });
  it('supports ## and ### headings', () => {
    expect(md('## Послуги\n\n### Аудит').map((b) => [b.type, (b as { level?: number }).level])).toEqual([['heading', 2], ['heading', 3]]);
  });
  it('supports bullet lists with bold runs', () => {
    const [list] = md('- **ЄДРПОУ:** 37741155\n- Львів');
    expect(list).toEqual({
      type: 'list', format: 'unordered',
      children: [
        { type: 'list-item', children: [{ type: 'text', text: 'ЄДРПОУ:', bold: true }, { type: 'text', text: ' 37741155' }] },
        { type: 'list-item', children: [{ type: 'text', text: 'Львів' }] },
      ],
    });
  });
  it('ignores Windows line endings and extra blank lines', () => {
    expect(md('\r\nА\r\n\r\n\r\n\r\nБ\r\n')).toHaveLength(2);
  });
  it('returns nothing for empty input', () => expect(md('  \n\n ')).toEqual([]));
});
