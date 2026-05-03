# 0015 — Drop the Wikipedia engine from the general tab

* Status: accepted
* Date: 2026-05-03

## Context

Looking at the results page, I noticed Wikipedia turned up as the top
result on the general tab almost every time — even on queries where
Google / DuckDuckGo don't put the Wikipedia entry at position 1
(example: query `hello` → Google ranks "HELLO! Magazine" first, LOOGI
showed Wikipedia at the top).

Investigation on the live instance pointed at two causes:

1. **Engine outages.** Brave (HTTP 429), Google (HTTP 403), and
   DuckDuckGo (CAPTCHA) get blocked on LOOGI's server IP regularly — a
   known issue for self-hosted SearXNG instances on cloud IPs. In
   practice often only Startpage returns hits; its position 1 for many
   queries is Wikipedia. When only one engine answers, its ranking
   becomes the LOOGI ranking by default.

2. **The Wikipedia engine leaks list hits.** In the SearXNG defaults,
   `wikipedia` is configured with `display_type: ["infobox"]` — so it
   should only appear as a sidebar infobox, never as a list entry. The
   engine code (`searx/engines/wikipedia.py:187`) makes an exception:

   ```python
   if "list" in display_type or api_result.get('type') != 'standard':
       results.append({...})
   ```

   For ambiguous terms (e.g. `python` → disambiguation page),
   `type != 'standard'` and Wikipedia gets inserted as a list result
   despite `["infobox"]` — and with the high engine score of a
   single-source engine.

On top of that: the LOOGI theme doesn't render `infoboxes` anywhere yet
(unlike the upstream `simple/` theme). Wikipedia infoboxes don't reach
the user anyway — the only way the Wikipedia engine becomes visible is
the list-leak from point 2.

## Decision

I drop `wikipedia` from `use_default_settings.engines.keep_only` in
`searxng/settings.yml`. The Wikipedia engine isn't loaded at all anymore.

Wikipedia entries stay findable for users:

* Through the list hits of the big engines (Startpage, DDG, Google,
  Brave, ...) — SearXNG ranks them with the normal score algorithm
  (engine-position-based + multi-engine bonus), without the
  single-source Wikipedia boost.
* Through the dedicated wiki tab via `wikidata`, `wiktionary`,
  `wikibooks`, `wikiquote`, `wikisource` — those stay active.

## Alternatives considered

* **Lower Wikipedia's weight (`weight: 0.5`)** — dampens the effect, but
  doesn't solve the list-leak on disambiguation pages (the score would
  still be high enough for top-3). The "Wikipedia is always on top"
  perception would persist, just attenuated.

* **Set `display_type: []` in settings.yml** — would prevent the list
  leaks, but the engine would idle (no infoboxes, no list items).
  Functionally identical to removing it, but with an active engine
  producing nothing. Cleaner to switch it off entirely.

* **Add more stable engines so Startpage doesn't carry alone** — the
  actual root-cause fix for point 1, but independent of Wikipedia.
  Tracked separately; doesn't address the list leak from point 2.

* **Add infobox rendering to the LOOGI theme** — would bring Wikipedia
  back as a sidebar. Separate task, not in conflict with this ADR;
  decide on it later if needed.

## Consequences

* **Positive**: no more list-leak from the Wikipedia engine
  (the disambiguation edge case is gone). The general-tab ranking
  reflects the consensus ranking of the web engines instead of being
  dominated by a single-source engine.
* **Negative / trade-off**: Wikipedia hits now only get the score
  multiplication from the engines that list them — where Wikipedia
  *really* is the best result (e.g. `merkel`), it still shows up at the
  top, just without the artificial boost everywhere else.
* **Follow-ups**:
  * Engine outages (Brave 429, Google 403, DDG CAPTCHA) remain open —
    separate investigation. Options: Brave Search API with a token, drop
    Google from `keep_only` if it's permanently 403, look at alternative
    engines (Bing, Yahoo) for diversification.
  * The wikidata engine fails at init with HTTP 403 against
    `query.wikidata.org/sparql` — check separately whether the engine is
    still alive in the wiki tab or permanently dead by IP block.

## Notes

The follow-ups above are picked up in
[ADR 0016](./0016-broken-engines-and-brave-api.md).
