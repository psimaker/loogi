# 0004 — Jinja templates instead of porting React

* Status: accepted
* Date: 2025-09-23

## Context

The design prototype is React + Babel-standalone (CDN), rendered
client-side into a `<div id="root">`. Mock data lives as JS objects in
`loogi-data.jsx`. The LOOGI UI is two pages — homepage and results.

SearXNG itself is server-side rendered (Flask + Jinja2). Three ways to
port the design:

1. **Port React 1:1**: React + Babel via CDN, pull data through a SearXNG
   JSON API, render in the browser.
2. **React with a build step**: bundle React via Vite/esbuild, ship the
   bundled JS, talk to a JSON API.
3. **Server-side render via Jinja**: derive templates from the prototype
   and plug them into SearXNG's render pipeline.

## Decision

I go with option 3 — pure Jinja templates, no React runtime in production
code.

## Alternatives considered

* **Option 1 (React via CDN)** — every search loads React + Babel in the
  browser, Babel transpiles on the client (slow, blocks first paint).
  Indexability of results suffers. Privacy: every additional CDN hop is a
  tracking surface. Nothing argues for it except more convenient code
  mapping with the prototype.
* **Option 2 (React with a build step)** — adds a Vite/esbuild step to the
  pipeline. More tooling, more update load (`npm audit` etc.). The benefit
  would be component-like reuse — which I don't need because the design is
  static.

## Consequences

* **Positive**: no build step. No npm. Templates live directly inside
  SearXNG's render pipeline and receive every variable (results, paging,
  infoboxes, ...) without a JSON-API detour. The React/Babel CDN drops
  out — faster loads, no third-party requests.
* **Negative / trade-off**: anyone used to a React component model finds
  Jinja clunky. I have to close the loop between "I changed the prototype"
  and "I updated the theme" manually — no single source of truth.
* **Follow-ups**: when design updates land, port them into the `theme/`
  templates by hand. Mock data from `loogi-data.jsx` is not migrated; all
  data comes from SearXNG at runtime.
