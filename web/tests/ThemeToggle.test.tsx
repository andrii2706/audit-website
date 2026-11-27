// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeToggle, { ThemeBoot, themeBootScript } from '@/components/concept/ThemeToggle';

let systemDark = false;
let systemListener: (() => void) | null = null;
beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  vi.stubGlobal('matchMedia', (q: string) => ({
    get matches() { return q.includes('dark') && systemDark; },
    media: q,
    addEventListener: (_: string, cb: () => void) => { systemListener = cb; },
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => { vi.unstubAllGlobals(); systemDark = false; systemListener = null; });

const runBoot = () => new Function(themeBootScript)();

describe('theme boot script', () => {
  it('follows the device setting when nothing was chosen', () => {
    systemDark = true;
    runBoot();
    expect(document.documentElement.dataset.theme).toBe('dark');
    systemDark = false;
    runBoot();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
  it('prefers the visitor’s choice and ignores junk in storage', () => {
    systemDark = true;
    localStorage.setItem('bp-theme', 'light');
    runBoot();
    expect(document.documentElement.dataset.theme).toBe('light');
    localStorage.setItem('bp-theme', 'purple');
    runBoot();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('ThemeToggle', () => {
  it('switches the theme, remembers it and changes its label', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    render(<ThemeToggle locale="uk" />);
    const btn = screen.getByRole('button', { name: 'Увімкнути темну тему' });
    fireEvent.click(btn);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('bp-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Увімкнути світлу тему' })).toBe(btn);
    fireEvent.click(btn);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('bp-theme')).toBe('light');
  });
  it('uses English labels on the English site', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    render(<ThemeToggle locale="en" />);
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeTruthy();
  });
});

describe('ThemeBoot', () => {
  it('keeps following the device until the visitor picks a theme', () => {
    render(<ThemeBoot />);
    systemDark = true;
    act(() => systemListener?.());
    expect(document.documentElement.dataset.theme).toBe('dark');
    localStorage.setItem('bp-theme', 'dark');
    systemDark = false;
    act(() => systemListener?.());
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
