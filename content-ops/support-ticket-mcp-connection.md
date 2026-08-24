# Support ticket — MCP connection repeatedly lost (report-ai.org)

**Send to: Meow Apps / AI Engine support** (https://meowapps.com/support/ or the
plugin's support forum). The MCP server is provided by the **AI Engine** plugin —
not by Jetpack, which is why Jetpack support could not help.

A parallel version for **Hostinger** is in section B, because the most likely cause
is at the hosting/WAF layer rather than in the plugin.

---

# A. For AI Engine (Meow Apps)

## Environment

| | |
|---|---|
| Site | https://report-ai.org |
| Plugin providing MCP | **AI Engine 3.7.0** |
| MCP server name | `set_up_the_agent` |
| Client | Claude (remote MCP connector over HTTPS) |
| Host | Hostinger |
| Cache | LiteSpeed Cache 7.9 |
| Other relevant plugins | Jetpack 16.0.1, WPCode Lite 2.3.8, Code Snippets 3.9.6, Security Optimizer 1.6.5, Hostinger Tools 3.0.74 |

## Symptom

The MCP connection drops repeatedly during normal use. From the client side the entire
tool set becomes unavailable ("MCP server disconnected"), then returns minutes to hours
later with no action taken on our side. It is not a permanent failure — it is an
intermittent loss and spontaneous recovery, many times over several days.

When connected, every tool works correctly. `mcp_ping` returns normally. Reads and
writes succeed. So this is a **transport/session stability problem, not a
functionality problem**.

## Observed pattern

Across a multi-day working session we recorded roughly **eight or more disconnect /
reconnect cycles**. The pattern we noticed:

- Drops frequently occur **shortly after a large write** — e.g. `wp_update_post` with
  a full page body (10–30 KB), or `wp_update_option` writing a large serialized option.
- Small operations (`mcp_ping`, single-field reads, small search/replace edits) rarely
  precede a drop.
- Recovery happens on its own; we never re-authenticated to restore it.

We already work around a related known issue: the host's WAF returns **403 on large
POST payloads and on payloads containing JSON-like `{"..."}` sequences**. We
deliberately use small search/replace edits instead of full-content updates because of
it, and we split JSON-LD writes into fragments. That workaround is for individual
requests — but it makes us suspect the same layer is involved in the disconnects.

## Questions

1. **How does the MCP server maintain session state**, and what should we expect when
   an individual request is blocked upstream (e.g. a 403 from a WAF before the request
   reaches PHP)? Can a blocked request invalidate or drop the whole MCP session rather
   than just failing that one call?
2. **Is there a token/session lifetime** we should be aware of, and is there a setting
   to lengthen it or to auto-reconnect?
3. **Are there logs on the plugin side** for MCP connections and failures we can enable
   and send you? Where do they write?
4. **Is there a request size limit** in the MCP implementation, or guidance on maximum
   payload for `wp_update_post` / `wp_update_option`?
5. **Is there any known incompatibility** with LiteSpeed Cache or with security plugins
   that filter REST API traffic?
6. Would you recommend **excluding the MCP endpoint from caching** — and if so, what is
   the exact endpoint path to exclude?

## What we have already tried

- Keeping payloads small and splitting JSON-heavy writes into fragments.
- Retrying once after a failure, and backing off rather than hammering (repeated 403s
  have previously escalated to a temporary IP lockout).
- Verifying with `mcp_ping` after any failed call before continuing.

---

# B. For Hostinger

## Ask them to check

1. **WAF / ModSecurity rules** hitting the WordPress REST API — specifically the
   AI Engine MCP endpoint. We see 403s on large POST bodies and on bodies containing
   JSON-like `{"..."}` sequences. Please confirm which rule is matching and whether it
   can be tuned or excluded for our own authenticated requests.
2. **Rate limiting / temporary IP blocks.** We suspect repeated blocked requests
   trigger a short IP-level block, which would present exactly as the MCP connection
   "dropping" and then recovering by itself. Please confirm whether such blocks exist,
   their duration, and whether our IP has been hitting them.
3. **`max_input_vars`, `post_max_size`, and PHP timeout** on this plan, and whether any
   of them would truncate or reject a 30 KB authenticated POST to the REST API.
4. **LiteSpeed Cache and the REST API** — confirm REST endpoints are not being cached
   or otherwise intercepted.

## Related, and possibly the same root cause

We also have a mobile navigation problem where the mobile menu does not appear.
Please confirm:

5. **Does the cache serve a desktop-rendered HTML variant to mobile visitors?**
   In LiteSpeed Cache this is the **"Cache Mobile" / "Separate View for Mobile"**
   setting. If that is disabled while a desktop page is cached, mobile visitors receive
   markup without the mobile menu — which matches our symptom exactly. Please tell us
   whether it is enabled, and enable it (or exclude the site from mobile caching) if not.

---

## Notes for whoever reads this internally

- The theme-level mobile menu questions belong to **GeneratePress**, not Jetpack and
  not Meow Apps — Jetpack correctly declined those. See
  `support-ticket-mobile-menu.md`.
- The MCP question belongs to **Meow Apps (AI Engine)** and/or **Hostinger**.
- Jetpack is only relevant to the newsletter/subscription form on this site.
