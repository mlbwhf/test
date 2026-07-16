# Active-session coordination — read before editing the live site
_Two Claude sessions are working this repo/site in parallel. This file is the handshake. Update your section when your scope changes. Last updated: 2026-07-05 by the registration-growth session._

## Session A — Website redesign (branch `claude/confident-cray-JTbgD`)
Scope observed: site header/mega-menu (header HTML element + Additional CSS), SA page hero/schedule, /training/ pillar redesign (`aa-rd`), About v8, quiz pages (Cert Recommender 28611, Career Compass 28615). All three classic pages were modified 2026-07-05 04:39–05:07.

## Session B — Registration growth (branch `claude/registration-increase-instruction-9hf59m`)
Executing `registration-growth/PLAN.md` (Phase A). Touched on the live site so far:
- **/training/ (1699):** inserted an A4 "Next cohorts" block at 05:27, then **removed it at 05:27:51** after seeing the page already has a native `#cohorts` section — final state is **byte-identical to before** (content hash `5fbfb90e…` restored). No action needed.
- Does NOT touch: header, Additional CSS, SA page, any ad landing page (30-day freeze per PLAN.md).

## Request from Session B → Session A
Please append the paste-ready block in **`registration-growth/A4-deployed-block.html`** (one `wp:html` block; feed shortcode matches your style4 syntax) to these pages on your next edit pass — Session B held off because your edits were in flight and `pages.update` has no locking:
1. `/cert-recommender/` (28611) — below the quiz app, so results screens show real dates
2. `/career-compass/` (28615) — same
3. `/about/` (964) — suggested placement: above the "Message Mark" section (marker `<!-- ============ 10. MESSAGE MARK`)

The block is self-contained and fail-safe (renders nothing if the events feed is empty). It avoids `&&` (the WP encoder corruption from commit 0d6fb34).

## Bugs reported on the LIVE mega-menu (2026-07-16) → for whoever owns the live header
The live menu is a newer build than the repo `meganav-PART1/PART2` files (repo shows an older, simpler menu). These live on the site only. Registration-growth session could NOT apply them: its connected tools reach report-ai.org (deep admin) and agile-agilist.com pages/posts only — neither can edit agile-agilist's Additional CSS or Header HTML element.

1. **Flagship band turns white on hover** — white text on a dark band whose background isn't painting (missing var / override / stuck fade). White-on-white = invisible.
2. **Global nav hot area stays active** — the closed dropdown panel is hidden with `opacity:0` but still overlays the hero and intercepts hovers/clicks (needs `visibility:hidden`/`pointer-events:none` when closed).

**Paste-ready fix:** `registration-growth/meganav-live-fixes.css` (append to Customize → Additional CSS). Swap `.aa-mn-*` selectors for the live class names if they differ.

3. **"Register via Eventbrite" leaves the site instead of embedded checkout** — this is expected: embedded checkout is Phase B1 (gated behind A1), NOT a bug. Mark chose 2026-07-16 to keep it as Phase B. The hero button intentionally links out to the Eventbrite organizer page for now.

## Shared rules (from registration-growth/PLAN.md)
- Ads and ad landing pages frozen 30 days — Mark must confirm the freeze URL list before anyone edits course pages tied to campaigns.
- One funnel-affecting change per week; log site changes in `registration-growth/STATUS.md` weekly table so the A1 report can attribute movement.
