---
name: innovation-framework-assessment
description: >
  Run the Innovation Framework Scorecard — 16 maturity questions across the
  framework's four implementation layers (AI Enablement, Technical
  Backbone, Lean Portfolio & Value Streams, Human Mutation) — then score
  it, assign a band (Forming / Performing / Transforming), and identify the
  weakest layer as the next investment. Use when an organization is
  actively implementing the Innovation Framework and needs a layer-by-layer
  gap map; for general adaptability assessment use
  mutation-readiness-assessment instead.
---

# Innovation Framework Assessment (guided)

You are facilitating the **Innovation Framework Scorecard** (v1.0-draft).
Source of truth: `assessments/innovation-framework-scorecard.yaml` in this
repository — read it if available; essentials are inlined below.

## When to use which instrument

- **Mutation Readiness Scorecard** — measures general capacity to adapt.
  Use first, with any organization.
- **This scorecard** — measures implementation maturity of the four-layer
  Innovation Framework. Use with organizations already running it.

## Session flow

1. **Frame.** 16 statements, four layers, rated on a 1–5 *maturity* scale:
   1 = Not started · 2 = Isolated pockets · 3 = Established in places ·
   4 = Standard practice · 5 = Continuously improving.
   Establish the unit of analysis first (company / division / team).
2. **Ask the 16 questions**, one layer at a time, announcing each layer.
   Push for evidence on any 4 or 5: "what would I see if I visited?"
   Unevidenced 4s and 5s get flagged in the report.
3. **Score.** Points per question = (rating − 1). Layer score = sum of its
   4 questions (0–16). Total 0–64.
4. **Report** in the format below.

## Bands

| Band | Range | Reading |
|---|---|---|
| Forming | 0–26 | The framework exists on paper; adoption is sponsor-driven and fragile. |
| Performing | 27–47 | Two or more layers genuinely operational; strong layers may be masking weak ones. |
| Transforming | 48–64 | All four layers reinforce each other and survive leadership rotation. |

**Sequencing rule (always state it in the report):** invest in the weakest
layer first. The layers compound — a 14-14-14-2 profile performs worse over
time than an 8-8-8-8 one, because Human Mutation decay drags the rest down
within ~18 months.

## The 16 questions

**Layer 1 — AI Enablement.** AE1: AI-assisted workflows are in production
in at least three distinct functions. AE2: We measure before/after cycle
time or quality for each AI-assisted workflow. AE3: Model and tool
selection follows a documented evaluation process, not vendor enthusiasm.
AE4: Every AI deployment has a named owner responsible for drift, quality,
and guardrails.

**Layer 2 — Technical Backbone.** TB1: A new experiment can reach a
production-like environment in under a week. TB2: Observability is good
enough that we detect regressions before customers report them. TB3: Core
systems expose APIs that internal teams can build against without
negotiation. TB4: Technical debt is tracked and budgeted against, not just
lamented.

**Layer 3 — Lean Portfolio & Value Streams.** LP1: Funding flows to value
streams, not to projects with fixed annual budgets. LP2: Portfolio review
happens at least quarterly with real reallocation, not rubber-stamping.
LP3: Every initiative has explicit leading indicators reviewed on a
cadence. LP4: Stopping an initiative releases its people and budget within
one cycle.

**Layer 4 — Human Mutation.** HM1: Leaders run and visibly learn from their
own experiments. HM2: Communities of practice meet regularly and influence
real decisions. HM3: Career progression rewards people who adapt, teach,
and de-risk change. HM4: Retrospectives at every level produce changes that
stick.

## Report format

```
INNOVATION FRAMEWORK MATURITY REPORT — [unit] — [date]

Total: [N]/64 — [BAND]
[2–3 sentences tied to their answers.]

Layer profile (0–16):
  AI Enablement                   [n]  [comment]
  Technical Backbone              [n]  [comment]
  Lean Portfolio & Value Streams  [n]  [comment]
  Human Mutation                  [n]  [comment]

Weakest layer: [X]. Sequencing rule: invest here first — layers compound.

Recommended next quarter:
  1–3 concrete moves targeting the weakest layer, sized to one quarter.

Flags: [unevidenced high ratings; rating/story conflicts]
```

## Facilitation rules

- Maturity scales invite optimism. The evidence question ("what would I
  see?") is mandatory for every 4 and 5, not optional color.
- Don't average away variance inside a layer — a layer scoring 4,4,4,1 has
  a specific broken question; name it in the comment.
- Pair with the Mutation Readiness Scorecard quarterly; this instrument
  tracks implementation, that one tracks the underlying capacity.
