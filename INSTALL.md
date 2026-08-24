# Home page — install

Supersedes every earlier instruction. The CSS goes into **Additional CSS**,
your existing canonical stylesheet — not a separate snippet. One JS snippet
and one PHP snippet in WPCode, matching the "AA – Nav JS" pattern already
in place. Everything is installed **once** and serves `/`, `/es/` and `/fr/`.

---

## 1. Additional CSS — two pastes into the v21 sheet

Appearance → Customize → Additional CSS:

1. **Top of the sheet**, directly under the existing Newsreader `@import`,
   add this line (an `@import` is invalid anywhere else in the sheet):

   ```css
   @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
   ```

2. **Very end of the sheet**, paste the whole of
   `snippets/additional-css-home-section.css` (section **Y. HOME PAGE**).

Publish, purge cache, hard-refresh. Same perf caveat as your Newsreader
import: the better long-term home for both fonts is Customizer → Typography,
after which both `@import` lines can be deleted.

Why this is safe in the shared sheet: every selector in section Y is scoped
under `.aa` (verified by script, zero exceptions). The three class names it
shares with the course template — `.aa-hero`, `.aa-stats`, `.aa-quotes` — are
all `.aa-rd`-scoped on the template side, so neither sheet can reach the
other. Verified by rendering the home pages with the v21 rules loaded first:
no interference, and v21's own `body:has(.aa-hero)` rule hides the stock
page title on the home pages as a bonus.

## 2. WPCode → JavaScript Snippet — "AA – Home JS"

* **Add Snippet → Add Your Custom Code → JavaScript Snippet**
* Paste the whole of `redesign-build/aa-home/aa-home.js`.
* **Auto Insert**, **Site Wide Footer**, no conditional logic. Save + Activate.

Safe site-wide, same as AA – Nav JS: its first action is
`if (!document.querySelector('.aa')) return;` so it does nothing on every
other page. Do NOT paste this into a Custom HTML block — the editor rewrites
`&&` to `&#038;&#038;` there and the script dies on a SyntaxError.

## 3. WPCode → PHP Snippet — `aa-home-cohorts-wpcode-snippet.php`

* Update the existing cohorts snippet to the current file (full replacement).
* **Auto Insert**, **Run Everywhere**. It only registers a shortcode.
* The current version understands `lang="es|fr"` — the older one renders the
  cohort cards in English on the translated pages.

---

## 4. The page blocks

| Page | File |
|---|---|
| `/` (English front page) | `snippets/pages/home-961-v3-markup-only.html` |
| `/es/` (page 29277) | `snippets/pages/translations/home-es.html` |
| `/fr/` (page 29281) | `snippets/pages/translations/home-fr.html` |

For each: edit the page, put the whole file into a single **Custom HTML**
block, replacing that block's contents. The files carry no
`<!-- wp:html -->` wrapper — that is a block-editor delimiter, and pasting it
inside a Custom HTML block nests one html block inside another (both `/es/`
and `/fr/` are in that state now).

### `/es/` and `/fr/` need one extra step

Both pages currently hold **two** top-level blocks:

1. a Group block with class `aa-rd` — the previous Spanish/French page: its
   own header bar, hero, and the old six-card course grid;
2. the Custom HTML block.

Replacing the second never touches the first — that is why the old course
cards still show above the new page. **Delete the `aa-rd` Group block**: open
the block outline (list icon, top-left), select the first Group, delete. It
also still carries the "4.9/5" rating claim removed everywhere else.

---

## Mobile / SEO / LLM — what is in place

* **Mobile**: verified at 390px in Chromium — no horizontal overflow, cards
  stack, the ticker and pyramid collapse; hit targets ≥44px;
  `prefers-reduced-motion` honoured in both section Y and your global Z rule.
* **SEO**: one `<h1>`, sections under `<h2>` with `aria-labelledby`;
  Organization + Person JSON-LD localised per language (`inLanguage`,
  `/es/`-scoped `@id`s); Course/CourseInstance JSON-LD emitted by the cohorts
  shortcode always matches the dates actually printed; no `aggregateRating`
  or invisible-FAQ markup anywhere; all images carry `alt` and `loading="lazy"`.
* **LLM-readable**: every word is real text in the DOM — the hover panels'
  copy is also in `data-report`/`data-dim` attributes, the stat numbers are
  server-rendered text that JS merely animates, and the cohort dates are
  rendered server-side by PHP, not injected.
* Worth adding when convenient (site-level, not in these files): `hreflang`
  alternates between `/`, `/es/` and `/fr/` — AIOSEO can emit these.

## Checking it worked

* `/` — two-column hero, cohort dates on the right, sections animate on hover.
* `/es/` — same layout, dates like `22–25 ago`, no old course grid above.
* Unstyled single column of text → the **Additional CSS section** didn't go
  live (or cache not purged). Layout right but nothing moves → the **JS
  snippet**. Cohort panel empty or in English on `/es/` → the **PHP snippet**.
