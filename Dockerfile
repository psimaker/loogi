# LOOGI — custom image based on the official searxng/searxng image.
# Bakes the theme + config into the image. No build step, no mount paths.
# See ADR 0003.

# Base version pinned (ADR 0023): an upstream update is a deliberate bump
# of this line + the drift checklist (README -> Updates) — not a side
# effect of rebuilding for a config change. Tag scheme YYYY.M.D-<git-sha>
# (Docker Hub searxng/searxng).
ARG SEARXNG_VERSION=2026.10.4-d48c4b555
FROM searxng/searxng:${SEARXNG_VERSION}

# Theme: templates + static assets
COPY --chown=searxng:searxng theme/loogi/templates/ /usr/local/searxng/searx/templates/loogi/
COPY --chown=searxng:searxng theme/loogi/static/    /usr/local/searxng/searx/static/themes/loogi/

# Configuration: settings.yml + limiter.toml + favicons.toml land under
# /etc/loogi/ — deliberately NOT /etc/searxng/: the upstream image declares
# /etc/searxng as a VOLUME. Compose mounts an anonymous volume there that is
# populated from the image on the FIRST container start and from then on
# masks every config change baked into a newer image (rebuilds never reached
# /etc/searxng — discovered 2026-06-11, see ADR 0018).
# With SEARXNG_SETTINGS_PATH pointing to a FOLDER, SearXNG reads settings.yml,
# limiter.toml and favicons.toml from exactly that folder
# (searx/settings_loader.py get_user_cfg_folder, rule 1).
COPY --chown=searxng:searxng searxng/settings.yml   /etc/loogi/settings.yml
COPY --chown=searxng:searxng searxng/limiter.toml   /etc/loogi/limiter.toml
COPY --chown=searxng:searxng searxng/favicons.toml  /etc/loogi/favicons.toml
ENV SEARXNG_SETTINGS_PATH=/etc/loogi

# Patch the Brave Search API key into settings.yml at build time.
# BRAVE_API_KEY comes from the local .env via compose.yml -> build.args
# (see ADR 0016). Default is empty; in that case the braveapi engine is
# disabled on init with "No API key provided" (no crash, the engine just
# drops out of the ranking). Set a key to get a working braveapi engine.
# Repo stays secret-free.
ARG BRAVE_API_KEY=""
USER root
RUN SETTINGS=/etc/loogi/settings.yml && \
    grep -q "BRAVE_API_KEY_PLACEHOLDER" "$SETTINGS" && \
    sed -i "s|BRAVE_API_KEY_PLACEHOLDER|${BRAVE_API_KEY}|" "$SETTINGS"
USER searxng

# Custom info pages (privacy, terms). One subdirectory per language.
# We want ONLY these pages — see RUN block below, which removes the
# SearXNG defaults (about, search-syntax, donate) and unsupported languages.
COPY --chown=searxng:searxng searxng/infopage/      /usr/local/searxng/searx/infopage/

# Patch: add privacy + terms to InfoPageSet.toc so that /info/<locale>/privacy
# and /info/<locale>/terms become reachable (see ADR 0011).
# Breaks the build if the expected marker line no longer exists.
# Pre-compiled .pyc from the builder stage must be invalidated, otherwise
# Python loads the old (pre-patch) module version.
USER root
RUN INFOPAGE=/usr/local/searxng/searx/infopage/__init__.py && \
    grep -q "'donate'," "$INFOPAGE" && \
    sed -i "s|^            'donate',|            'donate',\n            'privacy',\n            'terms',|" "$INFOPAGE" && \
    grep -q "'privacy'," "$INFOPAGE" && \
    grep -q "'terms'," "$INFOPAGE" && \
    rm -rf /usr/local/searxng/searx/infopage/__pycache__

# Remove SearXNG default infopages and unsupported languages.
# We link nowhere to about/search-syntax/donate; the LOOGI About link
# points to https://github.com/psimaker (see base.html).
# Unsupported languages (fa_IR, id) would otherwise show up in
# InfoPageSet.locales and render tabs for them on info pages.
RUN find /usr/local/searxng/searx/infopage -type f \
        \( -name 'about.md' -o -name 'search-syntax.md' -o -name 'donate.md' \) \
        -delete && \
    rm -rf /usr/local/searxng/searx/infopage/fa_IR \
           /usr/local/searxng/searx/infopage/id && \
    test -f /usr/local/searxng/searx/infopage/en/privacy.md && \
    test -f /usr/local/searxng/searx/infopage/de/terms.md && \
    ! test -f /usr/local/searxng/searx/infopage/en/about.md

# Custom plugins: snippet cleaner (leftover markup in engine snippets,
# ADR 0019) + thumbnail cleaner (score inversions caused by thumbnail
# grouping, ADR 0021; braveapi normalization, ADR 0024) + log redactor (no
# search queries/IPs in logs, ADR 0026).
# They live in the searx.plugins namespace so the fqn loader in settings.yml
# (plugins: dict) can load them like upstream plugins.
COPY --chown=searxng:searxng searxng/plugins/loogi_snippet_cleaner.py   /usr/local/searxng/searx/plugins/loogi_snippet_cleaner.py
COPY --chown=searxng:searxng searxng/plugins/loogi_thumbnail_cleaner.py /usr/local/searxng/searx/plugins/loogi_thumbnail_cleaner.py
COPY --chown=searxng:searxng searxng/plugins/loogi_log_redactor.py      /usr/local/searxng/searx/plugins/loogi_log_redactor.py

# The tor_check plugin has a hardcoded "SearXNG" in its description that
# becomes visible on the /preferences page. Replace with "LOOGI" and clean pyc.
RUN TOR_PLUGIN=/usr/local/searxng/searx/plugins/tor_check.py && \
    grep -q "but from SearXNG" "$TOR_PLUGIN" && \
    sed -i "s|but from SearXNG|but from LOOGI|" "$TOR_PLUGIN" && \
    grep -q "but from LOOGI" "$TOR_PLUGIN" && \
    rm -rf /usr/local/searxng/searx/plugins/__pycache__
USER searxng
