"""Draft one responsive search ad (RSA) per new ad group in the approved keyword plan.

Evergreen copy (no offer wording), so the ads stay valid after Black Friday. Every string runs
through src/asset_generator.py for US and Canada audiences, both during and after the promotion.
Facts come only from each course's English page on agile-agilist.com (read 2026-11-20).
Writes proposals/2026-11_rsa-drafts.md + one Google Ads Editor CSV per keyword stage.
Phase 1: nothing is uploaded; the owner imports them.
"""
import csv
import datetime
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))
import config  # noqa: E402
from asset_generator import validate_asset, validate_final_url  # noqa: E402
from build_keyword_proposal import (CAMPAIGN_NAME, HOLD_KW, LAUNCH_HOLD, LAUNCH_HOLD_REASON, ON_HOLD,  # noqa: E402
                                    PLAN, PROPOSED, STAGES, stage_of)

CHECK_DATES = [datetime.date(2026, 11, 20), datetime.date(2026, 12, 15)]  # during + after the promo
PP, EPS, EXAM = "SAFe Platinum Partner", "Exam Prep and Support", "Exam Included"
# Claims the OWNER confirmed in chat that the course page does not state yet (web team to add).
OWNER_CONFIRMED = {
    "Launching AI-Native ARTs": "PI Planning in one day / PI Outcome Planning (Mark, 2026-11-20). "
                                "Only in the blog today; add it to the course page so the ad matches it. "
                                "Schedule (Mark, 2026-11-24): classes start every Monday and Thursday, plus "
                                "weekend classes twice a month. Keep the course calendar showing that, or "
                                "remove the schedule lines from the ad.",
}

