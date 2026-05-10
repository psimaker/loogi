# 0016 — Drop broken engines, switch Brave to the official API

* Status: accepted
* Date: 2026-05-10

## Context

Follow-up investigation to
[ADR 0015](./0015-wikipedia-out-of-general-engines.md). The instance's
live logs show that several engines kept active in `keep_only` are
permanently blocked on the server IP — independent of load:

| Engine     | Symptom                                                | Cause                                  |
|------------|--------------------------------------------------------|----------------------------------------|
| `google`   | `HTTP error 403 (suspended_time=180)` on every query   | Google bot-detects cloud / server IPs |
| `brave`    | `Too many requests (suspended_time=180)`               | Brave HTML-scrape rate-limits the IP  |
| `duckduckgo` | `CAPTCHA (wt-wt)`                                    | DDG flagged the IP as suspicious      |
| `wikidata` | `HTTP error 403` at engine init (`query.wikidata.org/sparql`) → `can't register engine processor` | wikidata.org blocks the IP against SPARQL load tests |

`google` and `wikidata` produce nothing permanently, so they're dead
weight in the engine list — they cost latency (request + timeout) and
inflate the `unresponsive_engines` block in every response.

`brave` (HTML scrape) isn't fixable generically — a proxy pool would be
nontrivial and runs against
[ADR 0001](./0001-searxng-as-search-engine-base.md) /
[ADR 0008](./0008-no-ports-exposed-via-npm.md). But Brave offers an
**official Search API** with a subscription token, which SearXNG talks
to via a separate engine class `braveapi` (`searx/engines/braveapi.py`).
That engine ships `inactive: true` by default and needs an `api_key`
field.

`duckduckgo` shows CAPTCHA with `suspended_time=0` — meaning DDG
recovers between checks. The engine stays in; SearXNG temporarily
suspends it on failure. No permanent damage.

## Decision

1. **Remove `google` from `keep_only`.** Permanently 403, no recovery
   path without proxy infrastructure.

2. **Remove `wikidata` from `keep_only`.** Init fails permanently; the
   engine is never active in the container.

3. **Replace `brave` (HTML scrape) with `braveapi` (official API).** Add
   `braveapi` to `keep_only`; `brave` stays in the list for technical
   reasons (see note below) but gets `disabled: true` to take it out of
   default searches. Specifically:

   * An `engines:` override block in `searxng/settings.yml` defines
     `braveapi` with `inactive: false` and
     `api_key: "BRAVE_API_KEY_PLACEHOLDER"` (see
     [ADR 0009](./0009-config-deep-merge-vs-full-override.md) — with
     `use_default_settings: true`, deep-merge does not apply to
     `engines`; the engine has to be repeated in full in the local
     settings).
   * The placeholder is replaced at **build time** by a `RUN sed` in the
     `Dockerfile` with the value of `ARG BRAVE_API_KEY`. The build arg
     comes from `compose.yml` via `.env` (`BRAVE_API_KEY=...`).
   * If no key is set, the placeholder stays empty →
     `braveapi.init()` raises
     `SearxEngineAPIException("No API key provided")` → SearXNG doesn't
     register the engine. No crash, just no Brave results — identical
     behaviour to before this ADR (Brave 429 = effectively no results).

4. **Keep `duckduckgo` active.** The CAPTCHA block is transient; SearXNG
   handles that with temporary suspends.

## Alternatives considered

* **Outbound proxy pool for Google / Brave scrape** — works in principle,
  but conflicts with ADR 0001 / 0008 (self-hosted, simple architecture)
  and adds running cost + maintenance.

