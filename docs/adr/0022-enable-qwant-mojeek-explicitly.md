# 0022 — Enable qwant + mojeek explicitly (keep_only leaves the disabled flag untouched)

* Status: superseded by [0025](./0025-engine-changes-for-searxng-2026-10.md) (2026-10-04: qwant + mojeek blocked from the server IP → back to the upstream default)
* Date: 2026-06-11

## Context

The `keep_only` list in `settings.yml` (ADR 0006: curated engine set)
names seven engines for general: braveapi, brave (network donor only),
duckduckgo, mojeek, mwmbl, startpage, qwant. During the ranking analysis
on 2026-06-11, `/config` showed: **mojeek, mwmbl and qwant were
effectively disabled** — the upstream default ships them with
`disabled: true`, and `keep_only` only filters the engine list, it
doesn't change any engine attributes (ADR 0009: deltas inherit from the
default).

General therefore ran unnoticed on only **three** sources (braveapi,
duckduckgo, startpage). Consequences for the consensus ranking: fewer
voters per result, and because braveapi delivers twice as many results as
the others with `results_per_page: 20`, brave-only results dominated the
long tail of the results page.

An upstream `disabled: true` is often a warning sign (captcha/IP blocks on
server IPs, cf. google/brave HTML in ADR 0016). So before enabling: a live
test from the server IP (bang query `!qwant` / `!mojeek` via the JSON
API): **both return 10 results each, no captcha, no 429.**

## Decision

`qwant` and `mojeek` are enabled in the `engines:` block via an override
`disabled: false`. A partial override is enough: the settings loader
merges engine entries by name via `update_dict` into the default — all
fields that aren't mentioned stay upstream (verified in
`settings_loader.py update_settings()`; the existing `brave` override uses
the same mechanics).

`mwmbl` deliberately stays on the upstream default `disabled: true`: a
mini index in beta, coverage too thin — worthless to distorting as a
consensus voter. The category siblings (`qwant images/videos/news`,
`mojeek images/news`) also stay on their upstream default for now; the
non-general tabs have enough active sources, and every additional engine
is a latency and error risk. Add them one by one later if needed.

## Consequences

* General searches **five** sources (braveapi, duckduckgo, startpage,
  qwant, mojeek) — more independent voters make the consensus ranking more
  robust, single-engine outliers fall further back.
* qwant and mojeek can start blocking server IPs at any time (like
  google/brave HTML, ADR 0016). Symptom: `unresponsive_engines` in the
  JSON API or an engine error in the log. Then: set the engine back to
  `disabled: true` instead of tormenting it with retries.
* On base updates, check whether upstream changed the `disabled` flag of
  both for a reason (changelog, cf. ADR 0009 follow-ups).
* The `keep_only` list alone says nothing about what's active — what
  counts is `keep_only` **plus** the upstream default **plus** the
  `engines:` overrides. Commented at the affected entries in
  `settings.yml`.
