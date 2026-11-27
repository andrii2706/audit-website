// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const globe = { play: vi.fn(), pause: vi.fn(), frame: vi.fn(), recolour: vi.fn(), destroy: vi.fn() };
vi.mock('@/components/concept/globe', () => ({ createScene: vi.fn(() => globe) }));
vi.mock('@/components/concept/gsap', () => ({
  gsap: { matchMedia: () => ({ add: vi.fn(), revert: vi.fn() }) },
  ScrollTrigger: { refresh: vi.fn() },
  useGSAP: vi.fn(),
  PIN: '(min-height: 500px)',
  PALETTE_EVENT: 'palette',
}));

import HomeHero from '@/components/concept/HomeHero';

let observed: (visible: boolean) => void = () => {};
beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (e: { isIntersecting: boolean }[]) => void) { observed = (v) => cb([{ isIntersecting: v }]); }
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

const props = { head: <h1 id="t">Title</h1>, mediaTitle: 'Copy', mediaFoot: null, labelledBy: 't' };

describe('HomeHero picture', () => {
  it('shows the canvas globe without a video', () => {
    const { container } = render(<HomeHero {...props} />);
    expect(container.querySelector('canvas.media-canvas')).not.toBeNull();
    expect(container.querySelector('video')).toBeNull();
    observed(true);
    expect(globe.play).toHaveBeenCalled();
  });

  it('plays the CMS video instead, muted and only while visible', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const { container } = render(<HomeHero {...props} videoSrc="http://cms.test/uploads/plant.mp4" />);
    const video = container.querySelector('video.media-video') as HTMLVideoElement;
    expect(video.getAttribute('src')).toBe('http://cms.test/uploads/plant.mp4');
    expect(video.muted).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(container.querySelector('canvas')).toBeNull();
    observed(true);
    expect(play).toHaveBeenCalled();
    observed(false);
    expect(pause).toHaveBeenCalled();
  });
});
