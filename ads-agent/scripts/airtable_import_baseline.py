"""Import the 2-year Eventbrite sales CSV into Airtable as the registration baseline.

Ground truth = registrations. This backfills history so the weekly analysis has a
WoW/YoY reference. Pre-wired for the "Ads Agent" base created during deployment and
for the Eventbrite per-class sales export (columns like "Event start date",
"Paid tickets sold", "Net sales"). Registrations = Paid tickets sold; only classes
with >=1 paid registration are imported (zero-sale scheduled classes are skipped).

Usage:
    export AIRTABLE_TOKEN=pat...          # PAT with data.records:read/write on the base
    python scripts/airtable_import_baseline.py path/to/sales.csv            # append
    python scripts/airtable_import_baseline.py path/to/sales.csv --replace  # clear table first, then load all 220

Defaults (override via env if you renamed things):
    AIRTABLE_BASE_ID = appCXSWnIISm0c6iF          # the "Ads Agent" base
    AIRTABLE_TABLE   = Registration Baseline

--replace deletes existing rows first so a partial earlier import can't create
duplicates — use it to get exactly one clean copy of the full baseline.

course_family() is imported from src/eventbrite_pull so the baseline and the live
daily feed bucket courses identically (incl. the ASPC-vs-SPC split).
"""
import os, sys, csv, json, time, urllib.parse, urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
from eventbrite_pull import course_family

API = "https://api.airtable.com/v0"
BASE = os.environ.get("AIRTABLE_BASE_ID", "appCXSWnIISm0c6iF")
TABLE = os.environ.get("AIRTABLE_TABLE", "Registration Baseline")

# CSV column -> canonical. Matches the Eventbrite "...Sales..." export headers.
COLS = {"date": "Event start date", "course": "Event name",
        "paid": "Paid tickets sold", "revenue": "Net sales", "currency": "Currency"}


def _num(s):
    try:
        return float(str(s).replace(",", "").replace("$", ""))
    except (ValueError, AttributeError):
        return None


def rows_from_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            name = (r.get(COLS["course"]) or "").strip()
            if not name or name.upper() == "TOTALS":
                continue
            paid = int(_num(r.get(COLS["paid"])) or 0)
            if paid <= 0:                       # baseline = actual paid registrations
                continue
            fields = {
                "Course Name": name,
                "Date": (r.get(COLS["date"]) or "").strip(),
                "Course Family": course_family(name),
                "Seats": paid,
                "Currency": (r.get(COLS["currency"]) or "").strip(),
                "Channel": "Eventbrite",
                "Source": "csv_baseline",
            }
            rev = _num(r.get(COLS["revenue"]))
            if rev is not None:
                fields["Revenue"] = round(rev, 2)
            yield {"fields": fields}


def _req(method, url, token, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Authorization": f"Bearer {token}",
                                          "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def clear_table(token):
    url = f"{API}/{BASE}/{urllib.parse.quote(TABLE)}"
    deleted = 0
    while True:
        page = _req("GET", url + "?pageSize=100&fields[]=Source", token)
        ids = [rec["id"] for rec in page.get("records", [])]
        if not ids:
            break
        for i in range(0, len(ids), 10):
            q = "&".join(f"records[]={rid}" for rid in ids[i:i + 10])
            _req("DELETE", url + "?" + q, token)
            deleted += len(ids[i:i + 10])
            time.sleep(0.25)
        if not page.get("offset"):
            break
    return deleted


def push(records, token):
    url = f"{API}/{BASE}/{urllib.parse.quote(TABLE)}"
    sent = 0
    for i in range(0, len(records), 10):        # Airtable caps at 10 records/request
        _req("POST", url, token, {"records": records[i:i + 10], "typecast": True})
        sent += len(records[i:i + 10])
        time.sleep(0.25)                         # stay under 5 req/s
    return sent


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    token = os.environ["AIRTABLE_TOKEN"]
    recs = list(rows_from_csv(args[0]))
    print(f"Parsed {len(recs)} paid-registration rows from {args[0]} into base {BASE} / '{TABLE}'.")
    if "--replace" in sys.argv:
        print(f"Cleared {clear_table(token)} existing rows.")
    print(f"Imported {push(recs, token)} records.")
