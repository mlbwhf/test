# Why report-ai.org is being blocked by corporate networks

Diagnosis, 3 September 2026. Evidence gathered from the site itself.
**Executed 8 September 2026 — see "What was actually done" at the end.**

---

## Correction to this diagnosis (8 September 2026)

Two claims below were wrong or overstated, and the record should say so:

1. **"Verbatim copies of full articles" overstated the WPCode aggregator.** Reading
   the snippet's source (archived at `archive/427-news-aggregator-DISABLED.php`)
   shows it published a **45-word excerpt** plus a source link and an
   "automatically aggregated summary" disclaimer, with `rel=canonical` pointing at
   the original. That is thin duplicate content and a textbook scraper signature —
   it is still the reason for the blocking — but it is **not** the wholesale
   copyright infringement I described. The urgency was right; the legal
   characterisation was not.
2. **The scale of the problem was understated in a different direction.** A
   *second* importer was missed entirely: the **Feedzy** plugin, which pulled
   **full articles from `agile-agilist.com`** into Report AI, each ending
   "The post … first appeared on Agile Agilist", with backlinks. Those are full
   copies, and they are an **independence-firewall breach** — the parent company's
   marketing copy republished on the measurement site.

## The finding

**The site now has 619 published posts, and the great majority are auto-republished
scraped content — including verbatim copies of other publishers' copyrighted articles.**

A sample of the most recent posts:

| Post | Actual source | What was copied |
|---|---|---|
| "The Download: the hunt for underground hydrogen…" | **MIT Technology Review** | Their daily newsletter, verbatim, opening "This is today's edition of The Download, our weekday newsletter" |
| "Data from drones in Ukraine is fueling a new Wild West marketplace" | **MIT Technology Review** | Full article |
| "Supporting independent journalism in Ukraine" | **OpenAI** | Their blog post |
| "An Alien Mind" | **OpenAI** (Jakub Pachocki) | Their blog post |
| "Research acceleration: The view inside OpenAI" | **OpenAI** | Their blog post |
| "KernelGenBench…", "SV-Detect…", "Graph Foundation Models…" | **arXiv** | Abstracts, republished with the raw metadata still attached: `arXiv:2607.27231v2 Announce Type: replace Abstract:` |

This is the cause. Everything else below is secondary.

## Why this triggers blocks

Reputation engines (Netcraft, Webroot/OpenText, Cisco Talos, Zscaler, Palo Alto PAN-DB,
Forcepoint, Fortinet) run automated classifiers that look for exactly this signature:

1. **High-volume duplicate content** — hundreds of pages whose text matches other domains
   word-for-word. This is the textbook definition of a **content scraper**, and most
   vendors have a dedicated category for it ("Content Server", "Spam", "Questionable").
2. **Unedited machine artefacts** — `arXiv:2607.27231v2 Announce Type: replace` in visible
   body text is a fingerprint of an unattended feed importer. No human-edited publication
   contains that string.
3. **Publisher complaints.** MIT Technology Review and OpenAI both actively protect their
   content. A single DMCA or abuse report from either lands the domain on blocklists that
   propagate across vendors within days.
4. **Publishing velocity inconsistent with staffing** — hundreds of posts on a domain a
   few months old, with no named author, reads as automated.

## Contributing factors, in order

| # | Factor | Severity | Evidence |
|---|---|---|---|
| 1 | **Scraped/duplicated content at scale** | **Critical** | 619 posts, majority aggregator output; verbatim MIT Tech Review + OpenAI articles |
| 2 | **URL slugs containing "porn" and "nudify"** | **High** | `/reports/dark-side-of-ai/ai-deepfake-porn-nudify-apps-statistics/` — many filters categorise on the URL *string*; "porn" in a path is a near-automatic Adult-category hit regardless of the page's actual (legitimate, research-focused) content |
| 3 | **Domain age** | Medium | Site content dates from June 2026 — roughly three months old. Many enterprises block newly-registered domains for 30–90 days by policy |
| 4 | **No named author or editorial identity** | Medium | Every page is bylined "Report AI" with no person. Reputation scoring weights identifiable ownership |
| 5 | **Shared hosting IP reputation** | Low–Medium | Shared Hostinger IP; a spammy neighbour on the same IP can drag the range down |

**Note on #2:** the deepfake/nudify page is legitimate, important research journalism.
The problem is purely that automated categorisers read the URL. This is fixable without
touching the content.

---

## What to do, in order

### 1. Stop the aggregator and remove the scraped posts (do this first)

Nothing else works while this continues. Republishing MIT Technology Review and OpenAI
articles verbatim is copyright infringement independent of any blocking issue — this
needs fixing on its own merits, urgently.

- **Deactivate the WPCode snippet "Report AI — AI News Aggregator (cron)"** and the
  **WP RSS Aggregator** and **Feedzy RSS Feeds Lite** plugins.
- **Delete** the scraped posts (not draft — delete, so they 404 or 410). Keep only
  original Report AI writing.
- Anything genuinely worth keeping gets **rewritten in our own words with a link to the
  original**, per the standing content rule.

Expect this to be several hundred posts. That is the correct outcome: a measurement
publication with 30 excellent sourced pages beats one with 619 pages of other people's
work.

### 2. Fix the URL slug

Change `ai-deepfake-porn-nudify-apps-statistics` to something like
`ai-deepfake-image-abuse-statistics`, with a 301 from the old URL. Same content, same
argument, no filter-triggering keyword in the path. Check for other slugs with the same
problem.

