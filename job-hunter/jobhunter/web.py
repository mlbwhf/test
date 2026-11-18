"""The web app: review jobs, manage your resume and settings, and run the search on a schedule.

Single user, password protected, standard library only. Run it behind HTTPS (see deploy/).

Environment:
  JOBHUNTER_PASSWORD   required; the password for the web app
  JOBHUNTER_TOKEN      optional; lets your computer or an automation tool push postings and start runs
  JOBHUNTER_RUN_HOUR   hour of day (UTC, 0-23) for the daily run; default 2
  JOBHUNTER_DATA       folder for resume, settings and results
"""
import argparse
import contextlib
import hashlib
import hmac
import io
import json
import mimetypes
import os
import secrets
import shutil
import threading
import time
import traceback
from datetime import date, datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

from . import __main__ as cli

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UI = os.path.join(os.path.dirname(os.path.abspath(__file__)), "webui")
SESSION_DAYS = 30
MAX_BODY = 5 * 1024 * 1024
PAGE_CSP = "default-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
FILE_CSP = "default-src 'none'; style-src 'unsafe-inline'; sandbox"


class App:
    def __init__(self, data_dir):
        self.data = os.path.abspath(data_dir)
        os.makedirs(self.data, exist_ok=True)
        self.resume_path = os.path.join(self.data, "resume.json")
        self.config_path = os.path.join(self.data, "config.json")
        self.state_dir = os.path.join(self.data, "state")
        self.out_dir = os.path.join(self.data, "output")
        self.web_path = os.path.join(self.data, "web.json")
        self.ingest_path = os.path.join(self.state_dir, "ingested.json")
        self.password = os.environ.get("JOBHUNTER_PASSWORD", "")
        self.token = os.environ.get("JOBHUNTER_TOKEN", "")
        self.run_hour = int(os.environ.get("JOBHUNTER_RUN_HOUR", "2"))
        self.lock = threading.RLock()
        self.run = {"running": False, "started": "", "finished": "", "summary": "", "error": "", "kind": ""}
        self.failures = []
        self.queued = False
        store = self.store()
        if not store.get("secret"):
            store["secret"] = secrets.token_hex(32)
            self.save_store(store)
        self.secret = store["secret"].encode()
        if not os.path.exists(self.config_path):
            shutil.copy(os.path.join(HERE, "config.json"), self.config_path)

    # -- small JSON store: statuses, last scheduled run, session secret
    def store(self):
        with self.lock:
            try:
                with open(self.web_path, encoding="utf-8") as fh:
                    return json.load(fh)
            except (OSError, ValueError):
                return {}

    def save_store(self, store):
        with self.lock:
            tmp = self.web_path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump(store, fh)
            os.replace(tmp, self.web_path)

    # -- sessions
    def new_session(self):
        expires = str(int(time.time()) + SESSION_DAYS * 86400)
        return expires + "." + hmac.new(self.secret, expires.encode(), hashlib.sha256).hexdigest()

    def valid_session(self, value):
        expires, _, signature = (value or "").partition(".")
        good = hmac.new(self.secret, expires.encode(), hashlib.sha256).hexdigest()
        return expires.isdigit() and int(expires) > time.time() and hmac.compare_digest(signature, good)

    def login_allowed(self):
        cutoff = time.time() - 900
        self.failures = [t for t in self.failures if t > cutoff]
        return len(self.failures) < 8

    # -- data
    def resume_file(self):
        return self.resume_path if os.path.exists(self.resume_path) else os.path.join(HERE, "resume.example.json")

    def snapshot(self):
        try:
            with open(os.path.join(self.out_dir, "data.json"), encoding="utf-8") as fh:
                data = json.load(fh)
        except (OSError, ValueError):
            data = {"run_date": "", "retention_days": 14, "track_labels": {}, "jobs": []}
        store = self.store()
        return {**data, "status": store.get("status", {}), "run": self.run,
                "sample_resume": not os.path.exists(self.resume_path),
                "run_hour_utc": self.run_hour, "push_enabled": bool(self.token)}

    def add_ingested(self, jobs):
        today = date.today().isoformat()
        keep_from = (date.today() - timedelta(days=14)).isoformat()
        with self.lock:
            os.makedirs(self.state_dir, exist_ok=True)
            try:
                with open(self.ingest_path, encoding="utf-8") as fh:
                    current = json.load(fh)
            except (OSError, ValueError):
                current = []
            by_url = {j["url"]: j for j in current if j.get("_at", "") >= keep_from}
            added = 0
            for job in jobs:
                if not isinstance(job, dict) or not job.get("url") or not job.get("title"):
                    continue
                clean = {k: str(job.get(k) or "")[:8000] for k in
                         ("source", "title", "company", "location", "url", "description", "posted")}
                if not clean["url"].startswith(("http://", "https://")):
                    continue
                added += clean["url"] not in by_url
                by_url[clean["url"]] = {**clean, "_at": by_url.get(clean["url"], {}).get("_at", today)}
            with open(self.ingest_path, "w", encoding="utf-8") as fh:
                json.dump(list(by_url.values()), fh, ensure_ascii=False)
        return added

    # -- runs
    def start_run(self, kind="fetch"):
        with self.lock:
            if self.run["running"]:
                if kind == "fetch":
                    self.queued = True  # run again as soon as the current one ends
                return False
            self.run = {"running": True, "started": _now(), "finished": "", "summary": "", "error": "", "kind": kind}
        threading.Thread(target=self._do_run, args=(kind,), daemon=True).start()
        return True

    def _do_run(self, kind):
        buffer, error = io.StringIO(), ""
        try:
            args = argparse.Namespace(config=self.config_path, resume=self.resume_file(), state=self.state_dir,
                                      out=self.out_dir, input=None, date=None, no_pdf=False,
                                      rebuild=(kind == "rebuild"), extra=self.ingest_path)
            with contextlib.redirect_stdout(buffer):
                cli.cmd_run(args)
        except BaseException as exc:  # includes SystemExit from a bad file
            error = f"{type(exc).__name__}: {exc}"
            traceback.print_exc()
        with self.lock:
            self.run = {**self.run, "running": False, "finished": _now(), "summary": buffer.getvalue(), "error": error}
            store = self.store()
            store["last_run"] = {k: self.run[k] for k in ("started", "finished", "summary", "error", "kind")}
            self.save_store(store)
            again, self.queued = self.queued, False
        if again:
            self.start_run("fetch")

    def scheduler(self):
        last = self.store().get("last_run")
        if last:
            self.run = {**self.run, **last}
        while True:
            now = datetime.now(timezone.utc)
            store = self.store()
            if now.hour >= self.run_hour and store.get("scheduled_on") != now.date().isoformat():
                store["scheduled_on"] = now.date().isoformat()
                self.save_store(store)
                self.start_run("fetch")
            time.sleep(60)


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


