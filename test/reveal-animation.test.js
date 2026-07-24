import { describe, expect, it } from 'vitest';
import { loadPage } from './helpers/page.js';

const ANIMATED_PAGES = ['index.html', 'about.html', 'services.html', 'work.html'];

describe.each(ANIMATED_PAGES)('scroll reveal on %s', (page) => {
  it('observes every reveal element and shows it once it intersects', async () => {
    const { document, observers } = await loadPage(page);
    const revealed = [...document.querySelectorAll('.reveal')];

    expect(revealed.length).toBeGreaterThan(0);
    expect(observers).toHaveLength(1);
    const [observer] = observers;
    expect(observer.observed.size).toBe(revealed.length);

    const target = revealed[0];
    observer.trigger([{ isIntersecting: true, target }]);

    expect(target.classList.contains('visible')).toBe(true);
    expect(observer.observed.has(target)).toBe(false);
  });

  it('leaves elements hidden while they are off screen', async () => {
    const { document, observers } = await loadPage(page);
    const target = document.querySelector('.reveal');

    observers[0].trigger([{ isIntersecting: false, target }]);

    expect(target.classList.contains('visible')).toBe(false);
    expect(observers[0].observed.has(target)).toBe(true);
  });

  it('shows everything immediately when reduced motion is preferred', async () => {
    const { document, observers } = await loadPage(page, { reduceMotion: true });
    const revealed = [...document.querySelectorAll('.reveal')];

    expect(observers).toHaveLength(0);
    expect(revealed.every((el) => el.classList.contains('visible'))).toBe(true);
  });
});
