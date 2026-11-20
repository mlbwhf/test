"""Build the approved keyword plan + Google Ads Editor import files (Phase 1: the owner imports them).

Every final URL runs through validate_final_url (approved stable pages only; never
/event/, /wp-training/ or translations). Phrase/exact match only (no broad, ever).
Evidence per keyword: Google Search Console (Mar-Jun 2026 export, gsc-search-analysis.md)
and Google's own suggestions from the 2026-11-19 recommendations export.
Writes proposals/2026-11_keyword-proposal.md.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
import config  # noqa: E402
from asset_generator import validate_final_url  # noqa: E402

A = "https://agile-agilist.com/training/ai-native/"
GSC = "GSC"
GADS = "Google suggestion 2026-11-19"

# (ad group, final URL, confirmed_url, [(keyword, match, evidence, priority)])
PLAN = [
    ("AI-Native - Face-to-Face", [
        ("AI-Native Foundations", A + "ai-native-foundations/", True, [
            ("ai native foundations", "exact", f"{GSC}: 596 impressions, avg pos 13, 0 clicks", "P1"),
            ("ai native foundations certification", "phrase", f"{GSC}: same query family", "P1"),
            ("ai native certification", "phrase", "Course name; you are the only Canadian F2F provider", "P1"),
            ("ai training toronto", "phrase", "In-person class; Toronto is your top Canadian city", "P2"),
            ("ai upskilling course", "phrase", "Career-progression intent", "P3"),
        ]),
    ]),
    ("AI-Native - Virtual", [
        ("AI-Native SAFe Fundamentals", A + "ai-native-ready-certification/", True, [
            ("safe ai native", "phrase", f"{GSC}: avg pos 14", "P1"),
            ("ai native safe", "phrase", f"{GSC}: same query family", "P2"),
        ]),
        ("AI-Native Value Architect", A + "ai-native-change-agent/", True, [
            ("ai native value architect", "phrase", "Course name (new course - no history yet)", "P1"),
            ("ai change agent certification", "phrase", "Audience: change agents / SPCs", "P2"),
            ("ai transformation certification", "phrase", "Audience: transformation leads", "P3"),
        ]),
        ("Launching AI-Native ARTs", A + "launching-ai-native-arts/", True, [
            ("safe art leader certification", "phrase", "The certification the course awards", "P1"),
            ("art leader certification", "exact", "Same intent, exact control", "P2"),
            ("launching ai native arts", "phrase", "Course name", "P2"),
        ]),
        ("Leading the AI-Native Organization", A + "ai-native-ready-certification-2/", True, [
            ("ai leadership training for executives", "phrase", "Executive workshop intent", "P2"),
            ("ai strategy workshop for leaders", "phrase", "Executive workshop intent", "P3"),
        ]),
    ]),
    ("Certifications - English (February-peak SAFe)", [
        ("RTE Training", "https://agile-agilist.com/training/adv-safe/rte/", True, [
            ("safe rte certification", "phrase", "Core RTE intent (164 registrations, your #1 family)", "P1"),
            ("release train engineer certification", "phrase",
             f"{GADS} was 'release train engineer'; narrowed to the certification intent", "P1"),
            ("safe agile rte training", "phrase", f"{GADS}", "P2"),
        ]),
        ("SPC Certification", "https://agile-agilist.com/training/adv-safe/spc/", True, [
            ("safe practice consultant", "phrase", f"{GSC}: 575 impressions, pos 20", "P1"),
            ("spc certification", "exact", "Core SPC intent (149 registrations)", "P1"),
        ]),
        ("POPM", "https://agile-agilist.com/training/safe/popm/", True, [
            ("popm certification", "phrase", f"{GSC}: 941 impressions, pos 28", "P1"),
            ("product owner product manager certification", "phrase", f"{GADS}", "P2"),
        ]),
        ("Lean Portfolio Management", "https://agile-agilist.com/training/adv-safe/lpm/", True, [
            ("lean portfolio management training", "phrase", f"{GSC}: 684 impressions, pos 52", "P2"),
            ("safe lpm certification", "phrase", f"{GSC}: 562 impressions, pos 39", "P2"),
        ]),
        ("SAFe DevOps", "https://agile-agilist.com/training/safe/devops/", True, [
            ("safe devops certification", "phrase", f"{GSC}: 787 impressions, pos 28", "P2"),
        ]),
        ("ASPC (new course)", "https://agile-agilist.com/training/adv-safe/aspc/", True, [
            ("advanced safe practice consultant", "phrase", f"{GSC}: 573 impressions, pos 18.6", "P1"),
            ("aspc certification", "exact", "41 registrations since Feb 2025; its own family", "P1"),
        ]),
        ("Advanced Scrum Master", "https://agile-agilist.com/training/safe/asm/", True, [
            ("asm certification", "phrase", f"{GSC}: 1,300 impressions, pos 10 (biggest single query)", "P1"),
            ("safe advanced scrum master", "phrase", f"{GSC}: 667 impressions, pos 36", "P2"),
        ]),
    ]),
]
NEGATIVES = ["free", "pdf", "jobs", "job", "salary", "practice test", "dumps", "exam answers", "login",
             "reddit", "course hero", "youtube"]


# Owner decision (Mark Saymen, 2026-11-20): all keywords approved. Ad groups whose landing page
# is not confirmed stay on hold (never shipped to a guessed URL).
APPROVED_ON = "2026-11-20"
ON_HOLD: dict = {}  # ad group -> reason (ASM released 2026-11-20: owner sent /training/safe/asm/)
# Single keywords held back: landing page contradicts the keyword's promise.
HOLD_KW = {"ai training toronto": "The English AI-Native Foundations page says *live online*, while this keyword "
                                  "(and the Face-to-Face campaign) promise an in-person Toronto class. Confirm the "
                                  "format and I'll release it."}
# Campaign names exactly as in Google Ads (heading text before any parenthesis).
CAMPAIGN_NAME = {"Certifications - English (February-peak SAFe)": "Certifications - English"}
STAGES = [
    ("stage1", "Now (20 Nov, Black Friday)", lambda camp, pri: camp.startswith("AI-Native") and pri == "P1"),
    ("stage2", "1 Dec (February ramp)", lambda camp, pri: not camp.startswith("AI-Native") and pri == "P1"),
    ("stage3", "Not before 4 Dec, after stage 1 has run 14 days", lambda camp, pri: pri in ("P2", "P3")),
]


def stage_of(campaign: str, pri: str) -> str:
    return next(key for key, _, test in STAGES if test(campaign, pri))


def main() -> int:
    import csv
    rules = config.load_rules()
    bad, rows, n = [], [], 0
    csv_rows = {key: [] for key, _, _ in STAGES}
    held = 0
    for campaign, groups in PLAN:
        camp_name = CAMPAIGN_NAME.get(campaign, campaign)
        rows.append(f"\n## {campaign}\n")
        for ag, url, confirmed, kws in groups:
            ok, why = validate_final_url(url, rules)
            if not ok and ag not in ON_HOLD:
                bad.append(f"{ag}: {url} - {why}")
            if ag in ON_HOLD:
                flag = f"  \n⏸️ **On hold:** {ON_HOLD[ag]}"
            elif not confirmed:
                bad.append(f"{ag}: landing page not confirmed")
                flag = ""
            else:
                flag = ""
            rows.append(f"### {ag}\nFinal URL: {url}{flag}\n")
            rows.append("| ✓ | Keyword | Match | Evidence | Priority | Stage |\n|---|---|---|---|---|---|")
            for kw, match, ev, pri in kws:
                if match not in ("exact", "phrase"):
                    bad.append(f"{kw}: match type {match} not allowed")
                shown = f"[{kw}]" if match == "exact" else f'"{kw}"'
                if ag in ON_HOLD or kw in HOLD_KW:
                    mark, stage = "⏸️", "hold"
                    held += 1
                    if kw in HOLD_KW:
                        ev = f"{ev}. **On hold:** {HOLD_KW[kw]}"
                else:
                    mark, stage = "☑", stage_of(campaign, pri)
                    csv_rows[stage].append([camp_name, ag, kw, match.capitalize(), url, "Enabled"])
                rows.append(f"| {mark} | `{shown}` | {match} | {ev} | {pri} | {stage} |")
                n += 1
            rows.append("")
    if bad:
        print("PROPOSAL FAILED VALIDATION:\n  " + "\n  ".join(bad))
        return 1

    # Account-wide negatives ride along with stage 1, once per campaign.
    for camp_name in dict.fromkeys(CAMPAIGN_NAME.get(c, c) for c, _ in PLAN):
        for w in NEGATIVES:
            csv_rows["stage1"].append([camp_name, "", w, "Campaign negative phrase", "", "Enabled"])

    out_dir = ROOT / "proposals"
    out_dir.mkdir(exist_ok=True)
    header = ["Campaign", "Ad group", "Keyword", "Criterion Type", "Final URL", "Status"]
    files = []
    for key, when, _ in STAGES:
        f = out_dir / f"2026-11_keywords_{key}_google-ads-editor.csv"
        with f.open("w", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(header)
            w.writerows(csv_rows[key])
        kw_count = sum(1 for r in csv_rows[key] if "negative" not in r[3].lower())
        files.append(f"| {key[-1]} | {when} | {kw_count} | `proposals/{f.name}` |")
    approved = n - held

    md = f"""# Keyword plan, November 2026: APPROVED

