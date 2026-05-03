# 0013 — Layout der Results-Seite (Filter-Sidebar + Center)

* Status: accepted
* Datum: 2026-05-03

## Context

Der Designprototyp (`LOOGI - Search/loogi-app.jsx` → Komponente `App`) zeigt
die Results-Seite als zwei-spaltiges Flex-Layout:

* **Links (240 px)**: Sidebar mit Filtern (Time / Language / Region /
  Sources / Safe search) als RadioList- und Checkbox-Stack, plus
  Collapse-Button im Sidebar-Header.
* **Mitte (1fr)**: Suchergebnisse + Pagination (oder ImageGrid /
  NewsList / EmptyTab je nach aktiver Tab-Kategorie).

Bisher (vor dieser ADR) war das Layout zwei-spaltig anders: SearXNGs
default `<aside id="sidebar">` (mit Infobox / Suggestions / Engines-Msg
/ APIs) lebte in einer rechten Spalte, Filter (Sprache, Time-Range,
SafeSearch) wurden inline ueber den Ergebnissen in einer
`.search_filters`-Zeile angezeigt — funktional, aber visuell weit
entfernt vom Designprototyp.

CLAUDE.md Hard rule #1 sagt: "Design ist hardcoded und darf nicht
veraendert werden. Aenderungen daran nur auf explizite User-Anforderung."
— das ist hier gegeben.

## Decision

Die Results-Seite wird auf ein **nested Flex-Layout** umgestellt:

* Aussen-Flex: `[240 px Filter-Sidebar | 1fr Main-Block]`,
  `max-width: 1400 px` zentriert.
* Main-Block ist selbst Flex-Container `[1fr Center-Column]`. Der
  Designprototyp hatte in einer frueheren Iteration eine zusaetzliche
  rechte Info-Spalte (320 px), die wurde aber zwischenzeitlich aus
  der Designvorlage entfernt; LOOGI folgt der aktuellen Vorlage.

Komponenten:

* **`#filters_sidebar`** (links, 240 px): Custom RadioList- und
  Checkbox-Controls (visuell wie Designprototyp `RadioList` /
  `Checkbox`), Collapse-Button im `.sidebar_header`. Filter-Sections
  fuer Time, Language, Region, Sources, Safe search.
  Time/Language/SafeSearch binden an SearXNGs Form (`time_range`,
  `language`, `safesearch` POST zu `/search`); Region und Sources
  sind visuell-only (kein SearXNG-Backing) mit den
  Designprototyp-Mock-Werten aus `loogi-data.jsx`
  `LOOGI_REGIONS` / `LOOGI_SOURCES`.
* **`#center_column`** (Mitte, 1fr): Result-Items (`.result` mit
  Hover-Actions-Spalte rechts), Pagination. SearXNG `answers` falls
  vorhanden werden vor den Ergebnissen ausgespielt (Calculator-Plugin,
  Self-Info etc.) — bleiben unter dem Designprototyp-Default-Render
  unauffaellig oben.

`.search_filters`-Zeile in `search.html` (inline-Filters ueber den
Ergebnissen) wurde ersatzlos entfernt — die Filter leben jetzt
ausschliesslich in der linken Sidebar.

Tabs-Row (`categories.html`) wird auf die 6 Designprototyp-Tabs
reduziert (Web/Images/News/Videos/Papers/Maps) mit den
Designprototyp-Icons (inline minimalist line-art SVG, stroke-width
1.8, viewBox 0 0 24 24) und Mock-Counts aus `LOOGI_TABS`. Die
SearXNG-default-Kategorien `music` / `it` / `files` werden in der
Tabs-Row nicht angezeigt.

Responsive-Breakpoints:

* `<= 880 px` → Layout flippt auf vertikal, Filter-Sidebar wandert
  ueber die Ergebnisse.

## Alternatives considered

* **Filter inline ueber den Ergebnissen lassen** — minimalinvasiv,
  aber matched den Designprototyp nicht. Verworfen.

* **Filter-Form an `form#search` koppeln (CSS-Grid `display: contents`
  oder `grid-area`)** — funktioniert prinzipiell, koppelt aber
  Form-Layout an Grid-Struktur und macht Submit-Verhalten
  unintuitiv. Separate Filter-Sub-Formulare mit expliziten
  `<button type="submit">`-Optionen sind klarer.

* **`<select>`-basierte Filter** — funktional schlanker, matched aber
  den Designprototyp nicht (der Custom-Radio-Buttons mit
  Dot-Indicator hat). Verworfen.

* **Region/Sources echt mit SearXNG verdrahten** (Region →
  Language-Region, Sources → Engine-Klassifikation): braucht eigenes
  Datenmodell und Engine-Mapping. Out of scope dieser ADR. Bis dahin
  sind Region und Sources visuell vorhanden, aber non-binding.

* **Frueher angedachte Info-Spalte / FilterChips / AISummary /
  Tweaks-Panel** — diese Komponenten waren in einer frueheren
  Designversion vorhanden und wurden in LOOGI portiert. Nach der
  Designueberarbeitung wurden sie aus dem Designprototyp entfernt;
  LOOGI folgt der neuen Vorlage und entfernt sie ebenfalls.

## Consequences

* **Positiv**:
    * Visuell strikt am aktuellen Designprototyp ausgerichtet.
    * Filter sind dauerhaft sichtbar (mit Collapse-Option), keine
      Inline-Filter-Reihe mehr.
    * Schlanker DOM (~70 KB statt vorher ~120 KB pro Search-Render).

* **Negativ / Trade-Off**:
    * Region und Sources sind visuell-only — Klick aendert lokalen
      Active-State, aber sendet kein zusaetzliches Filter-Kriterium an
      SearXNG.
    * SearXNGs default-Kategorien `music` / `it` / `files` sind in
      der Tabs-Row nicht erreichbar; wer dort sucht, muss
      `/search?category_music=1` direkt aufrufen oder Preferences
      nutzen.
    * Sprache-Filter ist auf 5 Optionen reduziert (statt 100+).
      Andere Sprachen lassen sich nicht in der Sidebar waehlen.

* **Folgeaufgaben** (eigene ADRs wenn angegangen):
    * Engine-Klassifikation fuer Sources-Filter.
    * Region-Filter mit Language-Region-Mapping.
