import { describe, expect, it } from 'vitest';
import { paragraphs } from '@/components/concept/TextParas';

describe('paragraphs', () => {
  it('splits a CMS text at blank lines and drops empty ones', () => {
    expect(paragraphs('Перший абзац.\n\nДругий\r\n  \r\nТретій')).toEqual(['Перший абзац.', 'Другий', 'Третій']);
    expect(paragraphs('Один рядок\nтой самий абзац')).toEqual(['Один рядок\nтой самий абзац']);
    expect(paragraphs(null)).toEqual([]);
    expect(paragraphs('  \n\n ')).toEqual([]);
  });
});