**Approved by Mark Saymen on {APPROVED_ON}.** {approved} keywords approved and ready to import;
{held} on hold until their English landing page is confirmed. Phase 1: **you** import them. I
haven't touched the ad accounts.

**Rules applied:** phrase and exact match only (no broad match, ever). Every final URL is a
stable course page that passed the validator: never `/event/`, `/wp-training/` or a translation.
AI trainings first.

**How these are judged: website Stripe payments only.** The only conversion that counts is
`Website Purchase - Paid Registration`, a Stripe payment made through the agile-agilist.com
checkout. Eventbrite and Corsizio sales are recorded for our own data and never count for a
keyword. Until that goal is live (tracking proposal, section 4), judge each stage on the agent's
Stripe numbers, not on the "Conversions" column.

## Import plan: one stage at a time
| Stage | When | Keywords | File |
|---|---|---|---|
{chr(10).join(files)}

Stage 1 also adds the {len(NEGATIVES)} negative keywords to each campaign.

**How to import (Google Ads Editor):** *Account → Import → From file*, pick the stage's CSV,
**review the changes**, then *Post*. Google only: don't import these into Microsoft Ads, because
a Google import can overwrite the tracking suffixes you want kept.

**Before posting, check:**
1. **Ad group names.** If the CSV names an ad group the campaign doesn't have yet, Editor creates
   it **with no ads**, and an ad group with no ads won't serve. Each new ad group needs a
   responsive search ad (I can draft them, validated against your copy rules).