### 3. Add editorial identity

A named editor, a real postal address, and a masthead. This is already outstanding and
matters for the funding application too — it also raises reputation scores materially.

### 4. Then request recategorisation — but only after 1–3 are done

Submitting appeals before cleaning up wastes the appeal; reviewers look at the live site.

| Vendor | Where |
|---|---|
| **Palo Alto (PAN-DB)** | https://urlfiltering.paloaltonetworks.com/ — look up the domain, then "Request Change" |
| **Zscaler** | https://sitereview.zscaler.com/ |
| **Cisco Talos** | https://talosintelligence.com/reputation_center/ — dispute via the site |
| **Forcepoint** | https://csi.forcepoint.com/ |
| **Fortinet FortiGuard** | https://www.fortiguard.com/webfilter — submit a rating request |
| **Netcraft** | Report via netcraft.com |
| **Webroot / OpenText BrightCloud** | https://www.brightcloud.com/tools/url-ip-lookup.php |
| **Google Safe Browsing** | Check in Search Console → Security Issues |

Suggested category to request: **Business / Economy** or **News / Media**, not Technology.

### 5. Diagnostic step worth doing first

Ask two or three of the blocking companies for the **exact block message**. It usually
names the vendor and the category ("Blocked: Spam — Zscaler"). That tells you which
vendors to appeal to and what they think the site is, instead of appealing to all eight
blind.

---

## The honest framing

I flagged the RSS reposts twice before — as an SEO problem (crawl budget, duplicate
content, 3,844 impressions for other people's paper titles). I under-called it. The
volume has since grown to 619 posts, and the content includes verbatim copies of major
publishers' work.

This is no longer an SEO issue. It is a **legal exposure and a reputational one**, and it
is almost certainly why enterprises are blocking the domain. For a site whose entire
positioning is independent, credible measurement — and which is being submitted to a
funding body on that basis — hosting hundreds of scraped articles from MIT Technology
Review and OpenAI is the single biggest risk on the site.

---

## What was actually done — 8 September 2026

### Both importers stopped

| Source | Object | Action |
|---|---|---|
| WPCode snippet 427, "AI News Aggregator (cron)" | post 427 | set to **draft**; body replaced with a one-shot cleanup routine, then re-drafted. Original code archived at `archive/427-news-aggregator-DISABLED.php` |
| Feedzy import job "Setup Wizard" (`feedzy_job` 216) | post 216 | set to **draft** |
| Cron event `rai_pull_ai_news` | — | no longer registered (the snippet that scheduled it is gone) |

### 583 posts removed

Selector used: the exact sentence the aggregator stamped into every post it
created — `"Automatically aggregated summary"` — cross-checked against the meta
fingerprints `_rai_aggregated = 1` and `_rai_source_url`.

Validated before deleting: **none** of 23 known-original post IDs (20, 217–221,
807–811, 986, 1096–1099, 1166, 1609–1613, 1627) appeared in the match set.

| | Before | After |
|---|---|---|
| Published posts | 619 | **36** |
| In trash | 0 | **583** |
| Posts still matching the scraper selector | 589 | **0** |

Everything was **trashed, not permanently deleted** — all 583 are restorable from
WP Admin → Posts → Trash. WordPress empties trash automatically after 30 days, so
that is the window to reverse this.

The 36 survivors were each checked by hand and are all genuine Report AI work:
the stat pages, the index/report pages, the essays (217–221, 807–811), and the
Agile Agilist syndications.

### Slug fixed

Page 541: `/reports/dark-side-of-ai/ai-deepfake-porn-nudify-apps-statistics/`
→ `/reports/dark-side-of-ai/ai-deepfake-image-abuse-statistics/`

`_wp_old_slug` was set manually so the old URL 301s rather than 404s (WordPress
did not create it automatically for this edit). The old path was also hard-coded
in 8 places inside the page — the JSON-LD `@id` and `mainEntityOfPage`, the "cite
this page" line, and the X/LinkedIn/email share links — all replaced.

### Still open

1. **The Feedzy cross-posts from agile-agilist.com are still published** — posts
   1096, 1097, 1098, 1099, 1166, 1609, 1610, 1611, 1612, 1613, 1627. These are
   full copies of the parent company's articles with no disclosure. Posts 106 and
   107 do the same thing but *are* labelled "Syndicated from Agile Agilist", which
   is the pattern that satisfies the firewall. **Decision needed:** add the same
   visible disclosure line to the eleven, or remove them.
2. **Deactivate the Feedzy and WP RSS Aggregator plugins outright.** Drafting the
   import job stops it; removing the plugins removes the possibility of it
   restarting. This needs WP Admin — the MCP connector cannot toggle plugins.
3. **Jetpack Publicize was auto-broadcasting the scraped posts** to LinkedIn,
   Threads and Facebook under the name "The AI Index". Those social posts still
   exist and still link to URLs that now 404. Worth a pass.
4. **Named editorial identity** — still outstanding, still blocked on a name.
5. **Vendor recategorisation requests** — now worth submitting; the site no longer
   looks like a scraper. Use the vendor table above.
6. **The page title of 541 still reads "Deepfake Porn and Nudify Apps."** The URL
   was the main filter trigger and that is fixed. Whether to soften the title is
   an editorial call, not a technical one.