class Handler(BaseHTTPRequestHandler):
    app = None
    server_version = "JobHunter"

    def log_message(self, fmt, *args):
        pass

    # -- helpers
    def send(self, status, body=b"", content_type="application/json", headers=None, csp=PAGE_CSP):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        elif isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Content-Security-Policy", csp)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Cache-Control", "no-store")
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def cookie(self, name):
        for part in (self.headers.get("Cookie") or "").split(";"):
            key, _, value = part.strip().partition("=")
            if key == name:
                return value
        return ""

    def authed(self):
        return self.app.valid_session(self.cookie("jh"))

    def bearer(self):
        given = (self.headers.get("Authorization") or "").removeprefix("Bearer ").strip()
        return bool(self.app.token) and hmac.compare_digest(given.encode(), self.app.token.encode())

    def same_origin(self):
        origin = self.headers.get("Origin")
        return not origin or urlparse(origin).netloc == self.headers.get("Host")

    def body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BODY:
            raise ValueError("too large")
        return self.rfile.read(length)

    def static(self, name, content_type):
        with open(os.path.join(UI, name), "rb") as fh:
            self.send(200, fh.read(), content_type)

    # -- routes
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/healthz":
            return self.send(200, "ok", "text/plain")
        if path == "/app.css":
            return self.static("app.css", "text/css; charset=utf-8")
        if path == "/login":
            with open(os.path.join(UI, "login.html"), encoding="utf-8") as fh:
                page = fh.read()
            if "failed=1" in (urlparse(self.path).query or ""):
                page = page.replace("<!--MSG-->", '<div class="notice error">That password is not right.</div>')
            return self.send(200, page, "text/html; charset=utf-8")
        if not self.authed():
            if path.startswith("/api/"):
                return self.send(401, {"error": "signed out"})
            return self.send(302, headers={"Location": "/login"})
        if path == "/":
            return self.static("index.html", "text/html; charset=utf-8")
        if path == "/app.js":
            return self.static("app.js", "text/javascript; charset=utf-8")
        if path == "/api/state":
            return self.send(200, self.app.snapshot())
        if path == "/api/resume":
            with open(self.app.resume_file(), encoding="utf-8") as fh:
                return self.send(200, {"text": fh.read(), "sample": not os.path.exists(self.app.resume_path)})
        if path == "/api/config":
            with open(self.app.config_path, encoding="utf-8") as fh:
                return self.send(200, {"text": fh.read()})
        if path.startswith("/files/"):
            return self.file(unquote(path[len("/files/"):]))
        self.send(404, {"error": "not found"})

    do_HEAD = do_GET

    def file(self, rel):
        root = os.path.realpath(os.path.join(self.app.out_dir, "packets"))
        full = os.path.realpath(os.path.join(self.app.out_dir, rel))
        if not full.startswith(root + os.sep) or not os.path.isfile(full):
            return self.send(404, {"error": "not found"})
        kind = mimetypes.guess_type(full)[0] or "application/octet-stream"
        if kind.startswith("text/"):
            kind += "; charset=utf-8"
        headers = {}
        if not full.endswith((".pdf", ".html", ".txt")):
            headers["Content-Disposition"] = f'attachment; filename="{os.path.basename(full)}"'
        with open(full, "rb") as fh:
            self.send(200, fh.read(), kind, headers, csp=FILE_CSP)

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            raw = self.body()
        except ValueError:
            return self.send(413, {"error": "too large"})

        if path == "/login":
            if not self.same_origin():
                return self.send(403, "Forbidden", "text/plain")
            if not self.app.login_allowed():
                return self.send(429, "Too many attempts. Wait 15 minutes.", "text/plain")
            given = parse_qs(raw.decode("utf-8", "replace")).get("password", [""])[0]
            if self.app.password and hmac.compare_digest(given.encode(), self.app.password.encode()):
                secure = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
                cookie = f"jh={self.app.new_session()}; Path=/; HttpOnly; SameSite=Lax; Max-Age={SESSION_DAYS * 86400}{secure}"
                return self.send(302, headers={"Location": "/", "Set-Cookie": cookie})
            self.app.failures.append(time.time())
            time.sleep(1)
            return self.send(302, headers={"Location": "/login?failed=1"})
        if path == "/logout":
            return self.send(302, headers={"Location": "/login", "Set-Cookie": "jh=; Path=/; Max-Age=0"})

        # Token routes: your computer or an automation tool.
        if path in ("/api/ingest", "/api/run") and self.bearer():
            if path == "/api/ingest":
                try:
                    jobs = json.loads(raw).get("jobs", [])
                except (ValueError, AttributeError):
                    return self.send(400, {"error": "send {\"jobs\": [...]}"})
                added = self.app.add_ingested(jobs if isinstance(jobs, list) else [])
                self.app.start_run("fetch")
                return self.send(200, {"received": len(jobs), "new": added, "search": "started or queued"})
            return self.send(200, {"run_started": self.app.start_run("fetch")})

        if not self.authed():
            return self.send(401, {"error": "signed out"})
        if not self.same_origin():
            return self.send(403, {"error": "cross-site request refused"})
        try:
            data = json.loads(raw or b"{}")
        except ValueError:
            return self.send(400, {"error": "not JSON"})

        if path == "/api/status":
            store = self.app.store()
            statuses = store.setdefault("status", {})
            if data.get("status") in ("applied", "skipped"):
                statuses[str(data.get("id"))] = {"status": data["status"], "on": date.today().isoformat()}
            else:
                statuses.pop(str(data.get("id")), None)
            self.app.save_store(store)
            return self.send(200, {"status": statuses})
        if path == "/api/run":
            kind = "rebuild" if data.get("rebuild") else "fetch"
            return self.send(200, {"run_started": self.app.start_run(kind)})
        if path == "/api/resume":
            problem = check_resume(data.get("text", ""))
            if problem:
                return self.send(400, {"error": problem})
            _write(self.app.resume_path, data["text"])
            return self.send(200, {"saved": True, "run_started": self.app.start_run("rebuild")})
        if path == "/api/config":
            problem = check_config(data.get("text", ""))
            if problem:
                return self.send(400, {"error": problem})
            _write(self.app.config_path, data["text"])
            return self.send(200, {"saved": True})
        self.send(404, {"error": "not found"})


