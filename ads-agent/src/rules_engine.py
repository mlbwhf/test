"""Tripwire checks. Run daily after snapshots land. Alerts, never acts.

Snapshot rows: {campaign, platform, date (YYYY-MM-DD), spend_cad, cpc,
                status, bid_strategy, is_brand}
Spend is logged for COMPLETE days (the Google Ads Script writes yesterday), so
checks run against `as_of` = yesterday by default, comparing with the day before
for change-detection tripwires.
"""
from __future__ import annotations
import datetime
import json
import sys
from collections import defaultdict

import yaml

SMART_BIDDING = {"MaximizeConversions", "MAXIMIZE_CONVERSIONS", "TargetCPA", "TARGET_CPA",
                 "MaximizeConversionValue", "MAXIMIZE_CONVERSION_VALUE", "TargetROAS", "TARGET_ROAS"}
TOTAL_ROW = "__ACCOUNT_TOTAL__"


def load_rules(path="config/rules.yaml"):
    with open(path) as f:
        return yaml.safe_load(f)


def _target(rules: dict, day: datetime.date) -> float:
    cal = rules["seasonal_calendar_cad_per_day"]
    m = day.strftime("%m")
    entry = cal.get(m) or cal.get(int(m))          # YAML may parse '08' keys as ints
    return float(entry["total"])


def _by_day(snapshots: list) -> dict:
    days = defaultdict(list)
    for s in snapshots:
        if s.get("campaign") != TOTAL_ROW:
            days[s["date"]].append(s)
    return days


def check_tripwires(rules: dict, snapshots: list, as_of: datetime.date | None = None,
                    verified_regs_30d: int | None = None) -> list:
    as_of = as_of or (datetime.date.today() - datetime.timedelta(days=1))
    tw = rules["tripwires"]
    cap = tw["campaign_over_seasonal_target_pct"] / 100
    days = _by_day(snapshots)
    today = days.get(as_of.isoformat(), [])
    prev = {(s["platform"], s["campaign"]): s
            for s in days.get((as_of - datetime.timedelta(days=1)).isoformat(), [])}
    alerts = []
    if not today:
        return [f"NO SPEND DATA for {as_of} - check the Google Ads Script / Sheet feed"]

    target = _target(rules, as_of)
    total = sum(float(s.get("spend_cad") or 0) for s in today)
    if total > target * cap:
        alerts.append(f"ACCOUNT SPEND {total:.2f} CAD on {as_of} exceeds {cap*100:.0f}% "
                      f"of seasonal target {target:.0f}/day")

    n = int(tw.get("account_over_plan_consecutive_days", 2))
    over = 0
    for i in range(n):
        d = as_of - datetime.timedelta(days=i)
        rows = days.get(d.isoformat(), [])
        if rows and sum(float(s.get("spend_cad") or 0) for s in rows) > _target(rules, d):
            over += 1
    if over == n:
        alerts.append(f"ACCOUNT OVER PLAN {n} consecutive days (through {as_of})")

    smart = []
    for s in today:
        key = (s["platform"], s["campaign"])
        name = f"{s['platform']}/{s['campaign']}"
        cpc = float(s.get("cpc") or 0)
        if s.get("is_brand") and cpc > tw["brand_campaign_max_cpc_cad"]:
            alerts.append(f"BRAND LEAKAGE: {name} CPC {cpc:.2f} > "
                          f"{tw['brand_campaign_max_cpc_cad']:.2f} - check negatives")
        before = prev.get(key)
        if before and tw.get("alert_on_status_change"):
            if str(before.get("status", "")).upper() == "PAUSED" and str(s.get("status", "")).upper() == "ENABLED":
                alerts.append(f"PAUSED CAMPAIGN RE-ENABLED: {name} - confirm this was you "
                              "(re-enabling always needs owner approval)")
        if before and tw.get("alert_on_bid_strategy_change"):
            if before.get("bid_strategy") and s.get("bid_strategy") and before["bid_strategy"] != s["bid_strategy"]:
                alerts.append(f"BID STRATEGY CHANGED: {name} {before['bid_strategy']} -> "
                              f"{s['bid_strategy']} - confirm this was you")
        if s.get("bid_strategy") in SMART_BIDDING:
            smart.append(s["campaign"])
    if smart and (verified_regs_30d is None or verified_regs_30d < 15):
        have = "unknown" if verified_regs_30d is None else str(verified_regs_30d)
        alerts.append(f"SMART BIDDING without >=15 verified registrations/30d (have {have}): "
                      + ", ".join(sorted(set(smart))))
    return alerts


if __name__ == "__main__":
    rules = load_rules(sys.argv[1] if len(sys.argv) > 1 else "config/rules.yaml")
    snaps = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else []
    as_of = datetime.date.fromisoformat(sys.argv[3]) if len(sys.argv) > 3 else None
    for a in check_tripwires(rules, snaps, as_of=as_of):
        print("ALERT:", a)
