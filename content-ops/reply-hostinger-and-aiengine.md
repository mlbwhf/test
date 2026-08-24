# Two replies to send

---

# 1 — Reply to Hostinger

Thank you — that's conclusive and it rules out my working theory. If every MCP POST
returned 200/204 and there were no 4xx on that endpoint, then nothing was being blocked,
and the firewall/IP-block hypothesis I gave you was wrong. I appreciate you checking it
properly rather than just applying an allow-list.

That result actually points somewhere more specific, and it needs a different question.

If individual requests all succeed but the session still dies, the failure is in the
**long-lived connection**, not in any single call. A remote MCP connector holds a
persistent stream open (SSE or streamable HTTP). In an access log that stream appears
**once, as a 200, when it opens** — so if it is later killed by an idle timeout at a
proxy or load balancer, the log shows exactly what you found: a clean 200 and nothing
else. Re-reading our own pattern supports this: each drop followed a **pause in
activity**, not a large request.

So, a narrower set of questions, none of them about the WAF:

1. What is the **idle / read timeout** for a persistent HTTP connection to `/wp-json/`
   on this plan — `proxy_read_timeout`, `keepalive_timeout`, or the LiteSpeed
   equivalent? An idle timeout of 60–120 seconds would fully explain this behaviour.
2. Is there anything at the **edge (hcdn)** that terminates idle or long-running
   streams, and can `/wp-json/` be exempted from it?
3. Does LiteSpeed or the edge **buffer or prematurely close Server-Sent Events** /
   chunked responses on this plan?
4. What are **`output_buffering`** and **`max_execution_time`** for REST API requests?

No action needed on the WAF, and no need to allow-list any IP — please disregard that
part of my previous message.

On the mobile menu: understood that plugin settings aren't visible from hosting logs.
I'll check LiteSpeed Cache → Cache → Mobile myself and purge. Thanks for pointing at it.

---

# 2 — Ticket for Meow Apps (AI Engine)

## 2a. SHORT VERSION — for the 280-character support form (264 chars)

```
AI Engine 3.7.0 MCP: remote client session drops after idle gaps, then recovers alone. Host logs show all MCP POSTs 200/204, no 4xx — requests aren't failing, the stream is. Does the MCP server send keepalive frames while idle? Is the session timeout configurable?
```

If the form has a URL field, link to the full version below. If 280 chars proves too
limiting, post the full version on the **wordpress.org AI Engine support forum**
(no length limit, developer is active there) and reference it from the form.

Before sending: check for an AI Engine release newer than 3.7.0 and update if the
changelog touches MCP; note your Pro licence if you have one.

## 2b. FULL VERSION — for the forum or a follow-up email

**Subject:** AI Engine 3.7.0 — MCP session drops during idle periods (server returns 200/204)

## Environment

| | |
|---|---|
| Site | https://report-ai.org |
| Plugin | **AI Engine 3.7.0** (provides the MCP server) |
| Client | Claude remote MCP connector, over HTTPS |
| Host | Hostinger + LiteSpeed Cache 7.9 |

## Symptom

The MCP connection drops repeatedly during a working session. From the client the whole
tool set becomes unavailable ("MCP server disconnected"), then returns minutes-to-hours
later with no action taken and no re-authentication. Roughly **eight or more cycles**
over six days.

While connected, everything works correctly — `mcp_ping`, reads, and writes all succeed.
This is a **session stability problem, not a functionality problem**.

## Key evidence — the requests are not failing

Our host examined access logs for 18–24 Aug 2026 and found:

- Every **MCP POST returned 200/204**
- **No 4xx or 5xx** on the MCP endpoint at all
- The only 403s were unrelated GETs from other IPs

So the requests reach the server and succeed. Something is closing the **session**, not
rejecting calls.

## Pattern

Each disconnect followed a **period of inactivity** (a gap of minutes with no MCP calls),
not a large or unusual request. Rapid sequences of small calls stayed connected;
resuming after a pause was when the connection was found dead.

## Questions

1. Does the MCP server use **SSE or streamable HTTP**, and does it emit periodic
   **keepalive / heartbeat frames** during idle periods to hold the connection open?
   If not, is there a setting to enable them, or a recommended proxy configuration?
2. Is there a **session or token lifetime** that expires on inactivity? Can it be
   extended or refreshed automatically?
3. Does the plugin **log MCP session starts, ends, and disconnect reasons**? If so, how
   do we enable that? The server's view of these disconnects is the missing piece.
4. Are there known interactions with **LiteSpeed Cache** or PHP **output buffering**
   that would truncate or close a long-lived response early? Should we exclude the MCP
   endpoint from caching, and if so what is the exact path?
5. Is there a recommended **idle timeout** value for hosts to configure on `/wp-json/`
   for MCP to remain stable?

## What we have ruled out

- WAF / firewall blocking (host confirmed 200/204, no 4xx on the endpoint)
- Temporary IP blocks (no evidence in host logs)
- `post_max_size` limits (a sibling site handles authenticated 24–30 KB POSTs with 200s)
- Authentication failure (no re-auth is needed on recovery — it resumes by itself)
