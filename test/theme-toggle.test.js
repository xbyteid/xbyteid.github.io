import { describe, expect, it } from 'vitest';
import { fireClick, loadPage } from './helpers/page.js';

const THEMED_PAGES = [
  'index.html',
  'about.html',
  'services.html',
  'work.html',
  'privacy-policy.html'
];

describe.each(THEMED_PAGES)('theme toggle on %s', (page) => {
  it('defaults to the dark theme when nothing is stored', async () => {
    const { document } = await loadPage(page);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('restores a stored light theme on load', async () => {
    const { document } = await loadPage(page, { storage: { theme: 'light' } });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('switches to light and persists the choice', async () => {
    const { document, window } = await loadPage(page);

    fireClick(document.getElementById('themeToggle'));

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  it('switches back to dark and persists the choice', async () => {
    const { document, window } = await loadPage(page, { storage: { theme: 'light' } });

    fireClick(document.getElementById('themeToggle'));

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(window.localStorage.getItem('theme')).toBe('dark');
  });
});

describe('theme toggle on blog/index.html', () => {
  it('restores a stored light theme on load', async () => {
    const { document } = await loadPage('blog/index.html', { storage: { theme: 'light' } });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggles the theme and updates the button label', async () => {
    const { document, window } = await loadPage('blog/index.html');
    const button = document.getElementById('themeToggle');

    fireClick(button);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
    expect(button.textContent).toBe('☀️');

    fireClick(button);
    expect(document.documentElement.getAttribute('data-theme')).toBe('');
    expect(window.localStorage.getItem('theme')).toBe('dark');
    expect(button.textContent).toBe('🌙');
  });
});