2. **Bidding stays as it is.** No change to bid strategies; your rule still blocks smart bidding
   below 15 verified registrations in 30 days.
3. **Stage 3 is a go/no-go.** After stage 1 has run for 14 days, import stage 3 only if stage 1
   produced website payments at a cost you accept. Otherwise skip it and tell me why.
{''.join(chr(10) + r for r in rows)}
## Negative keywords (phrase, every campaign)
{', '.join(f'"{w}"' for w in NEGATIVES)}

(Your Phase-2 junk list also includes "india". GSC shows India is a real market, but these
campaigns target Canada and the US, so the negative is harmless there. Keep it off any future
India campaign.)

## Assessments: use as sitelinks, not as keywords
These are free, instant-result lead magnets, so link them under the matching ads:
- AI-Native ads → **AI Readiness Assessment**: https://agile-agilist.com/assessments/ai-assessment/
- SAFe ads → **Agile Career Selector**: https://agile-agilist.com/assessments/cert-recommender/
- All campaigns → **Career Compass**: https://agile-agilist.com/career-compass/

Total: {n} keywords across {sum(len(g) for _, g in PLAN)} ad groups ({approved} approved, {held} on hold).
"""
    out = out_dir / "2026-11_keyword-proposal.md"
    out.write_text(md)
    print(f"Keyword plan: {approved} approved, {held} on hold -> {out.relative_to(ROOT)}")
    for key, _, _ in STAGES:
        print(f"  {key}: {len(csv_rows[key])} rows")
    return 0


if __name__ == "__main__":
    sys.exit(main())
