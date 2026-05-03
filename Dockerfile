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
