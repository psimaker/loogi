# 0011 — Datenschutz/AGB als Infopages, Toc-Erweiterung via Dockerfile-Patch

* Status: accepted
* Datum: 2026-05-03

## Context

Eine oeffentliche Suchmaschine unter loogi.ch braucht Datenschutzerklaerung
und Nutzungsbedingungen, mehrsprachig (EN/DE/FR/ES/IT), eingebettet im
LOOGI-Layout. Im Footer und ggf. Header verlinkt.

SearXNG bringt ein **Infopage-System** mit (`searx/infopage/`):
Markdown-Files unter `searx/infopage/<locale>/<pagename>.md` werden ueber
`/info/<locale>/<pagename>` ausgeliefert, mit Tabs ueber alle Pages,
i18n-Auto-Detect, Markdown→HTML via mistletoe/markdown-it, Caching.

Problem: Die TOC ist hardcoded in `searx/infopage/__init__.py:142-146`:
```python
self.toc: list[str] = [
    'search-syntax',
    'about',
    'donate',
]
```

Das Settings-System bietet keinen Hook, neue Pagenames hinzuzufuegen.
`get_page(pagename)` gibt `None` zurueck wenn `pagename not in self.toc`,
und der `info`-Endpoint antwortet mit 404.

## Decision

Wir bauen darauf, dass das Infopage-System genau das tut was wir brauchen
(Markdown + i18n + Caching + Tabs + Layout-Integration), und erweitern die
TOC zur Build-Zeit mit einem `sed`-Patch im Dockerfile:

```dockerfile
RUN INFOPAGE=/usr/local/searxng/searx/infopage/__init__.py && \
    grep -q "'donate'," "$INFOPAGE" && \
    sed -i "s|^            'donate',|            'donate',\n            'privacy',\n            'terms',|" "$INFOPAGE" && \
    grep -q "'privacy'," "$INFOPAGE" && \
    grep -q "'terms'," "$INFOPAGE"
```

Die `grep`-Asserts vor und nach dem `sed` machen den Build hart fehlschlagen,
falls die erwartete Marker-Zeile beim Upstream wegfaellt — wir merken das beim
naechsten Image-Bau, nicht erst zur Laufzeit.

Markdown-Files liegen im Repo unter `searxng/infopage/<lang>/{privacy,terms}.md`
und werden via `COPY` ins Image-Verzeichnis `/usr/local/searxng/searx/infopage/`
gemerged. Das ergaenzt — und ueberschreibt nicht — die SearXNG-Originale
(`about.md`, `search-syntax.md`).

## Alternatives considered

* **Externe statische HTML-Files** unter `theme/loogi/static/legal/<lang>/`,
  via `general.privacypolicy_url` und `general.contact_url` in settings.yml
  verlinkt — funktioniert ohne Patch, aber die Pages sind dann ausserhalb
  der Layout-Pipeline, kein i18n-Auto-Detect, kein Markdown, doppelter
  Wartungsaufwand fuer Header/Footer.
* **Privacy/Terms in `about.md` zusammenfuehren** — nur eine Page, keine
  TOC-Erweiterung noetig, aber unuebersichtlich und nicht direkt verlinkbar
  (`/info/.../privacy` waere ein Anker-Link).
* **`general.privacypolicy_url` auf eine externe URL** (GitHub-Wiki oder
  GitHub-Pages) — funktioniert, aber dann lebt der Inhalt ausserhalb der
  Suchmaschine, anderes Layout, kein deterministisches i18n.
* **SearXNG forken und TOC erweitern** — ueberzogen fuer eine Zwei-Eintraege-
  Aenderung. Genau die Sorte Drift, die wir mit ADR 0003 vermeiden wollten.
* **Custom Plugin, das `INFO_PAGES.toc` zur Boot-Zeit extended** — Plugin
  haette einen `init()`-Hook, koennte den globalen `INFO_PAGES`-Singleton
  monkeypatchen. Aber: Plugins sind fuer Search-Pipeline-Hooks gedacht, nicht
  fuer Routing-Aenderungen. Dafuer extra-Boilerplate (Plugin-Manifest,
  Settings-Eintrag, Lifecycle), Effekt waere derselbe wie der `sed`-Patch —
  mehr Komplexitaet ohne Mehrwert.

## Consequences

* **Positiv**: Volles Infopage-System nutzbar — Markdown, i18n, Caching,
  Tabs, Layout-Integration. Privacy und Terms sind erreichbar unter
  `/info/<lang>/privacy` und `/info/<lang>/terms`. Footer-Links nutzen
  `url_for('info', pagename='privacy', locale=lang2)`. Keine Code-
  Duplikation gegenueber dem `about`-Mechanismus.
* **Negativ / Trade-Off**: Wir patchen Upstream-Code. Bei jedem Major-
  Update von SearXNG muessen wir pruefen, ob die `'donate',`-Zeile noch
  existiert. Der Build fail-safe macht das sichtbar (Image baut nicht),
  aber es bleibt eine Wartungsschuld. Ist im CLAUDE.md dokumentiert.
* **Folgeaufgaben**:
  - Bei Upstream-Updates Diff von `searx/infopage/__init__.py` pruefen.
  - Falls SearXNG selbst ein Settings-Hook fuer `toc` einfuehrt, von
    Patch auf Konfig umstellen und diese ADR durch eine neue ersetzen.
  - Inhalte rechtlich pruefen lassen, bevor loogi.ch oeffentlich beworben
    wird (ist explizit im README als TODO vermerkt).
