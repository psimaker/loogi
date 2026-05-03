# 0008 — Keine Ports exposed, Reverse-Proxy via NPM

* Status: accepted
* Datum: 2026-05-03

## Context

Auf dem Zielhost laeuft bereits Nginx Proxy Manager (NPM) auf einem
externen Docker-Bridge-Netz `proxy-net`. NPM uebernimmt:

* TLS-Terminierung (Let's-Encrypt)
* Hostname-Routing fuer mehrere Services auf einem Server
* Forward von loogi.ch zum LOOGI-Container

Das LOOGI-Compose-Setup soll sich da einreihen, ohne eigene Ports zu exposen
und ohne Doppel-Konfig (Cert-Management oder Routing) zu duplizieren.

## Decision

* `compose.yml` haengt den `searxng`-Container an zwei Netze:
  * `proxy-net` (extern) — fuer NPM
  * `searxng` (internal Bridge) — fuer Valkey-Kommunikation
* `valkey` ist nur am internen `searxng`-Netz, nicht am `proxy-net`.
* Es gibt keine `ports:`-Sektion. NPM erreicht den Container ueber den
  Hostnamen `loogi` (Container-Name) auf dem Container-internen Port
  `8080` (SearXNG-Default).
* `server.base_url: "https://loogi.ch/"` in `settings.yml`, damit
  Link-Generierung im UI die externe URL verwendet, nicht
  `http://loogi:8080/`.

## Alternatives considered

* **Eigener Reverse-Proxy im Compose** (Caddy, Traefik) — wuerde NPM
  duplizieren, der schon das Cert-Management fuer andere Dienste auf dem
  Host macht.
* **`ports: ["127.0.0.1:8080:8080"]`** — wuerde funktionieren, aber NPM
  haette dann zwei Wege: ueber Container-Network oder ueber Host-Loopback.
  Container-Network ist sauberer.

## Consequences

* **Positiv**: NPM macht TLS und Routing zentral, LOOGI ist ein
  unprivilegierter Container ohne offene Ports zum Host. Klares
  Separation-of-Concerns.
* **Negativ / Trade-Off**: Setup ist nicht "out-of-the-box plug-and-play"
  fuer jemanden ohne NPM — `proxy-net` muss vorher angelegt sein, sonst
  faehrt `compose up` mit Fehler hoch. Wird in der README dokumentiert.
* **Folgeaufgaben**: NPM-Eintrag fuer loogi.ch erstellen (Forward Host:
  `loogi`, Port: `8080`, Scheme: `http`, Header `X-Forwarded-For`
  + `X-Forwarded-Proto` weiterreichen).
