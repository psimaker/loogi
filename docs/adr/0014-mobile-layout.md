# 0014 — Mobile-Layout (Phone-Drawer + Tablet-Collapsed-Default)

* Status: accepted
* Datum: 2026-05-03

## Context

Der Designprototyp (`/data/downloads/LOOGI - Search/`) liegt nur in einer
Desktop-Version vor. Die LOOGI-Theme-CSS hatte bisher zwei rudimentaere
Sub-Desktop-Breakpoints (in Form-und-Funktion aus ADR 0013):

* `@media (max-width: 1180 px)` — Padding kleiner (war ehemals fuer eine
  rechte Info-Spalte gedacht, die laengst nicht mehr existiert).
* `@media (max-width: 880 px)` — Layout flippt auf Vertikal-Stack:
  Filter-Sidebar wandert in voller Breite ueber die Ergebnisse.

Auf einem 375 px-iPhone-Viewport ist der Vertikal-Stack unbrauchbar:

* 240 px Filter-Sidebar belegt nach dem Flip die volle Bildschirmbreite
  und schiebt die Ergebnisse 2–3 Bildschirmhoehen nach unten.
* Topbar 72 px (Logo 40 + Suchbox 48) ist zu hoch fuer Phone-Verhaeltnisse.
* Result-Hover-Actions (External / EyeOff) sind auf Touch-Geraeten ohne
  Hover-Event nicht erreichbar.
* Pagination-Buttons (36×32) liegen unter Apple HIG (44 px Touch-Target).
* Auto-Type-Focus (jeder keydown ausserhalb eines Inputs fokussiert die
  Suchleiste) trifft auf Mobile-Browser unzuverlaessig: keydown-Events
  feuern ungleichmaessig, und der erzwungene Focus oeffnet ungewollt das
  System-Keyboard.
* iOS-Notch / Home-Bar werden nicht respektiert (kein
  `viewport-fit=cover`, kein `env(safe-area-inset-*)`).

Mobile-Optimierung ist also notwendig — es gibt keinen Designprototyp
zum 1:1-Portieren, das Layout wird pragmatisch aus dem Desktop-Designsystem
(OKLCH-Tokens, Inter Tight + JBM, 8 px-Grid) entwickelt. Constraints aus
CLAUDE.md Hard-Rules:

* Desktop (≥1024 px) darf sich **nicht** aendern — alle Aenderungen unter
  `@media (max-width: 1023px)`.
* Theme bleibt Vanilla-CSS/JS, kein Build-Step (ADR 0003).
* i18n in EN/DE/FR/ES/IT muss erhalten bleiben (ADR 0007).
* Touch-Targets ≥ 44 px (Apple HIG).

## Decision

LOOGI bekommt eine 3-Tier-Breakpoint-Struktur:

| Bereich | Breite | Behandlung |
|---------|--------|------------|
| Desktop | ≥ 1024 px | Unveraendert (240 Sidebar + Center, Topbar 72) |
| Tablet  | 641–1023 px | Layout bleibt; Padding kompakter; Filter-Sidebar default-collapsed (56 px Icon-Strip) via JS-Init |
| Phone   | ≤ 640 px | Off-Canvas-Drawer fuer Filter-Sidebar; kompakte Topbar (56) mit Hamburger-Btn; Tabs horizontal-scrollbar; Result-Actions immer sichtbar; Pagination 44×44; Auto-Type-Focus aus |

Konkrete Komponenten:

* **Off-Canvas-Drawer (Phone)**: `#filters_sidebar` wird `position: fixed`,
  `width: min(85vw, 320px)`, `transform: translateX(-100%)`. Body-Klasse
  `drawer_open` faehrt ihn ein (`translateX(0)`) und sperrt den Body-Scroll
  (`overflow: hidden`). Backdrop-Overlay (`#drawer_overlay`) verdunkelt den
  Hintergrund (rgba 0.55) und schliesst den Drawer auf Tap. Geschlossen
  zusaetzlich via Hamburger-Klick erneut, ESC-Taste, Resize > 640 px.
* **Hamburger-Btn**: `#drawer_toggle` rechts in der Topbar
  (`[Logo] [Search-Box flex:1] [Hamburger]`), `aria-controls="filters_sidebar"`
  + `aria-expanded` synchron zum Drawer-Zustand. Display nur auf Phone
  (`display:none` default).
* **Tablet-Collapsed-Default**: JS-Init prueft beim Laden
  `localStorage.getItem('loogi_sidebar_collapsed')` — wenn `null` und
  Viewport-Breite 641–1023 px, wird `body.sidebar_collapsed` gesetzt.
  User-Toggle ueber den Sidebar-Header-Btn ueberschreibt persistent
  (`'1'` oder `'0'`).
* **Tabs h-scroll (Phone)**: `#categories` overflow-x:auto + Touch-Inertia,
  Scrollbar visuell aus. `results_meta` (≈ X Ergebnisse) auf Phone
  display:none — redundant mit Tab-Counts.
* **Result-Actions touch (Phone)**: `.result_actions` opacity:1 +
  pointer-events:auto, flex-direction:row, 40×40 Tap-Target.
* **iOS-Notch**: viewport-meta `viewport-fit=cover` + `env(safe-area-inset-*)`
  fuer Topbar (`padding-top`), Drawer (`padding-top`/`padding-bottom`),
  Pagination, Footer, Main-Column.
