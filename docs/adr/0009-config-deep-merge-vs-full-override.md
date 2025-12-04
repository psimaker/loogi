# 0009 — Config: deep-merge instead of full override

* Status: accepted
* Date: 2025-12-04

## Context

`searx/settings_loader.py` supports two modes for user settings:

1. **Full override**: without `use_default_settings: true`, the user
   `settings.yml` must be complete (all keys, all ~250 engine definitions
   with URLs, categories, shortcuts, etc.).
2. **Deep merge**: with `use_default_settings: true`, the user
   `settings.yml` inherits from the defaults and only overrides the
   deltas. Engines can be filtered via
   `use_default_settings.engines.keep_only` or `.remove`.

## Decision

I use `use_default_settings: true`. The LOOGI `settings.yml` only carries
the deltas (branding, `default_theme`, `base_url`, server options,
`keep_only` engines).

## Alternatives considered

* **Full override** — means I'd maintain the complete engine list with
  every detail setting (URLs, shortcuts, API key slots, ...). On every
  SearXNG update I'd have to import new engine definitions, chase
  changed URLs, and prune deprecated ones. That's a maintenance trap.

## Consequences

* **Positive**: `settings.yml` stays small (~150 lines instead of ~3000),
  expressive, easy to review. Upstream default updates flow through
  automatically (new engine defaults, bugfixes to engine URLs, ...).
* **Negative / trade-off**: when upstream changes a default (e.g.
  disables an engine by default), it lands here too. On updates I should
  skim the SearXNG changelog.
* **Follow-ups**: on major updates, scroll through the upstream
  `settings.yml` and check for relevant changes.

## Note

Engine *definitions* are an exception — the deep-merge does **not** apply
inside the `engines:` list. To override engine fields (e.g. switching
`inactive: true` to `false`, or setting an `api_key`), the engine entry
has to be fully repeated in the local settings. This bites in
[ADR 0016](./0016-broken-engines-and-brave-api.md).
