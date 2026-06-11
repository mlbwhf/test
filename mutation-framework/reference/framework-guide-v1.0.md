# The Mutation Readiness Framework Guide

**Version 1.0-draft** · June 2026
**Status: DRAFT — pending owner review and sign-off before publication.**

*The definitive guide to the Mutation Readiness Framework: the rules,
definitions, instruments, and cadences for building an organization that
adapts faster than its market changes.*

This guide is licensed under Creative Commons Attribution-ShareAlike 4.0
(CC BY-SA 4.0), pending owner confirmation. You may share and adapt it with
attribution, under the same license.

---

## 1. Purpose and Use

Every organization is built for the environment that existed when it was
designed. Environments no longer hold still long enough for that design to
pay back. The arrival of capable AI has compressed the cycle further: the
cost of producing software, content, analysis, and coordination is
collapsing, and with it the moats built on those costs.

**Mutation readiness** is an organization's capacity to sense, decide, and
reconfigure faster than its environment changes. It is not a transformation
program with an end date. It is an operating property, like solvency or
safety — something you maintain, measure, and can lose.

This guide is the canonical definition of the framework. Like other
reference guides of its kind, it is deliberately minimal: it defines the
concepts, the instruments, and the cadence, and leaves the application to
practitioners. The companion books — *The Innovation Playground* (a novel)
and *Mutation Readiness: An Operating Manual for Innovation in the Age of
AI* — supply narrative, evidence, and extended practice. The framework
repository supplies the machine-readable instruments. Where any of these
disagree with this guide, this guide prevails.

**Who this is for.** Leaders accountable for an organization's continued
relevance; practitioners running the framework inside teams; facilitators
teaching it; and builders integrating it into tools (the entire framework is
published in machine-readable form for that purpose).

**How to use it.** Read it once end to end (it is short by design). Then run
the Mutation Readiness Scorecard, plot your portfolio on the 4×4 Innovation
Matrix, install the weekly signal review, and reassess quarterly. That loop
— assess, plot, review, reassess — is the whole operating system. Everything
else is technique.

## 2. Definitions

**Mutation.** A change in the environment significant enough that the
organization's current design is no longer the right answer. Mutations are
not projects, trends, or quarters; they are shifts in what works. The
emergence of capable generative AI is a mutation. So was the smartphone. So
is a regulatory regime change in your industry.

**Mutation readiness.** The organization's standing capacity to detect a
mutation early, decide what to do about it quickly, and reconfigure itself
to act on that decision — measured across six dimensions (§3) on a 0–72
scale with three bands:

- **Mutation-Blind (0–30):** the organization does not see the signals that
  matter, or sees them too late to act.
- **Mutation-Aware (31–50):** the organization sees change coming, but its
  structures, budgets, and incentives still reward the old game.
- **Mutation-Ready (51–72):** the organization senses, decides, and
  reconfigures faster than its market changes.

**Signal.** A discrete, observable piece of evidence that a mutation may be
under way: a customer behaving differently, a technology crossing a
capability threshold, a competitor making an otherwise-irrational move, a
regulation drafted. Signals are logged, not debated, at the point of
detection (see the SignalNet template).

**Weak signal.** A signal supported by a single source or speculative
interpretation. Weak signals are the cheapest information an organization
will ever acquire about its future; the framework's first rule is that
logging them must cost almost nothing.

**Leading indicator.** A measure that moves *before* an outcome does, while
intervention is still possible. Every dimension and every initiative in the
framework carries at least one leading indicator (see the Leading Indicator
Dashboard template). Lagging indicators are kept for accountability; leading
indicators are kept for steering.

**Experiment.** A time-boxed, cost-capped initiative with kill criteria
written *before* funding. An initiative without kill criteria is a
commitment, which is legitimate — but the framework requires the
organization to say which one it is making.

**Kill criteria.** The evidence, defined in advance with a date, that ends
an experiment. Kill criteria written after a pitch has been approved are
theater.

## 3. The Six Dimensions

Mutation readiness is measured across six dimensions. Each is necessary;
none is sufficient. The dimensions are deliberately cross-functional — no
single department can own mutation readiness, and an organization that
assigns it to one has already failed the assessment.

1. **Signal Detection.** Can you see change coming — early, and from outside
   your own industry? Operationalized by the SignalNet: one shared log, one
   owner, one weekly review.

2. **Decision Velocity.** How fast does a confirmed signal become a
   resourced response? Includes the under-measured half: how fast you stop
   things. Kill latency — how long initiatives survive past their own kill
   criteria — is the most honest measure of decision velocity.

