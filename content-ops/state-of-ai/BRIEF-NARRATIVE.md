# State of AI series — narrative brief (McKinsey-style long form)

Added 11 Nov 2026 after the owner asked for longer reports "in McKinsey report style", with analysis,
comparison and charts. This is the SECOND file each theme produces, after `data/<theme>.json`
(see BRIEF.md). It turns the data into a 3,500–5,000-word report.

## What "McKinsey style" means here

1. **Action titles.** Every chapter and every exhibit title is a full-sentence conclusion, not a
   label. Not "ChatGPT users" but "ChatGPT's weekly users grew fivefold in two years, but growth
   slowed to 11% in the last six months".
2. **Numbered exhibits.** Each chapter carries 1–2 exhibits (charts or tables). Each exhibit has
   an action title, a subtitle stating exactly what is plotted and in what unit, a source line, and
   notes (definitions, breaks in series, confidence).
3. **Executive summary first** ("At a glance"): 5–7 bullets, each a self-contained, quotable
   sentence (figure + unit + date + source + scope).
4. **Structured argument.** 5–6 chapters that build a case, then a comparison chapter
   (2024 vs 2025 vs 2026, and across companies, platforms or regions), then an outlook chapter
   with "what to watch in 2027" (indicator + the threshold that would change our view).
5. **Sidebars** for definitions and caveats ("How we count users", "Why forecasts disagree").
6. **Sober tone.** Plain, precise, no hype, no adjectives doing the work of numbers. Say what the
   data cannot show.

## Output — `content-ops/state-of-ai/narrative/<theme>.json`

```json
{
  "theme": "usage",
  "subtitle": "One line under the H1",
  "at_a_glance": ["5-7 self-contained figure sentences"],
  "chapters": [
    {
      "kicker": "1. Consumers",
      "action_title": "Full-sentence conclusion",
      "paras": ["4-6 paragraphs, 120-180 words each"],
      "exhibits": [EXHIBIT, ...],
      "sidebar": {"title": "...", "body": "80-150 words"}
    }
  ],
  "comparison": {"action_title": "...", "paras": ["2-3 paragraphs"], "exhibits": [EXHIBIT]},
  "outlook": {"action_title": "...", "paras": ["2 paragraphs"],
              "watch": [{"indicator": "...", "now": "current value + date", "signal": "what level would change the picture"}]},
  "definitions": [{"term": "...", "def": "..."}],
  "annual": {
    "2024": {"action_title": "...", "paras": ["3 paragraphs, ~150 words, past tense, about 2024 only"]},
    "2025": {"action_title": "...", "paras": ["3"]},
    "2026": {"action_title": "...", "paras": ["3, to date"]}
  }
}
```

5–6 chapters; 7–10 exhibits in total; at least one `line` chart and, where the theme has
dated events (laws, model releases, data-centre builds), one `gantt` timeline.

### EXHIBIT

```json
{
  "title": "Action-title sentence",
  "subtitle": "What is plotted, unit, period",
  "type": "line | bar | hbar | grouped | gantt | table",
  "unit": "M users",
  "series": [{"name": "ChatGPT weekly active users", "points": [["Dec 2024", 300], ["Feb 2025", 400]]}],
  "gantt": [{"label": "EU AI Act: prohibitions apply", "start": "2025-02", "end": "2025-08", "group": "EU", "milestone": false}],
  "table": {"columns": ["Company", "2024", "2025"], "rows": [["OpenAI", "$3.7B", "$13B"]]},
  "source": "Source: OpenAI announcements; Report AI analysis",
  "notes": "Breaks in series, definitions, which values are DERIVED or CONTESTED",
  "confidence": "MEDIUM"
}
```

- `line`, `bar`, `hbar`: one or more series; `points` are `[label, number]` with numbers in `unit`.
  `grouped`: several series sharing the same labels (e.g. 2024/2025/2026 by company).
  `gantt`: `start`/`end` as `YYYY-MM`; `milestone: true` for single dates (end = start).
  `table`: for anything that is not a number series.
- **Every number in an exhibit must appear in `data/<theme>.json` or carry its own source in
  `notes`.** Never invent points to smooth a line; plot only dated, sourced readings. Never put
  weekly and monthly users, or forecasts and actuals, on one line.
- Keep labels short (≤ 22 characters) so charts stay legible on a phone.

## Rules carried over from BRIEF.md

Confidence labels (HIGH/MEDIUM/DERIVED/CONTESTED), year = year described, no invention, quotable
self-contained sentences, compare like with like. Internal links in prose are not needed (the
generator adds them). Validate JSON before finishing. Do not edit the website or any other file.
