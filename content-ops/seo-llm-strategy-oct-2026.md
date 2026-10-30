# Standing out as an AI statistics source — SEO + LLM plan

Written 29 Oct 2026 from a live audit of all 147 published pages plus the AIOSEO
settings, and from what the 13-page Dark Side refresh exposed about the competition.

---

## The positioning: be the layer that checks the numbers

The "AI statistics" space is crowded with roundup pages — the vendor blogs and listicle
sites that turned up in nearly every search this week ("150+ Deepfake Statistics",
"Phishing Statistics [2026]", etc.). They all repeat the same figures, and the refresh
showed how many of those figures are wrong:

| Widely repeated | What the source actually supports |
|---|---|
| Fake Pentagon image "wiped $500B" | the reported dip implies ~$90–250B |
| "82.6% of phishing is AI-written" | 82.6% had *any* AI involvement |
| "AI articles overtook human ones" (attributed to Ahrefs) | Graphite's finding, since revised to a ~50% plateau |
| "Chatbots repeat false claims 62% of the time" | untraceable; NewsGuard's series is 18% → 35% → 28.8% |
| *Bartz v. Anthropic* found training wasn't fair use | it found training **was** fair use |
| "Over 80% of cyberattacks involve AI" | no traceable source |
| "Doubao 3.8 billion users" | mistranslation of 3.8亿 = 382M |

**Nobody else publishes this.** Roundup sites can't, because their model is repetition.
That is the opening: *the AI statistics source that tells you which numbers are wrong.*
It is also exactly what LLMs need — they are constantly asked these figures and have no
reliable way to tell a traced number from a repeated one.

Everything below either removes something that undermines that claim, or builds on it.

---

## 1. Fix first — things actively hurting the site now

### 1a. Meta descriptions on 125 of 147 pages are breadcrumb junk ⚡ 1 minute
AIOSEO → Search Appearance → Content Types → **Pages** → Meta Description is set to
`#post_content`. So Google and every AI search engine get:

> *"Home / Reports / The Dark Side of AI / Synthetic Deception Dark Side of AI · Report
> SYNTHETIC DECEPTION: DEEPF…"*

Posts already use `#post_excerpt`. **Change Pages to `#post_excerpt`.** The excerpts are
maintained and specific (every refreshed page got a new one). Highest return per minute
of anything on this list. Spot-check 3 pages afterwards; any page with a weak excerpt
should get one written.

### 1b. Purge the 94 scraped News posts
Still live (noindexed). The August 2026 Spam Update demotion is the most likely cause of
the traffic loss, and spam demotions lift only after the cause is gone *and* a later
spam update re-evaluates the site. Every week they stay live is a week added to that
wait. Trash them (reversible); the noindex snippet stays as a backstop.

### 1c. One name
The site currently has three:

| Where | Name used |
|---|---|
| Page titles (146 of 147) | **Report AI** |
| Organization + WebSite schema, homepage title, bylines | **The AI Index** |
| X handle | **AIbyNumbers** |

"The AI Index" is Stanford HAI's flagship report — the canonical publication in this
exact category, cited on our own homepage. For search, it means competing for a name
someone else owns. **For LLMs it is worse:** a model reading "according to The AI
Index" is likely to attribute the figure to Stanford, so our work gets credited to
someone else, or blended with theirs. **Recommend: Report AI** — it matches the domain
and 146 page titles already use it; keep "AI, by the numbers" as the tagline. This is a
brand decision for the owner; once made, the schema, bylines and social names change
together.

### 1d. Empty entity signals
- **Social profiles:** every AIOSEO profile URL is empty, so the Organization schema has
  no `sameAs`. Add X, LinkedIn, Threads, Facebook. This is how search engines and LLMs
  connect the site to its accounts.
- **Organization description** says the site works by "combining report aggregation…".
  After a scraped-content demotion, *aggregation* is the wrong word to put in schema.
  Suggested: *"Independent AI statistics. Every figure traced to its primary source,
  dated, confidence-rated and corrected in public."*
- **foundingDate** empty — add it.
- **Author display name is an email address** (user ID 1). It can surface in author
  archives and feeds. Change it to a name or an "Editorial team" label.

### 1e. Three pages competing for one topic
500 (refreshed), 866 and 1111 all target "deepfake fraud statistics"; 866 and 1111
still lead with the superseded $25M record. Pick one canonical page (500), merge the
best of the other two into it, 301 the others. The same check should be run on 499 vs
576 (Dark Side summary vs Dark Side statistics index).

### 1f. Small cleanups
- Sitemap includes the **attachment** post type — thin URLs. Exclude it.
- Every page shares one og:image (the logo). Per-page "stat card" images would help
  shares and AI previews. Low priority.

---

## 2. Build — the assets nobody else has

### 2a. "AI statistics that are wrong" — the flagship page ⭐
A standing register of widely repeated AI figures, each with: the claim as it
circulates, where it circulates, what the source actually says, the corrected figure,
our confidence, and the date checked. **Seed with the seven above** plus the ones from
the user-numbers report (Claude 56M vs 245M; ChatGPT "2.8 billion"). Update monthly.

