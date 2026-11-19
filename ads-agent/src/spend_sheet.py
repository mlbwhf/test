"""Google Ads daily spend, as logged by scripts/google_ads_daily_spend.gs.

Reads the Sheet's "GoogleAdsSpend" tab as CSV. Set GOOGLE_ADS_SPEND_CSV_URL to the
tab's CSV export link (Sheet > File > Share > Publish to web > GoogleAdsSpend > CSV),
or GOOGLE_ADS_SPEND_CSV_FILE to a local file. Read-only.
"""
from __future__ import annotations

import csv
import io
import os

TOTAL_ROW = "__ACCOUNT_TOTAL__"
BID_MAP = {  # Google Ads Script strategy type -> Airtable option name
    "MAXIMIZE_CONVERSIONS": "MaximizeConversions", "TARGET_CPA": "TargetCPA",
    "TARGET_SPEND": "MaximizeClicks", "MAXIMIZE_CLICKS": "MaximizeClicks",
    "MANUAL_CPC": "ManualCPC", "ENHANCED_CPC": "ManualCPC",
}


def _num(v) -> float:
    try:
        return float(str(v).replace(",", "").replace("$", "").strip() or 0)
    except ValueError:
        return 0.0


def _is_brand(campaign: str) -> bool:
    pats = os.environ.get("BRAND_CAMPAIGN_PATTERNS", "defense,brand").lower().split(",")
    return any(p.strip() and p.strip() in campaign.lower() for p in pats)


def parse_csv(text: str) -> list:
    """Return snapshot rows, de-duplicated to the latest log entry per (date, campaign)."""
    latest = {}
    for r in csv.DictReader(io.StringIO(text)):
        date, camp = (r.get("date") or "").strip(), (r.get("campaign") or "").strip()
        if not date or not camp:
            continue
        key = (date, camp)
        if key in latest and (r.get("loggedAt") or "") < (latest[key].get("loggedAt") or ""):
            continue
        latest[key] = r
    rows = []
    for (date, camp), r in sorted(latest.items()):
        raw_bid = (r.get("biddingStrategy") or "").strip().upper()
        rows.append({
            "platform": "google", "date": date, "campaign": camp,
            "spend_cad": _num(r.get("cost")), "clicks": int(_num(r.get("clicks"))),
            "impressions": int(_num(r.get("impressions"))),
            "ctr_pct": _num(r.get("ctr")), "cpc": _num(r.get("avgCpc")),
            "currency": (r.get("currency") or "").strip(),
            "status": (r.get("status") or "").strip().upper(),
            "bid_strategy": BID_MAP.get(raw_bid, "Other" if raw_bid else ""),
            "is_brand": camp != TOTAL_ROW and _is_brand(camp),
        })
    return rows


def load_snapshots() -> list:
    path = os.environ.get("GOOGLE_ADS_SPEND_CSV_FILE")
    if path:
        with open(path, newline="", encoding="utf-8-sig") as f:
            return parse_csv(f.read())
    url = os.environ.get("GOOGLE_ADS_SPEND_CSV_URL")
    if not url:
        return []
    import requests
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    return parse_csv(r.content.decode("utf-8-sig"))