# ad group -> (path1, path2, facts used + source, headlines, descriptions)
# Facts: each course's English page (full read 2026-11-20). Left out on purpose: ratings, graduate
# counts, employer logos, unsourced statistics, refund wording, and any detail the site contradicts.
ADS = {
    "AI-Native Foundations": ("AI-Native", "Foundations",
        "2 days, prompt engineering, daily workflows, ethics, tool selection, 30-day plan, guardrails, "
        "exam, 1:1 career coaching. Delivery format left out: the site says both online-only and in-person.",
        ["AI-Native Foundations", "AI-Native Foundations Cert", "AI Native Certification",
         "Become AI-Fluent in 2 Days", "Master Prompt Engineering", "Build Daily AI Workflows",
         "Practical AI Guardrails", "Your 30-Day AI Habit Plan", "1:1 Career Coaching Included",
         "Pick the Right AI Tools", "Start Your AI-Native Path", "Upskill in AI for Your Career",
         EXAM, EPS, PP],
        ["Become AI-fluent in two days: prompt engineering, daily AI workflows, ethics and tools.",
         "Practical guardrails for confidentiality, bias, hallucination and IP at work.",
         "Exam included, plus a 1:1 career-coaching session and exam prep and support.",
         "The first step on the AI-Native path and the prerequisite for Value Architect."]),
    "AI-Native SAFe Fundamentals": ("AI-Native", "Fundamentals",
        "One day, no prerequisites, core concepts + shared language + operating model, AI Innovation "
        "Pipeline (experiment to value), exam, for leaders who need a common language for AI.",
        ["AI-Native SAFe Fundamentals", "SAFe AI-Native Course", "AI-Native SAFe in One Day",
         "One-Day AI-Native Course", "No Prerequisites", "AI Innovation Pipeline",
         "Shared Language for AI + SAFe", "From AI Experiment to Value", "A Common AI Language",
         "Start With AI-Native SAFe", EXAM, EPS, PP],
        ["One day: AI-Native SAFe core concepts, shared language and the operating model.",
         "Learn the AI Innovation Pipeline: how AI ideas move from experiment to value.",
         "No prerequisites. Exam included, with exam prep and support.",
         "For leaders who need a common language for AI. See upcoming dates and register."]),
    "AI-Native Value Architect": ("AI-Native", "Value-Architect",
        "Lead enterprise AI adoption: diagnose readiness, roadmap, habits, govern risk, measure change. "
        "2 days live online, exam. AI-Native Foundations is a hard prerequisite.",
        ["AI-Native Value Architect", "Value Architect Certification", "AI Change Agent Certification",
         "Lead Enterprise AI Adoption", "Build Your AI Roadmap", "Diagnose AI Readiness",
         "Govern AI Risk, Measure Change", "Beyond Copilots: Scale AI", "After AI-Native Foundations",
         "2 Days Live Online", "Lead AI Change at Work", EXAM, EPS, PP],
        ["Lead enterprise AI adoption: diagnose readiness, build the roadmap and govern risk.",
         "Go beyond personal AI fluency to drive AI habits and measure sustained change.",
         "Two days live online, exam included. AI-Native Foundations is required first.",
         "Become the person who leads AI change at work. See upcoming dates and register."]),
    "Launching AI-Native ARTs": ("AI-Native", "ART-Leader",
        "Page: 2 days live online, authorized SAFe instructor, SAFe ART Leader exam, 15 PDUs, no required "
        "prerequisites, 12 critical success factors, live launch-readiness assessment, launch plan, "
        "evolving roles; audience RTEs, PMs, System Architects. Owner-confirmed: PI Outcome Planning; "
        "classes every Monday and Thursday plus weekends twice a month.",
        ["Launching AI-Native ARTs", "SAFe ART Leader Certification", "PI Planning in One Day",
         "Learn PI Outcome Planning", "From PI Objectives to Outcomes", "12 AI-Native Success Factors",
         "ART Launch Readiness Check", "Leave With an ART Launch Plan", "For RTEs, PMs & Architects",
         "Starts Every Monday & Thursday", "Weekend Classes Twice a Month", "2 Days Live Online, 15 PDUs",
         EPS, PP],
        ["PI Planning becomes one-day PI Outcome Planning. Learn to run it for an AI-Native ART.",
         "Assess your ART's launch readiness live in class and leave with a plan for Monday.",
         "Two days live online, exam included. New classes start every Monday and Thursday.",
         "For RTEs, PMs and System Architects. Weekend classes twice a month, no prerequisites."]),
    "Leading the AI-Native Organization": ("AI-Native", "Leaders",
        "2-day executive cohort capped at 12 (CEOs, COOs, CTOs, CAIOs), 6 months follow-up coaching, capital "
        "allocation, board oversight, talent, vision; 16 PDUs, no prerequisites, capstone. Format left "
        "out: the site says both online and in-person.",
        ["Leading the AI-Native Org", "AI Leadership for Executives", "AI Strategy for Leaders",
         "Executive AI Workshop", "For CEOs, COOs, CTOs & CAIOs", "Capped at 12 Senior Leaders",
         "6 Months of Follow-Up Coaching", "Board Oversight of AI", "Capital Allocation for AI",
         "2-Day Executive Cohort", "Lead Your AI Transformation", "Taught by an SPCT",
         "16 PDUs, No Prerequisites", PP],
        ["A 2-day executive cohort capped at 12 senior leaders, with 6 months of coaching.",
         "Capital allocation for AI, board oversight, talent and communicating the vision.",
         "For CEOs, COOs, CTOs and CAIOs setting AI direction. No prerequisites, 16 PDUs.",
         "Training a leadership team? Ask about private classes on your dates."]),
    "RTE Training": ("SAFe", "RTE",
        "3 days live virtual, 16 PDUs, exam; PI Planning, Inspect & Adapt, ROAM, Scrum of Scrums; "
        "SPC/ASPC instructor. Prerequisites and 'SPCT-led' left out: the page contradicts itself.",
        ["SAFe RTE Certification", "Release Train Engineer Cert", "SAFe Release Train Engineer",
         "RTE Training, Live Virtual", "3-Day SAFe RTE Course", "Facilitate PI Planning",
         "Master Inspect & Adapt", "Lead Your Agile Release Train", "Advance Your Agile Career",
         "16 PDUs, Exam Included", "Authorized SAFe Instructor", EPS, PP],
        ["Coach the Agile Release Train: PI Planning, Inspect & Adapt, ROAM and Scrum of Scrums.",
         "Three days, live virtual, with an authorized SAFe instructor. 16 PDUs, exam included.",
         "Taught at a SAFe Platinum Partner, with exam prep and support for every learner.",
         "Move into a Release Train Engineer role. See upcoming class dates and register."]),
    "SPC Certification": ("SAFe", "SPC",
        "Implementing SAFe; 4 days live virtual, led by SPCTs, 16 PDUs, exam; licensed to teach SAFe "
        "courses; included SAFe Studio year renews your SAFe certifications.",
        ["SPC Certification", "SAFe Practice Consultant", "Implementing SAFe (SPC)",
         "Become a Certified SPC", "4-Day Live Virtual SPC Class", "Lead a SAFe Transformation",
         "Teach & Coach SAFe", "Renews Your SAFe Certs", "Advance Your Agile Career",
         "16 PDUs, Exam Included", "SPCT-Led Training", EPS, PP],
        ["Implementing SAFe with SPC certification: lead a Lean-Agile transformation at scale.",
         "Four days, live virtual, led by SPCTs. 16 PDUs, exam included.",
         "Get licensed to teach SAFe courses. Your SAFe Studio year renews your SAFe certs.",
         "Learn from a SAFe Platinum Partner, with exam prep and support. See class dates."]),
    "POPM": ("SAFe", "POPM",
        "2 days live virtual, 16 PDUs, exam; own the backlog, lead PI Planning, Lean UX, Design Thinking.",
        ["POPM Certification", "SAFe Product Owner/Manager", "SAFe POPM Training",
         "Product Owner Certification", "Product Manager Certification", "2-Day Live Virtual POPM",
         "Lead PI Planning as a PO/PM", "Lean UX & Design Thinking", "16 PDUs, Exam Included",
         "Advance Your Agile Career", EPS, PP],
        ["Own the backlog, lead PI Planning and apply Lean UX and Design Thinking.",
         "SAFe Product Owner / Product Manager certification. Two days, live virtual, 16 PDUs.",
         "Exam included, with exam prep and support. Taught at a SAFe Platinum Partner.",
         "Step up into a product role. See upcoming POPM class dates and register online."]),
    "Lean Portfolio Management": ("SAFe", "LPM",
        "2 days + optional workshop day, live virtual, 16 PDUs, exam; fund value streams not projects, "
        "Lean Budget Guardrails, Portfolio Kanban with WSJF, Value Management Office.",
        ["SAFe LPM Certification", "Lean Portfolio Management", "LPM Training, Live Virtual",
         "Fund Value Streams", "Lean Budget Guardrails", "Portfolio Kanban With WSJF",
         "Set Up a Value Mgmt Office", "For Portfolio Leaders", "16 PDUs, Exam Included", EPS, PP],
        ["Fund value streams instead of projects, with Lean Budget Guardrails and Portfolio Kanban.",
         "Two days live virtual, plus an optional workshop day. 16 PDUs, exam included.",
         "Taught at a SAFe Platinum Partner, with exam prep and support for every learner.",
         "For portfolio, PMO and finance leaders. See upcoming class dates and register."]),
    "SAFe DevOps": ("SAFe", "DevOps",
        "SAFe DevOps Practitioner; 3 days live virtual, 16 PDUs, exam; map the CDP with value stream "
        "mapping; separate deploy from release.",
        ["SAFe DevOps Certification", "SAFe DevOps Practitioner", "SAFe DevOps Training",
         "3-Day Live Virtual DevOps", "Map Your Delivery Pipeline", "Separate Deploy From Release",
         "Value Stream Mapping for CDP", "16 PDUs, Exam Included", "Advance Your Agile Career", EPS, PP],
        ["Map your Continuous Delivery Pipeline from idea to production with value stream mapping.",
         "Separate deploy from release. Three days, live virtual, 16 PDUs, exam included.",
         "Taught at a SAFe Platinum Partner, with exam prep and support.",
         "For engineers, operations and release roles. See class dates and register online."]),
    "ASPC (new course)": ("SAFe", "ASPC",
        "4 days live virtual, 16 PDUs, exam, requires a current SPC; teach the advanced courses; the only "
        "path to SPCT.",
        ["ASPC Certification", "Advanced SAFe (ASPC)", "Adv. SAFe Practice Consultant",
         "For Certified SPCs", "4-Day Live Virtual ASPC", "The Next Step After SPC", "The Only Path to SPCT",
         "Teach Advanced SAFe Courses", "Sustain SAFe Transformations", "16 PDUs, Exam Included", EPS, PP],
        ["Advanced SAFe Practice Consultant: the next step for SPCs leading change at scale.",
         "Four days, live virtual, 16 PDUs, exam included. Requires a current SPC.",
         "Teach the advanced SAFe courses and take the only path toward SPCT.",
         "Taught at a SAFe Platinum Partner, with exam prep and support. See class dates."]),
    "Advanced Scrum Master": ("SAFe", "ASM",
        "2 days live virtual, 16 PDUs, exam; cross-team facilitation, flow across the ART; SSM = one team, "
        "SASM = multiple teams. Prerequisites left out: the page contradicts itself.",
        ["SAFe Advanced Scrum Master", "ASM Certification", "SASM Certification",
         "Advanced Scrum Master Course", "2-Day Live Virtual ASM", "Coach Across Multiple Teams",
         "Accelerate Flow Across the ART", "Beyond a Single Scrum Team", "16 PDUs, Exam Included",
         "Advance Your Agile Career", EPS, PP],
        ["Facilitate cross-team work and accelerate flow across the Agile Release Train.",
         "Grow from leading one Scrum team to coaching across multiple teams in SAFe.",
         "SAFe Advanced Scrum Master certification. Two days, live virtual, 16 PDUs.",
         "Exam included, with exam prep and support. Taught at a SAFe Platinum Partner."]),
    # --- Proposed 2026-11-21 (owner asked for drafts; need approval). Facts: full English pages.
    "Agile Product Management": ("SAFe", "APM",
        "3 days, no prerequisites, exam included; Design Thinking, continuous exploration, Lean Startup, "
        "MVPs, hypothesis-driven epics, vision/roadmap/OKRs, WSJF. Format and PDUs left out: the page "
        "contradicts itself on delivery, and its 16 PDUs look templated.",
        ["SAFe APM Certification", "Agile Product Management", "SAFe Agile Product Manager",
         "Product Manager Certification", "Design Products Customers Love", "Design Thinking at Scale",
         "Lean Startup & MVPs", "Vision, Roadmaps & OKRs", "Hypothesis-Driven Epics", "3-Day APM Course",
         "No Prerequisites", "For Product Managers & Leads", EXAM, EPS, PP],
        ["Design and deliver products customers love with Design Thinking and Lean Startup.",
         "Vision, roadmaps, OKRs and WSJF that connect product decisions to portfolio outcomes.",
         "Three days, no prerequisites. Exam included, with exam prep and support.",
         "For Product Managers and Directors of Product. Taught at a SAFe Platinum Partner."]),
    "Business Owner": ("SAFe", "Business-Owner",
        "2 days, no prerequisites, exam included; connect strategy to execution, business value for PI "
        "Objectives, PI Planning, Inspect & Adapt, System Demos. Format and PDUs left out (as APM).",
        ["SAFe Business Owner", "Business Owner Certification", "SAFe Business Owner Workshop",
         "Connect Strategy to Execution", "Set Business Value for PIs", "Your Role in PI Planning",
         "Lead Inspect & Adapt", "For Executives & Sponsors", "2-Day Business Owner Course",
         "No Prerequisites", EXAM, EPS, PP],
        ["Connect strategy to execution and assign business value to PI Objectives every PI.",
         "Take part in PI Planning, lead Inspect & Adapt and stay engaged through System Demos.",
         "Two days, no prerequisites. Exam included, with exam prep and support.",
         "For business owners, VPs of strategy and executive sponsors. See class dates."]),
    "SAFe for Architects": ("SAFe", "Architects",
        "3 days, no prerequisites, exam included; Lean-Agile technical strategy, architecture aligned to "
        "value, DevOps and Release on Demand, solution vision and roadmaps, architecture for PI Planning. "
        "Format and PDUs left out (as APM).",
        ["SAFe for Architects", "SAFe Architect Certification", "SAFe ARCH Certification",
         "Lead Lean-Agile Tech Strategy", "Architect for DevOps", "Release on Demand",
         "Solution Vision & Roadmaps", "Architecture for PI Planning", "For Enterprise Architects",
         "3-Day SAFe Architect Course", "No Prerequisites", EXAM, EPS, PP],
        ["Lead the technical strategy of a Lean-Agile enterprise and align architecture to value.",
         "Architect for DevOps and Release on Demand, and prepare architecture for PI Planning.",
         "Three days, no prerequisites. Exam included, with exam prep and support.",
         "For system, solution and enterprise architects. Taught at a SAFe Platinum Partner."]),
    # --- Innovation Framework certifications: drafted, HELD until bookable. Not SAFe courses, so no
    # SAFe claims; badge issued by Agile Agilist. Workshop counts left out (pages say 7 and 14).
    "Innovation Creator": ("Innovation", "Creator",
        "Level 1, 2 days, no prerequisite, live and instructor-led; run the Innovation Framework with "
        "your team, facilitate the Innovation Matrix, leave with 3 artifacts. Works alongside SAFe.",
        ["Innovation Creator Cert", "Innovation Certification", "Run Innovation With Your Team",
         "Learn the Innovation Matrix", "Leave With 3 Team Artifacts", "Built on Two Chasms Framework",
         "2 Days, No Prerequisite", "For Scrum Masters & POs", "Live, Instructor-Led",
         "Innovation on Cadence", "Join the Launch List"],
        ["Run the Innovation Framework with your own team and facilitate the Innovation Matrix.",
         "Leave with three artifacts your team keeps: a charter, a Candor Contract and a matrix.",
         "Two days, live and instructor-led, no prerequisite. Works alongside SAFe.",
         "Certifications are launching soon. Join the launch list for first dates and prices."]),
    "Innovation Facilitator": ("Innovation", "Facilitator",
        "Level 2, 3 days, Creator recommended; capstone simulation; licence to facilitate the workshops "
        "in your organization; 30-60-90 day plan; for agile coaches, RTEs, SPCs, innovation leads.",
        ["Innovation Facilitator Cert", "Innovation Facilitator Course", "Licensed to Run the Workshops",
         "Facilitate Innovation In-House", "Capstone-Based Certification", "Build a 30-60-90 Day Plan",
         "For Agile Coaches, RTEs, SPCs", "3 Days, Live & Instructor-Led", "Innovation on Cadence",
         "Built on Two Chasms Framework", "Join the Launch List"],
        ["Get licensed to facilitate the Innovation Framework workshops inside your organization.",
         "Pass a capstone simulation and turn the results into a 30-60-90 day plan.",
         "For agile coaches, RTEs, SPCs and innovation leads. Innovation Creator recommended.",
         "Certifications are launching soon. Join the launch list for first dates and prices."]),
    "Innovation Leader": ("Innovation", "Leader",
        "Executive level, 1 day, no prerequisite; protect the explore budget with governance, the "
        "two-out-of-sixteen choice, the Rebrand Test.",
        ["Innovation Leader Cert", "Innovation for Executives", "Innovation Leadership Day",
         "Protect the Explore Budget", "Governance, Not Goodwill", "Run the Rebrand Test",
         "1-Day Executive Session", "No Prerequisite", "Innovation on Cadence",
         "Built on Two Chasms Framework", "Join the Launch List"],
        ["Protect the explore budget with governance instead of goodwill. One executive day.",
         "Make the two-out-of-sixteen choice and run the Rebrand Test on your transformation.",
         "No prerequisite. Live and instructor-led, built on the Two Chasms Framework.",
         "Certifications are launching soon. Join the launch list for first dates and prices."]),
}


