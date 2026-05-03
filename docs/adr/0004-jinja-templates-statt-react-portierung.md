# 0004 — Jinja-Templates statt React-Portierung

* Status: accepted
* Datum: 2026-05-03

## Context

Der Designprototyp ist React + Babel-Standalone (CDN), gerendert client-seitig
in einem `<div id="root">`. Mock-Daten liegen als JS-Objekte in
`loogi-data.jsx`. Die LOOGI-UI besteht aus zwei Seiten — Homepage und
Suchergebnisseite.

SearXNG selbst ist Server-Side-Rendering (Flask + Jinja2). Es gibt drei
Optionen, das Design zu uebertragen:

1. **React 1:1 portieren**: React+Babel via CDN, Daten ueber eine JSON-API von
   SearXNG holen, im Browser rendern.
2. **React + Build-Step**: React mit Vite/esbuild bauen, gebundeltes JS
   ausliefern, JSON-API ansprechen.
3. **Server-Side-Render via Jinja**: Templates aus dem Prototyp ableiten und in
   die SearXNG-Render-Pipeline einklinken.

## Decision

Wir gehen mit Option 3 — reine Jinja-Templates, keine React-Runtime im
Produktivcode.

## Alternatives considered

* **Option 1 (React via CDN)** — Bedeutet jede Suche laedt React+Babel im
  Browser, Babel-Transpile passiert client-seitig (langsam, blockiert First
  Paint). Mehr Aufwand fuer Suchmaschinen-Indexierung von Resultaten — wir
  selbst koennen unsere Resultate nicht crawlen. Privacy: jeder zusaetzliche
  CDN-Hop ist eine Tracking-Oberflaeche. Nichts spricht dafuer ausser dem
  bequemeren Code-Mapping.
* **Option 2 (React mit Build-Step)** — Bringt einen Vite/esbuild-Schritt in
  die Build-Pipeline. Mehr Tooling, mehr Update-Last (npm audit, etc.). Vorteil
  waere komponentenartige Wiederverwendung — die wir aber gar nicht brauchen,
  weil das Design statisch ist.

## Consequences

* **Positiv**: Kein Build-Step. Kein npm. Templates sind direkt in der
  SearXNG-Render-Pipeline und erhalten alle Variablen (results, paging,
  infoboxes, ...) ohne Umweg ueber eine JSON-API. Das React/Babel-CDN entfaellt
  → schnellere Loads, keine Drittanbieter-Requests.
* **Negativ / Trade-Off**: Wer ein React-Component-Modell gewohnt ist, findet
  Jinja umstaendlicher. Wir muessen den Loop zwischen "ich aendere das Design
  im Prototyp" und "ich aktualisiere das Theme" manuell schliessen — keine
  Single-Source-of-Truth.
* **Folgeaufgaben**: Wenn Design-Updates kommen, manuell in die `theme/`
  Templates uebernehmen. Mock-Daten aus `loogi-data.jsx` werden nicht
  portiert, alle Daten kommen aus SearXNG zur Laufzeit.
