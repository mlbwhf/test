"""Import the 2-year sales CSV into Airtable as the registration baseline.

Ground truth = registrations. This backfills history so WoW/YoY comparisons in
the weekly analysis have a reference. Idempotent-ish: it appends; clear the table
before a re-run if needed.

Usage:
    export AIRTABLE_TOKEN=pat...          # personal access token, scope data.records:write + schema
    export AIRTABLE_BASE_ID=app...        # the base to import into
    export AIRTABLE_TABLE=Registration Baseline
    python scripts/airtable_import_baseline.py path/to/sales_2yr.csv --map date=Order\\ Date course=Course qty=Seats revenue=Total

--map lets you point CSV column names at the canonical fields without editing code:
    canonical fields: date, course, qty, revenue, currency, channel, event_id
Only `date` and `course` are required; the rest are optional.

The importer derives course_family from the course name using the SAME logic as
src/eventbrite_pull.py so the baseline and the live feed bucket identically.
"""
import os, sys, csv, json, time, urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
from eventbrite_pull import course_family  # single source of truth for bucketing

API = "https://api.airtable.com/v0"


def parse_map(argv):
    m = {}
    if "--map" in argv:
        for pair in argv[argv.index("--map") + 1:]:
            if "=" not in pair:
                break
            k, v = pair.split("=", 1)
            m[k] = v
    return m


def rows_from_csv(path, colmap):
    with open(path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            def col(canon):
                src = colmap.get(canon, canon)
                return (r.get(src) or "").strip()
            course = col("course")
            if not col("date") or not course:
                continue
            fields = {
                "Date": col("date"),
                "Course Name": course,
                "Course Family": course_family(course),
            }
            if col("qty"):      fields["Seats"] = _num(col("qty"))
            if col("revenue"):  fields["Revenue"] = _num(col("revenue"))
            if col("currency"): fields["Currency"] = col("currency")
            if col("channel"):  fields["Channel"] = col("channel")
            if col("event_id"): fields["Event ID"] = col("event_id")
            yield {"fields": fields}


def _num(s):
    try:
        return float(s.replace(",", "").replace("$", ""))
    except ValueError:
        return None


def push(base, table, records, token):
    url = f"{API}/{base}/{urllib.parse.quote(table)}"
    sent = 0
    for i in range(0, len(records), 10):  # Airtable caps at 10 records/request
        batch = {"records": records[i:i + 10], "typecast": True}
        req = urllib.request.Request(url, data=json.dumps(batch).encode(),
                                     headers={"Authorization": f"Bearer {token}",
                                              "Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req) as resp:
            sent += len(json.load(resp).get("records", []))
        time.sleep(0.25)  # stay under 5 req/s
    return sent


if __name__ == "__main__":
    import urllib.parse
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    csv_path = sys.argv[1]
    token = os.environ["AIRTABLE_TOKEN"]
    base = os.environ["AIRTABLE_BASE_ID"]
    table = os.environ.get("AIRTABLE_TABLE", "Registration Baseline")
    recs = list(rows_from_csv(csv_path, parse_map(sys.argv)))
    print(f"Parsed {len(recs)} rows from {csv_path}. Sample: {json.dumps(recs[:2], indent=2)}")
    n = push(base, table, recs, token)
    print(f"Imported {n} records into '{table}'.")
