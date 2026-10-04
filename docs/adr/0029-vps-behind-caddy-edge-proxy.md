# 0029 — Production on a VPS behind a shared Caddy edge proxy

* Status: accepted (documented retroactively on 2026-10-04)
* Date: 2026-06-21

## Context

Until June 2026 LOOGI ran on my homelab server behind Nginx Proxy Manager
(ADR 0008), with a bypass network `loogi-net` for local service consumers
(ADR 0012). On 2026-06-21 the instance moved to a VPS that already hosts
other public services. Back then the move was only noted in my private
ops notes, not as an ADR — even though a change of the reverse-proxy
strategy is exactly the kind of decision that needs one. This ADR catches
up on that.

## Decision

* **Ingress**: a shared **Caddy edge proxy** (its own compose stack, with
  the external Docker network `edge` since 2026-06-29) terminates TLS
  (Let's Encrypt, automatic) and forwards `loogi.ch` / `www.loogi.ch` to
  `loogi:8080` (+ HSTS, compression since 2026-10-04, ADR 0028). The
  principle of ADR 0008 stays: **no `ports:`** on the LOOGI container, the
  edge proxy is the only way in — only NPM is replaced by Caddy.
* **Networks**: `edge` (external, Caddy) + `loogi-internal` (Valkey,
  without internet). `proxy-net`, `loogi-net` and `compose.override.yml`
  are gone — there are no local consumers on the VPS (ADR 0012 obsolete).
* **Real IP**: `trusted_proxies` in `limiter.toml` covers `172.16.0.0/12`,
  i.e. the `edge` network too; Caddy sets `X-Forwarded-For` on its own.
* **Build**: initially built on the homelab server and transferred via
  `docker save|load`; since 2026-10-04 built directly on the VPS (base
  pinned, ADR 0023).

## Alternatives considered

- **NPM on the VPS as well** — a second, UI-managed proxy next to the
  existing services; Caddy covers TLS + routing with one text file.
- **Expose port 8080 directly** — contradicts ADR 0008 (no TLS at the
  container, no central entry point).

## Consequences

* **Positive**: one entry point for all services on the VPS, automatic
  TLS, routing as a versionable text file.
* **Negative / trade-off**: a data-center IP instead of a residential
  connection — several scraping engines block it (qwant, mojeek,
  startpage, Google, Brave HTML; ADR 0025/0027). The Caddyfile lives
  outside this repo.
* **Follow-ups**: `pass_ip` `172.30.0.0/24` in `limiter.toml` (the old
  `loogi-net`) has had no effect since the move — remove it on the next
  rebuild. ADR 0008 (ingress) is amended by this ADR, ADR 0012 is
  superseded.
