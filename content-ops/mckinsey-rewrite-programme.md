# Programme: rewrite every report and index in "McKinsey style"

Owner request (11 Nov 2026): "All reports should be longer, include analysis and comparison, along
with charts or graphs for statistics. Use McKinsey report style to rewrite all of our reports in that
level of detail."

## Where we start (corpus of 10 Nov 2026)

| Section | Pages | Median words | Under 1,500 words | Under 2,500 words |
|---|---|---|---|---|
| /reports/ | 48 | 1,633 | 24 | 39 |
| /indexes/ | 73 | 1,030 | 59 | 72 |

Almost every page is below the depth the owner wants. Per-page word counts:
`/tmp/.../scratchpad/pagewords.tsv` (regenerate from `content-ops/state-of-ai/site-corpus-*.txt`).

## The house standard (what "McKinsey style" means on Report AI)

Built and proven on the State of AI series (`tools/state-of-ai/build.py`, `charts.py`,
`content-ops/state-of-ai/BRIEF-NARRATIVE.md`):

1. **Executive summary** ("At a glance", 5–7 quotable figure sentences).
2. **Action titles**: every chapter and exhibit title states the conclusion.
3. **Numbered exhibits** (7–10 per report): inline SVG line, bar, grouped, horizontal-bar and Gantt
   timeline charts, each with subtitle, source line, notes, confidence chip and a "View the data"
   table. Palette validated for colour-blind separation.
4. **Structured argument**: 5–6 chapters, then a comparison chapter (years, companies, regions),
   then an outlook with "what to watch" (indicator, current value, threshold).
5. **Sidebars** for definitions and caveats; a definitions list; FAQ (5); methodology with gaps
   stated; data appendix tables; "Numbers to stop quoting"; cite box; CSV + Dataset schema.
6. **Length** 3,500–5,000 words of analysis for full reports; 1,500–2,500 for news briefs (below).

## Three templates, not one

| Template | Used for | Length | Exhibits |
|---|---|---|---|
| **Full report** | statistics indexes, market reports, the State of AI series | 3,500–5,000 words | 7–10 |
| **Briefing** | event/news reports (OpenAI round, Anthropic S-1, EU AI Act date, lawsuits) | 1,500–2,500 words | 3–5 |
| **Hub** | section landing pages (39, 392–395, 938, 446, 498, 360, 930, 1093, 576) | 800–1,500 words of analysis + cards | 1–3 |

A news brief padded to 5,000 words reads worse, not better; the briefing template keeps the
McKinsey structure (summary, action titles, exhibits, implications) at the right length.

## Pipeline per page (same as the series)

1. **Research agent**: page brief → `content-ops/rewrite/data/<id>.json` + `narrative/<id>.json`
   (reuses the page's existing figures, checks for newer ones, rates confidence).
2. **Generator** builds the page **at its existing URL and ID** and keeps: the What-changed block
   (with a new entry for the rewrite), the download box id, internal links, FAQ anchors and any
   `#fc-*` anchors other pages link to.
3. **Backup** to `backups/<id>-<date>.html` before writing; chunked plain-mode writes; byte-equal
   verification; CSV regenerated (freshness rule 3); `dateModified` = visible stamp.
4. **Register** entry in `content-ops/refresh-register.md`; corrections log for any error found.

Throughput: about 8–12 pages per working session (research is the slow step).

## Order of work

**Tier 1 (next): the pages the State of AI series links down to, thinnest first**
43 AI Adoption (672 words) · 47 Generative AI (744) · 93 AI Infrastructure (780) · 317 How People
Use AI (797) · 89 Model Benchmarks (853) · 969 ChatGPT · 46 Enterprise AI · 73 Investment & Funding ·
321 LLM Market · 88 AI Jobs · 421 Token Price Index · 862 AI Agent Statistics.

**Tier 2: briefings** 716 OpenAI $122B round · 572 Anthropic S-1 (also out of date) · 571 Florida v
OpenAI · 718 Deloitte State of AI · 717 US federal policy · 715 frontier reshuffle · 573 EU AI Act.

**Tier 3: series** Dark Side reports (499–552, 1057, 1081, 1385) · Real-World AI (463–472) ·
Geography (930–957, 1266) · Industry (863, 865) · Regulating AI (1100–1104) · workforce children
(2297–2300).

**Tier 4: hubs** 39, 392–395, 938, 446, 498, 360, 930, 1093, 576 (after their children, so the
hubs summarise rewritten pages).

**Not rewritten:** redirect stubs 866 and 1111; accountability pages 3227, 3229, 3231, 3233 (their
format is deliberate); 3435 and 3441 (already at the standard); glossary entries (definitions,
STABLE cadence — they get a short exhibit only where a number is central).

## Errors found by the State of AI research (fix + corrections log, same day)

See `content-ops/state-of-ai/followups-2026-11-11.md`.
