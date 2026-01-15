# 0011 — Privacy / terms as infopages, TOC extension via Dockerfile patch

* Status: accepted
* Date: 2026-01-15

## Context

A public search engine at loogi.ch needs a privacy notice and terms of
use, in five languages (EN/DE/FR/ES/IT), embedded in the LOOGI layout and
linked from the footer (and possibly the header).

SearXNG ships an **infopage system** (`searx/infopage/`): markdown files
under `searx/infopage/<locale>/<pagename>.md` are served at
`/info/<locale>/<pagename>`, with tabs across all pages, i18n auto-detect,
Markdown→HTML via mistletoe / markdown-it, and caching.

The catch: the TOC is hardcoded at `searx/infopage/__init__.py:142-146`:

```python
self.toc: list[str] = [
    'search-syntax',
    'about',
    'donate',
]
```

The settings system has no hook to add new page names.
`get_page(pagename)` returns `None` when `pagename not in self.toc`, and
the `info` endpoint answers 404.

## Decision

I lean on the infopage system because it does exactly what I need
(Markdown + i18n + caching + tabs + layout integration), and extend the
TOC at build time with a `sed` patch in the Dockerfile:

```dockerfile
RUN INFOPAGE=/usr/local/searxng/searx/infopage/__init__.py && \
    grep -q "'donate'," "$INFOPAGE" && \
    sed -i "s|^            'donate',|            'donate',\n            'privacy',\n            'terms',|" "$INFOPAGE" && \
    grep -q "'privacy'," "$INFOPAGE" && \
    grep -q "'terms'," "$INFOPAGE"
```

The `grep` asserts before and after the `sed` make the build fail hard if
the expected marker line disappears upstream — I notice it on the next
image build, not at runtime.

Markdown files live in the repo under
`searxng/infopage/<lang>/{privacy,terms}.md` and are merged into
`/usr/local/searxng/searx/infopage/` via `COPY`. They extend — they don't
overwrite — the SearXNG originals (`about.md`, `search-syntax.md`).

## Alternatives considered

* **External static HTML files** under `theme/loogi/static/legal/<lang>/`,
  linked via `general.privacypolicy_url` and `general.contact_url` in
  settings.yml — works without a patch, but the pages live outside the
  layout pipeline. No i18n auto-detect, no Markdown, double maintenance
  for header / footer.
* **Merge privacy / terms into `about.md`** — a single page, no TOC
  extension needed, but cluttered and not directly linkable
  (`/info/.../privacy` would be an anchor).
* **`general.privacypolicy_url` to an external URL** (GitHub Wiki or
  GitHub Pages) — works, but content lives outside the search engine,
  different layout, no deterministic i18n.
* **Fork SearXNG and extend the TOC** — overkill for a two-line change.
  Exactly the kind of drift [ADR 0003](./0003-own-docker-image-vs-volume-mounts.md)
  was meant to avoid.
* **Custom plugin that extends `INFO_PAGES.toc` at boot** — a plugin
  could `init()` and monkey-patch the global `INFO_PAGES` singleton. But
  plugins are designed for search-pipeline hooks, not routing changes.
  More boilerplate (plugin manifest, settings entry, lifecycle), same
  effect as the `sed` patch — added complexity without payoff.

## Consequences

* **Positive**: full infopage system usable — Markdown, i18n, caching,
  tabs, layout integration. Privacy and terms reachable at
  `/info/<lang>/privacy` and `/info/<lang>/terms`. Footer links use
  `url_for('info', pagename='privacy', locale=lang2)`. No code
  duplication against the `about` mechanism.
* **Negative / trade-off**: I'm patching upstream code. On every SearXNG
  major release I have to check whether the `'donate',` line still
  exists. The build's fail-safe makes that visible (image won't build),
  but it stays a maintenance debt.
* **Follow-ups**:
  - On upstream updates, diff `searx/infopage/__init__.py`.
  - If SearXNG ever adds a settings hook for `toc`, switch from the patch
    to config and supersede this ADR.
  - Have the texts reviewed legally before loogi.ch is publicly
    advertised (already a TODO in the README).
