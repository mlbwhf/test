"""Command line: python -m jobhunter run | login | notify"""
import argparse
import contextlib
import json
import os
import shutil
import smtplib
import sys
import urllib.parse
import zipfile
from datetime import date, timedelta
from email.message import EmailMessage

from . import dashboard, match, render, sources, tailor
from .util import find_apply_email, job_id, slug

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_json(path, default=None):
    if not os.path.exists(path):
        if default is not None:
            return default
        sys.exit(f"Missing file: {path}")
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def collect(config, report):
    """Run every enabled source and return the raw job list. Failures are reported, never fatal."""
    def wanted(title, location):
        if not match.title_relevant(title, config):
            return False
        return location is None or match.country_of(location, "", config) is not None

    @contextlib.contextmanager
    def each(label):
        try:
            yield
        except Exception as exc:  # one bad board must not stop the others
            report["errors"].append(f"{label}: {type(exc).__name__}: {exc}")

    ctx = {"queries": config["queries"], "wanted": wanted, "each": each}
    jobs = []
    for name, cfg in config["sources"].items():
        if not cfg.get("enabled", True):
            continue
        try:
            found = sources.REGISTRY[name](cfg, ctx)
            report["sources"][name] = len(found)
            jobs += found
        except sources.SkipSource as exc:
            report["skipped"].append(f"{name}: {exc}")
        except Exception as exc:
            report["errors"].append(f"{name}: {type(exc).__name__}: {exc}")
            report["sources"][name] = 0
    return jobs


def select(raw, config, today):
    """Filter to relevant jobs in the target places, score them and drop duplicates."""
    oldest = (today - timedelta(days=config.get("max_posting_age_days", 30))).isoformat()
    best = {}
    for job in raw:
        if not job["title"] or not job["url"]:
            continue
        if job["posted"] and job["posted"] < oldest:
            continue
        points, track, _ = match.score(job, config)
        if points < config.get("min_score", 55):
            continue
        country = match.country_of(job["location"], job["description"], config)
        if not country:
            continue
        jid = job_id(job["company"], job["title"], country)
        record = {**job, "id": jid, "score": points, "track": track, "country": country,
                  "description": job["description"][:6000],
                  "apply_email": find_apply_email(job["description"])}
        if jid not in best or len(record["description"]) > len(best[jid]["description"]):
            best[jid] = record
    return best


def write_packet(job, resume, config, out_dir, chrome):
    view = tailor.tailor(resume, job, config)
    letter = tailor.cover_letter(resume, job, view)
    folder = f"packets/{slug(job['company'] or 'company', 24)}-{slug(job['title'], 36)}-{job['id'][:6]}"
    os.makedirs(os.path.join(out_dir, folder), exist_ok=True)
    base = slug(resume.get("contact", {}).get("name", "resume"), 40).title() + "-Resume"
    html_path = os.path.join(out_dir, folder, base + ".html")
    with open(html_path, "w", encoding="utf-8") as fh:
        fh.write(render.resume_html(view))
    render.resume_docx(view, os.path.join(out_dir, folder, base + ".docx"))
    with open(os.path.join(out_dir, folder, "Cover-Letter.txt"), "w", encoding="utf-8") as fh:
        fh.write(letter + "\n")
    files = {}
    if chrome and render.html_to_pdf(chrome, html_path, os.path.join(out_dir, folder, base + ".pdf")):
        files["Resume PDF"] = f"{folder}/{base}.pdf"
    files["Resume Word"] = f"{folder}/{base}.docx"
    files["Resume web page"] = f"{folder}/{base}.html"
    mailto = ""
    if job.get("apply_email"):
        name = resume.get("contact", {}).get("name", "")
        mailto = "mailto:" + job["apply_email"] + "?" + urllib.parse.urlencode(
            {"subject": f"Application: {job['title']} - {name}", "body": letter[:1800]}, quote_via=urllib.parse.quote)
    return {"matched": view["matched"], "missing": view["missing"], "cover": letter, "files": files, "mailto": mailto}


