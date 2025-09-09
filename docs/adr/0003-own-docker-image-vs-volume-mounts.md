# 0003 — Custom Docker image instead of volume mounts

* Status: accepted
* Date: 2025-09-09

## Context

The theme and configuration have to land inside the SearXNG image. Two
standard approaches:

A) **Bind mounts**: run the official `searxng/searxng` image and mount
   `theme/`, `settings.yml`, `limiter.toml` over the image-internal paths.

B) **Custom image**: `FROM searxng/searxng:latest` with `COPY` for the
   theme and config. The result is a self-contained `loogi:latest` image.

## Decision

I go with B — a custom image.

## Alternatives considered

Approach A was rejected because:

* The image-internal paths (`/usr/local/searxng/searx/templates/`,
  `/usr/local/searxng/searx/static/themes/`) are an implementation detail
  of the official image and may change between versions without being
  flagged as a breaking change.
* With bind mounts, every theme file has to exist with the right name on
  the host at runtime. A missing file fails on the first request, often
  with a cryptic Jinja error.
* Reproducible deployments: with B, `loogi:latest@sha256:...` is a complete
  snapshot. With A, behaviour depends on the host filesystem.

## Consequences

* **Positive**: a single build-artifact definition (`Dockerfile` + `theme/`
  + `searxng/`) is enough to recreate the deployment reproducibly. Updates
  flow through `searxng/searxng:latest` pull + rebuild.
* **Negative / trade-off**: theme edits require a rebuild
  (`docker compose build`), not just a reload. Annoying for dev, correct
  for prod.
* **Follow-ups**: set up CI later so the image rebuilds on every push to
  `main` (out of scope for the init commit).
