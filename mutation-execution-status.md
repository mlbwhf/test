# Mutation Readiness Build — Execution Status

**Date:** 2026-06-11 (session 2) · **Source:** Handover Brief v1.0 (Mark
Saymen) · **Built by:** Claude Code agent · **Branch:** `claude/trusting-galileo-84n4qw`

## ✅ Canon reconciliation complete (session 2)

The brief's referenced source files were located in the owner's Google
Drive (`mutation-readiness-assessment.md`, `innovation-framework-assessment.md`,
both modified 2026-05-24) and **all repository content has been reconciled
against them**:

- **Six dimensions (canonical):** Signal Sensitivity, Structural
  Flexibility, AI Talent Flywheel, Ambidextrous Capital, Ethical
  Guardrails, Narrative Coherence. Question IDs Q1.1–Q6.3.
- **Scoring (canonical):** dimension = floor(sum × 12 / 15) → 0–12;
  total /72; N/A allowed with proportional denominators; rapid mode
  (6 questions, /30). Bands unchanged: 0–30 / 31–50 / 51–72.
- **Innovation Framework (canonical):** 15 questions across the five
  Principles (Fail Forward, Open Communication & Candid Feedback,
  Challenging Mental Models, Flexible Structure, Growth Mindset at
  Scale), /75, bands Innovation Theatre / Practicing / Native.
- Both Claude Code skills replaced with the canonical text verbatim
  (proper frontmatter restored). YAML specs, Markdown scorecards,
  `score.py`, MCP server, Framework Guide, templates, case studies,
  README, and website copy all updated to match. `score.py` and the MCP
  server re-tested: identical results on identical inputs (incl. N/A
  normalization and rapid mode).

**Still working drafts needing the books' text to finalize:** the Five
Lever names (Operating Manual Ch. 9), the 4×4 matrix cell archetypes, the
SignalNet template vs. Appendix E, the Assumption Audit template
(Appendix C — not yet in the repo), and the three case studies
(composites; flagged in their headers).

## Workstream status

| Workstream | Status |
|---|---|
| **2 — Framework repo** (`mutation-framework/`) | ✅ Content complete and canon-reconciled. **PDFs now generated** (guide 9pp, both scorecards, risk canvas). MCP server compiles + smoke-tested. ⛔ Publishing blocked on owner creating the GitHub org. |
| **1 — Website + funnel** | 📝 Copy pack (`mutation-website-copy.md`) + **3 launch blog posts drafted** (`mutation-launch-content.md`). Framer/ScoreApp/Kit/Cal.com/Stripe need human accounts. |
| **3 — Community** | 📝 Runbook (`mutation-discord-runbook.md`) + **all 6 seed posts now drafted** (2 in runbook, 4 in launch content pack). Discord needs a human account. |
| **4 — Certification** | ⏸ Wave 3 (day 120) per brief. |

## Owner decisions still required (brief §7 + new)

1. Primary domain — and reserve all three candidates within 7 days (risk register)
2. GitHub org name (`mutationreadiness` vs `mutation-readiness`) → create org + `framework` repo; contents ready to push
3. Confirm licenses (CC BY-SA 4.0 docs + MIT code, as drafted)
4. Legal entity timing
5. Community manager approach
6. Certification pricing (Wave 3)
7. Quarterly call format
8. Discord vs Slack (runbook assumes Discord per brief)
9. Conduct-contact email for CODE_OF_CONDUCT.md
10. Review the working-draft items listed above (Five Levers names, matrix
    cells, case studies) against the books' manuscripts
11. **New:** review the 3 blog posts + 6 Discord seed posts in
    `mutation-launch-content.md`

## Suggested next actions

- Owner: create the GitHub org → agent can push `mutation-framework/` verbatim
- Owner: supply Appendix C (Assumption Audit) and Appendix E (SignalNet)
  text → agent reconciles the two templates and adds the missing
  Assumption Audit template
- Beta-test both Claude Code skills with real users (day-45 milestone;
  also a risk-register item: 15–20 beta users for the scoring logic)
