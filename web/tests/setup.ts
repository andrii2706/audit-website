import { afterEach } from 'vitest';

// Component tests (jsdom): unmount after each test so documents don't leak between tests.
afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
