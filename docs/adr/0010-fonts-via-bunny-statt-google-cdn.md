# 0010 — Fonts via fonts.bunny.net statt Google-CDN

* Status: accepted
* Datum: 2026-05-03

## Context

Das LOOGI-Design verwendet zwei Web-Fonts:

* **Inter Tight** (Gewichte 300/400/500/600/700)
* **JetBrains Mono** (Gewichte 400/500)

Im Designprototyp werden sie via `fonts.googleapis.com` geladen. Das ist
problematisch:

* **Privacy**: Google sieht jede Anfrage (User-IP, User-Agent, Referrer
  loogi.ch) — bei einer Suchmaschine, die Privacy als Wert tragen will,
  unhaltbar.
* **DSGVO**: In .ch / .eu rechtlich heikel ohne Cookie-/Consent-Banner.
* **CDN-Abhaengigkeit**: Drittanbieter-Outage = LOOGI ohne Fonts.

Drei Alternativen:

1. **Self-Hosting der woff2-Dateien** im Theme-Static-Ordner
2. **fonts.bunny.net** — DSGVO-konformer Drop-in-Replacement fuer
   Google-Fonts, identische URL-Syntax, kein Tracking
   ([fonts.bunny.net/about](https://fonts.bunny.net/about))
3. **Bei Google-CDN bleiben**

## Decision

Wir nutzen **fonts.bunny.net**.

## Alternatives considered

* **Self-Hosting** — Sauberster Weg, aber bedeutet:
  - woff2-Dateien manuell aus den jeweiligen Repos
    ([Inter](https://github.com/rsms/inter),
    [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono)) ziehen
  - 14 Files (5 weights x 1 family + 2 weights x 1 family, je woff2) im
    Repo halten und bei jedem Font-Update von Hand aktualisieren
  - Mehr Bytes im Repo, mehr Build-Logik im Image
  Wenn fonts.bunny.net irgendwann doch tracking einfuehrt oder weggeht,
  koennen wir spaeter immer noch self-hosten. Bis dahin: too much friction
  fuer marginalen Privacy-Gewinn ggue. Bunny.
* **Google-CDN** — verworfen, siehe Privacy oben.

## Consequences

* **Positiv**: Kein Tracking ggue. Google. Identische CSS-API. Kein
  Build-Step und keine Binaerdateien im Repo. Bunny ist GDPR-compliant per
  ihrer Datenschutzerklaerung.
* **Negativ / Trade-Off**: Wir haengen an Bunnys Verfuegbarkeit
  (Single-Point-of-Failure fuer Fonts). Fallback ist im CSS via
  `font-family: 'Inter Tight', -apple-system, system-ui, sans-serif`
  geregelt — bei Bunny-Outage rendert die UI mit System-Fonts statt zu
  brechen.
* **Folgeaufgaben**: Falls Bunny in Zukunft Tracking einfuehrt oder
  weggeht, auf Self-Hosting umsteigen. Diese ADR dann durch eine neue
  ersetzen.
