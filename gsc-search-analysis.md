# Google Search Console Analysis — agile-agilist.com
_Last 3 months (to 2026-06-12), Web search. Export: Pages/Queries/Countries/Devices._

## Headline numbers
- **303 clicks · 116,085 impressions · 0.26% CTR · avg position ~22 (page 2–3)**
- Desktop 220 clicks (pos 22.6) · Mobile 82 (pos 17.7) · Tablet 1
- **The story: huge impressions, almost no clicks.** The site is *seen* in search but ranks too low + titles don't earn clicks.

## Finding 1 — Brand search is the main click source
- "agile agilist" = **41 clicks** (33.9% CTR, pos 1.15) + "agilist" = 5. ~15% of ALL clicks are pure brand.
- Translation: people who already know you click; **non-brand commercial discovery is weak.**

## Finding 2 — The COMMERCIAL training pages don't rank (the #1 revenue leak) 🔴
High-intent "buy certification" queries with real impressions, ranking page 2–5 → ~0 clicks:
| Query | Impressions | Clicks | Position |
|---|---|---|---|
| asm certification | 1,300 | 1 | **10** (page-1 bottom — closest win) |
| safe devops | 1,029 | 0 | 38 |
| popm certification | 941 | 0 | 28 |
| safe devops certification | 787 | 0 | 28 |
| lean portfolio management training | 684 | 0 | 52 |
| safe advanced scrum master | 667 | 0 | 36 |
| ai native foundations | 596 | 0 | 13 |
| advanced spc training | 589 | 0 | 22 |
| safe practice consultant | 575 | 0 | 20 |
| advanced safe practice consultant | 573 | 0 | 18.6 |
| safe lpm certification | 562 | 0 | 39 |

Page-level confirms it: `/training/adv-safe/lpm/` 8,082 impressions @ pos **47**; `/training/safe/devops/` 6,782 imp @ pos 32, **0 clicks**; `/training/safe-industry/team-practitioner/` 5,591 imp, **0 clicks** @ pos 43; `/training/safe/popm/` 4,359 imp @ pos 38.
**→ Training pages aren't bouncing organically — they're INVISIBLE (buried page 3–5).** This is the biggest fixable lever.

## Finding 3 — The blog ranks page 1, but for OFF-TOPIC queries
Top organic pages by position are blog posts ranking for non-business intent:
- "empty boat theory" / "the empty boat theory" — **5,335 impressions, pos ~1.3**, ~0% CTR → Zen/Osho philosophy searchers, not buyers.
- "michelangelo effect in relationships" — pos 3–8 → relationship-psychology searchers.
- "what is cognitive debt" — pos 4.6, 3% CTR → AI thought-leadership.
**→ This is why blog "reads" looked high but didn't convert — it pulls the wrong audience.** The authority is real, but it's pointed at philosophy/psychology, not SAFe.

## Finding 4 — CTR is poor even at good positions
"empty boat theory" at pos 1.4 → **0.06% CTR** (3,604 imp, 2 clicks). Good rank, wrong intent + weak title. Commercial pages on page 1 (asm cert pos 10, 0.08% CTR) have titles that don't earn the click.

## Finding 5 — Geography (global, India is real)
US 76 clicks (pos 22.6) · Canada 34 · **India 29** (9,747 imp) · UK 19 · Germany 13 · **Spain 12 (1.7% CTR, pos 10.8 — best-converting)** · France 9 · Vietnam 6.
→ India is a genuine SAFe market (add to regional plan: INR/IST). Spanish content over-performs — double down on ES.

---

## Prioritized actions (revenue-first)
1. **Rank the commercial training pages from page 3–5 → page 1.** Biggest lever. Per page: tighten title/H1/content to match the exact query ("POPM Certification", "SAFe DevOps Certification", "SAFe Advanced Scrum Master", "Advanced SPC Training", "Lean Portfolio Management Training"), add depth, internal links, Course schema. Kill SPC cannibalization (consolidate to the winner).
2. **Quick wins at position 8–15** (one nudge → top 5): **asm certification (pos 10)**, ai native foundations (13), safe ai native (14), safe 6 spc (12). Improve title/meta + internal links first — fastest clicks.
3. **Funnel the page-1 blog authority to commercial pages.** Add strong CTAs + internal links from high-ranking posts (michelangelo, empty-boat, cognitive-debt, prompt-repetition, ais-impact-on-agile-roles) → AI-Native + training pages. Convert borrowed attention.
4. **Rewrite titles/metas on high-impression low-CTR commercial pages** — capture clicks without needing rank gains.
5. **Fix the training-page heroes** (CTA button, stale dates — see bounce-diagnosis.md) so the new clicks convert instead of bounce.
6. **Add India (INR/IST)** to the regional landing strategy; keep investing in Spanish.

## Note
GA4 "bounce" = mostly paid/Bing traffic. GSC shows the ORGANIC truth: a ranking problem on commercial terms + an off-topic blog. Fixing rank + on-page intent is higher-leverage than chasing bounce alone — but do both, since clicks that arrive still hit the hero issues.
