# The aggregator is still running — findings 2026-09-12

**Task #4 was not about agile-agilist.com.** The event aggregator there is a separate
(real, but lower-priority) duplicate. The live problem is on **report-ai.org**.

## What is happening

Four posts published since yesterday are verbatim third-party content:

| ID | Title | Actually from |
|---|---|---|
| 2307 | Lifesaving Lincoln Laboratory device wins 2026 Excellence in Technology Transfer Award | MIT Lincoln Laboratory |
| 2308 | The Download: biotech's future and cheaper, cleaner steel | **MIT Technology Review** newsletter |
| 2309 | Meet the under-35s shaping the future of biotech | **MIT Technology Review** |
| 2310 | Rapidly scaling online storage to serve over 1 billion ChatGPT users | **OpenAI blog** |

Their IDs are **higher than the pillar pages created 11 Sep (2297–2300)**, so the
importer ran *after* that work — it is live now, not historical.

## It is also publishing to social

`_publicize_shares` on 2308 and 2310 shows **successful** posts to **LinkedIn, Threads
and Facebook** as "The AI Index" (LinkedIn share IDs 7504237836209106944 /
…729028608). Buffer also fired and failed: `X Free Profile: AIbyNumbers: grant request
is invalid`.

So third-party editorial is being republished under our brand and syndicated to three
networks automatically. That is a copyright and brand-integrity problem, not just the
duplicate-content/SEO problem CLAUDE.md's linking rule 4 describes.

## Which component is doing it — narrowed, not confirmed

- **Not Feedzy.** `feedzy_imports` post type exists but contains **zero** import jobs.
- **Not WP RSS Aggregator** as far as can be seen — no `wprss_feed` post type registered.
- The posts carry **`_rai_source_url`** and **`_rai_aggregated`** meta. The `_rai_`
  prefix is custom (Report AI), so this is **our own code**, not a plugin's.
- The site has **two snippet managers active: Code Snippets 3.9.6 and WPCode Lite
  2.3.8.** A duplicated snippet across both is the most likely "second copy".

**Limitation:** Code Snippets stores snippets in the `wp_snippets` table, which is not a
post type and is not reachable through the WordPress MCP tools. The `cron` option also
returned `false` through `wp_get_option`. So the snippet itself must be found in
wp-admin — this cannot be completed from here.

## Where to look

1. **wp-admin → Snippets** (Code Snippets) — look for anything fetching feeds or writing
   `_rai_aggregated`.
2. **wp-admin → Code Snippets (WPCode)** — same.
3. Disable whichever is the duplicate; if both are active, that is the second copy.

## Corroborating evidence

**583 posts in trash** against 40 published. That is consistent with a prior purge of
imported posts — i.e. one copy was already dealt with, and a second kept importing.
Exactly what task #4 describes.

## Recommended, pending owner go-ahead

1. Kill the snippet first (stop the source) — needs wp-admin.
2. Then trash or noindex 2307–2310. CLAUDE.md linking rule 4 already authorises pruning
   auto-republished RSS posts, and 583 trashed posts set the precedent — but four *live*
   posts is a batch deletion, so confirm scope first.
3. Note that trashing the posts does **not** retract the LinkedIn/Threads/Facebook
   shares. Those need removing by hand if they matter.
4. Decide whether Jetpack Publicize should be gated so nothing auto-shares without review.

---

## Update 2026-09-12 — ruled out, and where it actually points

Owner supplied the WPCode snippets. **Neither is the aggregator:**
- "Report AI — nav support v2" — nav CSS/PHP/JS
- "Links in new windows" — the external-link `target="_blank"` rule

Further checks this session:

| Candidate | Verdict | Evidence |
|---|---|---|
| WPCode Lite | **Ruled out** | Both active snippets inspected; neither touches feeds |
| Feedzy RSS Feeds Lite | **Ruled out** | `feedzy_imports` holds exactly one item: an unconfigured "Setup Wizard" draft (ID 216). Zero real jobs, published or otherwise. |
| WP RSS Aggregator | **Ruled out (inactive)** | Registers no `wprss_feed` post type, so it is not running |
| A dedicated bot/API user | **Ruled out** | `wp_get_users` returns one user only — the admin |

So the importer authenticates **as the admin** and is not any installed feed plugin.

### Two remaining candidates

**1. External service writing over the REST API — currently the stronger theory.**
An **n8n** MCP server is configured for this account (it failed to connect on 11 and 12
Sep with a 404, so it could not be inspected from here). An RSS → WordPress workflow is
a textbook n8n job, and writing custom `_rai_source_url` / `_rai_aggregated` meta fits a
hand-built workflow far better than it fits any plugin's schema. Zapier or Make would
look identical from inside WordPress.

**2. Code Snippets 3.9.6** — the second snippet manager, not yet inspected. Its snippets
live in the `wp_snippets` table, which is not a post type and is unreachable via the
WordPress MCP tools.

### The decisive test (fast)

**wp-admin → Users → Profile → Application Passwords.** If a token exists with a recent
"Last Used" date, an **external service** is writing the posts and no amount of plugin
or snippet hunting inside WordPress will find it — the fix is to revoke that token or
disable the workflow at its source. If there is no such token, the code is inside
WordPress and Code Snippets is the place to look.

Cross-check: posts 2307–2310 were created around 11 Sep 2026. Matching that timestamp
against n8n execution history would settle it outright.
