#!/usr/bin/env python3
"""A1 — Registration truth dashboard (registration-growth/PLAN.md).

Pulls every PAID Eventbrite registration for the organization and produces a
weekly report broken down by course, city, and ISO week, with a week-over-week
trend. First run gives the 12-week backfill baseline; run it every Monday.

Only paid registrations count (leads =/= conversions). Cancelled and refunded
attendees are excluded. The per-sequence `aff` tracking codes from the A2 email
sequences show up in the "Attribution" section so email-driven registrations
are visible without touching ad campaigns.

Usage:
    EVENTBRITE_PRIVATE_TOKEN=xxxx python3 a1_registration_report.py [--weeks 12]

Outputs (into registration-growth/reports/):
    registrations-<YYYY>-W<WW>.md    human report for the Monday rhythm
    registrations-<YYYY>-W<WW>.csv   raw weekly counts (week, course, city, n)

The token is the same private token used by the event-copy script — create or
find it at https://www.eventbrite.com/platform/api-keys. Nothing is written to
Eventbrite; every request is a GET.
"""

import argparse
import csv
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import date, datetime, timedelta

API = "https://www.eventbriteapi.com/v3"

# Order matters: longer/more specific certs first so "Advanced Scrum Master"
# doesn't land in SSM and "Advanced SPC" doesn't land in SPC.
COURSE_PATTERNS = [
    (r"advanced\s+safe\s+practice|aspc", "ASPC"),
    (r"implementing\s+safe|spc\b", "SPC"),
    (r"advanced\s+scrum\s+master|sasm", "SASM"),
    (r"scrum\s+master|ssm\b", "SSM"),
    (r"product\s+owner|product\s+manager\b|popm", "POPM"),
    (r"agile\s+product\s+management|apm\b", "APM"),
    (r"lean\s+portfolio|lpm\b", "LPM"),
    (r"release\s+train|rte\b", "RTE"),
    (r"agile\s+software\s+engineering|ase\b", "ASE"),
    (r"devops|sdp\b", "SDP"),
    (r"for\s+teams|sp\b", "SP"),
    (r"architect", "ARCH"),
    (r"ai[-\s]?native", "AI-NATIVE"),
    (r"leading\s+safe|safe\s+agilist|\bsa\b", "SA"),
]

CITIES = [
    "Toronto", "Vancouver", "Calgary", "Montreal", "Montréal", "Ottawa",
    "Edmonton", "Winnipeg", "Halifax", "Quebec", "Québec", "Mississauga",
]


def api_get(path, token, params=None):
    params = dict(params or {})
    url = f"{API}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:500]
        sys.exit(f"Eventbrite API error {e.code} on {path}: {body}")


def paginate(path, token, key, params=None):
    """Yield items across Eventbrite continuation pages."""
    params = dict(params or {})
    while True:
        data = api_get(path, token, params)
        yield from data.get(key, [])
        page = data.get("pagination", {})
        if not page.get("has_more_items"):
            return
        params["continuation"] = page["continuation"]


def classify_course(name):
    lowered = name.lower()
    for pattern, code in COURSE_PATTERNS:
        if re.search(pattern, lowered):
            return code
    return "OTHER"


def classify_city(event, venues):
    venue = venues.get(event.get("venue_id") or "")
    if venue:
        city = (venue.get("address") or {}).get("city") or ""
        if city:
            return city.replace("é", "e").title()
    name = (event.get("name") or {}).get("text") or ""
    for city in CITIES:
        if city.lower() in name.lower():
            return city.replace("é", "e")
    return "Online/Unspecified"


def iso_week(dt):
    year, week, _ = dt.isocalendar()
    return f"{year}-W{week:02d}"


