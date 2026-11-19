"""Offline end-to-end test - no network, no Airtable writes, no email.

    python tests/test_offline.py

Builds fixtures relative to today, runs the daily + weekly pipelines in fixture
mode, and checks that the tripwires and guardrails fire for the right reasons.
"""
import datetime
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
os.environ.pop("SMTP_HOST", None)  # never email from a test
os.environ["CORSIZIO_STRIPE_APPLICATION"] = "ca_corsizio"

import config  # noqa: E402
import daily_run  # noqa: E402
import weekly_run  # noqa: E402
from rules_engine import check_tripwires  # noqa: E402


def build_fixtures(d: Path) -> None:
    today = config.today()
    y, yy = today - datetime.timedelta(days=1), today - datetime.timedelta(days=2)
    ts = int(datetime.datetime.combine(y, datetime.time(15), config.TZ).timestamp())
    (d / "eventbrite_events.json").write_text(json.dumps({"e1": "Advanced SAFe Practice Consultant"}))
    (d / "eventbrite_orders.json").write_text(json.dumps([
        {"id": "eb1", "status": "placed", "created": f"{y}T15:00:00Z", "event_id": "e1",
         "name": "Buyer Person", "costs": {"gross": {"major_value": "2795.00", "currency": "USD"}}}]))
    base = {"status": "succeeded", "paid": True, "amount_refunded": 0, "currency": "usd", "created": ts}
    (d / "stripe_charges.json").write_text(json.dumps([
        # website checkout payment (carries the website marker) -> the only ad-countable one
        {**base, "id": "ch_web", "amount": 144415,
         "metadata": {"origin": "agile-agilist.com", "course": "AI-Native Foundations"}},
        # Corsizio payment landing in the same Stripe account -> internal data only
        {**base, "id": "ch_cors", "amount": 169900, "application": "ca_corsizio",
         "metadata": {"course": "AI-Native Foundations"}},
        # no marker, no checkout session -> origin unknown, alerted, never counted as website
        {**base, "id": "ch_unk", "amount": 99700, "description": "SAFe Business Owner"},
    ]))
    hdr = ("date,campaign,cost,clicks,impressions,ctr,avgCpc,currency,loggedAt,status,biddingStrategy,"
           "primaryConversions,websitePurchases,nonWebsitePrimaryConversions\n")
    rows = [
        # day before: one campaign paused, Certifications on Maximize Clicks
        f"{yy},Certifications - English,20,10,300,3.33,2.00,CAD,{yy} 05:30,ENABLED,TARGET_SPEND,0,0,0",
        f"{yy},Performance Max-2,0,0,0,0,0,CAD,{yy} 05:30,PAUSED,MAXIMIZE_CONVERSIONS,0,0,0",
        f"{yy},AgileAgilist Defense - English,3,4,40,10,0.75,CAD,{yy} 05:30,ENABLED,TARGET_SPEND,0,0,0",
        # yesterday: re-enabled, bid strategy switched, brand CPC leak, overspend, Eventbrite
        # clicks still primary (2), and Google claims 3 website purchases vs 1 real one
        f"{y},Certifications - English,45,15,400,3.75,3.00,CAD,{y} 05:30,ENABLED,MAXIMIZE_CONVERSIONS,4,2,2",
        f"{y},Performance Max-2,18,6,900,0.67,3.00,CAD,{y} 05:30,ENABLED,MAXIMIZE_CONVERSIONS,1,1,0",
        f"{y},AgileAgilist Defense - English,9,3,30,10,3.00,CAD,{y} 05:30,ENABLED,TARGET_SPEND,0,0,0",
        f"{y},__ACCOUNT_TOTAL__,72,24,1330,1.8,3.00,CAD,{y} 05:30,,,5,3,2",
    ]
    (d / "spend.csv").write_text(hdr + "\n".join(rows) + "\n")


def main() -> int:
    failures = []
    for script in ("src/asset_generator.py", "src/eventbrite_pull.py --selftest", "src/stripe_pull.py --selftest"):
        r = subprocess.run([sys.executable, *script.split()], cwd=ROOT, capture_output=True, text=True)
        if r.returncode != 0:
            failures.append(f"{script}: {r.stdout}{r.stderr}")

    with tempfile.TemporaryDirectory() as tmp:
        d = Path(tmp)
        build_fixtures(d)
        out = daily_run.run(fixtures=d)
        text = " | ".join(out["alerts"])
        for needle in ("ACCOUNT SPEND", "PAUSED CAMPAIGN RE-ENABLED", "BID STRATEGY CHANGED",
                       "BRAND LEAKAGE", "SMART BIDDING", "NON-WEBSITE CONVERSIONS COUNTED AS PRIMARY",
                       "WEBSITE PURCHASES OVER-COUNTED", "UNKNOWN ORIGIN"):
            if needle not in text:
                failures.append(f"daily: expected alert {needle!r}; got {out['alerts']}")
        want = {"eventbrite_api": 1, "website_stripe": 1, "corsizio": 1, "stripe_unverified": 1}
        if out["registrations_yesterday"] != want:
            failures.append(f"daily: registrations by source wrong: {out['registrations_yesterday']}")
        if "Buyer Person" in json.dumps(out):
            failures.append("daily: buyer name leaked into output")
        w = weekly_run.run(fixtures=d)
        if w["regs"]["last_14d"]["by_source"].get("website_stripe") != 1:
            failures.append(f"weekly: website count wrong: {w['regs']['last_14d']['by_source']}")

    rules = config.load_rules()
    # promo reminders fire on the end date and just after, not before
    r = daily_run.promo_reminders
    if not r(rules, datetime.date(2026, 11, 30)) or not r(rules, datetime.date(2026, 12, 1)):
        failures.append("promo reminders missing on/after 2026-11-30")
    if r(rules, datetime.date(2026, 11, 25)):
        failures.append("promo reminder fired mid-promotion")
    # no data -> one clear alert, not silence
    if "NO SPEND DATA" not in " ".join(check_tripwires(rules, [], as_of=datetime.date(2026, 11, 18))):
        failures.append("missing-data alert not raised")

    print("\n".join(failures) if failures else "offline end-to-end: ALL PASS")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
