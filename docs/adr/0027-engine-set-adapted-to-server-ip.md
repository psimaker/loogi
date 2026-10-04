# 0027 — Engine set adapted to the server IP: yahoo in, dead engines out

* Status: accepted
* Date: 2026-10-04

## Context

The bang survey for the base update (ADR 0025) tested every configured
engine individually from the server IP for the first time since the move
to the VPS (2026-06-21, ADR 0029) — plus ~40 candidates from the upstream
catalog (old and new code in parallel, staging containers, production
untouched).

Two findings aren't caused by the update, but matter for the product:

1. **General has only two working voters** (braveapi, duckduckgo). The
   consensus ranking (ADR 0006/0022) needs more independent sources.
   Candidates with results from the server IP: yahoo, searchch, yandex,
   seznam, dogpile, metacrawler, google cse. Quality sample (Swiss query
   "steuererklaerung kanton zuerich", international query
   "python asyncio tutorial"):
   * **yahoo** (Bing index): good for both — zh.ch resp. realpython,
     docs.python.org.
   * **searchch** (Swiss index): very good for the Swiss query, unusable
     for the international one (fr.wikipedia "Python (langage)",
     git hooks …) — too noisy as a voter for *every* general search.
   * yandex/seznam: regional indexes (RU/CZ), and their privacy profile
     doesn't fit LOOGI; dogpile/metacrawler: metasearch without an index
     of their own; google cse: uses the public CSE ID of a third-party
     site.
2. **Seven active engines return 0 results from the server IP — in the old
   and in the new code**: brave.images, brave.news, brave.videos (HTTP 429,
   Brave HTML as in ADR 0016), duckduckgo images (403), google news
   (CAPTCHA/403), vimeo (403), bandcamp (0 results without an error). They
   cause pointless requests, log entries and suspend cycles on every
   search.

## Decision

* **yahoo** is added to `keep_only` (general) and enabled via the
  override `disabled: false` (upstream default disabled).
* The seven dead engines get the override `disabled: true`. They stay
  loaded (bang and preferences possible); `brave` stays in the list as
  the network donor for brave.* (ADR 0016).
* searchch is deliberately **not** added as a voter (see above).

## Alternatives considered

- **searchch as an additional voter** — Swiss relevance would be
  attractive for loogi.ch, but it makes international queries worse; a
  later option would be `weight` < 1 or bang-only (`!sch`).
- **Remove the dead engines from `keep_only`** — would unload them; with
  `disabled: true` re-enabling stays a one-liner, and a bang shows at any
  time whether the IP gets through again.
- **Residential proxy for blocked engines** (`outgoing.proxies` per
  engine) — technically possible, but an infrastructure decision of its
  own.

## Consequences

* **Positive**: general searches three working sources (braveapi,
  duckduckgo, yahoo); every active engine actually returns results.
* **Positive**: fewer failed requests per search, less log noise.
* **Negative / trade-off**: images (bing images), videos (youtube,
  duckduckgo videos) and news (bing news, duckduckgo news, wikinews,
  reuters) depend on few sources. reuters blocks intermittently
  (DataDome) but stays active as long as it delivers some of the time.
* **Follow-ups**: repeat the survey on every base update (README → drift
  checklist); check the disabled engines via bang as part of it.
