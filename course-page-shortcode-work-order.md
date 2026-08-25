# Chrome-Extension Work Order — course hero + registration shortcodes

_The manual alternative to the settings checkbox. Only do this if you have left
**Settings → AA Registration → "Replace the hero and the Fluent Form"**
unticked. Doing both puts two heroes and two registration blocks on the page._

**Do not start until the three Part 3 snippets are active.** A shortcode
pasted into a page before its snippet runs renders as the literal text
`[aa_course_hero course="spc"]` to every visitor. Check one page first: put
`[aa_course_hero course="spc"]` in a scratch draft, preview it, and only carry
on if it renders as a hero rather than as square brackets.

---

## The three pages

| Course | Page ID | URL |
|---|---|---|
| SPC | **1914** | `/training/adv-safe/spc/` |
| ASPC | **1835** | `/training/adv-safe/aspc/` |
| RTE | **1917** | `/training/adv-safe/rte/` |

The `course` attribute is the page slug: `spc`, `aspc`, `rte`.

---

## TASK A — Swap the hero (per page)

1. Open `https://agile-agilist.com/wp-admin/post.php?post=<ID>&action=edit`
2. Editor → top-right **⋮ (Options)** → **Code editor**.
3. Find the hero block. It opens with this line and is the **fourth** top-level
   block, after the JSON-LD, the sticky course bar, and the teams banner:

   ```
   <!-- wp:group {"tagName":"section","className":"aa-sec aa-hero","layout":{"type":"default"}} -->
   ```

   It ends at the matching close, which is the next occurrence of:

   ```
   </section>
   <!-- /wp:group -->
   ```

   Between them is a single `<!-- wp:html -->` block containing the breadcrumb,
   the chips, the `<h1>`, the lede, the price line and the credential lockup.

4. **Select from the opening line through the closing `<!-- /wp:group -->`
   inclusive** and replace the whole thing with:

   ```
   <!-- wp:shortcode -->
   [aa_course_hero course="spc"]
   <!-- /wp:shortcode -->
   ```

   Change `spc` to match the page.

5. **Preview before updating.** The new hero should carry the eyebrow, the H1,
   the lede, the proof list, a Next batch / Investment pair, and the date
   picker.

> **What you lose in this swap:** the breadcrumb link back to Advanced SAFe,
> the "Advanced · RTE / AI-empowered" chips, and the credential badge lockup.
> The new hero does not have them. If you want any of them kept, tell me which
> and I will add them to the hero rather than you patching the page.

---

## TASK B — Swap the Fluent Form (per page)

1. Same Code editor session. Find this block — it is short and appears just
   after the `#enroll` section:

   ```
   <!-- wp:group {"className":"aa-reg"} -->
   <div class="wp-block-group aa-reg" id="aa-reg">
   <!-- wp:shortcode -->
   [fluentform id="8"]
   <!-- /wp:shortcode -->
   </div>
   <!-- /wp:group -->
   ```

2. Replace **all seven lines** with:

   ```
   <!-- wp:shortcode -->
   [aa_course_register course="spc"]
   <!-- /wp:shortcode -->
   ```

   Change `spc` to match the page.

3. Switch back to **Visual editor**, confirm the page still looks whole, then
   **Preview** → **Update**.

This is the block behind "the form submits but does not take them to Stripe".
Replacing it is what fixes that; leaving the Fluent Form anywhere on the page
leaves the broken path reachable.

---

## TASK C — After all three pages

1. Purge the page cache.
2. On each page: pick a batch, enter a work email, choose seats, and confirm
   the pay button says **"Online payment is switched off right now"** until you
   have ticked **Prices confirmed** and saved a Stripe key. That message is the
   safety catch working, not a bug.
3. The old `#enroll` section above stays. Its heading — *"Select your class,
   then your registration opens below ↓"* — still reads correctly, because the
   new registration block is what now sits below it. The empty `<div
   id="aa-pick">` left in it collapses to nothing once the old
   **"AA — Class Calendar"** JS snippet is deactivated.

---

### Rollback

Both tasks are one block each. To undo, replace the shortcode block with the
original markup — take it from the page's own revision history
(**Editor → Options → Revisions**), which holds the pre-edit copy.

The settings checkbox needs no rollback plan, which is the main argument for
using it instead.

---

### Notes for whoever runs the extension

- Pages are **Gutenberg block** pages — use the block editor's **Code editor**,
  not Elementor.
- Do TASK A and TASK B in the **same editing session** per page, one Update.
- Do not touch the `[easy_event_calendar_mini category="..."]` block. That is
  the calendar and it already works.
- Do not touch the `aa-feed-src` group. It is the hidden events feed the
  calendar reads.
