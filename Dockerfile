# LOOGI — eigenes Image basierend auf dem offiziellen searxng/searxng:latest.
# Bringt Theme + Konfig in das Image rein. Kein Build-Step, keine Mount-Pfade.
# Siehe ADR 0003.

FROM searxng/searxng:latest

# Theme: Templates + Static-Assets
COPY --chown=searxng:searxng theme/loogi/templates/ /usr/local/searxng/searx/templates/loogi/
COPY --chown=searxng:searxng theme/loogi/static/    /usr/local/searxng/searx/static/themes/loogi/

# Konfiguration: settings.yml + limiter.toml landen unter /etc/searxng/.
# Der offizielle entrypoint erwartet sie genau dort.
COPY --chown=searxng:searxng searxng/settings.yml   /etc/searxng/settings.yml
COPY --chown=searxng:searxng searxng/limiter.toml   /etc/searxng/limiter.toml

# Brave Search API-Key zur Build-Zeit in die settings.yml patchen.
# BRAVE_API_KEY kommt aus der lokalen .env via compose.yml -> build.args
# (siehe ADR 0016). Default ist leer; in dem Fall wird die braveapi-Engine
# beim Init mit "No API key provided" deaktiviert (kein Crash, nur Engine
# faellt aus dem Ranking). Wer einen Key setzt, bekommt eine arbeitende
# braveapi-Engine. Repo bleibt secret-frei.
ARG BRAVE_API_KEY=""
USER root
RUN SETTINGS=/etc/searxng/settings.yml && \
    grep -q "BRAVE_API_KEY_PLACEHOLDER" "$SETTINGS" && \
    sed -i "s|BRAVE_API_KEY_PLACEHOLDER|${BRAVE_API_KEY}|" "$SETTINGS"
USER searxng

# Eigene Info-Pages (privacy, terms). Pro Sprache eigenes Unterverzeichnis.
# Wir wollen NUR diese Pages — siehe RUN-Block unten, der die SearXNG-Defaults
# (about, search-syntax, donate) und nicht-unterstuetzte Sprachen entfernt.
COPY --chown=searxng:searxng searxng/infopage/      /usr/local/searxng/searx/infopage/

# Patch: privacy + terms zur InfoPageSet.toc hinzufuegen, damit /info/<locale>/privacy
# und /info/<locale>/terms erreichbar werden (siehe ADR 0011).
# Bricht den Build, falls die erwartete Marker-Zeile nicht mehr existiert.
# Vorkompilierte .pyc aus dem Builder-Stage muss invalidiert werden, sonst
# laedt Python die alte (vor-Patch) Modul-Version.
USER root
RUN INFOPAGE=/usr/local/searxng/searx/infopage/__init__.py && \
    grep -q "'donate'," "$INFOPAGE" && \
    sed -i "s|^            'donate',|            'donate',\n            'privacy',\n            'terms',|" "$INFOPAGE" && \
    grep -q "'privacy'," "$INFOPAGE" && \
    grep -q "'terms'," "$INFOPAGE" && \
    rm -rf /usr/local/searxng/searx/infopage/__pycache__

# SearXNG-Default-Infopages und nicht unterstuetzte Sprachen entfernen.
# Wir verlinken nirgends auf about/search-syntax/donate; das LOOGI-About-Link
# zeigt auf https://github.com/psimaker (siehe base.html).
# Nicht unterstuetzte Sprachen (fa_IR, id) wuerden sonst in InfoPageSet.locales
# auftauchen und Tabs in info-Pages dafuer rendern.
RUN find /usr/local/searxng/searx/infopage -type f \
        \( -name 'about.md' -o -name 'search-syntax.md' -o -name 'donate.md' \) \
        -delete && \
    rm -rf /usr/local/searxng/searx/infopage/fa_IR \
           /usr/local/searxng/searx/infopage/id && \
    test -f /usr/local/searxng/searx/infopage/en/privacy.md && \
    test -f /usr/local/searxng/searx/infopage/de/terms.md && \
    ! test -f /usr/local/searxng/searx/infopage/en/about.md

# tor_check-Plugin hat ein hardcoded "SearXNG" in der Description, das auf
# der /preferences-Seite sichtbar wird. Ersetzen durch "LOOGI" und pyc cleanen.
RUN TOR_PLUGIN=/usr/local/searxng/searx/plugins/tor_check.py && \
    grep -q "but from SearXNG" "$TOR_PLUGIN" && \
    sed -i "s|but from SearXNG|but from LOOGI|" "$TOR_PLUGIN" && \
    grep -q "but from LOOGI" "$TOR_PLUGIN" && \
    rm -rf /usr/local/searxng/searx/plugins/__pycache__
USER searxng
