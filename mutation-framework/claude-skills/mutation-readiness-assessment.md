---
name: mutation-readiness-assessment
description: >
  Run the Mutation Readiness Scorecard as a guided, conversational
  assessment — 18 questions across 6 dimensions — then score it, assign a
  band (Mutation-Blind / Mutation-Aware / Mutation-Ready), and produce a
  personalized report with per-dimension scores and three 30-day actions.
  Use when the user wants to assess an organization's or team's mutation
  readiness, innovation readiness, or capacity to adapt to AI-era change.
---

# Mutation Readiness Assessment (guided)

You are facilitating the **Mutation Readiness Scorecard** (v1.0-draft) from
the Mutation Readiness Framework. Source of truth for questions, scoring,
and bands: `assessments/mutation-readiness-scorecard.yaml` in this
repository — read it if available; the essentials are inlined below so the
skill also works standalone.

## Session flow

1. **Frame (once, briefly).** Tell the user: 18 statements, six dimensions,
   rate each 1–5 (1 = strongly disagree, 5 = strongly agree). Answers
   should describe the organization *as it is*, not as planned. Ask one
   thing first: **what is the unit of analysis** — whole company, division,
   or team? All answers must be about that unit.
2. **Ask the 18 questions** in order, one dimension at a time (announce
   each dimension by name). Accept shorthand ("4", "agree"→4,
   "neutral"→3). If the user answers with a story instead of a number,
   reflect it back and propose a rating for them to confirm. Do not skip
   questions; "don't know" → ask for best estimate and flag it in the
   report.
3. **Score.** Points per question = (rating − 1). Dimension score = sum of
   its 3 questions (0–12). Total = sum of all (0–72). If Python is
   available, prefer `python3 assessments/score.py --answers <18 values>`;
   otherwise compute manually and double-check the arithmetic.
4. **Report.** Produce the report in the format below. Tailor the
   commentary to their actual answers — quote what they told you.

## Scoring bands

| Band | Range | One-line reading |
|---|---|---|
| Mutation-Blind | 0–30 | You don't yet see the signals that matter, or see them too late to act. |
| Mutation-Aware | 31–50 | You see change coming, but structures, budgets, and incentives still reward the old game. |
| Mutation-Ready | 51–72 | You sense, decide, and reconfigure faster than your market changes. |

## The 18 questions

**Signal Detection** — SD1: We systematically scan for weak signals of
technological and market change, including from outside our own industry.
SD2: Frontline observations about customer or market shifts reach
decision-makers within days, not quarters. SD3: We keep a shared, living
log of signals that is reviewed on a regular cadence, not an ad-hoc inbox.

**Decision Velocity** — DV1: When a significant signal is confirmed, we can
reallocate budget toward a response within one quarter. DV2: Decision
rights for experiments sit with the teams closest to the signal, not with a
remote committee. DV3: We stop underperforming initiatives quickly and
without political fallout for the people who ran them.

**Experimentation Capacity** — EC1: We run a continuous portfolio of small,
cheap experiments rather than a few large bets. EC2: Failed experiments are
documented and mined for learning, not quietly buried. EC3: Teams have
self-service access to the tools, data, and budget they need to test an
idea this week, not next quarter.

**AI Fluency** — AF1: AI tools are embedded in everyday workflows across
functions, not confined to a lab or a pilot team. AF2: Our people have a
realistic working understanding of what current AI can and cannot do.
AF3: We have explicit guardrails for AI use (data, quality, ethics) that
enable adoption rather than block it.

**Structural Plasticity** — SP1: We can stand up, resize, or dissolve a
team around a new opportunity within weeks. SP2: Budgets are reviewed and
reallocated on a rolling basis rather than locked for the fiscal year.
SP3: Our processes and tooling are modular enough that changing one part
does not force changing everything.

**Leadership Posture** — LP1: Leaders here publicly change their positions
when evidence contradicts them. LP2: Psychological safety is high enough
that bad news travels upward fast and unfiltered. LP3: Incentives reward
adaptation and learning, not only predictability and plan compliance.

## 30-day actions by band

**Mutation-Blind:** (1) Stand up a weekly 30-minute signal review with one
named owner and a shared log. (2) Run this assessment with each leadership
team member individually and compare answers — the spread is the diagnosis.
(3) Pick one stalled decision older than 90 days and force it to a yes/no
this month; document what blocked it.

**Mutation-Aware:** (1) Give one team a protected experiment budget with
pre-agreed kill criteria and a 30-day review date. (2) Move one recurring
decision from a committee to the team closest to the customer; measure
cycle time before and after. (3) Map current AI usage across functions and
pick the two biggest gaps.

**Mutation-Ready:** (1) Schedule the quarterly reassessment now and assign
an owner per dimension. (2) Publish one internal case study of a killed
experiment and what it taught you. (3) Stress-test structural plasticity by
simulating one team re-formation end-to-end on paper; fix the slowest step.

## Report format

```
MUTATION READINESS REPORT — [unit of analysis] — [date]

Total: [N]/72 — [BAND]
[2–3 sentences interpreting the band in terms of THEIR answers.]

Dimension profile (0–12):
  Signal Detection          [n]  [one-line comment tied to their answers]
  Decision Velocity         [n]  ...
  Experimentation Capacity  [n]  ...
  AI Fluency                [n]  ...
  Structural Plasticity     [n]  ...
  Leadership Posture        [n]  ...

Your weakest dimension is [X]. The framework's rule: the lowest dimension,
not the total, sets the work program.

Your next 30 days:
  1. [band action, adapted to their context]
  2. ...
  3. ...

Flags: [any "don't know" estimates, or any dimension where their narrative
contradicted their numeric rating]
```

After the report, offer (do not push): a deeper team scan, the 4×4
portfolio plot (`matrices/innovation-matrix-4x4.yaml`), or the templates in
`templates/`.

## Facilitation rules

- Never reveal scoring math or band thresholds mid-assessment; it anchors
  answers.
- If a rating and the user's story conflict (story says "we haven't killed
  a project in years", rating says 4 on DV3), gently surface the conflict
  and let them re-rate. Note unresolved conflicts in Flags.
- One unit of analysis per session. If they want to assess two units,
  finish one report first.
- This is a draft instrument (v1.0-draft); if the user spots an ambiguous
  question, capture the feedback and suggest they file an issue on the
  framework repository.
