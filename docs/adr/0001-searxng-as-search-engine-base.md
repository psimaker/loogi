# 0001 — SearXNG as the search-engine base

* Status: accepted
* Date: 2025-08-12

## Context

LOOGI is meant to become a public web search at loogi.ch. Building my own
crawl-and-index infrastructure isn't realistic — storage, bandwidth, and
engineering effort are orders of magnitude beyond the budget. The realistic
options are:

1. license an existing index (Bing, Brave, Google CSE) and build a frontend
   on top
2. implement a metasearch that fans queries out to multiple backends and
   aggregates the results
3. take an existing open-source metasearch and adapt it

## Decision

I build LOOGI on [SearXNG](https://docs.searxng.org/).

## Alternatives considered

* **Custom frontend on top of Bing/Brave API** — vendor lock-in, per-query
  cost, no source diversity, tracking exposure through the provider.
* **YaCy** — decentralised peer search, conceptually appealing, but result
  quality for general web search isn't competitive.
* **Whoogle** — focused on proxying Google, much smaller engine pool, less
  configurable.

## Consequences

* **Positive**: a battle-tested stack with ~250 engines out of the box, an
  active community, AGPL-3.0 licensing that's compatible with self-hosting.
  Privacy posture aligns with the project goals. The Docker image is
  officially maintained.
* **Negative / trade-off**: AGPL-3.0 means any source change has to be
  released under the same licence. That's fine — LOOGI is meant to be open
  anyway — but every UI change is a derivative work, so copyleft applies.
* **Follow-ups**: keep the LICENSE file (AGPL-3.0) in the repo; for the
  public instance, offer source availability (footer link to the repo).
