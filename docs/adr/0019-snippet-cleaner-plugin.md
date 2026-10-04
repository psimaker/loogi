# 0019 — Own snippet cleaner plugin instead of engine patches

* Status: accepted
* Date: 2026-06-11

## Context

A UI audit on 2026-06-11 showed that search result snippets contained
visible markup as plain text: `<strong>…</strong>` as literal text and
HTML entities such as `&quot;` / `&#x27;`. Verified live (JSON API +
rendered HTML): the engines **startpage** and **braveapi** deliver
title/content strings with raw formatting tags or entities that were
escaped once. The webapp escapes engine content when rendering (correct,
XSS protection) — so the leftover markup ends up as plain text in the
snippet. It looked broken on every results page.

Possible fix levels:

1. **Patch the upstream engines** (sed in the Dockerfile on
   `startpage.py` / `braveapi.py`): fragile on every base update, one
   engine at a time, and the next junk supplier needs the next patch.
2. **Theme level** (Jinja): at template time `result.content` is already
   escaped and enriched with highlight `<span>`s — stripping would destroy
   the highlights too; entity whack-a-mole via `|replace` is unmaintainable.
3. **Own plugin** with an `on_result` hook: runs BEFORE the webapp's
   escaping/highlighting, engine-agnostic, one file, no upstream patch.

## Decision

Own plugin `searxng/plugins/loogi_snippet_cleaner.py`, copied into the
image as `searx/plugins/loogi_snippet_cleaner.py` by the Dockerfile and
registered in the `plugins:` dict (ADR 0017) as
`searx.plugins.loogi_snippet_cleaner.SXNGPlugin: active: true`.

The cleaning logic is deliberately conservative:

* **One** `html.unescape` pass (covers all observed cases: `&quot;`,
  `&#x27;`, `&amp;quot;`); no double unescape, so legitimate content about
  HTML entities (e.g. MDN snippets) isn't falsified.
* Tag stripping only via a **whitelist of known formatting tags**
  (`strong|b|em|i|u|s|span|sup|sub|mark|small|big|br|wbr|p|a|code|pre|h1-6`)
  — deliberately no generic `<[^>]*>` stripping, so legitimate text like
  `a < b && c > d` stays intact.
* Applied to `title` + `content` of all result types (defensively via
  `getattr`; `LegacyResult` and `MainResult` share the fields).

## Consequences

* Snippets are free of markup, regardless of which engine delivers the
  junk — future engine changes are covered as well.
* The plugin shows up as a toggle on `/preferences` (section general) and
  can be switched off per user.
* Test it on every base update: it only depends on the stable plugin API
  (`Plugin`/`PluginInfo`/`on_result`), not on engine internals. If the
  plugin API breaks, the container start fails (plugin load error in the
  log) — loud, not silent.
* Theoretical edge case: a snippet that literally *talks* about HTML tags
  (e.g. docs about `<strong>`) loses those tags in the snippet. Accepted —
  the result itself stays reachable unchanged.