def main() -> int:
    rules = config.load_rules()
    bad, sections = [], []
    per_stage = {key: [] for key, _, _ in STAGES}
    n_strings = 0
    for campaign, groups in PLAN:
        camp = CAMPAIGN_NAME.get(campaign, campaign)
        for ag, url, _confirmed, kws in groups:
            if ag in ON_HOLD:
                continue
            if ag not in ADS:
                bad.append(f"{ag}: no ad drafted")
                continue
            p1, p2, note, heads, descs = ADS[ag]
            live = [(kw, pri) for kw, _m, _e, pri in kws if kw not in HOLD_KW]
            stage = min(stage_of(campaign, pri, ag) for _kw, pri in live)
            if not 10 <= len(heads) <= 15 or len(descs) != 4:
                bad.append(f"{ag}: {len(heads)} headlines / {len(descs)} descriptions")
            for group in (heads, descs):
                if len({t.lower() for t in group}) != len(group):
                    bad.append(f"{ag}: duplicate text")
            ok, why = validate_final_url(url, rules)
            if not ok:
                bad.append(f"{ag}: {url} - {why}")
            checks = [(h, "headline") for h in heads] + [(d, "description") for d in descs] + \
                     [(p1, "display_path"), (p2, "display_path")]
            for text, kind in checks:
                n_strings += 1
                for aud in ("US", "CA"):
                    for day in CHECK_DATES:
                        ok, why = validate_asset(text, kind, rules, audience=aud, on_date=day)
                        if not ok:
                            bad.append(f"{ag} {kind} {text!r} [{aud} {day}]: {why}")
            if stage != "hold":
                per_stage[stage].append([camp, ag, "Responsive search ad",
                                         *(heads + [""] * (15 - len(heads))), *descs, p1, p2, url, "Enabled"])
            badge = ("held: not bookable yet" if stage == "hold" else
                     "stage 4 (approved 25 Nov)" if ag in PROPOSED else f"stage {stage[-1]}")
            sections.append(
                f"### {ag} · {badge}\n"
                f"Campaign **{camp}** · Final URL {url} · Display path `/{p1}/{p2}`  \n"
                f"*Facts used:* {note}\n\n"
                + (f"⚠️ **Owner-confirmed, not on the course page yet:** {OWNER_CONFIRMED[ag]}\n\n"
                   if ag in OWNER_CONFIRMED else "")
                + (f"⏸️ **Held:** {LAUNCH_HOLD_REASON}\n\n" if ag in LAUNCH_HOLD else "")
                + "| # | Headline | Chars |\n|---|---|---|\n"
                + "\n".join(f"| {i} | {h} | {len(h)} |" for i, h in enumerate(heads, 1))
                + "\n\n| # | Description | Chars |\n|---|---|---|\n"
                + "\n".join(f"| {i} | {d} | {len(d)} |" for i, d in enumerate(descs, 1)) + "\n")
    if bad:
        print("ADS FAILED VALIDATION:\n  " + "\n  ".join(bad))
        return 1

    header = ["Campaign", "Ad group", "Ad type", *[f"Headline {i}" for i in range(1, 16)],
              *[f"Description {i}" for i in range(1, 5)], "Path 1", "Path 2", "Final URL", "Status"]
    rows = []
    for key, when, _ in STAGES:
        f = ROOT / "proposals" / f"2026-11_rsa_{key}_google-ads-editor.csv"
        with f.open("w", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(header)
            w.writerows(per_stage[key])
        rows.append(f"| {key[-1]} | {when} | {len(per_stage[key])} | `proposals/{f.name}` |")
    n_ads = len(sections)

    md = f"""# Responsive search ads for the new ad groups (DRAFT for your approval)

{n_ads} ads, one per new ad group: {n_strings} strings in total. **Nothing is uploaded.** Phase 1:
you import them. Stages 1-4 are approved (stage 4, APM, Business Owner and Architects, on 25 Nov;
import it with stage 2 on 1 Dec). The 3 **Innovation** ads are drafted but held until those courses
can be booked and paid for on agile-agilist.com, so they have no import file yet.

**Validated:** every string passes `src/asset_generator.py` for **US and Canada** audiences, both
during Black Friday and after it ends (15 Dec). That covers character limits, "SAFe Platinum
Partner" (never Gold), "exam prep and support" (no pass guarantee or money-back), no prices at all
(so no CAD for US), no scarcity claims, and approved stable landing pages only.

**Evergreen on purpose:** no Black Friday wording, so these don't need editing on 1 Dec. To
promote the offer in a stage 1 ad group until 30 Nov, add the headlines from the Black Friday kit.

**Built on what each course actually teaches** (full English course pages, read 20 Nov), plus
one claim you confirmed in chat: one-day **PI Outcome Planning** in Launching AI-Native ARTs.
**Left out on purpose:** ratings, graduate counts, employer logos, unsourced statistics, the
pages' refund wording, and any detail the site contradicts (delivery format for AI-Native
Foundations and the executive course; prerequisites for RTE and ASM; "SPCT-led" except SPC).
Site fixes for the web team are in `proposals/2026-11_site-fixes.md`.

## Import with the keywords, stage by stage
Import the ad file **first**, then the keyword file for the same stage, in Google Ads Editor
(*Account → Import → From file → review → Post*). An ad group with keywords but no ad doesn't
serve. If an ad group already has an ad you like, delete its row from the CSV before importing.

| Stage | When | Ads | File |
|---|---|---|---|
{chr(10).join(rows)}

**No pinning.** Google needs freedom to mix headlines for good Ad Strength; the course name already
appears in several headlines. **Google only:** add any Microsoft versions by hand, because an
import from Google can overwrite your tracking suffixes.

**Judged on website Stripe payments only**, like the keywords. Give each ad 14 days, then compare
on the agent's Stripe numbers, not on clicks or "Conversions".

## The ads
""" + "\n".join(sections)
    out = ROOT / "proposals" / "2026-11_rsa-drafts.md"
    out.write_text(md)
    print(f"RSA drafts: {n_ads} ads, {n_strings} strings validated (US+CA, during+after promo) -> "
          f"{out.relative_to(ROOT)}")
    for key, _, _ in STAGES:
        print(f"  {key}: {len(per_stage[key])} ads")
    return 0


if __name__ == "__main__":
    sys.exit(main())
