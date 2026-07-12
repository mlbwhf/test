"""Tripwire checks. Run daily after snapshots land. Alerts, never acts."""
import yaml, datetime, json, sys

def load_rules(path="config/rules.yaml"):
    with open(path) as f: return yaml.safe_load(f)

def check_tripwires(rules: dict, snapshots: list) -> list:
    """snapshots: [{campaign, platform, date, spend_cad, cpc, status, bid_strategy, is_brand}]"""
    alerts = []
    month = datetime.date.today().strftime("%m")
    target = rules["seasonal_calendar_cad_per_day"][month]["total"]
    cap_pct = rules["tripwires"]["campaign_over_seasonal_target_pct"] / 100
    today = [s for s in snapshots if s["date"] == datetime.date.today().isoformat()]
    total = sum(s["spend_cad"] for s in today)
    if total > target * cap_pct:
        alerts.append(f"ACCOUNT SPEND {total:.2f} CAD exceeds {cap_pct*100:.0f}% of seasonal target {target}")
    for s in today:
        if s.get("is_brand") and s.get("cpc", 0) > rules["tripwires"]["brand_campaign_max_cpc_cad"]:
            alerts.append(f"BRAND LEAKAGE: {s['platform']}/{s['campaign']} CPC {s['cpc']:.2f} > 2.00 - check negatives")
        if s.get("bid_strategy") in ("MaximizeConversions", "TargetCPA"):
            alerts.append(f"SMART BIDDING on {s['platform']}/{s['campaign']} - verify >=15 verified registrations else flag")
    return alerts

if __name__ == "__main__":
    rules = load_rules(sys.argv[1] if len(sys.argv) > 1 else "config/rules.yaml")
    snaps = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else []
    for a in check_tripwires(rules, snaps): print("ALERT:", a)
