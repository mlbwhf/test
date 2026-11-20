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
from build_keyword_proposal import CAMPAIGN_NAME, HOLD_KW, ON_HOLD, PLAN, STAGES, stage_of  # noqa: E402

CHECK_DATES = [datetime.date(2026, 11, 20), datetime.date(2026, 12, 15)]  # during + after the promo
TRUST = ["SAFe Platinum Partner", "SPCT-Led Training", "Exam Included", "Exam Prep and Support"]

# ad group -> (path1, path2, source note, headlines, descriptions)
ADS = {
    "AI-Native Foundations": ("AI-Native", "Foundations",
        "Format left out on purpose: English page says live online; campaign is Face-to-Face.",
        ["AI-Native Foundations", "AI-Native Foundations Cert", "AI Native Certification",
         "Become AI-Fluent at Work", "Use AI Tools in Your Own Work", "Start Your AI-Native Path",
         "Instructor-Led AI Training", "Upskill in AI for Your Career", "First Step to Value Architect",
         *TRUST],
        ["Become productive with AI tools in your own work. Instructor-led, exam included.",
         "The first credential on the AI-Native path and the prerequisite for Value Architect.",
         "Taught by an SPCT at a SAFe Platinum Partner. Exam prep and support included.",
         "Grow your career with practical AI skills. See upcoming class dates and register."]),
    "AI-Native SAFe Fundamentals": ("AI-Native", "Fundamentals",
        "One day, no prerequisites, exam included (45 questions).",
        ["AI-Native SAFe Fundamentals", "SAFe AI-Native Course", "AI-Native SAFe in One Day",
         "One-Day AI-Native Course", "No Prerequisites", "AI Innovation Pipeline",
         "Shared Language for AI + SAFe", "Start With AI-Native SAFe", "Instructor-Led AI Training",
         *TRUST],
        ["One-day AI-Native SAFe course: core concepts, the operating model and the AI pipeline.",
         "No prerequisites. Exam included, plus exam prep and support from an SPCT.",
         "Learn the shared language your teams need to bring AI into SAFe. See class dates.",
         "Taught at a SAFe Platinum Partner. Register online for an upcoming class."]),
    "AI-Native Value Architect": ("AI-Native", "Value-Architect",
        "Two days live virtual, exam included; builds on AI-Native Foundations.",
        ["AI-Native Value Architect", "Value Architect Certification", "AI Change Agent Certification",
         "Lead AI Adoption at Scale", "Beyond Copilots: Scale AI", "AI Transformation Training",
         "Redesign Processes for AI", "2 Days, Live Virtual", "Lead AI Change at Work", *TRUST],
        ["Drive AI adoption across the enterprise: processes, roles and governance.",
         "Two days, live virtual, exam included. For change agents and transformation leads.",
         "Builds on AI-Native Foundations. Taught at a SAFe Platinum Partner, with exam prep.",
         "Become the person who leads AI change at work. See upcoming dates and register."]),
    "Launching AI-Native ARTs": ("AI-Native", "ART-Leader",
        "Two days live online, authorized SAFe instructor, SAFe ART Leader certification.",
        ["Launching AI-Native ARTs", "SAFe ART Leader Certification", "ART Leader Certification",
         "Become an ART Leader", "AI-Driven ART Execution", "Lead an AI-Native ART", "2 Days Live Online",
         "Authorized SAFe Instructor", *TRUST],
        ["Become an ART Leader: turn your Lean-Agile foundation into AI-driven execution.",
         "Two days live online with an authorized SAFe instructor. ART Leader exam included.",
         "Earn the SAFe ART Leader certification, with exam prep and support.",
         "Learn from a SAFe Platinum Partner. See upcoming class dates and register online."]),
    "Leading the AI-Native Organization": ("AI-Native", "Leaders",
        "Two-day leaders' workshop: strategy, investment, governance. Live virtual, exam included.",
        ["Leading the AI-Native Org", "AI Leadership for Executives", "AI Strategy for Leaders",
         "Executive AI Workshop", "Govern AI Across Your Org", "AI Investment & Governance",
         "2-Day Leaders Workshop", "Lead Your AI Transformation", "Live Virtual Workshop", *TRUST],
        ["Two-day workshop for leaders: AI strategy, investment decisions and governance.",
         "Lead an organization that is becoming AI-Native. Live virtual, exam included.",
         "Taught by an SPCT at a SAFe Platinum Partner, with exam prep and support.",
         "Training a leadership team? Ask about private classes on your dates."]),
    "RTE Training": ("SAFe", "RTE",
        "Three days live virtual, authorized SAFe instructor, exam included.",
        ["SAFe RTE Certification", "Release Train Engineer Cert", "SAFe Release Train Engineer",
         "RTE Training, Live Virtual", "3-Day SAFe RTE Course", "Facilitate PI Planning",
         "Lead Your Agile Release Train", "Advance Your Agile Career", *TRUST],
        ["Coach the Agile Release Train, facilitate PI Planning and keep value flowing.",
         "Three days, live virtual, with an authorized SAFe instructor. Exam included.",
         "SAFe Platinum Partner, SPCT-led. Exam prep and support for every learner.",
         "Move into a Release Train Engineer role. See upcoming class dates and register."]),
    "SPC Certification": ("SAFe", "SPC",
        "Implementing SAFe; four days live virtual, exam included.",
        ["SPC Certification", "SAFe Practice Consultant", "Implementing SAFe (SPC)",
         "Become a Certified SPC", "4-Day Live Virtual SPC Class", "Lead a SAFe Transformation",
         "Teach & Coach SAFe", "Advance Your Agile Career", *TRUST],
        ["Implementing SAFe with SPC certification: lead a Lean-Agile transformation at scale.",
         "Four days, live virtual, taught by an SPCT. Exam included.",
         "Train and coach others in SAFe as a certified SPC. Exam prep and support included.",
         "Learn from a SAFe Platinum Partner. See upcoming class dates and register online."]),
    "POPM": ("SAFe", "POPM",
        "Two days live virtual, exam included.",
        ["POPM Certification", "SAFe Product Owner/Manager", "SAFe POPM Training",
         "Product Owner Certification", "Product Manager Certification", "2-Day Live Virtual POPM",
         "Deliver Value Through the ART", "Advance Your Agile Career", *TRUST],
        ["SAFe Product Owner / Product Manager certification. Two days, live virtual.",
         "Deliver value through the Continuous Delivery Pipeline as a PO or PM in SAFe.",
         "Exam included, with exam prep and support. Taught at a SAFe Platinum Partner.",
         "Step up into a product role. See upcoming POPM class dates and register online."]),
    "Lean Portfolio Management": ("SAFe", "LPM",
        "Two days live virtual (+1 optional day), exam included.",
        ["SAFe LPM Certification", "Lean Portfolio Management", "LPM Training, Live Virtual",
         "Align Strategy & Execution", "Lean Budgeting & Governance", "For Portfolio Leaders",
         "Advance Your Agile Career", *TRUST],
        ["SAFe Lean Portfolio Management: connect strategy, funding and governance to execution.",
         "Two days live virtual, with an optional third day. Exam included.",
         "Taught at a SAFe Platinum Partner, with exam prep and support for every learner.",
         "For portfolio, PMO and finance leaders. See upcoming class dates and register."]),
    "SAFe DevOps": ("SAFe", "DevOps",
        "SAFe DevOps Practitioner; three days live virtual, exam included.",
        ["SAFe DevOps Certification", "SAFe DevOps Practitioner", "SAFe DevOps Training",
         "3-Day Live Virtual DevOps", "Map Your Delivery Pipeline", "Advance Your Agile Career",
         *TRUST],
        ["SAFe DevOps Practitioner certification. Three days, live virtual, exam included.",
         "Learn to map and improve your Continuous Delivery Pipeline across the ART.",
         "Taught at a SAFe Platinum Partner, with exam prep and support.",
         "For engineers, operations and release roles. See class dates and register online."]),
    "ASPC (new course)": ("SAFe", "ASPC",
        "Four days live virtual, 16 PDUs, requires an active SPC, exam included.",
        ["ASPC Certification", "Advanced SAFe (ASPC)", "Adv. SAFe Practice Consultant",
         "For Certified SPCs", "4-Day Live Virtual ASPC", "The Next Step After SPC",
         "Sustain SAFe Transformations", "16 PDUs, Exam Included", "SAFe Platinum Partner",
         "SPCT-Led Training", "Exam Prep and Support"],
        ["Advanced SAFe Practice Consultant: the next step for SPCs leading change at scale.",
         "Four days, live virtual, 16 PDUs, exam included. Requires an active SPC.",
         "Stop theorizing, start sustaining. AI-driven insights and hands-on tools.",
         "Taught at a SAFe Platinum Partner, with exam prep and support. See class dates."]),
    "Advanced Scrum Master": ("SAFe", "ASM",
        "Two days live virtual, 16 PDUs, no prerequisites, exam included.",
        ["SAFe Advanced Scrum Master", "ASM Certification", "SASM Certification",
         "Advanced Scrum Master Course", "2-Day Live Virtual ASM", "No Prerequisites",
         "16 PDUs, Exam Included", "Coach Agile Teams at Scale", "Advance Your Agile Career",
         "SAFe Platinum Partner", "SPCT-Led Training", "Exam Prep and Support"],
        ["SAFe Advanced Scrum Master certification. Two days, live virtual, 16 PDUs.",
         "Coach Agile teams beyond the basics and grow into a senior Scrum Master role.",
         "No prerequisites. Exam included, with exam prep and support.",
         "Taught at a SAFe Platinum Partner. See upcoming class dates and register online."]),
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
            stage = min(stage_of(campaign, pri) for _kw, pri in live)
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
            per_stage[stage].append([camp, ag, "Responsive search ad",
                                     *(heads + [""] * (15 - len(heads))), *descs, p1, p2, url, "Enabled"])
            sections.append(
                f"### {ag} · stage {stage[-1]}\n"
                f"Campaign **{camp}** · Final URL {url} · Display path `/{p1}/{p2}`  \n"
                f"*Facts used:* {note}\n\n"
                "| # | Headline | Chars |\n|---|---|---|\n"
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
    n_ads = sum(len(v) for v in per_stage.values())

    md = f"""# Responsive search ads for the new ad groups (DRAFT for your approval)

{n_ads} ads, one per new ad group: {n_strings} strings in total. **Nothing is uploaded.** Phase 1:
you import them.

**Validated:** every string passes `src/asset_generator.py` for **US and Canada** audiences, both
during Black Friday and after it ends (15 Dec). That covers character limits, "SAFe Platinum
Partner" (never Gold), "exam prep and support" (no pass guarantee or money-back), no prices at all
(so no CAD for US), no scarcity claims, and approved stable landing pages only.

**Evergreen on purpose:** no Black Friday wording, so these don't need editing on 1 Dec. To
promote the offer in a stage 1 ad group until 30 Nov, add the headlines from the Black Friday kit.

**Facts:** taken only from each course's English page on agile-agilist.com, read 20 Nov. No
ratings, graduate counts or salary claims, because those aren't on your approved claims list.
Tell me if any detail has changed, e.g. a course length.

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