def parse_ts(value):
    return datetime.strptime(value[:19], "%Y-%m-%dT%H:%M:%S")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--weeks", type=int, default=12,
                        help="backfill window in weeks (default 12)")
    parser.add_argument("--out", default=os.path.join(os.path.dirname(__file__) or ".", "reports"),
                        help="output directory")
    args = parser.parse_args()

    token = os.environ.get("EVENTBRITE_PRIVATE_TOKEN") or os.environ.get("EVENTBRITE_TOKEN")
    if not token:
        sys.exit("Set EVENTBRITE_PRIVATE_TOKEN (private token from the event-copy "
                 "script / eventbrite.com/platform/api-keys).")

    orgs = api_get("/users/me/organizations/", token).get("organizations", [])
    if not orgs:
        sys.exit("Token has no organizations.")

    since = datetime.utcnow() - timedelta(weeks=args.weeks)
    rows = []          # (week, course, city, aff, event_name)
    event_totals = defaultdict(int)   # live/future events: paid seats to date

    for org in orgs:
        events, venues = {}, {}
        for status in ("live", "started", "ended", "completed"):
            for ev in paginate(f"/organizations/{org['id']}/events/", token,
                               "events", {"status": status}):
                events[ev["id"]] = ev
        for venue in paginate(f"/organizations/{org['id']}/venues/", token, "venues"):
            venues[venue["id"]] = venue

        for ev in events.values():
            name = (ev.get("name") or {}).get("text") or "(unnamed)"
            course = classify_course(name)
            city = classify_city(ev, venues)
            for att in paginate(f"/events/{ev['id']}/attendees/", token, "attendees"):
                if att.get("cancelled") or att.get("refunded"):
                    continue
                gross = ((att.get("costs") or {}).get("gross") or {}).get("value", 0)
                if not gross:
                    continue  # paid registrations only — free tickets are leads
                created = parse_ts(att["created"])
                if created < since:
                    continue
                aff = att.get("affiliate") or att.get("promotional_code") or ""
                rows.append((iso_week(created), course, city, aff, name))
                if ev.get("status") in ("live", "started"):
                    event_totals[(name, course, city)] += 1

    os.makedirs(args.out, exist_ok=True)
    stamp = iso_week(datetime.utcnow())
    csv_path = os.path.join(args.out, f"registrations-{stamp}.csv")
    md_path = os.path.join(args.out, f"registrations-{stamp}.md")

    weekly = defaultdict(int)
    by_course = defaultdict(lambda: defaultdict(int))
    by_city = defaultdict(int)
    by_aff = defaultdict(int)
    for week, course, city, aff, _ in rows:
        weekly[week] += 1
        by_course[course][week] += 1
        by_city[city] += 1
        if aff:
            by_aff[aff] += 1

    with open(csv_path, "w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["week", "course", "city", "affiliate_code", "event"])
        writer.writerows(sorted(rows))

    weeks = sorted(weekly)
    lines = [f"# Registration report — {stamp}",
             f"_Paid Eventbrite registrations, last {args.weeks} weeks. "
             f"Generated {date.today().isoformat()}. Raw data: `{os.path.basename(csv_path)}`_",
             "", "## Week-over-week (all courses)", "",
             "| Week | Registrations | Δ vs prior week |", "|---|---|---|"]
    prev = None
    for week in weeks:
        delta = "—" if prev is None else f"{weekly[week] - prev:+d}"
        lines.append(f"| {week} | {weekly[week]} | {delta} |")
        prev = weekly[week]

    lines += ["", "## By course", "", "| Course | " + " | ".join(weeks) + " | Total |",
              "|---|" + "---|" * (len(weeks) + 1)]
    for course in sorted(by_course, key=lambda c: -sum(by_course[c].values())):
        cells = [str(by_course[course].get(w, 0)) for w in weeks]
        lines.append(f"| {course} | " + " | ".join(cells) +
                     f" | {sum(by_course[course].values())} |")

    lines += ["", "## By city", ""]
    for city, n in sorted(by_city.items(), key=lambda kv: -kv[1]):
        lines.append(f"- {city}: {n}")

    lines += ["", "## Attribution (tracking / promo codes seen on paid orders)", ""]
    if by_aff:
        for code, n in sorted(by_aff.items(), key=lambda kv: -kv[1]):
            lines.append(f"- `{code}`: {n}")
    else:
        lines.append("_None yet — appears once the A2 sequences send with their "
                     "`aff` tracking links._")

    lines += ["", "## Registrations to date on live events", ""]
    if event_totals:
        for (name, course, city), n in sorted(event_totals.items(), key=lambda kv: -kv[1]):
            lines.append(f"- {name} ({course}, {city}): **{n}** paid")
    else:
        lines.append("_No live events with paid registrations in the window._")

    with open(md_path, "w") as fh:
        fh.write("\n".join(lines) + "\n")

    print(f"{len(rows)} paid registrations across {len(weeks)} weeks")
    print(f"Report: {md_path}\nCSV:    {csv_path}")


if __name__ == "__main__":
    main()
