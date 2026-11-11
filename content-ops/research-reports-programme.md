# Report AI research programme: what we publish, how often, and how it travels

Written 9 Nov 2026. Builds on `seo-llm-strategy-oct-2026.md` (positioning), `prediction-tracking.md`,
`refresh-policy.md`, `hubspot/integration-plan.md` (newsletter) and the social series in
`social-posts/2026-10-30/`.

## The principle

Roundup sites repeat other people's numbers. Our market research is worth publishing only
where we add something nobody else has, from one of three sources:

1. **Primary data we collect.** The Enterprise AI Readiness Assessment (aggregate only), and
   later short surveys.
2. **Datasets we compile and maintain.** Trackers built from many public disclosures that nobody
   else keeps in one dated, sourced table: AI prices, user numbers, layoffs and reversals, deals,
   forecasts.
3. **Verification.** Checking other people's numbers (the fact-check register, the
   predictions scoreboard). This is the brand.

Every report follows the house standard: analysis, data tables with inline sources, confidence
ratings, methodology note, FAQ, Article + FAQPage + Dataset schema, a CSV, and a "What
changed" block on each update.

---

## 1. Recurring reports (the franchise)

The same report title, every period. Recurring titles build the habit (people wait for them), the
backlinks (journalists cite "the latest edition") and the LLM authority (one URL that is always
current).

| Report | Cadence | What it is | Built from | Status |
|---|---|---|---|---|
| **AI Numbers, Checked** | Monthly (29th) | New entries in the fact-check register: the most-quoted wrong AI stats of the month | Fact-check register (3227) | Live; first update due 29 Nov |
| **AI Market Pulse** | Monthly (1st business day) | One-page dashboard: token prices, assistant user numbers, top funding rounds and deals, notable AI layoffs and reversals, with month-on-month change | Token price index (421), user numbers (2589), reversal report (2293) | New; first edition 1 Dec |
| **AI Pricing Index** | Quarterly | What AI inference costs: frontier list prices, usage-weighted market price, price per capability level, trend | Token price index (421) | Page exists; quarterly edition is new |
| **AI Workforce Tracker** | Quarterly | AI-attributed layoffs, reversals and rehiring, entry-level postings; the "reversal rate" as a running series | Reversal report, jobs pages (2293, 2297–2300) | New series |
| **AI Deals & Capital Tracker** | Quarterly | Funding, valuations, data-centre financing, sovereign AI commitments, separating announced from committed from spent | Investment pages (73, 374, 955) | New series |
| **AI Predictions, Scored** | Twice a year (Jan, Jul) | Which published AI forecasts came true, with hit-tests written in advance | Predictions scoreboard (3233) | Live; **first scoring Jan 2027** (Gartner 40% apps, Forrester layoff reversal, our kill-switch odds) |
| **Enterprise AI Readiness Index** | Quarterly once live | Aggregate scores from the readiness assessment by sector, size and region. The only primary data we would own | Assessment (not built yet) | Blocked on data-handling decisions (below) |
| **AI, The Year in Numbers** | Annual (mid-Dec) | Flagship: the year's defining figures, what changed, what was wrong, what to watch | Everything above | First edition Dec 2026 |
| **Geography of AI / Gulf AI** | Annual | Country-by-country adoption, models, investment and regulation; Gulf deep-dive | Geography pages (1266, 955), regulation (1100) | Pages exist; annual edition is new |

Recurring reports are cheap to produce after the first edition: the structure, tables, CSV and
chart templates are reused, and only the figures and the analysis change.

## 2. Unique reports (one-off deep dives)

One-off deep dives either answer a question people search for, or catch a news moment while
it is live. Pick by three tests: (a) is there a widely repeated number we can check? (b) can we
build a table nobody else has? (c) will people search for it for more than a month?

**Evergreen deep dives (aim for 1–2 a month)**
- *How big is the AI agents market, really?* Every vendor forecast side by side, normalised to one
  definition. The market-sizing report journalists actually need.
- *What AI actually costs a company.* Licence, inference, integration and review-time costs from
  disclosed cases, built from the developer and support data we already have.
- *AI in banking / healthcare / retail.* Sector reports from the spending-by-industry index (376).
- *Sovereign AI: who is spending what.* Committed vs announced national AI money (374, 955).
- *Arabic-language AI.* Models, benchmarks, users. Thin competition and relevant to the Gulf.
- *Why AI user numbers disagree.* Already exists (2589); refresh and promote as a methodology
  piece.

**News-driven briefs (when the moment comes, within 48 hours)**
- Anthropic S-1 goes public: the numbers in the filing vs what was reported.
- EU AI Act enforcement actions; US federal pre-emption; kill-switch bill movement.
- A major AI fraud, outage or layoff reversal: the figure, checked.
- Big model launches: benchmark claims vs independent results.

**Rule for both kinds:** if an external report is the news, rewrite it as our own brief with our
own table and analysis (CLAUDE.md linking rule 4). Never republish it.

## 3. The package: one report, many formats

Each report is produced once and cut into the formats each channel needs:

| Format | Used for | Who makes it |
|---|---|---|
| Web report page (house template) | Search, LLMs, the canonical citation | Agent drafts, owner approves |
| CSV + Dataset schema | Data journalists, researchers, LLM pipelines | Agent |
| PDF (designed, 8–20 pages) | Email attachment, LinkedIn document post, press | Agent (rendered from the page) |
| Chart pack (6–10 PNG cards) | Social, press, embeds | Agent (same card system as the social series) |
| Social series (one card a day for 5–10 days) | LinkedIn, X, Threads, Facebook, Instagram | Agent writes and schedules |
| Newsletter edition | Subscribers | Agent drafts, owner sends |
| Press note (200 words + 3 key figures + embargo time) | Journalists | Agent drafts, owner sends |

## 4. Distribution

### Owned channels (start here, all free)
1. **The site.** The report hub (page 40), internal links from every related index, homepage slot.
   Reports are never gated: figures must be readable by search engines and LLMs.
2. **Newsletter ("The Weekly Figure").** The biggest gap today: Jetpack only emails *posts*, and
   reports are *pages*, so subscribers currently receive nothing. Finish the HubSpot setup
   (`hubspot/integration-plan.md`). Then the Market Pulse becomes the monthly edition, with a
   weekly single-figure email in between.
3. **LinkedIn company page.** The primary B2B channel. Post the PDF as a *document* post
   (carousel), then 5–10 daily chart cards. Start a LinkedIn newsletter on the page for the
   monthly Pulse; it notifies page followers.
4. **X, Threads, Facebook, Instagram.** The daily chart cards. Buffer for LinkedIn and X,
   Planable for the rest (never both for the same network).

### Earned channels (where authority comes from)
5. **Journalists and newsletter writers who cover AI.** Each report gets a press note, an embargo
   (send 48 hours before), and a "cite this" line. The fact-check angle ("this number everyone
   quotes is wrong") is the most pitchable thing we have. Build a list of 30–50 named reporters and
   newsletter authors; send personally, not as a blast.
6. **Expert-source platforms** (Qwoted, Featured, Help a B2B Writer). Answer journalists' queries
   with our figures and a link.
7. **Data and research repositories.** Publish each report's CSV on **Zenodo** (free DOI, citable
   in academic papers), **Kaggle** and **Hugging Face Datasets**. A DOI is a real "measurement
   institution" signal and a source LLM training sets draw on.
8. **Google News / Bing.** Register in Google News Publisher Center; confirm Bing Webmaster +
   IndexNow (owner checklist). Reports should be indexed within hours, not weeks.

### Partnerships (later, deliberately)
9. **Universities and research centres** (e.g. data partnerships, co-authored methodology).
10. **Gulf ecosystem** (relevant to the Qatar/MCIT pitch). Any commissioned or co-funded report
    must carry a visible disclosure and our methodology unchanged. Independence is the product.

### Paid (only for the flagship)
11. A small LinkedIn sponsored budget behind *AI, The Year in Numbers* and the Readiness Index
    launch. Nothing else needs paid promotion yet.

## 5. Launch calendar: next 12 weeks

| Date | Release | Distribution |
|---|---|---|
| 29 Nov 2026 | AI Numbers, Checked: November update | Social series + newsletter |
| 1 Dec 2026 | **AI Market Pulse #1** (December) | LinkedIn doc post, newsletter, X/LinkedIn cards |
| 8 Dec 2026 | Unique: *How big is the AI agents market, really?* | Press note to 30 reporters, Zenodo CSV |
| 15 Dec 2026 | **Flagship: AI, The Year in Numbers 2026** | Full package: PDF, press embargo, 10-day social series, small paid boost |
| 5 Jan 2027 | AI Market Pulse #2 | Newsletter, LinkedIn |
| 12 Jan 2027 | **AI Predictions, Scored #1** (first resolutions) | Press note ("we scored the 2026 AI forecasts"), social |
| Late Jan 2027 | AI Pricing Index Q4 · AI Workforce Tracker Q4 | Newsletter, LinkedIn, Zenodo |
| Feb 2027 | Unique: *What AI actually costs a company* | Press, social |
| Q1 2027 | Enterprise AI Readiness Index, wave 1 (if data decisions made) | Full launch package |

Sustainable steady state: **4 recurring releases a month (1 monthly + quarterlies rotating) and
1–2 unique reports**.

## 6. Decisions only the owner can make

1. **Newsletter platform.** Finish HubSpot (recommended) or stay on Jetpack. Until one sends page
   updates, the newsletter can't carry reports.
2. **Readiness Assessment data handling.** Retention period, aggregate-only publication, and what
   existing client agreements allow, before wave 1 (from the earlier constraints).
3. **Monetisation.** Free and independent (recommended for now), sponsorship of the newsletter
   (with disclosure), or paid data access later. Reports themselves stay free and ungated.
4. **Buffer plan.** The free plan holds 10 queued posts per channel, which is two weeks of daily
   posting. A paid plan, or Planable for everything, is needed for a steady daily cadence.
5. **Press list owner.** Personal pitching works; someone has to send the emails.
6. **Name on the reports.** A named editor improves press pickup and E-E-A-T.

## 7. Honest limits

- Most of our figures are **MEDIUM** confidence because many primary sources (SEC, court dockets,
  some publishers) are not reachable from the research environment. Primary data (the assessment)
  and owner-supplied documents are how we move more figures to HIGH.
- We are not a survey firm. Until the assessment is live, "market research" here means compiled,
  verified secondary data with original analysis. That should be stated plainly on every report.
