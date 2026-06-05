# implementing-safe.com — Google + LLM (GEO) Optimization Plan
_Audit + prioritized roadmap. Site: self-hosted on SiteGround, Jetpack-connected. SEO engine: All in One SEO (AIOSEO). Analytics: MonsterInsights/GA. Caching: SiteGround Speed Optimizer._

> Reality check: no one can *guarantee* #1 on Google — it depends on competition, backlinks, domain age, and time. This plan maximizes every **controllable** on-site, technical, and LLM-readability factor and sets the foundation so ranking compounds.

## ✅ Already done
- Fixed empty **site title** → "Implementing SAFe".
- Fixed corrupted AI-Native framework page (162).

---

## P0 — Critical (do first; biggest leverage)

### 1. Let AI crawlers in (the core "readable by all LLMs" lever)
LLMs only cite pages their bots can fetch. **AIOSEO → Tools → Robots.txt Editor** — ensure these are **Allowed** (not blocked by SiteGround Security or a default rule):
`GPTBot`, `OAI-SearchBot`, `ChatGPT-User` (OpenAI) · `ClaudeBot`, `anthropic-ai`, `Claude-Web` (Anthropic) · `PerplexityBot` · `Google-Extended` (Gemini/AI Overviews) · `Applebot-Extended` · `CCBot` (Common Crawl — trains many models) · `Bytespider`, `Amazonbot`, `meta-externalagent`.
- Confirm **Googlebot** and **Bingbot** are NOT disallowed.
- ⚠️ SiteGround Security can rate-limit/block aggressive bots — whitelist the above in SG Security if needed.

### 2. Submit to Search Console + Bing
- **Google Search Console**: add property `implementing-safe.com`, verify (AIOSEO → General → Webmaster Tools has a Google verification field), then submit the sitemap: `https://implementing-safe.com/sitemap.xml`.
- **Bing Webmaster Tools** (also powers ChatGPT search): verify + submit same sitemap.

### 3. AIOSEO Knowledge Graph / Organization schema
**AIOSEO → Search Appearance → Global Settings → Knowledge Graph**: set Organization, name "Implementing SAFe", upload logo, add social profiles. This is the entity LLMs and Google use to "understand who you are."

---

## P1 — High impact (on-page; mostly AIOSEO UI)

### 4. Per-page SEO titles + meta descriptions (AIOSEO sidebar on each page)
Keyword-first, ≤60-char titles + ≤155-char descriptions. Starter set:

| Page (ID) | SEO Title | Meta Description |
|---|---|---|
| Home (34) | `Implementing SAFe® — The 5-Dimensional AI-Native Framework` | `Go beyond the certification. Implementing SAFe's 5-dimensional framework operationalizes SAFe, innovation, and AI-native delivery. SPCT-led.` |
| Framework (33) | `The 5-Dimensional SAFe Implementation Framework` | `SAFe Implementation, Innovation, AI-Native, AI Automation & Mutation — the operating model that makes SAFe stick. Built from 21 years in the field.` |
| Roadmap (40) | `SAFe Implementation Roadmap — Assess to AI-Native` | `Five phases, three engagement models, and 90/180/365-day milestones for a SAFe transformation that sustains. See the roadmap.` |
| SPC (41) | `Implementing SAFe® (SPC) Certification + Framework` | `SPCT-led SPC certification with the full 5-dimensional operating model embedded. Leave with the cert and the framework — not just the badge.` |
| ASPC (42) | `Advanced SAFe Practice Consultant (ASPC) Certification` | `Advanced SPC training for senior change agents leading large-scale, AI-native SAFe transformations. SPCT-led.` |
| AI-Native cert (86) | `AI-Native SAFe Certification — 3 Tracks` | `Certify the operating model, not just the concept. Foundations, Change Agent & Executive tracks for AI-native enterprise delivery.` |
| Innovation cert (88) | `Innovation Framework Certification for SAFe` | `Structure innovation so it scales. Certification in the Innovation Framework dimension of Implementing SAFe.` |

(Framework sub-pages 160–164 and consulting/certifications: same pattern — I can draft all of them.)

### 5. Schema on key pages (rich results + LLM entity clarity)
- **Course** schema on cert pages (SPC, ASPC, AI-Native, Innovation) — AIOSEO Pro does this in the Schema sidebar; AIOSEO Lite does not, so I can inject clean JSON-LD via a code block instead.
- **FAQPage** schema where FAQ sections exist (SPC, AI-Native cert) — eligible for FAQ rich results + heavily used by AI answers.
- **BreadcrumbList** — AIOSEO outputs this if breadcrumbs enabled; our framework pages have manual breadcrumbs, so add matching JSON-LD.
- I can inject all of the above via MCP (wp:html JSON-LD blocks) where AIOSEO Lite leaves a gap — **just say the word and I'll add Course + FAQ + Organization schema to the key pages.**

### 6. Image alt text
Every roadmap image needs descriptive alt (image SEO + LLM comprehension). I can set these via MCP now (the SPC band already has alt).

---

## P2 — GEO / LLM-readability specifics

### 7. llms.txt at the domain root
Emerging standard (`/llms.txt`) that hands LLMs a curated map of your key pages + descriptions. Create via the **SiteGround File Manager** or a plugin ("Website LLMs.txt"). I can generate the file contents for you to drop in.

### 8. Content structure for AI citation (already strong — keep doing)
The pages are server-rendered HTML with clear H1/H2s, tables, definitions, and FAQ — exactly what LLMs extract and cite. Keep: one H1 per page, descriptive headings, factual sentences, comparison tables, and a short TL;DR near the top of each page.

### 9. Internal linking / topic clusters
`/framework/` is the pillar; the 5 dimension pages + cert pages are the cluster. Ensure every page links up to the pillar and across to siblings with descriptive anchor text (the framework sub-nav already helps).

### 10. Core Web Vitals
SiteGround Speed Optimizer: enable **Dynamic Caching, CSS/JS minify + combine, lazy-load, WebP**. The roadmap PNGs are large (1.6–2.8 MB) — **compress them** (WebP) so they don't hurt LCP. Test in PageSpeed Insights after.

---

## Division of labor
| I can do via MCP | You / wp-admin / external |
|---|---|
| Inject Course/FAQ/Organization JSON-LD schema | AIOSEO robots.txt (AI bots), Knowledge Graph, per-page titles/meta |
| Image alt text | Google Search Console + Bing verify + sitemap submit |
| Internal-link & content tweaks | llms.txt file upload (or I generate, you place) |
| Generate llms.txt contents, titles/meta, alt copy | SiteGround caching/WebP, Search Console monitoring |
| Fix thin/broken content | Backlinks / off-page authority |

## Suggested order
1. P0.1 AI-bot robots.txt + P0.2 Search Console (you) — unblocks indexing & LLM access.
2. P0.3 + P1.4 AIOSEO Knowledge Graph + titles/meta (you, I draft).
3. P1.5 schema + P1.6 alt text + P2.7 llms.txt (me).
4. P2.10 CWV/WebP (you).
