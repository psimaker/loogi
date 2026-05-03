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

# Eigene Info-Pages (privacy, terms) zusaetzlich zu den SearXNG-Defaults
# (about, search-syntax, donate). Pro Sprache eigenes Unterverzeichnis.
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
USER searxng
