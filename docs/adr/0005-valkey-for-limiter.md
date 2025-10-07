# 0005 — Valkey instead of Redis as the limiter backend

* Status: accepted
* Date: 2025-10-07

## Context

SearXNG's limiter (bot detection, IP-based rate limiting, link token) and
several plugins need a key-value store. Redis and Valkey are supported via
the `valkey.url` settings key (Valkey is API-compatible with Redis 7.2).
Without a backend, `server.limiter: true` is mostly a placebo.

Redis switched from BSD to a restrictive licence (RSALv2/SSPL) in 2024.
The Linux Foundation responded by starting [Valkey](https://valkey.io/)
as a BSD fork, backed by Amazon, Google, Oracle, and Ericsson.

## Decision

I use `valkey/valkey:8-alpine` as the container. Persistence via the
`valkey-data` Docker volume.

## Alternatives considered

* **Redis** — technically identical, but licence-wise awkward. The
  self-hosted setup isn't a distribution, but the signal to open-source
  projects is clear: there's no need to depend on RSAL software.
* **Incompatible in-memory store** (memcached, dragonfly) — SearXNG
  expects the Redis protocol; the adapter effort is out of proportion.
* **Limiter without a backend** — no effective bot defence. Not acceptable
  for a public instance on loogi.ch.

## Consequences

* **Positive**: no licence questions. Fully compatible with the SearXNG
  limiter. The image is small (Alpine).
* **Negative / trade-off**: Valkey is younger than Redis — less production
  exposure across the ecosystem. Irrelevant for this single-instance,
  local-network use case.
* **Follow-ups**: figure out a volume-backup strategy later (for the
  limiter it doesn't matter — the data is ephemeral anyway).
