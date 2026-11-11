# State of AI series — research brief for theme agents

Report AI (report-ai.org) is an independent AI-statistics publisher. Every figure is traced to its
source, dated and confidence-rated. We are building a named, citable report series:

- **State of AI Usage / Spending / Finance / Work / Models & Prices / Risk / Regulation — Q4 2026
  edition** (one report per theme, updated quarterly).
- **State of AI in Numbers 2024** and **2025** (retrospective annual flagships) and **2026**
  (draft, published mid-December), each with a section per theme.
- **State of AI, year over year: 2024 vs 2025 vs 2026** (comparison page).

Your job: for ONE theme, produce the data and the draft prose these pages are built from.

## Sources, in order of preference

1. **Report AI's own pages** — `content-ops/state-of-ai/site-corpus-2026-11-10.txt` (plain text of
   all 186 pages/posts, each headed `=== PAGE <id> | <title> | <url> | modified <date>`). Reuse
   their figures so the site stays consistent, and record the page id. The corpus is from
   10 Nov 2026; some pages carry figures we know are stale (see "Known updates" below).
2. **WebSearch** (and WebFetch / the web-fetch agent if available) for gaps and for anything newer.
   Many primary sites are unreachable from this environment; use consistent reputable reporting and
   say so. Your training data ends before late 2026 — do not answer from memory for 2026.

## Known updates (newer than the corpus)

- ChatGPT weekly active users: **1B+ (OpenAI, 31 Aug 2026)**; 900M+ (27 Feb 2026); 800M (Oct 2025);
  ~700M (Jul 2025); 400M (Feb 2025); 300M (Dec 2024); 200M (Aug 2024). OpenAI cited "1.2B weekly
  users" (collective, may include other products) at DevDay, 29 Sep 2026 — do not use as the
  ChatGPT figure.
- Gemini app 1B+ monthly users (Alphabet Q3 call, 28 Oct 2026). Doubao 419M MAU, DeepSeek 122.65M
  MAU (QuestMobile, Sep 2026).
- OpenAI annualised revenue ~$50B (end Sep 2026, CNBC); Anthropic H1 2026 revenue $16.3B (S-1,
  26 Oct 2026). OpenAI raised ~$11B first close at $1.25T valuation (6 Nov 2026).
- Q3 2026 capex: Amazon $75.9B, Alphabet $51.4B, Microsoft $45.2B, Meta $34.91B (≈$207B combined,
  bases differ). Full-year 2026 guidance: Alphabet $195–205B, Meta $135–145B, Amazon ~$220B,
  Microsoft ~$170B (period disputed).
- Challenger AI-attributed US job cuts: 54,836 in 2025; 121,401 Jan–Oct 2026; 1,265 in Oct 2026.
- AI agents market: standalone ~$7–8B (2025), 2030 median ~$49B (page 3435).
- More October–November 2026 figures: `content-ops/research/2026-11-market-pulse-sources.md`.

## Rules

- Every value: figure, unit, **as-of date**, source name, URL if known, confidence
  (**HIGH** = you read the primary source; **MEDIUM** = consistent reputable secondary reporting;
  **DERIVED** = our arithmetic, show the formula in `note`; **CONTESTED** = credible sources
  disagree, give both in `note`).
- Compare like with like. Never put a weekly user count next to a monthly one as if comparable;
  never compare a forecast with an outcome. For 2026, use the latest available figure and mark
  it "to date" with its as-of date.
- Year = the calendar year the figure describes, not the year it was published.
- Do not invent. If a value cannot be found, set it to null and say so in `gaps`.
- Prose: plain and precise, no hype. Write each headline as ONE self-contained, quotable sentence:
  figure + unit + date + source + scope ("OpenAI said ChatGPT had more than 1 billion weekly
  active users on 31 August 2026"). Analysis paragraphs 90–150 words each.

## Output — write ONE JSON file: `content-ops/state-of-ai/data/<theme>.json`

```json
{
  "theme": "usage",
  "title": "State of AI Usage",
  "dek_2026": "one-sentence description of what this report measures",
  "metrics": [
    {
      "id": "chatgpt_wau",
      "label": "ChatGPT weekly active users",
      "unit": "users (weekly)",
      "group": "Consumer assistants",
      "yoy": true,
      "values": {
        "2024": {"value": "300M", "num": 300000000, "as_of": "Dec 2024", "source": "OpenAI", "url": "...", "confidence": "MEDIUM", "note": "", "site_page": 969},
        "2025": {...},
        "2026": {...}
      }
    }
  ],
  "headlines": {
    "2024": ["sentence 1", "... 5 sentences"],
    "2025": ["... 5"],
    "2026": ["... 5"]
  },
  "analysis": {
    "2024": ["para", "para", "para"],
    "2025": ["para", "para", "para"],
    "2026": ["para", "para", "para", "para"]
  },
  "takeaways_2026": ["4 bullets"],
  "yoy_takeaways": ["3-4 bullets comparing 2024→2025→2026"],
  "faq_2026": [{"q": "...", "a": "self-contained answer with figures and dates"}],
  "stop_quoting": [{"claim": "widely repeated wrong/stale figure", "fact": "what is supported", "link": "/reports/ai-statistics-fact-check/#fc-... or a page path, or null"}],
  "related_pages": [969, 43],
  "gaps": ["what could not be found or verified"]
}
```

Aim for **15–25 metrics**, at least **10 with values for all three years** (`"yoy": true`), five
headlines per year, five FAQs. `num` is a plain number for charts where it makes sense (else null).
Validate the file with `python3 -c "import json;json.load(open(PATH))"` before finishing.
Return a short summary: metric count, how many have all three years, main gaps, anything CONTESTED.
Do not edit the website. Do not touch any other file.
