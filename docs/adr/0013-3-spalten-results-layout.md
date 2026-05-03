# 0013 — 3-Spalten-Layout fuer die Results-Seite

* Status: accepted
* Datum: 2026-05-03

## Context

Der Designprototyp (`loogi-search-design/project/loogi-app.jsx` → Komponente
`App`) zeigt die Results-Seite als drei-spaltiges Layout:

* **Links (240 px)**: Sidebar mit Filtern (Time, Language, Region, Sources,
  Safe search) als RadioList- und Checkbox-Stack, plus Collapse-Button im
  Sidebar-Header.
* **Mitte (1fr)**: FilterChips-Reihe + AISummary-Banner +
  Suchergebnisse + Pagination.
* **Rechts (320 px)**: Info-Spalte mit Knowledge-Card (striped Image-Header,
  Facts-DL, Related-Tags), "People also search"-Liste und Source-Mix-Bars.

Bisher (vor dieser ADR) war das Layout zwei-spaltig:

* **Mitte (1fr)**: Suchergebnisse + Pagination.
* **Rechts (320 px)**: SearXNGs `<aside id="sidebar">` mit Infobox,
  Suggestions, Engines-Messages und API-Download-Links.

Filter (Sprache, Time-Range, SafeSearch) wurden inline ueber den Ergebnissen
in einer `.search_filters`-Zeile angezeigt — funktional, aber visuell weit
entfernt vom Designprototyp.

