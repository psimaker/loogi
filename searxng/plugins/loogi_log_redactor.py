# SPDX-License-Identifier: AGPL-3.0-or-later
"""LOOGI — log redactor plugin (see ADR 0026).

The privacy policy (``searxng/infopage/*/privacy.md``) promises: no logging
of search queries, server logs without IP addresses. In normal operation
(level WARNING, not only in debug mode) SearXNG nevertheless logs e.g.
``searx.network.<engine>: HTTP Request failed: GET <URL>`` — and the URL
carries the search query in its query string. Bot detection messages
(``BLOCK ... from <IP>``) contain client IPs.

In ``init()`` (once per worker at app start) the plugin attaches a
``logging.Filter`` to every handler of the root logger. From level INFO up,
the filter masks the query string of URLs and IP addresses in every record —
in the message and in the traceback text. DEBUG stays untouched: debug mode
(``SEARXNG_DEBUG``) is a deliberate, short-lived diagnostic switch.

No request hooks — no runtime overhead per search. The filter acts globally
and independently of user preferences.
"""

import ipaddress
import logging
import re
import typing

from flask_babel import gettext

from searx.plugins import Plugin, PluginInfo

if typing.TYPE_CHECKING:
    import flask
    from searx.plugins import PluginCfg

# URL with a query string: keep scheme://host/path, mask everything from "?" on.
_URL_QUERY_RE = re.compile(r"""((?:https?|wss?)://[^\s?#'"<>]+)\?[^\s#'"<>]*""")
# IP candidates (optionally with a /prefix); validated via ipaddress so that
# version numbers, timestamps or durations ("3.0 s", "08:21:14") are not
# masked by mistake.
_IPV4_RE = re.compile(r"(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?:/\d{1,2})?(?![\d.])")
_IPV6_RE = re.compile(r"(?<![\w:.])[0-9A-Fa-f]{0,4}(?::[0-9A-Fa-f]{0,4}){2,7}(?:/\d{1,3})?(?![\w:.])")


def _mask_ip(match: re.Match[str]) -> str:
    try:
        ipaddress.ip_network(match.group(0), strict=False)
    except ValueError:
        return match.group(0)
    return "<ip>"


def redact(text: str) -> str:
    text = _URL_QUERY_RE.sub(r"\1?<redacted>", text)
    text = _IPV4_RE.sub(_mask_ip, text)
    return _IPV6_RE.sub(_mask_ip, text)


class _RedactFilter(logging.Filter):

    def filter(self, record: logging.LogRecord) -> bool:
        if record.levelno < logging.INFO:
            return True
        try:
            msg = record.getMessage()
            red = redact(msg)
            if red != msg:
                record.msg, record.args = red, None
            if record.exc_info and not record.exc_text:
                record.exc_text = logging.Formatter().formatException(record.exc_info)
            if record.exc_text:
                record.exc_text = redact(record.exc_text)
        except Exception:  # pylint: disable=broad-except
            # Logging must never fail because of the redaction.
            pass
        return True


class SXNGPlugin(Plugin):
    """Masks search queries (URL query strings) and IP addresses in logs."""

    id = "loogi_log_redactor"

    def __init__(self, plg_cfg: "PluginCfg") -> None:
        super().__init__(plg_cfg)
        self.info = PluginInfo(
            id=self.id,
            name=gettext("Log redactor"),
            description=gettext("Masks search queries and IP addresses in server logs."),
            preference_section=None,
        )

    def init(self, app: "flask.Flask") -> bool:
        for handler in logging.getLogger().handlers:
            if not any(isinstance(f, _RedactFilter) for f in handler.filters):
                handler.addFilter(_RedactFilter())
        return True
