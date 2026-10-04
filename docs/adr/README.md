# Architecture Decision Records — LOOGI

This folder holds the architecture decisions for LOOGI in **MADR** format
([Markdown Any Decision Record](https://adr.github.io/madr/)).

Each decision lives in its own file `NNNN-short-title.md`. The structure
is always the same: **Status**, **Context**, **Decision**,
**Alternatives considered**, **Consequences**.

## Why ADRs?

Code shows *what* was done; ADRs explain *why*. When someone — including
my future self — later asks "why didn't we just do X?", the answer should
be here, not lost in chat history or in my head.

## When to write a new ADR

Whenever I make a decision that

- touches multiple components,
- rejects an alternative a new contributor would probably propose,
- is expensive to undo later,
- or reflects an external constraint.

Template for new ADRs: [`0000-template.md`](./0000-template.md).

## Index

| Nr | Title | Date | Status |
|----|-------|------|--------|
| [0001](./0001-searxng-as-search-engine-base.md) | SearXNG as the search-engine base | 2025-08-12 | accepted |
| [0002](./0002-design-hardcoded-via-own-theme.md) | Design hardcoded via a custom theme | 2025-08-26 | accepted |
| [0003](./0003-own-docker-image-vs-volume-mounts.md) | Custom Docker image instead of volume mounts | 2025-09-09 | accepted |
| [0004](./0004-jinja-templates-vs-react-port.md) | Jinja templates instead of porting React | 2025-09-23 | accepted |
| [0005](./0005-valkey-for-limiter.md) | Valkey instead of Redis as the limiter backend | 2025-10-07 | accepted |
| [0006](./0006-engine-selection-precision.md) | Engine selection: precision over completeness | 2025-10-21 | accepted |
| [0007](./0007-i18n-auto-detect-five-languages.md) | i18n: EN/DE/FR/ES/IT with auto-detect | 2025-11-05 | accepted |
| [0008](./0008-no-ports-exposed-via-npm.md) | No exposed ports, reverse proxy via NPM | 2025-11-24 | accepted (ingress amended by 0029) |
| [0009](./0009-config-deep-merge-vs-full-override.md) | Config: deep-merge instead of full override | 2025-12-04 | accepted |
| [0010](./0010-fonts-via-bunny-not-google-cdn.md) | Fonts via fonts.bunny.net, not the Google CDN | 2025-12-18 | accepted |
| [0011](./0011-legal-pages-via-infopage-patch.md) | Privacy / terms as infopages, TOC extension via Dockerfile patch | 2026-01-15 | accepted |
| [0012](./0012-bypass-network-for-local-clients.md) | Bypass network `loogi-net` for local service consumers | 2026-02-19 | superseded by 0029 |
| [0013](./0013-three-column-results-layout.md) | Results-page layout (filter sidebar + center column) | 2026-03-13 | accepted |
| [0014](./0014-mobile-layout.md) | Mobile layout (phone drawer + tablet collapsed default) | 2026-04-09 | accepted |
| [0015](./0015-wikipedia-out-of-general-engines.md) | Drop the Wikipedia engine from the general tab | 2026-05-03 | accepted |
| [0016](./0016-broken-engines-and-brave-api.md) | Drop broken engines, switch Brave to the official API | 2026-05-10 | accepted |
| [0017](./0017-plugins-dict-instead-of-enabled-plugins.md) | Plugins as a `plugins:` dict instead of the dead `enabled_plugins:` list | 2026-06-11 | accepted |
| [0018](./0018-config-out-of-etc-searxng-volume.md) | Config moves to /etc/loogi: the /etc/searxng VOLUME masks image contents | 2026-06-11 | accepted |
| [0019](./0019-snippet-cleaner-plugin.md) | Own snippet cleaner plugin instead of engine patches | 2026-06-11 | accepted |
| [0020](./0020-minimal-preferences-page.md) | Minimal preferences page (5 settings instead of the full SearXNG set) | 2026-06-11 | accepted |
| [0021](./0021-thumbnail-cleaner-against-score-inversions.md) | Thumbnail cleaner plugin against score inversions in the result list | 2026-06-11 | accepted (extended by 0024) |
| [0022](./0022-enable-qwant-mojeek-explicitly.md) | Enable qwant + mojeek explicitly (keep_only leaves the disabled flag untouched) | 2026-06-11 | superseded by 0025 |
| [0023](./0023-pin-searxng-base-version.md) | Pin the SearXNG base version in the Dockerfile | 2026-10-04 | accepted |
| [0024](./0024-normalize-braveapi-results-as-web-results.md) | Normalize braveapi results as web results (upstream regression) | 2026-10-04 | accepted |
| [0025](./0025-engine-changes-for-searxng-2026-10.md) | Engine changes for the base update to 2026.10.4 | 2026-10-04 | accepted |
| [0026](./0026-log-redactor-against-query-logging.md) | Log redactor: no search queries and no IP addresses in server logs | 2026-10-04 | accepted |
| [0027](./0027-engine-set-adapted-to-server-ip.md) | Engine set adapted to the server IP: yahoo in, dead engines out | 2026-10-04 | accepted |
| [0028](./0028-delivery-compression-and-logo-sizes.md) | Delivery: compression in Caddy, logo files at display size | 2026-10-04 | accepted |
| [0029](./0029-vps-behind-caddy-edge-proxy.md) | Production on a VPS behind a shared Caddy edge proxy | 2026-06-21 | accepted |
