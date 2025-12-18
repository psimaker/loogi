# 0010 — Fonts via fonts.bunny.net, not the Google CDN

* Status: accepted
* Date: 2025-12-18

## Context

The LOOGI design uses two web fonts:

* **Inter Tight** (weights 300/400/500/600/700)
* **JetBrains Mono** (weights 400/500)

The prototype loads them from `fonts.googleapis.com`. That's a problem:

* **Privacy**: Google sees every request (user IP, user agent, referrer
  loogi.ch) — untenable for a search engine that wants privacy as a
  value.
* **GDPR / Swiss DSG**: legally awkward in .ch / .eu without a cookie or
  consent banner.
* **CDN dependency**: third-party outage = LOOGI without fonts.

Three options:

1. **Self-host the woff2 files** in the theme's static folder.
2. **fonts.bunny.net** — GDPR-compliant drop-in for Google Fonts, identical
   URL syntax, no tracking
   ([fonts.bunny.net/about](https://fonts.bunny.net/about)).
3. **Stay on the Google CDN.**

## Decision

I use **fonts.bunny.net**.

## Alternatives considered

* **Self-hosting** — cleanest path, but it means:
  - pulling woff2 files by hand from the upstream repos
    ([Inter](https://github.com/rsms/inter),
    [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono))
  - keeping 14 files (5 weights × 1 family + 2 weights × 1 family, each
    woff2) in the repo and updating them manually on every font release
  - more bytes in the repo, more build logic in the image

  If Bunny ever introduces tracking or disappears, I can self-host then.
  Until that point: too much friction for a marginal privacy gain over
  Bunny.
* **Google CDN** — rejected, see privacy above.

## Consequences

* **Positive**: no tracking by Google. Identical CSS API. No build step
  and no binaries in the repo. Bunny is GDPR-compliant per their privacy
  statement.
* **Negative / trade-off**: I depend on Bunny's availability — a single
  point of failure for fonts. The CSS sets a fallback chain
  (`font-family: 'Inter Tight', -apple-system, system-ui, sans-serif`)
  so the UI degrades to system fonts during a Bunny outage instead of
  breaking.
* **Follow-ups**: if Bunny ever starts tracking or shuts down, switch to
  self-hosting and supersede this ADR.
