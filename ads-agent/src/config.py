"""Shared config: .env loading, rules, business timezone. No third-party deps."""
from __future__ import annotations

import datetime
import os
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml

ROOT = Path(__file__).resolve().parent.parent
TZ = ZoneInfo(os.environ.get("BUSINESS_TZ", "America/Toronto"))


def load_env(path: Path | None = None) -> None:
    """Minimal .env loader (KEY=VALUE lines). Real environment variables win."""
    path = path or ROOT / ".env"
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def load_rules() -> dict:
    with open(ROOT / "config" / "rules.yaml") as f:
        return yaml.safe_load(f)


def rules_text() -> str:
    return (ROOT / "config" / "rules.yaml").read_text()


def today() -> datetime.date:
    return datetime.datetime.now(TZ).date()


def local_date(ts: int | float) -> str:
    """Unix timestamp -> business-timezone date string."""
    return datetime.datetime.fromtimestamp(ts, TZ).date().isoformat()


def active_promotions(rules: dict, on: datetime.date) -> list:
    out = []
    for p in rules.get("confirmed_promotions") or []:
        if datetime.date.fromisoformat(str(p["start"])) <= on <= datetime.date.fromisoformat(str(p["end"])):
            out.append(p)
    return out
