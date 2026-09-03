# Mobile menu — candidate fix (try before/alongside the support ticket)

Two changes to the WPCode snippet "Report AI — nav support v2". Both target the most
likely causes. Neither touches desktop.

**Caveat, stated honestly:** I could not view the rendered page from my environment
(the WordPress connection and outbound browsing were both unavailable), so these are
reasoned from the code and settings rather than confirmed against the live DOM. Try the
isolation test first — it costs 30 seconds and tells you whether the cause is even in
our code.

---

## Step 0 — isolation test (do this first)

WPCode → set **"Report AI — nav support v2"** to Inactive → purge cache → reload on a
real phone.

- **Hamburger appears** → the cause is in our snippet. Apply Fix A and Fix B below.
- **Still no hamburger** → our code is not involved. Send the support ticket; skip the
  fixes. Re-activate the snippet either way.

---

## Fix A — stop overriding the header container's display on mobile

**Why:** we force `display:grid !important` on `.site-header .inside-header` for the
centred desktop menu, and `display:flex !important` on mobile. GeneratePress lays the
mobile header out itself; overriding the container's display can collapse or hide the
toggle. The desktop grid is what we actually need — the mobile override was defensive
and is doing no useful work.

In the snippet's CSS, find this line inside the `@media(max-width:768px)` block:

```css
.site-header .inside-header{ display:flex!important; }
```

**Replace it with:**

```css
/* let GeneratePress lay out the mobile header itself */
.site-header .inside-header{ display:block; }
.main-navigation .menu-toggle{ display:block!important; visibility:visible!important; }
.main-navigation.toggled .main-nav > ul{ display:block!important; }
```

## Fix B — stop the JS from intercepting the first tap on mobile

**Why:** on touch devices our script calls `preventDefault()` on the first tap of
"Indexes" / "Reports" to open the desktop-style panel. Inside a mobile drawer that
fights GeneratePress's own accordion handling, and can make the menu feel dead even
when it is present.

In the snippet's JavaScript, find:

```js
toplink.addEventListener('click',function(e){
    if(window.matchMedia('(hover: none)').matches && !top.classList.contains(OPEN)){
        e.preventDefault(); open(top);
    }
});
```

**Replace it with:**

```js
toplink.addEventListener('click',function(e){
    // desktop touch (e.g. touchscreen laptop) only — never inside the mobile drawer
    if(window.innerWidth > 768 && window.matchMedia('(hover: none)').matches
       && !top.classList.contains(OPEN)){
        e.preventDefault(); open(top);
    }
});
```

Also guard the hover handlers so they never run in the drawer — find:

```js
top.addEventListener('mouseenter',function(){ open(top); });
```

**Replace with:**

```js
top.addEventListener('mouseenter',function(){ if(window.innerWidth > 768) open(top); });
```

---

## After applying

1. Save the snippet (keep it Active / Auto Insert / Run Everywhere).
2. Purge the Hostinger cache — **hPanel → Website → Cache Manager**.
3. Test on a **real phone**, not a resized desktop window. Resizing does not always
   re-request the page, and a cached desktop HTML variant is itself one of the
   suspected causes.

## If it still fails

Send `support-ticket-mobile-menu.md`. The question most likely to get a decisive answer
is #3: whether menu items injected via `wp_nav_menu_objects` with synthetic IDs are
supported by the mobile menu logic. That injection is the least standard thing we do,
and it is the piece I would suspect if the CSS and JS fixes above change nothing.

## Fallback if the injection turns out to be the cause

The auto level-3 feature (publish a page → it appears in the menu) can be limited to
desktop by skipping injection when the request is from a mobile device, or dropped in
favour of hand-maintained menu items. That trades the zero-maintenance benefit for a
working mobile menu — worth taking if support confirms the conflict.
