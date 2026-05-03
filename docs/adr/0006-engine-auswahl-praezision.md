# 0006 — Engine-Auswahl: Praezision statt Vollstaendigkeit

* Status: accepted
* Datum: 2026-05-03

## Context

SearXNG bringt rund 250 vorkonfigurierte Engines mit. Nicht alle sind sinnvoll:

* viele sind regional (Yandex/Russland, Baidu/Sogou/360search/China,
  Naver/Daum/Korea, ...) — fuer eine Schweizer Instanz ohne Mehrwert
* einige sind rechtlich heikel (1337x, btdigg, sonstige Torrent-Indizes)
* einige sind veraltet oder schlecht gepflegt
* viele liefern bei "general"-Suchen schlechtere Qualitaet als die grossen
  Engines und draengen gute Resultate aus dem Ranking

## Decision

Wir aktivieren ueber `use_default_settings.engines.keep_only` in `settings.yml`
nur eine kuratierte Auswahl von ~50 Engines. Auswahlkriterien:

1. **Praezision** — die Engine liefert hochwertige Resultate fuer ihre Kategorie.
2. **Vertrauen** — keine offensichtlichen Tracker-/State-Surveillance-Quellen.
3. **Relevanz fuer DE/EU** — primaer westeuropaeisch und global, kein
   russisch/chinesisch/koreanisch-fokussiertes Engine.
4. **Diversitaet** — pro Kategorie mehrere unabhaengige Quellen, damit Ranking
   nicht von einer Engine dominiert wird.

Konkrete Liste siehe `searxng/settings.yml` →
`use_default_settings.engines.keep_only`.

## Alternatives considered

* **Alle Defaults aktiv** — Latenz steigt durch Tail-Engines, Resultate werden
  schlechter, Bot-Detection-Trigger bei Engines wie Google haeufiger.
* **Minimale Auswahl (nur Google + DDG)** — verfehlt den Metasearch-Vorteil
  (Diversitaet). Bringt fast keinen Nutzen ggue. dem direkten Aufruf der
  Engine.

## Consequences

* **Positiv**: Schnellere Antwortzeiten (weniger parallele Requests),
  hochwertigere Resultate, klare Erwartung was fuer Quellen genutzt werden.
* **Negativ / Trade-Off**: Wer eine spezielle regionale Engine vermisst, muss
  die `keep_only`-Liste editieren und das Image neu bauen. Bewusste Reibung —
  wir wollen die Auswahl als Designentscheidung sichtbar halten.
* **Folgeaufgaben**: Bei jedem SearXNG-Update pruefen, ob neue Engines
  hinzugekommen sind, die in unsere Liste passen. Dokumentieren, wenn welche
  abgekuendigt wurden.
