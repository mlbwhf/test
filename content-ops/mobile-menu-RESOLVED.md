# Mobile menu — RESOLVED 2026-08-24

## Cause

**The hamburger was rendering the whole time — white on a white header.** Fully
clickable, correct size and position. Every "no mobile menu" report was a contrast
failure, not a layout, delivery, or JS failure.

Browser evidence at 386px:

| Element | display | visibility | opacity | size |
|---|---|---|---|---|
| `#mobile-menu-control-wrapper` | flex | visible | 1 | 110×60 |
| `.menu-toggle` (in wrapper) | block | visible | 1 | 55×60 |
| `.menu-toggle` (in `#site-navigation`) | none | — | — | — (normal GP behaviour) |

`elementFromPoint` at the button's centre returned the SVG path inside it — nothing
covering it. Computed `color: rgb(255,255,255)`, `background-color: rgba(0,0,0,0)`,
on a `rgb(255,255,255)` header.

## Why our rule lost

Specificity, not source order:

```
ours   @media(max-width:768px) .menu-toggle { color:#111114 }        (0,1,0)
GP     .main-navigation .menu-toggle { color: var(--base-3) }        (0,2,0)  ← wins, = #fff
GP     button.menu-toggle { background-color: transparent }          (0,1,1)  ← beats (0,1,0)
```

The wrapper is `<nav class="main-navigation mobile-menu-control-wrapper">` — it carries
`.main-navigation`, so GP's higher-specificity rule matched our button.

## Fix applied

Raise our selector to `.main-navigation .menu-toggle` — (0,2,0), tying GP on specificity
and winning on source order because `tai-nav-v5` prints after `generate-style-inline-css`.
No `!important` needed.

## Also done

Deleted the duplicate nav block from Additional CSS (post 258). The same `.menu-toggle`
colour rule existed in both places, both losing, and two copies meant guaranteed drift.
The WPCode snippet is now the single source of truth; post 258 carries a comment saying so.

## What this cost, and the lesson

Several rounds of blind patching, a misrouted Jetpack ticket, a wrong WAF hypothesis sent
to Hostinger, and a wrong "LiteSpeed serving desktop HTML to phones" hypothesis — all
because the symptom ("no mobile menu") was taken at face value and never verified against
computed styles. **One DevTools read at a narrow viewport would have found this on day
one.** When a UI element is reported missing, check whether it is rendered-but-invisible
before theorising about delivery, caching, or markup.

## Ruled out along the way (all confirmed, all wrong)

- LiteSpeed serving a cached desktop variant — LiteSpeed is deactivated entirely
- Hostinger CDN caching HTML — reports `x-hcdn-cache-status: DYNAMIC`, no `Age`
- Missing mobile markup — HTML contains viewport meta, wrapper, and both toggles
- GP menu JS failing — `menu.min.js` 200, no console errors, 0 4xx/5xx across 129 resources
- The `display:grid` header rule leaking to mobile — computed `display:flex` at 390px
