import { ViewTransition, type ReactNode } from 'react';

/**
 * Page transitions. A template (unlike a layout) gets a fresh instance on every navigation, so the
 * <ViewTransition> enter/exit fire: the old page fades up and out quickly, the new one rises in softly.
 * Animations live in globals.css (::view-transition-*(.page)); the header and mobile action bar are
 * named separately so they stay still. Browsers without the View Transitions API just swap pages.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
