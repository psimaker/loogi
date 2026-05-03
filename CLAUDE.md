# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Was ist LOOGI?

LOOGI ist eine eigene Web-Suchmaschine fuer **loogi.ch**, gebaut auf
[SearXNG](https://docs.searxng.org/) mit hardcoded Custom-Theme. Vollstaendig
per Docker Compose deployt; Reverse-Proxy/TLS macht NPM extern.

## Hard rules — bevor du irgendwas aenderst

1. **Design ist hardcoded und darf nicht veraendert werden.** Das LOOGI-Theme
   in `theme/loogi/` ist das Produkt — Farb-Palette, Typografie, Layout,
   Logos kommen aus dem urspruenglichen Designprototyp und sind 1:1
   uebernommen. Aenderungen daran nur auf explizite User-Anforderung.

2. **Architektur-Entscheidungen brauchen ein ADR.** Wenn du eine
   nicht-triviale Entscheidung triffst (neuer Service, Auswahl zwischen
   Bibliotheken, Aenderung an der Theme-Strategie, neue Engine-Klasse
   aktivieren, Reverse-Proxy-Strategie aendern, ...), dokumentiere sie
   als ADR unter `docs/adr/` im MADR-Format. Vorlage: `0000-template.md`.
   Index in `docs/adr/README.md` aktualisieren.

3. **Lizenz: AGPL-3.0.** Theme-Templates sind aus SearXNGs `simple/`
   abgeleitet — Copyleft greift. Keine proprietaeren Code-Beitraege.

4. **Kein Build-Step im Theme.** CSS/JS sind Vanilla, kein
   npm/Vite/PostCSS. Wenn du das aendern willst → ADR vorher.

## Repo-Layout

```
.
├── Dockerfile             # FROM searxng/searxng:latest + COPY theme + config
├── compose.yml            # services: searxng, valkey; networks: proxy-net (extern), searxng (intern)
├── .env.example           # SEARXNG_SECRET-Slot
├── searxng/
│   ├── settings.yml       # use_default_settings: true + Deltas (Branding, Theme, Engine-keep_only, ...)
│   └── limiter.toml       # trusted_proxies fuer NPM, link_token = true
├── theme/loogi/
│   ├── templates/         # Jinja-Templates — wird zu /usr/local/searxng/searx/templates/loogi/
│   │   ├── base.html      # Hardcoded LOOGI-Layout (Header, Footer, Dark-Theme-Variablen)
│   │   ├── index.html     # Homepage (LOOGI-Wordmark + grosse Suchbox)
│   │   ├── results.html   # Ergebnisseite (Sticky-Header, Sidebar, Pagination)
│   │   ├── search.html    # Suchform-Header (auf Results-Seite)
│   │   ├── simple_search.html  # Vereinfachte Suchbox (Index)
│   │   ├── categories.html     # Tabs (Web/Bilder/News/...)
│   │   ├── icons.html / macros.html  # SVG-Icons + Result-Render-Macros
│   │   ├── filters/, elements/, messages/, result_templates/  # aus simple/ portiert
│   │   └── preferences/, answer/  # aus simple/ portiert
│   └── static/
│       ├── css/loogi.css  # OKLCH-Palette, Layout, Komponenten
│       ├── js/loogi.js    # Cmd/Ctrl+K, back-to-top
│       └── img/           # loogi-mark.png|svg, loogi-wordmark.png, favicon.png|svg
└── docs/adr/              # ADRs im MADR-Format
```

## Wo welche Aenderung hingehoert

| Wenn du... | Dann edit... |
|------------|--------------|
| das Layout/Styling anpasst (NUR auf Anweisung) | `theme/loogi/static/css/loogi.css` |
| ein Template-Markup aenderst | passendes File unter `theme/loogi/templates/` |
| eine Engine aktivierst/deaktivierst | `searxng/settings.yml` → `use_default_settings.engines.keep_only` |
| die Branding-Settings aenderst (Name, base_url) | `searxng/settings.yml` → `general:` / `server:` |
| die Limiter-Schwelle / trusted_proxies aenderst | `searxng/limiter.toml` |
| Container-Konfig (Env, Network, Volumes) | `compose.yml` |
| das Image-Layout aenderst | `Dockerfile` (+ ADR fuer warum) |
| eine Architektur-Entscheidung dokumentierst | `docs/adr/NNNN-titel.md` (+ Index) |

## Theme-Mechanik (wichtig zu verstehen)

* SearXNG findet Themes per Verzeichnis-Scan in `searx/templates/`.
  Unser Theme liegt im Container unter
  `/usr/local/searxng/searx/templates/loogi/` (durch `Dockerfile` COPY).
* `ui.default_theme: loogi` in `settings.yml` aktiviert es.
* Es gibt **keinen automatischen Fallback** zwischen Themes — jedes
  benoetigte Template muss in `theme/loogi/templates/` existieren. Bei
  Verdacht auf fehlendes Template: Diff gegen
  `searxng/searx/templates/simple/` im Upstream pruefen.
* Static-Assets via `{{ url_for('static', filename='themes/loogi/...') }}`.
* `sxng-core.min.js` aus dem globalen SearXNG-Bundle wird in `base.html`
  geladen — liefert Autocomplete und Hotkey-Behaviour. Erwartet die
  IDs `#q`, `#clear_search`, `#send_search` und die Klasse
  `.autocomplete` im DOM (in unseren Templates so vorhanden).

## Build & Deploy

```sh
docker compose build       # Smoke-Test, baked Theme + Config ins Image
docker compose up -d
docker compose logs -f searxng
```

Voraussetzung: Docker-Netz `proxy-net` existiert (NPM legt das normalerweise
beim Start an). Wenn nicht: `docker network create proxy-net`.

NPM-Eintrag fuer `loogi.ch`: Forward Host `loogi`, Port `8080`,
Scheme `http`. Headers `X-Forwarded-For` + `X-Forwarded-Proto` durchreichen.

## Tests / Validierung

* Es gibt keine Tests im Repo. Validierung ist manuell:
  1. `docker compose build` → muss ohne Fehler durchlaufen
  2. `docker compose up -d` + `docker compose logs searxng` → keine
     Template-Render-Fehler
  3. Browser auf `https://loogi.ch/`: Homepage zeigt LOOGI-Wordmark
     + Suchbox; Suche liefert Ergebnisse aus den kuratierten Engines.
* Healthcheck-Endpoint im Container: `GET /healthz` → `OK`.

## Was NICHT zu tun ist

* **Niemals** das `simple`-Theme aus dem Image entfernen (Falls SearXNG
  intern darauf zurueckfaellt; ist sowieso winzig).
* **Niemals** Pfade unterhalb `/usr/local/searxng/` im Container
  hand-modifizieren (alles via Dockerfile COPY oder via
  `SEARXNG_SETTINGS_PATH`-Mechanismus).
* **Niemals** `ports:` in `compose.yml` exposen — NPM ist der einzige
  Eingang. Siehe ADR 0008.
* **Niemals** `.env` committen.

## Quick reference: SearXNG-Template-Variablen

Verfuegbar in `results.html` (vom Render-Call in `searx/webapp.py`):
`results`, `q`, `pageno`, `number_of_results`, `paging`, `suggestions`,
`corrections`, `answers`, `infoboxes`, `unresponsive_engines`, `timings`,
`max_response_time`, `engine_data`, `selected_categories`,
`current_language`, `time_range`, `safesearch`, `theme`, `method`,
`timeout_limit`, `search_formats`, `query_in_title`.

Globale Variablen (alle Templates): `instance_name`, `searxng_version`,
`endpoint`, `link_token`, `client_settings`, `categories`,
`categories_as_tabs`, `preferences`, `_()` (Babel-i18n), `url_for`,
`get_setting()`, `image_proxify()`, `favicon_url()`, `get_pretty_url()`,
`get_result_template()`, `locale_rfc5646`, `rtl`.
