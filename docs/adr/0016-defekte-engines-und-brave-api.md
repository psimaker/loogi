# 0016 — Defekte Engines entfernen, Brave auf offizielle API umstellen

* Status: accepted
* Datum: 2026-05-10

## Context

Folge-Untersuchung zu ADR 0015. Die Live-Logs der Instanz zeigen, dass mehrere
in `keep_only` aktivierte Engines auf der Server-IP dauerhaft blockiert
werden — unabhaengig von Last:

| Engine     | Symptom                                                | Ursache                                  |
|------------|--------------------------------------------------------|------------------------------------------|
| `google`   | `HTTP error 403 (suspended_time=180)` bei jeder Query  | Google bot-detected Cloud-/Server-IPs    |
| `brave`    | `Too many requests (suspended_time=180)`               | Brave HTML-Scrape rate-limitet auf IP    |
| `duckduckgo` | `CAPTCHA (wt-wt)`                                    | DDG flagged die IP als verdaechtig       |
| `wikidata` | `HTTP error 403` beim Engine-Init (`query.wikidata.org/sparql`) → `can't register engine processor` | wikidata.org blockiert die IP gegen SPARQL-Lasttests |

`google` und `wikidata` liefern dauerhaft nichts und sind somit toter Ballast
in der Engine-Liste — sie kosten Latenz (Request + Timeout) und treiben den
"unresponsive_engines"-Block in jeder Antwort.

`brave` (HTML-Scrape) ist nicht generisch fixbar — ein Proxy-Pool waere
nicht-trivial und kollidiert mit ADR 0001/0008. Brave bietet aber eine
**offizielle Search-API** mit Subscription-Token, die SearXNG ueber eine
separate Engine-Klasse `braveapi` (`searx/engines/braveapi.py`) anspricht.
Die ist im Default `inactive: true` und braucht ein `api_key`-Feld.

`duckduckgo` zeigt CAPTCHA mit `suspended_time=0` — das heisst, DDG ist
zwischendurch wieder verfuegbar. Die Engine wird drin gelassen und bei
Ausfall haelt SearXNG sie ohnehin temporaer raus. Kein dauerhafter Schaden.

## Decision

1. **`google` aus `keep_only` entfernen.** Dauerhaft 403, kein zu erwartender
   Recovery-Pfad ohne Proxy-Infrastruktur.

2. **`wikidata` aus `keep_only` entfernen.** Init scheitert dauerhaft, Engine
   ist im Container nie aktiv.

3. **`brave` (HTML-Scrape) durch `braveapi` (offizielle API) ersetzen.** In
   `keep_only` rein mit `braveapi`; `brave` bleibt aus technischen Gruenden
   formell in der Liste (siehe Hinweis am Ende), aber via Override
   `disabled: true` aus den Default-Suchen rausgenommen. Dazu:

   * Ein `engines:`-Override-Block in `searxng/settings.yml`, der `braveapi`
     mit `inactive: false` und `api_key: "BRAVE_API_KEY_PLACEHOLDER"`
     definiert (siehe ADR 0009 — bei `use_default_settings: true` greift
     der Deep-Merge fuer `engines` nicht; Engine muss in der lokalen
     Settings vollstaendig wiederholt werden).
   * Der Placeholder wird zur **Build-Zeit** durch einen `RUN sed` im
     `Dockerfile` mit dem Wert von `ARG BRAVE_API_KEY` ersetzt. Der Build-Arg
     kommt via `compose.yml` aus `.env` (`BRAVE_API_KEY=...`).
   * Wenn der User keinen Key setzt, bleibt der Placeholder leer →
     `braveapi.init()` wirft `SearxEngineAPIException("No API key
     provided")` → SearXNG registriert die Engine nicht. Kein Crash, nur
     keine Brave-Resultate. Identisches Verhalten wie vor dieser ADR
     (Brave 429 = effektiv keine Resultate).

4. **`duckduckgo` bleibt aktiv.** CAPTCHA-Block ist transient, SearXNG
   handelt das via temporaeres Suspend.

## Alternatives considered

* **Outbound-Proxy-Pool fuer Google/Brave-Scrape** — funktioniert grundsaetzlich,
  ist aber gegen ADR 0001/0008 gerichtet (Self-hosted, einfache Architektur)
  und zieht laufende Kosten + Wartung nach sich.

* **`google` und `brave` einfach drinlassen** — kostet Latenz (Timeout pro
  Request) und macht das `unresponsive_engines`-Feld in jeder Antwort
  voll. Sichtbar fuer User in der Sidebar (sobald wir die rendern), und
  SearXNG-Ranking-Algorithmus berechnet Engine-Distrust-Scores die durch
  staendige Failures belastet werden.

* **API-Key direkt in `searxng/settings.yml` committen** — Repo ist
  AGPL-3.0 und vermutlich oeffentlich; Subscription-Tokens duerfen nicht
  rein. Build-Arg-Patch ist die schlanke Alternative ohne externe
  Volume-Mounts (vgl. ADR 0003).

