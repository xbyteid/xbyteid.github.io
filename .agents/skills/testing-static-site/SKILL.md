---
name: testing-static-site
description: Serve and test the xbyteid.codes static site locally — theme toggle, mobile nav, blog, terminal easter egg, contact form — including before/after pixel diffs against main. Use when verifying any HTML/CSS/JS change in this repo.
---

# Testing the xbyteid.codes static site

The repo is hand-authored HTML/CSS/JS with **no build step and no package manifest** — there is no
`npm install`, no lint command and no test suite. Verification is entirely runtime: serve the files
and exercise them in a browser.

## Serving locally

Root-absolute paths (`/assets/css/base.css`, `/blog/`) are used throughout, so `file://` will **not**
work. Always serve over HTTP from the repo root:

```bash
cd <repo> && python3 -m http.server 8899
```

To compare against the base branch at the same time, use a worktree on a second port — this avoids
stashing or switching branches mid-test:

```bash
git worktree add /tmp/wt-main main
(cd /tmp/wt-main && python3 -m http.server 8898 &)
```

This two-port setup is the fastest way to prove whether a bug you find is a regression or
pre-existing. Do that check *before* reporting anything as broken.

## Before/after pixel diffs

For refactors that should not change rendering, screenshot every page on both ports and diff them.
Playwright + Pillow may need installing (`pip install playwright pillow && python3 -m playwright install chromium`).
Render each page at both widths and both themes (set `localStorage.theme` then reload):

- desktop 1280px and mobile 390px
- dark (default) and light (`data-theme="light"` on `<html>`)

Expect small non-zero diffs even on an unchanged page: the homepage has an animated mesh gradient
that dithers by ±1/255, and reveal-on-scroll animations depend on load timing. Judge by **max RGB
delta**, not by "any pixel differs" — a delta of 1 is anti-aliasing, not a layout change.

## UI paths for each feature

| Feature | How to trigger | What to assert |
|---|---|---|
| Theme toggle | `#themeToggle` in the nav | `<html data-theme="light">` toggles; **navigate to another page** to prove persistence via `localStorage` |
| Mobile nav | `#navToggle` hamburger, only rendered ≤768px | `#navLinks.open`, `aria-expanded` flips; Escape closes |
| Reveal animation | scroll | `.reveal` gains `.visible` |
| Anchor scroll | "Get in touch" / `contact` nav link | target heading lands **below** the fixed nav, not under it |
| Blog tag filter | `.tag-filter-btn` on `/blog/` | non-matching `.post-item` get `display:none` |
| Scroll-to-top | scroll >300px on `/blog/` | button gains `.visible`, click returns `scrollY` to 0 |
| Terminal easter egg | press `` ` `` on `/` | `#termEgg` shows; type into `#termEggInput`: `help`, `ls`, `status`, `whoami`, `projects`, `clear`; Escape closes |
| Contact form | `#contactForm` on `/#contact` | page must **not** navigate away; `#formStatus` shows a message |

When driving this in a GUI browser, prefer real clicks/keypresses over devtools — the theme button,
hamburger and terminal are all keyboard/mouse reachable.

## Gotchas

- **The theme toggle is hidden on mobile widths on the blog pages** (`.nav-links { display:none }`
  swallows it). Automated clicks time out at 390px — guard with a visibility check before clicking.
- **Formspree is likely unreachable from the VM**, so the contact form usually lands on its error
  branch (`error — try telegram @xbyteid`). That still proves the AJAX handler is attached, because
  a detached handler would do a native POST and navigate away. Do not report a successful send
  unless you actually saw the success message.
- **Umami analytics is loaded from bare IPs over HTTPS**, so every page logs
  `ERR_CERT_COMMON_NAME_INVALID` in the console. Filter these out before asserting "no console
  errors" — they are unrelated to any code change.
- **Script ordering matters.** Shared behaviour is loaded via `<script src="/assets/js/site.js">`
  without `defer`, so any element it queries must appear *earlier* in the document. At the time of
  writing `privacy-policy.html` places its `.scroll-top` button after the script, so that button
  never activates (also broken on `main`). If a widget silently does nothing, check element-vs-script
  order first.
- **`CONTRIBUTING.md` says to target the `dev` branch**, but only `main` exists on the remote. PRs
  go to `main` unless a `dev` branch appears.
- **CI does not run on pull requests.** `.github/workflows/deploy.yml` only runs on push to `main`,
  so a PR showing zero checks is expected, not a failure.

## Devin Secrets Needed

None. The site is fully static and every flow above can be tested against a local HTTP server with
no credentials.
