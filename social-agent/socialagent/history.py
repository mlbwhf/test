"""Per-account post ledger (JSONL). One file per account under history/."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from .config import HISTORY_DIR


def _ledger(account_id: str) -> Path:
    return HISTORY_DIR / f"{account_id}.jsonl"


def record_post(account_id: str, *, text: str, fingerprint: str,
                kind: str, template: str, channel: str, status: str,
                external_ref: str = "") -> dict:
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "account": account_id,
        "kind": kind,
        "template": template,
        "channel": channel,
        "status": status,          # posted | queued | outbox
        "external_ref": external_ref,
        "fingerprint": fingerprint,
        "text": text,
    }
    with _ledger(account_id).open("a") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def load_history(account_id: str | None = None) -> list[dict]:
    """All ledger entries; every account when account_id is None."""
    entries: list[dict] = []
    if not HISTORY_DIR.is_dir():
        return entries
    files = ([_ledger(account_id)] if account_id
             else sorted(HISTORY_DIR.glob("*.jsonl")))
    for path in files:
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            if line.strip():
                entries.append(json.loads(line))
    return entries
