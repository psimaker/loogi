# 0007 — i18n: EN/DE/FR/ES/IT mit Auto-Detect

* Status: accepted
* Datum: 2026-05-03

## Context

Das Design enthaelt eine i18n-Schicht (`loogi-i18n.js`) mit fuenf Sprachen:
Englisch, Deutsch, Franzoesisch, Spanisch, Italienisch. Auswahl im Prototyp
auto-detected via `navigator.languages`.

SearXNG bringt eine eigene i18n via Flask-Babel mit. UI-Strings werden in
`searx/translations/<locale>/LC_MESSAGES/messages.po` gepflegt und ueber
`{{ _('...') }}` in Templates aufgeloest. Die UI-Sprache wird per Cookie
oder Browser-`Accept-Language`-Header bestimmt
(`ui.default_locale: ""` = auto-detect).

Zusaetzlich beeinflusst `search.default_lang: "auto"` die Sprache der **Such-
Resultate** (Backend-Engines), basierend auf `Accept-Language` des Browsers.

## Decision

* **UI-Sprache (Theme)**: `ui.default_locale: ""` → SearXNG nutzt
  `Accept-Language` des Browsers und faellt auf Englisch zurueck.
  SearXNG-Translations decken EN/DE/FR/ES/IT vollstaendig ab.
* **Backend-Sprache (Resultate)**: `search.default_lang: "auto"` → Engines
  bekommen die Browser-Sprache mitgeteilt, soweit sie das unterstuetzen.
* Kein eigener Locale-Switcher im LOOGI-UI noetig: Browser-Sprache ist die
  intuitive Quelle der Wahrheit. Wer das ueberschreiben will, kann das in
  den SearXNG-Preferences tun.

## Alternatives considered

* **Eigener Locale-Switcher im Header** — wuerde dem Design widersprechen
  (kein Switcher im Prototyp) und dupliziert die Browser-Konfiguration.
* **Nur eine Sprache (z. B. Englisch) hardcoden** — verfehlt das Design-Ziel
  und benachteiligt deutschsprachige Schweizer User auf einer .ch-Domain.
* **Zusaetzliche Custom-Translations einfuehren** — nicht noetig, solange wir
  keine LOOGI-spezifischen UI-Strings haben, die nicht von SearXNG abgedeckt
  sind. Falls doch, in den `loogi/`-Templates direkt mit `{{ _('...') }}`
  annotieren und einen `messages.po`-Override im Theme einrichten.

## Consequences

* **Positiv**: Null Maintenance-Aufwand fuer i18n — wir ernten die
  SearXNG-Uebersetzungen mit. Auto-Detect ist user-friendly.
* **Negativ / Trade-Off**: Wir koennen nicht garantieren, dass jeder einzelne
  String in unseren Custom-Templates auch in allen fuenf Sprachen vorliegt —
  wenn wir neuen Klartext schreiben, ist er per Default nur Englisch.
* **Folgeaufgaben**: In Custom-Templates konsequent `{{ _('...') }}` nutzen,
  damit zukuenftige Uebersetzung moeglich ist (auch wenn wir sie zunaechst
  nicht selbst pflegen).
