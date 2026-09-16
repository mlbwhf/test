# report-ai.org lost 95% of its search impressions on 17 August 2026

Analysis of the Search Console coverage export (`Coverage-2026-09-16.zip`, property
"All known pages"). Written 16 Sep 2026.

**This is the most serious thing found in this workstream. It outranks everything
currently queued.**

## The collapse

| Window | Mean impressions/day |
|---|---|
| 17 Jun – 16 Aug (61 days) | **552** |
| Last 14 days before the cliff | **704** |
| 17 Aug – 3 Sep (18 days) | **37** |

- **94.7% drop** against the immediately preceding fortnight
- Overnight: **466 → 43** between 16 and 17 August
- Sustained for 18 days with no recovery (range 17–48)
- **~12,000 impressions lost** in 18 days against the prior baseline
- Peak was 951 on 12 Aug — five days before the cliff

## The decisive fact: indexed page count did NOT fall

| Date | Not indexed | Indexed |
|---|---|---|
| 14 Aug | 327 | **466** |
| **17 Aug** | **373** (+46) | **466** (unchanged) |
| 21 Aug | 431 | 467 |
| 28 Aug – 3 Sep | **515** | **470** |

Indexed went **466 → 470**. It went *up*.

**The same pages are still indexed. They simply stopped being shown.** That single fact
eliminates most of the usual suspects:

| Ruled out | Why |
|---|---|
| Mass deindexing | `indexed` would have collapsed; it rose |
| Content deletion (e.g. purging the 583 trashed RSS posts) | same — indexed count is flat |
| Sitewide `noindex` | same |
| robots.txt block | only **1** page is blocked by robots.txt |
| Server outage / 5xx | would degrade `indexed` over following weeks; it did not |

## The numeric coincidence that is probably not a coincidence

On 17 August, `not indexed` rose by **exactly 46**.

The critical-issues file reports **"Not found (404) — 46 pages — Validation: Failed."**

**46 = 46.** On the day impressions collapsed, 46 URLs started returning 404. Someone has
already asked Google to validate a fix, and Google re-checked and found them **still
broken** — that is what "Validation: Failed" means.

### Why this is a credible cause of the whole drop

Search traffic is usually concentrated in a small number of URLs. If those 46 were the
site's top performers and they moved or were deleted **without redirects**, impressions
would fall off a cliff immediately — exactly the shape observed — while the remaining 466
indexed pages carried on earning their usual (small) share.

### And there is a known mechanism on this site

Confirmed in this workstream on 11 Sep and now documented in CLAUDE.md:
**`wp_create_post` silently ignores `post_parent`.** Pages land at the site root
(`/customer-support/`) instead of nested (`/indexes/.../customer-support/`). Fixing the
parent afterwards **changes the URL a second time**.

Any batch create-then-reparent — or any slug or hierarchy change — moves URLs. If that
happened around 17 August and no redirects were written, the old URLs become 404s and
their accumulated ranking is lost. **The Redirection plugin is installed but evidently
was not used for these.**

## The second problem, which explains why it has not recovered

| Reason | Pages |
|---|---|
| Discovered – currently not indexed | **280** |
| Excluded by 'noindex' tag | 157 |
| Not found (404) | 46 |
| Page with redirect | 21 |
| Crawled – currently not indexed | 10 |
| Blocked by robots.txt | 1 |
| **Total not indexed** | **515** |
| Indexed | 470 |

**More than half the known site is not indexed**, and the largest single bucket is
**280 "Discovered – currently not indexed"** — Google has found these URLs and *declined
to crawl them*. At that scale it is a site-level quality judgement, not a technical fault.

The obvious candidate cause is on record: the site has been **auto-republishing verbatim
third-party content** — MIT Technology Review, OpenAI's blog, MIT Lincoln Laboratory —
with **583 posts in trash, 44 drafts, and 4 published as recently as 11 September**
(see `rss-aggregator-finding.md`). Scraped content is explicitly covered by Google's
spam policies, and "Discovered – currently not indexed" at this ratio is the classic
symptom of a site Google has decided is not worth crawling.

**This reclassifies task #4.** Killing the aggregator is not housekeeping — it is
plausibly load-bearing for recovery.

## Ranked hypotheses

1. **46 top-performing URLs moved or were deleted without redirects on 17 Aug.**
   *Evidence: exact +46 match, validation already failed, known post_parent/URL-change
   mechanism on this site.* Strongest single explanation for the timing and the shape.
2. **Site-level algorithmic demotion (core or spam update) landing ~17 Aug.**
   *Evidence: overnight onset, sustained flatline, indexed count untouched, 280
   discovered-not-indexed, and a live scraped-content problem.* Best explanation for
   the failure to recover.
3. **Manual action for scraped content.** Same signature as 2. **Trivial to check and
   not yet checked.**
4. **Search Console reporting artefact** (property change, filter, domain vs URL-prefix
   split). Would mean no real traffic was lost. Cheap to falsify — see below.

1 and 2 are not mutually exclusive; the cleanest reading is that a URL-move event caused
the cliff and an unresolved quality problem is preventing recovery.

## What to do, in order

**1. Check for a manual action — 30 seconds.**
GSC → **Security & Manual Actions → Manual actions**. If there is one for scraped or
thin content, that is the answer and everything else is secondary.

**2. Falsify the reporting-artefact theory — 2 minutes.**
Open Site Kit / MonsterInsights / Microsoft Clarity (all installed) and check whether
**real organic sessions** fell on 17 Aug. If sessions held steady, this is a GSC data
problem, not a traffic problem, and the urgency drops sharply. **Do this before any
remediation work.**

**3. Export the 46 404 URLs.**
GSC → **Pages → Not found (404) → Export**. Send the list here. I will map each to its
current live URL and write the redirect table. The **Redirection plugin is already
installed**, so this is fixable the same day. Do not re-request validation until the
redirects exist — that is why it failed the first time.

**4. Kill the aggregator** (task #4). The remaining place to look inside WordPress is
**wp-admin → Snippets (Code Snippets 3.9.6)** — search the snippet code for `_rai_`.

**5. Then purge or noindex the scraped posts**, including the 4 live ones (2307–2310),
and keep them from returning. Recovery from a quality demotion requires the cause to be
gone, not just paused.

**6. Only then re-request validation** on the 404s.

## What could not be checked from here

`report-ai.org` is unreachable through this environment's egress proxy (returns 000), so
robots.txt, meta-robots tags, the sitemap and sample 404s could not be inspected
directly. The `set_up_the_agent` WordPress connector is also disconnected and awaiting
re-authorisation, so no live site data could be queried. **Everything above is derived
from the four CSVs in the export alone** — the diagnosis is a ranked set of hypotheses,
not a confirmed root cause.

The export also contains **no URLs** — `Critical issues.csv` gives only reasons and
counts. Step 3 above is therefore the single highest-value thing to send back.
