"""Small shared helpers: HTTP, text cleanup, phrase matching."""
import hashlib
import html
import json
import re
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser

USER_AGENT = "job-hunter/1.0 (personal job search script)"


def fetch(url, *, data=None, headers=None, timeout=25, retries=2):
    """GET (or POST when `data` is given, sent as JSON) and return the body as text."""
    body = None
    hdrs = {"User-Agent": USER_AGENT, "Accept": "application/json, application/xml, */*"}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        hdrs["Content-Type"] = "application/json"
    hdrs.update(headers or {})
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, data=body, headers=hdrs)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt < retries:
                time.sleep(2 * (attempt + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
                continue
            raise


def get_json(url, **kwargs):
    return json.loads(fetch(url, **kwargs))


class _Stripper(HTMLParser):
    BLOCK = {"p", "br", "div", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "tr", "section"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def strip_html(value):
    """Turn an HTML fragment (possibly entity-escaped twice) into plain text."""
    if not value:
        return ""
    text = str(value)
    if "&lt;" in text:
        text = html.unescape(text)
    if "<" in text:
        parser = _Stripper()
        try:
            parser.feed(text)
            parser.close()
            text = "".join(parser.parts)
        except Exception:
            text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text).replace("\xa0", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\s*\n\s*", "\n", text)
    return text.strip()


def norm(text):
    """Lowercase and reduce to space-separated alphanumeric words, padded with spaces.
    Plural endings are dropped so "Agile Release Trains" matches "agile release train"."""
    words = re.findall(r"[a-z0-9+#]+", (text or "").lower())
    words = [w[:-1] if len(w) > 3 and w.endswith("s") and not w.endswith("ss") else w for w in words]
    return " " + " ".join(words) + " "


def has_phrase(normed, phrase):
    """Whole-word phrase test against text already passed through norm()."""
    return norm(phrase) in normed


def job_id(*parts):
    return hashlib.sha1("|".join(norm(p).strip() for p in parts).encode("utf-8")).hexdigest()[:12]


def slug(text, limit=48):
    return "-".join(norm(text).split())[:limit].strip("-") or "job"


EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+")
_NOT_APPLY = ("noreply", "no-reply", "donotreply", "privacy", "accessib", "accommodat", "abuse", "support@", "dpo@")


def find_apply_email(text):
    """Return an address a posting asks applicants to write to, if it names one."""
    for match in EMAIL_RE.finditer(text or ""):
        addr = match.group(0).rstrip(".")
        if not any(bad in addr.lower() for bad in _NOT_APPLY):
            return addr
    return ""
