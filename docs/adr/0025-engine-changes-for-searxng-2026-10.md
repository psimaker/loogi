# 0025 — Engine changes for the base update to 2026.10.4

* Status: accepted
* Date: 2026-10-04

## Context

In the update 2026.6.17 → 2026.10.4, upstream changed engine defaults and
engine code that would have shifted our curated selection (ADR 0006, 0016,
0022) silently. In addition, for the first time since the move to the VPS
(2026-06-21, ADR 0029), **every configured engine was tested individually
via bang from the server IP** — old and new code in parallel staging
containers, so that IP blocks and update regressions can be told apart.

Findings (2026-10-04, server IP):

| Engine | 2026.6.17 | 2026.10.4 | Cause |
|--------|-----------|-----------|-------|
| duckduckgo | CAPTCHA | ok (intermittent CAPTCHA) | upstream fix 765a9999d |
| startpage (+news/images) | CAPTCHA | CAPTCHA, upstream `inactive` | IP; Anubis PoW difficulty 5 |
| mojeek | 403 | 403, upstream `inactive` | IP (even with a solved Altcha) |
| qwant | 403 | 403 | DataDome, IP |
| google images | **ok (100)** | **403** | upstream rebuilt it on the WML/Nokia path |
| bing images | – | ok (34) | active upstream |
| reuters | ok / 401 | 401 | DataDome, IP — intermittent, both versions |

So after the update the **images tab would have been empty**, among other
things: in production only Google Images actually delivered there
(brave.images 429, duckduckgo images 403, startpage/qwant blocked).

## Decision

1. **startpage, startpage news, startpage images, mojeek, qwant**: no
   override anymore, the upstream default applies (startpage*/mojeek
   `inactive: true`, qwant `disabled: true`). That's the rule laid down in
   ADR 0022 ("if one starts blocking: back to disabled"), which has now
   come true. startpage was deliberately NOT turned up via
   `max_difficulty`: Anubis difficulty 5 costs a measured average of 3.6 s
   CPU (worst case ~28 s) per solve here, in the request path with a 3 s
   timeout, on a shared 2-vCPU host — and the IP gets CAPTCHA anyway.
2. **google images → bing images** in `keep_only` (the images tab keeps
   working; upstream itself lists Google Images as disabled).
3. **braveapi SafeSearch**: `safesearch_map: {0: moderate, 1: moderate,
   2: strict}`. Upstream (#6799) now sends `off` for level 0; previously no
   parameter at all was sent for 0 → Brave default `moderate`. The previous
   behavior for default users stays — operator decision on 2026-10-04 (the
   alternatives were `off` = upstream semantics, or a global
   `safe_search: 1`).
4. **`outgoing.pool_maxsize` removed** — dropped with the migration to
   curl_cffi, it would be ignored silently.

## Alternatives considered

- **Override the upstream `inactive` for startpage/mojeek** — checked and
  rejected: both return 0 results from the server IP, no matter which code.
- **Ship the old `google_images.py` (Google Go API) as an engine module of
  our own** — still works from our IP, but it would be a fork of an engine
  upstream deliberately gave up. An option if the image quality of Bing
  Images isn't enough.
- **Add new web engines (searchch, yahoo, …) right away** — functional in
  the survey, but a product decision (precision, ADR 0006) and not caused
  by the update; decided separately.

## Consequences

* **Positive**: no silent engine losses through the update; the images tab
  works; the config says again what is actually running. General runs on
  braveapi + duckduckgo (before: effectively braveapi only, because
  duckduckgo was blocked in the old code).
* **Negative / trade-off**: general would only have two voters — the
  consensus ranking (ADR 0022) would be thin. That's why yahoo joins as a
  third source (separate decision, ADR 0027).
* **Follow-ups**: repeat the bang survey on every base update (README →
  drift checklist). Dead engines outside this update (brave.images/news/
  videos 429, google news, vimeo, bandcamp, duckduckgo images) are not
  caused by the update and are decided in ADR 0027.