* **Auto-Type-Focus-Skip**: `matchMedia('(pointer: coarse)')`-Check im
  keydown-Handler vor der Auto-Type-Logik. Cmd/Ctrl-K Shortcut bleibt
  aktiv (Touch-Laptops mit Hardware-Keyboard).

Implementierungsdetails siehe `theme/loogi/static/css/loogi.css`
(@media-Bloecke am Ende), `theme/loogi/static/js/loogi.js` und
`theme/loogi/templates/{base.html,search.html,results.html}`.

## Alternatives considered

* **Beim Vertikal-Stack-Fallback bleiben** (Status quo aus ADR 0013):
  Minimalinvasiv. Verworfen — auf 375 px-Phones ergibt der 240-px-Filter-
  block oben am Bildschirm (volle Breite, alle 3 Sektionen ausgeklappt) ein
  unbrauchbares Erlebnis. Drawer-Pattern haelt die Ergebnisse oberhalb des
  Folds und gibt Filtern eine eigene Ebene.

* **Bottom-Sheet statt Off-Canvas-Drawer von links**: Modern auf iOS-Native
  ueblich. Verworfen — die Filter-Liste umfasst 5 Sektionen (Time, Language,
  SafeSearch zzgl. Sidebar-Header und kuenftige Sources/Region-Kandidaten),
  zu lang fuer ein Sheet das nur teilweise auf den Bildschirm passt. Ein
  Off-Canvas-Drawer kann full-height scrollen.

* **Modal-Overlay (zentriert, dimmed background)**: Verworfen — fuehlt sich
  blockierender an als ein Drawer und macht die Ergebnisse waehrend der
  Filter-Auswahl unsichtbar. Drawer mit halb-transparentem Backdrop laesst
  den Result-Kontext sichtbar.

* **Pure CSS Tablet-Collapsed-Default** (ohne localStorage, ohne JS-Init):
  Per `@media (641-1023px) #filters_sidebar { width: 56px; ... }` und
  Toggle-Klasse. Verworfen — kein User-Toggle-Persistenz. Wenn der Tablet-
  User die Sidebar einmal expandiert, sollte sie expandiert bleiben (auch
  ueber Reloads).

* **Breakpoint @ 768 px statt 640/1023**: 768 ist iPad-portrait. Verworfen —
  iPad-portrait soll Tablet-Behandlung bekommen (Layout bleibt mit Sidebar),
  nicht Phone-Drawer-Behandlung. 640 ist der natuerliche Cut zwischen
  "smartphones (incl. plus-size phones, max ~430 logical px)" und
  "klein-tablet/large phone". 1023 ist die natuerliche Untergrenze fuer
  Tablet-Landscape und kleine Notebooks (1024 = Desktop).

* **Hamburger links statt rechts**: Material-/Google-Stil. Verworfen
  zugunsten User-Praeferenz `[Logo] [Search] [Hamburger]` — die Suchbox ist
  primary und bekommt den groessten Bereich; Hamburger ist sekundaer und
  rechts.

## Consequences

* **Positiv**:
  * Mobile-Erlebnis funktioniert auf 375 px-Viewports (iPhone SE) ohne
    horizontalen Scroll oder Layout-Bruch.
  * Notch und Home-Bar werden auf modernen iPhones respektiert (Bar pusht
    runter, Footer pusht hoch).
  * Apple-HIG Touch-Target ≥ 44 px erfuellt fuer Pagination und Hamburger.
  * iPad-portrait (768) hat die Filter-Sidebar default-collapsed —
    Center-Column kriegt die volle Breite die zur Verfuegung steht.
  * Body-Scroll-Lock bei offenem Drawer verhindert iOS-Bouncing-Glitch.

* **Negativ / Trade-Off**:
  * Plus +98 Zeilen CSS (`@media`-Bloecke am Ende) plus +30 Zeilen JS
    (Drawer-Toggle, Tablet-Init, Auto-Type-Skip, Resize-Cleanup) — der
    Theme-Footprint waechst um ~10 %.
  * Result-Actions auf Phone in 40×40 statt 44×44 — knapp unter Apple HIG,
    aber 44 sprengt die enge Result-Spalte. Akzeptiert.
  * `body.sidebar_collapsed` und `body.drawer_open` sind separate States,
    die auf Phone gleichzeitig auftreten koennen (wenn vorher Tablet oder
    Desktop user collapsed gesetzt hatte). CSS hebt sidebar_collapsed auf
    Phone explizit aus (Drawer-Pattern dominiert) — eine zusaetzliche
    Source of Truth, die in der CSS-Regel-Liste sichtbar bleibt.
  * Kein Designprototyp fuer Mobile — visuelle Entscheidungen
    (Drawer-Animation, Hamburger-Position, Backdrop-Opacity) sind
    pragmatische Konventionen, kein 1:1-Port.

* **Folgeaufgaben** (eigene ADRs wenn angegangen):
  * Ggf. eine Bottom-Toolbar mit Filter-Pills als Alternative zum Drawer,
    falls die Drawer-Interaktion sich als zu schwergewichtig herausstellt.
  * Designprototyp-Mobile-Variante zeichnen, sobald Bandbreite vorhanden,
    und gegen die aktuelle pragmatische Implementierung diffen.
  * Browser-Verifikation auf realen Geraeten (iPhone SE 375×667, iPhone 14
    Pro 393×852, iPad portrait 768×1024) — CLI-Tests koennen Mobile-
    Rendering nicht simulieren.
