# 0001 — SearXNG als Suchmaschinen-Basis

* Status: accepted
* Datum: 2026-05-03

## Context

LOOGI soll eine eigene Web-Suchmaschine unter loogi.ch werden. Eine eigene
Crawl- und Index-Infrastruktur aufzubauen ist nicht realistisch — Storage,
Bandbreite, Engineering-Aufwand sind um Groessenordnungen ueber dem Budget.
Realistisch sind:

1. einen bestehenden Index lizenzieren (Bing, Brave, Google CSE) und ein
   eigenes Frontend bauen
2. eine Metasuche implementieren, die Suchanfragen an mehrere Backends
   weiterleitet und Ergebnisse aggregiert
3. eine bestehende Open-Source-Metasuche nehmen und anpassen

## Decision

Wir bauen LOOGI auf [SearXNG](https://docs.searxng.org/) auf.

## Alternatives considered

* **Eigener Frontend auf Bing/Brave-API** — Vendor-Lock-In, Kosten pro Query,
  keine Diversitaet der Quellen, Tracking-Risiken durch den Provider.
* **YaCy** — dezentrale Peer-Suche, sympathisch, aber Ergebnisqualitaet fuer
  general-web-search nicht konkurrenzfaehig.
* **Whoogle** — fokussiert auf Google-Proxying, viel kleinerer Engine-Pool,
  weniger Konfigurierbarkeit.

## Consequences

* **Positiv**: Bewaehrter Stack mit ~250 Engines out-of-the-box, aktive Community,
  AGPL-3.0-Lizenz kompatibel mit "selber hosten und nutzen". Privacy-Fokus deckt
  sich mit den Projektzielen. Docker-Image ist offiziell gepflegt.
* **Negativ / Trade-Off**: AGPL-3.0 zwingt uns, jeden Quellcode-Anteil unter
  derselben Lizenz weiterzugeben. Das ist OK, weil LOOGI ohnehin offen sein soll
  — aber jede UI-Aenderung ist ein Derivat, also greift Copyleft.
* **Folgeaufgaben**: LICENSE-Datei (AGPL-3.0) im Repo halten; bei
  oeffentlicher Instanz die Quellcode-Verfuegbarkeit anbieten (Footer-Link auf
  Repo).
