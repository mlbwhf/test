# 301 Redirect Map — consolidated (all in one place)
_All of these are **your side** — I can't touch DNS/hosting/redirect plugins. Two kinds below: (A) **on-site** redirects within agile-agilist.com → use the **Redirection** plugin or **AIOSEO → Redirects**; (B) **cross-domain** → registrar URL-forwarding or SiteGround/.htaccess. Always **301 (permanent)**, never 302._

---
## A. On-site redirects (agile-agilist.com) — fixes duplicate/cannibalizing pages
Tool: **AIOSEO → Redirects** (Pro) or the free **Redirection** plugin. Source = relative path, Target = full URL, Type = **301**.

| # | Source (redirect FROM) | Target (TO — the canonical) | Why |
|---|---|---|---|
| 1 | `/wp-training/ai-native-foundations-certification-3/` | `https://agile-agilist.com/training/ai-native/ai-native-foundations/` | AI-Native Foundations **duplicate** splitting authority (GSC pack §C) |
| 2 | *each non-canonical SPC URL* (you have ~4 competing SPC pages) | `https://agile-agilist.com/training/adv-safe/spc/` | **SPC cannibalization** — consolidate to ONE canonical SPC page |
| 3 | `/training/safe-industry/safe-for-harware/` | `https://agile-agilist.com/training/adv-safe/aspc/` *(or a real SAFe-for-Hardware page if you build one)* | Duplicated ASPC content + slug typo `harware` |

### How to find the SPC duplicates for row 2 (do this first)
1. Google: `site:agile-agilist.com spc` — list every SPC URL that appears.
2. Pick the **canonical** = `/training/adv-safe/spc/` (the commercial page; matches the GSC pack + safe-spc.com target).
3. 301 **every other** SPC URL → that canonical. Send me the list and I'll confirm which to keep vs redirect.
4. After redirecting, update internal links that pointed at the old SPC URLs to the canonical (so they don't chain through a redirect).

> ⚠️ Before redirecting any page that currently gets **ad traffic**, confirm it's not a live ad landing URL. If it is, repoint the ad to the canonical first, then redirect.

---
## B. Cross-domain redirects (separate domains → canonical pages)
Tool: registrar **URL Forwarding (Permanent/301, forward path ON, SSL ON)** or SiteGround **Domain → Redirects** / `.htaccess`.

| Domain | Target | Status |
|---|---|---|
| **safe-spc.com** (all paths) | `https://agile-agilist.com/training/adv-safe/spc/` | ✅ Decided (domain plan) — set at registrar/SiteGround |
| **scaledagile101.com** (all paths) | `https://agile-agilist.com/` | ⭐ **Recommended** (see below) |
| **implementingsafe.org** | — **no redirect** — | It's now a LIVE content site, not a forward. Leave as-is. |

`.htaccess` pattern for a whole-domain 301 (in that domain's docroot):
```
RewriteEngine On
RewriteRule ^(.*)$ https://agile-agilist.com/training/adv-safe/spc/ [R=301,L]
```
(swap the target per domain).

---
## scaledagile101.com — decision (recommendation)
**Recommended: 301 → `https://agile-agilist.com/`** (or a "New to SAFe? Start Here" page if you build one).
- ✅ Zero maintenance, brand-protective, passes any type-in equity to the canonical site.
- ✅ Avoids the **Gold Partner / trademark risk** of running a public brand with "Scaled Agile" in the domain (holding + redirecting is low-risk; a public branded microsite is the thing to avoid without partner sign-off).
- The only reason **not** to redirect: if you commit to a genuinely distinct, maintained **free beginner-SAFe education hub** (real ongoing content, no sales) — but that's a content commitment *and* needs partner-agreement confirmation first. Unless you want that, redirect it.

**My call: redirect it now** (reversible anytime). If you'd rather hold it for the education hub, say so and I'll spec that instead — otherwise apply the 301 above.

---
## Verify each redirect after setup
- Visit the source → must land on target over **https** with a **301** (check DevTools → Network, or redirect-checker.com).
- No redirect **chains** (A→B→C). Point straight to the final canonical.
- Re-submit the canonical URLs in **GSC → URL Inspection → Request Indexing**.
