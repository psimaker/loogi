# 0003 — Eigenes Docker-Image statt Volume-Mounts

* Status: accepted
* Datum: 2026-05-03

## Context

Theme und Konfiguration muessen ins SearXNG-Image. Zwei Standardansaetze:

A) **Bind-Mounts**: Offizielles `searxng/searxng` Image laufen lassen und
   `theme/`, `settings.yml`, `limiter.toml` als Volumes ueber die
   Image-internen Pfade mounten.

B) **Eigenes Image**: `FROM searxng/searxng:latest` mit `COPY` der Theme- und
   Konfig-Dateien. Resultiert in einem self-contained `loogi:latest` Image.

## Decision

Wir gehen mit B — eigenes Image.

## Alternatives considered

Siehe oben (A vs. B). A wurde verworfen, weil:

* Image-interne Pfade (`/usr/local/searxng/searx/templates/`,
  `/usr/local/searxng/searx/static/themes/`) sind ein Implementation-Detail
  des offiziellen Images und koennen sich zwischen Versionen aendern, ohne
  dass es als Breaking-Change kommuniziert wird.
* Bei Bind-Mount muessen alle Theme-Dateien zur Laufzeit auf dem Host
  vorhanden und korrekt benannt sein. Ein vergessenes File faellt erst
  bei der ersten Anfrage auf, oft mit kryptischer Jinja-Fehlermeldung.
* Reproducible Deployments: Mit B ist `loogi:latest@sha256:...` ein
  vollstaendiger Snapshot. Mit A haengt das Verhalten vom Host-Filesystem
  ab.

## Consequences

* **Positiv**: Eine einzige Build-Artefact-Definition (`Dockerfile` +
  `theme/` + `searxng/`) reicht aus, um das gesamte Deployment
  reproduzierbar herzustellen. Updates erfolgen durch
  `searxng/searxng:latest` Pull + Rebuild.
* **Negativ / Trade-Off**: Theme-Aenderungen erfordern einen Rebuild
  (`docker compose build`), nicht nur ein Reload. Fuer Dev unbequem,
  fuer Produktion korrekt.
* **Folgeaufgaben**: CI/CD spaeter so aufsetzen, dass das Image bei jedem
  Push auf `main` neu gebaut wird (out of scope fuer den Init-Commit).
