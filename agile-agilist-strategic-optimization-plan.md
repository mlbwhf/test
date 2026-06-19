# Agile Agilist — Strategic Optimization Plan
_Based on GA4 snapshot 2026-05-10 → 2026-06-06 + Mobile-First handover. Live-data findings, not theory._

## ✅ Fixed live this session
- **`/training/safe/` salary backtick bug** — every salary chip was rendering `` `$92K - `$135K ``. Stripped across 12+ instances. Visible to all visitors of the #1-bounce parent page.
- **Broken hero CTA** — "Browse Certifications" pointed to `#certifications` (no such anchor). Now points to `#cohorts` (real). Drops users into the schedule instead of into a void.
- **3 duplicate inline CSS blocks** (`.jrn-wrap` was triplicated). Cleaned to one.

---

## 🔴 CRITICAL DATA-DRIVEN FINDINGS

### 1. Title typos are LIVE on real ranking pages
The CSV shows two **misspelled-brand** page titles getting real organic traffic:

| Title in GA4 | Views | Bounce | Verdict |
|---|---|---|---|
| `Leading SAFe - SAFe Agilist - Agili Agilist` | 44 | 49% | **"Agili" typo** |
| `Leading SAFe - SAFe Agilist - Agilie Agilist` | 30 | 34% | **"Agilie" typo** |
| `Transformation, Innovation, and Certification #separator_saAgile Agilist` | 9 | 44% | **unrendered AIOSEO template macro** |

These come from the **AIOSEO custom title field** (the plugin's own DB table — not exposed to MCP, so I can't fix automatically). On a "premium SPCT-led" brand this is reputation damage on the highest-spending ad keyword cluster. **Manual fix in AIOSEO → Search Appearance.** The `#separator_sa` is a literal Smart-Tag that wasn't filled in — find the template using it and replace with proper title.

### 2. /training/safe/sa/ (Leading SAFe) bleeding paid spend with no conversions
- **Title in GA4:** "SAFe® Certification Training Toronto | Gold SPCT | Agile Agilist"
- **314 views, 70% bounce, 996 events** — #1 most-viewed page
- Handover says: **CA$332 in 3 weeks paid spend, 0 registrations**

Why it's bouncing: the AIOSEO title sells "Toronto" hard, but the page itself is generic — visitors expect a Toronto-specific schedule with dates/price, see a global page, and bounce. **Action options below in Priority Table.**

### 3. Content cannibalization — duplicate SPC pages competing
The CSV shows at least **4 different SPC titles** ranking:
| Title | Views | Bounce |
|---|---|---|
| "Implementing SAFe® with SPC Certification - Agile Agilist..." | 89 | 69% |
| "Certified SAFe® 6 Practice Consultants (SPC)..." | 77 | 43% |
| "Implementing SAFe® (SPC) Certification | Gold SPCT Trainer..." | 59 | 64% |
| "Certified SAFe® 6 Practice Consultants (SPC) En Español" | 17 | 54% |

Plus paginated versions ("Page 2", "Page 3"). Google can't pick a canonical → splits link equity → ranks weakly. **Consolidate to one English SPC page + one Spanish + one French, 301 the rest.**

### 4. "Page not found" = #9 most-viewed page (49 views, 33 users)
49 organic landings hitting 404s. Without the URL list I can't generate redirects, but the count is high enough to be worth one bulk-redirect session. **You need to export the 404 log:**
- `wp-admin → Tools → Redirection → 404s` → CSV export
- OR Search Console → Pages → "Page is not indexed: Not found (404)"

Paste the list back to me and I'll generate every 301 rule.

### 5. AI-Native is genuinely outperforming SAFe — the surge is real
Bounce rates by page tell the story:
| Page | Bounce | Views |
|---|---|---|
| AI-Native Foundations | **42.9%** | 90 |
| AI Training and Certification AI-Native Foundations | **35.5%** | 33 |
| AI-Native Training & Cert | 50% | 43 |
| vs. SAFe Toronto | 70% | 314 |
| vs. RTE Career Path | 70% | 74 |
| vs. SPC v1 title | 69% | 89 |

**AI-Native bounces ~30 points lower.** The traffic-acquisition cost is paid; the bounce-rate gap means AI-Native is where conversion already works. **The AI-Native homepage band I built this session directly targets this surge.** Apply it.

### 6. Geographic reality — global, not Toronto-centric
| City | Active users | Notes |
|---|---|---|
| Toronto | 103 | #1 but only 7.4% of total |
| New York | 63 | strong US |
| Chicago | 35 | |
| Ottawa | 22 · Montreal 19 · Calgary 15 · Mississauga 13 | Canada total ~180 (13%) |
| London 19, Dubai 17, Singapore 17 | | global |
| Plus ~600 cities with 1–4 users each | | extremely long tail |

