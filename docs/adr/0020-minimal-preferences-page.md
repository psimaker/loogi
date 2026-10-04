# 0020 — Minimal preferences page (5 settings instead of the full SearXNG set)

* Status: accepted
* Date: 2026-06-11

## Context

The /preferences page was a 1:1 port of the simple theme: 6 tabs (General,
User interface, Privacy, Engines, Special Queries, Cookies) with engine
statistics tables, plugin toggles, hotkey/method/URL formatting options,
token fields and a cookie listing. For a consumer product like LOOGI that's
an operator UI: 90 % of the options concern things that are maintained as
code in `settings.yml` (engines, plugins, method, favicon resolver) or
that no end user needs. Requirement on 2026-06-11: "really very simple,
only the most important settings".

## Decision

`preferences.html` now renders only five settings (the existing partials
under `preferences/` are reused):

| Setting | Why it stays |
|---------|--------------|
| Search language (`language`) | the most important search influence, auto-detect default |
| SafeSearch (`safesearch`) | classic end-user expectation |
| Autocomplete (`autocomplete`) | noticeable UX feature, on/off/source |
| Interface language (`locale`) | UI language independent of the browser |
| Open links in new tabs (`results_on_new_tab`) | most common comfort preference |

Plus save/reset/back (preferences/footer.html). Everything else runs on
the settings.yml defaults.

No risk for existing cookies: on POST, `searx.preferences` only parses
the **submitted** form keys — settings that aren't rendered keep their
stored or default value.

The remaining partials under `preferences/` (engines, hotkeys, method,
...) stay in the repo: no maintenance effort (they aren't rendered), but
they can be reactivated immediately should an option come back.

## Consequences

* End users can no longer switch engines/plugins/method/etc. via the UI —
  intentional: at LOOGI that level is config-as-code (`settings.yml`,
  ADR 0006/0017). Whoever needs it changes settings.yml.
* The engine statistics are no longer linked (/stats still exists as an
  endpoint).
* On base updates, diffs in `templates/simple/preferences.html` are
  largely irrelevant for us — only the five partials in use may need to be
  mirrored.
