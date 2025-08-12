# 0002 — Design hardcoded via a custom theme

* Status: accepted
* Date: 2025-08-26

## Context

A finished design prototype exists (HTML/CSS/JS, exported from Claude
Design) for the homepage and the results page. The design is a fixed
spec — I'm not free to redraw it. SearXNG ships a theme architecture:
themes live under `searx/templates/<theme>/` and
`searx/static/themes/<theme>/`, selected via `ui.default_theme`.

## Decision

I build a single theme called `loogi` that mirrors the prototype 1:1 and
hardcode it as `default_theme` in `settings.yml`. The bundled `simple`
theme is **not** removed — it stays in the image as a fallback for
templates SearXNG resolves outside the theme path — but the user never
sees it.

## Alternatives considered

* **Configurable theme (user choice in preferences)** — contradicts the
  design spec ("design must not change"). Doubles the maintenance load
  (two themes to keep in sync).
* **Patch the `simple` theme via CSS overrides** — fragile. Any SearXNG
  update can rename classes; then the layout breaks. A separate theme
  insulates LOOGI from upstream CSS churn.
* **Fork SearXNG with hardcoded templates** — too invasive. Upstream
  updates would mean merge conflicts in the template tree. The theme
  directory is the intended extension point — use it.

## Consequences

* **Positive**: design fidelity is guaranteed. SearXNG updates carry the
  `simple` theme along; the LOOGI theme stays stable. Clear separation
  between design and engine.
* **Negative / trade-off**: I have to ship every template I need myself —
  SearXNG does not fall back to `simple` automatically. Larger changes to
  the SearXNG template model require manual catch-up.
* **Follow-ups**: on every SearXNG major release, diff `searx/templates/simple/`
  in upstream and pull in new template files or newly introduced variables.
