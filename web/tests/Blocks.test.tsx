// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Blocks, { safeHref } from '@/components/Blocks';

const text = (t: string, marks: Record<string, boolean> = {}) => ({ type: 'text', text: t, ...marks });

describe('safeHref', () => {
  it('keeps web, mail, phone, relative and anchor links', () => {
    for (const u of ['https://bp-audit.com.ua', 'http://example.com/x', 'mailto:office@bp-audit.com.ua', 'tel:+380322424242', '/uk/services', '#faq', '?a=1', 'contacts'])
      expect(safeHref(u), u).toBe(u);
  });
  it('drops script, data and protocol-relative links, including disguised ones', () => {
    for (const u of ['javascript:alert(1)', 'JavaScript:alert(1)', ' javascript:alert(1)', 'java\nscript:alert(1)', 'java\tscript:x', '\u0001javascript:x',
      'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox', '//evil.example', '/\\evil.example', '', undefined])
      expect(safeHref(u as string), JSON.stringify(u)).toBeUndefined();
  });
});

describe('<Blocks>', () => {
  it('renders headings (h2–h4 only), paragraphs, lists, quotes and inline marks', () => {
    const { container } = render(
      <Blocks
        content={[
          { type: 'heading', level: 1, children: [text('Заголовок')] },
          { type: 'heading', level: 6, children: [text('Малий')] },
          { type: 'paragraph', children: [text('Жирний', { bold: true }), text(' і '), text('курсив', { italic: true })] },
          { type: 'list', format: 'ordered', children: [{ type: 'list-item', children: [text('Один')] }, { type: 'list-item', children: [text('Два')] }] },
          { type: 'quote', children: [text('Цитата')] },
          { type: 'code', children: [text('npm test')] },
        ]}
      />,
    );
    expect(container.querySelector('h2')?.textContent).toBe('Заголовок');
    expect(container.querySelector('h4')?.textContent).toBe('Малий');
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('strong')?.textContent).toBe('Жирний');
    expect(container.querySelector('em')?.textContent).toBe('курсив');
    expect(container.querySelectorAll('ol > li')).toHaveLength(2);
    expect(container.querySelector('blockquote')?.textContent).toBe('Цитата');
    expect(container.querySelector('pre code')?.textContent).toBe('npm test');
  });
  it('opens external links in a new tab safely and neutralises bad links', () => {
    const { container } = render(
      <Blocks
        content={[
          {
            type: 'paragraph',
            children: [
              { type: 'link', url: 'https://example.com', children: [text('зовнішнє')] },
              { type: 'link', url: '/uk/contacts', children: [text('внутрішнє')] },
              { type: 'link', url: 'javascript:alert(1)', children: [text('погане')] },
            ],
          },
        ]}
      />,
    );
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[0].getAttribute('target')).toBe('_blank');
    expect(links[1].getAttribute('target')).toBeNull();
    expect(container.textContent).toContain('погане');
  });
  it('renders text from the CMS as text, never as HTML', () => {
    const { container } = render(<Blocks content={[{ type: 'paragraph', children: [text('<img src=x onerror=alert(1)>')] }]} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('<img src=x onerror=alert(1)>');
  });
  it('renders nothing for empty content', () => {
    expect(render(<Blocks content={[]} />).container.innerHTML).toBe('');
    expect(render(<Blocks content={null} />).container.innerHTML).toBe('');
  });
});
