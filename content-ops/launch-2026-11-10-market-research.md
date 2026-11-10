# Launch: first two market-research reports (9–10 Nov 2026)

## Published

| Page | ID | URL | Cadence |
|---|---|---|---|
| How Big Is the AI Agents Market, Really? 30 Forecasts, Side by Side | 3435 | /reports/ai-agents-market-size/ | Quarterly (next: Feb 2027) |
| AI Market Pulse: November 2026 (edition 1) | 3441 | /reports/ai-market-pulse/ | Monthly (next: early Dec 2026) |

Both carry the full house standard: analysis, key takeaways, data tables with confidence chips,
FAQ (5), methodology, related links, Article + FAQPage + Dataset JSON-LD, and a CSV download
(`site-content/data/report-ai-data-ai-agents-market-size.csv`,
`site-content/data/report-ai-data-ai-market-pulse.csv`). Every figure is MEDIUM or DERIVED:
primary pages could not be opened from the research environment (see
`content-ops/research/2026-11-*-sources.md`).

**Market Pulse URL convention:** /reports/ai-market-pulse/ always holds the latest edition.
When the December edition goes up, copy the November content to a child page
`/reports/ai-market-pulse/2026-11/` first (create → set parent 3441 → verify permalink), then
replace the parent's content and add an "Archive" list.

## Site edits made with the launch

- **Reports hub (40):** new "Market research" row (Pulse, agents report, token price index);
  hasPart schema extended.
- **AI Agent Statistics (862):** headline "$93.2B agentic AI market by 2032" was a superseded
  MarketsandMarkets edition → replaced with the 20-forecast median (~$49B, 2030, DERIVED);
  prose, FAQ (visible + JSON-LD), source list and excerpt updated; "What changed" block added
  (Updated 9 Nov 2026). Not an error correction (the figure was right when published) →
  not added to the corrections log.
- **TaaS index (388):** Gartner's $206.5B now explained as spending on all software with agent
  capabilities, with Gartner's standalone line (~$29B, 2026) and a link — prose, FAQ, JSON-LD.
- **Links added:** 421 → Pulse; 64 (Agentic AI glossary) → agents report + 862; 46 → both.

## Social (Buffer, LinkedIn 08:47 / X 12:13 Toronto)

| Date | LinkedIn | X |
|---|---|---|
| 10 Nov | Pulse launch (capex card) | Pulse launch |
| 11 Nov | Agents report launch (2030 card) | Agents report |
| 12 Nov | Series day 11 (token prices) | Pulse: AI job cuts card |
| 13 Nov | Series day 12 (energy) | Series day 12 |
| 14 Nov | Series day 13 (false claims) | Series day 13 |
| 15 Nov | Series day 14 (Claude users) | Series day 14 |
| 16 Nov | Pulse: AI job cuts | — |

Cards: `social-posts/2026-11-10/`. Copy: `social-posts/2026-11-10/posts.json`. Facebook, Threads,
Instagram: load the same copy and cards into Planable (not Buffer).

## Newsletter draft (owner sends; HubSpot "The Weekly Figure")

**Subject:** The AI agents market is $49B, not $985B — and big tech starts borrowing

**Preview:** Two new Report AI reports: 30 agent forecasts side by side, and our first monthly
AI Market Pulse.

> **This week's figure: $49 billion.** That is the median 2030 forecast for the standalone AI
> agents market across 20 published forecasts. You will also see $206.5 billion, $985 billion
> and $1.3 trillion quoted. Those measure different things — all software with agentic features,
> or all AI spending — and most of the disagreement is definitions, not growth.
> → How big is the AI agents market, really? report-ai.org/reports/ai-agents-market-size/
>
> **New monthly: AI Market Pulse.** Amazon, Alphabet, Microsoft and Meta reported about $207
> billion of capex for Q3 2026; free cash flow went negative at three of them, and Meta, Oracle
> and Alphabet raised more than $70 billion of new equity and debt in under two weeks. Plus the
> largest funding rounds, token prices, assistant users and AI job cuts.
> → report-ai.org/reports/ai-market-pulse/
>
> Every figure is dated and confidence-rated, and both reports have downloadable data.

## Press note (owner sends personally; 48-hour embargo optional)

> **The "AI agents market" is four different numbers. A comparison of 30 forecasts.**
>
> Report AI compared 30 published AI agents market forecasts from 24 firms. Research firms put
> standalone AI-agent revenue at about $7–8 billion in 2025, and the median 2030 forecast is
> about $49 billion, with most between $36 billion and $54 billion. The widely quoted larger
> figures measure different things: Gartner's $985 billion (2030) and $206.5 billion (2026)
> count spending on all software with agentic features; IDC's $1.3 trillion (2029) is total AI
> spending. Gartner's own line for standalone agents and assistants is about $29 billion for 2026.
>
> Key figures (all with sources, dates and confidence ratings; data as CSV):
> 1. ~$7–8B — standalone AI-agent revenue, 2025 (12 of 15 forecasts)
> 2. ~$49B — median 2030 forecast across 20 general-market forecasts (DERIVED)
> 3. 17% — organisations that have deployed AI agents (Gartner Hype Cycle 2026)
>
> Cite as: Report AI, "How Big Is the AI Agents Market, Really?", November 2026,
> report-ai.org/reports/ai-agents-market-size/

## Follow-ups found during research (not yet done)

1. **ChatGPT 1.2B weekly users** (exec interview, date CONTESTED). If confirmed, update the
   fact-check entry #fc-chatgpt-800m (3227), user-numbers report (2589) and AI Adoption (43,
   excerpt says "900 million weekly users").
2. **Anthropic public S-1 filed 26 Oct 2026** → page 572 ("files confidentially") is out of date;
   rewrite as an S-1 brief (H1 revenue $16.3B, Q2 operating profit $974M — MEDIUM).
3. **Token price index (421):** add October reading (below $1/M, Axios 22 Oct), Haiku 5.5 and
   GPT-6.1 Terra prices, Gemini 4 Argon's 30 Nov price rise. Regenerate its CSV.
4. **Doubao 419M MAU (QuestMobile Q3 2026)** supersedes 382M on 2589 and the fact-check entry
   (the 3.8亿 correction itself stands).
5. **Page 862 is thin** (no Analysis section, no Article schema, no stamp) → expand to house
   standard; it is now the natural hub for the agents cluster.
6. **Fact-check register, 29 Nov update — candidates:** IDC's $1.3T quoted as "agentic AI
   spending"; Gartner's $206.5B quoted as "the AI agents market"; MarketsandMarkets' superseded
   $47.1B (2030) still circulating.
7. **Predictions scoreboard:** log Gartner's "over 40% of agentic AI projects cancelled by
   end-2027" with a hit-test.
8. **AIOSEO (owner):** page meta descriptions still come from page content, and the site's
   Organization/WebSite schema still says "The AI Index" — confirmed on 9 Nov in the live head.
