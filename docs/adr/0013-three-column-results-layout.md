# 0013 — Results-page layout (filter sidebar + center column)

* Status: accepted
* Date: 2026-03-13

## Context

The design prototype (`LOOGI - Search/loogi-app.jsx` → `App` component)
shows the results page as a two-column flex layout:

* **Left (240 px)**: sidebar with filters (Time / Language / Region /
  Sources / Safe search) as a stack of RadioList and Checkbox controls,
  plus a collapse button in the sidebar header.
* **Center (1fr)**: search results + pagination (or ImageGrid /
  NewsList / EmptyTab depending on the active tab).

Before this ADR, the layout was two-column but different: SearXNG's
default `<aside id="sidebar">` (with infobox / suggestions / engines
message / APIs) lived in a right column, and filters (language, time
range, safesearch) were inline above the results in a `.search_filters`
row — functional, but visually far from the prototype.

The hardcoded-design rule in the project's hard rules applies: design
changes require explicit user request — given here.

The original prototype briefly carried a third column (320 px right-side
info panel). It was removed from the design before LOOGI's port; the
filename "three columns" stuck because earlier branches still had it.
The current target is two columns (filter + center).

## Decision

The results page moves to a **nested flex layout**:

* Outer flex: `[240 px filter sidebar | 1fr main block]`, centered with
  `max-width: 1400 px`.
* The main block is itself a flex container `[1fr center column]`. An
  earlier prototype iteration had an additional right info column (320
  px), since dropped from the design — LOOGI follows the current
  prototype.

Components:

* **`#filters_sidebar`** (left, 240 px): custom RadioList and Checkbox
  controls (visually like the prototype's `RadioList` / `Checkbox`),
  collapse button in `.sidebar_header`. Filter sections for Time,
  Language, Region, Sources, Safe search. Time / Language / SafeSearch
  bind to SearXNG's form (`time_range`, `language`, `safesearch` POST to
  `/search`); Region and Sources are visual-only (no SearXNG backing)
  with the prototype's mock values from `loogi-data.jsx`
  (`LOOGI_REGIONS` / `LOOGI_SOURCES`).
* **`#center_column`** (1fr): result items (`.result` with a hover-actions
  column on the right), pagination. SearXNG `answers` (Calculator plugin,
  Self-info, etc.) render above the results when present, kept
  unobtrusive in the prototype's default style.

The `.search_filters` row in `search.html` (inline filters above the
results) is removed — filters now live exclusively in the left sidebar.

The tabs row (`categories.html`) is reduced to the six prototype tabs
(Web / Images / News / Videos / Papers / Maps) with the prototype's
icons (inline minimalist line-art SVG, stroke-width 1.8, viewBox
0 0 24 24) and mock counts from `LOOGI_TABS`. SearXNG's default
categories `music` / `it` / `files` aren't shown.

Responsive breakpoints:

* `<= 880 px` → layout flips vertical, filter sidebar moves above the
  results.

## Alternatives considered

* **Keep filters inline above results** — minimally invasive, but it
  doesn't match the prototype. Rejected.
* **Couple the filter form to `form#search` (CSS grid `display: contents`
  or `grid-area`)** — works in principle, but couples form layout to
  grid structure and makes submit behaviour unintuitive. Separate filter
  sub-forms with explicit `<button type="submit">` are clearer.
* **`<select>`-based filters** — leaner functionally, but doesn't match
  the prototype (which uses custom radio buttons with a dot indicator).
  Rejected.
* **Wire region / sources to SearXNG for real** (region → language-region,
  sources → engine classification) — needs its own data model and engine
  mapping. Out of scope for this ADR. Until then, region and sources are
  visual-only and non-binding.
* **The earlier info column / FilterChips / AISummary / Tweaks panel** —
  these existed in an earlier design version and were ported to LOOGI.
  After the design rework they were removed from the prototype; LOOGI
  follows suit.

## Consequences

* **Positive**:
  * Visually aligned with the current prototype.
  * Filters are always visible (with a collapse option), no more inline
    filter row.
  * Slimmer DOM (~70 KB instead of ~120 KB per search render).

* **Negative / trade-off**:
  * Region and sources are visual-only — clicking sets local active
    state but sends no extra filter to SearXNG.
  * SearXNG's default `music` / `it` / `files` categories aren't reachable
    from the tabs row; users have to call `/search?category_music=1`
    directly or use preferences.
  * Language filter reduced to 5 options (vs. 100+). Other languages
    can't be selected from the sidebar.

* **Follow-ups** (separate ADRs when picked up):
  * Engine classification for the sources filter.
  * Region filter with language-region mapping.
