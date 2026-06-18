# /sa/ + course pages — P2 & P3 optimization runbook (step-by-step)
_Do on **ASPC (1835) first** to validate, then /sa/ (24467) and siblings. Save a revision before starting (tiny edit → Update). These are wp-admin edits — safe (the MCP round-trip is what broke /sa/ before, not Gutenberg saves)._

---
# P2 — Remove the embedded media blobs from the trust badges (~12–19 KB + security)
**Problem:** the row of ~7 small "trust badges" (e.g. *SPCT-led · Exam included · Pass guarantee*) is a **UAGB icon-list**, and each item stores a **full WordPress media object** (~1.5 KB: filename, URLs, image sizes, author, dateFormatted, **session nonces**) just to show one tiny icon. ~3,350 B × 7 ≈ 23 KB of invisible junk — plus the nonces shouldn't be saved in content at all.

**Fix = replace that one block with a lightweight Custom HTML badge strip.** Cleanest and safest.

### Steps
1. Edit the page → on the canvas, click the **trust-badge row** to select it. In the block toolbar it'll show as **"Icon List"** (UAGB / Spectra) or "Info Box."
2. Top-right **⋮ → Code editor**.
3. **Ctrl/Cmd-F** in the code editor and search for `wp:uagb/icon-list` (or `wp:uagb/info-box`). You'll see a **very long** block — it contains `"sizes":`, `"author":`, `"nonces":` etc. That's the bloat.
4. Select the **entire** block — from `<!-- wp:uagb/icon-list … -->` down to its matching `<!-- /wp:uagb/icon-list -->` — and **delete it**.
5. Paste this in its place (edit the labels/icons to match what the page shows):
```html
<!-- wp:html -->
<div class="aa-badges">
  <span class="aa-badge"><svg viewBox="0 0 24 24" class="aa-ic"><path d="M20 6 9 17l-5-5"/></svg> SPCT-led</span>
  <span class="aa-badge"><svg viewBox="0 0 24 24" class="aa-ic"><path d="M20 6 9 17l-5-5"/></svg> Exam included</span>
  <span class="aa-badge"><svg viewBox="0 0 24 24" class="aa-ic"><path d="M20 6 9 17l-5-5"/></svg> Pass guarantee</span>
  <span class="aa-badge"><svg viewBox="0 0 24 24" class="aa-ic"><path d="M20 6 9 17l-5-5"/></svg> Live virtual</span>
  <span class="aa-badge"><svg viewBox="0 0 24 24" class="aa-ic"><path d="M20 6 9 17l-5-5"/></svg> SAFe® Gold Partner</span>
</div>
<!-- /wp:html -->
```
   *(One small `<svg>` is defined once and reused via the class — no media objects, no nonces. Style it in P3's CSS.)*
6. **⋮ → Visual editor** → check the badges look right.
7. **Update.** Done — that block drops from ~23 KB to <1 KB.

> If the badges use **uploaded image icons**, the above removes them entirely. If you'd rather keep the UAGB block, the lighter alternative is: select each icon → in the block's icon picker choose a **library icon (FontAwesome)** instead of an uploaded image — library icons don't carry the media object. But replacing the block (above) is the bigger, cleaner win.

---
# P3 — Move repeated inline styles into one stylesheet (~6–8 KB/page, compounds site-wide)
**Problem:** the same `style="border:1px solid…;border-radius:10px;padding:24px…"` is repeated 12–14×, plus `font-size:14px` ×12, a 34px heading style ×7, etc. Every repetition is bytes in the page **and** on every sibling course page.

**Fix = define the styles once in the theme, reference them by class.**

### Step A — add the classes once (global)
1. **Appearance → Customize → Additional CSS** (loads on every page — perfect, since these repeat across all course pages).
2. Paste (tune values to match the current look — copy the exact numbers from one of the existing inline styles):
```css
/* P2 badges */
.aa-badges{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}
.aa-badge{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#053947;background:#eff6ff;border:1px solid #dbeafe;border-radius:20px;padding:6px 12px}
.aa-ic{width:14px;height:14px;fill:none;stroke:#16a34a;stroke-width:3}

/* P3 repeated patterns — name them after the real reused styles */
.aa-card{border:1px solid #e2e8f0;border-radius:10px;padding:24px;background:#fff}
.aa-h-xl{font-size:34px;font-weight:700;line-height:1.2}
.aa-sm{font-size:14px;color:#475569}
```
3. **Publish.**

### Step B — swap inline styles → classes on the page
For each repeated pattern:
- **Native blocks (Group/Column/Heading):** select the block → right panel **Advanced → "Additional CSS class(es)"** → type the class (e.g. `aa-card`) → then delete the matching inline style. *(Use this field — don't hand-edit native block markup.)*
- **Custom HTML blocks:** in **⋮ → Code editor**, replace `style="border:1px solid #e2e8f0;border-radius:10px;padding:24px…"` with `class="aa-card"` (delete the inline style text).
- Repeat for `aa-h-xl`, `aa-sm`, etc.

### Step C — verify + propagate
1. **Visual editor** → confirm the page looks identical.
2. **Update.**
3. Because the CSS is global, the **same classes now work on every other course page** — so on ASPC/SPC/APM/LPM/RTE/sa you only do **Step B** (the classes already exist). That's where the cumulative win comes from.

---
## Order & safety
1. **ASPC (1835)** → P2, then P3 Step A+B → verify visually → Update.
2. Confirm the page still renders identically and re-check its size (should drop ~25–35 KB).
3. Then **/sa/ (24467)** → P3 Step B only (classes already global) + P2 → save a **revision first**, go slow, verify.
4. Ripple to SPC/APM/LPM/RTE.

## How to confirm the saving
Before/after: in **⋮ → Code editor**, the block count and length visibly shrink. Functionally, the page must look pixel-identical in the Visual editor + front-end. Target: **~117 KB → ~70 KB**, and /sa/ under ~80 KB makes it MCP-editable again.

## What this does NOT touch
- No content/copy changes, no URL/slug changes, no design change (pixel-identical).
- Doesn't affect the registration snippet, the form, or ads.
