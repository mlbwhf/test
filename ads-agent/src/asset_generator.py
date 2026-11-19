"""Draft-only ad asset validation with mechanical guardrails (Layer 4).

Nothing here uploads anything. It answers "may this draft go to the human
approval queue?" for ad copy and final URLs, enforcing config/rules.yaml:
  - character limits per asset type
  - owner-blocked wording (no pass guarantee / money-back; use "exam prep and support")
  - no CAD pricing in copy served to US audiences
  - time-bound offer copy ("% off", Black Friday, "ends Nov 30") ONLY while an
    owner-confirmed promotion is active, and only at the confirmed percentage
  - no fabricated scarcity ("seats left"), no unverified big-number claims
  - final URLs: stable approved pages only; never /event/ or /wp-training/
    (one page per class date, they go stale) or translations in English campaigns
"""
from __future__ import annotations
import datetime
import re
import sys

import yaml

DEFAULT_LIMITS = {
    "headline": 30, "description": 90, "callout": 25, "sitelink_text": 25,
    "sitelink_desc": 35, "promo_item": 20,
}
OFFER_PATTERNS = [r"\d+\s*%\s*off", r"black\s*friday", r"cyber\s*monday",
                  r"\bsale\b", r"\bends\s+(nov|dec|jan|today|soon)", r"early\s*bird"]
SCARCITY_PATTERNS = [r"seats?\s+left", r"only\s+\d+\s+seats?", r"almost\s+(full|sold)"]


def _active_promos(rules: dict, on_date: datetime.date) -> list:
    out = []
    for p in rules.get("confirmed_promotions") or []:
        start = datetime.date.fromisoformat(str(p["start"]))
        end = datetime.date.fromisoformat(str(p["end"]))
        if start <= on_date <= end:
            out.append(p)
    return out


def validate_asset(text: str, kind: str, rules: dict, audience: str | None = None,
                   on_date: datetime.date | None = None) -> tuple[bool, str]:
    """Return (ok, reason). audience: e.g. "US", "CA". on_date defaults to today."""
    on_date = on_date or datetime.date.today()
    limits = {**DEFAULT_LIMITS, **rules.get("asset_generation", {}).get("char_limits", {})}
    if kind not in limits:
        return False, f"unknown asset kind {kind!r}"
    if len(text) > limits[kind]:
        return False, f"{kind} over {limits[kind]} chars ({len(text)})"

    low = text.lower()
    copy_rules = rules.get("owner_directives", {}).get("copy", {})
    for phrase in copy_rules.get("blocked_phrases", []):
        if phrase in low:
            alt = copy_rules.get("approved_support_phrase", "")
            return False, f"blocked wording {phrase!r} (owner rule){f' - use {alt!r}' if alt else ''}"

    for pat in SCARCITY_PATTERNS:
        if re.search(pat, low):
            return False, "scarcity claim - seat counts must be verifiable; blocked"
    if re.search(r"\d{1,3}(,\d{3})+\+|\d{4,}\+|\d{3}\+", text):
        return False, "specific large-number claim needs fresh human confirmation"

    if audience and audience.upper() == "US" and copy_rules.get("no_cad_pricing_for_us"):
        if re.search(r"\bCAD\b|CA\$|C\$", text):
            return False, "CAD pricing in copy for a US audience (owner rule)"

    if any(re.search(p, low) for p in OFFER_PATTERNS):
        promos = _active_promos(rules, on_date)
        if not promos:
            return False, "time-bound offer copy with no owner-confirmed promotion active on this date"
        pct = re.search(r"(\d+)\s*%\s*off", low)
        if pct and int(pct.group(1)) not in {int(p.get("percent_off", -1)) for p in promos}:
            return False, f"{pct.group(1)}% off does not match the confirmed promotion"
    return True, "ok"


def validate_final_url(url: str, rules: dict, language: str = "en",
                       on_date: datetime.date | None = None) -> tuple[bool, str]:
    on_date = on_date or datetime.date.today()
    od = rules.get("owner_directives", {})
    site = od.get("site", {})
    if not url.startswith("https://agile-agilist.com/"):
        return False, "final URL must be on https://agile-agilist.com/"
    path = url[len("https://agile-agilist.com"):]
    for bad in site.get("never_use_paths", []):
        if path.startswith(bad):
            return False, f"{bad} pages are one-per-class-date and go stale - never an ad destination"
    if language == "en":
        for bad in site.get("english_campaigns_never_use", []):
            if path.startswith(bad):
                return False, f"{bad} is a translation - not for English campaigns"

    approved = od.get("approved_final_urls", {})
    promo_urls = set((approved.get("promo") or {}).values())
    if url in promo_urls:
        live = {p["landing_page"] for p in _active_promos(rules, on_date)}
        return (True, "ok") if url in live else (False, "promotion page used outside its confirmed dates")
    exact = set()
    for group, entries in approved.items():
        if isinstance(entries, dict) and group != "promo":
            exact.update(entries.values())
    if url in exact:
        return True, "ok"
    if any(url.startswith(p) and url != p for p in approved.get("safe_prefixes", [])):
        return True, "ok"
    return False, "not an approved stable landing page (see owner_directives.approved_final_urls)"


def _selftest(rules: dict) -> int:
    bf = datetime.date(2026, 11, 25)
    after = datetime.date(2026, 12, 2)
    cases = [
        (validate_asset("3,000+ Professionals Trained", "headline", rules), False),
        (validate_asset("Pass Guarantee Included", "headline", rules), False),
        (validate_asset("Exam Prep and Support", "headline", rules), True),
        (validate_asset("Black Friday: 15% Off", "headline", rules, on_date=bf), True),
        (validate_asset("Black Friday: 15% Off", "headline", rules, on_date=after), False),
        (validate_asset("Black Friday: 20% Off", "headline", rules, on_date=bf), False),
        (validate_asset("From CA$2,195 - Exam Included", "description", rules, audience="US"), False),
        (validate_asset("Only 3 seats left!", "headline", rules), False),
        (validate_final_url("https://agile-agilist.com/event/ai-native-value-architect-certification-17/", rules), False),
        (validate_final_url("https://agile-agilist.com/fr/ai-native-foundations/", rules), False),
        (validate_final_url("https://agile-agilist.com/training/ai-native/ai-native-change-agent/", rules), True),
        (validate_final_url("https://agile-agilist.com/training/adv-safe/rte/", rules), True),
        (validate_final_url("https://agile-agilist.com/black-friday/", rules, on_date=bf), True),
        (validate_final_url("https://agile-agilist.com/black-friday/", rules, on_date=after), False),
    ]
    bad = [(i, got) for i, (got, want) in enumerate(cases) if got[0] != want]
    for i, got in bad:
        print(f"FAIL case {i}: {got}")
    print(f"asset_generator selftest: {len(cases) - len(bad)}/{len(cases)} passed")
    return 1 if bad else 0


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "config/rules.yaml"
    with open(path) as f:
        sys.exit(_selftest(yaml.safe_load(f)))
