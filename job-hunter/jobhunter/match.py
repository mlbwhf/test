"""Rule-based relevance scoring: which track a job belongs to, where it is, how well it fits."""
from .util import has_phrase, norm

REMOTE_WORDS = ("remote", "work from home", "anywhere", "worldwide", "global")
SENIOR_WORDS = ("senior", "sr", "lead", "head", "director", "principal", "manager", "vp", "chief", "coach")


def country_of(location, description, config):
    """Return the target country a job is in, "Remote" for an eligible remote job, else None."""
    loc = norm(location)
    for country, names in config["locations"].items():
        if any(has_phrase(loc, n) for n in names):
            return country
    if any(has_phrase(loc, w) for w in REMOTE_WORDS):
        if config.get("include_remote_worldwide", True):
            blocked = config.get("remote_exclude", [])
            if not any(has_phrase(loc, b) for b in blocked) or any(has_phrase(loc, w) for w in ("worldwide", "anywhere", "global")):
                return "Remote"
    if not loc.strip():
        # Some feeds carry no location field; fall back to the first lines of the text.
        head = norm((description or "")[:300])
        for country, names in config["locations"].items():
            if any(has_phrase(head, n) for n in names):
                return country
    return None


def title_relevant(title, config):
    t = norm(title)
    if any(has_phrase(t, x) for x in config.get("exclude_title", [])):
        return False
    return any(has_phrase(t, p) for track in config["tracks"].values() for p in track["title"])


def score(job, config):
    """Return (score 0-100, track name, matched title phrases) or (0, None, [])."""
    title = norm(job["title"])
    if any(has_phrase(title, x) for x in config.get("exclude_title", [])):
        return 0, None, []
    text = norm(job["title"] + " " + job.get("description", ""))
    best = (0, None, [])
    for name, track in config["tracks"].items():
        hits = [p for p in track["title"] if has_phrase(title, p)]
        if not hits:
            continue
        points = 55 + min(15, 5 * (len(hits) - 1))
        points += min(25, 3 * sum(1 for k in track.get("keywords", []) if has_phrase(text, k)))
        if points > best[0]:
            best = (points, name, hits)
    if not best[1]:
        return 0, None, []
    points = best[0] + (5 if any(has_phrase(title, w) for w in SENIOR_WORDS) else 0)
    return min(100, points), best[1], best[2]