Why it is the top priority:
- **Links:** journalists and researchers link to "that number is wrong" pages.
- **LLMs:** a model asked "did a fake image wipe $500B off the market?" will find a page
  that answers exactly that question, with the arithmetic.
- **Brand:** it is the positioning, made into one page.

### 2b. A public corrections log
One page listing every correction made on the site, with dates. This cycle alone
produced eight. Most publishers hide corrections; making them public is a trust signal
for people, for Google's quality raters, and for LLMs judging reliability.

### 2c. The prediction scoreboard
Already designed (`prediction-tracking.md`). The first resolutions are close: Gartner's
"40% of enterprise apps with AI agents by end-2026" and the Forrester layoff-reversal
forecast both resolve in December. "We scored the AI forecasts" is a January headline
nobody else will have.

### 2d. Downloadable data
A CSV per index, with the same dates and confidence ratings as the page, plus `Dataset`
schema (the token price index already has it). Data journalists and LLM pipelines both
prefer a file to a table they have to scrape, and downloads earn citations.

### 2e. Named editorial standards
An Editorial Standards page — sourcing rules, the HIGH/MEDIUM/DERIVED scale, the
refresh cadence, the corrections policy, the independence firewall from Agile Agilist —
plus a named editor or editorial team on every report. It is the E-E-A-T gap, and the
Qatar/MCIT "measurement institution" pitch needs it anyway.

---

## 3. LLM optimisation — how AI engines pick what to cite

AI search systems retrieve **passages**, not pages, and favour passages that answer a
question on their own. Published research on "generative engine optimisation" found
that adding statistics, quotations and source citations raised a page's visibility in
AI answers more than any other content change tested. A statistics site that cites
everything starts with an advantage. The job is to make each figure easy to lift out
correctly.

**Write every key figure as one self-contained sentence:** figure + unit + date +
source + scope. *"The FBI's 2025 Internet Crime Report counted 22,364 complaints with an
AI descriptor and $893 million in losses."* — not "Losses hit $893M (FBI)." The FAQ
blocks added this week already follow this pattern; extend it to the stat tiles' prose.

**Keep the date beside the number.** This week's 800M ChatGPT problem shows why: a
figure without its date gets re-quoted as current. LLMs do the same.

**Give each key stat a stable anchor** (`#stat-fbi-ai-losses-2025`) so a citation can
point at the sentence, not just the page.

**Schema must match visible text.** Google's guidance for its AI features is that
ordinary SEO applies and structured data must match what's on the page. The cross-page
consistency rule (§3 of CLAUDE.md) is also the schema rule.

**Bing matters as much as Google here.** Several AI assistants, ChatGPT search among
them, draw heavily on Bing's index. AIOSEO's Bing verification field is empty — confirm
the site is verified in Bing Webmaster Tools by some other route, and that IndexNow
submissions are firing (Bing URL Submission plugin is installed).

**Already right — keep it:** AI crawlers (GPTBot, CCBot, Google-Extended) are **not**
blocked, and **llms.txt is enabled**. Set the llms.txt description to the real
positioning line rather than the tagline. llms.txt is cheap to maintain, but no major AI
provider has committed to using it; don't expect much from it.

---

## 4. Measure it

- **GA4:** a channel group for AI referrers (chatgpt.com, perplexity.ai, copilot,
  gemini, claude.ai). It is small but it is the trend line that matters.
- **Monthly citation check:** ask the major assistants the site's 20 core questions
  ("how much does AI fraud cost", "how many people use ChatGPT"…) and log whether
  report-ai.org is cited. Crude, but nothing else measures it.
- **Search Console:** track impressions recovery after the purge and the next spam
  update; track the debunk page's queries.

---

## Order of work

| # | Action | Who | Effort |
|---|---|---|---|
| 1 | Pages meta description → `#post_excerpt` | owner (AIOSEO UI) | 1 min |
| 2 | Purge 94 News posts | agent, on go-ahead | 10 min |
| 3 | Decide the one name | owner | decision |
| 4 | Social URLs, org description, foundingDate, author name | owner (UI) | 15 min |
| 5 | "AI statistics that are wrong" page | agent | ~1 session |
| 6 | Corrections log page | agent | short |
| 7 | Consolidate 500 / 866 / 1111 + redirects | agent + owner approval | ~1 session |
| 8 | Confirm Bing Webmaster + IndexNow | owner | 10 min |
| 9 | Editorial standards page + named editor | owner decides names; agent drafts | short |
| 10 | CSV downloads + Dataset schema | agent | per index |
| 11 | Prediction scoreboard | agent | January |

Settings changes (1, 4) are left to the owner on purpose: they live in AIOSEO's option
blobs, and rewriting those through the API risks corrupting the plugin's settings site-wide
for a change that takes a minute in the UI.
