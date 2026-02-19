# 0012 — Bypass network `loogi-net` for local service consumers

* Status: accepted
* Date: 2026-02-19

## Context

The LOOGI container has bot detection and rate limiting on by default
(`server.limiter: true`, `botdetection.ip_limit.link_token: true` —
necessary for a public instance). That's the right behaviour for browser
traffic from the public internet.

But other services on the same Docker host want to use LOOGI **directly**
as a search backend — concretely crawl4ai, plausibly also custom scripts,
RAG pipelines, a second service hitting `/search?format=json`. These
services:

* have no browser user agent (bot detection trips)
* often query in quick succession (the rate limiter blocks)
* should **not** share a limit bucket with anonymous internet users

Putting the entire RFC1918 ranges into `botdetection.ip_lists.pass_ip`
would also bypass **NPM** (which lives on `proxy-net`). NPM is a
`trusted_proxy` and forwards the real client IP — but if NPM's own IP
gets checked against `pass_ip` first, the bypass triggers too early.

(The actual limiter code in `searx/limiter.py:151` evaluates `pass_ip`
against `request.remote_addr` *after* `ProxyFix`, so on the **real**
client IP. NPM doesn't slip through — but the safety margin is tighter
than it needs to be when whole /12 blocks get whitelisted. A dedicated,
narrow subnet is cleaner.)

## Decision

I introduce a **third Docker network**:

| Network | Purpose | Subnet |
|---------|---------|--------|
| `proxy-net` | NPM (reverse proxy / TLS) | managed by NPM |
| `loogi-net` | Local service consumers (crawl4ai etc.) | **fixed `172.30.0.0/24`** |
| `loogi-internal` | Valkey backend (`internal: true`) | dynamic |

Both external networks (`proxy-net`, `loogi-net`) get created on the host
before `compose up`:

```sh
docker network create --subnet=172.30.0.0/24 loogi-net
```

`searxng/limiter.toml` matches:

```toml
pass_ip = [
  '172.30.0.0/24',  # loogi-net
  '127.0.0.0/8',
  '::1',
]
```

Other compose stacks join `loogi-net` via:

```yaml
networks:
  loogi-net:
    external: true
```

and reach `http://loogi:8080/` without limits, without bot detection.

## Alternatives considered

* **Whitelist all of `172.16.0.0/12` in `pass_ip`** — quick, but gives
  *every* container in the bridge range the bypass. An accidentally
  deployed test container would have unlimited access, or a compromised
  neighbour could pivot through LOOGI. Too broad.
* **API-token-based bypass** — cleaner because it's identity-based instead
  of network-based. But SearXNG has no built-in mechanism; I'd need an
  Nginx sidecar that validates a token and rewrites `X-Forwarded-For`.
  Too much machinery for a hobby server.
* **`server.limiter: false` globally** — would also apply to public web
  traffic and invite scrapers. No.
* **Route crawl4ai through NPM** with its own auth header — works, but
  NPM doesn't do LOOGI-specific bypass routing easily, and routing
  internal services through TLS / public FQDN is round-trip overhead I
  don't want.

## Consequences

* **Positive**: clean separation. Public traffic (browser → NPM → LOOGI)
  hits the normal limiter. Local services (crawl4ai → loogi-net → LOOGI)
  have unlimited access. No broad subnet whitelist.
* **Negative / trade-off**:
  - Setup isn't pure `compose up` — `loogi-net` has to exist first.
    Documented in the README.
  - The fixed `172.30.0.0/24` subnet has to be free on the host. On a
    conflict: change both `compose.yml` and `limiter.toml` together.
* **Follow-ups**:
  - When setting up crawl4ai, configure its compose to use `loogi-net` as
    an external network.
  - For new consumers (RAG pipelines etc.): same recipe, no changes to
    LOOGI itself.
