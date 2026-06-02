# Translation Plan — ES / AR / FR + Plugin Recommendation
_Site: agile-agilist.com (WP.com Jetpack/Atomic, plugins allowed). Source EN → Spanish, Arabic (RTL), French. ~120 posts + ~50 pages = ~170 items. Priority: economical + SEO-correct._

## Current state (from live read)
- A multilingual plugin is **scaffolded but unused**: auto-created default categories `Sin categoría` (id 104, es) and `غير مصنف` (id 103, ar) exist with **count 0**. No FR stub yet, no translated content.
- **Do not delete 103/104** until the plugin choice is locked — they may be language defaults.

## Recommendation: **Polylang Pro** (#1 value pick)

| Rank | Plugin | Year 1 | Renewal/yr | Verdict |
|---|---|---|---|---|
| **#1** | **Polylang Pro** | ~$107 (€99) | ~$54 (50%) | Cheapest sustainable SEO-correct option. No word/item caps. You own translations (DB-stored). Built-in DeepL (free 500k chars/mo tier). |
| #2 | **TranslatePress Business** | ~$172 (€159) | €159 | Best UX — live visual RTL editor (easiest for Arabic), 200k AI words bundled, SEO Pack. Pick this if a non-tech person edits AR. |
| ok | WPML CMS | ~$107 | ~$64 | Most powerful, overkill for a blog; renewal pricier than Polylang. |
| avoid (cost) | Weglot Business | ~$300/yr | $300/yr forever | SaaS, word-cap risk, never own translations. |
| avoid (SEO) | GTranslate | $180–300/yr | forever | Free/cheap tier is **client-side JS — not indexed**; real SEO only at Business tier; rental model. |

### Why Polylang Pro
- Lowest lifetime cost (~$54/yr after year 1) vs $172–300/yr recurring SaaS.
- **You own the translations** — canceling the license keeps the site working (translations stay live).
- No caps for 170 items × 3 languages.
- **Free MT bootstrap** via DeepL free API (500k chars/mo), then hand-polish Arabic.
- SEO-correct: translated slugs, auto hreflang, indexable per-language pages (`/es/ /ar/ /fr/`), AIOSEO-compatible.

> Choose **TranslatePress Business** instead only if you want the easier live visual RTL editor for hand-editing Arabic — worth the ~$65/yr premium.

## hreflang & slug must-haves (non-negotiable)
1. **Server-side indexable pages** per language (rules out GTranslate free/cheap).
2. **hreflang** for en/es/ar/fr + x-default on every page.
3. **Translated slugs** (`/es/agilidad/` not `/es/agility/`) — needs Polylang **Pro** / TranslatePress **SEO Pack** / WPML CMS.
4. **Translated SEO meta** (title/description) — AIOSEO-integrated in all three top picks.
5. **Arabic:** confirm the Astra theme ships `rtl.css` so AR locale auto-flips layout (true for server-side plugins).

## Cleanup + rollout order
1. **Buy & install Polylang Pro** (or TranslatePress Business).
2. Define languages: EN (default) + ES + AR + FR. Let the plugin create/own the per-language default categories — **then** safely remove the orphan stubs 103/104 if the plugin doesn't adopt them.
3. **First do the English category cleanup** (see agile-agilist-blog-consolidation-design.md: empty Uncategorized, dedupe) — translate the *clean* taxonomy, not the mess.
4. Seed translations with DeepL MT (EN→ES/FR easy; AR needs human review).
5. **Hand-polish Arabic** (RTL + idiom).
6. Verify hreflang + translated slugs render; submit per-language sitemaps.

> Note: this is a paid-plugin purchase + setup — outside what the WPCOM MCP can do. Deliverable here is the decision + rollout plan; purchase/install is a manual step.
