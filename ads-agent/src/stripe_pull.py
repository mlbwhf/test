"""Website (Stripe) payments = ground-truth registrations from the on-site checkout.

Reads succeeded charges (every Stripe integration - Checkout, Payment Links, form
plugins - produces one), skips fully refunded ones, nets partial refunds.
Use a RESTRICTED key with read-only access to Charges (Stripe Dashboard >
Developers > API keys > Create restricted key). Nothing is ever written to Stripe.

Course name comes from charge metadata (course / course_name / product / item)
or, failing that, the charge description. No customer personal data is kept.

Usage:
  python src/stripe_pull.py --days 7
  python src/stripe_pull.py --selftest     # offline, no network
"""
from __future__ import annotations

import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
from config import local_date  # noqa: E402
from eventbrite_pull import course_family  # noqa: E402

API = "https://api.stripe.com/v1/charges"
COURSE_KEYS = ("course", "course_name", "product", "item", "class")


def _course_name(ch: dict) -> str:
    md = ch.get("metadata") or {}
    for k in COURSE_KEYS:
        if md.get(k):
            return str(md[k])
    return ch.get("description") or ""


def parse_charge(ch: dict) -> dict | None:
    if ch.get("status") != "succeeded" or not ch.get("paid", True):
        return None
    amount = int(ch.get("amount") or 0)
    refunded = int(ch.get("amount_refunded") or 0)
    if ch.get("refunded") or refunded >= amount > 0:
        return None
    name = _course_name(ch)
    md = ch.get("metadata") or {}
    try:
        seats = max(1, int(md.get("quantity") or md.get("seats") or 1))
    except (TypeError, ValueError):
        seats = 1
    return {
        "order_id": ch["id"],
        "date": local_date(ch["created"]),
        "course_name": name,
        "seats": seats,
        "gross": round((amount - refunded) / 100, 2),
        "currency": (ch.get("currency") or "").upper(),
        "course_family": course_family(name),
        "source": "website_stripe",
    }


def pull_charges(days_back: int = 7) -> list:
    import requests

    key = os.environ["STRIPE_API_KEY"]
    since = int(time.time()) - days_back * 86400
    out, after = [], None
    while True:
        params = {"limit": 100, "created[gte]": since}
        if after:
            params["starting_after"] = after
        r = requests.get(API, params=params, auth=(key, ""), timeout=30)
        r.raise_for_status()
        d = r.json()
        for ch in d.get("data", []):
            row = parse_charge(ch)
            if row:
                out.append(row)
        if not d.get("has_more") or not d.get("data"):
            break
        after = d["data"][-1]["id"]
    return out


def _selftest() -> int:
    t = 1763740800  # 2025-11-21 16:00 UTC
    charges = [
        {"id": "ch_1", "status": "succeeded", "paid": True, "amount": 186575, "amount_refunded": 0,
         "currency": "usd", "created": t, "metadata": {"course": "AI-Native Value Architect"},
         "billing_details": {"name": "Jordan Example", "email": "j@example.com"}},
        {"id": "ch_2", "status": "succeeded", "paid": True, "amount": 237575, "amount_refunded": 0,
         "currency": "usd", "created": t, "description": "SAFe RTE - Dec cohort", "metadata": {"seats": "2"}},
        {"id": "ch_3", "status": "succeeded", "paid": True, "amount": 99700, "amount_refunded": 99700,
         "refunded": True, "currency": "usd", "created": t, "metadata": {"course": "SAFe Business Owner"}},
        {"id": "ch_4", "status": "failed", "paid": False, "amount": 99700, "currency": "usd", "created": t},
    ]
    rows = [r for r in map(parse_charge, charges) if r]
    assert [r["order_id"] for r in rows] == ["ch_1", "ch_2"], rows
    assert rows[0]["course_family"] == "AI_NATIVE" and rows[0]["gross"] == 1865.75
    assert rows[1]["course_family"] == "RTE" and rows[1]["seats"] == 2
    assert "Example" not in json.dumps(rows) and "@" not in json.dumps(rows), "no personal data"
    print(json.dumps({"stripe_pull selftest": "PASS", "parsed": rows}, indent=2))
    return 0


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--selftest" in args:
        sys.exit(_selftest())
    days = int(args[args.index("--days") + 1]) if "--days" in args else 7
    rows = pull_charges(days)
    print(json.dumps({"pulled": len(rows), "days_back": days, "payments": rows}, indent=2))
