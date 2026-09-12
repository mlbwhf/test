# Report AI — Theme Deployment Guide

This folder is a **block child theme** of Twenty Twenty-Five that adds the AI-Index
design system + the `/stats/` data-node template automation described in the GEO blueprint.

```
report-ai-theme/
├── style.css                              # Child theme header (Template: twentytwentyfive)
├── theme.json                             # AI-Index palette + Inter typography + element styles
├── functions.php                          # ai-statistic CPT + <head> Dataset JSON-LD injector
└── templates/
    ├── archive-ai-statistic.html          # Hub/index template (DataCatalog-style listing)
    └── single-ai-statistic.html           # Single "data node" template
```

## What this gives you
| Blueprint item | Delivered by |
|---|---|
| Global palette `#0e2f56 / #4a90e2 / #e67e22` | `theme.json` color palette |
| Inter "Analytical Sans" typography | `theme.json` fontFamilies |
| Links = circuit blue, headings = charcoal | `theme.json` → styles.elements |
| `ai-statistic` post type at `/stats/` | `functions.php` |
| Per-page `Dataset` JSON-LD in `<head>` | `functions.php` → `wp_head` |
| Hub archive layout | `templates/archive-ai-statistic.html` |
| Single data-node layout | `templates/single-ai-statistic.html` |

## How to deploy on WordPress.com

**Requirement:** a **Business** (or higher) plan — it's the tier that allows custom
theme uploads / SFTP / plugins. Simple/Premium plans cannot run custom PHP.

### Option A — Upload as a child theme (recommended, needs Business plan)
1. Zip this `report-ai-theme/` folder.
2. WP Admin → **Appearance → Themes → Add New → Upload Theme** → upload the zip.
3. **Activate** "Report AI". (It inherits Twenty Twenty-Five via the `Template:` header.)
4. Go to **Settings → Permalinks → Save** once, so the `/stats/` post type routes register.
5. Create content as **AI Statistics** posts; they publish under `/stats/...`.

### Option B — Pieces, without uploading a theme
- **Palette + fonts:** WP Admin → **Appearance → Editor → Styles** → set the three colors
  and Inter manually (mirrors `theme.json`).
- **Templates:** **Appearance → Editor → Templates → Add New →** paste the contents of
  the two `.html` files via the **Code editor** (⋮ menu).
- **CPT + `<head>` schema (PHP):** paste `functions.php` logic into a code-snippets plugin
  (e.g. WPCode) — the Site Editor cannot run PHP.

## Notes
- `theme.json` uses schema **version 3** (correct for Twenty Twenty-Five). The version-2
  snippet in the original brief also works but v3 matches the parent theme.
- The single template intentionally does **not** hardcode the Dataset JSON-LD in the body —
  `functions.php` injects it into `<head>` dynamically per the brief, avoiding duplication.
- The pages already published at `/stats/...` (built via the content API) carry the same
  rendered structure + schema, so they keep working whether or not this theme is active.
