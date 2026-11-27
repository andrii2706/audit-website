'use client';

import { useEffect } from 'react';

/**
 * Team page: when the address points at a member (/team#m-…, from a card on the home page), marks that card
 * (data-hit, styled in person.css) and opens its biography. Needed in JS because Next.js navigates with pushState,
 * which doesn't update the CSS :target state. Runs after hydration and only touches the native <details> state and a
 * data attribute React doesn't render, so there's nothing to mismatch. Scrolling to the card is Next's own.
 */
export default function OpenTargetBio() {
  useEffect(() => {
    const mark = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      document.querySelectorAll('.team-page [data-hit]').forEach((el) => el.removeAttribute('data-hit'));
      if (!id.startsWith('m-')) return;
      const card = document.getElementById(id);
      if (!card) return;
      card.setAttribute('data-hit', '');
      const bio = card.querySelector('details');
      if (bio) bio.open = true;
    };
    mark();
    window.addEventListener('hashchange', mark);
    window.addEventListener('popstate', mark);
    return () => {
      window.removeEventListener('hashchange', mark);
      window.removeEventListener('popstate', mark);
    };
  }, []);
  return null;
}
