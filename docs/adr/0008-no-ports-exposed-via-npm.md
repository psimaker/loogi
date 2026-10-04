# 0008 — No exposed ports, reverse proxy via NPM

* Status: accepted — ingress is Caddy instead of NPM since 2026-06-21, the "no ports:" principle still holds, see [0029](./0029-vps-behind-caddy-edge-proxy.md)
* Date: 2025-11-24

## Context

The target host already runs Nginx Proxy Manager (NPM) on an external
Docker bridge network called `proxy-net`. NPM handles:

* TLS termination (Let's Encrypt)
* hostname routing for multiple services on one server
* forwarding loogi.ch to the LOOGI container

The LOOGI compose setup should slot in there without exposing its own
ports and without duplicating cert management or routing.

## Decision

* `compose.yml` attaches the `searxng` container to two networks:
  * `proxy-net` (external) — for NPM
  * `searxng` (internal bridge) — for Valkey traffic
* `valkey` is only on the internal `searxng` network, not on `proxy-net`.
* No `ports:` section. NPM reaches the container by its hostname `loogi`
  (the container name) on the container-internal port `8080` (SearXNG
  default).
* `server.base_url: "https://loogi.ch/"` in `settings.yml`, so that link
  generation in the UI uses the public URL, not `http://loogi:8080/`.

## Alternatives considered

* **A separate reverse proxy inside compose** (Caddy, Traefik) — would
  duplicate NPM, which already handles certs for other services on the
  host.
* **`ports: ["127.0.0.1:8080:8080"]`** — would work, but NPM would then
  have two paths: via the container network or via host loopback. The
  container network is cleaner.

## Consequences

* **Positive**: NPM owns TLS and routing centrally; LOOGI is an
  unprivileged container with no host-facing ports. Clean
  separation of concerns.
* **Negative / trade-off**: the setup isn't plug-and-play for anyone
  without NPM — `proxy-net` has to exist before `compose up`, otherwise
  it fails. Documented in the README.
* **Follow-ups**: create the NPM entry for loogi.ch (forward host:
  `loogi`, port `8080`, scheme `http`, pass through `X-Forwarded-For` and
  `X-Forwarded-Proto`).
