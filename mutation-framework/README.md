# The Mutation Readiness Framework

**The open-source operating system for innovation in the age of AI.**

> **Status: v1.0-draft — content pending owner review. Not yet announced.**
> Per the launch plan, this repository is not announced publicly until the
> Framework Guide v1.0 PDF and all template files are owner-approved.

Mutation readiness is an organization's capacity to **sense, decide, and
reconfigure faster than its environment changes**. This repository is the
canonical, machine-readable home of the framework introduced in the books
*The Innovation Playground* and *Mutation Readiness: An Operating Manual
for Innovation in the Age of AI* by Mark Saymen.

Everything here is free to use. Clone it, run the assessments, plug the MCP
server into your agents, fork the templates into your wiki.

## Start here

| If you are a… | Start with |
|---|---|
| **Leader** wondering where you stand | The [Mutation Readiness Scorecard](assessments/mutation-readiness-scorecard.md) — 18 questions, ~10 minutes |
| **Practitioner** running the framework | The [Framework Guide](reference/framework-guide-v1.0.md), then the [templates](templates/) |
| **Facilitator** assessing a team | The [Claude Code skill](claude-skills/mutation-readiness-assessment.md) for guided sessions |
| **Developer** integrating it into tools | The [machine-readable specs](assessments/) (YAML) and the [MCP server](mcp-server/) |

## What's in this repository

```
assessments/      The two scorecards — Markdown for humans, YAML as the
                  machine-readable source of truth, plus a Python scorer
templates/        SignalNet log, Risk Assessment Canvas, Innovation KPI
                  Scorecard, Leading Indicator Dashboard
matrices/         The 4×4 Innovation Matrix (SVG + YAML spec)
reference/        The Framework Guide — the canonical, versioned document
claude-skills/    Guided assessment skills for Claude Code
mcp-server/       Model Context Protocol server exposing the assessment
                  to AI agents (TypeScript, MIT)
examples/         Three case studies: one positive, one cautionary,
                  one honestly mixed
translations/     Community translations — contributions welcome
```

## The framework in one paragraph

Six **dimensions** measure readiness (Signal Detection, Decision Velocity,
Experimentation Capacity, AI Fluency, Structural Plasticity, Leadership
Posture), scored 0–72 into three **bands** (Mutation-Blind, Mutation-Aware,
Mutation-Ready). The **4×4 Innovation Matrix** makes portfolio shape
visible. Five **levers** (Capital, Cadence, Capability, Configuration,
Conviction) are the only things you can actually pull. Three **loops** keep
it alive: a weekly signal review, a quarterly reassessment and re-plot, an
annual recalibration. The [Framework Guide](reference/framework-guide-v1.0.md)
is the canonical definition; everything else derives from it.

## Quick start: score yourself in two minutes

```bash
git clone https://github.com/mutationreadiness/framework.git
cd framework/assessments
pip install pyyaml
python3 score.py --answers 3,4,2,3,3,4,2,2,3,4,3,3,2,2,3,3,4,3
```

Or take the full guided assessment with a personalized report at
**[website /assessment page — URL pending domain decision]**.

## Use it with AI agents

The [MCP server](mcp-server/) exposes `run_assessment`, `score_responses`,
`generate_report`, and `get_band_recommendations` to any MCP-capable agent:

```bash
cd mcp-server && npm install && npm run build
claude mcp add mutation-readiness -- node $(pwd)/dist/index.js
```

The [Claude Code skills](claude-skills/) provide fully guided, conversational
assessment sessions with report generation.

## Community

- **Discord** — *invite link to be added at community launch (day 60–75 of
  the launch plan)*: #practitioners, #facilitators, #contributors
- **Quarterly community calls** — recorded and posted publicly
- **Website** — *pending domain decision*: assessment funnel, workshops,
  books

## Contributing

Pull requests for case studies, translations, templates, and tooling are
welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Substantive changes to
the framework itself (questions, bands, dimensions) go through an issue
first; the Framework Guide is versioned deliberately and changes slowly.

## License

Dual-licensed (pending final owner confirmation):

- **Documents** (guide, assessments, templates, case studies):
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- **Code** (`score.py`, `mcp-server/`): [MIT](LICENSE)

See [LICENSE](LICENSE) for the full text of both.

## Building PDFs

PDF renderings of the guide, canvas, and scorecards are generated from the
Markdown sources with pandoc:

```bash
pandoc reference/framework-guide-v1.0.md -o reference/framework-guide-v1.0.pdf \
  --pdf-engine=xelatex -V geometry:margin=2.5cm -V mainfont="Helvetica"
```

(Or any Markdown-to-PDF pipeline; the Markdown is the source of truth.)
