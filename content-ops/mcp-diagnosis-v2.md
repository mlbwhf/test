# MCP disconnects — corrected diagnosis (v2, 2026-08-24)

## What the evidence now says

Hostinger checked access logs for 18–24 Aug 2026:

- Every **MCP POST returned 200/204**.
- **No 4xx/5xx** on the MCP endpoint at all.
- The 403s in the logs were unrelated GETs from other IPs.
- agile-agilist.com handles authenticated **24–30 KB** POSTs with 200s, so a general
  `post_max_size` rejection is unlikely.

**My earlier hypothesis — WAF blocking large payloads, escalating to a temporary IP
block — is not supported.** Requests were not blocked; they succeeded. The evidence
points away from Hostinger's firewall entirely.

## Better hypothesis: the transport idles out, not the requests

If every request succeeds but the session still dies, the failure is in the **long-lived
connection**, not in individual calls.

Remote MCP connectors keep a persistent stream open (SSE or streamable HTTP). In an
access log, that stream is recorded **once, as a 200, when it opens**. If the stream is
later killed by an idle timeout at a proxy, load balancer, or PHP layer, the log still
shows only that original 200 — exactly the picture Hostinger describes. Meanwhile the
client sees "MCP server disconnected".

This also re-reads the pattern I reported earlier. I said drops followed *large writes*.
Re-examined, what actually preceded each drop was a **pause** — the gap while I composed
a long document locally, or while a reply was being written. Those are the same moments,
and idle time explains them better than payload size does:

| What I claimed | What fits the logs |
|---|---|
| Big POST → WAF 403 → IP block | Stream sits idle during a pause → idle timeout closes it |
| Recovery = block expiring | Recovery = client opening a fresh stream on next use |
| Access log should show 403s | Access log shows only the opening 200 — as observed |

## What to ask now

### Hostinger — narrow, specific

Not the WAF. Ask about **timeouts on long-lived connections**:

1. What is the **idle/read timeout** for a persistent HTTP connection to
   `/wp-json/` — i.e. `proxy_read_timeout`, `keepalive_timeout`, or the LiteSpeed
   equivalent? A 60–120 s idle timeout would fully explain this.
2. Is there anything at the edge (hcdn) that **terminates idle streams**, and can
   `/wp-json/` be exempted?
3. Does LiteSpeed or the edge **buffer or close** Server-Sent Events / chunked
   responses on this plan?
4. Is `output_buffering` forced on, and what is `max_execution_time` for REST requests?

### Meow Apps (AI Engine 3.7.0) — the more likely owner

1. Does the MCP server use **SSE or streamable HTTP**, and does it send periodic
   **keepalive/heartbeat frames** to hold the connection open during idle periods?
   If not, is there a setting to enable them?
2. Is there a **session or token lifetime** that expires during inactivity, and can it
   be extended?
3. Does the plugin **log MCP session starts/ends**, and can we enable that to see the
   server's view of each disconnect?
4. Any known interaction with **LiteSpeed Cache** or PHP output buffering that would
   close a long-lived response early?

## What this changes on our side

Nothing needs fixing on the site. Practically:

- Keep splitting large writes — it costs nothing and remains good practice — but **stop
  attributing disconnects to payload size**. That was my error.
- Expect drops after idle gaps. The reliable workaround is to **`mcp_ping` first** after
  any pause before assuming the connection is live, and reconnect rather than diagnose.
- The `CLAUDE.md` note about WAF 403s on large/JSON-like payloads stays as a caution for
  *individual requests* (it was observed behaviour earlier), but it is **not** the cause
  of the session drops, and should not be cited as such again.

## Mobile menu — still open, and now clearly ours to check

Hostinger cannot read plugin settings from logs, which is fair. This one is a two-minute
check in wp-admin:

**LiteSpeed Cache → Cache → [Cache] tab → "Cache Mobile" → ON**, confirm the mobile
user-agent list is populated, then **Purge All**. Test on a real phone, not a resized
desktop window.

If mobile caching is off while a desktop copy of the page is cached, phones receive
desktop-rendered HTML with no mobile menu markup in it — which would explain why none of
the CSS or JS changes made any difference on mobile.
