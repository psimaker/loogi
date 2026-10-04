# SPDX-License-Identifier: AGPL-3.0-or-later
"""LOOGI — thumbnail cleaner plugin (see ADR 0021).

SearXNG's result ordering (``ResultContainer.get_ordered_results``) runs a
grouping pass after the score sort, keyed by
``category:template:has-thumbnail``. Engines deliver thumbnails for web
results inconsistently (observed: braveapi yes, startpage/duckduckgo no) —
so every general/news results page falls apart into two blocks (first all
results without a thumbnail, then those with one), with massive score
inversions at the block boundary: multi-engine consensus results with a
score of 1.0+ end up behind single results with a score of 0.2.

The LOOGI theme does not render thumbnails in ``default.html`` — the
grouping therefore sorts by an invisible attribute. This plugin clears
``thumbnail``/``img_src`` for all results with the ``default.html``
template: the group key becomes uniform and the page shows the pure score
order. Result types with visible thumbnails (``images.html``,
``videos.html``, ...) stay untouched.

Runs as an ``on_result`` hook in ``ResultContainer.add()`` — i.e. BEFORE
merging, scoring and grouping (``normalize_result_fields()`` has already
run at that point, ``template`` is set).

Second job (ADR 0024): since #6688 (2026-09) upstream braveapi parses EVERY
web result as a ``Video`` result (template ``videos.html``). The merge hash
contains the template — so braveapi results never merge with the same URL
from duckduckgo/startpage/... (duplicates, no consensus scoring). Such
results are reset to ``default.html`` here, BEFORE the thumbnail check
runs — which is why this lives in the same hook and not in a plugin of its
own (plugin order would matter otherwise). As soon as upstream braveapi
returns ``MainResult`` again, this branch has no effect.
"""

import typing

from flask_babel import gettext

from searx.plugins import Plugin, PluginInfo

if typing.TYPE_CHECKING:
    from searx.search import SearchWithPlugins
    from searx.extended_types import SXNG_Request
    from searx.result_types import Result
    from searx.plugins import PluginCfg


class SXNGPlugin(Plugin):
    """Drops invisible thumbnails from default-template results so the
    grouping pass doesn't break the score order."""

    id = "loogi_thumbnail_cleaner"

    def __init__(self, plg_cfg: "PluginCfg") -> None:
        super().__init__(plg_cfg)
        self.info = PluginInfo(
            id=self.id,
            name=gettext("Thumbnail cleaner"),
            description=gettext("Drops invisible thumbnails from web results so they stay strictly score-ordered."),
            preference_section="general",
        )

    def on_result(self, request: "SXNG_Request", search: "SearchWithPlugins", result: "Result") -> bool:
        template = getattr(result, "template", None) or "default.html"
        if template == "videos.html" and getattr(result, "engine", None) == "braveapi":
            result.template = template = "default.html"
        if template == "default.html":
            if getattr(result, "thumbnail", None):
                result.thumbnail = ""
            if getattr(result, "img_src", None):
                result.img_src = ""
        return True
