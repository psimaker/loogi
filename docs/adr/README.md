# Architecture Decision Records — LOOGI

In diesem Ordner liegen die Architektur-Entscheidungen fuer LOOGI im
**MADR**-Format ([Markdown Any Decision Record](https://adr.github.io/madr/)).

Jede Entscheidung bekommt eine eigene Datei `NNNN-kurzer-titel.md`. Der Aufbau
ist immer gleich: **Status**, **Context**, **Decision**, **Consequences**.

## Warum ADRs?

Code zeigt *was* gemacht wurde, ADRs erklaeren *warum*. Wenn spaeter jemand —
auch der zukuenftige Du — fragt "Warum haben wir nicht einfach X gemacht?",
soll die Antwort hier stehen, nicht in einem Slack-Verlauf oder im Kopf
verschwunden sein.

## Wann eine neue ADR schreiben?

Immer wenn eine Entscheidung getroffen wird, die

- mehrere Komponenten beruehrt,
- eine Alternative ablehnt, die ein neuer Beitragender vermutlich vorschlagen wuerde,
- spaeter teuer rueckgaengig zu machen ist,
- oder eine externe Vorgabe / Constraint reflektiert.

Vorlage fuer neue ADRs: [`0000-template.md`](./0000-template.md).

## Index

| Nr | Titel | Status |
|----|-------|--------|
| [0001](./0001-searxng-als-suchmaschinen-basis.md) | SearXNG als Suchmaschinen-Basis | accepted |
| [0002](./0002-design-hardcoded-via-eigenes-theme.md) | Design hardcoded via eigenes Theme | accepted |
| [0003](./0003-eigenes-docker-image-statt-volume-mounts.md) | Eigenes Docker-Image statt Volume-Mounts | accepted |
| [0004](./0004-jinja-templates-statt-react-portierung.md) | Jinja-Templates statt React-Portierung | accepted |
| [0005](./0005-valkey-fuer-limiter.md) | Valkey statt Redis als Limiter-Backend | accepted |
| [0006](./0006-engine-auswahl-praezision.md) | Engine-Auswahl: Praezision statt Vollstaendigkeit | accepted |
| [0007](./0007-i18n-auto-detect-fuenf-sprachen.md) | i18n: EN/DE/FR/ES/IT mit Auto-Detect | accepted |
| [0008](./0008-keine-ports-exposed-via-npm.md) | Keine Ports exposed, Reverse-Proxy via NPM | accepted |
| [0009](./0009-config-deep-merge-statt-vollersatz.md) | Konfig: Deep-Merge statt Vollersatz | accepted |
| [0010](./0010-fonts-via-bunny-statt-google-cdn.md) | Fonts via fonts.bunny.net statt Google-CDN | accepted |