* **Leave `google` and `brave` in** — costs latency (timeout per request)
  and fills the `unresponsive_engines` field on every response. Visible
  to users in the sidebar (once it's rendered), and SearXNG's ranking
  algorithm computes engine-distrust scores that suffer from constant
  failures.

* **Commit the API key directly in `searxng/settings.yml`** — the repo
  is AGPL-3.0 and likely public; subscription tokens don't belong in
  there. The build-arg patch is the lean alternative without external
  volume mounts (cf. ADR 0003).

* **Bing or Yahoo as a Brave replacement** — Bing HTML-scrape is also
  IP-sensitive; Yahoo is one of the least reliable SearXNG engines.
  Brave-API is paid but stable — better fit for LOOGI as a single source.

* **Replace `wikidata` with another source** — no direct alternative; the
  other wiki engines (`wiktionary`, `wikibooks`, `wikiquote`,
  `wikisource`) cover the wiki tab content.

## Consequences

* **Positive**:
  * The engine list now reflects only engines that actually return
    results. Cleaner logs, no init error, less tail latency.
  * Brave results via API are stable and yield clean JSON instead of
    HTML-scrape drift. Token-based, so not IP-blockable.
  * The repo stays secret-free: the API key only lives locally in `.env`.

* **Negative / trade-off**:
  * The Brave Search API is **paid** above a quota. The free tier covers
    a single-user instance; monitor cost as traffic grows.
  * Without a key, Brave returns nothing — for LOOGI setups without a
    Brave subscription, diversity in the general tab is lower
    (Startpage, DDG, Mojeek, Mwmbl, Qwant). Acceptable, since the
    HTML-scrape didn't return anything either.
  * The build arg lives as layer metadata in the local image. Since the
    image is never published (ADR 0003: bake-and-keep-local), no leakage
    risk.

* **Follow-ups**:
  * Set `BRAVE_API_KEY` in local `.env`, then `docker compose build`
    + `up -d`. Watch for `braveapi` reappearing in
    `unresponsive_engines` — that means the key is wrong or the quota is
    exhausted.
  * Medium-term: check whether Brave Images / Videos / News API engines
    appear in SearXNG. Today, `brave.images`, `brave.videos`, and
    `brave.news` are still HTML-scrape and share the IP risk — they
    stay in because there's no API alternative.

## Note: `brave` stays as a network donor in `keep_only`

`brave.images`, `brave.videos`, and `brave.news` declare `network: brave`
in the upstream defaults — i.e. they share the HTTP connection pool of
the `brave` engine. If `brave` is removed from `keep_only`, the network
init fails with `KeyError: 'brave'` and the Granian worker crashes in a
restart loop.

Workaround: `brave` stays formally in `keep_only`, but in the
`engines:` override block in these settings it's set to
`disabled: true`. SearXNG loads the engine definition (so
`NETWORKS['brave']` exists) but doesn't query it on default searches.
Visible only to users who explicitly enable it in preferences — which I
don't recommend while the HTML scrape is stuck in the 429 loop.

A cleaner fix would be to replace `network: brave` in the sub-engines
with a fresh network-definition object. That duplicates connection-pool
settings and hides future upstream updates of the Brave network config —
rejected here.

## Note: volume `/etc/searxng` overrides image updates

The official SearXNG image declares `/etc/searxng` as an anonymous
volume. On first container start, `settings.yml` is copied from the
image layer into the volume; on later recreates, the volume persists and
the image update is **not** propagated into the volume (the SearXNG
entrypoint only drops a `settings.yml.new` file as a hint).

Workflow after every edit to `searxng/settings.yml`:

```sh
docker compose build
docker compose stop searxng
docker compose rm -f searxng
docker volume rm $(docker inspect loogi --format='{{range .Mounts}}{{.Source}}{{end}}' | grep -o '[a-f0-9]\{64\}' | head -1)
# simpler alternative: docker compose down (leaves valkey-data
# as a named volume alone) — but does not remove the anonymous volume.
# The anonymous volume has to be deleted separately, otherwise the
# image update doesn't take effect.
docker compose up -d
```

A permanent fix (e.g. a bind mount for `/etc/searxng`, or an init
container that copies settings.yml into the volume) is out of scope for
this ADR and should be decided separately.
