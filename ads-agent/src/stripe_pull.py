"""Stripe payments, classified by WHERE they were generated (owner rule 2026-11-19).

Only payments made through the website's own checkout count as ad conversions
("website_stripe"). Everything else that lands in the same Stripe account is kept
as internal data only:
  - "corsizio"          - made through Corsizio (Stripe Connect application id, if configured)
  - "stripe_other"      - another platform, an invoice, or a checkout returning elsewhere
  - "stripe_unverified" - no website marker and no checkout session to prove origin;
                          never counted as website, and the daily run alerts on it

A payment is "website_stripe" when EITHER
  1. metadata[origin] == "agile-agilist.com" (the website checkout sets this - see
     proposals/2026-11_website-conversion-tracking.md section 2.2), OR
  2. its Stripe Checkout Session returns to https://agile-agilist.com/ (success_url).
Key/value and URL prefix come from config/rules.yaml -> owner_directives.conversion_tracking.

Use a RESTRICTED key, read-only on Charges + Checkout Sessions. Nothing is written to
Stripe, and no customer personal data is kept.

  python src/stripe_pull.py --days 7
  python src/stripe_pull.py --selftest     # offline, no network
"""
from __future__ import annotations

import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
from config import load_rules, local_date  # noqa: E402
from eventbrite_pull import course_family  # noqa: E402

API = "https://api.stripe.com/v1"
COURSE_KEYS = ("course", "course_name", "product", "item", "class")


def _course_name(ch: dict) -> str:
    md = ch.get("metadata") or {}
    for k in COURSE_KEYS:
        if md.get(k):
            return str(md[k])
    return ch.get("description") or ""


def _tracking_rules(rules: dict) -> dict:
    return (rules or {}).get("owner_directives", {}).get("conversion_tracking", {})


def classify(ch: dict, rules: dict, session_url=None) -> tuple[str, str]:
    """Return (source, reason). session_url(payment_intent_id) -> success_url or None."""
    ct = _tracking_rules(rules)
    marker = ct.get("website_stripe_marker") or {}
    md = ch.get("metadata") or {}
    if marker and str(md.get(marker.get("metadata_key"), "")).lower() == str(marker.get("metadata_value")).lower():
        return "website_stripe", "website checkout marker"

    app = ch.get("application")
    if isinstance(app, dict):
        app = app.get("id")
    if app:  # paid through a third-party platform connected to this Stripe account
        if app == os.environ.get("CORSIZIO_STRIPE_APPLICATION"):
            return "corsizio", "Corsizio (Stripe Connect)"
        return "stripe_other", f"third-party platform {app}"
    if ch.get("invoice"):
        return "stripe_other", "Stripe invoice"

    prefix = ct.get("website_success_url_prefix")
    if session_url and ch.get("payment_intent") and prefix:
        url = session_url(ch["payment_intent"])
        if url:
            if url.startswith(prefix):
                return "website_stripe", "checkout returns to the website"
            return "stripe_other", "checkout returns to another site"
    return "stripe_unverified", "no website marker or checkout session - origin unknown"


def parse_charge(ch: dict, rules: dict | None = None, session_url=None) -> dict | None:
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
    source, reason = classify(ch, rules if rules is not None else load_rules(), session_url)
    return {
        "order_id": ch["id"],
        "date": local_date(ch["created"]),
        "course_name": name,
        "seats": seats,
        "gross": round((amount - refunded) / 100, 2),
        "currency": (ch.get("currency") or "").upper(),
        "course_family": course_family(name),
        "source": source,
        "source_reason": reason,
    }


