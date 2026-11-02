'use client';

import { useEffect } from 'react';

type Props = { copy: boolean; menu: boolean; images: boolean; keys: boolean; contacts: boolean };

/** Where people may still select, copy and right-click: form fields, and (optionally) phone/e-mail links. */
function isAllowed(target: EventTarget | null, contacts: boolean) {
  const el = target instanceof Element ? target : (target as Node | null)?.parentElement ?? null;
  if (!el) return false;
  if (el.closest('input, textarea, select, [contenteditable="true"], [data-allow-copy]')) return true;
  return contacts && !!el.closest('a[href^="tel:"], a[href^="mailto:"]');
}

/** Selection inside allowed elements only (copying a phone number is fine, copying an article is not). */
function selectionAllowed(contacts: boolean) {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return true;
  return isAllowed(sel.anchorNode, contacts) && isAllowed(sel.focusNode, contacts);
}

/**
 * JavaScript half of the content protection (the CSS half lives in globals.css under `html[data-protect]`):
 * blocks copy/cut, the context menu, dragging images and the save/print/view-source/devtools shortcuts.
 * Nothing in a browser can make copying impossible; this stops casual copying and simple scrapers.
 */
export default function ContentProtection({ copy, menu, images, keys, contacts }: Props) {
  useEffect(() => {
    const ac = new AbortController();
    const on = <K extends keyof DocumentEventMap>(type: K, fn: (e: DocumentEventMap[K]) => void) =>
      document.addEventListener(type, fn, { capture: true, signal: ac.signal });

    if (copy) {
      const guard = (e: ClipboardEvent) => {
        if (isAllowed(e.target, contacts) && selectionAllowed(contacts)) return;
        e.preventDefault();
        e.clipboardData?.setData('text/plain', '');
      };
      on('copy', guard);
      on('cut', guard);
      on('selectstart', (e) => {
        if (!isAllowed(e.target, contacts)) e.preventDefault();
      });
    }
    if (menu) {
      on('contextmenu', (e) => {
        if (!isAllowed(e.target, contacts)) e.preventDefault();
      });
    }
    if (images) {
      on('dragstart', (e) => {
        if (e.target instanceof HTMLImageElement || (e.target instanceof Element && e.target.closest('a, picture, svg'))) e.preventDefault();
      });
    }
    if (keys || copy) {
      on('keydown', (e) => {
        const k = e.key.toLowerCase();
        const mod = e.ctrlKey || e.metaKey;
        const inField = isAllowed(e.target, false);
        // Copy, cut, select all: blocked outside form fields.
        if (copy && mod && !e.shiftKey && ['c', 'x', 'a'].includes(k) && !inField) {
          if (k === 'c' && selectionAllowed(contacts)) return;
          e.preventDefault();
          return;
        }
        if (!keys) return;
        const devtools = e.key === 'F12' || (mod && e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) || (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(k));
        // Save page, print, view source.
        const pageKeys = mod && !e.shiftKey && ['s', 'p', 'u'].includes(k);
        if (devtools || pageKeys) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    }
    return () => ac.abort();
  }, [copy, menu, images, keys, contacts]);

  return null;
}
