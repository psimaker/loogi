# 0012 — Bypass-Netz `loogi-net` fuer lokale Service-Konsumenten

* Status: accepted
* Datum: 2026-05-03

## Context

Der LOOGI-Container hat per Default Bot-Detection und Rate-Limiting aktiv
(`server.limiter: true`, `botdetection.ip_limit.link_token: true` —
notwendig fuer eine Public-Instance). Das ist das richtige Verhalten fuer
Web-Browser-Traffic von der Aussenwelt.

Auf demselben Docker-Host laufen aber auch andere Dienste, die LOOGI
**direkt** als Such-Backend benutzen wollen — konkret crawl4ai, denkbar
auch eigene Skripte, RAG-Pipelines, ein zweiter Dienst der
`/search?format=json` ruft. Diese Services:

* haben keinen Browser-User-Agent (Bot-Detection schlaegt zu)
* fragen oft schnell hintereinander (Rate-Limiter blockt)
* sollen **nicht** durch denselben Limit-Bucket wie unbekannte
  Internet-User laufen

Setzt man die ganzen RFC1918-Subnets in `botdetection.ip_lists.pass_ip`,
wuerde **auch NPM** (kommt aus `proxy-net`) gebypassed werden. NPM ist
zwar `trusted_proxy` und reicht die echte Client-IP weiter — aber wenn
NPM-IP selbst zuerst gegen `pass_ip` geprueft wird, greift der Bypass
zu fruh.

(Der tatsaechliche Limiter-Code in `searx/limiter.py:151` evaluiert
`pass_ip` auf der `request.remote_addr` *nach* `ProxyFix`, also auf der
**echten** Client-IP. NPM faellt hier also nicht durch — aber die
Sicherheits-Margin ist enger als noetig, wenn man ganze /12-Bloecke
freigibt. Ein dediziertes, schmales Subnet ist sauberer.)

## Decision

Wir fuehren ein **drittes Docker-Netz** ein:

| Netz | Zweck | Subnet |
|------|-------|--------|
| `proxy-net` | NPM (Reverse-Proxy/TLS) | von NPM gemanagt |
| `loogi-net` | Lokale Service-Konsumenten (crawl4ai etc.) | **fix `172.30.0.0/24`** |
| `loogi-internal` | Valkey-Backend (`internal: true`) | dynamisch |

Beide externen Netze (`proxy-net`, `loogi-net`) werden vor `compose up`
auf dem Host angelegt:

```sh
docker network create --subnet=172.30.0.0/24 loogi-net
```

In `searxng/limiter.toml` steht entsprechend:

```toml
pass_ip = [
  '172.30.0.0/24',  # loogi-net
  '127.0.0.0/8',
  '::1',
]
```

Andere Compose-Stacks joinen sich an `loogi-net` ueber:

```yaml
networks:
  loogi-net:
    external: true
```

und greifen dann auf `http://loogi:8080/` zu — ohne Limit, ohne
Bot-Detection.

## Alternatives considered

* **Komplett `172.16.0.0/12` in `pass_ip`** — schnell, aber gibt
  *jedem* Container im Bridge-Range den Bypass. Ein versehentlich
  bereitgestellter Test-Container haette unbegrenzten Zugriff, oder
  ein kompromittierter Nachbar-Container koennte LOOGI als Angriffs-
  Pivot nutzen. Zu breit.
* **API-Token-basierter Bypass** — sauberer, weil identitaetsbasiert
  statt netzwerkbasiert. Aber: SearXNG hat keinen built-in Mechanismus
  dafuer; man muesste einen NGINX-Sidecar einbauen, der einen Token
  pruft und `X-Forwarded-For` ueberschreibt. Zu viel Maschinerie fuer
  einen Hobby-Server.
* **`server.limiter: false`** generell — wuerde auch fuer den Public-
  Web-Traffic gelten und Bot-Scraper einladen. No.
* **Crawl4ai weiterhin ueber NPM jagen** mit eigenem Auth-Header — geht,
  aber NPM kann LOOGI-spezifisches Bypass-Routing nicht so leicht; und
  wir wollen interne Dienste nicht ueber TLS/Public-FQDN routen, das ist
  nur Round-Trip-Overhead.

## Consequences

* **Positiv**: Klare Trennung. Public-Traffic (Browser → NPM → LOOGI)
  hat normalen Limiter. Lokale Dienste (crawl4ai → loogi-net → LOOGI)
  haben unbegrenzten Zugriff. Keine breite Subnet-Whitelist.
* **Negativ / Trade-Off**:
  - Setup ist nicht mehr "compose up" pur — der User muss `loogi-net`
    vorher anlegen. Im README dokumentiert.
  - Fixes Subnet `172.30.0.0/24` muss frei sein auf dem Host. Falls
    Konflikt: in `compose.yml` und `limiter.toml` beide Werte synchron
    aendern.
* **Folgeaufgaben**:
  - Beim Aufsetzen von crawl4ai dessen compose so konfigurieren,
    dass es `loogi-net` als externes Netz nutzt.
  - Falls weitere Konsumenten dazukommen (RAG-Pipelines etc.):
    dieselbe Recipe nutzen, nichts an LOOGI selbst aendern.
