# report-ai.org — Site Blueprint

**One-stop hub for AI statistics, reports, and enterprise-AI assessment.**
Mix of *aggregated* third-party reports and *original* research/assessment.

---

## 1. Positioning

A trustworthy, citable reference for anyone researching the state of AI —
journalists, analysts, consultants, founders, and enterprise decision-makers.
The value is not "another AI blog" but **structured, sourced, up-to-date
numbers** that are easy to find, filter, and cite.

Three things this site must nail:
1. **Source discipline** — every stat links to a primary source with a date.
2. **Findability** — search + filtering by topic, source, year, region, industry.
3. **Freshness** — clear "last updated" signals and an annual refresh cadence.

**Differentiator (the "assessment" angle):** an *Enterprise AI Readiness /
Maturity Assessment* — an interactive quiz that scores a company and returns a
benchmarked report. This produces original data (aggregate, anonymized results
become publishable stats) *and* drives email capture + repeat visits.

---

## 2. Information Architecture

### Top navigation
- **Reports** — long-form aggregated + original reports
- **Statistics** — the searchable stat library (the core asset)
- **Topics** — themed hub pages
- **Trends** — annual "State of…" pillar pages
- **Assessment** — the Enterprise AI Readiness tool
- **About / Methodology**

### Content types
| Type | Purpose | Key fields |
|------|---------|-----------|
| **Statistic** | One citable data point | value, metric, source, source URL, date published, region, industry, topic |
| **Report** | Long-form roundup / original research | topic, year, summary, downloadable PDF |
| **Topic hub** | Evergreen pillar page linking to stats + reports | topic, intro, curated stat list |

> On WordPress.com, "Statistic" and "Report" can be implemented as custom post
> types (Business plan + a CPT plugin) or, to launch faster, as **categories +
> a consistent post template**. Recommendation below.

### Taxonomies (apply to every stat/report)
- **Topic:** Adoption & Usage · Enterprise AI · Investment & Funding · Jobs & Labor · Models & Benchmarks · Safety & Governance · Generative AI · Infrastructure & Compute
- **Industry:** Healthcare · Finance · Retail · Manufacturing · Tech · Public Sector · Education
- **Region:** Global · North America · Europe · Asia-Pacific · Other
- **Year:** 2024 · 2025 · 2026 …
- **Source:** Stanford AI Index · McKinsey · Gartner · OpenAI · etc.

---

## 3. Launch content plan

### Pillar pages (build first — these are the SEO engine)
1. **State of Enterprise AI 2026** — flagship annual roundup
2. **AI Adoption Statistics 2026** — adoption rates by company size/industry/region
3. **Generative AI in the Enterprise** — usage, ROI, use cases
4. **AI Investment & Funding Trends** — VC, M&A, capex
5. **AI & Jobs: Labor Market Statistics**

Each pillar = intro + 15–40 individual stats (each linking to its source) +
internal links to related stat posts. This "pillar + cluster" model is the
proven pattern for stats sites.

### Seed stat backlog (first ~25 posts)
Curated from primary sources such as: Stanford HAI **AI Index Report**,
**McKinsey State of AI**, **Gartner**, **IDC**, **OpenAI/Anthropic usage data**,
**Ramp/enterprise spend trackers**, **government AI strategy docs**. Each post:
the number, context, source link, date, and the relevant taxonomies.

### Original research (the moat)
- **Enterprise AI Readiness Assessment** (interactive) → quarterly aggregate report.
- Periodic **original surveys** of practitioners.

---

## 4. Build checklist

### Prerequisites (need you / your account)
- [ ] Confirm domain `report-ai.org` is registered and ready to point at WordPress.com
- [ ] Create the WordPress.com site and attach `report-ai.org`
- [ ] **Paid plan** (Business recommended — enables plugins for search, tables, CPTs, SEO)
- [ ] Enable MCP abilities at https://wordpress.com/me/mcp (plans-list, domain-purchase) if you want me to handle checkout/DNS

### Things I can do once the site + plan exist
- [ ] Activate a clean, data-friendly theme
- [ ] Build the category/taxonomy skeleton
- [ ] Create the 5 pillar pages (with draft copy)
- [ ] Create the seed stat posts
- [ ] Set up primary navigation + homepage
- [ ] Draft About / Methodology pages
- [ ] Configure on-site search + filtering

### Recommended plugins (Business plan)
- SEO (e.g., Yoast / SEO Framework)
- Tables & charts (TablePress / a charts block)
- Custom post types + custom fields (for Statistic/Report) — optional v2
- Faceted search / filtering
- Forms/quiz (for the Assessment) — e.g., a quiz or form plugin

---

## 5. Phasing

**Phase 1 — MVP launch (fastest path):**
Categories + post template (no CPTs yet). 5 pillar pages, ~15 stat posts,
homepage, About/Methodology. Goal: a credible, sourced, navigable site live.

**Phase 2 — Structure & search:**
Convert to custom post types + custom fields, add faceted filtering,
"last updated" stamps, downloadable report PDFs.

**Phase 3 — Original data:**
Launch the Enterprise AI Readiness Assessment, email capture, first
original/aggregate report. Establish annual refresh cadence.

---

## 6. Open questions for you
1. **Plan tier** — go Business (plugins/CPTs/search) or start on Premium and upgrade later?
2. **Brand/tone** — analyst-serious (think Gartner) or accessible/editorial (think Our World in Data)?
3. **Monetization** — lead-gen for consulting, sponsorships/ads, paid reports, or just authority/audience for now?
4. **Cadence** — how often can stats be refreshed (weekly/monthly)? Drives the freshness strategy.
