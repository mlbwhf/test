# Quick-Win SEO Optimization Pack — agile-agilist.com
_From GSC analysis (3 mo). Target: pages ranking page 1-bottom to page 3 with high impressions + near-zero CTR. Goal: title/meta + internal links to pull them into the top 5 and capture clicks already being shown._

## HOW TO APPLY
- **Titles & metas:** AIOSEO stores these in its own tables (not MCP-writable), so apply manually: wp-admin → edit page → **AIOSEO sidebar → Snippet → Title / Description**. Titles ≤60 chars, metas ≤155. Each title **leads with the exact searched query**.
- **Internal links:** can be done via MCP (append CTA blocks to the named blog posts) — see plan at bottom. I can execute these on your go.

---

## A. Quick wins — closest to page 1 (do these FIRST)
| Page (id) | Query / pos / impressions | New SEO Title | New Meta Description |
|---|---|---|---|
| **/training/safe/asm/** (1932) | "asm certification" · pos **10** · 1,300 imp · 0.08% CTR | `SAFe® Advanced Scrum Master (ASM) Certification Training` | `Get SAFe® Advanced Scrum Master (ASM/SASM) certified — SPCT-led, live-virtual, exam included. Lead high-performing Agile teams in a SAFe enterprise. View dates & register.` |
| **/training/ai-native/ai-native-foundations/** (11792) | "ai native foundations" pos 13 · "safe ai native" pos 14 | `AI-Native Foundations Certification — AI Upskilling for Teams` | `AI-Native Foundations certification: prompt engineering, AI ethics & daily AI workflows. No coding required. SPCT-led, live-virtual, exam included. View cohorts.` |
| **/training/adv-safe/aspc/** | "advanced safe practice consultant" pos 18.6 · "aspc certification" pos 22 | `Advanced SAFe Practice Consultant (ASPC) Certification` | `Advance from SPC to ASPC — lead large-scale, AI-native SAFe transformations. SPCT-led 4-day cohorts, exam included. View dates & enroll.` |
| **/training/adv-safe/spc/** | "safe practice consultant" pos 19.6 · "safe 6 spc" pos 12 | `Implementing SAFe® (SPC) Certification — SAFe 6 Practice Consultant` | `Become a SAFe® Practice Consultant (SPC) — train teams and launch Agile Release Trains. SPCT-led, SAFe 6.0, exam & pass support. View cohorts & register.` |

## B. Big-impression, deeper rank (bigger lift, huge upside)
| Page | Query / pos / impressions | New SEO Title | New Meta Description |
|---|---|---|---|
| **/training/safe/devops/** | "safe devops certification" pos 28 · **6,782 imp · 0 clicks** | `SAFe® DevOps (SDP) Certification — CALMR & CD Pipeline` | `SAFe® DevOps Practitioner (SDP) certification — build a continuous delivery pipeline with CALMR. SPCT-led, live-virtual, exam included. View cohorts & register.` |
| **/training/safe/popm/** | "popm certification" pos 28 · 941 imp | `SAFe® POPM Certification — Product Owner / Product Manager` | `SAFe® Product Owner/Product Manager (POPM) certification — SPCT-led, live-virtual, exam included. Build, prioritize & deliver value in a SAFe enterprise. View dates.` |
| **/training/adv-safe/lpm/** | "lean portfolio management training" pos 52 · **8,082 imp · 0 clicks** | `SAFe® Lean Portfolio Management (LPM) Certification Training` | `SAFe® LPM certification — Lean budgets, portfolio strategy & governance to connect strategy to execution. SPCT-led, exam included. View dates & enroll.` |

> Why titles matter most here: at pos 10–28 you're already *shown* thousands of times; a query-matched title + compelling meta lifts CTR immediately, and CTR is itself a ranking signal. DevOps + LPM alone are ~15,000 wasted impressions/quarter.

---

## C. Internal-linking plan (concentrate authority on the quick-win targets)
Your blog ranks page 1 (michelangelo pos 7, prompt-repetition pos 7.6, cognitive-debt pos 7.9, genai-use-cases pos 5.2, ais-impact pos 8.2). Pass that authority to the buried commercial pages via contextual links. **Concentrate on AI-Native Foundations (11792)** to push it from pos 13 → top 5.

| From (page-1 blog post) | → Link to | Anchor text |
|---|---|---|
| /prompt-repetition.../ | AI-Native Foundations | "learn prompt engineering formally in our AI-Native Foundations certification" |
| /the-evolution-of-genai-use-cases-2022-2025/ | AI-Native Foundations | "build these skills with AI-Native Foundations training" |
| /ais-impact-on-agile-roles/ | AI-Native Foundations + POPM/ASM | "upskill your Agile roles for AI" / relevant role cert |
| /collapse-of-attention-the-cognitive-debt-crisis/ | AI-Native Foundations | "an AI-native way of working" |
| /michelangelo-phenomenon/ (high traffic, off-topic) | soft footer link → AI-Native / Home | brand/related link for equity |

Also: **cross-link commercial pages to each other** ("Related certifications") and link the new **regional pages** → these cert pages. And **resolve the AI-Native Foundations duplicate** (`/wp-training/ai-native-foundations-certification-3/` → 301 to 11792) so authority isn't split.

## D. Sequence
1. Apply Section A titles/metas (4 pages) in AIOSEO — fastest CTR lift.
2. Execute Section C internal links (MCP — append CTA blocks to the 4–5 posts).
3. Apply Section B titles/metas.
4. 301 the AI-Native Foundations duplicate; consolidate SPC pages.
5. Re-check GSC in 2–3 weeks for position/CTR movement.

---

## HOW TO APPLY SECTIONS A & B IN AIOSEO (step-by-step)
_Titles/metas can't be written via MCP (AIOSEO owns them). Do this per page — ~2 min each._

For EACH page in Sections A & B:
1. **wp-admin → Pages** → search the page (e.g. "Advance Scrum Master" for `/training/safe/asm/`) → **Edit**.
2. In the editor, find the **AIOSEO Settings** box **below the content area** (scroll down). If you don't see it, click the **AIOSEO** button in the editor's top toolbar (the AIOSEO logo) to open the sidebar.
3. Click the **General** tab → you'll see a **Snippet Preview** with a **Search Appearance / Edit Snippet** section.
4. **Post Title field:** delete what's there and paste the new SEO Title from the table above. (If AIOSEO shows smart-tags like `#separator_sa #site_title`, you can leave the separator/site-title tags at the end and put your title before them — or replace fully; just keep it ≤60 chars. The preview bar turns green when length is good.)
5. **Meta Description field:** paste the new meta description (≤155 chars; preview bar green).
6. Click **Update** (top right) to save the page.
7. Repeat for all 7 pages (Section A first: ASM, AI-Native Foundations, ASPC, SPC; then Section B: DevOps, POPM, LPM).
8. **Speed up re-indexing:** Google **Search Console → URL Inspection** → paste each updated URL → **Request Indexing**. (Bing auto-picks up via your IndexNow plugin.)

Tip: AIOSEO Pro also has **Quick Edit** SEO fields in the Pages list (hover a page → Quick Edit) — faster if available on your plan.

## INTERNAL LINKS — paste-safe snippet (for the 2 large posts)
The `ais-impact-on-agile-roles` post (~20K) and `collapse-of-attention-the-cognitive-debt-crisis` are too large to safely re-send via MCP. Add this at the **end** of each (Classic editor: switch to **Text/HTML** view and paste at the bottom; or add a **Custom HTML** block):

```html
<div style="margin:36px 0;padding:24px 26px;border-radius:14px;background:linear-gradient(135deg,#053947,#0170B9);color:#fff">
<p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#fbbf24">Build the capability</p>
<p style="margin:0 0 14px;font-size:18px;font-weight:800;color:#fff">Upskill your team for an AI-native way of working.</p>
<p style="margin:0 0 16px;color:#cbd5e1;font-size:14px;line-height:1.55">Our <strong>AI-Native Foundations</strong> certification covers prompt engineering, AI ethics, and embedding AI into daily workflows. No coding required. SPCT-led, live-virtual, exam included.</p>
<a href="https://agile-agilist.com/training/ai-native/ai-native-foundations/" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:13px 24px;border-radius:8px;text-decoration:none;font-size:15px">Explore AI-Native Foundations →</a>
</div>
```

### Internal links — status
- ✅ Live: prompt-repetition (18665), evolution-of-genai-use-cases (1755)
- ⏳ Paste-safe (you add): ais-impact-on-agile-roles (1724), collapse-of-attention-cognitive-debt
