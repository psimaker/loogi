# Privacy Policy

LOOGI is a metasearch engine. We do not log search queries, IP addresses,
or click-throughs.

## Operator

This instance is operated as a personal project by Umut Erdem (Switzerland).
Contact: <umut.erdem@protonmail.com>

## What we don't do

- No logging of search queries
- No logging of IP addresses for analytics
- No cookies except for preferences you set explicitly (UI language,
  theme, search engines, ...)
- No third-party trackers, analytics, or advertising
- No profiling, no browser fingerprinting

## What we do

- **Forward your query** to upstream search engines (Google, Brave,
  DuckDuckGo, Wikipedia, arXiv, ...). Each upstream engine has its own
  privacy policy and may log the query. We strip identifying headers
  before forwarding.
- Run an **in-memory rate limiter** (Valkey) that briefly stores
  hashes of client IPs to block bot traffic. Entries expire
  automatically after a short time window.
- Serve **static assets** (CSS, JavaScript, icons) which your browser
  caches via standard HTTP caching headers.

## Web fonts

LOOGI loads "Inter Tight" and "JetBrains Mono" from
[fonts.bunny.net](https://fonts.bunny.net/about), a privacy-respecting
font provider that does not log requests or set cookies.

## Server logs

The web server keeps short-lived diagnostic logs (HTTP status codes,
response times, errors) without storing IP addresses or query content.
Logs are rotated automatically.

## Your rights

LOOGI does not collect personal data, so there is no profile to access,
correct, or delete. For any question, email the operator.

## Changes

This policy may be updated. The current version is always available
under `/info/<your-language>/privacy`.

Last updated: 2026-05-03
