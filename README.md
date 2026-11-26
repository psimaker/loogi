# LOOGI

> [!NOTE]
> **Archived (November 2026).** LOOGI has been shut down and loogi.ch no longer serves search. The repository stays up, read-only, as a reference for the theme, the configuration and the 29 architecture decision records.

A privacy-focused web search engine that ran in production at **loogi.ch** until November 2026. Built on top of [SearXNG](https://github.com/searxng/searxng), with a hardcoded LOOGI theme, a curated engine list, and a few operational refinements.

[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)
[![Built on SearXNG](https://img.shields.io/badge/built%20on-SearXNG-3050F8?logo=searx&logoColor=white)](https://github.com/searxng/searxng)

<p align="center">
  <img src="docs/screenshots/homepage.png" alt="LOOGI homepage" width="820">
</p>

## What this is

LOOGI is a single-purpose deployment of [SearXNG](https://github.com/searxng/searxng) — same engine, same template machinery, same Python runtime. What makes it LOOGI:

- one fixed visual identity (a `loogi/` Jinja theme with an OKLCH palette, no theme switching, no upstream-default rendering)
- a curated engine list that's actually maintained — every engine is bang-tested from the production IP, dead ones get switched off ([ADR 0006](docs/adr/0006-engine-selection-precision.md), [ADR 0016](docs/adr/0016-broken-engines-and-brave-api.md), [ADR 0025](docs/adr/0025-engine-changes-for-searxng-2026-10.md), [ADR 0027](docs/adr/0027-engine-set-adapted-to-server-ip.md))
- three small plugins on top of SearXNG's plugin API:
  - **snippet cleaner** — strips leftover markup from engine snippets ([ADR 0019](docs/adr/0019-snippet-cleaner-plugin.md))
  - **thumbnail cleaner** — keeps web results strictly score-ordered and merges Brave API results with the other engines again ([ADR 0021](docs/adr/0021-thumbnail-cleaner-against-score-inversions.md), [ADR 0024](docs/adr/0024-normalize-braveapi-results-as-web-results.md))
  - **log redactor** — no search queries and no IP addresses in the server logs, as the privacy policy promises ([ADR 0026](docs/adr/0026-log-redactor-against-query-logging.md))
- legal pages (privacy + terms) in five locales, surfaced via a small Dockerfile patch — see [ADR 0011](docs/adr/0011-legal-pages-via-infopage-patch.md)
- operational defaults: pinned SearXNG base ([ADR 0023](docs/adr/0023-pin-searxng-base-version.md)), build-time config baking ([ADR 0003](docs/adr/0003-own-docker-image-vs-volume-mounts.md), [ADR 0018](docs/adr/0018-config-out-of-etc-searxng-volume.md)), no public ports behind an edge proxy ([ADR 0008](docs/adr/0008-no-ports-exposed-via-npm.md), [ADR 0029](docs/adr/0029-vps-behind-caddy-edge-proxy.md))

This repo is the source. In production LOOGI ran on a small VPS behind a shared Caddy edge proxy; until June 2026 it was part of my [homelab](https://github.com/psimaker/homelab).

## Architecture in one sentence

A custom Docker image (`FROM searxng/searxng:<pinned tag>`) that bakes the LOOGI Jinja theme, a curated `settings.yml` and three small plugins into the layer; Compose orchestrates `searxng` + `valkey` (limiter cache); TLS, routing and compression are handled by an external Caddy edge proxy.

The "why" behind every non-trivial decision lives in [`docs/adr/`](docs/adr/README.md) — 29 ADRs in MADR format.

Currently based on **SearXNG 2026.10.4** (`ARG SEARXNG_VERSION` in the [`Dockerfile`](Dockerfile)).

## Setup

Prerequisites:

- Docker + `docker compose` v2
- An external Docker network named `edge`, shared with your reverse proxy (`docker network create edge`)
- A reverse proxy on that network that forwards your domain to `loogi:8080` (example below)

```sh
cp .env.example .env
echo "SEARXNG_SECRET=$(openssl rand -hex 32)" >> .env
# optional: BRAVE_API_KEY=... (see ADR 0016) to enable the Brave Search API engine
docker compose build
docker compose up -d
```

The configuration is baked into the image under `/etc/loogi/` (via `SEARXNG_SETTINGS_PATH`), **not** `/etc/searxng/` — the upstream image declares that path as a volume, which masks rebuilt config ([ADR 0018](docs/adr/0018-config-out-of-etc-searxng-volume.md)). When debugging config, look at `/etc/loogi/`.

## Reverse proxy (Caddy)

The container publishes no ports; the edge proxy reaches it by name on the shared `edge` network. The production block:

```caddyfile
loogi.ch, www.loogi.ch {
	encode zstd gzip
	reverse_proxy loogi:8080
	header Strict-Transport-Security "max-age=31536000; includeSubDomains"
}
```

Caddy sets `X-Forwarded-For` on its own. `trusted_proxies` in `searxng/limiter.toml` covers the Docker bridge ranges (`172.16.0.0/12`), so the limiter sees the real client IP. `encode` matters: SearXNG doesn't compress its responses itself ([ADR 0028](docs/adr/0028-delivery-compression-and-logo-sizes.md)).

> Headless `curl https://your-domain/` gets **429** — that's the bot detection (no browser token), not an error. Test from inside the container against `127.0.0.1:8080` instead.

## Updates

SearXNG is a rolling release (several builds a day, tags `YYYY.M.D-<git-sha>`). The base image is **pinned** in the `Dockerfile`, so rebuilding for a config change never pulls an unreviewed upstream ([ADR 0023](docs/adr/0023-pin-searxng-base-version.md)). An update is a deliberate bump:

1. Pick the new tag on Docker Hub, get the commit range (`https://api.github.com/repos/searxng/searxng/compare/<old-sha>...<new-sha>`).
2. Drift checklist — the build only catches the patch markers (grep guards); everything else fails **silently**:
   - every `keep_only` engine still exists upstream **and** its `disabled`/`inactive` flags are unchanged (`inactive: true` = not loaded at all)
   - diff `searx/templates/simple/` old↔new and mirror relevant changes into `theme/loogi/templates/` — there is **no** template fallback
   - render variables removed from `searx/webapp.py` must not be used in our templates
   - diff the upstream `plugins:` block — our dict **replaces** the default ([ADR 0017](docs/adr/0017-plugins-dict-instead-of-enabled-plugins.md))
   - renamed/removed settings keys vs. our deltas in `searxng/settings.yml`
   - bang-test every configured engine from the server IP, old and new code side by side, to separate IP blocks from regressions
3. Bump `ARG SEARXNG_VERSION`, then:

```sh
docker tag loogi:latest loogi:<old-version>   # rollback anchor
docker compose build
docker compose up -d
docker compose logs -f searxng
```

> Do **not** use `docker compose pull` — it tries to pull `loogi:latest` from Docker Hub, which doesn't exist. The base only changes through the `SEARXNG_VERSION` bump.

Smoke tests:

```sh
docker exec loogi wget -qO- http://127.0.0.1:8080/healthz                       # → OK
docker exec loogi wget -qO- "http://127.0.0.1:8080/search?q=test&format=json" | head -c 200
docker exec loogi wget -qO- http://127.0.0.1:8080/opensearch.xml | head -c 200
docker exec loogi wget -qO- --header 'X-Forwarded-For: 127.0.0.1' \
  "http://127.0.0.1:8080/search?q=test&format=json" \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(len(d['results']),d['unresponsive_engines'])"
```

The 2026.6 → 2026.10 update is a good example of why the checklist exists: the build passed, but without it startpage and mojeek would have been unloaded silently, Google Images would have returned 403 (empty images tab), Brave API results would no longer merge with other engines, and Brave's SafeSearch default would have flipped from `moderate` to `off` ([ADR 0023–0025](docs/adr/0025-engine-changes-for-searxng-2026-10.md)).

## Repository layout

```
.
├── Dockerfile             # FROM searxng/searxng:<pinned> + COPY theme/config/plugins + sed patches with grep guards
├── compose.yml            # searxng + valkey; networks: edge (external) + loogi-internal
├── searxng/
│   ├── settings.yml       # use_default_settings + LOOGI deltas (keep_only, plugins: dict, engine overrides)
│   ├── limiter.toml       # trusted_proxies, link_token
│   ├── favicons.toml      # favicon cache on the data volume
│   ├── plugins/           # snippet cleaner, thumbnail cleaner, log redactor
│   └── infopage/          # privacy + terms in EN/DE/FR/ES/IT
├── theme/loogi/
│   ├── templates/         # Jinja templates → /usr/local/searxng/searx/templates/loogi/
│   └── static/            # CSS, JS, images → /usr/local/searxng/searx/static/themes/loogi/
└── docs/adr/              # 29 architecture decisions (MADR format)
```

## Documentation

Architecture Decision Records (ADRs) live in [`docs/adr/`](docs/adr/) in MADR format. They cover SearXNG selection, the bake-into-image pattern, theme strategy, engine curation (with the rationale for which engines were dropped and when), legal pages, the plugins, the update process and the move to a VPS behind Caddy.

## Acknowledgements

LOOGI builds on the work of others:

- **[SearXNG](https://github.com/searxng/searxng)** — the upstream meta-search engine. LOOGI extends it; everything searchable here works because SearXNG works.
- The LOOGI theme is **derived from SearXNG's `simple/` theme**: same template variables, ported macros, custom CSS/JS, hardcoded layout. AGPL-3.0-or-later applies to the derived work.
- **[Valkey](https://valkey.io/)** as the limiter cache backend — open-source Redis fork.
- **[Caddy](https://caddyserver.com/)** as the edge proxy.

## Legal disclaimer

Privacy and Terms pages are reachable at `/info/<lang>/privacy` and `/info/<lang>/terms` (EN/DE/FR/ES/IT). Markdown sources in `searxng/infopage/<lang>/`.

> The texts in `privacy.md` and `terms.md` have **not** been reviewed by a lawyer. Before launching publicly, anyone running this code should have them reviewed in their jurisdiction (Swiss DSG / EU GDPR / etc.).

## License

[AGPL-3.0-or-later](LICENSE) — inherited from SearXNG. Any public modification must be released under the same license. This repository was the source for the loogi.ch instance.
