"""Eventbrite ground-truth pull. Registrations are the ONLY success metric.

Daily incremental pull of PLACED orders from the Eventbrite organization,
grouped by course family. This is the ground-truth feed the whole agent trusts
over any platform "conversion" number.

Usage:
  python src/eventbrite_pull.py                # last 7 days (daily snapshot)
  python src/eventbrite_pull.py --days 30      # wider window
  python src/eventbrite_pull.py --expand-event # also fetch event names -> course family
  python src/eventbrite_pull.py --selftest     # offline: exercise parsing on a sample payload (no network)

Env: EVENTBRITE_TOKEN, EVENTBRITE_ORG_ID  (see .env / .env.example)
"""
import os, sys, json, datetime

BASE = "https://www.eventbriteapi.com/v3"


def course_family(name: str) -> str:
    n = (name or "").lower()
    if "release train" in n or "rte" in n: return "RTE"
    if "aspc" in n or ("advanced" in n and "practice consultant" in n): return "ASPC"  # distinct course family
    if "program consultant" in n or "spc" in n or "practice consultant" in n: return "SPC"
    if "ai-native" in n or "ai native" in n: return "AI_NATIVE"
    if "agilist" in n or "leading" in n: return "LEADING_SAFE"
    if "product owner" in n: return "POPM"
    if "scrum master" in n: return "SCRUM_MASTER"
    return "OTHER"


def _parse_order(o: dict, event_names: dict | None = None) -> dict | None:
    """Map one raw Eventbrite order to a snapshot row. Returns None if not a real sale."""
    if o.get("status") != "placed":
        return None
    event_id = o.get("event_id")
    name = (event_names or {}).get(event_id, o.get("name", ""))
    return {
        "date": (o.get("created") or "")[:10],
        "event_id": event_id,
        "gross": o.get("costs", {}).get("gross", {}).get("major_value"),
        "currency": o.get("costs", {}).get("gross", {}).get("currency"),
        "course_family": course_family(name),
    }


def _event_name(session, event_id: str) -> str:
    try:
        r = session.get(f"{BASE}/events/{event_id}/", timeout=30)
        r.raise_for_status()
        return r.json().get("name", {}).get("text", "")
    except Exception:
        return ""


def pull_orders(days_back: int = 7, expand_event: bool = False) -> list:
    """Fetch PLACED orders changed in the window, grouped by course family.

    Eventbrite v3 paginates with a `continuation` token (NOT ?page=), so we
    follow pagination.continuation until has_more_items is false.
    """
    import requests  # imported lazily so --selftest works without the dep/network

    token = os.environ["EVENTBRITE_TOKEN"]
    org_id = os.environ["EVENTBRITE_ORG_ID"]
    since = (datetime.datetime.utcnow() - datetime.timedelta(days=days_back)).strftime("%Y-%m-%dT%H:%M:%SZ")

    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {token}"})

    out, event_names, continuation = [], {}, None
    while True:
        params = {"changed_since": since}
        if continuation:
            params["continuation"] = continuation
        r = session.get(f"{BASE}/organizations/{org_id}/orders/", params=params, timeout=30)
        r.raise_for_status()
        d = r.json()
        for o in d.get("orders", []):
            eid = o.get("event_id")
            if expand_event and eid and eid not in event_names:
                event_names[eid] = _event_name(session, eid)
            row = _parse_order(o, event_names)
            if row:
                out.append(row)
        pg = d.get("pagination", {})
        if not pg.get("has_more_items"):
            break
        continuation = pg.get("continuation")
        if not continuation:
            break
    return out


# --- offline self-test: proves parsing/grouping without hitting the network ---
_SAMPLE = {
    "orders": [
        {"status": "placed", "created": "2026-07-09T14:12:00Z", "event_id": "111",
         "name": "SAFe RTE Certification - Toronto",
         "costs": {"gross": {"major_value": "2195.00", "currency": "CAD"}}},
        {"status": "placed", "created": "2026-07-10T09:00:00Z", "event_id": "222",
         "name": "AI-Native Foundations",
         "costs": {"gross": {"major_value": "1699.00", "currency": "CAD"}}},
        {"status": "refunded", "created": "2026-07-10T10:00:00Z", "event_id": "222",
         "name": "AI-Native Foundations",
         "costs": {"gross": {"major_value": "1699.00", "currency": "CAD"}}},
    ],
    "pagination": {"has_more_items": False},
}


def _selftest() -> int:
    names = {"111": "SAFe RTE Certification - Toronto", "222": "AI-Native Foundations"}
    rows = [r for r in (_parse_order(o, names) for o in _SAMPLE["orders"]) if r]
    assert len(rows) == 2, f"expected 2 placed orders, got {len(rows)} (refunded must be dropped)"
    assert rows[0]["course_family"] == "RTE", rows[0]
    assert rows[1]["course_family"] == "AI_NATIVE", rows[1]
    assert rows[0]["gross"] == "2195.00" and rows[0]["currency"] == "CAD"
    # SPC vs ASPC are DISTINCT families (ASPC is its own newer course, not merged into SPC).
    assert course_family("Advanced SAFe Practice Consultant") == "ASPC"
    assert course_family("Certified SAFe 6 Practice Consultants (SPC)") == "SPC"
    assert course_family("Certified SAFe Program Consultant training SPC") == "SPC"
    print(json.dumps({"selftest": "PASS", "parsed": rows}, indent=2))
    return 0


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--selftest" in args:
        sys.exit(_selftest())
    days = 7
    if "--days" in args:
        days = int(args[args.index("--days") + 1])
    orders = pull_orders(days_back=days, expand_event="--expand-event" in args)
    print(json.dumps({"pulled": len(orders), "days_back": days, "orders": orders}, indent=2))
