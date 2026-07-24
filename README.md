# xbyteid.github.io

Personal portfolio + blog for **[xbyteid.codes](https://xbyteid.codes)**.

Hand-authored static site. No framework, no build step. Deployed via GitHub Pages.

## Stack

- HTML / CSS / vanilla JS
- Shared chrome: `assets/css/base.css`, `assets/css/post.css`, `assets/js/site.js`
- Tests: [Vitest](https://vitest.dev) + [jsdom](https://github.com/jsdom/jsdom)
- Analytics / ads: Umami + AdSense (loaded only in the browser)

## Layout

```
.
├── index.html              # home + contact + terminal egg
├── about.html · services.html · work.html · privacy-policy.html · 404.html
├── assets/
│   ├── css/base.css        # tokens, nav, footer, reveal
│   ├── css/post.css        # blog post chrome
│   └── js/site.js          # theme, mobile nav, reveal, anchors, form
├── blog/                   # posts + index + feed.xml
├── test/                   # vitest suite (loads real HTML)
├── .github/workflows/      # CI tests + Pages deploy
└── .agents/skills/         # agent testing notes
```

Root-absolute paths (`/assets/...`, `/blog/`) — always serve over HTTP, not `file://`.

## Local

```bash
# preview
python3 -m http.server 8000
# → http://localhost:8000/

# tests (Node 20+)
npm install
npm test          # once
npm run test:watch
```

Extensionless URLs like `/services` work on GitHub Pages but 404 on the plain Python server — use `/services.html` locally.

## Tests

Suite loads real HTML into jsdom and exercises first-party behaviour (theme, nav, terminal egg, contact form, blog filters, static asset checks).

`test/helpers/page.js` inlines `assets/js/site.js` so external first-party scripts still run under jsdom (ads/analytics stay skipped).

Known content debt lives in `test/fixtures/known-issues.json` (dead links, feed/sitemap gaps). Suite fails on *new* instances only — fix a bug → remove its entry.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs target **`main`**.

## License

[MIT](./LICENSE) — © xbyteid
