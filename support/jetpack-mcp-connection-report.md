# Jetpack / WordPress.com MCP connection dropping — support report

**Account:** mlbwhf@gmail.com · WordPress.com user ID 229381146
**Primary site:** https://agile-agilist.com — blog ID **247366622**
**Report compiled:** 2026-08-23 05:56 UTC (01:56 EDT)

---

## 1. What is happening

> **[FILL THIS IN — see note at the end. Please give support:]**
>
> - **When** the drops happen (dates + times, and your timezone). Even
>   approximate is fine — "roughly 14:00–15:00 EDT on 21 and 22 Aug".
> - **The exact error text** you see, copied verbatim, and where it appears
>   (Claude / the MCP client, the Jetpack dashboard, wp-admin).
> - **How often**, and whether it recovers on its own or needs a reconnect.
> - **Which site** you were working on when it dropped — the account has ten,
>   and four of them are expected to refuse site-scoped MCP calls for plan
>   reasons (section 5). If the drops are only on those, the cause is
>   entitlement, not a connection fault.

---

## 2. Environment

| | |
|---|---|
| MCP endpoint | `https://public-api.wordpress.com/wpcom/v2/mcp/v1` |
| Site platform | Self-hosted, Jetpack-connected (`platform: "jetpack"`) |
| Jetpack plugin | **16.1.2**, active |
| WordPress admin email | mlbwhf@yahoo.com |
| Site timezone | America/Toronto (GMT-4) |
| Plugins installed | 72 (26 active, 46 inactive) |
| MCP client | Claude Code (remote session), HTTP transport |

---

## 3. Connection state at the time of this report — working

Four live calls were made against the account and against blog ID 247366622 at
**2026-08-23 05:56 UTC**. All four succeeded:

| Call | Result |
|---|---|
| `wpcom-user-sites` | OK — returned all 10 sites |
| `settings.get` (site 247366622) | OK — returned full site settings |
| `plugin.list` (site 247366622) | OK — returned 72 plugins |
| `activity.get` (site 247366622) | OK — returned 1,026 activity items |

The account-level listing reports agile-agilist.com as:

```
"mcp_access": {
  "status": "available",
  "site_tools_available": true,
  "reason_code": "available",
  "message": "Site-scoped MCP tools should work for this site."
}
```

**So the fault is intermittent, not a standing outage.** Anything support
can see in server-side logs for this blog ID around the timestamps in
section 1 is likely to be more informative than reproducing it live.

---

## 4. `connection.status` is disabled — please advise

The site tool set reports one operation switched off:

```
"disabled_operations": [
  { "name": "connection.status",
    "reason": "This operation is disabled in your MCP settings." }
]
```

`connection.status` is the operation that would report the Jetpack
connection state, so **the one diagnostic that would show a drop as it
happens cannot currently be run.** Two questions:

1. Where is this toggled? Is it the site's Jetpack AI / MCP settings screen,
   or a WordPress.com account-level MCP setting?
2. Does having it disabled affect anything beyond diagnostics — i.e. could a
   disabled `connection.status` itself contribute to the client treating the
   connection as lost?

---

## 5. MCP access across the account (10 sites)

Included because it may explain some or all of what looks like a "dropped
connection". Four sites are expected to refuse site-scoped MCP calls, and one
is genuinely disconnected — none of those are faults.

| Site | Blog ID | MCP access | Reason reported |
|---|---|---|---|
| report-ai.org | 255349241 | available | — |
| **agile-agilist.com** | **247366622** | **available** | — |
| darkgoldenrod-peafowl-837528.hostingersite.com | 255677586 | available | — |
| implementing-safe.com | 255159847 | available | — |
| brew-n-chill.com | 255395488 | unavailable | `jetpack_paid_plan_required` |
| rte-releasetrainengineer.com | 255446089 | unavailable | `jetpack_paid_plan_required` |
| marks751.sg-host.com | 255395486 | unavailable | `jetpack_paid_plan_required` |
| implementingsafe.org | 233382411 | unavailable | `jetpack_paid_plan_required` |
| agileagilist.wordpress.com | 247211522 | unavailable | `wpcom_paid_plan_required` |
| slimeadventure.com | 223060752 | unavailable | **`site_disconnected`** |

Two things worth support's attention here:

- **slimeadventure.com (223060752) reports `site_disconnected`.** Jetpack
  considers this site's connection broken. If this is a site that is supposed
  to be connected, it is a second, separate issue from the intermittent drops.
- The four `jetpack_paid_plan_required` sites need Jetpack AI or Jetpack
  Complete before site-scoped MCP will run on them. **This is expected
  behaviour, not a fault** — but if the "connection dropping" was observed
  while working on one of those sites, this is the actual explanation and no
  connection bug is involved.

---

## 6. Site-side evidence: none found

The site's activity log was checked for the window **2026-08-22 06:25 UTC to
2026-08-23 05:40 UTC** (most recent 40 entries of 1,026 total). It contains
post edits, plugin updates and event-post deletions only — **no Jetpack
connection or disconnection events are recorded in that window.**

Every entry in that window also shows `is_mcp_agent: false` with an empty
`mcp_client_name`, i.e. all recent changes were made through wp-admin and the
REST API by the site owner directly, not through an MCP agent.

If drops occurred outside that window, please widen the search — the log goes
back 1,026 entries.

---

## 7. What we would like from support

1. Server-side connection logs for **blog ID 247366622** covering the
   timestamps in section 1 — specifically any token refresh failures, XML-RPC
   or REST authentication errors, or `jetpack.connection` events.
2. Confirmation of whether `public-api.wordpress.com/wpcom/v2/mcp/v1` applies
   rate limits or idle-session timeouts to this account, and what they are.
   A long-running client session that is dropped after N minutes idle would
   present exactly as an intermittent connection loss.
3. Guidance on the `connection.status` toggle (section 4).
4. Whether **slimeadventure.com (223060752)** shows a specific disconnection
   cause on your side.

---

### Note on what is deliberately blank

Section 1 is empty because there is no record on this side of when the drops
happened or what the error said — no MCP connection errors were logged in this
session, and the site's own activity log shows no connection events. Those
details have been left for you to fill in from what you actually saw, rather
than guessed at, so support is not sent after the wrong fault.
