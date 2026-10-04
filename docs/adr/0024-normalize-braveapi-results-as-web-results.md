# 0024 — Normalize braveapi results as web results (upstream regression)

* Status: accepted
* Date: 2026-10-04

## Context

Since upstream commit 4d9c982cd ("brave-based engines: reuse result
parsing methods", #6688, 2026-09-23), the `braveapi` engine parses
**every** web result with `searx.engines.brave.parse_video_result()` —
each result is therefore a `Video` result with the `videos.html`
template.

For LOOGI this has two consequences, both demonstrated in staging against
2026.10.4:

1. **No merging anymore**: the merge hash of `MainResult` contains the
   template (`template|netloc|path|…|img_src`). The same URL from braveapi
   (`videos.html`) and duckduckgo (`default.html`) yields two results:
   duplicates in the list and no consensus scoring (score 1.0 instead of
   4.0 for double hits) — the ranking principle of ADR 0006/0022 is gone.
2. **Grouping by template**: `get_ordered_results()` groups by
   `category:template:thumbnail` — braveapi results form a block of their
   own (the same class of damage as ADR 0021).

An upstream fix (#6798) was declined on 2026-09-30 (the reasoning was
about the grouping part of that PR); the video bug is still present in the
current state.

## Decision

The existing `loogi_thumbnail_cleaner` plugin (ADR 0021) resets results
with `engine == "braveapi"` and the `videos.html` template to
`default.html` in its `on_result` hook — **before** the thumbnail check.
The hook runs after `normalize_result_fields()` and before
`_merge_main_result` (hash computation), verified in `searx/results.py`
2026.10.4.

Deliberately in the same plugin instead of a separate one: the
normalization has to run before the thumbnails are cleared. Two plugins
would depend on the plugin order.

## Alternatives considered

- **sed patch on `braveapi.py` in the Dockerfile** (`parse_video_result` →
  `MainResult`) — multi-line Python logic via sed is fragile; it breaks on
  every upstream change of the function.
- **Own engine module (fork of braveapi)** — permanent maintenance of a
  fork for a one-line bug.
- **Wait** — braveapi is the only reliable paid source; without merging,
  the consensus ranking would be gone immediately.

## Consequences

* **Positive**: braveapi results merge with those of other engines again
  (unit test in the container: 8 → 5 results, consensus scores 4.0/2.0/
  1.33), and all general results render in the LOOGI design
  (`default.html`).
* **Positive**: engine-specific and self-disabling — once upstream
  returns `MainResult` again, the branch has no effect (no breakage).
* **Negative / trade-off**: genuine video results from braveapi (YouTube
  URLs in the web index) lose their video template — as before the
  regression.
* **Follow-ups**: on the next base update, check whether
  `searx/engines/braveapi.py` still uses `parse_video_result`; if not,
  remove the branch along with its docstring.
