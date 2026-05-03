# 0013 — 3-Spalten-Layout fuer die Results-Seite

* Status: accepted
* Datum: 2026-05-03

## Context

Der Designprototyp (`loogi-search-design/project/loogi-app.jsx` → Komponente
`App`) zeigt die Results-Seite als drei-spaltiges Layout:

* **Links (240 px)**: Sidebar mit Filtern (Time, Language, Region, Sources,
  Safe search) als vertikale Liste.
* **Mitte (1fr)**: Suchergebnisse + Pagination.
* **Rechts (320 px)**: Info-Spalte mit Wikipedia/Knowledge-Card,
  "People also search" und Quellen-Mix.

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
sein").

## Decision

Die Results-Seite wird auf ein 3-Spalten-CSS-Grid umgestellt
(`240px minmax(0, 1fr) 320px`):

* **`#filters_sidebar`** (links, 240 px): Eigene `<form method="POST"
  action="/search">`, die `q` + `selected_categories` + `theme` als hidden
  inputs traegt und die bestehenden Filter-Templates
  (`filters/time_range.html`, `filters/languages.html`,
  `filters/safesearch.html`) als `<select>`-Steuerelemente einschliesst,
  jeweils mit Mono-Uppercase-Section-Label dariiber. Submit via
  `Apply`-Button.
* **`#results_main`** (Mitte, 1fr): unveraendert — Answers, `#urls`-Liste,
  Pagination.
* **`#info_sidebar`** (rechts, 320 px): SearXNG-Sidebar-Inhalte
  (Infobox, Suggestions, Engines-Msg, APIs) jeweils in `.info_card`
  gewrappt — `panel`-Background, 1px `line-soft`-Border, 12px Radius,
  14×16px Padding, 18px Gap zwischen Cards. Engines-Msg + APIs nutzen
  Variant `.info_card.subtle` (transparent, kompakter) weil sekundaer.

`.search_filters`-Zeile in `search.html` (inline-Filters ueber den
Ergebnissen) wird ersatzlos entfernt — die Filter leben jetzt
ausschliesslich in der linken Sidebar.

Responsive-Breakpoints:

* `<= 1100 px` → 2-Spalten (Filter | Main), Info-Sidebar fliesst unten in
  einer Auto-Fit-Reihe.
* `<= 760 px` → 1-Spalte, Filter unter den Ergebnissen.

## Alternatives considered

* **Filter inline ueber den Ergebnissen lassen** — minimalinvasiv, aber
  matched den Designprototyp nicht. Verworfen.

* **Filter im Top-Bar (neben dem Such-Input)** — kein Designprototyp-Hint
  in diese Richtung; die TopBar des Designs ist bewusst minimal (Logo +
  Such-Input). Verworfen.

* **Region- und Sources-Filter implementieren** — der Designprototyp zeigt
  diese als Kategorien. SearXNG hat aber keine 1:1-Entsprechung:
  *Region* nicht im Stack vorgesehen (nur `language`), *Sources* (Academic
  / News / Code / Blogs / Books / Discussions) liesse sich nur ueber eine
  custom Engine-Klassifizierung umsetzen — aufwaendig und ohne sauberen
  Daten-Owner. Bewusste Auslassung; Filter-Sidebar zeigt nur die drei
  funktional verfuegbaren Optionen. Doku: hier.

* **AISummary-Banner (oberhalb der Ergebnisse) implementieren** — der
  Designprototyp hat einen Akzent-umrandeten "Loogi summary"-Block.
  SearXNG generiert aber keine eigenen Zusammenfassungen; wuerde einen
  externen LLM-Aufruf brauchen. Verworfen — out of scope dieser ADR.

* **Source-Mix-Bars + "People also search"-Card** — Source-Mix braucht
  Engine-Klassifizierung (siehe Region/Sources oben), "People also search"
  braucht related-query-Daten die SearXNG nicht out-of-the-box liefert.
  Verworfen.

* **Filter im Haupt-`form#search` lassen, via CSS-Grid `display: contents`
  oder `grid-area` umpositionieren** — funktioniert prinzipiell, koppelt
  aber Form-Layout an Grid-Struktur und macht das Submit-Verhalten
  unintuitiv (ein Filter-Click submitted das gesamte Suchformular). Eine
  separate `<form>` in der Filter-Sidebar mit explizitem Apply-Button ist
  klarer.

## Consequences

* **Positiv**:
    * Visuell strikt am Designprototyp ausgerichtet (Filter links, Info
      rechts).
    * Filter sind dauerhaft sichtbar — der User kann waehrend des Scrollens
      durch Ergebnisse jederzeit Filter aendern, ohne nach oben zu scrollen.
    * `.info_card`-Container ist generisch — neue Sektionen lassen sich
      einfach in `info_sidebar` einsetzen, ohne weitere Styling-Arbeit.
    * Engine-Messages sind als `.info_card.subtle` weniger aufdringlich
      (transparent), bleiben aber zugaenglich.

* **Negativ / Trade-Off**:
    * Filter-Apply braucht jetzt einen expliziten Klick (kein Auto-Submit
      bei `<select>`-Change). Etwas mehr Reibung, dafuer transparenter.
    * Auf schmalen Viewports (< 1100 px) wird das Layout 2-spaltig, die
      Info-Sidebar wandert nach unten — Designprototyp ist auf 1440 px
      Viewport ausgelegt, fuer schmaler ist responsive ohnehin nicht
      Designvorgabe sondern Pflichtanforderung des Browsers.
    * Region- + Sources-Filter sowie AISummary + "People also search" +
      Source-Mix sind im Designprototyp vorhanden, hier aber NICHT
      portiert (siehe Alternatives). Wenn diese spaeter gewuenscht werden,
      brauchen sie eigene ADRs (Datenmodell-Diskussion).

* **Folgeaufgaben**:
    * Wenn LLM-gestuetzte Antworten dazukommen sollen → eigene ADR fuer
      AISummary-Block.
    * Wenn Engine-Klassifizierung gebaut wird → eigene ADR fuer Source-Mix
      + Sources-Filter.
