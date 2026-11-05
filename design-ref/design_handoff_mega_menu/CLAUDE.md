# CLAUDE.md — training menu and selection flow

## Goal
Build exactly what `html/mega-menu.html` and `reference/Course Selection Flow.dc.html` show, in WordPress + Astra. Do not redesign. Read `README.md`, then `FLOW.md`.

## Read first
`WORDPRESS-REBUILD.md` has the file map, install steps, data wiring and verification checklist. `html/select-flow.html` and `html/mega-menu.html` are the visual and behavioural source of truth; the PHP renders the same markup.

## Order of work
1. Install plugin `wordpress/aa-mm/`. Keep `data/training-menu.json` identical in both places. Categories are data: edit JSON only, never hard-code a category.
2. Replace placeholders (URLs, dates, prices, prerequisites) with real data through the `aa_mm_data` filter. Dates come from the cohort calendar; show only future cohorts.
3. Build the flow (FLOW.md): classes → dates → register or compare.
4. Build `/training/compare/` as a server-rendered table (`html/compare-table.html` is the target markup).
5. Verify at 360, 390 and 1280px, with JS off, and with reduced motion on.

## Hard rules
- Same-tab navigation only. No `target="_blank"`, no pop-ups.
- Email is not collected by the flow and never appears in a URL or storage (the course-page checkout collects it). Only class ids and cohort ids travel in URLs (`?classes=devops,sp&cohorts=d1,s1`).
- Show only prices the server will charge. The flow shows per-seat prices and says the total is confirmed at payment. Never compute a total client-side.
- Every refusal (bad email, full date, overlapping dates) renders in a `role="alert"` region right above the action button, visible at the moment of the click.
- The seat stepper exists only on the register step. The seat count carried to checkout must match what the buyer sees.
- Use existing tokens: ink #0B2E35, teal #0E8074, mint #8FCFCF, mist #B9DCDC, warm #F2B66D (NEW tag only). No new colours.
- Namespace `.aa-mm` (menu) and `.aa-fl` (flow). Animate transform and opacity only. Honour `prefers-reduced-motion`.
- Keep `.aa-mm` at `overflow:clip` so sticky trays work.
- Escape all output. Wrap strings in `__()`. Arrow glyph flips under `[dir=rtl]`; prices and dates in `<bdi>`.

## LLM / SEO rules
- Never render categories, classes, dates or compare rows client-side only. They must be in the PHP HTML.
- Do not put `hidden` or `display:none` on panels in markup. JS adds `is-off` after load.
- Keep h2/h3 hierarchy, `<time datetime>`, plain-list `<details>`, JSON-LD, `/training-menu.txt`, `/training/compare/`.
- Validate JSON-LD in the Rich Results Test. Add the .txt and compare URLs to `/llms.txt` and the sitemap.
- Past dates must never render.

## Mobile rules
- Test on real iOS Safari and Android Chrome: sticky bar, safe-area, swipe (vertical scroll must still work), no zoom on input focus (16px).
- Tap targets 44px minimum, 48px for primary buttons. Primary action reachable without scrolling past the fold.

## Done when
- Core shows the NEW tag; SAFe Roles shows 5 classes (ASM, BO, ASE, Architects, LSSP); Advanced SAFe shows 5.
- Search finds classes across categories. The shortlist survives category switches and reloads in the session.
- Flow works end to end on mobile and desktop, with refusals visible, and the compare page is readable with JS off.