def pull_charges(days_back: int = 7, rules: dict | None = None) -> list:
    import requests

    rules = rules if rules is not None else load_rules()
    s = requests.Session()
    s.auth = (os.environ["STRIPE_API_KEY"], "")
    cache = {}

    def session_url(pi: str):
        if pi not in cache:
            r = s.get(f"{API}/checkout/sessions", params={"payment_intent": pi, "limit": 1}, timeout=30)
            if r.status_code == 403:  # key lacks Checkout Sessions read; rely on the marker only
                cache[pi] = None
            else:
                r.raise_for_status()
                data = r.json().get("data") or []
                cache[pi] = data[0].get("success_url") if data else None
        return cache[pi]

    since = int(time.time()) - days_back * 86400
    out, after = [], None
    while True:
        params = {"limit": 100, "created[gte]": since}
        if after:
            params["starting_after"] = after
        r = s.get(f"{API}/charges", params=params, timeout=30)
        r.raise_for_status()
        d = r.json()
        for ch in d.get("data", []):
            row = parse_charge(ch, rules, session_url)
            if row:
                out.append(row)
        if not d.get("has_more") or not d.get("data"):
            break
        after = d["data"][-1]["id"]
    return out


def _selftest() -> int:
    rules = load_rules()
    os.environ["CORSIZIO_STRIPE_APPLICATION"] = "ca_corsizio"
    t = 1763740800
    charges = [
        {"id": "ch_web", "status": "succeeded", "paid": True, "amount": 186575, "currency": "usd",
         "created": t, "metadata": {"origin": "agile-agilist.com", "course": "AI-Native Value Architect"},
         "billing_details": {"name": "Jordan Example", "email": "j@example.com"}},
        {"id": "ch_web2", "status": "succeeded", "paid": True, "amount": 237575, "currency": "usd",
         "created": t, "payment_intent": "pi_site", "description": "SAFe RTE - Dec cohort",
         "metadata": {"seats": "2"}},
        {"id": "ch_cors", "status": "succeeded", "paid": True, "amount": 169900, "currency": "usd",
         "created": t, "application": "ca_corsizio", "metadata": {"course": "AI-Native Foundations"}},
        {"id": "ch_inv", "status": "succeeded", "paid": True, "amount": 500000, "currency": "usd",
         "created": t, "invoice": "in_1", "description": "Private team cohort"},
        {"id": "ch_link", "status": "succeeded", "paid": True, "amount": 99700, "currency": "usd",
         "created": t, "payment_intent": "pi_elsewhere", "description": "SAFe Business Owner"},
        {"id": "ch_unk", "status": "succeeded", "paid": True, "amount": 99700, "currency": "usd",
         "created": t, "description": "SAFe Business Owner"},
        {"id": "ch_ref", "status": "succeeded", "paid": True, "amount": 99700, "amount_refunded": 99700,
         "refunded": True, "currency": "usd", "created": t, "metadata": {"origin": "agile-agilist.com"}},
        {"id": "ch_fail", "status": "failed", "paid": False, "amount": 99700, "currency": "usd", "created": t},
    ]
    urls = {"pi_site": "https://agile-agilist.com/registration-confirmed/?session_id=cs_1",
            "pi_elsewhere": "https://buy.example.com/thanks"}
    rows = {r["order_id"]: r for r in (parse_charge(c, rules, urls.get) for c in charges) if r}
    want = {"ch_web": "website_stripe", "ch_web2": "website_stripe", "ch_cors": "corsizio",
            "ch_inv": "stripe_other", "ch_link": "stripe_other", "ch_unk": "stripe_unverified"}
    got = {k: v["source"] for k, v in rows.items()}
    assert got == want, f"classification wrong:\n got  {got}\n want {want}"
    assert rows["ch_web"]["course_family"] == "AI_NATIVE" and rows["ch_web"]["gross"] == 1865.75
    assert rows["ch_web2"]["seats"] == 2
    assert "Example" not in json.dumps(rows) and "@" not in json.dumps(rows), "no personal data"
    print(json.dumps({"stripe_pull selftest": "PASS", "classified": got}, indent=2))
    return 0


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--selftest" in args:
        sys.exit(_selftest())
    days = int(args[args.index("--days") + 1]) if "--days" in args else 7
    rows = pull_charges(days)
    print(json.dumps({"pulled": len(rows), "days_back": days, "payments": rows}, indent=2))
