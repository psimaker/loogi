# Datenschutzerklärung

LOOGI ist eine Metasuchmaschine. Wir protokollieren weder Suchanfragen
noch IP-Adressen noch Klicks auf Treffer.

## Betreiber

Diese Instanz wird als persönliches Projekt von Umut Erdem (Schweiz)
betrieben.
Kontakt: <umut.erdem@protonmail.com>

## Was wir nicht tun

- Keine Protokollierung von Suchanfragen
- Keine Protokollierung von IP-Adressen zu Analyse­zwecken
- Keine Cookies, ausser für Einstellungen, die du selbst aktiv setzt
  (UI-Sprache, Theme, Suchmaschinenauswahl, ...)
- Keine Drittanbieter-Tracker, kein Analytics, keine Werbung
- Kein Profiling, kein Browser-Fingerprinting

## Was wir tun

- **Suchanfragen weiterleiten** an Suchmaschinen wie Google, Brave,
  DuckDuckGo, Wikipedia, arXiv usw. Jede dieser Suchmaschinen hat ihre
  eigene Datenschutzrichtlinie und kann die Anfrage protokollieren. Wir
  entfernen identifizierende Header, bevor wir weiterleiten.
- Einen **In-Memory-Rate-Limiter** (Valkey) betreiben, der kurz
  Hash-Werte von Client-IPs speichert, um Bot-Verkehr zu erkennen.
  Einträge laufen automatisch nach kurzer Zeit ab.
- **Statische Inhalte** (CSS, JavaScript, Icons) ausliefern, die dein
  Browser über Standard-HTTP-Caching zwischenspeichert.

## Web-Schriften

LOOGI lädt "Inter Tight" und "JetBrains Mono" von
[fonts.bunny.net](https://fonts.bunny.net/about), einem
datenschutzfreundlichen Font-Anbieter, der keine Anfragen protokolliert
und keine Cookies setzt.

## Server-Logs

Der Webserver führt kurzlebige Diagnose-Logs (HTTP-Statuscodes,
Antwortzeiten, Fehler), ohne IP-Adressen oder Suchanfragen zu speichern.
Logs werden automatisch rotiert.

## Deine Rechte

LOOGI erhebt keine personenbezogenen Daten — es gibt also kein Profil,
das eingesehen, korrigiert oder gelöscht werden müsste. Bei Fragen wende
dich an den Betreiber.

## Änderungen

Diese Erklärung kann aktualisiert werden. Die jeweils aktuelle Version
ist unter `/info/<deine-sprache>/privacy` verfügbar.

Letzte Aktualisierung: 2026-05-03
