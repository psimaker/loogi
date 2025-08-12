# LOOGI — custom image based on the official searxng/searxng:latest.
# Bakes the theme + config into the image. No build step, no mount paths.
# See ADR 0003.

FROM searxng/searxng:latest

# Theme: templates + static assets
COPY --chown=searxng:searxng theme/loogi/templates/ /usr/local/searxng/searx/templates/loogi/
COPY --chown=searxng:searxng theme/loogi/static/    /usr/local/searxng/searx/static/themes/loogi/

# Configuration: settings.yml + limiter.toml land under /etc/searxng/.
# The official entrypoint expects them exactly there.
COPY --chown=searxng:searxng searxng/settings.yml   /etc/searxng/settings.yml
COPY --chown=searxng:searxng searxng/limiter.toml   /etc/searxng/limiter.toml

# Patch the Brave Search API key into settings.yml at build time.
# BRAVE_API_KEY comes from the local .env via compose.yml -> build.args
# (see ADR 0016). Default is empty; in that case the braveapi engine is
# disabled on init with "No API key provided" (no crash, the engine just
# drops out of the ranking). Set a key to get a working braveapi engine.
# Repo stays secret-free.
ARG BRAVE_API_KEY=""
USER root
RUN SETTINGS=/etc/searxng/settings.yml && \
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

# The tor_check plugin has a hardcoded "SearXNG" in its description that
# becomes visible on the /preferences page. Replace with "LOOGI" and clean pyc.
RUN TOR_PLUGIN=/usr/local/searxng/searx/plugins/tor_check.py && \
    grep -q "but from SearXNG" "$TOR_PLUGIN" && \
    sed -i "s|but from SearXNG|but from LOOGI|" "$TOR_PLUGIN" && \
    grep -q "but from LOOGI" "$TOR_PLUGIN" && \
    rm -rf /usr/local/searxng/searx/plugins/__pycache__
USER searxng
