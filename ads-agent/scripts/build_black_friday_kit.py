"""Build + validate the Black Friday / Cyber Monday 2026 ad kit (Google + Microsoft).

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

BF_ON, CM_ON = datetime.date(2026, 11, 20), datetime.date(2026, 11, 30)
URL = "https://agile-agilist.com/black-friday/"
EVERY_DAY = [BF_ON, datetime.date(2026, 11, 25), CM_ON]  # RSA copy must pass on all promo days

# RSA headlines/descriptions carry NO event name, so they run 20-30 Nov with no swap on Cyber Monday.
HEADLINES = [
    "15% Off Until Nov 30",
    "15% Off Every SAFe Class",
    "15% Off AI-Native Courses",
    "Offer Ends Nov 30",
    "Exam Prep and Support",
    "SAFe Platinum Partner",
    "Live Online, Exam Included",
    "Any Upcoming Class Date",
    "AI-Native Certification",
    "SAFe RTE, SPC, POPM & More",
    "Earn PDUs & SEUs",
    "Land Your Next Agile Role",
    "Lead AI Change at Work",
]
DESCRIPTIONS = [
    "15% off every public SAFe and AI-Native class, any upcoming date. Offer ends Nov 30.",
    "Live online and instructor-led. Exam included, plus exam prep and support.",
    "Any upcoming class date. The 15% discount is applied automatically at checkout.",
    "Grow your career with AI-Native and SAFe certifications. 15% off until Nov 30.",
]
CALLOUTS = ["15% Off Until Nov 30", "Exam Included", "Live Online Classes", "Exam Prep and Support"]
# Event-named assets: each one is date-scheduled, so Google swaps them for you.
EVENTS = [  # (label, occasion for Google, start, end, sitelink text, sitelink desc2)
    ("Black Friday", "Black Friday", BF_ON, datetime.date(2026, 11, 29),
     "Black Friday: 15% Off", "Any class date, until Nov 30"),
    ("Cyber Monday", "Cyber Monday", CM_ON, CM_ON,
     "Cyber Monday: 15% Off", "Last day: ends tonight"),
]
SITELINK_DESC1 = "Every public SAFe & AI class"
PROMO_ITEM = "SAFe & AI Courses"


def main() -> int:
    rules = config.load_rules()
    bad = []

    def check(text, kind, days):
        for aud in ("US", "CA"):
            for day in days:
                ok, why = validate_asset(text, kind, rules, audience=aud, on_date=day)
                if not ok:
                    bad.append(f"{kind} {text!r} [{aud} {day}]: {why}")

    for t in HEADLINES:
        check(t, "headline", EVERY_DAY)
    for t in DESCRIPTIONS:
        check(t, "description", EVERY_DAY)
    for t in CALLOUTS:
        check(t, "callout", EVERY_DAY)
    check(SITELINK_DESC1, "sitelink_desc", EVERY_DAY)
    check(PROMO_ITEM, "promo_item", EVERY_DAY)
    for _label, _occ, start, end, sl_text, sl_desc2 in EVENTS:
        check(sl_text, "sitelink_text", [start, end])
        check(sl_desc2, "sitelink_desc", [start, end])
    for day, text in [(CM_ON, "Black Friday: 15% Off"), (datetime.date(2026, 11, 29), "Cyber Monday: 15% Off"),
                      (datetime.date(2026, 12, 1), "15% Off Until Nov 30")]:
        if validate_asset(text, "headline", rules, on_date=day)[0]:
            bad.append(f"date guard broken: {text!r} still validates on {day}")
    ok, why = validate_final_url(URL, rules, on_date=BF_ON)
    if not ok:
        bad.append(f"final URL {URL}: {why}")
    if bad:
        print("KIT FAILED VALIDATION:\n  " + "\n  ".join(bad))
        return 1

    n = len(HEADLINES) + len(DESCRIPTIONS) + len(CALLOUTS) + 2 + 2 * len(EVENTS)
    ev_rows = "\n".join(
        f"| {occ} | 15% | {PROMO_ITEM} | {start:%d %b} | {end:%d %b} 23:59 |" for _l, occ, start, end, _t, _d in EVENTS)
    sl_rows = "\n".join(
        f"| {t} | {SITELINK_DESC1} | {d2} | {start:%d %b} | {end:%d %b} |" for _l, _o, start, end, t, d2 in EVENTS)
    md = f"""# Black Friday + Cyber Monday 2026: ad kit (APPROVED; dates updated 20 Nov)

