import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { readPage, repoRoot } from './helpers/page.js';
import knownIssues from './fixtures/known-issues.json' with { type: 'json' };

const SITE_ORIGIN = 'https://xbyteid.codes';

const HTML_PAGES = [
  'index.html',
  'about.html',
  'services.html',
  'work.html',
  'privacy-policy.html',
  '404.html',
  'blog/index.html',
  ...readdirSync(join(repoRoot, 'blog'))
    .filter((file) => file.endsWith('.html') && file !== 'index.html')
    .map((file) => `blog/${file}`)
];

const parse = (relativePath) => new JSDOM(readPage(relativePath)).window.document;

/** Maps a site-absolute URL or relative href onto a path inside the repository. */
function toRepoPath(href, fromDir) {
  const url = new URL(href, `${SITE_ORIGIN}/${fromDir ? `${fromDir}/` : ''}`);
  if (url.origin !== SITE_ORIGIN) return null;
  const pathname = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
  return pathname.replace(/^\//, '');
}

describe.each(HTML_PAGES)('%s', (page) => {
  const document = parse(page);

  it('declares a title, and — for indexable pages — a description and canonical URL', () => {
    expect(document.title.trim()).not.toBe('');

    // The 404 page is intentionally not indexed, so it carries neither.
    if (page === '404.html') return;

    expect(document.querySelector('meta[name="description"]')?.content.trim()).toBeTruthy();
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical, 'missing canonical link').not.toBeNull();
    expect(canonical.href.startsWith(SITE_ORIGIN)).toBe(true);
  });

  it('declares the viewport and charset needed for mobile rendering', () => {
    expect(document.querySelector('meta[charset]')).not.toBeNull();
    expect(document.querySelector('meta[name="viewport"]')?.content).toContain('width=device-width');
  });

  it('contains only parseable JSON-LD blocks', () => {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      expect(() => JSON.parse(script.textContent)).not.toThrow();
      expect(JSON.parse(script.textContent)['@context']).toBe('https://schema.org');
    }
  });

  it('links only to internal pages that exist', () => {
    const fromDir = page.includes('/') ? page.split('/').slice(0, -1).join('/') : '';
    const missing = [];

    for (const anchor of document.querySelectorAll('a[href]')) {
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      const target = toRepoPath(href, fromDir);
      if (target === null) continue;
      if (!existsSync(join(repoRoot, target))) missing.push(href);
    }

    expect(missing.filter((href) => !knownIssues.brokenInternalLinks.includes(href))).toEqual([]);
  });

  it('gives every image alt text and an existing source', () => {
    const fromDir = page.includes('/') ? page.split('/').slice(0, -1).join('/') : '';

    for (const image of document.querySelectorAll('img')) {
      expect(image.hasAttribute('alt'), `<img src="${image.getAttribute('src')}"> lacks alt text`).toBe(true);
      const src = toRepoPath(image.getAttribute('src'), fromDir);
      if (src !== null) expect(existsSync(join(repoRoot, src)), `missing image ${src}`).toBe(true);
    }
  });
});

describe('sitemap.xml', () => {
  const document = new JSDOM(readPage('sitemap.xml'), { contentType: 'text/xml' }).window.document;
  const urls = [...document.querySelectorAll('url')];

  it('parses as XML and lists URLs', () => {
    expect(document.querySelector('parsererror')).toBeNull();
    expect(urls.length).toBeGreaterThan(0);
  });

  it('points every entry at an existing page on the canonical origin', () => {
    for (const url of urls) {
      const loc = url.querySelector('loc').textContent;
      expect(loc.startsWith(SITE_ORIGIN)).toBe(true);
      if (knownIssues.sitemapMissingPages.includes(loc)) continue;
      expect(existsSync(join(repoRoot, toRepoPath(loc))), `sitemap lists missing page ${loc}`).toBe(true);
    }
  });

  it('uses valid lastmod dates and priorities', () => {
    for (const url of urls) {
      expect(url.querySelector('lastmod').textContent).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const priority = Number(url.querySelector('priority').textContent);
      expect(priority).toBeGreaterThanOrEqual(0);
      expect(priority).toBeLessThanOrEqual(1);
    }
  });

  it('has no duplicate entries', () => {
    const locs = urls.map((url) => url.querySelector('loc').textContent);
    expect(new Set(locs).size).toBe(locs.length);
  });

  it('does not advertise pages that robots.txt disallows', () => {
    const disallowed = readFileSync(join(repoRoot, 'robots.txt'), 'utf8')
      .split('\n')
      .filter((line) => line.startsWith('Disallow:'))
      .map((line) => line.replace('Disallow:', '').trim())
      .filter(Boolean);

    for (const url of urls) {
      const path = new URL(url.querySelector('loc').textContent).pathname;
      if (knownIssues.sitemapDisallowedByRobots.includes(path)) continue;
      expect(disallowed).not.toContain(path);
    }
  });
});

describe('blog/feed.xml', () => {
  const document = new JSDOM(readPage('blog/feed.xml'), { contentType: 'text/xml' }).window.document;
  const items = [...document.querySelectorAll('item')];

  it('is a well-formed RSS 2.0 channel', () => {
    expect(document.querySelector('parsererror')).toBeNull();
    expect(document.documentElement.getAttribute('version')).toBe('2.0');
    expect(document.querySelector('channel > title').textContent.trim()).not.toBe('');
    expect(items.length).toBeGreaterThan(0);
  });

  it('gives every item a title, description and existing link', () => {
    for (const item of items) {
      expect(item.querySelector('title').textContent.trim()).not.toBe('');
      expect(item.querySelector('description').textContent.trim()).not.toBe('');
      const link = item.querySelector('link').textContent;
      expect(existsSync(join(repoRoot, toRepoPath(link))), `feed links missing post ${link}`).toBe(true);
    }
  });

  it('uses RFC 822 publication dates', () => {
    for (const item of items) {
      const pubDate = item.querySelector('pubDate').textContent;
      expect(Number.isNaN(Date.parse(pubDate)), `unparseable pubDate "${pubDate}"`).toBe(false);
    }
  });

  it('covers every published blog post', () => {
    const linked = new Set(items.map((item) => toRepoPath(item.querySelector('link').textContent)));
    const posts = readdirSync(join(repoRoot, 'blog'))
      .filter((file) => file.endsWith('.html') && file !== 'index.html')
      .map((file) => `blog/${file}`);

    const missing = posts.filter((post) => !linked.has(post) && !knownIssues.postsMissingFromFeed.includes(post));

    expect(missing).toEqual([]);
  });
});

describe('robots.txt', () => {
  const robots = readPage('robots.txt');

  it('allows crawling and advertises the sitemap', () => {
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });

  it('only disallows paths that exist', () => {
    const disallowed = robots
      .split('\n')
      .filter((line) => line.startsWith('Disallow:'))
      .map((line) => line.replace('Disallow:', '').trim())
      .filter(Boolean);

    for (const path of disallowed) {
      expect(existsSync(join(repoRoot, toRepoPath(path))), `robots.txt disallows missing ${path}`).toBe(true);
    }
  });
});
