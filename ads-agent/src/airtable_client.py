"""Minimal Airtable REST client for the agent's own store (the "Ads Agent" base).

The agent writes only here - never to ad platforms (Phase 1). Inserts are
de-duplicated so re-running a day is safe.
Env: AIRTABLE_TOKEN (PAT: data.records:read + data.records:write on the base),
     AIRTABLE_BASE_ID (default appCXSWnIISm0c6iF).
"""
from __future__ import annotations

import os
import time
import urllib.parse

API = "https://api.airtable.com/v0"
REG_TABLE = "Registration Baseline"
SPEND_TABLE = "Ad Daily Snapshots"


class Airtable:
    def __init__(self, token: str | None = None, base_id: str | None = None):
        import requests
        self.s = requests.Session()
        self.s.headers.update({"Authorization": f"Bearer {token or os.environ['AIRTABLE_TOKEN']}",
                               "Content-Type": "application/json"})
        self.base = base_id or os.environ.get("AIRTABLE_BASE_ID", "appCXSWnIISm0c6iF")

    def _url(self, table: str) -> str:
        return f"{API}/{self.base}/{urllib.parse.quote(table)}"

    def select(self, table: str, formula: str | None = None, fields: list | None = None) -> list:
        out, offset = [], None
        while True:
            params = [("pageSize", "100")]
            if formula:
                params.append(("filterByFormula", formula))
            for f in fields or []:
                params.append(("fields[]", f))
            if offset:
                params.append(("offset", offset))
            r = self.s.get(self._url(table), params=params, timeout=30)
            r.raise_for_status()
            d = r.json()
            out += [rec["fields"] for rec in d.get("records", [])]
            offset = d.get("offset")
            if not offset:
                return out
            time.sleep(0.21)  # Airtable: 5 requests/second per base

    def create(self, table: str, rows: list) -> int:
        for i in range(0, len(rows), 10):  # Airtable: 10 records per request
            r = self.s.post(self._url(table), timeout=30,
                            json={"records": [{"fields": f} for f in rows[i:i + 10]], "typecast": True})
            r.raise_for_status()
            time.sleep(0.21)
        return len(rows)


def registration_fields(row: dict) -> dict:
    src = row.get("source", "eventbrite_api")
    f = {"Course Name": row.get("course_name") or "(unknown course)", "Date": row["date"],
         "Course Family": row["course_family"], "Seats": row.get("seats", 1),
         "Currency": row.get("currency") or "", "Event ID": row["order_id"], "Source": src,
         "Channel": "Website" if src == "website_stripe" else "Eventbrite"}
    if row.get("gross") not in (None, ""):
        f["Revenue"] = float(row["gross"])
    return f


def spend_fields(s: dict) -> dict:
    f = {"Campaign": s["campaign"], "Date": s["date"], "Platform": s["platform"],
         "Spend CAD": s["spend_cad"], "Clicks": s.get("clicks", 0),
         "Impressions": s.get("impressions", 0), "CTR": round(s.get("ctr_pct", 0) / 100, 4),
         "Avg CPC": s.get("cpc", 0), "Is Brand": bool(s.get("is_brand"))}
    if s.get("status"):
        f["Status"] = s["status"]
    if s.get("bid_strategy"):
        f["Bid Strategy"] = s["bid_strategy"]
    return f


def new_registrations(at: Airtable, rows: list, since: str) -> list:
    """Rows whose order id isn't already stored (checked over the window)."""
    have = {r.get("Event ID") for r in at.select(
        REG_TABLE, f"IS_AFTER({{Date}}, DATEADD('{since}', -1, 'days'))", ["Event ID"])}
    seen, out = set(), []
    for row in rows:
        oid = row.get("order_id")
        if oid and oid not in have and oid not in seen:
            seen.add(oid)
            out.append(row)
    return out


def new_spend(at: Airtable, snaps: list, day: str) -> list:
    have = {(r.get("Platform"), r.get("Campaign")) for r in at.select(
        SPEND_TABLE, f"IS_SAME({{Date}}, '{day}', 'day')", ["Platform", "Campaign"])}
    return [s for s in snaps if s["date"] == day and (s["platform"], s["campaign"]) not in have]
