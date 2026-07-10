"""Dry-run publisher: writes the finished post to social-agent/outbox/.

Safe default — nothing leaves the machine. Copy-paste the file into the
platform, or switch the account to a real publisher when ready.
"""

from __future__ import annotations

from datetime import datetime, timezone

from ..config import OUTBOX_DIR, Account


def publish(account: Account, text: str) -> str:
    OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    path = OUTBOX_DIR / f"{account.id}-{stamp}.md"
    path.write_text(text + "\n")
    return str(path)
