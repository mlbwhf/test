#!/usr/bin/env python3
"""Score a Mutation Readiness Scorecard response set.

Reads the canonical spec from mutation-readiness-scorecard.yaml (same
directory) so questions, dimensions, and bands stay in one place.

Usage:
    python3 score.py --answers 3,4,2,3,3,4,2,2,3,4,3,3,2,2,3,3,4,3
    python3 score.py --answers-file responses.json   # {"SD1": 3, ...}
    python3 score.py --answers ... --json            # machine-readable output

Answers are given in question order (SD1..LP3) on the 1-5 Likert scale.
"""

import argparse
import json
import sys
from pathlib import Path

SPEC_PATH = Path(__file__).parent / "mutation-readiness-scorecard.yaml"


def load_spec():
    try:
        import yaml  # type: ignore
        with open(SPEC_PATH, encoding="utf-8") as f:
            return yaml.safe_load(f)["assessment"]
    except ImportError:
        sys.exit("PyYAML is required: pip install pyyaml")


def score(answers, spec):
    """answers: dict question_id -> int (1-5). Returns the report dict."""
    scale_min = spec["scale"]["min"]
    scale_max = spec["scale"]["max"]
    dims = spec["dimensions"]
    expected = [q["id"] for d in dims for q in d["questions"]]

    missing = [qid for qid in expected if qid not in answers]
    if missing:
        raise ValueError(f"missing answers for: {', '.join(missing)}")
    bad = {q: v for q, v in answers.items()
           if q in expected and not (scale_min <= v <= scale_max)}
    if bad:
        raise ValueError(f"answers out of {scale_min}-{scale_max} range: {bad}")

    per_dimension = []
    total = 0
    for dim in dims:
        raw = sum(answers[q["id"]] for q in dim["questions"])
        points = raw - len(dim["questions"]) * scale_min  # 0-12 per dimension
        total += points
        per_dimension.append({
            "id": dim["id"],
            "name": dim["name"],
            "points": points,
            "max_points": len(dim["questions"]) * (scale_max - scale_min),
            "mean_response": round(raw / len(dim["questions"]), 2),
        })

    band = next(b for b in spec["bands"]
                if b["range"][0] <= total <= b["range"][1])
    return {
        "assessment": spec["id"],
        "version": spec["version"],
        "total_score": total,
        "max_score": spec["scoring"]["normalization"]["scaled_max"],
        "band": band["name"],
        "band_summary": " ".join(band["summary"].split()),
        "thirty_day_actions": [" ".join(a.split())
                               for a in band["thirty_day_actions"]],
        "dimensions": per_dimension,
    }


def format_report(report):
    lines = [
        f"Mutation Readiness Scorecard {report['version']}",
        f"Total: {report['total_score']} / {report['max_score']}"
        f"  —  {report['band']}",
        "",
        report["band_summary"],
        "",
        "Per dimension:",
    ]
    for d in report["dimensions"]:
        bar = "#" * d["points"] + "." * (d["max_points"] - d["points"])
        lines.append(f"  {d['name']:<25} {d['points']:>2}/{d['max_points']}  [{bar}]")
    lines += ["", "Your next 30 days:"]
    lines += [f"  {i}. {a}" for i, a in
              enumerate(report["thirty_day_actions"], 1)]
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--answers", help="comma-separated 18 answers in question order")
    g.add_argument("--answers-file", help="JSON file of {question_id: answer}")
    ap.add_argument("--json", action="store_true", help="emit JSON report")
    args = ap.parse_args()

    spec = load_spec()
    qids = [q["id"] for d in spec["dimensions"] for q in d["questions"]]

    if args.answers:
        values = [int(v) for v in args.answers.split(",")]
        if len(values) != len(qids):
            sys.exit(f"expected {len(qids)} answers, got {len(values)}")
        answers = dict(zip(qids, values))
    else:
        with open(args.answers_file, encoding="utf-8") as f:
            answers = {k: int(v) for k, v in json.load(f).items()}

    try:
        report = score(answers, spec)
    except ValueError as e:
        sys.exit(str(e))

    print(json.dumps(report, indent=2) if args.json else format_report(report))


if __name__ == "__main__":
    main()
