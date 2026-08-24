# Home page — install

Supersedes every earlier instruction. Three snippets installed **once**, then
one block pasted per language.

There is no PHP snippet for the CSS or the JS any more. That approach — a
26 KB stylesheet and 9 KB of JavaScript embedded inside a PHP heredoc — was
one 38 KB paste that had to survive intact or the whole page lost its styling,
and it did not survive. WPCode has native CSS and JS snippet types; they do
not go through `wp_kses`, so `<style>`/`<script>` stripping was never a reason
to use PHP for them in the first place.

---

## 1. WPCode → CSS Snippet — `redesign-build/aa-home/aa-home.css`

* **Add Snippet → Add Your Custom Code → CSS Snippet**
* Paste the whole file.
* **Auto Insert**, **Site Wide Header**. No conditional logic.
* Save + Activate.

Site-wide is safe and deliberate: every selector in the file is scoped under
`.aa`, verified by script — nothing outside the home page block can be
affected. It also means `/`, `/es/` and `/fr/` are covered without any
page-targeting rules to get wrong.

## 2. WPCode → JS Snippet — `redesign-build/aa-home/aa-home.js`

* **Add Snippet → Add Your Custom Code → JavaScript Snippet**
* Paste the whole file.
* **Auto Insert**, **Site Wide Footer**. No conditional logic.
* Save + Activate.

Also safe site-wide: the script's first action is
`if (!document.querySelector('.aa')) return;`, so on every other page it does
nothing.

## 3. WPCode → PHP Snippet — `aa-home-cohorts-wpcode-snippet.php`

This one has to be PHP — it reads the events feed. It is small.

* **Add Snippet → Add Your Custom Code → PHP Snippet**
* Paste the whole file. **Auto Insert**, **Run Everywhere**. Save + Activate.
* It only registers a shortcode, so it costs nothing on pages that never use it.

Update this snippet if the cohort panel shows English dates on `/es/` or
`/fr/` — the `lang` attribute is only understood by the current version.

---

## 4. The page blocks

| Page | File |
|---|---|
| `/` (English front page) | `snippets/pages/home-961-v3-markup-only.html` |
| `/es/` (page 29277) | `snippets/pages/translations/home-es.html` |
| `/fr/` (page 29281) | `snippets/pages/translations/home-fr.html` |

For each: edit the page, put the whole file into a single **Custom HTML**
block, replacing whatever is in that block. These files contain no
`<!-- wp:html -->` wrapper — that is a block-editor delimiter, and pasting it
*inside* a Custom HTML block nests one html block inside another. Both `/es/`
and `/fr/` are in that state right now.

### `/es/` and `/fr/` need one extra step

Both pages currently hold **two** top-level blocks:

1. a Group block with class `aa-rd` — the previous Spanish/French page: its own
   header bar, its own hero, and a "Cursos disponibles" / course grid of six
   badge cards;
2. the Custom HTML block with the new page.

Replacing the second does not touch the first, which is why the old course
cards are still showing above the new ones. **Delete the `aa-rd` Group block.**
Open the block list (the outline icon, top left of the editor), select the
first Group, delete it.

That Group also still carries the "4.9/5" rating claim that was removed
everywhere else on the site, so it needs to go regardless.

---

## Checking it worked

* View `/` — the hero should be two columns, cohort dates on the right.
* View `/es/` — same layout, Spanish dates (`22–25 ago`), no course-badge grid
  above the hero.
* If the page renders as a single column of unstyled text, the **CSS snippet**
  is not active — that is the only thing that produces that symptom.
* If the layout is right but nothing animates on hover, the **JS snippet** is
  not active.
* If the cohort panel is empty or in English on `/es/`, the **PHP snippet** is
  missing or is the older version.
