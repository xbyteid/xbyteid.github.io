# Upgrade Notes — 2026-07-24

## Agents & Models

| Agent | Role | Model |
|-------|------|-------|
| Designer | Visual upgrade spec (per-file CSS/HTML changes) | designer (designer agent) |
| Coder | Implementation on 7 files | coder (coder agent) |
| Reviewer | QA checklist (output incomplete; manual QA performed) | reviewer (reviewer agent) |
| Orchestrator | Pipeline coordination, spec corrections, manual QA | ninerouter/dashscope/qwen3.7-max |

## Changelog

### index.html
- Hero `h1`: added `text-shadow` with accent-muted color, hover `translateY(-2px)`, light theme variant
- Submit button: hover `translateY(-1px)`, light theme hover `background: #3b82f6`
- Footer links: hover `color: var(--accent)`, light theme `#2563eb`

### services.html
- Service cards: `transition` on border-color/transform/box-shadow (0.35s ease), hover `border-color: var(--accent)`, `box-shadow` with accent-muted ring + depth, light theme shadow variant
- Service names wrapped in `<strong>` within `.service-header`
- **Umami analytics injected** (was missing)
- Footer links: hover + light variant added

### work.html
- Project cards: `transition` on transform/box-shadow (0.3s ease), hover `translateY(-6px)`, deeper box-shadow, light theme shadow variant
- Projects grid: `gap: 24px`
- **Umami analytics injected** (was missing)
- Footer links: hover + light variant added

### 404.html
- `.error-code`: gradient background with `background-clip: text` + `-webkit-background-clip: text` + `-webkit-text-fill-color: transparent` for gradient text effect
- No light theme changes (404 page has no theme toggle)
- `.home-link` left unchanged (blue button, not text link)
- `.secondary-links a` hover already correct — no changes

### about.html
- Footer links: hover + light variant added

### privacy-policy.html
- Footer links: hover + light variant added

### sitemap.xml
- `lastmod` updated to `2026-07-24` for all 6 main page URLs

## Spec Corrections Applied
Three bugs caught in designer spec before coder implementation:
1. 404 `.error-code` gradient needed `background-clip: text` (was just `background`) — fixed
2. 404 has no light theme — skipped dead `[data-theme='light']` rules
3. `.home-link` is a blue button, not a text link — skipped hover color change that would make invisible text

## Pre-existing (not changed)
- favicon.svg contains `#7c3aed` (purple) in gradient — pre-existing, not introduced by this upgrade
- `focus-visible` and `prefers-reduced-motion` already present on all pages — verified, not re-added
