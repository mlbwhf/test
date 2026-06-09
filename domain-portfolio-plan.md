# Domain Portfolio — Management Plan
_Owner: mlbwhf@gmail.com · Created 2026-06-09 · Single source of truth for all owned domains._

## Governing principles
1. **One canonical site per audience.** Authority compounds on one domain; it never splits well.
2. **Never clone an existing site onto another domain.** Duplicate content splits authority and lets Google pick the winner for you.
3. **Every non-canonical domain does ONE of:** (a) 301-redirect to a canonical site/page, or (b) host a *genuinely distinct* property with unique content. Nothing in between.
4. **301, not 302.** Permanent redirects pass link equity; temporary ones don't.
5. **Gold Partner guardrail:** do not build public-facing brands on domains containing "SAFe"/"Scaled Agile" without confirming the partner agreement allows it. Defensive redirects = low risk; branded microsites = check first.

---

## The portfolio at a glance
| Domain | Role | Points to / Purpose | Action | Status |
|---|---|---|---|---|
| **agile-agilist.com** | 🟢 Canonical Site A | Commercial SAFe training & certification business | Keep as primary | Live |
| **implementing-safe.com** | 🟢 Canonical Site B | 5-Dimensional Framework / consulting (distinct audience) | Keep as primary | Live |
| **implementingsafe.org** | 🔁 301 redirect | → `implementing-safe.com` (brand protection, type-in) | Set 301 | To do |
| **safe-spc.com** | 🔁 301 redirect | → canonical SPC page (vanity/funnel for SPC) | Pick target, set 301 | Decision needed |
| **scaledagile101.com** | 🔁 301 redirect *(default)* | → `agile-agilist.com` (or a "Start Here" page) | Confirm + set 301 | Decision needed |

---

## Per-domain detail

### 🟢 agile-agilist.com — Canonical Site A
The commercial engine: SAFe certification, AI-Native (US/CA/ME), the new regional landing pages, all the ads. **This is the primary domain everything defensive should ultimately funnel toward.** No change.

### 🟢 implementing-safe.com — Canonical Site B
A legitimately *separate* property — the 5-Dimensional Framework / consulting angle, different positioning and audience. It earns its own canonical status because its content is distinct, not a copy of Site A. Keep. (If the two ever start overlapping heavily, revisit whether to merge — but today they're distinct.)

### 🔁 implementingsafe.org → 301 to implementing-safe.com
Pure brand protection + captures people who type `.org` or drop the hyphen. **Do not build a site on it.** A 301 forward gives you all the upside (brand safety, type-in traffic, link equity) with zero maintenance.

### 🔁 safe-spc.com → 301 to your canonical SPC page
Exact-match domain for the SPC product. Note: EMDs no longer auto-rank (post-2012 Google EMD update), so its value is **memorability + a clean vanity URL for ads/print**, not free rankings.
- **⚠️ Do NOT make it a 3rd SPC page** — you already have an SPC cannibalization problem (4 competing SPC pages in GA4). A third destination makes it worse.
- **Action:** 301 it to the ONE SPC page you choose as canonical, so it reinforces the winner instead of competing.
- **Recommended target:** `agile-agilist.com/training/adv-safe/spc/` (the commercial conversion page). *Decision needed — see below.*

### 🔁 scaledagile101.com → 301 (default recommendation)
"101" framing fits beginner/top-of-funnel education. Two paths:
- **Default (recommended): 301 → agile-agilist.com** (or a "New to SAFe? Start Here" page). Safe, zero maintenance, brand-protective.
- **Alternative (only if you'll invest): a distinct educational resource hub** — free beginner SAFe guides, no sales, funneling leads to the commercial site. This is real, ongoing content work AND carries the **trademark caution** above (the name closely echoes "Scaled Agile, Inc."). Don't pick this unless you've (a) confirmed the partner agreement allows it and (b) committed to maintaining unique content.

---

## ⚠️ Gold Partner / trademark caution (re-stated because it matters)
Scaled Agile, Inc. typically restricts partners from using **"SAFe" or "Scaled Agile" in domain/company/product names.**
- `safe-spc.com` and `scaledagile101.com` both touch this.
- **Holding them defensively and 301-redirecting = generally low risk.**
- **Building a public-facing branded site on either = confirm with your partner agreement first.** A breach can jeopardize Gold status.
- Action item: review your SAFe partner brand guidelines / ask your partner contact before any public build on these two.

---

## Governance (set once, forget)
- **Auto-renew ON** for all 5 domains. A lapsed domain can be grabbed by a competitor or squatter — losing `agile-agilist.com` would be catastrophic; losing the others, embarrassing.
- **Consolidate at one registrar** (or SiteGround) so renewals/DNS are managed in one place. Track expiry dates in one list.
- **HTTPS on every domain**, including the redirect-only ones (browsers flag http://; SiteGround gives free Let's Encrypt SSL).
- **Redirect at the domain/hosting level** (SiteGround "Redirect" tool or registrar forwarding), 301 permanent. For `safe-spc.com` pointing to a deep page, use a full-path 301 to that exact URL.
- **Re-audit yearly:** confirm each redirect still resolves, each canonical still ranks, nothing accidentally cloned.

---

## Decisions needed from you
1. **Canonical SPC page** (sets the `safe-spc.com` target AND resolves the SPC consolidation):
   - (A) `agile-agilist.com/training/adv-safe/spc/` — *recommended (commercial)*
   - (B) `implementing-safe.com/certifications/spc/`
2. **scaledagile101.com:** 301 to agile-agilist.com (recommended) — or do you want to scope the educational hub? (If hub: confirm partner-agreement OK first.)
3. **implementingsafe.org:** confirm 301 → implementing-safe.com (recommended).

Once you confirm 1–3, I'll write out the **exact redirect rules** (source → destination, 301) for you to paste into SiteGround/registrar.

## Implementation (your side — I can't touch DNS/hosting)
For each redirect domain, in SiteGround (or your registrar):
1. Point the domain's DNS at SiteGround (if not already), or use registrar URL forwarding.
2. Add a **301 permanent redirect**: `https://<domain>/*` → target URL.
3. Enable **SSL** on the domain.
4. Test: visit the domain, confirm it lands on the target with `301` (not `302`) and `https`.
