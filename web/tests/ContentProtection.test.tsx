// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ContentProtection, { ATTRIBUTION_MIN_LENGTH, withAttribution } from '@/components/ContentProtection';

const ARTICLE = 'Аудит фінансової звітності — це незалежна перевірка, яка підтверджує достовірність показників компанії для власників і банків.';

function page() {
  document.body.innerHTML = `
    <p id="text">${ARTICLE}</p>
    <a id="tel" href="tel:+380322424242">+38 (032) 242-42-42</a>
    <input id="field" value="Олена" />
    <img id="img" src="/x.jpg" alt="" />`;
  return (id: string) => document.getElementById(id)!;
}

/** Dispatches a clipboard event with a fake clipboardData (jsdom has none) and selects `node`'s text first. */
function copyFrom(node: Element, type: 'copy' | 'cut' = 'copy') {
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  const data: Record<string, string> = {};
  const e = new Event(type, { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(e, 'clipboardData', { value: { setData: (k: string, v: string) => (data[k] = v) } });
  node.dispatchEvent(e);
  return { prevented: e.defaultPrevented, text: data['text/plain'] };
}
const fire = (node: Element, e: Event) => (node.dispatchEvent(e), e.defaultPrevented);
const key = (k: string, opts: KeyboardEventInit = {}) => new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts });

describe('<ContentProtection> — everything on', () => {
  const props = { copy: true, menu: true, images: true, keys: true, contacts: true };

  it('blocks copying and cutting page text', () => {
    const $ = page();
    render(<ContentProtection {...props} />);
    expect(copyFrom($('text'))).toEqual({ prevented: true, text: '' });
    expect(copyFrom($('text'), 'cut').prevented).toBe(true);
  });
  it('still lets people copy phone numbers and type into form fields', () => {
    const $ = page();
    render(<ContentProtection {...props} />);
    expect(copyFrom($('tel')).prevented).toBe(false);
    expect(fire($('field'), new Event('copy', { bubbles: true, cancelable: true }))).toBe(false);
    expect(fire($('field'), key('a', { ctrlKey: true }))).toBe(false);
  });
  it('blocks phone copying when «Копіювати контакти» is off', () => {
    const $ = page();
    render(<ContentProtection {...props} contacts={false} />);
    expect(copyFrom($('tel')).prevented).toBe(true);
  });
  it('blocks the context menu, image dragging and text selection', () => {
    const $ = page();
    render(<ContentProtection {...props} />);
    expect(fire($('text'), new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))).toBe(true);
    expect(fire($('img'), new Event('dragstart', { bubbles: true, cancelable: true }))).toBe(true);
    expect(fire($('text'), new Event('selectstart', { bubbles: true, cancelable: true }))).toBe(true);
    expect(fire($('field'), new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))).toBe(false);
  });
  it('blocks save / print / view-source / devtools / select-all shortcuts', () => {
    const $ = page();
    render(<ContentProtection {...props} />);
    for (const e of [key('s', { ctrlKey: true }), key('p', { metaKey: true }), key('u', { ctrlKey: true }), key('F12'),
      key('i', { ctrlKey: true, shiftKey: true }), key('a', { ctrlKey: true })])
      expect(fire($('text'), e), `${e.key} ctrl=${e.ctrlKey} meta=${e.metaKey}`).toBe(true);
    expect(fire($('text'), key('f', { ctrlKey: true }))).toBe(false); // search on page stays
  });
  it('removes its listeners on unmount', () => {
    const $ = page();
    const { unmount } = render(<ContentProtection {...props} />);
    unmount();
    expect(copyFrom($('text')).prevented).toBe(false);
  });
});

describe('<ContentProtection> — copying allowed', () => {
  it('adds a «Джерело» line with the page address to longer fragments', () => {
    const $ = page();
    render(<ContentProtection copy={false} menu={false} images={false} keys={false} contacts sourceLabel="Джерело" />);
    const res = copyFrom($('text'));
    expect(res.prevented).toBe(true);
    expect(res.text).toBe(`${ARTICLE}\n\nДжерело: ${window.location.href}`);
  });
  it('leaves short fragments (a phone, a name) alone', () => {
    const $ = page();
    render(<ContentProtection copy={false} menu={false} images={false} keys={false} contacts />);
    expect(copyFrom($('tel')).prevented).toBe(false);
  });
  it('formats the attribution', () => {
    expect(withAttribution('Текст  \n', 'Source', 'https://bp-audit.com.ua/en')).toBe('Текст\n\nSource: https://bp-audit.com.ua/en');
    expect(ATTRIBUTION_MIN_LENGTH).toBeGreaterThan(40);
  });
});