CLAUDE.md Hard rule #1 sagt: "Design ist hardcoded und darf nicht veraendert
werden. Aenderungen daran nur auf explizite User-Anforderung." — das ist hier
gegeben (Anweisung "design soll strikt nach loogi-search-design ausgerichtet
sein, 1:1 ohne Kompromisse").

## Decision

Die Results-Seite wird auf ein **nested Flex-Layout** umgestellt, wie es der
Designprototyp vorgibt:

* Aussen-Flex: `[240px Filter-Sidebar | 1fr Main-Block]`, `max-width: 1400px`
  zentriert.
* Main-Block ist selbst Flex: `[1fr Center-Column | 320px Info-Sidebar]`
  mit `gap: 36px`.

Komponenten:

* **`#filters_sidebar`** (links, 240 px): Custom RadioList- und
  Checkbox-Controls (visuell wie Designprototyp `RadioList` /
  `Checkbox`), Collapse-Button im `.sidebar_header`. Filter-Sections
  fuer Time, Language, Region, Sources, Safe search. Time/Language/SafeSearch
  binden an SearXNGs Form (`time_range`, `language`, `safesearch` POST
  zu `/search`); Region und Sources sind visuell-only (kein
  SearXNG-Backing) mit den Designprototyp-Mock-Werten aus `loogi-data.jsx`
  `LOOGI_REGIONS` / `LOOGI_SOURCES`.
* **`#center_column`** (Mitte, 1fr): FilterChips-Reihe (aktive Filter +
  Suggestion-Chips), AISummary-Banner (immer gerendert, Inhalt aus
  SearXNG `answers` falls vorhanden, sonst Designprototyp-Placeholder),
  Result-Items (`.result` mit Hover-Actions-Spalte rechts), Pagination.
* **`#info_sidebar`** (rechts, 320 px): drei Cards exakt wie Designprototyp
  `InfoColumn`:
    * `.info_card_main` mit striped Image-Header (`background:
      repeating-linear-gradient`), Accent-Dot, Kind-Label, H2-Titel,
      Summary, Divider, Facts-DL, Related-Tags. Inhalt aus SearXNG
      `infoboxes[0]` falls vorhanden, sonst Mock aus `LOOGI_INFOCARD`.
    * `.info_card_related_card` ("People also search") mit Pfeil-Links.
      Inhalt aus SearXNG `suggestions` falls vorhanden, sonst Mock aus
      `LOOGI_RELATED`.
    * `.info_card_sourcemix` mit Bar-Chart pro Quelle. Werte sind die
      Designprototyp-Mock-Verteilung (Academic 32 % / News 26 % / ...);
      eine echte Engine-zu-Source-Klassifikation gibt es noch nicht.

`.search_filters`-Zeile in `search.html` (inline-Filters ueber den
Ergebnissen) wird ersatzlos entfernt — die Filter leben jetzt
ausschliesslich in der linken Sidebar.

Tabs-Row (`categories.html`) wird auf die 6 Designprototyp-Tabs reduziert
(Web/Images/News/Videos/Papers/Maps) mit den Designprototyp-Icons und
Mock-Counts; die SearXNG-default-Kategorien `music` / `it` / `files` werden
in der Tabs-Row nicht angezeigt (Engines bleiben unter den verbleibenden
Tabs erreichbar via Engine-Auswahl).

Der **Tweaks-Panel** (Designprototyp `LoogiTweaksPanel`) wird als floating
Panel unten-rechts gerendert, mit Density (Compact/Default/Spacious) und
Accent (Teal/Amber/Magenta/Lime). State persistiert via `localStorage`,
Live-Update via CSS-Variablen-Swap auf `:root` (Accent) und Body-Class
(Density). Sidebar-Collapse-Status persistiert ebenfalls.

Responsive-Breakpoints:

* `<= 1180 px` → Info-Sidebar wird ausgeblendet, Filter-Sidebar bleibt.
* `<= 880 px` → Layout flippt auf vertikal, Filter-Sidebar wandert ueber
  die Ergebnisse.

## Alternatives considered

* **Filter inline ueber den Ergebnissen lassen** — minimalinvasiv, aber
  matched den Designprototyp nicht. Verworfen.

* **Filter-Form an `form#search` koppeln (CSS-Grid `display: contents` oder
  `grid-area`)** — funktioniert prinzipiell, koppelt aber Form-Layout an
  Grid-Struktur und macht Submit-Verhalten unintuitiv (jeder Filter-Click
  submittet das gesamte Suchformular). Separate Filter-Sub-Formulare mit
  expliziten `<button type="submit">`-Optionen sind klarer.

* **`<select>`-basierte Filter** — funktional schlanker, matched aber den
  Designprototyp nicht (der Custom-Radio-Buttons mit Dot-Indicator hat).
  Verworfen.

* **Region/Sources echt mit SearXNG verdrahten** (Region → Language-Region,
  Sources → Engine-Klassifikation): braucht eigenes Datenmodell und
  Engine-Mapping (Academic = arxiv/pubmed/scholar/..., News = google
  news/brave news/...). Out of scope dieser ADR — wird in einer eigenen
  ADR adressiert wenn die Klassifikation gebraucht wird. Bis dahin sind
  Region und Sources visuell vorhanden, aber non-binding.

* **AISummary echte LLM-Integration**: braucht externen LLM-Aufruf pro
  Query (DeepSeek, OpenAI, ...). Out of scope dieser ADR. AISummary
  rendert vorerst SearXNG `answers` falls vorhanden (Calculator-Plugin,
  Self-Info-Plugin etc.) oder eine generische Erklaerung.

* **Source-Mix echte Engine-zu-Kategorie-Klassifikation**: braucht das
  gleiche Mapping wie Sources oben. Bars zeigen vorerst die
  Designprototyp-Verteilung als Visual-Placeholder; die Footer-Zeile
  ("No tracking · ...") nutzt die echte `max_response_time`.

## Consequences

* **Positiv**:
    * Visuell strikt am Designprototyp ausgerichtet — alle 12+ Komponenten
      des Mockups sind im Output vorhanden.
    * Filter sind dauerhaft sichtbar (mit Collapse-Option), keine
      Inline-Filter-Reihe mehr ueber den Ergebnissen.
    * Tweaks-Panel + Sidebar-Collapse persistent ueber Sessions
      (`localStorage`).
    * `.info_card_main` / `.info_card_related_card` / `.info_card_sourcemix`
      sind klar voneinander getrennte Components; spaetere Wiring-Arbeit
      (echte LLM-Summary, echte Engine-Klassifikation) bleibt lokal.

* **Negativ / Trade-Off**:
    * Region und Sources sind visuell-only — Klick aendert lokalen
      Active-State, aber sendet kein zusaetzliches Filter-Kriterium an
      SearXNG. User koennte das als kaputt empfinden, falls nicht klar
      kommuniziert. Sollte in einer User-doc / FAQ erwaehnt werden.
    * Source-Mix-Bars zeigen Mock-Daten — die Prozentwerte sind nicht
      wahr fuer die aktuelle Suche. Tooltip / kleiner "demo"-Hinweis
      koennte das mildern.
    * SearXNGs default-Kategorien `music` / `it` / `files` sind in der
      Tabs-Row nicht erreichbar; wer dort sucht, muss `/search?
      category_music=1` direkt aufrufen oder Preferences nutzen.
    * Sprache-Filter ist auf 5 Optionen reduziert (statt 100+). Andere
      Sprachen lassen sich nicht in der Sidebar waehlen — nur via
      `/preferences`.

* **Folgeaufgaben** (eigene ADRs wenn angegangen):
    * Engine-Klassifikation fuer Sources- und Source-Mix-Filter.
    * LLM-Integration fuer AISummary.
    * Ggf. Tabs-Row erweitern (music/it/files), wenn der Designprototyp
      fortgeschrieben wird.