def cmd_run(args):
    config = load_json(args.config)
    resume = load_json(args.resume)
    today = date.fromisoformat(args.date) if args.date else date.today()
    report = {"sources": {}, "errors": [], "skipped": []}

    raw = load_json(args.input) if args.input else collect(config, report)
    fresh = select(raw, config, today)

    state_path = os.path.join(args.state, "jobs.json")
    state = load_json(state_path, {"jobs": {}})
    keep_from = (today - timedelta(days=config.get("retention_days", 14))).isoformat()
    jobs = {jid: j for jid, j in state["jobs"].items() if j.get("first_seen", "") >= keep_from}
    known = set(state.get("seen", [])) | set(state["jobs"])
    for jid, job in fresh.items():
        job["first_seen"] = jobs[jid]["first_seen"] if jid in jobs else today.isoformat()
        if jid in known and jid not in jobs:
            continue  # seen before and already aged out; do not resurface as new
        jobs[jid] = job
    os.makedirs(args.state, exist_ok=True)
    with open(state_path, "w", encoding="utf-8") as fh:
        json.dump({"jobs": jobs, "seen": sorted(known | set(jobs))[-20000:]}, fh, ensure_ascii=False)

    ordered = sorted(jobs.values(), key=lambda j: (j["first_seen"] != today.isoformat(), -j["score"], j["title"]))
    out_dir = args.out
    shutil.rmtree(os.path.join(out_dir, "packets"), ignore_errors=True)
    os.makedirs(out_dir, exist_ok=True)
    chrome = None if args.no_pdf else render.find_chrome()
    rows = []
    for index, job in enumerate(ordered):
        packet = write_packet(job, resume, config, out_dir, chrome) if index < config.get("max_packets", 60) else {}
        rows.append({**{k: job[k] for k in ("id", "title", "company", "location", "country", "track", "score",
                                             "url", "posted", "first_seen", "source", "apply_email")},
                     "is_new": job["first_seen"] == today.isoformat(),
                     "snippet": job["description"][:700], **packet})
    data = {"run_date": today.isoformat(), "retention_days": config.get("retention_days", 14),
            "track_labels": {k: v.get("label", k) for k, v in config["tracks"].items()},
            "sample_resume": bool(resume.get("_sample")), "jobs": rows}
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(dashboard.build(data))
    with open(os.path.join(out_dir, "jobs.json"), "w", encoding="utf-8") as fh:
        json.dump([{k: v for k, v in r.items() if k not in ("cover", "snippet")} for r in rows], fh, indent=1, ensure_ascii=False)

    new = [r for r in rows if r["is_new"]]
    lines = ["## Job Hunter run " + today.isoformat(), "",
             f"- Postings fetched: {len(raw)}", f"- Relevant in target locations: {len(fresh)}",
             f"- New this run: {len(new)}", f"- Open matches on the dashboard: {len(rows)}",
             f"- PDF resumes: {'yes' if chrome else 'no (no Chrome found; Word and web versions written)'}", "",
             "| Source | Postings |", "|---|---|"]
    lines += [f"| {name} | {count} |" for name, count in report["sources"].items()]
    if report["skipped"]:
        lines += ["", "Not enabled yet:"] + ["- " + s for s in report["skipped"]]
    if report["errors"]:
        lines += ["", "Source errors:"] + ["- " + e for e in report["errors"]]
    if new:
        lines += ["", "New matches:"] + [f"- {r['score']} | {r['title']} | {r['company']} | {r['country']}" for r in new[:40]]
    summary = "\n".join(lines)
    print(summary)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as fh:
            fh.write(summary + "\n")


def cmd_notify(args):
    """Email yourself the dashboard and packets. Uses your own mailbox over SMTP."""
    host, user, password = (os.environ.get(k) for k in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"))
    if not (host and user and password):
        print("Email not configured (SMTP_HOST, SMTP_USER, SMTP_PASSWORD); skipping.")
        return
    rows = load_json(os.path.join(args.out, "jobs.json"))
    new = [r for r in rows if r["is_new"]]
    if not new and not args.always:
        print("No new jobs; no email sent.")
        return
    archive = os.path.join(os.path.dirname(os.path.abspath(args.out)), "job-packets.zip")
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(args.out):
            for name in files:
                full = os.path.join(root, name)
                z.write(full, os.path.relpath(full, args.out))
    msg = EmailMessage()
    msg["Subject"] = f"Job Hunter: {len(new)} new matching job{'s' if len(new) != 1 else ''}"
    msg["From"] = user
    msg["To"] = os.environ.get("NOTIFY_TO") or user
    body = ["Open index.html from the attached zip to review and apply.", ""]
    body += [f"{r['score']}  {r['title']} - {r['company']} ({r['country']})\n    {r['url']}" for r in new]
    msg.set_content("\n".join(body))
    if os.path.getsize(archive) < 20 * 1024 * 1024:
        with open(archive, "rb") as fh:
            msg.add_attachment(fh.read(), maintype="application", subtype="zip", filename="job-packets.zip")
    with smtplib.SMTP(host, int(os.environ.get("SMTP_PORT", "587")), timeout=60) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(msg)
    print(f"Emailed {len(new)} new jobs to {msg['To']}.")


def main(argv=None):
    parser = argparse.ArgumentParser(prog="jobhunter", description=__doc__)
    parser.add_argument("--out", default=os.path.join(HERE, "output"))
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run", help="fetch jobs, rank them and build application packets")
    run.add_argument("--config", default=os.path.join(HERE, "config.json"))
    run.add_argument("--resume", default=os.path.join(HERE, "resume.json"))
    run.add_argument("--state", default=os.path.join(HERE, "state"))
    run.add_argument("--input", help="read postings from a JSON file instead of the network")
    run.add_argument("--date", help="run date override, YYYY-MM-DD")
    run.add_argument("--no-pdf", action="store_true")
    run.set_defaults(func=cmd_run)
    login = sub.add_parser("login", help="sign in to LinkedIn, Indeed, Bayt and others in the local browser profile")
    login.add_argument("--config", default=os.path.join(HERE, "config.json"))
    login.set_defaults(func=lambda a: __import__("jobhunter.browser", fromlist=["login"]).login(
        load_json(a.config)["sources"].get("browser", {})))
    notify = sub.add_parser("notify", help="email the results to yourself")
    notify.add_argument("--always", action="store_true", help="send even when nothing is new")
    notify.set_defaults(func=cmd_notify)
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
