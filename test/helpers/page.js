import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const SITE_JS = readFileSync(join(repoRoot, 'assets/js/site.js'), 'utf8');

/**
 * Inline first-party /assets/js/site.js so jsdom can execute it without network.
 * External third-party scripts (ads, analytics) stay as-is and are never fetched.
 */
export function readPage(relativePath) {
  const html = readFileSync(join(repoRoot, relativePath), 'utf8');
  return html.replace(
    /<script\b[^>]*\bsrc=["']\/assets\/js\/site\.js["'][^>]*>\s*<\/script>/gi,
    () => `<script>${SITE_JS}</script>`
  );
}

class FakeIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = new Set();
  }

  observe(element) {
    this.observed.add(element);
  }

  unobserve(element) {
    this.observed.delete(element);
  }

  disconnect() {
    this.observed.clear();
  }

  trigger(entries) {
    this.callback(entries, this);
  }
}

/**
 * Loads a page from the repository into jsdom, runs its scripts (inline +
 * inlined first-party site.js) and resolves once DOMContentLoaded has fired.
 * External third-party scripts are never fetched because jsdom resources stay
 * disabled.
 */
export async function loadPage(relativePath, { reduceMotion = false, storage = {}, fetchImpl } = {}) {
  const virtualConsole = new VirtualConsole();
  const consoleErrors = [];
  virtualConsole.on('jsdomError', (error) => consoleErrors.push(error));

  const observers = [];
  const scrolls = [];
  const fetchCalls = [];

  const dom = new JSDOM(readPage(relativePath), {
    url: 'https://xbyteid.codes/',
    runScripts: 'dangerously',
    virtualConsole,
    beforeParse(window) {
      for (const [key, value] of Object.entries(storage)) {
        window.localStorage.setItem(key, value);
      }

      window.matchMedia = (query) => ({
        media: query,
        matches: query.includes('prefers-reduced-motion') ? reduceMotion : false,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
      });

      window.IntersectionObserver = class extends FakeIntersectionObserver {
        constructor(callback, options) {
          super(callback, options);
          observers.push(this);
        }
      };

      window.scrollTo = (options) => scrolls.push(options);

      window.fetch = (...args) => {
        fetchCalls.push(args);
        return fetchImpl ? fetchImpl(...args) : Promise.resolve({ ok: true });
      };
    }
  });

  await new Promise((resolve) => {
    if (dom.window.document.readyState !== 'loading') resolve();
    else dom.window.document.addEventListener('DOMContentLoaded', () => resolve());
  });

  return { dom, window: dom.window, document: dom.window.document, observers, scrolls, fetchCalls, consoleErrors };
}

export function setScrollY(window, value) {
  Object.defineProperty(window, 'scrollY', { value, configurable: true, writable: true });
  window.dispatchEvent(new window.Event('scroll'));
}

export function fireClick(element) {
  const window = element.ownerDocument.defaultView;
  element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

export function fireKey(target, key) {
  const window = target.ownerDocument ? target.ownerDocument.defaultView : target.defaultView;
  const event = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
