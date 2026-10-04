# 0023 — Pin the SearXNG base version in the Dockerfile

* Status: accepted
* Date: 2026-10-04

## Context

The Dockerfile used to build `FROM searxng/searxng:latest`. SearXNG is a
rolling release (several builds a day, tag scheme `YYYY.M.D-<git-sha>`),
so `latest` points to a different upstream state on every build.

That made **every** rebuild a potential base update — including one that
was only meant to change a line in `settings.yml`. On a host without a
cached base image (e.g. after moving servers), even the very first
`docker compose build` would have pulled whatever upstream was newest,
unreviewed.

The update 2026.6.17 → 2026.10.4 (296 upstream commits) showed how much
can happen silently without the build breaking: startpage and mojeek
arrived with `inactive: true` (no longer loaded), Google Images was
rebuilt on a path that only gets 403 from our IP, braveapi delivered web
results as video results, `outgoing.pool_maxsize` was removed. The grep
guards in the Dockerfile only catch patch markers — semantic drift is
caught only by the drift checklist in the README.

## Decision

The base version is pinned via `ARG SEARXNG_VERSION=<tag>` before `FROM`
(`FROM searxng/searxng:${SEARXNG_VERSION}`). From now on an upstream
update is a deliberate bump of this one line, followed by the drift
checklist (README → Updates). The pin is the tag (`YYYY.M.D-<sha>`), not
the digest — the tag already contains the git state and stays readable.

## Alternatives considered

- **Keep `latest` + discipline ("always run the checklist first, then
  build")** — fails exactly when things are in a hurry (config hotfix),
  and on a host without a base cache the first build already is an update.
- **Pin by digest (`@sha256:…`)** — maximally reproducible but unreadable;
  SearXNG's date-sha tags are effectively immutable.
- **Version via `.env`/compose build arg** — spreads the truth across two
  files; the default in the Dockerfile is enough, and it can still be
  overridden with `--build-arg SEARXNG_VERSION=…`.

## Consequences

* **Positive**: rebuilds are reproducible; config changes no longer drag
  in unreviewed upstream. The currently built state is in the repo, not
  only in the image label.
* **Negative / trade-off**: updates no longer happen "on the side" —
  upstream security fixes only arrive with the next deliberate bump. So
  check the version state regularly (e.g. monthly, README → Updates,
  step 1).
* **Follow-ups**: the README update playbook switched to "bump the ARG";
  `docker compose build --pull` is no longer the update mechanism.
