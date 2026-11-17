"""Local-only source: read job search results from sites you are signed in to, through your own browser.

This runs on your computer, never on GitHub. It opens a visible Chrome window with its own profile
(state/browser-profile), where you sign in once with `python -m jobhunter login`. It only reads search
results and job pages, slowly; it never clicks Apply or submits anything.

Signing in needs only Google Chrome. Reading results needs the Playwright package:  pip install playwright
"""
import os
import random
import re
import socket
import subprocess
import time
import urllib.parse

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROFILE = os.path.join(HERE, "state", "browser-profile")

# Finds job links on any results page by URL shape, so it does not depend on a site's CSS classes.
EXTRACT_JS = r"""
([pattern, canonical]) => {
  const re = new RegExp(pattern), seen = new Set(), out = [];
  const noise = /^(new|promoted|easy apply|sponsored|featured|urgently hiring|actively recruiting|save|apply|viewed|\d+\s*(d|h|days?|hours?) ago)$/i;
  for (const a of document.querySelectorAll('a[href]')) {
    const m = a.href.match(re);
    if (!m) continue;
    const id = m[1] || m[0];
    if (seen.has(id)) continue;
    const title = (a.innerText || a.getAttribute('aria-label') || a.title || '').trim().split('\n')[0].trim();
    if (title.length < 4) continue;
    seen.add(id);
    let card = a;
    for (let i = 0; i < 7 && card.parentElement; i++) {
      card = card.parentElement;
      const t = (card.innerText || '').trim();
      if (t.split('\n').filter(x => x.trim()).length >= 3 || t.length > 900) break;
    }
    const lines = (card.innerText || '').split('\n').map(x => x.trim())
      .filter(x => x && x !== title && !noise.test(x));
    const url = canonical ? canonical.replace('{origin}', location.origin).replace('{id}', id) : a.href.split('#')[0];
    out.push({ title, company: lines[0] || '', card: lines.slice(0, 8).join(' | ').slice(0, 500), url });
  }
  return out;
}
"""

DETAIL_JS = r"""
() => { const n = document.querySelector('main') || document.querySelector('article') || document.body;
        return (n.innerText || '').slice(0, 8000); }
"""


def _playwright():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return None
    return sync_playwright


def _start_chrome(cfg, urls=(), debug_port=None):
    """Start your normal Google Chrome on the job-hunter profile, as an ordinary browser window.
    Sites refuse sign-in in a browser started by an automation tool, so Chrome is started plainly
    and, for a run, the reader attaches to it afterwards."""
    from .render import find_chrome
    chrome = os.environ.get("JOBHUNTER_CHROME") or find_chrome()
    if not chrome:
        raise SystemExit("Google Chrome was not found. Install it, or set JOBHUNTER_CHROME to its path.")
    profile = cfg.get("profile") or PROFILE
    os.makedirs(profile, exist_ok=True)
    args = [chrome, f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check"]
    if debug_port:
        args.append(f"--remote-debugging-port={debug_port}")
    if os.environ.get("JOBHUNTER_HEADLESS") == "1":
        args += ["--headless=new", "--no-sandbox"]
    return subprocess.Popen(args + list(urls), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def _free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _attach(playwright, port):
    last = None
    for _ in range(40):
        try:
            return playwright.chromium.connect_over_cdp(f"http://127.0.0.1:{port}")
        except Exception as exc:
            last = exc
            time.sleep(0.5)
    raise RuntimeError("could not attach to Chrome. Close every job-hunter Chrome window and run again. " + str(last)[:120])


def _pause(cfg):
    low, high = cfg.get("delay_seconds", [4, 9])
    time.sleep(random.uniform(low, high))


def fetch(cfg, ctx):
    from .sources import SkipSource, _job
    profile = cfg.get("profile") or PROFILE
    if not os.path.isdir(profile):
        raise SkipSource("signed-in sites run on your computer only; run `python -m jobhunter login` there first")
    sync_playwright = _playwright()
    if sync_playwright is None:
        raise SkipSource("install Playwright to read signed-in sites: pip install playwright")

    out, to_detail = [], []
    with sync_playwright() as p:
        port = _free_port()
        chrome = _start_chrome(cfg, debug_port=port)
        try:
            browser = _attach(p, port)
            context = browser.contexts[0]
            page = context.pages[0] if context.pages else context.new_page()
            _read_sites(cfg, ctx, page, out, to_detail, _job)
            browser.close()
        finally:
            chrome.terminate()
    return out


def _read_sites(cfg, ctx, page, out, to_detail, _job):
    if True:
        for site in cfg.get("sites", []):
            if not site.get("enabled", True):
                continue
            with ctx["each"](f"browser:{site['name']}"):
                found, empty_pages = {}, 0
                for country, place in site["countries"].items():
                    for query in site.get("queries", cfg.get("queries", ctx["queries"])):
                        url = (site["search"].replace("{q}", urllib.parse.quote_plus(query))
                               .replace("{q-dash}", "-".join(query.lower().split()))
                               .replace("{place}", urllib.parse.quote_plus(place))
                               .replace("{place-raw}", place))
                        page.goto(url, wait_until="domcontentloaded", timeout=45000)
                        page.wait_for_timeout(cfg.get("settle_ms", 2500))
                        page.mouse.wheel(0, 2500)  # let lazy lists load
                        page.wait_for_timeout(700)
                        rows = page.evaluate(EXTRACT_JS, [site["link"], site.get("canonical", "")])
                        empty_pages += 0 if rows else 1
                        for row in rows:
                            found.setdefault(row["url"], {**row, "country": country})
                        _pause(cfg)
                for row in found.values():
                    job = _job(site["name"], row["title"], row["company"], row["country"], row["url"], row["card"])
                    out.append(job)
                    if ctx["wanted"](job["title"], None):
                        to_detail.append(job)
                if not found:
                    raise RuntimeError("no job links found; you may be signed out or facing a check page. "
                                       "Run `python -m jobhunter login` and look at the site.")
        # Full descriptions only for jobs whose title already fits, to keep page loads low.
        for job in to_detail[: cfg.get("max_details", 40)]:
            try:
                page.goto(job["url"], wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(cfg.get("settle_ms", 2500))
                text = re.sub(r"\n{2,}", "\n", page.evaluate(DETAIL_JS)).strip()
                if len(text) > len(job["description"]):
                    job["description"] = text
            except Exception:
                pass
            _pause(cfg)


def login(cfg):
    """Open the job-hunter Chrome profile on each site's sign-in page so you can log in once."""
    urls = [site["login"] for site in cfg.get("sites", []) if site.get("enabled", True) and site.get("login")]
    chrome = _start_chrome(cfg, urls)
    input("Sign in to each site in the Chrome window, then press Enter here to save and close... ")
    chrome.terminate()
    try:
        chrome.wait(timeout=15)
    except subprocess.TimeoutExpired:
        pass
    print("Saved. Run:  python -m jobhunter run")
