# 0021 — Thumbnail cleaner plugin against score inversions in the result list

* Status: accepted (extended by [0024](./0024-normalize-braveapi-results-as-web-results.md): braveapi template normalization in the same hook)
* Date: 2026-06-11

## Context

During a ranking analysis on 2026-06-11 (the listing differed visibly from
Google/DDG/Brave), the JSON API showed that the results page is **not
delivered sorted by score**. Measured live, reproducible in every general
query:

* "wetter zuerich": wetteronline.de (score **1.00**) at position 10 behind
  nzz.ch/wetter (score 0.39)
* "beste kopfhoerer 2026": esquire.de (score **1.50**, 2-engine consensus)
  at position 10 behind a single result with score 0.20
* "python": w3schools (score **1.00**) at position 10 behind de.wikipedia
  (score 0.25)

The cause is neither a bug in the theme (it renders the `results` list
1:1) nor one in the score calculation (consensus ranking works correctly),
but the **grouping pass** in `ResultContainer.get_ordered_results()`
(`searx/results.py`): after the score sort it groups results by the key
`category:template:has-thumbnail`. A group pulls up to `max_count = 8`
following members right behind its anchor.

**braveapi delivers thumbnails for part of the web results,
startpage/duckduckgo don't.** So every general page falls apart into two
invisible blocks: first up to 9 results without a thumbnail (including
low-scoring single results), then the thumbnail block — no matter how high
its scores are. The news tab (same `default.html` template) shows the same
pattern in the opposite direction.

The punchline: the LOOGI theme renders **no thumbnails at all** in
`default.html` (design hardcoded, ADR 0002 — the design prototype has no
thumbnails in web results). Upstream does the grouping for the simple
theme, which shows thumbnails — there it's a visual feature. At LOOGI it
sorts by an invisible attribute: pure damage.

Possible fix levels:

1. **Core patch** (sed in the Dockerfile on `results.py`, remove `img_src`
   from the group key): hits the core of the issue, but depends on
   upstream internals of a hot-path file and can break on every base
   update (even with a grep guard: build break instead of fix).
2. **Theme level**: render thumbnails in `default.html` so the grouping
   makes visual sense — design change, not allowed (ADR 0002).
3. **Engine level**: patch braveapi so it delivers no thumbnails — per
   engine, fragile, and the next thumbnail supplier needs the next patch.
4. **Own plugin** with an `on_result` hook: runs in
   `ResultContainer.add()` BEFORE merge/scoring/grouping
   (`normalize_result_fields()` has run, `template` is set),
   engine-agnostic, one file, no upstream patch — same mechanics as the
   snippet cleaner (ADR 0019).

## Decision

Own plugin `searxng/plugins/loogi_thumbnail_cleaner.py`, copied into the
image as `searx/plugins/loogi_thumbnail_cleaner.py` by the Dockerfile and
registered in the `plugins:` dict (ADR 0017) as
`searx.plugins.loogi_thumbnail_cleaner.SXNGPlugin: active: true`.

Logic: for results with the `default.html` template, `thumbnail` and
`img_src` are cleared. The group key thus becomes uniform for all
general/news results → the page shows the pure score order. Result types
with visible thumbnails (`images.html`, `videos.html`, `map.html`, ...)
stay untouched.

## Consequences

* General and news listings are strictly score-sorted — verified after
  deploy (same test queries, 0 inversions in the top 20). The listing thus
  reliably follows the consensus ranking; results that several engines
  rank at the top are at the top at LOOGI too.
* Nothing visible gets lost: the cleared thumbnails were never rendered in
  the LOOGI theme.
* Engine-agnostic: even if another engine starts delivering thumbnails for
  web results in the future, the order stays stable.
* Should the design ever get thumbnails in web results (explicit
  requirement, ADR 0002), this plugin has to be disabled and the grouping
  question decided anew.
* Test it on every base update: it only depends on the stable plugin API
  (`Plugin`/`PluginInfo`/`on_result`) and on the fact that the group key
  evaluates the thumbnail field. If upstream changes the grouping, the
  plugin becomes ineffective at worst (no breakage).
