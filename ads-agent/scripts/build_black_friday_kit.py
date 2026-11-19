"""Build + validate the Black Friday 2026 ad kit (Google + Microsoft), as a DRAFT.

Every string runs through src/asset_generator.py (char limits, owner wording rules,
US-safe pricing, and the owner-confirmed 15% / Nov 18-30 promotion). Fails loudly
if anything doesn't pass. Writes proposals/2026-11_black-friday-kit.md.
Nothing is uploaded - Phase 1: you apply it in the Google / Microsoft Ads UI.
"""
import datetime
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
import config  # noqa: E402
from asset_generator import validate_asset, validate_final_url  # noqa: E402

ON = datetime.date(2026, 11, 19)  # first day the ads run
URL = "https://agile-agilist.com/black-friday/"

HEADLINES = [
    "Black Friday: 15% Off",
    "15% Off Every SAFe Class",
    "15% Off AI-Native Courses",
    "Black Friday Ends Nov 30",
    "Exam Prep and Support",
    "Live Online, Exam Included",
    "Any Upcoming Class Date",
    "AI-Native Certification",
    "SAFe RTE, SPC, POPM & More",
    "Earn PDUs & SEUs",
    "Land Your Next Agile Role",
    "Lead AI Change at Work",
]
DESCRIPTIONS = [
    "Black Friday: 15% off every public SAFe and AI-Native class. Offer ends Nov 30.",
    "Live online and instructor-led. Exam included, plus exam prep and support.",
    "Any upcoming class date. The 15% discount is applied automatically at checkout.",
    "Grow your career with AI-Native and SAFe certifications. 15% off until Nov 30.",
]
CALLOUTS = ["15% Off Until Nov 30", "Exam Included", "Live Online Classes", "Exam Prep and Support"]
SITELINK = {"text": "Black Friday: 15% Off", "desc1": "Every public SAFe & AI class",
            "desc2": "Ends Nov 30 - any class date"}
PROMO_ITEM = "SAFe & AI Courses"


def main() -> int:
    rules = config.load_rules()
    checks = [(h, "headline") for h in HEADLINES] + [(d, "description") for d in DESCRIPTIONS] + \
             [(c, "callout") for c in CALLOUTS] + \
             [(SITELINK["text"], "sitelink_text"), (SITELINK["desc1"], "sitelink_desc"),
              (SITELINK["desc2"], "sitelink_desc"), (PROMO_ITEM, "promo_item")]
    bad = []
    for text, kind in checks:
        for aud in ("US", "CA"):
            ok, why = validate_asset(text, kind, rules, audience=aud, on_date=ON)
            if not ok:
                bad.append(f"{kind} {text!r} [{aud}]: {why}")
    ok, why = validate_final_url(URL, rules, on_date=ON)
    if not ok:
        bad.append(f"final URL {URL}: {why}")
    late, _ = validate_asset("Black Friday: 15% Off", "headline", rules, on_date=datetime.date(2026, 12, 1))
    if late:
        bad.append("promo copy still validates on Dec 1 - expiry guard broken")
    if bad:
        print("KIT FAILED VALIDATION:\n  " + "\n  ".join(bad))
        return 1

    n = len(checks)
    md = f"""# Black Friday 2026 - ad kit (DRAFT for your approval)

**Offer (owner-confirmed 2026-11-19):** 15% off every public SAFe and AI-Native class, any upcoming
date, **18-30 Nov 2026**, applied automatically at checkout. Final URL: {URL}

**Validated:** all {n} strings pass `src/asset_generator.py` for both US and Canada audiences on
{ON}: character limits, no "pass guarantee" / "money-back" (uses "exam prep and support"), no CAD
pricing (no prices at all), no scarcity claims, and offer copy only inside the confirmed dates. The
same copy **fails validation from 1 Dec**. That's deliberate, and the daily run emails you to
remove it.

## Where to apply
English campaigns that send people to the website checkout: **Certifications - English,
AI-Native - Virtual, AI-Native - Face-to-Face** (Google and Microsoft). Skip the brand campaign
(people searching your name don't need a discount to find you) and **Certificaciones - Spanish**
(English copy; no Spanish offer page confirmed).

## 1. Promotion asset (Google) / Promotion extension (Microsoft)
| Field | Value |
|---|---|
| Occasion | Black Friday |
| Promotion type | Percent discount: **15%** |
| Item | {PROMO_ITEM} |
| Final URL | {URL} |
| Promotion dates | **19 Nov 2026 to 30 Nov 2026** (the site offer started 18 Nov; ads can't start in the past) |
| Asset/ad schedule end | 30 Nov 2026, 23:59 |
| Language | English |

## 2. Sitelink
| Link text | Description 1 | Description 2 | Final URL | End date |
|---|---|---|---|---|
| {SITELINK['text']} | {SITELINK['desc1']} | {SITELINK['desc2']} | {URL} | 30 Nov 2026 |

## 3. Callouts (set end date 30 Nov)
""" + "\n".join(f"- {c}" for c in CALLOUTS) + """

## 4. Responsive search ad additions
Add these to the **existing** RSAs, or add one Black Friday RSA per ad group. Keep the course
page as the final URL, or use the offer page. Pin "Black Friday: 15% Off" to position 1.

**Headlines**
""" + "\n".join(f"- {h} ({len(h)}/30)" for h in HEADLINES) + """

**Descriptions**
""" + "\n".join(f"- {d} ({len(d)}/90)" for d in DESCRIPTIONS) + """

## 5. Budget for the promo window - your decision
Your trailing spend is about **CA$21/day**, well under the November seasonal band of **~CA$50/day**.
A live 15% offer is a good reason to spend *up to the band*, not past it:
- Raise total daily budget toward **CA$50/day for 19-30 Nov**. That's a move above 20%, so it needs
  your approval under the rules. Per the Microsoft-first rule, give Microsoft the first increase.
- On **1 Dec** the calendar moves to the February-peak ramp (~CA$100/day). That's a separate
  decision, taken once you've seen the Black Friday registrations.

## 6. One claim to confirm before you reuse it
The rules whitelist says **"SAFe Gold Partner"**, but your site title now says **"SAFe® Platinum
Partner"** and some pages say "Platinum SPCT". This kit uses **neither**. Tell me which is current
and I'll update the whitelist, so no ad ever understates or overstates your partner tier.

## Remove on 1 Dec
The promotion asset, sitelink and callouts end automatically if you set the end dates above.
Remove the Black Friday headlines and descriptions by hand. The daily email reminds you on 30 Nov
and 1 Dec.
"""
    out = ROOT / "proposals" / "2026-11_black-friday-kit.md"
    out.parent.mkdir(exist_ok=True)
    out.write_text(md)
    print(f"Black Friday kit: {n} strings validated for US + CA -> {out.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
