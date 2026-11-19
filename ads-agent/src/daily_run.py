"""Daily pipeline (run ~06:15 ET, after the Google Ads Script logs yesterday's spend).

  1. Ground truth: website (Stripe) payments + Eventbrite orders, last 3 days.
  2. Google Ads spend from the Sheet the Ads Script writes.
  3. Store new rows in Airtable (de-duplicated, safe to re-run).
  4. Tripwires on yesterday's complete spend + promotion end-date reminders.
  5. Email only when something needs attention. Always write logs/daily_<date>.json.

PHASE 1: reads ad data, never writes to Google or Microsoft Ads.

  python src/daily_run.py                  # live
  python src/daily_run.py --dry-run        # live reads, no Airtable writes, no email
  python src/daily_run.py --fixtures DIR   # offline test (implies --dry-run)
"""
from __future__ import annotations

import datetime
import json
import os
import sys
import traceback
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))
import config  # noqa: E402
import notify  # noqa: E402
import spend_sheet  # noqa: E402
from eventbrite_pull import _parse_order, pull_orders  # noqa: E402
from rules_engine import check_tripwires  # noqa: E402
from stripe_pull import parse_charge, pull_charges  # noqa: E402

LOOKBACK_DAYS = 3


def _fixture_regs(d: Path) -> tuple[list, list]:
    names = json.loads((d / "eventbrite_events.json").read_text())
    eb = [r for r in (_parse_order(o, names) for o in json.loads((d / "eventbrite_orders.json").read_text())) if r]
    for r in eb:
        r["source"] = "eventbrite_api"
    st = [r for r in map(parse_charge, json.loads((d / "stripe_charges.json").read_text())) if r]
    return eb, st


def promo_reminders(rules: dict, today: datetime.date) -> list:
    out = []
    for p in rules.get("confirmed_promotions") or []:
        end = datetime.date.fromisoformat(str(p["end"]))
        if today == end:
            out.append(f"PROMO ENDS TODAY: {p['id']} ({p['offer']}). Tomorrow, remove its promotion "
                       "assets, sitelink, callout and offer headlines in Google AND Microsoft Ads.")
        elif end < today <= end + datetime.timedelta(days=3):
            out.append(f"PROMO ENDED {end}: {p['id']}. If any '{p['percent_off']}% off' / promotion "
                       "assets are still live in Google or Microsoft Ads, remove them now - the offer "
                       "no longer exists on the site.")
    return out


def run(dry_run: bool = False, fixtures: Path | None = None) -> dict:
    rules = config.load_rules()
    today = config.today()
    yday = today - datetime.timedelta(days=1)
    errors, regs, snaps = [], [], []

    if fixtures:
        eb, st = _fixture_regs(fixtures)
        regs = eb + st
        snaps = spend_sheet.parse_csv((fixtures / "spend.csv").read_text())
    else:
        for label, fn in (("Eventbrite", lambda: pull_orders(LOOKBACK_DAYS)),
                          ("Stripe (website)", lambda: pull_charges(LOOKBACK_DAYS))):
            if label.startswith("Stripe") and not os.environ.get("STRIPE_API_KEY"):
                errors.append("Stripe (website) not configured: set STRIPE_API_KEY (read-only restricted key)")
                continue
            try:
                rows = fn()
                for r in rows:
                    r.setdefault("source", "eventbrite_api")
                regs += rows
            except Exception as e:  # keep going: one source failing must not hide the others
                errors.append(f"{label} pull failed: {e}")
        try:
            snaps = spend_sheet.load_snapshots()
        except Exception as e:
            errors.append(f"Google Ads spend sheet read failed: {e}")

    stored = {"registrations": 0, "spend_rows": 0}
    if not dry_run and not fixtures:
        try:
            from airtable_client import (REG_TABLE, SPEND_TABLE, Airtable, new_registrations,
                                         new_spend, registration_fields, spend_fields)
            at = Airtable()
            since = (today - datetime.timedelta(days=LOOKBACK_DAYS + 1)).isoformat()
            fresh = new_registrations(at, regs, since)
            stored["registrations"] = at.create(REG_TABLE, [registration_fields(r) for r in fresh])
            fresh_spend = new_spend(at, [s for s in snaps if s["campaign"] != spend_sheet.TOTAL_ROW],
                                    yday.isoformat())
            stored["spend_rows"] = at.create(SPEND_TABLE, [spend_fields(s) for s in fresh_spend])
        except Exception as e:
            errors.append(f"Airtable write failed: {e}")

    alerts = check_tripwires(rules, snaps, as_of=yday) if snaps else \
        [f"NO SPEND DATA - set GOOGLE_ADS_SPEND_CSV_URL and confirm the Google Ads Script ran for {yday}"]
    alerts += promo_reminders(rules, today)

    by_src = {}
    for r in regs:
        if r["date"] == yday.isoformat():
            by_src[r["source"]] = by_src.get(r["source"], 0) + int(r.get("seats", 1))
    result = {"date": today.isoformat(), "as_of": yday.isoformat(), "alerts": alerts, "errors": errors,
              "registrations_yesterday": by_src, "registrations_pulled": len(regs),
              "spend_rows": len(snaps), "stored": stored, "dry_run": bool(dry_run or fixtures)}

    logs = config.ROOT / "logs"
    logs.mkdir(exist_ok=True)
    (logs / f"daily_{today.isoformat()}.json").write_text(json.dumps(result, indent=2))

    if alerts or errors:
        lines = [f"Ads agent - daily check for {yday} (Phase 1: alerts only, nothing was changed)", ""]
        lines += [f"ALERT: {a}" for a in alerts] + [f"PIPELINE: {e}" for e in errors]
        regs_line = ", ".join(f"{k}: {v}" for k, v in by_src.items()) or "none recorded"
        lines += ["", f"Paid registrations yesterday - {regs_line}"]
        notify.send(f"[Ads Agent] {len(alerts) + len(errors)} item(s) to check - {yday}",
                    "\n".join(lines), dry_run=bool(dry_run or fixtures))
    return result


if __name__ == "__main__":
    args = sys.argv[1:]
    config.load_env()
    fx = Path(args[args.index("--fixtures") + 1]) if "--fixtures" in args else None
    try:
        out = run(dry_run="--dry-run" in args, fixtures=fx)
        print(json.dumps(out, indent=2))
    except Exception:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        if "--dry-run" not in args and not fx:
            notify.send("[Ads Agent] DAILY RUN CRASHED", tb)
        sys.exit(1)
