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
- Favicon / site icon (site title + tagline were set: "The Two Chasms Framework" / "Sense the shift before your dashboard does").
- M1/M2 workshop guides need Mark's scope approval.

## Fix 2026-10-04 — masthead not showing
Template 7's "WordPress port" CSS hid `.wp-site-blocks > header` / `> footer` to suppress the theme's
own header. Our masthead and colophon are raw `wp:html` output, so they are direct children of
`.wp-site-blocks` too and were hidden by the same rule. Rule now excludes `.masthead` / `.colophon`
and forces them visible. `test/wp_sim.html` now wraps the page in `.wp-site-blocks` to catch this.

## 2026-10-04 — inner pages live
| Page | ID | Source |
|---|---|---|
| /assess "Where's your team?" (was draft 13) | 13 | `build_assess.py` → `out/assess.html` |
| /workshops | 27 | `build_pages.py` → `out/workshops.html` |
| /cast | 28 | `build_pages.py` → `out/cast.html` |
| /books | 29 | `build_pages.py` → `out/books.html` |
All use template `page-mutation`. Page CSS (`out/pages_css.css` + `out/assess_css.css`) was appended to template 7.
Guides + Exhibit 2.1 uploaded to media (`/wp-content/uploads/2026/10/*.docx`, sourced from `assets/`).

**Assessment:** instrument (15 statements) and scoring carried over unchanged from "Which wave are you in?";
flow follows the agile-agilist.com QBank engine (WPCode snippet 30856): perspective step, probe line,
1–5 Never→Always + N/A, email gate, HubSpot form 46316757 / c6f0d4c1-… (email + firstname; the reading is sent in
`context.pageName`). Result: "You're in X; Y is not holding" / stuck-in-chasm variants → Y's flagship workshop;
dynamic 1080 share card. Mutation/Immune readers are pointed at the live MRX on agile-agilist.com.

**Open:** pre-order URL (Books + Pre-order button use a mailto "notify me" for now) · M1/M2 guides (shown "In development")
· cast quotes outside HANDOVER §6 carried over from the earlier cast page (Oliver, Daniel, Terry) — confirm verbatim.
