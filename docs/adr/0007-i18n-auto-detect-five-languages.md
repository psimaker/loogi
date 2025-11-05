# 0007 — i18n: EN/DE/FR/ES/IT with auto-detect

* Status: accepted
* Date: 2025-11-05

## Context

The design ships an i18n layer (`loogi-i18n.js`) with five languages:
English, German, French, Spanish, Italian. The prototype auto-detects via
`navigator.languages`.

SearXNG brings its own i18n via Flask-Babel. UI strings live in
`searx/translations/<locale>/LC_MESSAGES/messages.po` and are resolved
through `{{ _('...') }}` in templates. The UI language is picked via
cookie or the browser's `Accept-Language` header
(`ui.default_locale: ""` = auto-detect).

Separately, `search.default_lang: "auto"` controls the language of the
**search results** (backend engines), based on the browser's
`Accept-Language`.

## Decision

* **UI language (theme)**: `ui.default_locale: ""` → SearXNG honours the
  browser's `Accept-Language` and falls back to English. SearXNG's
  translation coverage for EN/DE/FR/ES/IT is complete.
* **Backend language (results)**: `search.default_lang: "auto"` → engines
  receive the browser language wherever they support it.
* No custom locale switcher in the LOOGI UI: browser language is the
  intuitive source of truth. Anyone who wants to override it can do so via
  SearXNG preferences.

## Alternatives considered

* **Custom locale switcher in the header** — would contradict the design
  (no switcher in the prototype) and duplicate the browser's config.
* **Hardcode a single language (e.g. English)** — misses the design goal
  and disadvantages German-speaking Swiss users on a .ch domain.
* **Introduce custom translations** — not needed as long as I don't have
  LOOGI-specific UI strings that SearXNG doesn't cover. If that changes:
  annotate strings in the `loogi/` templates with `{{ _('...') }}` and
  add a `messages.po` override inside the theme.

## Consequences

* **Positive**: zero i18n maintenance — I ride along with SearXNG's
  translations. Auto-detect is user-friendly.
* **Negative / trade-off**: I can't guarantee that every string in my
  custom templates is available in all five languages — anything I write
  fresh defaults to English-only.
* **Follow-ups**: in custom templates, consistently use `{{ _('...') }}`,
  so future translation is possible (even if I don't maintain it yet).
