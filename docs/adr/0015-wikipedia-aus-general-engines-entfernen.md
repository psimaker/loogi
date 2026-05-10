# 0015 — Wikipedia-Engine aus dem general-Tab entfernen

* Status: accepted
* Datum: 2026-05-10

## Context

Bei einem Blick auf die Ergebnisseite ist aufgefallen, dass Wikipedia im
general-Tab praktisch immer als Top-Result auftaucht — auch bei Queries, bei
denen Google/DuckDuckGo den Wikipedia-Eintrag nicht an Position 1 haben
(Beispiel: Query `hello` → Google rankt "HELLO! Magazine" zuerst, LOOGI
zeigte Wikipedia oben).

Untersuchung der Live-Instanz ergab zwei Ursachen:

1. **Engine-Ausfaelle.** Brave (HTTP 429), Google (HTTP 403) und DuckDuckGo
   (CAPTCHA) werden auf der LOOGI-Server-IP regelmaessig blockiert — ein
   bekanntes Problem fuer selbstgehostete SearXNG-Instances mit Cloud-IPs.
   Effektiv liefert oft nur Startpage Treffer; dessen Position 1 ist fuer
   viele Queries Wikipedia. Wenn nur eine Engine antwortet, ist deren
   Ranking automatisch das LOOGI-Ranking.

2. **Wikipedia-Engine leakt Listen-Treffer.** Im SearXNG-Default ist
   `wikipedia` mit `display_type: ["infobox"]` konfiguriert — sollte also
   nur als Sidebar-Infobox erscheinen, nicht als Listen-Eintrag. Der Engine-
   Code (`searx/engines/wikipedia.py:187`) macht aber eine Ausnahme:

   ```python
   if "list" in display_type or api_result.get('type') != 'standard':
       results.append({...})
   ```

   Bei mehrdeutigen Begriffen (z.B. `python` → Disambiguation-Page) ist
   `type != 'standard'` und Wikipedia wird trotz `["infobox"]` als
   Listen-Treffer eingefuegt — dann sogar mit dem hohen Engine-Score
   einer Single-Source-Engine.

Hinzu kommt: das LOOGI-Theme rendert `infoboxes` aktuell nirgends (anders als
das Upstream-`simple/`-Theme). Wikipedia-Infoboxes erreichen also den User
ohnehin nicht — der einzige Weg, ueber den die Wikipedia-Engine sichtbar
wird, ist der Listen-Leak aus Punkt 2.

## Decision

Wir streichen `wikipedia` aus `use_default_settings.engines.keep_only` in
`searxng/settings.yml`. Die Wikipedia-Engine wird damit gar nicht mehr
geladen.

Wikipedia-Eintraege bleiben fuer User trotzdem findbar:

* ueber die Listen-Treffer der grossen Engines (Startpage, DDG, Google,
  Brave, ...) — die rankt SearXNG dann nach normalem Score-Algorithmus
  (Engine-Position-basiert + Multi-Engine-Bonus), ohne den Single-Source-
  Wikipedia-Boost
* ueber den dedizierten Wiki-Tab via `wikidata`, `wiktionary`, `wikibooks`,
  `wikiquote`, `wikisource` — die bleiben aktiv

## Alternatives considered

* **Wikipedia-Gewicht senken (`weight: 0.5`)** — dampft den Effekt, aber
  loest den Listen-Leak bei Disambiguation-Pages nicht (Score waere immer
  noch hoch genug fuer Top-3). Und den User-Eindruck "Wikipedia immer oben"
  haetten wir weiterhin als Default-Wahrnehmung, nur abgemildert.

* **`display_type: []` in settings.yml setzen** — wuerde die Listen-Leaks
  zwar verhindern, aber die Engine wuerde leer-laufen (keine Infoboxes,
  keine List-Items). Funktional identisch zum kompletten Entfernen, aber
  mit aktiver Engine ohne Output. Sauberer ist, sie ganz auszuschalten.

* **Mehr stabile Engines hinzufuegen, damit Startpage nicht alleine
  traegt** — eigentlicher Root-Cause-Fix fuer Punkt 1, aber unabhaengig
  von Wikipedia. Wird separat verfolgt; der Listen-Leak aus Punkt 2
  bleibt von dieser Loesung unberuehrt.

* **Infobox-Rendering im LOOGI-Theme nachziehen** — wuerde Wikipedia als
  Sidebar zurueckbringen. Eigene Aufgabe, kein Conflict mit dieser ADR;
  bei Bedarf separat entscheiden.

## Consequences

* **Positiv**: Kein Listen-Leak der Wikipedia-Engine mehr (Disambiguation-
  Edge-Case verschwindet). Ranking im general-Tab spiegelt das Konsens-
  Ranking der Web-Engines wider, statt von einer Single-Source-Engine
  dominiert zu werden.
* **Negativ / Trade-Off**: Wikipedia-Treffer haben jetzt nur noch die Score-
  Multiplikation aus den Engines, die sie listen — wo Wikipedia *wirklich*
  der beste Treffer ist (z.B. `merkel`), erscheint er weiterhin oben, aber
  nicht mehr ueberall mit kuenstlich hohem Score.
* **Folgeaufgaben**:
  * Engine-Ausfaelle (Brave 429, Google 403, DDG CAPTCHA) bleiben offen —
    eigene Untersuchung. Optionen: Brave-Search-API mit Token, Google
    aus `keep_only` streichen wenn dauerhaft 403, alternative Engines
    (z.B. Bing, Yahoo) zur Diversifizierung pruefen.
  * Wikidata-Engine schlaegt beim Init mit HTTP 403 fehl
    (`query.wikidata.org/sparql`) — separat pruefen, ob Engine im wiki-Tab
    aktiv ist oder durch IP-Block dauerhaft tot.