* **Bing oder Yahoo als Brave-Ersatz** — Bing-HTML-Scrape ist ebenfalls
  IP-empfindlich; Yahoo ist einer der unzuverlaessigsten SearXNG-Engines.
  Brave-API ist bezahlt aber stabil — passt besser zu LOOGI als
  Single-Source.

* **`wikidata` mit anderer Quelle ersetzen** — gibt keine direkte
  Alternative; die anderen Wiki-Engines (`wiktionary`, `wikibooks`,
  `wikiquote`, `wikisource`) decken den Wiki-Tab inhaltlich ab.

## Consequences

* **Positiv**:
  * Engine-Liste reflektiert jetzt nur noch Engines, die tatsaechlich
    Resultate liefern. Saubere Logs, kein Init-Fehler, weniger Latenz im
    Tail.
  * Brave-Resultate sind via API stabil und liefern sauberes JSON statt
    HTML-Scrape-Drift. Token-basiert, also nicht IP-blockierbar.
  * Repo bleibt secret-frei: API-Key liegt nur lokal in `.env`.

* **Negativ / Trade-Off**:
  * Brave-Search-API ist **kostenpflichtig** ab einer Quota. Free-Tier
    reicht fuer eine Single-User-Instanz, bei wachsendem Traffic Kosten
    monitoren.
  * Ohne gesetzten Key liefert Brave gar nichts — fuer LOOGI-Setups ohne
    Brave-Subscription ist die Diversitaet im general-Tab geringer
    (Startpage, DDG, Mojeek, Mwmbl, Qwant). Akzeptabel, weil das
    HTML-Scrape vorher auch nichts geliefert hat.
  * Build-Arg liegt als Layer-Metadata im lokalen Image. Da das Image
    nirgends gepublished wird (ADR 0003: bake-and-keep-local), kein
    Leakage-Risiko nach aussen.

* **Folgeaufgaben**:
  * `BRAVE_API_KEY` in lokaler `.env` setzen, dann `docker compose build`
    + `up -d`. Beobachten ob `braveapi` in `unresponsive_engines` wieder
    auftaucht — dann ist der Key falsch oder die Quota ueberschritten.
  * Mittelfristig pruefen, ob eine Brave-Images/Videos/News-API-Engine
    in SearXNG erscheint. Aktuell sind `brave.images`, `brave.videos`,
    `brave.news` weiter HTML-Scrape und teilen das IP-Risiko — bleiben
    aber drin, weil API-Alternative fehlt.

## Hinweis: `brave` bleibt als Network-Donor in `keep_only`

`brave.images`, `brave.videos` und `brave.news` definieren in den Default-
Settings `network: brave` — d.h. sie teilen sich den HTTP-Connection-Pool
der `brave`-Engine. Wird `brave` aus `keep_only` entfernt, schlaegt der
Network-Init mit `KeyError: 'brave'` fehl und der Granian-Worker crasht
in einer restart-loop.

Loesung: `brave` bleibt formell in `keep_only`, ist aber im
`engines:`-Override-Block dieser Settings auf `disabled: true` gesetzt.
SearXNG laedt die Engine-Definition (damit `NETWORKS['brave']` existiert),
fragt sie aber bei Default-Suchen nicht ab. Sichtbar nur fuer User, die
sie in den Preferences explizit aktivieren — was wir nicht empfehlen,
solange das HTML-Scrape im 429-Loop steckt.

Eine sauberere Loesung waere, in den Sub-Engines `network: brave` durch
ein eigenes Network-Definition-Object zu ersetzen. Das duplizierte
Connection-Pool-Settings und macht zukuenftige Upstream-Updates der
Brave-Network-Config unsichtbar — daher hier verworfen.

## Hinweis: Volume `/etc/searxng` ueberschreibt Image-Updates

Das offizielle SearXNG-Image deklariert `/etc/searxng` als anonymes
Volume. Beim ersten Container-Start wird `settings.yml` aus dem Image-
Layer ins Volume kopiert; bei spaeteren Recreates bleibt das Volume
bestehen und der Image-Update wird **nicht** ins Volume durchgereicht
(SearXNG-Entrypoint legt nur eine `settings.yml.new`-Datei an als
Hinweis).

Workflow nach jedem Edit an `searxng/settings.yml`:

```sh
docker compose build
docker compose stop searxng
docker compose rm -f searxng
docker volume rm $(docker inspect loogi --format='{{range .Mounts}}{{.Source}}{{end}}' | grep -o '[a-f0-9]\{64\}' | head -1)
# alternativ einfacher: docker compose down (laesst valkey-data
# als named volume in Ruhe) — entfernt aber das Anonymous-Volume nicht.
# Das anonymous Volume muss separat geloescht werden, sonst greift der
# Image-Update nicht.
docker compose up -d
```

Eine dauerhafte Loesung (z.B. Bind-Mount fuer `/etc/searxng` oder
Init-Container, das settings.yml ins Volume kopiert) sprengt den
Scope dieser ADR und sollte separat entschieden werden.