3. **Experimentation Capacity.** Can you run many small, cheap experiments
   concurrently and harvest learning from all of them, including failures?
   Capacity is infrastructure plus permission: tools, data, budget access,
   and the cultural fact of what happens to people whose experiments fail.

4. **AI Fluency.** Is AI capability embedded in everyday work across
   functions, with realistic understanding of its limits and guardrails that
   enable rather than block? In the mutation era this dimension moves
   fastest and decays fastest; it is reassessed on the same cadence as the
   others but rarely stays still between assessments.

5. **Structural Plasticity.** How quickly can teams, budgets, processes, and
   tooling be reshaped around a new opportunity? Plasticity is measured in
   actuals, not policy: the last team you actually stood up, the last budget
   you actually moved mid-year.

6. **Leadership Posture.** The behavioral substrate beneath the other five:
   whether leaders visibly change position when evidence contradicts them,
   whether bad news travels upward fast, and whether incentives reward
   adaptation over plan compliance. Field experience is unambiguous:
   organizations strong on dimensions 1–5 and weak on 6 regress within 18
   months.

The full instrument — 18 questions, three per dimension, with scoring rubric
— is defined in §6 and published in machine-readable form in the framework
repository (`assessments/mutation-readiness-scorecard.yaml`).

## 4. The 4×4 Innovation Matrix

The matrix plots every initiative in the portfolio on two axes.

**Ambition** (columns): *Optimize* — make the existing thing measurably
better; *Extend* — take it to new users, markets, or uses; *Transform* —
replace how it works while keeping what it is for; *Mutate* — change what
the organization is for, obsoleting part of yourself before the market does.

**Unit of change** (rows): *Product* — what you sell; *Process* — how work
gets done; *Business model* — how value is captured; *Organization* — how
people, structure, and incentives are arranged.

The matrix exists to make portfolio shape visible. Three rules govern its
use:

1. **Every active initiative gets exactly one cell.** Arguments about which
   cell are not friction; they are the diagnosis surfacing.
2. **Healthy portfolios hold positions in at least three of the four
   ambition columns at all times.** A portfolio entirely in Optimize/Extend
   is optimizing itself into irrelevance; a portfolio entirely in
   Transform/Mutate has mistaken adrenaline for strategy.
3. **The Mutate column is funded only with capped, kill-criteria
   experiments** — never from the core P&L, and ideally shielded
   structurally (separate team, separate rules, separate building if
   necessary).

Initiatives drift left over time as they mature. The drift is normal;
*unnoticed* drift is how transformation programs quietly become maintenance
programs. Re-plot quarterly.

## 5. The Five Levers of Reinvention

When an assessment reveals a gap, these are the five levers an organization
can actually pull. Every intervention the framework prescribes is a setting
of one or more of these levers; if a proposed action does not map to a
lever, it is commentary, not intervention.

1. **Capital.** Move money on a rolling cadence instead of an annual one.
   Reallocation ratio — the percentage of innovation budget that moved this
   quarter — is the lever's gauge. Zero for three consecutive quarters means
   the lever is rusted shut.

2. **Cadence.** Install the operating rhythm: weekly signal review,
   quarterly reassessment and portfolio re-plot, annual recalibration (§7).
   Cadence is the cheapest lever and the most commonly skipped, because
   calendars are where intentions go to die.

3. **Capability.** Build AI fluency and experimentation skill deliberately:
   embedded in real workflows with measured before/after deltas, not
   training catalogs. Capability investments are experiments too — they
   carry leading indicators and review dates.

4. **Configuration.** Make structure cheap to change: modular processes,
   value-stream funding, teams that can form and dissolve in weeks. The
   gauge is the last actual reconfiguration, timed end to end.

5. **Conviction.** Leadership behavior and incentives. Leaders run their own
   experiments and publish their own position changes; compensation rewards
   adaptation. This lever cannot be delegated, which is why it is listed
   last and matters first.

## 6. The Mutation Readiness Scorecard

The scorecard is the framework's core instrument: **18 statements, three per
dimension, each rated 1–5** (strongly disagree → strongly agree).

**Scoring rubric.** Each statement scores (rating − 1), contributing 0–4
points. Total range **0–72**. Per-dimension scores range 0–12 and are
reported alongside the total as a six-axis profile (radar chart in rendered
reports). Band thresholds: Mutation-Blind 0–30, Mutation-Aware 31–50,
Mutation-Ready 51–72.

**Administration.** Three modes, in increasing order of value:

- *Personal scan* (10 minutes): one leader answers for the organization.
  Fast, free, and systematically optimistic — useful as a door, not a
  diagnosis.
