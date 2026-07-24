import { describe, expect, it } from 'vitest';
import { fireClick, fireKey, loadPage } from './helpers/page.js';

const PAGES_WITH_NAV = [
  'index.html',
  'about.html',
  'services.html',
  'work.html',
  'privacy-policy.html'
];

describe.each(PAGES_WITH_NAV)('mobile navigation on %s', (page) => {
  it('opens and closes the menu when the toggle is clicked', async () => {
    const { document } = await loadPage(page);
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    expect(links.classList.contains('open')).toBe(false);

    fireClick(toggle);
    expect(links.classList.contains('open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    fireClick(toggle);
    expect(links.classList.contains('open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the menu after following a nav link', async () => {
    const { document } = await loadPage(page);
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    fireClick(toggle);
    fireClick(links.querySelector('a'));

    expect(links.classList.contains('open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the menu on Escape', async () => {
    const { document } = await loadPage(page);
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    fireClick(toggle);
    fireKey(document, 'Escape');

    expect(links.classList.contains('open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('anchor scrolling on index.html', () => {
  it('smooth scrolls to in-page targets and closes the menu', async () => {
    const { document, scrolls } = await loadPage('index.html');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    const anchor = [...document.querySelectorAll('a[href^="#"]')].find(
      (a) => a.getAttribute('href') !== '#' && document.querySelector(a.getAttribute('href'))
    );

    fireClick(toggle);
    fireClick(anchor);

    expect(scrolls).toHaveLength(1);
    expect(scrolls[0].behavior).toBe('smooth');
    expect(links.classList.contains('open')).toBe(false);
  });

  it('uses instant scrolling when the visitor prefers reduced motion', async () => {
    const { document, scrolls } = await loadPage('index.html', { reduceMotion: true });
    const anchor = [...document.querySelectorAll('a[href^="#"]')].find(
      (a) => a.getAttribute('href') !== '#' && document.querySelector(a.getAttribute('href'))
    );

    fireClick(anchor);

    expect(scrolls[0].behavior).toBe('auto');
  });
});
