# 0006 — Engine selection: precision over completeness

* Status: accepted
* Date: 2025-10-21

## Context

SearXNG ships around 250 preconfigured engines. Not all of them are useful:

* many are regional (Yandex / Russia, Baidu / Sogou / 360search / China,
  Naver / Daum / Korea, ...) — no value-add for a Swiss-targeted instance
* a few are legally awkward (1337x, btdigg, other torrent indexes)
* some are stale or poorly maintained
* many deliver worse general-search quality than the big engines and push
  good results down in the ranking

## Decision

I activate only a curated set of ~50 engines via
`use_default_settings.engines.keep_only` in `settings.yml`. Selection
criteria:

1. **Precision** — the engine produces high-quality results for its category.
2. **Trust** — no obvious tracker / state-surveillance sources.
3. **Relevance for DE/EU** — primarily western-European and global, no
   Russian / Chinese / Korean-focused engines.
4. **Diversity** — multiple independent sources per category, so the
   ranking isn't dominated by a single engine.

The concrete list lives in `searxng/settings.yml` under
`use_default_settings.engines.keep_only`.

## Alternatives considered

* **All defaults on** — latency rises because of tail engines, results
  get worse, bot-detection triggers at engines like Google fire more often.
* **Minimal selection (Google + DDG only)** — misses the metasearch value
  (diversity). Barely better than calling the engines directly.

## Consequences

* **Positive**: faster response times (fewer parallel requests), higher-
  quality results, a clear expectation of which sources are used.
* **Negative / trade-off**: anyone missing a specific regional engine has
  to edit `keep_only` and rebuild the image. Deliberate friction — the
  selection should stay visible as a design decision.
* **Follow-ups**: on every SearXNG update, check whether new engines were
  added that fit the list. Note when engines get deprecated.
