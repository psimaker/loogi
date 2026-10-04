# SPDX-License-Identifier: AGPL-3.0-or-later
"""LOOGI — snippet cleaner plugin (see ADR 0019).

Some engines (observed: startpage, braveapi) deliver titles/snippets with
leftover markup: raw formatting tags (``<strong>…</strong>``) and/or
HTML entities that were escaped once (``&quot;``, ``&#x27;``) in the content
string. The webapp escapes the content when rendering (correctly), so the
leftovers end up as visible plain text in the search results.

This plugin runs as an ``on_result`` hook BEFORE the webapp's escaping and
highlighting and normalizes ``title``/``content``: one entity-unescape
pass, then stripping of a whitelist of known formatting tags. Deliberately
NO generic ``<[^>]*>`` stripping — legitimate content such as
``a < b && c > d`` must not be damaged.
"""

import typing

import html
import re

from flask_babel import gettext

from searx.plugins import Plugin, PluginInfo

if typing.TYPE_CHECKING:
    from searx.search import SearchWithPlugins
    from searx.extended_types import SXNG_Request
    from searx.result_types import Result
    from searx.plugins import PluginCfg

# Only strip known inline/formatting tags (with/without attributes,
# opening/closing/self-closing).
_FORMATTING_TAG_RE = re.compile(
    r"</?(?:strong|b|em|i|u|s|span|sup|sub|mark|small|big|br|wbr|p|a|code|pre|h[1-6])\b[^>]*/?>",
    re.IGNORECASE,
)


def _clean(text: str) -> str:
    if "&" in text:
        text = html.unescape(text)
    if "<" in text:
        text = _FORMATTING_TAG_RE.sub("", text)
    return text


class SXNGPlugin(Plugin):
    """Normalizes leftover markup in engine snippets (title + content)."""

    id = "loogi_snippet_cleaner"

    def __init__(self, plg_cfg: "PluginCfg") -> None:
        super().__init__(plg_cfg)
        self.info = PluginInfo(
            id=self.id,
            name=gettext("Snippet cleaner"),
            description=gettext("Removes leftover HTML markup and escaped entities from result snippets."),
            preference_section="general",
        )

    def on_result(self, request: "SXNG_Request", search: "SearchWithPlugins", result: "Result") -> bool:
        for field in ("title", "content"):
            val = getattr(result, field, None)
            if isinstance(val, str) and val and ("&" in val or "<" in val):
                cleaned = _clean(val)
                if cleaned != val:
                    setattr(result, field, cleaned)
        return True
