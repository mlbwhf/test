# Reply 3 to Hostinger

Copy below the line.

---

Thanks — that's genuinely useful, and it narrows things further.

The PHP values settle that question: `max_execution_time` 360s, `post_max_size` 1536M,
`max_input_vars` 5000 cannot explain anything about a 30 KB REST request. Combined with
your earlier finding that every MCP POST returned 200/204, we can close out both the
request-size and the firewall lines of investigation.

**The elevated server load you found is the most interesting thing in your reply**, and I
think it may connect directly to the timeout question rather than being separate from it.

A long-lived MCP stream occupies a PHP worker for its whole lifetime. Under memory or
worker pressure, an idle process holding a connection is exactly the kind of thing a
process manager reclaims first. That would produce precisely what we see: individual
requests succeed and log 200, the stream is later culled, and the client discovers it is
gone on the next call. It would also explain why the drops cluster rather than occurring
at a fixed interval.

So could you please check, or escalate to the team that can:

1. **PHP process recycling under load** — LSAPI settings for this account:
   max children, `lsapi_max_idle`, idle worker timeout, and whether workers on this
   server have been recycled or killed during the affected period. This is the item I'd
   look at first given the load finding.
2. The four items you couldn't verify from the configuration data available to you —
   **`proxy_read_timeout`, `keepalive_timeout`, hcdn idle limits, and SSE/chunked
   buffering**. You noted these remain the most relevant unanswered checks, and I agree;
   please escalate them to whoever can read the edge and LiteSpeed configuration.
3. **`output_buffering`** for PHP on this account, since it wasn't exposed in your data.

And two practical questions:

4. Is there an **ETA on the load issue** on the server hosting report-ai.org, or a
   status page I can follow?
5. If the load is not short-term, can **report-ai.org be moved to a less loaded
   server**? If elevated load is contributing, that may be the fastest real fix.

I'll retry over the next few hours as you suggest and report whether the drops track the
load. If they stop when load normalises, that's our answer.

On **agile-agilist.com** — understood that LiteSpeed Cache is disabled there. I'll enable
page caching, but I'd rather do that as its own change and verify the site first, so I
won't apply the Advanced optimization preset at the same time. If anything on that site
looks wrong afterwards I'll come back to you.

On **report-ai.org**, LiteSpeed is already active — I'll check the mobile cache setting
myself as you suggested.

---

## Notes for us (not for support)

**Caution on agile-agilist.com:** Hostinger suggested enabling LiteSpeed Cache and
selecting "Advanced optimization". Do **not** do both in one step. Advanced presets
combine/defer CSS and JS, which regularly breaks themes and inline scripts — and we've
just spent a long time fixing CSS/JS on the other site. Enable **page caching only**,
verify the site renders and forms work, then consider optimisation options one at a time
with a purge and check between each.

**What this reply adds to the theory:** worker recycling under load is a mechanism that
sits *underneath* the idle-timeout theory rather than competing with it. Both produce the
same signature — a stream that dies silently after a 200 — and both are consistent with
Hostinger's logs. Worker recycling additionally explains the clustering of drops, which a
fixed idle timeout alone would not.

**Test to run ourselves:** if the drops genuinely track server load, they should become
rarer once load normalises. Worth noting roughly when each disconnect happens over the
next day or two, so we can say whether it correlates — that's evidence neither vendor can
gather for us.
