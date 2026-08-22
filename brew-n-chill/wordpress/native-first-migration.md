# Going native-first — the plan

You asked to **maximize native WordPress and minimize custom HTML**. Here's the honest current state and the exact steps to get there.

## Status right now

- **What's already native:** every published page is 100% Gutenberg core blocks — `wp:cover`, `wp:group`, `wp:columns`, `wp:heading`, `wp:paragraph`, `wp:buttons`, `wp:image`, `wp:table`, `wp:media-text`. **No custom-HTML blocks, no shortcodes, no page builder.**
- **What still looks "custom":** inline `style="…"` attributes on colours and font sizes, and a hand-coded top nav (a `<p>` of `<a>` tags styled inline).
- **Why:** the active theme is **Hello Biz**, an Elementor starter that ships **without a `theme.json`**. WordPress therefore only exposes core default palette slugs (black, white, cyan-bluish-gray, etc.) — none of which are your teal/navy. When you pick a custom colour in the editor, Gutenberg stores it as an inline style. That's stock WordPress behavior when there is no palette slug to point at.

## What's blocking the native rewrite right now

The WordPress.com MCP is returning **"This action requires a paid Jetpack plan"** on every write op — `pages.update`, `patterns.*`, `media.*` are all disabled today. So even though the native-first content is ready to ship, it can't be pushed to the live site until either:

1. The paid Jetpack plan is reactivated at <https://jetpack.com/pricing/>, **or**
2. You share a **WordPress Application Password** (wp-admin → Users → Profile → Application Passwords) so the REST API can be used directly.

## Three-step plan to get to fully native

### 1. Give WordPress a real palette (removes ~80% of inline styles)

Add the brand palette to a `theme.json` so blocks can reference `has-navy-background-color`, `has-teal-color`, `has-hero-font-size`, etc. instead of hex/rem literals.

- **File in this folder:** `theme.json` — teal + navy palette, font-size scale, spacing sizes.
- **Where to install it (pick one):**
  - **Recommended:** switch the active theme to a **block theme** (e.g. Twenty Twenty-Five, Ollie, Raft) and drop this `theme.json` in via **Appearance → Editor → Styles → Additional CSS**, or in a child theme.
  - **Keep Hello Biz:** create a **Hello Biz child theme** and add `theme.json` there. Hello Biz doesn't consume block presets on its own, but Gutenberg still emits palette slugs the editor and rendered HTML use.
  - **Quick and dirty:** use the **Create Block Theme** plugin from within wp-admin to export/import a `theme.json` for Hello Biz.

### 2. Replace the hand-coded top nav with the core Navigation block

Instead of a `<p>` of links repeated on every page, one **`wp:navigation`** block references a single `wp_navigation` menu managed in *Appearance → Menus*.

- The included `native_pages.py` uses `<!-- wp:navigation {"ref":…} /-->` as the nav.
- Set `NAV_REF_ID` in that file to the numeric ID of the menu, then re-generate the page content.

### 3. Rewrite each page with the native builder

`native_pages.py` in this folder generates block content that uses **palette slugs**, **font-size slugs**, `align="wide"/"full"`, and no hand-coded `style` attributes on colour/typography. When WordPress access is back, one script run + one `pages.update` per page rewrites all 9 pages.

- The Home page is fully written out as the template pattern; extend the same helpers (`hero_cover`, `band`, `cols`, `cta_button`, `image`, `p`, `h`, `ul`) for the other 8 pages — they all reduce to the same handful of blocks.

## What can't be fully "no CSS"

Even at maximum native, a small number of inline styles remain and are considered normal in WordPress:
- **Cover block `minHeight`** for hero sections.
- **Image `border-radius`** (a block-native `style` attribute).
- **Custom hex** anywhere the palette doesn't yet include a colour.

Everything else — colours, backgrounds, font sizes, spacing, alignment, layout — will come from theme presets once step 1 is done.
