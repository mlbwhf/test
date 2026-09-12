# Reply 4 — short covering message for Hostinger

Paste as the message body (not as an attachment). Keeps the ask explicit.

---

Hi — yes please, continue investigating **report-ai.org**. Three things, in priority
order:

**1. Escalate the four checks you couldn't verify from your available data:**
`proxy_read_timeout`, `keepalive_timeout`, hcdn idle limits, and SSE/chunked buffering
on `/wp-json/`. Now that the WAF and PHP limits are both ruled out, these are the most
likely cause and they need someone who can read the edge and LiteSpeed configuration.

**2. Check PHP worker recycling on this account** — LSAPI max children, `lsapi_max_idle`,
idle worker timeout — and whether workers were recycled or killed during 18–24 Aug. A
long-lived MCP stream holds a PHP worker for its lifetime, and under the elevated load
you found, an idle worker is the first thing reclaimed. That would explain the whole
pattern: individual requests log 200, but the session dies silently afterwards.

**3. Two quick ones:** confirm `output_buffering` for PHP on this account (it wasn't in
your earlier data), and let me know an ETA or status link for the elevated load on this
server — plus whether report-ai.org can be moved to a less loaded server if it isn't
short-term.

No action needed on the WAF, and no IP allow-listing required — please disregard that
from my earlier message.

**Please don't change anything on agile-agilist.com for now.** I'll handle the LiteSpeed
Cache change there myself as a separate step.

Thanks for the thorough checks so far — ruling out the firewall and the PHP limits has
been genuinely useful.
