# v5 design — applied live 2026-08-22

Source: `prototype-v5/README.md` (bundle "redesign_5"). Applied as delivered.

## What v5 changed vs the v3 build that was live

| Area | v3 (was live) | v5 (now live) |
|---|---|---|
| Header | wordmark left, menu right (`space-between`) | three-column grid `1fr auto 1fr`, menu **optically centered**, third column reserved |
| Open interaction | click-arrow toggle | **hover opens**, 180ms grace timer, hover bridge; click still toggles on touch |
| Panel anchor | `right:40px` | `left:50%; transform:translateX(-50%)`, flush at `top:100%` |
| Row hover/active | `#f5f5f7` bg | `#eef1fd` bg + cobalt text + `inset 3px 0 0 #2545f5` marker, 120ms ease |
| Reports dropdown | single-pane list | **two-pane**, same as Indexes: 3 collections → that collection's reports |
| Reports tags | Collection/News eyebrows | removed (both CSS and menu-item descriptions blanked) |
| Right-pane rows | plain hover | `#eef1fd` bg + cobalt text |
| Buttons | cobalt → darker cobalt | cobalt → **ink `#111114`** |

## Where each piece lives

- **CSS** — post 258 (Additional CSS), block `NAV v5 LEDGER — design applied as delivered (2026-08-22)`,
  appended after the base site stylesheet. Single block; no stacking.
- **PHP/JS** — WPCode snippet 1497 "Report AI — nav support v2". Four jobs: utility strip,
  drawer footer links, auto level-3 for **both** Indexes (page 39) and Reports (page 40),
  pane chrome + hover grace timer.
- **Settings** — `generate_settings`: `nav_dropdown_type: hover` (design specifies hover-open;
  the grace timer and touch fallback come from the snippet), `nav_alignment_setting: center`,
  `nav_drop_point: 768`.
- **Homepage** — page 6 style block: button hover → ink, library cells → cobalt tint.

## Site-specific deviations (deliberate, per the standing "follow the site" rule)

1. **8 index sections, not 9** — the prototype lists "Regulating AI"; no such hub exists on the
   site. Numbering is a CSS counter, so it renumbers automatically if one is added.
2. **Reports level-3 comes from child pages**, not a CPT/taxonomy — reports on this site are
   pages under `/reports/`. The Dark Side of AI (498) and Real-World AI (446) inject their child
   pages; the "Latest News & Policy" row is a custom link, so it injects the 6 newest report
   pages directly under `/reports/` excluding the two collection hubs.
3. The homepage "figures ticker" from the design is still intentionally omitted — the existing
   **AI by the Numbers** section covers it and must not be duplicated (owner direction).

## Verify

- [ ] Menu optically centered with logo left at 1024–1600px
- [ ] Pointer travels label → panel without closing; closes ~180ms after leaving both
- [ ] Reports shows collections → reports, no Collection/News tags
- [ ] Hover states: rails cobalt tint + inset marker, pane rows cobalt tint, buttons → ink
- [ ] Mobile ≤768px: hamburger, accordions, drawer footer links
- [ ] JS disabled: every level-2 and level-3 link still in view-source