- *Team scan*: each member of a leadership team answers independently
  before seeing each other's responses. The spread between answers is
  itself a primary finding; a team whose scores on Leadership Posture
  diverge by more than 4 points has located its real agenda.
- *Quarterly trend*: the same team scan repeated on the recalibration
  cadence. The trend line matters more than any absolute score.

**Interpretation rules.**

- The *lowest* dimension, not the total, sets the work program. Dimensions
  compound; a 12-12-12-12-12-2 profile underperforms a 9-9-9-9-9-9 one.
- Each band carries three prescribed 30-day actions (published in the
  scorecard specification). They are deliberately small: the framework's
  bias is that a small action taken this month beats a roadmap admired this
  quarter.
- Scores are self-reported and will inflate under audience pressure. Never
  attach compensation or public league tables to scorecard results; the
  instrument measures honesty as much as readiness, and incentivized
  scores measure neither.

The full question text, band definitions, and 30-day actions are normative
and published in the repository at
`assessments/mutation-readiness-scorecard.{md,yaml}`. The companion
**Innovation Framework Scorecard** (16 questions across the four
implementation layers: AI Enablement, Technical Backbone, Lean Portfolio &
Value Streams, Human Mutation) serves organizations actively implementing
the framework and is published alongside it.

## 7. Recommended Cadence

The framework runs on three loops. All three are required; the framework
does not function as an annual event.

**Weekly — signal review (30 minutes).** Fixed agenda: new signals (10
minutes, 60 seconds each, no debate), status changes on watched signals (10
minutes), and at most one escalation decision (10 minutes). One owner, one
log, same slot every week. This meeting is the framework's heartbeat; if
only one practice survives contact with your calendar, keep this one.

**Quarterly — reassessment and re-plot (half day).** Re-run the scorecard as
a team scan; re-plot the portfolio on the 4×4 matrix; review the leading
indicator dashboard and the KPI scorecard; audit the quarter's surprises
against the SignalNet (was the miss a sensing failure or a deciding
failure?); set or reset one lever (§5).

**Annual — recalibration (one to two days).** Step back from the loops:
re-examine whether the dimensions are weighted right for your context,
retire gamed indicators, review every kill decision of the year for false
positives, and decide deliberately what the organization will *stop*
sensing — attention is the scarcest budget the framework spends.

## 8. Glossary

| Term | Definition |
|---|---|
| **Band** | One of three scored ranges on the scorecard: Mutation-Blind (0–30), Mutation-Aware (31–50), Mutation-Ready (51–72). |
| **Dimension** | One of the six measured components of mutation readiness (§3). |
| **Experiment** | A time-boxed, cost-capped initiative with pre-written kill criteria. |
| **Kill criteria** | Evidence, defined before funding, that ends an experiment by a set date. |
| **Kill latency** | How long an initiative survives past its own kill criteria. Target: zero. |
| **Leading indicator** | A measure that moves before the outcome does, while action is still possible. |
| **Lever** | One of five things an organization can actually change: Capital, Cadence, Capability, Configuration, Conviction (§5). |
| **Mutation** | An environmental change large enough that the organization's current design is no longer the right answer. |
| **Mutation exposure** | The cost of *inaction* if a signal proves real; the systematically underpriced side of the risk ledger. |
| **Reallocation ratio** | Percentage of innovation budget that moved between initiatives in a quarter. |
| **Signal** | A discrete, observable piece of evidence that a mutation may be under way. |
| **SignalNet** | The shared, living signal log and its weekly review cadence. |
| **Team scan** | Scorecard mode where each leader answers independently; the spread is a primary finding. |

## 9. Acknowledgments and References

The Mutation Readiness Framework was developed by Mark Saymen and is
elaborated in *The Innovation Playground* and *Mutation Readiness: An
Operating Manual for Innovation in the Age of AI*.

The framework stands on ground prepared by others: the lean startup and
evidence-based innovation tradition (build–measure–learn, innovation
accounting); portfolio approaches to innovation ambition (McKinsey's three
horizons and their critics); the agile and lean-portfolio body of practice,
including the Scaled Agile Framework's treatment of lean budgeting and
value streams; the organizational-learning literature on psychological
safety (Edmondson) and dynamic capabilities (Teece); and the format example
of the Scrum Guide, which demonstrated that a framework's canonical text
can and should fit in a short, versioned document.

Contributions, translations, and case studies are welcome — see
`CONTRIBUTING.md` in the framework repository.

---

**Changelog**
- **v1.0-draft (June 2026)** — initial draft for owner review. Authored
  from the project handover brief; question text, band actions, lever
  names, and matrix cell archetypes require owner sign-off before v1.0
  final.
