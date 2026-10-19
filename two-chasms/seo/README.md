# twochasms.com — SEO launch pack

Files in this folder:
| File | Where it goes |
|---|---|
| `meta_table.md` | SEO title + meta description for each of the six pages (length-checked: titles ≤ 60, descriptions 120–160) |
| `schema-site.html` | JSON-LD: WebSite + Organization (Agile Agilist Inc.) + Person (Mark Saymen). Site-wide, appended to template 7 |
| `schema-books.html` | JSON-LD: the two Books. On /books only |
| `robots.txt` | Site root (WordPress serves a virtual one; replace only if you want these rules) |
| `sitemap.xml` | Static fallback. **Prefer the live sitemap** WordPress or the SEO plugin generates — it updates itself |
| `llms.txt` | Site root — plain-language index for AI search tools |
| `build_seo.py` | Regenerates the table and JSON-LD |

## 1. WordPress settings (5 minutes, WP admin)
1. **Settings → General**: WordPress Address and Site Address both `https://twochasms.com` (Hostinger's "connect domain" usually sets these — check).
2. **Settings → Reading**: untick **"Discourage search engines from indexing this site"**. If this is ticked, nothing below works.
3. **Settings → Permalinks**: click **Save** once (refreshes rewrite rules for the new domain).
4. **Old address**: open `https://springgreen-sardine-416356.hostingersite.com/` — it should 301 to `https://twochasms.com/`. If it doesn't, set the redirect in hPanel so the temporary address isn't indexed as a duplicate.

## 2. Titles, descriptions, social cards
The theme (Twenty Twenty-Five) has no SEO fields, so meta descriptions can't be set yet. Install **All in One SEO** (free; same plugin as agile-agilist.com):
- Paste each row of `meta_table.md` into the page's AIOSEO box (Title, Description).
- AIOSEO → Social Networks → set a default share image (1200×630). The brand kit's Social Kit has the right look; I can render one.
- AIOSEO takes over the sitemap at **`/sitemap.xml`** (instead of WordPress's `/wp-sitemap.xml`). Use whichever is live when you submit (step 3); update the `Sitemap:` line in `robots.txt` to match.

## 3. Google Search Console
1. search.google.com/search-console → **Add property → Domain** → `twochasms.com`.
2. It gives a **TXT record**. hPanel → Domains → twochasms.com → **DNS / Nameservers** → add TXT, host `@`, paste the value → back in GSC click **Verify** (can take minutes to an hour).
3. **Sitemaps** → submit `https://twochasms.com/sitemap.xml` (AIOSEO) or `https://twochasms.com/wp-sitemap.xml` (core).
4. **URL inspection** → request indexing for: `/`, `/assess/`, `/maturity/`, `/workshops/`, `/books/`, `/cast/`.

## 4. Bing (also feeds ChatGPT search, DuckDuckGo, Yahoo)
1. bing.com/webmasters → **Import from Google Search Console** (one click once GSC is verified) — this brings the sitemap with it.
2. **IndexNow**: install the free *IndexNow* plugin (Microsoft); it pings Bing/Yandex on every publish.

## 5. Links that point at the site
- agile-agilist.com: link to `https://twochasms.com/` from the Mutation Readiness page and the footer — the first real backlink, and it ties the two sites together.
- Social profiles (`@twochasms`): put `https://twochasms.com` in each bio; add them to `sameAs` in `schema-site.html` once they exist.
- The site's own links are all relative, so nothing inside the pages needs changing for the new domain.

## 6. After the switch — for whoever maintains the site
- The Claude connector for this site (`mutation`) still points at the old hostingersite address; update its URL to `https://twochasms.com/…` in claude.ai connector settings so edits can resume.
