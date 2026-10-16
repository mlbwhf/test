# Support ticket — mobile menu does not appear (report-ai.org)

Copy everything below the line into the support request. Written for **GeneratePress
theme support**; a short Hostinger/caching section is at the end if you raise it there
instead.

---

## Environment

| | |
|---|---|
| Site | https://report-ai.org |
| Theme | GeneratePress (+ GP Premium — using Navigation settings incl. dropdown behaviour and mobile breakpoint) |
| Host | Hostinger (server-side page cache + WAF at the edge) |
| Page builder | None — content is HTML in WordPress pages |
| Relevant plugins | WPCode (custom PHP/CSS/JS snippet), AIOSEO, Redirection, Jetpack, Optimole |

## Symptom

Below the mobile breakpoint, the primary navigation is unavailable. The desktop
navigation works correctly, including custom two-level dropdown panels.

Please confirm which of these you see, as they have different causes:
- (a) the hamburger / menu toggle button is **not rendered at all**, or
- (b) the toggle renders but **tapping it does not open** the menu.

## Current navigation settings (read directly from the `generate_settings` option)

```
nav_dropdown_type       : hover
nav_drop_point          : 768
nav_position_setting    : nav-float-right
nav_alignment_setting   : left
header_layout_setting   : fluid-header
header_inner_width      : full-width
content_layout_setting  : separate-containers
```

The menu is assigned to the **Primary** location (menu term ID 34).

## Customisations that could be involved

All custom code lives in a single WPCode PHP snippet ("Report AI — nav support v2"),
set to Auto Insert / Run Everywhere. It does four things:

**1. Injects third-level menu items at render time** via `wp_nav_menu_objects`, so that
publishing a child page automatically appears in the menu without editing the menu.
Injected items are `stdClass` nodes with synthetic IDs starting at 900000:

```php
add_filter( 'wp_nav_menu_objects', function ( $items, $args ) {
    // for each level-2 item under the Indexes/Reports parents,
    // append that page's child pages as new level-3 $items
}, 10, 2 );
```

**2. Prints navigation CSS in `wp_head` at priority 999** (deliberately after
Additional CSS). The rules most likely to interact with the mobile menu:

```css
@media (min-width: 769px) {
  .site-header .inside-header { display: grid !important;
    grid-template-columns: 1fr auto 1fr; align-items: center; padding: 20px 40px; }
  .site-header .inside-header .main-navigation { grid-column: 2; justify-self: center;
    float: none !important; width: auto !important; }
}
@media (max-width: 768px) {
  .site-header .inside-header { display: flex !important; }
  .menu-toggle { min-width: 44px; min-height: 44px;
    border: 1px solid #e6e6ea; background: #fff; color: #111114; }
  .main-navigation .main-nav ul li a { min-height: 44px; font-size: 17px;
    font-weight: 700; padding: 12px 16px; border-bottom: 1px solid #e6e6ea; }
}
```

**3. Adds markup via two hooks:** `generate_before_header` (a utility strip above the
header) and `generate_after_primary_menu` (utility links intended for the mobile
drawer footer).

**4. Binds JavaScript to the top-level menu items** for the desktop dropdown panels
(hover open with a close grace timer). On touch devices it currently calls
`preventDefault()` on the first tap of a parent item:

```js
toplink.addEventListener('click', function (e) {
  if (window.matchMedia('(hover: none)').matches && !top.classList.contains('tai-open')) {
    e.preventDefault();
    open(top);
  }
});
```

## What we have already ruled out

- The mobile breakpoint is **768**, and the failure reproduces on a ~390px viewport,
  so the device is well below the breakpoint.
- The Primary menu location is assigned.
- The desktop navigation and its custom dropdowns render and function correctly.
- Additional CSS has been rebuilt cleanly (no duplicated navigation blocks).

## Questions for support

1. **What controls `.menu-toggle` visibility in the current version** — theme CSS,
   the `nav_drop_point` generated media query, or JavaScript? We want to know which
   of our rules could suppress it.
2. **Does overriding `display` on `.site-header .inside-header`** (we set `grid` on
   desktop and `flex` on mobile) interfere with the mobile header or the toggle?
   Should we scope our grid to an inner element instead?
3. **Are menu items injected via `wp_nav_menu_objects` with synthetic IDs supported**
   by the mobile menu / off-canvas logic, or does it expect items that exist in the
   database? This is our main suspicion, because the injection is the least standard
   thing we do.
4. **Is `generate_after_primary_menu` a valid hook for markup inside the mobile
   drawer**, or does adding a `div` there break the toggle's expected DOM structure?
5. If GP Premium's **Menu Plus / mobile header** module is involved, which settings
   should be enabled for a standard hamburger drawer at ≤768px?

## Isolation test we can run on request

Deactivating the WPCode snippet and reloading will show whether the theme's default
mobile menu works. If it does, the cause is in our snippet and we'll narrow it to the
CSS, the injected items, or the JS. If it does not, the cause is theme/settings level.

---

## If raising this with Hostinger instead (caching angle)

Ask them to confirm:
1. Whether the **server-side page cache** serves a desktop-rendered HTML variant to
   mobile user agents (a cached desktop page would lack the mobile menu markup
   entirely, which would look exactly like this symptom).
2. Whether their cache has **separate mobile/desktop variants** enabled, and if not,
   how to enable it or exclude the homepage.
3. Whether the **WAF** is stripping or altering inline `<script>` in `wp_footer`.
4. A full cache purge, then re-test on a real device rather than a resized desktop
   window — desktop resizing does not always re-request the page.
