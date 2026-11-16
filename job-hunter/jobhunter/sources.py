"""Job sources. Each fetcher returns a list of job dicts and never needs a login.

A job dict has: title, company, location, url, description, posted, source.
Only official public APIs and feeds are used; no site is scraped behind a login.
"""
import os
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from .util import fetch, get_json, strip_html


def _job(source, title, company, location, url, description="", posted=""):
    return {
        "source": source,
        "title": (title or "").strip(),
        "company": (company or "").strip(),
        "location": (location or "").strip(),
        "url": (url or "").strip(),
        "description": strip_html(description),
        "posted": str(posted or "")[:10],
    }


def _q(params):
    return urllib.parse.urlencode(params)


def _ms_date(value):
    try:
        return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc).date().isoformat()
    except (TypeError, ValueError):
        return ""


# --- Aggregators with a free API key ---------------------------------------

def jooble(cfg, ctx):
    """Jooble aggregates most boards in Canada and the Gulf. Free key: jooble.org/api/about"""
    key = os.environ.get("JOOBLE_API_KEY")
    if not key:
        raise SkipSource("set JOOBLE_API_KEY to enable (free at jooble.org/api/about)")
    out = []
    for location in cfg.get("locations", []):
        for query in cfg.get("queries", ctx["queries"]):
            data = get_json(
                "https://jooble.org/api/" + key,
                data={"keywords": query, "location": location, "page": 1},
            )
            for j in data.get("jobs", []):
                out.append(_job("Jooble", j.get("title"), j.get("company"), j.get("location") or location,
                                j.get("link"), j.get("snippet"), j.get("updated")))
    return out


def adzuna(cfg, ctx):
    """Adzuna covers Canada (it has no Gulf index). Free key: developer.adzuna.com"""
    app_id, app_key = os.environ.get("ADZUNA_APP_ID"), os.environ.get("ADZUNA_APP_KEY")
    if not (app_id and app_key):
        raise SkipSource("set ADZUNA_APP_ID and ADZUNA_APP_KEY to enable (free at developer.adzuna.com)")
    out = []
    for country in cfg.get("countries", ["ca"]):
        for query in cfg.get("queries", ctx["queries"]):
            params = {"app_id": app_id, "app_key": app_key, "what_phrase": query,
                      "results_per_page": 50, "max_days_old": cfg.get("max_days_old", 7),
                      "sort_by": "date", "content-type": "application/json"}
            data = get_json(f"https://api.adzuna.com/v1/api/jobs/{country}/search/1?{_q(params)}")
            for j in data.get("results", []):
                out.append(_job("Adzuna", j.get("title"), (j.get("company") or {}).get("display_name"),
                                (j.get("location") or {}).get("display_name"), j.get("redirect_url"),
                                j.get("description"), j.get("created")))
    return out


# --- Keyless public job APIs (mostly remote roles) -------------------------

def remotive(cfg, ctx):
    out = []
    for query in cfg.get("queries", ctx["queries"]):
        data = get_json("https://remotive.com/api/remote-jobs?" + _q({"search": query}))
        for j in data.get("jobs", []):
            out.append(_job("Remotive", j.get("title"), j.get("company_name"),
                            "Remote - " + (j.get("candidate_required_location") or "Worldwide"),
                            j.get("url"), j.get("description"), j.get("publication_date")))
    return out


def jobicy(cfg, ctx):
    out = []
    for tag in cfg.get("tags", ["agile", "transformation"]):
        data = get_json("https://jobicy.com/api/v2/remote-jobs?" + _q({"count": 50, "tag": tag}))
        for j in data.get("jobs", []):
            out.append(_job("Jobicy", j.get("jobTitle"), j.get("companyName"),
                            "Remote - " + (j.get("jobGeo") or "Anywhere"),
                            j.get("url"), j.get("jobDescription") or j.get("jobExcerpt"), j.get("pubDate")))
    return out


def remoteok(cfg, ctx):
    out = []
    for j in get_json("https://remoteok.com/api"):
        if not isinstance(j, dict) or not j.get("position"):
            continue
        out.append(_job("Remote OK", j.get("position"), j.get("company"),
                        "Remote - " + (j.get("location") or "Worldwide"),
                        j.get("url"), j.get("description"), j.get("date")))
    return out


# --- Company career boards (public applicant-tracking-system APIs) ---------

