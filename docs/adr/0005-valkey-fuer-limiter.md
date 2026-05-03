# 0005 — Valkey statt Redis als Limiter-Backend

* Status: accepted
* Datum: 2026-05-03

## Context

SearXNGs Limiter (Bot-Detection, IP-basiertes Rate-Limiting, Link-Token) und
einige Plugins brauchen einen Key-Value-Store. Unterstuetzt werden Redis und
Valkey via dem Settings-Key `valkey.url` (Valkey ist API-kompatibel mit
Redis 7.2). Ohne Backend ist `server.limiter: true` weitgehend wirkungslos.

Redis ist 2024 von BSD auf eine restriktive Lizenz (RSALv2/SSPL) gewechselt.
Die Linux Foundation hat darauf [Valkey](https://valkey.io/) als BSD-Fork
gestartet, der von Amazon, Google, Oracle und Ericsson getragen wird.

## Decision

Wir nutzen `valkey/valkey:8-alpine` als Container. Persistenz via
Docker-Volume `valkey-data`.

## Alternatives considered

* **Redis** — funktioniert technisch identisch, aber lizenzrechtlich heikler.
  Auch wenn unser Setup keine Distribution darstellt, ist das Signal an
  Open-Source-Projekte klar: keine Notwendigkeit, RSAL-Software zu nutzen.
* **Inkompatibler In-Memory-Store** (memcached, dragonfly) — SearXNG erwartet
  Redis-Protocol; Aufwand fuer Adapter unverhaeltnismaessig.
* **Limiter ohne Backend** — kein effektiver Bot-Schutz. Bei einer
  oeffentlichen Instanz auf loogi.ch nicht akzeptabel.

## Consequences

* **Positiv**: Keine Lizenzfragen. Vollstaendig kompatibel mit dem
  SearXNG-Limiter. Image ist klein (Alpine).
* **Negativ / Trade-Off**: Valkey ist juenger als Redis — weniger
  Production-Erfahrung im weiteren Oekosystem. Fuer unseren Use-Case
  (Single-Instance, lokales Netzwerk) irrelevant.
* **Folgeaufgaben**: Volume-Backup-Strategie spaeter klaeren (fuer Limiter
  egal — Daten sind ohnehin ephemer).
