# Contributing to xbyteid.github.io

## Getting Started
1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run `npm test`
5. Submit a pull request to `main`

## Testing
The site has no build step. Shared behaviour lives in `assets/js/site.js`; page-specific
scripts stay inline. Both are covered by a
[Vitest](https://vitest.dev) + [jsdom](https://github.com/jsdom/jsdom) suite that loads the real HTML files.

```bash
npm install
npm test          # run the suite once
npm run test:watch
npm run coverage
```

Note that `npm run coverage` only instruments the Node-side test helpers: the page scripts run inside jsdom,
so v8 cannot attribute coverage to them. Behavioural assertions, not the coverage number, are the signal here.

`test/fixtures/known-issues.json` lists content bugs that already exist on `main` (dead links, sitemap and
feed gaps). The suite tolerates those entries so it stays green, but fails on any *new* occurrence — when you
fix one, delete it from that file.

## Guidelines
- Keep commits atomic and well-described
- Follow existing code style and conventions
- Add tests for new features when applicable
- Update documentation if needed

## Reporting Issues
- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- Be as specific as possible

## Pull Requests
- Reference related issues in your PR description
- Keep PRs focused on a single change
- Ensure all checks pass before requesting review

