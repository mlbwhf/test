# scaleagile101.com — site build kit (white-label)

A neutral, vendor-independent **"Scaled Agile 101"** educational site that teaches the Scaled Agile
Framework (SAFe) to beginners. Built to be deployed to the Jetpack-connected **scaleagile101.com**.

> **IMPORTANT — white-label:** This site must NOT contain the agile-agilist logo or any mention of
> agile-agilist (or sister brands). No outbound links to those properties. All links are internal.

## Pages (deploy order)
| Page | Slug | File |
|---|---|---|
| Home (front page) | `/` | `pages/home.html` |
| What is Scaled Agile? | `/what-is-scaled-agile/` | `pages/what-is-scaled-agile.html` |
| The core roles | `/core-roles/` | `pages/core-roles.html` |
| Cadence & events | `/cadence-and-events/` | `pages/cadence-and-events.html` |
| Glossary | `/glossary/` | `pages/glossary.html` |
| FAQ | `/faq/` | `pages/faq.html` |

## Design
- Palette: indigo `#4F46E5` / deep `#1E1B4B`, amber accent `#F59E0B`, ink `#111827`, slate `#475569`,
  light `#F8FAFC`. Deliberately distinct from the RTE / agile-agilist house style so it reads as its
  own brand.
- Self-contained inline-styled Gutenberg blocks — theme-agnostic, responsive.

## SEO & LLM
- `seo-titles-meta.md` — AIOSEO titles + meta per page.
- `schema/faq-jsonld.html` — FAQPage JSON-LD for the FAQ page.
- `llms.txt` — place at site root for LLM/AI crawler optimization.
- Nav: `Home · What is Scaled Agile · Roles · Cadence & Events · Glossary · FAQ`.

## Deploy
Publish each page via the WordPress block editor (Code editor → paste), set Home as the static front
page, apply AIOSEO meta, and add the FAQ schema. (When the WordPress.com MCP connection is authorized,
these can be published programmatically.)
