# report-ai.org — Publishing Cadence & Monthly Refresh Playbook

This is the standing operating procedure for (A) the staggered report
publishing schedule and (B) the monthly homepage stat refresh. It is written
to be run by a **scheduled Claude Code (web) session** or by hand. Site is
managed via the WordPress.com MCP; the homepage is **page id 6**.

_Last reviewed: 2026-06-15._

---

## A. Staggered report publishing (weekly, Thursdays 14:00 UTC)

The blueprint defines **5 flagship pillar reports**. We drip one per week so
each gets its own news cycle and Google sees a steady freshness signal, rather
than dumping all five at once.

| # | Report | Status | Slot |
|---|--------|--------|------|
| 1 | The State of Enterprise AI in 2026 (post id 14) | **Scheduled** | Thu 2026-06-18 |
| 2 | AI Adoption Statistics 2026 | Not drafted — slot reserved | Thu 2026-06-25 |
| 3 | Generative AI in the Enterprise | Not drafted — slot reserved | Thu 2026-07-02 |
| 4 | AI Investment & Funding Trends | Not drafted — slot reserved | Thu 2026-07-09 |
| 5 | AI & Jobs: Labor Market Statistics | Not drafted — slot reserved | Thu 2026-07-16 |

**Rule for each report (run when its draft is ready):**
1. Confirm the draft is complete and every figure links to a primary source
   with a date.
2. Set it to scheduled: `posts.update` with `status: "future"` and
   `date: "<slot>T14:00:00"`.
3. After it publishes, add it to the homepage **Popular reports** list and
   cross-link from related stat posts.
4. Any *new* report beyond the five takes the next open Thursday slot.

> Slots for #2–5 are **reserved, not set in WordPress** — you can't schedule a
> post that doesn't exist yet, and auto-publishing an empty placeholder would
> push a blank page live. Draft first, then schedule into the slot.

### Weekly homepage update (same Thursday run)

The homepage **"Leading AI assistants — weekly active users"** panel is
weekly-cadence data, so it is refreshed **weekly** (not monthly): on the same
Thursday run, re-check each assistant's latest weekly-active-user figure
(ChatGPT / Gemini / Meta AI / Copilot / Claude / Perplexity) and update the
bar widths + numbers on page id 6.

---

## B. Monthly homepage stat refresh (1st of each month)

The homepage "AI by the numbers — 2024 to 2026" strip and the "Leading AI
assistants" panel carry a visible **"Last updated: <Month Year> · refreshed
monthly"** stamp. That promise is only kept if the numbers are actually
re-checked. Each month:

1. **Re-verify the four headline cards** against their primary sources, updating
   value + bar widths if they've moved:
   - Organizations using AI — McKinsey State of AI
   - Worldwide AI spend — Gartner
   - Use gen AI at work — (source still to be confirmed)
   - Inference cost, GPT-3.5-class — Stanford HAI AI Index
2. _(The assistant **weekly**-active-users panel is refreshed on the weekly
   Thursday run — see section A, not here. Figures are currently
   **illustrative**; priority is to replace with confirmed numbers.)_
3. **Re-verify the 2024 / 2025 back-figures** (also currently illustrative) so
   the trend bars are fully defensible.
4. **Bump the stamp** to the current month.
5. Save page 6 (this updates its `modified` date — a real freshness signal).

---

## C. Running this on a schedule (web session trigger)

There is no in-session cron; persistent scheduling lives in the Claude Code web
dashboard. Create **two scheduled sessions** pointed at this repo:

- **Monthly** (1st, ~14:00 UTC) — prompt:
  > Run section B of `report-ai-org-publishing-and-refresh.md`: re-verify each
  > homepage stat against its primary source, update page id 6 on report-ai.org
  > via the WordPress MCP, bump the "Last updated" stamp, and report what
  > changed.
- **Weekly** (Thursdays, ~13:00 UTC) — prompt:
  > Run section A of `report-ai-org-publishing-and-refresh.md`: (1) refresh the
  > homepage "Leading AI assistants — weekly active users" panel on page id 6
  > against each provider's latest weekly-active-user figures; and (2) if the
  > next pillar report in the table is drafted and complete, schedule it into
  > its slot, otherwise report which report is still missing.

Docs: https://code.claude.com/docs/en/claude-code-on-the-web

---

## D. Manual fallback

If the schedule isn't armed, run the same two prompts above by hand at the
start of each month / each Thursday. The checklist is identical.