def _write(path, text):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        fh.write(text)
    os.replace(tmp, path)


def check_resume(text):
    try:
        resume = json.loads(text)
    except ValueError as exc:
        return f"This is not valid JSON: {exc}"
    if not isinstance(resume, dict) or not (resume.get("contact") or {}).get("name"):
        return "The resume needs a contact section with your name."
    if not isinstance(resume.get("experience"), list) or not resume["experience"]:
        return "The resume needs an experience list with at least one role."
    for role in resume["experience"]:
        if not isinstance(role, dict) or not isinstance(role.get("bullets", []), list):
            return "Each role in experience needs a list of bullets."
    return ""


def check_config(text):
    try:
        config = json.loads(text)
    except ValueError as exc:
        return f"This is not valid JSON: {exc}"
    for key in ("queries", "locations", "tracks", "sources"):
        if key not in config:
            return f"Settings are missing the '{key}' section."
    for name, track in config["tracks"].items():
        if not isinstance(track.get("title"), list):
            return f"Track '{name}' needs a title list."
    unknown = [n for n in config["sources"] if n not in cli.sources.REGISTRY]
    if unknown:
        return "Unknown source: " + ", ".join(unknown)
    return ""


def serve(host, port, data_dir):
    app = App(data_dir)
    if not app.password:
        raise SystemExit("Set JOBHUNTER_PASSWORD before starting the web app.")
    Handler.app = app
    threading.Thread(target=app.scheduler, daemon=True).start()
    print(f"Job Hunter on http://{host}:{port}  (data in {app.data})")
    ThreadingHTTPServer((host, port), Handler).serve_forever()
