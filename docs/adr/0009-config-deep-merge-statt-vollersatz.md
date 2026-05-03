# 0009 — Konfig: Deep-Merge statt Vollersatz

* Status: accepted
* Datum: 2026-05-03

## Context

`searx/settings_loader.py` unterstuetzt zwei Modi fuer User-Settings:

1. **Vollersatz**: Ohne `use_default_settings: true` muss die User-`settings.yml`
   vollstaendig sein (alle Keys, alle ~250 Engine-Definitionen mit URLs,
   Categories, Shortcuts, etc.).
2. **Deep-Merge**: Mit `use_default_settings: true` erbt die User-`settings.yml`
   von den Defaults und ueberschreibt nur die Deltas. Engines koennen via
   `use_default_settings.engines.keep_only` oder `.remove` gefiltert werden.

## Decision

Wir nutzen `use_default_settings: true`. Unsere `settings.yml` enthaelt nur
die Deltas (Branding, default_theme, base_url, server-Optionen,
keep_only-Engines).

## Alternatives considered

* **Vollersatz** — bedeutet wir muessten die komplette Engine-Liste mit allen
  Detail-Settings (URLs, Shortcuts, API-Keys-Slots, ...) selbst pflegen. Bei
  jedem SearXNG-Update muessten wir neue Engine-Definitionen einpflegen,
  geaenderte URLs nachziehen, abgekuendigte loeschen. Das ist eine
  Wartungsfalle.

## Consequences

* **Positiv**: `settings.yml` ist klein (~150 Zeilen statt ~3000),
  aussagekraeftig, leicht zu reviewen. Updates des Upstream-Defaults laufen
  automatisch durch (neue Engine-Defaults, Bugfixes in Engine-URLs, ...).
* **Negativ / Trade-Off**: Wenn der Upstream Defaults aendert (z. B. eine
  Engine deaktiviert per default), greift das auch bei uns. Wir sollten bei
  Updates die Changelog-Eintraege im SearXNG-Repo lesen.
* **Folgeaufgaben**: Bei Major-Updates die Default-`settings.yml`
  durchscrollen und auf relevante Aenderungen pruefen.
