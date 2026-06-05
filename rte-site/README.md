# rte-releasetrainengineer.com — WordPress site build kit

A focused microsite about the **SAFe® Release Train Engineer (RTE)** role and certification,
designed to live on the self-hosted WordPress install at **https://marks751.sg-host.com/**
(later mapped to **rte-releasetrainengineer.com**) and cross-linked with the sister sites
**agile-agilist.com** and **implementing-safe.com**.

## Why this is delivered as files
`marks751.sg-host.com` is a **separate, self-hosted WordPress install** (SiteGround) that is
**not connected** to the WordPress.com / Jetpack account used by the MCP tools, so content can't
be pushed to it automatically from here. These files are ready-to-paste WordPress block markup
plus the SEO/schema metadata, so the site can go live in minutes either way (see below).

## Site structure (sitemap)

```
Home  (/)                              → pages/home.html
├─ RTE Role & Responsibilities (/rte-role-responsibilities/) → pages/rte-role.html
├─ RTE Certification (/rte-certification/)                    → pages/rte-certification.html
├─ Become an RTE — Salary & Career (/become-an-rte/)          → pages/become-an-rte.html
├─ FAQ (/faq/)                                                → pages/faq.html
└─ About / Contact (/about/)                                  → pages/about-contact.html
```

### Recommended primary navigation menu
`Home · The RTE Role · Certification · Careers · FAQ · About`
Header CTA button → **Enroll in the RTE course** (`https://agile-agilist.com/training/adv-safe/rte/`)

## How to publish each page
The `.html` files are **WordPress block-editor (Gutenberg) markup**. For each page:
1. WordPress admin → **Pages → Add New**.
2. Set the page **Title** and **Slug** (see the table in `seo-titles-meta.md`).
3. Open the editor's **Options (⋮) → Code editor**.
4. Paste the full contents of the matching `.html` file. Switch back to **Visual editor** to preview.
5. Apply the **SEO title + meta description** from `seo-titles-meta.md` in your SEO plugin.
6. On the FAQ page add a **Custom HTML** block with `schema/faq-jsonld.html`; on the Certification
   page add one with `schema/course-jsonld.html`.

## Two paths to go live
1. **Manual (works today):** follow the steps above, copy/paste each page. ~15 minutes.
2. **Automated (optional):** connect `marks751.sg-host.com` to WordPress.com by installing the
   **Jetpack** plugin and linking it to the same account. Once connected it will appear in the
   site list and these pages can be created/updated programmatically.

## Cross-linking plan (ties the three sites together)
Every page links out to the family; the family should link back so search engines see one cluster.

| From this site | Links to | Where |
|---|---|---|
| All pages (CTAs) | `agile-agilist.com/training/adv-safe/rte/` | Primary "Enroll / Get certified" buttons |
| Home, Careers | `implementing-safe.com` | Consulting / framework references |
| About, Footer | `agile-agilist.com`, `implementing-safe.com` | "Part of the family" cards |

**Reciprocal links to add on the sister sites:**
- On `agile-agilist.com/training/adv-safe/rte/` → add a "Learn more about the RTE role →"
  link to `rte-releasetrainengineer.com`.
- On `implementing-safe.com` (RTE/role mentions) → link to `rte-releasetrainengineer.com`.

## Design notes
- Dark hero `#0F172A`; accents cyan `#06B6D4 / #22D3EE` and lime `#84CC16 / #A3E635`;
  body text slate `#334155 / #475569`. Matches the agile-agilist / implementing-safe house style.
- All layouts are responsive (CSS grids collapse to single column on mobile).
- Replace placeholder figures (salary, course price/dates) with the live numbers from
  agile-agilist.com before launch.

## Sources used for content
- Scaled Agile — Release Train Engineer role & certification
- Glassdoor / ZipRecruiter / industry reports — RTE salary & demand (2026)
- SAFe RTE exam details (60 Q / 120 min / ~73% pass) — multiple training providers
