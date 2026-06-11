# Mutation Readiness Scorecard

**Version 1.0-draft** · 18 questions · 6 dimensions · ~10 minutes

> Machine-readable source of truth: [`mutation-readiness-scorecard.yaml`](mutation-readiness-scorecard.yaml).
> The web assessment, the Claude Code skill, and the MCP server all derive
> from that file. If you change a question, change it there first.

## What this measures

Mutation readiness is an organization's ability to **sense, decide, and
reconfigure faster than its market changes**. The scorecard measures it
across six dimensions, three questions each.

## How to score

Answer every question on a 1–5 scale (1 = strongly disagree, 5 = strongly
agree). Your score for each question is **(answer − 1)**, so each question
contributes 0–4 points and the total ranges 0–72.

| Band | Score | Meaning |
|---|---|---|
| **Mutation-Blind** | 0–30 | You don't yet see the signals that matter, or see them too late to act. |
| **Mutation-Aware** | 31–50 | You see change coming, but structures, budgets, and incentives still reward the old game. |
| **Mutation-Ready** | 51–72 | You sense, decide, and reconfigure faster than your market changes. |

Run it three ways for best results: individually across the leadership team
(the spread between answers is itself a diagnostic), as a team workshop, and
quarterly as a trend line.

## The questions

### 1. Signal Detection
*Can you see change coming — early, and from outside your industry?*

1. **SD1** — We systematically scan for weak signals of technological and market change, including from outside our own industry.
2. **SD2** — Frontline observations about customer or market shifts reach decision-makers within days, not quarters.
3. **SD3** — We keep a shared, living log of signals that is reviewed on a regular cadence, not an ad-hoc inbox.

### 2. Decision Velocity
*How fast does a confirmed signal become a resourced response?*

4. **DV1** — When a significant signal is confirmed, we can reallocate budget toward a response within one quarter.
5. **DV2** — Decision rights for experiments sit with the teams closest to the signal, not with a remote committee.
6. **DV3** — We stop underperforming initiatives quickly and without political fallout for the people who ran them.

### 3. Experimentation Capacity
*Can you run many small bets and learn from all of them?*

7. **EC1** — We run a continuous portfolio of small, cheap experiments rather than a few large bets.
8. **EC2** — Failed experiments are documented and mined for learning, not quietly buried.
9. **EC3** — Teams have self-service access to the tools, data, and budget they need to test an idea this week, not next quarter.

### 4. AI Fluency
*Is AI capability embedded in real work, or confined to pilots?*

10. **AF1** — AI tools are embedded in everyday workflows across functions, not confined to a lab or a pilot team.
11. **AF2** — Our people have a realistic working understanding of what current AI can and cannot do.
12. **AF3** — We have explicit guardrails for AI use (data, quality, ethics) that enable adoption rather than block it.

### 5. Structural Plasticity
*How fast can you reshape teams, budgets, and processes around an opportunity?*

13. **SP1** — We can stand up, resize, or dissolve a team around a new opportunity within weeks.
14. **SP2** — Budgets are reviewed and reallocated on a rolling basis rather than locked for the fiscal year.
15. **SP3** — Our processes and tooling are modular enough that changing one part does not force changing everything.

### 6. Leadership Posture
*Do leaders model adaptation, and do incentives reward learning?*

16. **LP1** — Leaders here publicly change their positions when evidence contradicts them.
17. **LP2** — Psychological safety is high enough that bad news travels upward fast and unfiltered.
18. **LP3** — Incentives reward adaptation and learning, not only predictability and plan compliance.

## After scoring

Each band has three recommended 30-day actions — see the
[Framework Guide](../reference/framework-guide-v1.0.md) §6, or run the
[Claude Code skill](../claude-skills/mutation-readiness-assessment.md) for a
guided session with a generated report.

To score programmatically:

```bash
python3 score.py --answers 3,4,2,3,3,4,2,2,3,4,3,3,2,2,3,3,4,3
```
