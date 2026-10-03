# Two Chasms site — v2 design rollout (WordPress, Hostinger)

Live site: springgreen-sardine-416356.hostingersite.com (MCP connector `mutation`), theme Twenty Twenty-Five.
Target domain per handover: twochasms.com / mutation.agile-agilist.com (not yet pointed).

## What was changed live (2026-10-03)
| WP object | Change |
|---|---|
| Template 7 "Mutation — full width" (`page-mutation`) | Dark "Mutation" masthead → v2 white masthead (curve-leap mark, "Two Chasms", Framework/Assess/Workshops/Cast/Books, Pre-order). Footer → v2 colophon (+ agile-agilist.com link). Old masthead/colophon CSS removed; v2 CSS block appended (`out/template_css.css`). Nav highlight JS now targets `.masthead .nav a`. |
| Page 8 "The Two Chasms Framework" (front page) | Replaced with the v2 homepage (`out/home_content.html`): hero, journey banner, Moore overlay, five states, two chasms, assessment band + share card, three flagship workshops, cast band. Excerpt = new meta description. |

Rollback: both objects have WordPress revisions from before 19:37 UTC.

## How it's built
`python3 build_wp.py` reads `src/index.html` + `src/site.css` (verbatim from the design handoff) and writes `out/`.
v2 rules are scoped under `.tc` because the template still carries the older stylesheet that the `/assess`
draft (page 13) uses, and both share class names (`.btn`, `.band`, `.crossing`, `.workshop`, `.assess`).
`test/wp_sim.html` = v2 + the conflicting legacy rules; renders identically to the handoff reference at 1280px.

Deviation from the design: "Signal sensing" → "Signal Sensing" (handover §1, locked spelling).

## Not done yet (handover queue A)
- `/assess` (page 13, draft): relabel layers to the five states, result copy "You are in X; Y is not holding",
  restyle to v2; publish with slug `assess`. Design says /assess is "not yet designed".
- `/workshops`, `/cast`, `/books` pages don't exist on WP yet → nav links 404 until created.
- Favicon / site icon, site title (blogname is still the Hostinger hostname).
- M1/M2 workshop guides need Mark's scope approval.
