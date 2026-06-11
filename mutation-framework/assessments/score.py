#!/usr/bin/env python3
"""Score a Mutation Readiness Scorecard response set.

Reads the canonical spec from mutation-readiness-scorecard.yaml (same
directory) so questions, dimensions, and bands stay in one place.

Scoring (per Appendix A of the Operating Manual):
  - Each question 1-5; N/A allowed (pass "na").
  - Dimension score = floor(sum_of_answers * 12 / (5 * answered_count)),
    i.e. the 0-12 headline number, denominator reduced for N/A items.
  - Total = sum of 6 dimension scores, out of 72. If any item is N/A the
    total is also reported as a percentage.

Usage:
    python3 score.py --answers 3,4,2,3,3,4,2,2,3,4,3,3,2,2,3,3,4,3
    python3 score.py --answers 3,4,na,3,...          # N/A supported
    python3 score.py --rapid --answers 4,3,2,3,4,2   # 6-question rapid mode
    python3 score.py --answers-file responses.json   # {"Q1.1": 3, ...}
    python3 score.py --answers ... --json            # machine-readable
"""

import argparse
import json
import math
import sys
from pathlib import Path

SPEC_PATH = Path(__file__).parent / "mutation-readiness-scorecard.yaml"


def load_spec():
    try:
        import yaml  # type: ignore
    except ImportError:
        sys.exit("PyYAML is required: pip install pyyaml")
    with open(SPEC_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)["assessment"]


def score(answers, spec):
    """answers: dict question_id -> int 1-5 or None (N/A). Returns report."""
    smin, smax = spec["scale"]["min"], spec["scale"]["max"]
    dims = spec["dimensions"]
    expected = [q["id"] for d in dims for q in d["questions"]]

    missing = [qid for qid in expected if qid not in answers]
    if missing:
        raise ValueError(f"missing answers for: {', '.join(missing)}")
    bad = {q: v for q, v in answers.items()
           if v is not None and not (smin <= v <= smax)}
    if bad:
        raise ValueError(f"answers out of {smin}-{smax} range: {bad}")

    per_dimension, total, any_na = [], 0, False
    for dim in dims:
        vals = [answers[q["id"]] for q in dim["questions"]]
        answered = [v for v in vals if v is not None]
        if not answered:
            raise ValueError(f"all questions N/A in dimension {dim['id']}")
        if len(answered) < len(vals):
            any_na = True
        points = math.floor(sum(answered) * 12 / (smax * len(answered)))
        total += points
        per_dimension.append({
            "id": dim["id"],
            "name": dim["name"],
            "points": points,
            "max_points": spec["scoring"]["dimension_max"],
            "na_count": len(vals) - len(answered),
        })

    band = next(b for b in spec["bands"]
                if b["range"][0] <= total <= b["range"][1])
    report = {
        "assessment": spec["id"],
        "version": spec["version"],
        "total_score": total,
        "max_score": spec["scoring"]["total_max"],
        "band": band["name"],
        "band_reading": " ".join(band["reading"].split()),
        "recommended_actions": [" ".join(a.split())
                                for a in band["recommended_actions"]],
        "reading_list": band.get("reading_list", []),
        "dimensions": per_dimension,
    }
    if any_na:
        report["percentage"] = round(
            total * 100 / spec["scoring"]["total_max"], 1)
        report["note"] = ("Some items were N/A; dimension denominators were "
                          "reduced proportionally and the percentage is the "
                          "comparable headline number.")
    return report


def score_rapid(values, spec):
    """values: list of 6 ints (1-5) in rapid_mode question order."""
    rapid = spec["rapid_mode"]
    qids = rapid["question_ids"]
    if len(values) != len(qids):
        raise ValueError(f"rapid mode expects {len(qids)} answers "
                         f"({', '.join(qids)}), got {len(values)}")
    smin, smax = spec["scale"]["min"], spec["scale"]["max"]
    bad = [v for v in values if v is None or not (smin <= v <= smax)]
    if bad:
        raise ValueError(f"rapid mode answers must be {smin}-{smax}, no N/A")
    total = sum(values)
    band_id = next(b["id"] for b in rapid["bands"]
                   if b["range"][0] <= total <= b["range"][1])
    band = next(b for b in spec["bands"] if b["id"] == band_id)
    return {
        "assessment": spec["id"],
        "version": spec["version"],
        "mode": "rapid",
        "total_score": total,
        "max_score": rapid["total_max"],
        "band": band["name"],
        "band_reading": " ".join(band["reading"].split()),
        "note": "Rapid mode is a screen, not a diagnosis; run the full "
                "18-question assessment for dimension-level findings.",
    }


def format_report(r):
    lines = [
        f"Mutation Readiness Scorecard {r['version']}"
        + (" — rapid mode" if r.get("mode") == "rapid" else ""),
        f"Total: {r['total_score']} / {r['max_score']}  —  {r['band']}"
        + (f"  ({r['percentage']}%)" if "percentage" in r else ""),
        "",
        r["band_reading"],
    ]
    if "dimensions" in r:
        lines += ["", "Per dimension (0-12):"]
        for d in r["dimensions"]:
            bar = "#" * d["points"] + "." * (d["max_points"] - d["points"])
            na = f"  ({d['na_count']} N/A)" if d["na_count"] else ""
            lines.append(
                f"  {d['name']:<24} {d['points']:>2}/{d['max_points']}  [{bar}]{na}")
    if "recommended_actions" in r:
        lines += ["", "Recommended actions for this band:"]
        lines += [f"  {i}. {a}" for i, a in
                  enumerate(r["recommended_actions"], 1)]
    if r.get("reading_list"):
        lines += ["", "Read: " + "; ".join(r["reading_list"])]
    if "note" in r:
        lines += ["", f"Note: {r['note']}"]
    return "\n".join(lines)


def parse_value(s):
    s = s.strip().lower()
    if s in ("na", "n/a", "-", ""):
        return None
    return int(s)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--answers",
                   help="comma-separated answers in question order (na allowed)")
    g.add_argument("--answers-file",
                   help="JSON file of {question_id: answer}; null for N/A")
    ap.add_argument("--rapid", action="store_true",
                    help="score the 6-question rapid variant")
    ap.add_argument("--json", action="store_true", help="emit JSON report")
    args = ap.parse_args()

    spec = load_spec()

    try:
        if args.rapid:
            if not args.answers:
                sys.exit("--rapid requires --answers")
            report = score_rapid([parse_value(v)
                                  for v in args.answers.split(",")], spec)
        else:
            qids = [q["id"] for d in spec["dimensions"]
                    for q in d["questions"]]
            if args.answers:
                values = [parse_value(v) for v in args.answers.split(",")]
                if len(values) != len(qids):
                    sys.exit(f"expected {len(qids)} answers, got {len(values)}")
                answers = dict(zip(qids, values))
            else:
                with open(args.answers_file, encoding="utf-8") as f:
                    answers = {k: (None if v is None else int(v))
                               for k, v in json.load(f).items()}
            report = score(answers, spec)
    except ValueError as e:
        sys.exit(str(e))

    print(json.dumps(report, indent=2) if args.json else format_report(report))


if __name__ == "__main__":
    main()
