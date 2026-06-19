# Translate the ENTIRE site — runbook (Polylang Pro + DeepL)
_Goal: ES / FR / AR across all ~170 pages/posts of agile-agilist.com, **without /en/ on the root** and without disrupting ads. Hand-crafting every page isn't feasible (and the 120 KB cert pages can't be cloned via MCP) — the entire-site path is **Polylang Pro + DeepL**._

## Why a plugin (not hand-built pages)
- ~170 items × 3 languages = 500+ pages. Bulk machine translation + human review is the only sustainable way.
- The cert pages (ASM/SPC/ASPC/LPM/APM/RTE, /sa/) are 110–120 KB **classic/freeform** — MCP can't safely round-trip them, but **Polylang+DeepL translates them in place** (it duplicates the post and DeepL fills the translation). This is the one method that covers the heavy pages too.

## Order of operations (protects ads + root URLs)
1. **Polylang Pro** license + **DeepL API key** (free tier = 500k chars/mo; Pro for higher volume).
2. **Languages → Settings → URL modifications:**
   - **"Hide URL language information for default language" = ON** ← keeps English at current URLs, **no /en/**.
   - English = **default**.
   - (Pro) **Translate slugs** ON → `/es/…` gets Spanish slugs.
3. **Test on staging first** (SiteGround → create staging copy). Validate URLs + ads land correctly before the live site changes. Given today's /en/ incident, do not skip staging.
4. **Bulk translate with DeepL:** Polylang Pro → each post/page shows a **"Translate with DeepL"** action (and batch options) → generates ES/FR/AR **drafts** automatically.
5. **Review before publishing:**
   - **Commercial pages:** use the **human-crafted drafts I built** (Leading SAFe, SPC, + the ones I'll add) instead of the machine output — better conversion copy.
   - **Arabic:** native-speaker proof (idiom + RTL). DeepL Arabic is decent but needs a human pass.
   - **Trademarks stay English:** SAFe®, Leading SAFe®, SPC, ASPC, RTE, SPCT, AI-Native.
   - **Instructor terminology:** SPCT only for SPC/ASPC/RTE; everything else "Authorised SAFe Instructor (SPC/ASPC)." DeepL won't know this — fix in review.
6. **UI strings:** Polylang → **Strings translations** → paste from `agile-agilist-translation-priority-pack.md` (buttons/labels).
7. **hreflang:** Polylang outputs it automatically (en/es/fr/ar + x-default) once languages exist + the URL setting is on.
8. **Publish per language**, then submit **per-language sitemaps** in GSC.

## Division of labour
| Layer | Who | How |
|---|---|---|
| Top commercial pages (Leading SAFe, SPC, AI-Native, POPM, ASM, regional) | **Me** | Hand-crafted quality drafts (Leading SAFe ✅, SPC ✅; more on request) |
| Everything else (blog ×120, secondary pages) | **DeepL** | Bulk auto-translate → review |
| Arabic everywhere | **Native reviewer** | Proof before publish |
| QA / terminology / trademark | **Me** | I review the machine output |

## Cost (rough)
- Polylang Pro ≈ $99/yr (adds DeepL + translated slugs).
- DeepL API: free up to 500k chars/mo; Pro plan if the whole site exceeds that in a month.

## Guardrails (from today's lessons)
- **Hide /en/ FIRST**, English default — before adding languages, so the root never gets prefixed.
- **Staging first** — the live site drives paid ads; validate there.
- Keep translations **draft** until reviewed; publish in batches.
- Don't change any **existing English slug**.

## What I'll keep doing now (hand-crafted commercial drafts, all draft)
- ✅ Leading SAFe (ES 27116 / FR 27121 / AR 27122)
- ✅ SPC (ES 27124 / FR 27125 / AR 27126)
- ⏭️ Next: AI-Native, POPM, ASM, + the regional landing pages — say the word and I'll build them in ES/FR/AR.
