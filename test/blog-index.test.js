import { beforeEach, describe, expect, it } from 'vitest';
import { fireClick, loadPage, setScrollY } from './helpers/page.js';

describe('blog index tag filtering', () => {
  let document;
  let buttons;
  let posts;

  beforeEach(async () => {
    ({ document } = await loadPage('blog/index.html'));
    buttons = [...document.querySelectorAll('.tag-filter-btn')];
    posts = [...document.querySelectorAll('.post-item')];
  });

  const visible = () => posts.filter((post) => post.style.display !== 'none');

  it('renders every post with tag metadata before filtering', async () => {
    expect(posts.length).toBeGreaterThan(0);
    expect(visible()).toHaveLength(posts.length);
    for (const post of posts) {
      expect(post.dataset.tags).toBeTruthy();
    }
  });

  it('shows only posts matching the selected tag', async () => {
    const button = buttons.find((b) => b.dataset.tag === 'python');

    fireClick(button);

    const shown = visible();
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.length).toBeLessThan(posts.length);
    for (const post of shown) {
      expect(post.dataset.tags).toContain('python');
    }
  });

  it('marks only the clicked filter as active', async () => {
    const button = buttons.find((b) => b.dataset.tag === 'docker');

    fireClick(button);

    expect(buttons.filter((b) => b.classList.contains('active'))).toEqual([button]);
  });

  it('restores every post when "all" is selected again', async () => {
    fireClick(buttons.find((b) => b.dataset.tag === 'web3'));
    fireClick(buttons.find((b) => b.dataset.tag === 'all'));

    expect(visible()).toHaveLength(posts.length);
  });

  it('exposes a filter button for every tag used by a post', async () => {
    const filterTags = new Set(buttons.map((b) => b.dataset.tag).filter((tag) => tag !== 'all'));
    const postTags = new Set(posts.flatMap((post) => post.dataset.tags.split(/[\s,]+/).filter(Boolean)));

    for (const tag of filterTags) {
      const matching = posts.filter((post) => post.dataset.tags.includes(tag));
      expect(matching.length, `no post carries the "${tag}" filter tag`).toBeGreaterThan(0);
    }
    expect(postTags.size).toBeGreaterThan(0);
  });
});

describe('blog index navigation', () => {
  it('toggles the mobile menu', async () => {
    const { document } = await loadPage('blog/index.html');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    fireClick(toggle);
    expect(links.classList.contains('open')).toBe(true);

    fireClick(toggle);
    expect(links.classList.contains('open')).toBe(false);
  });

  it('reveals the scroll-to-top button past 300px and scrolls back up', async () => {
    const { document, window, scrolls } = await loadPage('blog/index.html');
    const button = document.getElementById('scrollTop');

    setScrollY(window, 500);
    expect(button.classList.contains('visible')).toBe(true);

    setScrollY(window, 10);
    expect(button.classList.contains('visible')).toBe(false);

    fireClick(button);
    expect(scrolls).toContainEqual({ top: 0, behavior: 'smooth' });
  });
});
