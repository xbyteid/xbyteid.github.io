---
name: testing-static-site
description: How to serve, run tests against, and browser-test the xbyteid.github.io static portfolio site (terminal easter egg, theme toggle, mobile nav, blog filters).
---

# Testing xbyteid.github.io

Pure static site — **no build step**, no framework, no credentials required. Shared
behaviour lives in `assets/js/site.js`; page-specific logic (terminal egg, blog tag
filters) stays in inline `<script>` blocks.

## Serving locally

```bash
cd <repo> && python3 -m http.server 8000
```

Then browse http://localhost:8000/. Note the server is path-exact: extensionless URLs
like `/services` and `/work` return 404 even though they work on GitHub Pages with
`services.html`. Some nav links use extensionless paths, so expect those 404s locally.

## Unit tests

```bash
npm install && npm test    # vitest + jsdom, ~5s
```

`test/fixtures/known-issues.json` is an allow-list of **pre-existing content bugs**
(broken internal links, sitemap gaps, posts missing from the homepage feed). The suite
asserts no *new* instances appear. Before reporting a broken link as a regression, check
this file — it is probably already documented and intentionally not fixed.

## Feature entry points (for browser testing)

| Feature | Where | How to trigger |
|---|---|---|
| Terminal easter egg | `index.html`, `#termEgg` | Press `` ` `` (xdotool key `grave`) anywhere except a text field. Commands: `help`, `ls`, `status`, `whoami`, `projects`, `clear`. Close via Escape, the `×` button, or a second `` ` ``. |
| Theme toggle | every page, `#themeToggle` | Click the moon/sun button in the nav. Persists via `localStorage['theme']`. |
| Mobile nav | `#navToggle` / `#navLinks` | Only rendered below the mobile breakpoint — resize the window (`wmctrl -r :ACTIVE: -e 0,0,0,460,760`) rather than using devtools device mode. Check `aria-expanded`. |
| Blog tag filter | `blog/index.html`, `.tag-filter-btn` | Click a tag chip; posts are hidden via inline `style.display`, matched against `data-tags`. |
| Scroll-to-top | `blog/index.html`, `#scrollTop` | Appears once `window.scrollY > 300`. |

## Gotchas

- The easter egg element uses **both** a `.open` class and the `hidden` attribute. A bug
  in one but not the other can make the panel look closed while still being in the
  accessibility tree — verify the element actually disappears from the DOM, not just
  visually.
- Keyboard handling deliberately ignores `` ` `` when focus is in an `INPUT`, `TEXTAREA`,
  or contenteditable (except the terminal's own input). Always test this suppression.
- When the panel is open its position shifts as content grows; re-screenshot before
  clicking the `×` button or the click will miss.
- Read the browser console via the CDP log stream instead of opening the DevTools panel —
  keeps recordings clean and the site logs nothing on a healthy load, so any entry is a
  real error.

## Devin Secrets Needed

None. The site is fully static and requires no login, API keys, or environment variables.

## Suggested blueprint

No blueprint exists for this repo. A minimal one:

```yaml
maintenance: |
  npm install
knowledge:
  - name: test
    contents: |
      npm test   # vitest + jsdom, 201 tests
  - name: serve
    contents: |
      python3 -m http.server 8000   # static site, no build step
```
