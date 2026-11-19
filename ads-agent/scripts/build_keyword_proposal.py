"""Build the keyword proposal for owner approval (DRAFT - nothing is added to any account).

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
        ("ASPC (new course)", "https://agile-agilist.com/training/adv-safe/aspc/", False, [
            ("advanced safe practice consultant", "phrase", f"{GSC}: 573 impressions, pos 18.6", "P1"),
            ("aspc certification", "exact", "41 registrations since Feb 2025; its own family", "P1"),
        ]),
        ("Advanced Scrum Master", "https://agile-agilist.com/training/adv-safe/asm/", False, [
            ("asm certification", "phrase", f"{GSC}: 1,300 impressions, pos 10 (biggest single query)", "P1"),
            ("safe advanced scrum master", "phrase", f"{GSC}: 667 impressions, pos 36", "P2"),
        ]),
    ]),
]
NEGATIVES = ["free", "pdf", "jobs", "job", "salary", "practice test", "dumps", "exam answers", "login",
             "reddit", "course hero", "youtube"]


def main() -> int:
    rules = config.load_rules()
    bad, rows, n = [], [], 0
    for campaign, groups in PLAN:
        rows.append(f"\n## {campaign}\n")
        for ag, url, confirmed, kws in groups:
            ok, why = validate_final_url(url, rules)
            if not ok:
                bad.append(f"{ag}: {url} - {why}")
            flag = "" if confirmed else "  \n⚠️ **Confirm this page exists before approving** (slug not on your approved list)."
            rows.append(f"### {ag}\nFinal URL: {url}{flag}\n")
            rows.append("| ✓ | Keyword | Match | Evidence | Priority |\n|---|---|---|---|---|")
            for kw, match, ev, pri in kws:
                if match not in ("exact", "phrase"):
                    bad.append(f"{kw}: match type {match} not allowed")
                shown = f"[{kw}]" if match == "exact" else f'"{kw}"'
                rows.append(f"| ☐ | `{shown}` | {match} | {ev} | {pri} |")
                n += 1
            rows.append("")
    if bad:
        print("PROPOSAL FAILED VALIDATION:\n  " + "\n  ".join(bad))
        return 1

    md = f"""# Keyword proposal, November 2026 (DRAFT for your approval)

**Nothing has been added to any account.** Tick ☐ → ☑ (or just reply with the keywords you
approve). New ad groups always need your approval, and this is that request.

**Rules applied:** phrase and exact match only (no broad match, ever). Every final URL is a
stable course page that passed the validator, never a `/event/`, `/wp-training/` or translated
page. AI trainings are listed first, as you asked.

**Evidence, stated honestly:** I don't have Keyword Planner access, so volumes come from your
own **Google Search Console** export (Mar to Jun 2026: real impressions for your site, five
months old) and from **Google's suggestions in today's recommendations export**. Before you
approve the P2/P3 lines, paste them into Keyword Planner (Tools → Keyword Planner → *Get search
volume and forecasts*) to check volume and CPC. **P1** = strongest evidence; start with these.

**Add in stages, not all at once.** Your handover's lesson was "one change at a time." I'd
suggest the P1 AI-Native keywords this week (Black Friday), then the SAFe P1s on Dec 1 with
the February ramp, then judge each batch after 14 days against *paid registrations*.
{''.join(chr(10) + r for r in rows)}
## Account-level negative keywords (phrase)
{', '.join(f'"{w}"' for w in NEGATIVES)}

(Your Phase-2 junk list also includes "india". GSC shows India is a real market, but these
campaigns target Canada and the US, so the negative is harmless there. Keep it off any future
India campaign.)

## Assessments: use as sitelinks, not as keywords
These are free, instant-result lead magnets, so link them under the matching ads:
- AI-Native ads → **AI Readiness Assessment**: https://agile-agilist.com/assessments/ai-assessment/
- SAFe ads → **Agile Career Selector**: https://agile-agilist.com/assessments/cert-recommender/
- All campaigns → **Career Compass**: https://agile-agilist.com/career-compass/

Total: {n} keywords across {sum(len(g) for _, g in PLAN)} ad groups.
"""
    out = ROOT / "proposals" / "2026-11_keyword-proposal.md"
    out.parent.mkdir(exist_ok=True)
    out.write_text(md)
    print(f"Keyword proposal: {n} keywords, all final URLs validated -> {out.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
