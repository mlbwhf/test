# implementing-safe.com — Uniform Content Width Fix

## Problem
Pages hard-code different content-column widths in their block markup:
- Roadmap (40) + Phases (112–120): constrained, no explicit width (theme default) ← reference
- Cert/consulting (41 SPC, 42 ASPC, 86 AI-Native, 88, 90, 39 consulting): `contentSize:860px` (narrow)
- Framework sub-pages (160–164): `contentSize:1100px`
- Framework hub (33): plain groups (no constrained layout)

Result: inconsistent widths across the site. (Astra theme; all pages already use full-width content layout + no sidebar, so the container is fine — only the inner content width differs.)

## Fix — paste into Appearance → Customize → Additional CSS → Publish
```css
/* Uniform content width across all pages — matches the 1240px hero */
.entry-content .is-layout-constrained > :where(:not(.alignfull):not(.alignleft):not(.alignright)) {
    max-width: 1240px !important;
    margin-inline: auto !important;
}
/* Bring the Framework hub (plain-group page, id 33) into line too */
.entry-content > .wp-block-group:not(.is-layout-constrained) > :where(:not(.alignfull):not(.alignleft):not(.alignright)) {
    max-width: 1240px;
    margin-inline: auto;
}
```

- Overrides the per-page 860px/1100px constraints → all pages render at 1240px content width.
- Full-bleed colored section backgrounds stay full-width (only inner content is centered) — same as roadmap.
- Heroes already use `.isafe-2col{max-width:1240px}`, so content + hero line up.
- Adjust `1240px` to taste.

## Alternative (per-page, no CSS)
Edit each affected page and remove the explicit `"contentSize":"860px"` / `"1100px"` from the group `layout` attributes so they inherit the default like roadmap. Larger effort; the CSS rule above achieves the same result globally in one step.
