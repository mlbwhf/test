# Why report-ai.org is being blocked by corporate networks

Diagnosis, 3 September 2026. Evidence gathered from the site itself.

---

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
