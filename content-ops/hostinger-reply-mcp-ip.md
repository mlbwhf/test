# Reply to Hostinger — re: "send the affected public IPv4 address"

Copy below the line.

---

Thanks — one clarification that matters for where you look, then everything I can give
you to find the IP from your side.

## The traffic does not originate from my computer

The MCP connection to report-ai.org is **not** made from my workstation or my browser.
It is a server-to-server connection: the AI assistant's connector infrastructure calls
the WordPress REST API on report-ai.org directly. So my home/office IP is not the
address hitting your firewall, and allow-listing it would not change anything.

The source IP belongs to the assistant vendor's connector service, it is not published,
and it is very likely a **rotating pool** rather than a single address. I therefore
cannot give you one fixed IPv4 to check — but you can identify it from your own logs
faster than I can, using the request signature below.

## How to find it in your logs

Please search the access and ModSecurity/WAF logs for **report-ai.org** for:

- **Method:** `POST`
- **Path:** the WordPress REST API, specifically the **AI Engine** plugin's namespace —
  under `/wp-json/` (AI Engine 3.7.0 registers its own namespace; please match on
  `/wp-json/` plus `mwai` or `mcp`, whichever appears in your logs)
- **Status:** `403` (and any `406`, `413`, `429`, `503`)
- **Body size:** the failures cluster on larger bodies, roughly **10–30 KB**
- **Authentication:** these are authenticated application-password requests, not anonymous

Whatever IP appears repeatedly with 403s on that endpoint **is** the address you asked
me for. If you can send it back to me, I will also confirm it from our side.

## Timestamps to correlate against

Times below are as reported by the WordPress server itself (`mcp_ping` responses), so
they should match your log timezone. Each is a moment the connection was **confirmed
working**; the drops occurred in the gaps between them, generally within minutes of a
large write:

| Confirmed working | Then dropped |
|---|---|
| 2026-08-18 19:28 | shortly after a batch of page updates |
| 2026-08-21 12:09 | later the same day |
| 2026-08-22 00:10 | ~05:05, right after several large option/post writes |
| 2026-08-24 16:40 | within minutes, after a plugin-list read |

The pattern we have observed consistently: **small requests are fine; the connection
tends to drop shortly after a large POST.** Recovery happens by itself after some
minutes-to-hours, with no action on our side — which is what makes us suspect a
temporary IP-level block rather than a permanent rule.

## What we would like checked

1. Which **ModSecurity/WAF rule** is matching these requests, and whether it can be
   tuned or excluded for authenticated REST traffic on this site. We already know
   empirically that large POST bodies, and bodies containing JSON-like `{"..."}`
   sequences, get 403'd — we design around it daily.
2. Whether repeated 403s trigger a **temporary IP block**, what its duration is, and
   whether that has been firing for this site.
3. **`post_max_size`, `max_input_vars`, PHP timeout** on this plan, and whether a 30 KB
   authenticated POST to the REST API would be rejected or truncated.
4. Confirmation that **REST API endpoints are excluded from LiteSpeed caching**.

## Separate issue on the same site — likely a quick win

The site's mobile navigation does not appear on phones. We run **LiteSpeed Cache 7.9**.
Please confirm whether **"Cache Mobile" / "Separate View for Mobile"** is enabled, and
whether the mobile user-agent list is populated.

If it is disabled while a desktop copy of the page is cached, mobile visitors receive
desktop-rendered HTML — which would contain no mobile menu markup at all. That would
explain the symptom exactly, and would not be a theme fault. If it is off, please enable
it and purge all.

## Note on agile-agilist.com

The MCP issue affects **report-ai.org only** — that is the site with the AI Engine MCP
server connected. You are welcome to run the general WordPress diagnostics on
agile-agilist.com as well, but no MCP connection is expected there.

---

## Note to self (not for support)

If Hostinger insists on being given an IP rather than finding it in their own logs, you
can get it yourself: **hPanel → Website → Advanced → Access Logs** (or the raw log
files), filter for `POST` requests to `/wp-json/`, and read the client IP column. Those
entries are the connector's requests. Nothing else on the site should be POSTing to that
namespace.
