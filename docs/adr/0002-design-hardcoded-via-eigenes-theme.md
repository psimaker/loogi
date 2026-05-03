# 0002 — Design hardcoded via eigenes Theme

* Status: accepted
* Datum: 2026-05-03

## Context

Es gibt einen fertigen Designprototyp (HTML/CSS/JS, exportiert aus Claude
Design) fuer Homepage und Suchergebnisseite. Das Design ist Vorgabe und darf
nicht veraendert werden. SearXNG bringt eine Theme-Architektur mit — Themes
liegen unter `searx/templates/<theme>/` und `searx/static/themes/<theme>/`,
ausgewaehlt via `ui.default_theme`.

## Decision

Wir bauen ein einziges Theme namens `loogi`, das das Design 1:1 umsetzt, und
setzen es als hardcoded `default_theme` in `settings.yml`. Das mitgelieferte
`simple`-Theme wird **nicht** entfernt (es bleibt im Image als Fallback fuer
Templates, die SearXNG intern nicht ueber das Theme aufloest), aber der User
sieht es nie.

## Alternatives considered

* **Konfigurierbares Theme (User-Choice in Preferences)** — wuerde dem Design
  widersprechen ("Design darf nicht geaendert werden"). Bringt zusaetzliche
  Wartungslast (zwei Themes pflegen).
* **simple-Theme via CSS-Override patchen** — fragil. Jedes SearXNG-Update kann
  Klassen umbenennen, dann kippt das Layout. Eigenes Theme isoliert uns von
  Upstream-CSS-Aenderungen.
* **Forken von SearXNG mit hardcoded Templates** — zu invasiv. Updates wuerden
  zu Merge-Konflikten in den Templates fuehren. Theme-Verzeichnis ist die
  vorgesehene Erweiterungsschnittstelle.

## Consequences

* **Positiv**: Design-Treue ist garantiert. Updates von SearXNG ziehen das
  `simple`-Theme weiter, unser Theme bleibt stabil. Klare Trennung
  Design ↔ Engine.
* **Negativ / Trade-Off**: Wir muessen alle benoetigten Templates selbst
  bereitstellen — SearXNG faellt nicht automatisch auf simple zurueck. Bei
  groesseren Aenderungen am SearXNG-Template-Modell muessen wir nachziehen.
* **Folgeaufgaben**: Bei jedem SearXNG-Major-Update Diff von simple/
  inspizieren (`searx/templates/simple/` im Upstream) und ggf. neue
  Template-Dateien oder neu hinzugekommene Variablen in unsere uebernehmen.
