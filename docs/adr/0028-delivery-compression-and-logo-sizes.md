# 0028 — Delivery: compression in Caddy, logo files at display size

* Status: accepted
* Date: 2026-10-04

## Context

Two findings about page weight from the review on 2026-10-04, both
independent of the SearXNG update:

1. **No compression.** SearXNG doesn't compress dynamic responses, and the
   Caddy block for loogi.ch had no `encode`. Measured: a results page
   ~61 KB (gzip ~9 KB), `loogi.css` 38 KB (gzip ~10 KB), `loogi.js` 9 KB
   (gzip ~3.4 KB) — all delivered uncompressed.
2. **Oversized logo files.** `loogi-wordmark.png` was 6750 × 3375 px
   (217 KB), displayed at max. 144 px height (landing page desktop;
   otherwise 88/56/40/28 px). `loogi-mark.png` was 1563 × 1563 px (107 KB)
   and serves as favicon, Apple touch, manifest and OpenSearch icon. Both
   are loaded on every first visit; the wordmark is the largest element of
   the landing page (LCP).

The logos are part of the hardcoded design (ADR 0002) — changes only on
explicit request. Shrinking them (visually identical) was approved on
2026-10-04.

## Decision

* **Caddy** (the shared edge proxy's Caddyfile — a separate stack, not
  part of this repo): `encode zstd gzip` in the `loogi.ch, www.loogi.ch`
  block. Caddy then only compresses compressible types (HTML, CSS, JS,
  JSON, SVG …), no images. Only the loogi block; the other sites on the
  proxy stay untouched.
* **Logos** rescaled (Lanczos, RGBA, lossless PNG), file names unchanged:
  * wordmark 864 × 432 px (= 3× the largest display size) — 32 KB
  * mark 512 × 512 px (PWA maximum, covers favicon/touch icon) — 28 KB

  `sizes` in `manifest.webmanifest` and in the `manifest.json` template
  corrected to `512x512`. Pixel comparison at display size (144 px): max.
  5/255 deviation per channel, mean < 0.05 — resampling rounding.

## Alternatives considered

- **Generate pre-compressed `.gz`/`.br` for the theme in the Dockerfile**
  (WhiteNoise serves them) — only covers static files, not the dynamic
  HTML/JSON responses, and it would be a build step for the theme.
- **Several icon sizes (16/32/180/192/512)** — better for favicons, but
  needs template changes in `base.html`; one 512 file is enough for all
  uses.
- **WebP/AVIF** — smaller, but a format change is a design/compatibility
  question (favicon, Apple touch icon).

## Consequences

* **Positive**: ~290 KB less image data on the first visit to the landing
  page; HTML/CSS/JS 50–86 % smaller over the wire (verified live: CSS
  38 → 11 KB, privacy page 5.6 → 2.8 KB).
* **Negative / trade-off**: the compression lives outside this repo in the
  edge proxy — if the proxy is ever rebuilt, `encode` has to move along.
  The original logo files are kept in a local backup.
* **Follow-ups**: if a new logo is delivered, check it in at display size
  right away (wordmark 864 × 432, mark 512 × 512).
