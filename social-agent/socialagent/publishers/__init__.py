"""Pluggable publishing channels.

Each publisher takes (account, text) and returns an external reference
string (post id / URL / filename). Selection is driven by the account's
`publisher` field in accounts.yaml.
"""

from __future__ import annotations

from ..config import Account
from . import buffer, linkedin, outbox, webhook

_PUBLISHERS = {
    "outbox": outbox.publish,
    "linkedin": linkedin.publish,
    "buffer": buffer.publish,
    "webhook": webhook.publish,
}


def publish(account: Account, text: str) -> tuple[str, str]:
    """Returns (channel, external_ref)."""
    name = account.publisher or "outbox"
    if name not in _PUBLISHERS:
        raise SystemExit(
            f"Account '{account.id}' has unknown publisher '{name}'. "
            f"Valid: {', '.join(_PUBLISHERS)}"
        )
    return name, _PUBLISHERS[name](account, text)