def greenhouse(cfg, ctx):
    out = []
    for board in cfg.get("boards", []):
        with ctx["each"](f"greenhouse:{board}"):
            data = get_json(f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true")
            for j in data.get("jobs", []):
                out.append(_job("Greenhouse", j.get("title"), j.get("company_name") or board.title(),
                                (j.get("location") or {}).get("name"), j.get("absolute_url"),
                                j.get("content"), j.get("updated_at")))
    return out


def lever(cfg, ctx):
    out = []
    for board in cfg.get("boards", []):
        with ctx["each"](f"lever:{board}"):
            for j in get_json(f"https://api.lever.co/v0/postings/{board}?mode=json"):
                cats = j.get("categories") or {}
                out.append(_job("Lever", j.get("text"), board.title(), cats.get("location"),
                                j.get("hostedUrl"), j.get("descriptionPlain") or j.get("description"),
                                _ms_date(j.get("createdAt"))))
    return out


def ashby(cfg, ctx):
    out = []
    for board in cfg.get("boards", []):
        with ctx["each"](f"ashby:{board}"):
            data = get_json(f"https://api.ashbyhq.com/posting-api/job-board/{board}")
            for j in data.get("jobs", []):
                out.append(_job("Ashby", j.get("title"), board.title(), j.get("location"),
                                j.get("jobUrl"), j.get("descriptionPlain") or j.get("descriptionHtml"),
                                j.get("publishedAt")))
    return out


def smartrecruiters(cfg, ctx):
    """Company boards on SmartRecruiters; the API can search by keyword."""
    out = []
    for company in cfg.get("companies", []):
        with ctx["each"](f"smartrecruiters:{company}"):
            seen = set()
            for query in cfg.get("queries", ctx["queries"]):
                data = get_json(f"https://api.smartrecruiters.com/v1/companies/{company}/postings?"
                                + _q({"q": query, "limit": 100}))
                for j in data.get("content", []):
                    if j.get("id") in seen:
                        continue
                    seen.add(j.get("id"))
                    loc = j.get("location") or {}
                    place = ", ".join(p for p in (loc.get("city"), loc.get("region"), (loc.get("country") or "").upper()) if p)
                    if loc.get("remote"):
                        place += " (Remote)"
                    name = (j.get("company") or {}).get("name") or company
                    title = j.get("name")
                    desc = ""
                    if ctx["wanted"](title, place) and j.get("ref"):
                        try:
                            sections = (get_json(j["ref"]).get("jobAd") or {}).get("sections") or {}
                            desc = "\n".join((s or {}).get("text") or "" for s in sections.values())
                        except Exception:
                            desc = ""
                    out.append(_job("SmartRecruiters", title, name, place,
                                    f"https://jobs.smartrecruiters.com/{company}/{j.get('id')}",
                                    desc, j.get("releasedDate")))
    return out


def workday(cfg, ctx):
    """Workday career sites. Each entry: {"name", "host", "tenant", "site"}."""
    out = []
    for site in cfg.get("sites", []):
        with ctx["each"](f"workday:{site['name']}"):
            base = f"https://{site['host']}/wday/cxs/{site['tenant']}/{site['site']}"
            seen = set()
            for query in cfg.get("queries", ctx["queries"]):
                data = get_json(base + "/jobs", data={"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": query})
                for j in data.get("jobPostings", []):
                    path = j.get("externalPath")
                    if not path or path in seen:
                        continue
                    seen.add(path)
                    title, place, desc, posted = j.get("title"), j.get("locationsText") or "", "", ""
                    if ctx["wanted"](title, None):
                        try:
                            info = get_json(base + path).get("jobPostingInfo") or {}
                            desc = info.get("jobDescription") or ""
                            posted = info.get("startDate") or ""
                            extra = [info.get("location")] + list(info.get("additionalLocations") or [])
                            place = "; ".join(p for p in extra if p) or place
                            if info.get("country", {}).get("descriptor"):
                                place += ", " + info["country"]["descriptor"]
                        except Exception:
                            pass
                    out.append(_job("Workday", title, site["name"], place,
                                    f"https://{site['host']}/{site['site']}{path}", desc, posted))
    return out


# --- Any RSS or Atom feed ---------------------------------------------------

def rss(cfg, ctx):
    """Generic feeds. Each entry: {"name", "url", optional "location"}."""
    out = []
    for feed in cfg.get("feeds", []):
        with ctx["each"](f"rss:{feed['name']}"):
            root = ET.fromstring(fetch(feed["url"]))
            for node in root.iter():
                tag = node.tag.rsplit("}", 1)[-1]
                if tag not in ("item", "entry"):
                    continue
                fields = {}
                for child in node:
                    name = child.tag.rsplit("}", 1)[-1]
                    value = (child.text or "").strip() or child.attrib.get("href", "")
                    fields.setdefault(name, value)
                body = fields.get("description") or fields.get("summary") or fields.get("content") or ""
                out.append(_job(feed["name"], fields.get("title"), fields.get("author") or fields.get("company") or "",
                                fields.get("location") or feed.get("location") or strip_html(body)[:200],
                                fields.get("link") or fields.get("id"), body,
                                _feed_date(fields.get("pubDate") or fields.get("updated") or fields.get("published"))))
    return out


def _feed_date(value):
    if not value:
        return ""
    if value[:4].isdigit():
        return value[:10]
    try:
        from email.utils import parsedate_to_datetime
        return parsedate_to_datetime(value).date().isoformat()
    except (TypeError, ValueError):
        return ""


class SkipSource(Exception):
    """A source that is switched on but missing its key."""


def browser(cfg, ctx):
    """Signed-in sites (LinkedIn, Indeed, Bayt, GulfTalent, Naukrigulf) through your own browser. Local only."""
    from . import browser as local_browser
    return local_browser.fetch(cfg, ctx)


REGISTRY = {
    "browser": browser,
    "jooble": jooble, "adzuna": adzuna, "remotive": remotive, "jobicy": jobicy, "remoteok": remoteok,
    "greenhouse": greenhouse, "lever": lever, "ashby": ashby, "smartrecruiters": smartrecruiters,
    "workday": workday, "rss": rss,
}
