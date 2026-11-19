"""Weekly Monday report (run Mon 08:00 ET).

Gathers 14 days of registrations (+ the same 14 days last year) and ad spend from
Airtable, aggregates them, asks the LLM for the analysis (max 3 actions, or "do
nothing"), and emails it. Recommendations only - nothing is changed anywhere.

  python src/weekly_run.py                    # live
  python src/weekly_run.py --dry-run          # build the prompt, don't call the LLM or email
  python src/weekly_run.py --fixtures DIR     # offline (implies --dry-run)
"""
from __future__ import annotations

import datetime
import json
import os
import sys
import traceback
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))
import config  # noqa: E402
import notify  # noqa: E402
import spend_sheet  # noqa: E402
import weekly_analysis  # noqa: E402


def summarize_regs(rows: list) -> dict:
    """rows: {date, course_family, seats, revenue, currency, source}"""
    out = {"seats": 0, "by_family": defaultdict(int), "by_source": defaultdict(int),
           "revenue_by_currency": defaultdict(float)}
    for r in rows:
        n = int(r.get("seats") or 1)
        out["seats"] += n
        out["by_family"][r.get("course_family") or "OTHER"] += n
        out["by_source"][r.get("source") or "unknown"] += n
        if r.get("revenue"):
            out["revenue_by_currency"][r.get("currency") or "?"] += float(r["revenue"])
    return {k: (dict(v) if isinstance(v, defaultdict) else v) for k, v in out.items()}


def summarize_spend(snaps: list, rules: dict) -> dict:
    by_day, by_camp = defaultdict(float), defaultdict(lambda: {"spend_cad": 0.0, "clicks": 0})
    for s in snaps:
        by_day[s["date"]] += s["spend_cad"]
        c = by_camp[f"{s['platform']}/{s['campaign']}"]
        c["spend_cad"] += s["spend_cad"]
        c["clicks"] += s.get("clicks", 0)
    from rules_engine import _target
    days = {d: {"spend_cad": round(v, 2), "seasonal_target": _target(rules, datetime.date.fromisoformat(d))}
            for d, v in sorted(by_day.items())}
    camps = {k: {"spend_cad": round(v["spend_cad"], 2), "clicks": v["clicks"]} for k, v in by_camp.items()}
    return {"by_day": days, "by_campaign": camps,
            "note": "Microsoft Ads not yet wired (needs MS_ADS_REFRESH_TOKEN); Google only."}


def _airtable_regs(at, start: datetime.date, end: datetime.date) -> list:
    from airtable_client import REG_TABLE
    f = (f"AND(IS_AFTER({{Date}}, DATEADD('{start}', -1, 'days')), "
         f"IS_BEFORE({{Date}}, DATEADD('{end}', 1, 'days')))")
    rows = at.select(REG_TABLE, f, ["Date", "Course Family", "Seats", "Revenue", "Currency", "Source"])
    return [{"date": r.get("Date"), "course_family": r.get("Course Family"), "seats": r.get("Seats"),
             "revenue": r.get("Revenue"), "currency": r.get("Currency"), "source": r.get("Source")}
            for r in rows]


def _airtable_spend(at, start: datetime.date) -> list:
    from airtable_client import SPEND_TABLE
    rows = at.select(SPEND_TABLE, f"IS_AFTER({{Date}}, DATEADD('{start}', -1, 'days'))",
                     ["Date", "Campaign", "Platform", "Spend CAD", "Clicks"])
    return [{"date": r.get("Date"), "campaign": r.get("Campaign"), "platform": r.get("Platform"),
             "spend_cad": float(r.get("Spend CAD") or 0), "clicks": int(r.get("Clicks") or 0)} for r in rows]


def run(dry_run: bool = False, fixtures: Path | None = None) -> dict:
    rules = config.load_rules()
    today = config.today()
    start, end = today - datetime.timedelta(days=14), today - datetime.timedelta(days=1)
    ly_start, ly_end = start - datetime.timedelta(days=364), end - datetime.timedelta(days=364)  # same weekdays

    if fixtures:
        from daily_run import _fixture_regs
        eb, st = _fixture_regs(fixtures)
        now = [{"date": r["date"], "course_family": r["course_family"], "seats": r.get("seats"),
                "revenue": r.get("gross"), "currency": r.get("currency"), "source": r["source"]}
               for r in eb + st]
        last_year = []
        snaps = [s for s in spend_sheet.parse_csv((fixtures / "spend.csv").read_text())
                 if s["campaign"] != spend_sheet.TOTAL_ROW]
    else:
        from airtable_client import Airtable
        at = Airtable()
        now = _airtable_regs(at, start, end)
        last_year = _airtable_regs(at, ly_start, ly_end)
        snaps = _airtable_spend(at, start)

    regs = {"window": f"{start}..{end}", "last_14d": summarize_regs(now),
            "same_14d_last_year": {"window": f"{ly_start}..{ly_end}", **summarize_regs(last_year)}}
    spend = summarize_spend(snaps, rules)
    promos = config.active_promotions(rules, today)
    prompt = weekly_analysis.build_prompt(spend, regs, config.rules_text(), promos)

    if dry_run or fixtures:
        print(f"[dry run] prompt built: {len(prompt)} chars; LLM not called, nothing emailed")
        return {"regs": regs, "spend": spend, "prompt_chars": len(prompt)}

    report = weekly_analysis.run(spend, regs, config.rules_text(), promos)
    notify.send(f"[Ads Agent] Weekly analysis - week ending {end}",
                report + "\n\n(Phase 1: recommendations only - every change is your call.)")
    logs = config.ROOT / "logs"
    logs.mkdir(exist_ok=True)
    (logs / f"weekly_{today}.md").write_text(report)
    return {"regs": regs, "spend": spend, "report_chars": len(report)}


if __name__ == "__main__":
    args = sys.argv[1:]
    config.load_env()
    fx = Path(args[args.index("--fixtures") + 1]) if "--fixtures" in args else None
    try:
        out = run(dry_run="--dry-run" in args, fixtures=fx)
        print(json.dumps({k: v for k, v in out.items() if k != "spend"}, indent=2, default=str))
    except Exception:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        if "--dry-run" not in args and not fx:
            notify.send("[Ads Agent] WEEKLY RUN CRASHED", tb)
        sys.exit(1)
