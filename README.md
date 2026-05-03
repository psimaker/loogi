# LOOGI

Eigene Web-Suchmaschine fuer **loogi.ch**, gebaut auf
[SearXNG](https://docs.searxng.org/) mit hardcoded LOOGI-Theme,
deployed via Docker Compose hinter Nginx Proxy Manager.

## Architektur in einem Satz

Eigenes Docker-Image (`FROM searxng/searxng:latest`), das ein eigenes
`loogi`-Theme (Jinja-Templates) und eine kuratierte `settings.yml`
mitbringt. Compose orchestriert `searxng` + `valkey` (Limiter-Backend);
TLS und Routing macht NPM extern.

Hintergrund zu jeder relevanten Entscheidung:
[`docs/adr/`](./docs/adr/README.md).

## Voraussetzungen

* Docker + `docker compose` v2
* Externes Docker-Bridge-Netz `proxy-net` (wird von Nginx Proxy Manager
  bereitgestellt)
* Externes Netz `loogi-net` mit fixem Subnet `172.30.0.0/24` (siehe
  [ADR 0012](./docs/adr/0012-bypass-netz-fuer-lokale-clients.md)) —
  einmalig anlegen mit:
  ```sh
  docker network create --subnet=172.30.0.0/24 loogi-net
  ```
* Reverse-Proxy (NPM) erreichbar auf `proxy-net`

## Setup

```sh
cp .env.example .env
echo "SEARXNG_SECRET=$(openssl rand -hex 32)" >> .env
docker compose build
docker compose up -d
```

## Lokale Service-Konsumenten (crawl4ai etc.) anbinden

Andere Stacks auf demselben Host, die LOOGI als Such-Backend nutzen wollen,
hängen sich an `loogi-net` ein — sie umgehen damit Bot-Detection und
Rate-Limit (per `pass_ip` in `searxng/limiter.toml`):

```yaml
# Beispiel: crawl4ai/compose.yml
services:
  crawl4ai:
    # ...
    networks:
      - default
      - loogi-net   # gibt Zugriff auf http://loogi:8080 ohne Limits

networks:
  loogi-net:
    external: true
```

JSON-API-Aufruf vom Konsumenten:
```
http://loogi:8080/search?q=test&format=json
```

## NPM-Konfiguration

Im Nginx Proxy Manager als neuen Proxy Host anlegen:

| Feld           | Wert            |
|----------------|-----------------|
| Domain Names   | `loogi.ch`      |
| Scheme         | `http`          |
| Forward Host   | `loogi`         |
| Forward Port   | `8080`          |
| Block Common Exploits | aktivieren |
| Websockets     | nicht noetig    |

Unter *Custom locations / Advanced* sicherstellen, dass
`X-Forwarded-For`, `X-Forwarded-Proto` und `X-Real-IP` an den Backend
weitergereicht werden — sonst greift der Limiter falsch (siehe
`searxng/limiter.toml`).

SSL-Tab: Let's-Encrypt-Zertifikat anfragen, *Force SSL* + *HTTP/2 Support*
+ *HSTS Enabled* aktivieren.

## Updates

```sh
docker compose pull         # zieht neuere searxng/searxng:latest
docker compose build        # baked das LOOGI-Theme + Konfig drauf
docker compose up -d
```

Bei Major-Updates von SearXNG die Diffs der Default-`settings.yml` und der
`searx/templates/simple/`-Templates pruefen, falls neue Variablen oder
Pflicht-Templates hinzugekommen sind. Siehe ADR 0002 / 0009.

## Ordnerstruktur

```
.
├── Dockerfile             # FROM searxng/searxng + COPY theme + config
├── compose.yml            # searxng + valkey, proxy-net + searxng networks
├── searxng/
│   ├── settings.yml       # use_default_settings + Deltas
│   └── limiter.toml       # trusted_proxies, link_token
├── theme/loogi/
│   ├── templates/         # Jinja-Templates → /usr/local/searxng/searx/templates/loogi/
│   └── static/            # CSS, JS, Bilder → /usr/local/searxng/searx/static/themes/loogi/
└── docs/adr/              # Architektur-Entscheidungen (MADR)
```

## Rechtliche Hinweise

Datenschutzerklaerung und AGB sind unter `/info/<lang>/privacy` und
`/info/<lang>/terms` (EN/DE/FR/ES/IT) erreichbar; die Markdown-Quellen
liegen in `searxng/infopage/<lang>/`.

> **Disclaimer**: Die Texte in `privacy.md` und `terms.md` wurden
> nicht juristisch geprueft. Vor einem oeffentlichen Launch unter
> loogi.ch sollten sie von einem Anwalt im Schweizer Raum reviewed
> werden, insbesondere die DSG-/DSGVO-Compliance der Datenschutzerklaerung
> und die Haftungsklauseln der AGB.

## Lizenz

[AGPL-3.0-or-later](./LICENSE) — abgeleitet von SearXNG.
