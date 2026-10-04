# 0017 — Plugins as a `plugins:` dict instead of the dead `enabled_plugins:` list

* Status: accepted
* Date: 2026-06-11

## Context

During the base update to SearXNG 2026.6.10 (from 2026.5.9) it turned out
that our `settings.yml` still configured plugins through the list key
`enabled_plugins:` (with display names such as `"Hash plugin"`). SearXNG
**no longer reads** that key — in the whole source tree it only appears as
the name of a preferences **cookie** (`searx/preferences.py`), not as a
settings key. That was already true for the previously running 2026.5.9:
the list was dead config.

The current format is a `plugins:` dict with fully qualified class paths:

```yaml
plugins:
  searx.plugins.hash_plugin.SXNGPlugin:
    active: true
```

Two quirks of the loader (`searx/settings_loader.py`,
`update_settings()`):

1. A `plugins:` dict in the user config **replaces the upstream default
   completely** — no deep merge (the same trap as with `engines:`, see
   ADR 0009). Plugins that aren't listed are **not loaded at all** (and
   are missing as toggles on /preferences).
2. `enabled_plugins:` is ignored silently — no warning in the log.

Actual live state caused by the dead config: the upstream defaults
applied, i.e. `calculator`, `ahmia_filter` and `time_zone` were running
on top (they were never on our list), and the `oa_doi_rewrite` plugin we
wanted (open-access DOI rewrite) was **off**.

## Decision

`enabled_plugins:` is replaced by a complete `plugins:` dict. Chosen
plugin set = **the upstream default state** (that's how the instance
actually ran, without complaints) **plus one deliberate delta**:

| Plugin | active | Rationale |
|--------|--------|-----------|
| calculator, hash_plugin, self_info, unit_converter, ahmia_filter, hostnames, time_zone, tracker_url_remover | `true` | upstream default, ran like this live |
| **oa_doi_rewrite** | **`true`** | the only delta — original intent of the old list, lost through the dead config |
| tor_check | `false` | loaded (can be switched on at /preferences; the description is patched to LOOGI in the Dockerfile), but off by default |
| infinite_scroll | not listed | the feature is disabled in `ui:`; don't load the plugin at all |

The old six-item list was deliberately **not** restored: switching off
calculator/time_zone/ahmia_filter would have been a visible behavior
change of the live instance for no reason.

## Consequences

* Plugin configuration takes effect again; from now on, changes to the set
  happen exclusively in the `plugins:` dict in `searxng/settings.yml`.
* Since the dict replaces the default: when upstream introduces new
  plugins, they do **not** show up here automatically — on every base
  update, diff the `plugins:` block of the upstream `settings.yml` and
  consciously accept/reject (see the update playbook in the README).
* `oa_doi_rewrite` is actually active for the first time (DOI links are
  rewritten to free full texts).
