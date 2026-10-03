# Owner runbook — the five things only you can do

Written 3 Oct 2026. These need wp-admin, hPanel or connector-settings access that the
MCP tools do not expose. Ordered by urgency.

Where a menu path is uncertain it is marked — plugin UIs move between versions, so
navigate by the label rather than the exact breadcrumb.

---

## 1. Stop the social syndication — do this first

**Why first:** trashing the 91 scraped posts removed them from the site but did **not**
retract the copies already published to LinkedIn, Threads and Facebook under "The AI
Index". Verbatim MIT Technology Review and OpenAI content is sitting on your brand's
social profiles. And the publisher is still live, so the next post syndicates too.

**Both systems must be stopped. They are not the same one.** Post meta on IDs 2308 and
2310 showed `_publicize_shares` with status **`success`** for linkedin, threads and
facebook, while `_wp_to_buffer_*` showed a **failure** (`X Free Profile: AIbyNumbers:
grant request is invalid`). So Jetpack is the one actually working.

### 1a. Jetpack Publicize — the one that matters

1. wp-admin → **Jetpack** → **Social** (older versions: Jetpack → Settings → Sharing)
2. You will see the connected accounts: LinkedIn, Threads, Facebook
3. **Disconnect each one.** Prefer disconnecting over toggling auto-share off — a
   disconnected account cannot be re-enabled by a per-post setting or a plugin update.
4. If you want to keep the connections for manual use, instead find the "automatically
   share new posts" toggle and turn it off for **Posts**.

### 1b. WP to Buffer

1. wp-admin → **Plugins**
2. Find **WP to Buffer** → **Deactivate**
3. (Alternative, if you still use Buffer for scheduled content: WP to Buffer settings →
   **Post** tab → set the Publish action to off, leaving the plugin active.)

### How to verify it worked

Tell me once it is done. The next time the publisher drops a post, I will read its post
meta — **if `_publicize_shares` is absent, the syndication is dead.** That is a
definitive check and costs one tool call.

---

## 2. Find the publisher — Hostinger access logs

Still unidentified after eliminating: Feedzy · Code Snippets · WPCode · WP RSS
Aggregator · a dedicated API user · Application Passwords · Claude Routines · the
AI Engine bearer token (rotating it did **not** stop the posts).

It authenticates as your admin account and posts **exactly on the hour**, which means
an external scheduler hitting the REST API.

1. **hPanel** → Websites → **Manage** (report-ai.org) → **Advanced** → **Access Logs**
   *(Hostinger sometimes files this under "Logs" or "Files → Logs" — look for the label
   "Access logs", not "Error logs".)*
2. Download the log, or view it.
3. Filter for the REST endpoint around the posting time. If you can run a shell:
   ```
   grep -E 'POST (/wp-json|/xmlrpc\.php)' access.log
   ```
   or narrow to the hour:
   ```
   grep 'POST /wp-json' access.log | grep ':04:'
   ```
4. **What to send me:** the matching lines — source **IP**, **timestamp**, **user
   agent**, and the **path**. The user agent usually names the service outright
   (n8n, Make, Zapier, python-requests, axios).

**Do not paste any line containing a token or key** — if a credential appears in a
query string, redact it and tell me it was there.

**Time matters:** Hostinger retains access logs for a limited window. If the logs have
already rolled over, the fallback is to leave a request-logging snippet in place for
24 hours, which I can write once you confirm the logs are gone.

---

## 3. WPCode snippet — noindex any News post

Catches anything the publisher adds before you find it. WPCode Lite is already installed.

1. wp-admin → **Code Snippets** (the WPCode one) → **+ Add Snippet**
2. Choose **Add Your Custom Code (New Snippet)**
3. Code type: **PHP Snippet**
4. Title: `Noindex News category posts`
5. Paste:

```php
add_action( 'wp_head', function () {
    if ( is_singular( 'post' ) && has_category( 'news' ) ) {
        echo '<meta name="robots" content="noindex, nofollow" />' . "\n";
    }
}, 1 );
```

6. Insertion: **Auto Insert** → **Run Everywhere** (or Site Wide Header)
7. **Activate**, then Save.

**One caveat to watch:** AIOSEO also emits a robots meta tag. If you view source on a
News post and see **two** robots tags, tell me — they can conflict, and I will switch
this to an AIOSEO filter instead of a raw `wp_head` echo.

To test: open any News post (once one exists again), view source, and look for
`<meta name="robots" content="noindex, nofollow" />`.

---

## 4. Search Console validation — ⚠️ CORRECTION, do NOT request it yet

**I previously told you to re-request validation. That advice is now wrong, and the
reason is our own doing.**

The five genuinely broken URLs were fixed. But we then **trashed 91 scraped posts**,
and every one of those is now an intentional 404. If you request validation on the
"Not found (404)" bucket today, Google will re-crawl, find ~91 URLs still returning
404, and **fail the validation again** — exactly the cycle we were trying to avoid.

**Correct sequence:**

1. **Wait.** Let the 91 intentional 404s age out of the report naturally.
2. **Optional, to speed it up:** add a single Redirection rule returning **410 Gone**
   for the trashed post paths. A 410 says "intentionally removed" and Google drops
   those URLs faster than a 404. Tell me if you want this and I will write the regex.
3. **Only then** request validation, once the bucket contains only URLs you actually
   intend to resolve.

Nothing is broken here — the bucket rising is the correct outcome of the purge.

---

## 5. n8n connector — delete and re-add

It has failed on **every session since 11 September** with the same error:

```
n8n (404): SdkHttpError ... (CLIENT_HTTP_NOT_IMPLEMENTED)
```

That is a **config-layer failure, not an auth failure** — the endpoint is not speaking
the protocol the client expects. Re-authorising will not fix it; the entry needs
replacing.

1. Go to **https://claude.ai/customize/connectors**
2. Find the **n8n** entry → **remove** it
3. Re-add it, checking the server URL carefully — a 404 here usually means the URL
   points at the n8n app rather than its MCP endpoint
4. **Start a new session.** Connectors are read only at session start.

This matters beyond tidiness: n8n remains the most likely home of the 04:00 publisher,
and it is the one place I have never been able to look.

---

# And the things I can do — just say which

| | What |
|---|---|
| **Quickest win** | Homepage still claims **"The US frontier ships no weights at all."** Muse Glimmer 30B (Apache 2.0, 10 Aug) falsifies it. One line. |
| Contradiction #1 | `best-ai-models-2026` vs `chinese-ai-models-2026` |
| Contradiction #2 | `ai-autonomous-cyberattacks-defense` says "two OpenAI models stole the benchmark answers" — METR found ~1,200 agents and a production breach |
| Report | **Meta/Muse** — Llama discontinued Apr 2026, closed Spark flagship, open Glimmer distillation |
| Report | **Token cost vs revenue** — what a token costs to *serve* against what it sells for. The gross-margin half nobody publishes. |
| Task #5 | **Prediction ledger** — ~8 dated falsifiable entries now queued |
| October pass | ~20 STANDARD quarterly pages untouched; `chinese-ai-models`, `ai-data-center-cost`, `ai-bubble-tracker` still open |
| Systemic | **Cross-page consistency sweep** — three contradictions in three weeks says the register checks pages against sources but never against each other |

**Diarised:** Meta's Q3 10-Q (late Oct) settles the BlackRock closing · December
resolves the Forrester reversal forecast (task #6).

**Still egress-blocked, so genuinely cannot be done from here:** `artificialanalysis.ai`
(the US-frontier Intelligence Index composites) and `sec.gov` (the 8GW vs 10GW
discrepancy on the data-centre cost page).
