# 0026 — Log redactor: no search queries and no IP addresses in server logs

* Status: accepted
* Date: 2026-10-04

## Context

The privacy policy (`searxng/infopage/*/privacy.md`) states literally:
"no logging of search queries", and the server logs contain "HTTP status
codes, response times, errors, without storing IP addresses or search
queries".

During the review on 2026-10-04 the container logs (Docker json-file,
3 × 10 MB rotation, history since end of June) contained **35 lines with
search terms in plain text**. The source is regular error paths at level
WARNING/ERROR, not debug mode:

* `searx.network.<engine>: HTTP Request failed: GET <URL>` — the engine
  URL carries the search query as `?q=…` (still the case in 2026.10.4,
  `searx/network/network.py`, `patch_response`).
* up to 2026.6.17 additionally `searx.engines.<engine>: requests exception
  … for url '…?q=…'` (only in debug mode since upstream b023a28ba).

Bot detection logs client IPs on BLOCK events at ERROR (`ip_limit.py`,
`limiter.py`) — hasn't happened so far, but could at any time.

## Decision

Own plugin `searxng/plugins/loogi_log_redactor.py` (copied to
`searx/plugins/` by the Dockerfile, registered in the `plugins:` dict,
ADR 0017). It has no request hooks; in `init()` (once per worker at app
start) it attaches a `logging.Filter` to every handler of the root logger
(in production mode SearXNG uses `logging.basicConfig` → one
StreamHandler).

From level INFO up, the filter masks in every record:

* query strings of URLs (`https://host/path?<redacted>`) — engine and
  endpoint stay visible for diagnosis;
* IPv4/IPv6 addresses and networks (`<ip>`), validated via `ipaddress`
  (no false positives on versions, durations, timestamps);

in the message and in the traceback text. DEBUG stays untouched — debug
mode is a deliberate, short-lived diagnostic switch of the operator.

## Alternatives considered

- **Switch off Docker logging (`driver: none`)** — loses every diagnosis
  (engine outages, template errors).
- **Shorter log rotation** — reduces retention, but doesn't change the
  fact that search queries are stored.
- **sed patch on `network.py`** — depends on one line of upstream
  internals and doesn't cover other loggers (bot detection, tracebacks).
- **Adjust the privacy policy** — possible, but "no search queries in
  logs" is the right standard for a privacy search engine.

## Consequences

* **Positive**: the logs match the privacy policy. Verified against all 53
  distinct message types from the production logs: 27 containing a search
  query → 0 leaks afterwards, no false positives.
* **Positive**: no overhead per search; the filter acts globally and can't
  be switched off via user preferences (`preference_section=None`).
* **Negative / trade-off**: on engine errors the concrete query is no
  longer in the log — to reproduce, switch on debug mode briefly. BLOCK
  messages no longer name an IP (bot detection keeps working unchanged
  with the data in Valkey).
* **Follow-ups**: the logs of the previous container contained search
  queries; they disappear with the recreate on deploy (Docker deletes
  json-file logs together with the container).