**Offer (owner-confirmed 20 Nov):** 15% off every public SAFe and AI-Native class, any upcoming
date, **20-30 Nov 2026**, applied automatically at checkout. It's labelled **Black Friday on 20-29
Nov** and **Cyber Monday on 30 Nov** (a Monday). Final URL: {URL}

**One change from the version you approved on 19 Nov:** the ad headlines no longer name the event
("15% Off Until Nov 30" instead of "Black Friday: 15% Off"). Only the dated assets below carry
"Black Friday" or "Cyber Monday", and Google switches those on and off by date. So **set it up
once, today, and nothing needs swapping on 30 Nov.**

**Validated:** all {n} strings pass `src/asset_generator.py` for US and Canada on every promo day.
"Black Friday" copy fails from 30 Nov, "Cyber Monday" copy fails before 30 Nov, and all offer copy
fails from 1 Dec. The agent's daily email reminds you.

## Where to apply
English campaigns that send people to the website checkout: **Certifications - English,
AI-Native - Virtual, AI-Native - Face-to-Face** (Google and Microsoft). Skip the brand campaign
and **Certificaciones - Spanish** (English copy; no Spanish offer page).

## 1. Promotion assets (Google) / Promotion extensions (Microsoft): two, pre-scheduled
| Occasion | Discount | Item | Start | End |
|---|---|---|---|---|
{ev_rows}

Final URL for both: {URL}. Language: English.

## 2. Sitelinks: two, pre-scheduled
| Link text | Description 1 | Description 2 | Start | End |
|---|---|---|---|---|
{sl_rows}

## 3. Callouts (end date 30 Nov)
""" + "\n".join(f"- {c}" for c in CALLOUTS) + """

## 4. Responsive search ad additions (run 20-30 Nov, no swap needed)
Add these to the existing RSAs (or one offer RSA per ad group). Pin "15% Off Until Nov 30" to
position 1. **If you already added "Black Friday: 15% Off" or "Black Friday Ends Nov 30" from the
19 Nov version, replace them with the first and fourth headlines below.** Otherwise they would
still say Black Friday on Cyber Monday.

**Headlines**
""" + "\n".join(f"- {h} ({len(h)}/30)" for h in HEADLINES) + """

**Descriptions**
""" + "\n".join(f"- {d} ({len(d)}/90)" for d in DESCRIPTIONS) + """

## 5. Budget for the promo window: your decision
Trailing spend is about **CA$21/day**, under the November band of **~CA$50/day**. A live 15% offer
justifies spending *up to the band*, not past it: raise toward **CA$50/day for 20-30 Nov** (a
change above 20%, so it needs your OK; give Microsoft the first increase). On **1 Dec** the calendar
moves to the February ramp (~CA$100/day), which is a separate decision.

## 6. Website
The /black-friday/ page currently says **23-30 Nov**. It needs to say **20-30 Nov**, with 30 Nov
as Cyber Monday, so the ads and the page agree (`proposals/2026-11_site-fixes.md`, item 1.3).

## Apply checklist (about 20 minutes, once)
**Google Ads**
1. Select **Certifications - English, AI-Native - Virtual, AI-Native - Face-to-Face** → Assets →
   **+ Promotion** twice (table 1): Black Friday 20-29 Nov, Cyber Monday 30 Nov (set each one's
   start and end dates).
2. Same campaigns: **+ Sitelink** twice (table 2, each with its dates) and **+ Callouts** (end 30 Nov).
3. Each RSA: add the section 4 headlines and descriptions, pin "15% Off Until Nov 30" to
   position 1, and remove any old "Black Friday" headlines.
4. Next morning: Tools → Policy manager → fix anything "Limited" or "Disapproved".

**Microsoft Ads: by hand, not "Import from Google Ads"**
5. The import can overwrite your tracking suffixes (your rule). Add the two promotion extensions,
   the sitelinks and the callouts manually, with the same dates. No images or multimedia assets.

## 1 Dec
Dated assets end on their own. Remove the section 4 headlines and descriptions by hand. The daily
email reminds you on 30 Nov and 1 Dec.
"""
    out = ROOT / "proposals" / "2026-11_black-friday-kit.md"
    out.write_text(md)
    print(f"Black Friday + Cyber Monday kit: {n} strings validated for US + CA -> {out.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