**Validates global-first messaging.** A Toronto-only landing page would underserve 87% of users; do localized **"hub" landing pages for Toronto, NY, Chicago, London, Dubai** — not Toronto only.

### 7. Acquisition channel skew
- **Bing/PPC: 559 users (40% of all traffic)** — biggest channel by far
- Direct: 292
- Google CPC: 205
- Google organic: 142
- Bing organic: 27
- LinkedIn referral: 9

**Bing dominates because IndexNow plugin auto-submits new content.** Google organic is undersupplied — that's the upside if titles, schema, and content quality improve.

---

## 🎯 PRIORITIZED ACTION ROADMAP

### P0 — Critical bugs (fix this week, all manual via wp-admin)
| Action | Where | Owner | Why |
|---|---|---|---|
| 1. **Fix typo titles** ("Agili", "Agilie", "#separator_sa") | AIOSEO → Search Appearance → Content Types → Pages / per-page | You | Brand damage; 83 views on the typo'd page (44+30+9) every 4 weeks |
| 2. **Audit `/training/safe/sa/` (Leading SAFe)** — content + mobile | wp-admin edit page 24467 | You + me | CA$332/3wk wasted; #1 traffic |
| 3. **Consolidate duplicate SPC pages** → 1 EN + 1 ES + 1 FR; 301 the rest | Redirection plugin | You + me | Cannibalization hurting all SPC rankings |
| 4. **Export & 301 the 49 404s** | Redirection plugin → 404s log → CSV → I generate rules | You exports, me builds | 49 lost organic landings/month |

### P1 — High leverage (this week/next)
| Action | Where | Owner |
|---|---|---|
| 5. **Apply Homepage AI-Native band** (built last session) | Home (961) Code editor | You |
| 6. **Apply Course JSON-LD schema** to 6 cert pages (built last session) | AIOSEO → Schema → Custom per page | You |
| 7. **Above-the-fold mobile CTA audit** — Course pages: ai-native-foundations, ai-native-change-agent, /training/safe/sa/, /training/adv-safe/rte/, /training/adv-safe/spc/ | wp-admin per page | You/dev |
| 8. **Hub landing pages for NY, Chicago, London, Dubai** (clone the Toronto draft I made, find/replace) | Pages → New | You + me to clone |
| 9. **AIOSEO: allow AI crawlers** in robots.txt (GPTBot/ClaudeBot/PerplexityBot/CCBot/Google-Extended) | AIOSEO → Tools → Robots.txt | You |

### P2 — Performance & polish
| Action | Where |
|---|---|
| 10. **Mobile-first audit per handover doc** — Lighthouse on top 5 paid landing pages; fix any < 75 score | dev tools / PageSpeed |
| 11. **Image compression** — WebP Conversion plugin is active; verify hero images are converted | Media library |
| 12. **Mobile nav audit** — hamburger smoothness, full-width tap targets, submenu touch | Astra theme settings |
| 13. **Page-level fast wins** — Eventbrite mobile rendering on SAFe pages, GTM consistency on www vs non-www | dev |

### P3 — Ads-side moves (Google Ads console, your work)
| Action | Source |
|---|---|
| 14. **Re-evaluate PMax-2 unpause** with tighter asset groups (CA$1.44 cross-network was efficient) | Earlier handover |
| 15. **Shift to corporate phrase-match** terms: "corporate ai training", "ai training for business leaders" | Earlier handover |
| 16. **Geo bid adjustments** +10–15% Toronto, NY, Chicago | Earlier handover |
| 17. **Pause ads on dup/typo pages** until canonicalized | This audit |

---

## 🚫 What I can't do (be honest about it)
- **Lighthouse mobile audits / screenshots** — outbound to the site is firewalled in this environment. Need you (or any free Lighthouse run) to provide scores. I can interpret the report and make fixes.
- **AIOSEO custom title field writes** — AIOSEO stores titles in its own DB table, not standard post meta. The MCP can't reach it. All AIOSEO titles/meta changes are wp-admin manual.
- **Google Ads changes** — no Ads MCP access. Recommendations above are your console work.
- **Browser-rendered mobile testing** — can only inspect HTML/CSS/blocks, not actual render.

---

## ▶️ What I'll do next via MCP if you say go
1. **Read `/training/safe/sa/` (24467) content** and compare structure-by-structure to `/training/safe/popm/` (3567 — known-working). Surface concrete differences explaining the 70% bounce. (Read-only, safe.)
2. **Identify the typo pages** by listing every page that has `Agili` or `Agilie` anywhere visible. (Read-only.)
3. **Identify which SPC page is the original canonical** vs. clones (compare modified dates, word count, internal links).
4. **Apply the homepage AI-Native band live** (no longer paste-only) — I'll do a surgical content insert with full integrity check.
5. **Clone the Toronto draft to NY, Chicago, London, Dubai** as drafts.

Tell me which and I'll do them in order.
