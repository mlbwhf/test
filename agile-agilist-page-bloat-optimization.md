# Large Pages — Measured Sizes + Optimization Plan
_Measured live via WPCOM MCP on 2026-06-01. Subject: the 5 adv-safe course pages, all ~120 KB each (within 700 bytes of one another → shared boilerplate, not unique content)._

## Live raw sizes (Gutenberg editor content)
| Page | ID | Raw content |
|---|---|---|
| ASPC | 1835 | **120,299 B (~117 KB)** ← analyzed in depth |
| SPC | 1914 | **120,723 B (~118 KB)** |
| APM | 3605 | **120,061 B (~117 KB)** |
| LPM | 1928 | **120,294 B (~117 KB)** |
| RTE | 1917 | **120,162 B (~117 KB)** |

## Byte composition (ASPC sample, representative)
| Category | Bytes | % | Count |
|---|---:|---:|---:|
| Total content | 112,268 | 100% | — |
| **HTML comments (all)** | **62,687** | **56%** | 442 |
| → Gutenberg `wp:` block comments | 62,558 | 55.7% | 440 |
| → **JSON attributes inside those comments** | **52,962** | **47%** | 161 |
| Inline `<svg>` markup | 7,725 | 6.9% | 11 |
| Inline `style="…"` attributes | 7,206 | 6.4% | 126 |
| `<style>` blocks | 2,113 | 1.9% | 2 |
| `data:`/base64 | 0 | 0% | 0 |
| HTML elements (open tags) | — | — | 377 (137 div) |
| Max div nesting depth | — | — | 10 |

**Headline:** ~47% of each page is **JSON config stuffed into Gutenberg block comments** — not visible content, not even CSS.

## What's actually eating the bytes
1. **EssentialBlocks "CSS-in-attribute" blobs** — `eb-advanced-tabs` (6.2 KB) + `eb-button-group` (5.1 KB) store generated CSS *inside* the block's JSON attribute (desktop/tablet/mobile rule sets).
2. **UAGB icon-list trust badges (×7)** — each carries a full 1.5 KB WordPress media object (filename, URL, **session nonces**, dateFormatted, mime, author…) for one tiny icon. ~3,350 B each ≈ **23 KB**.
3. **Repeated card/group "border-radius" units (×12–14)** — same JSON+inline-style pattern duplicated ≈ **19 KB**.
4. **Inline SVG icons (×11)** — 7.7 KB of FontAwesome-style paths inlined into markup.
5. **Repeated inline styles** — e.g. `style="border-width:1px;border-radius:10px;padding:24px…"` appears **12×**; `style="font-size:14px"` **12×**; `style="font-size:34px;font-weight:700;line-height:1.2"` **7×**.

## Prioritized optimization plan

| P | Action | Savings/page | Why |
|---|---|---|---|
| **P1** | Replace EssentialBlocks tabs/buttons with core Tabs/Buttons + theme-stylesheet CSS | **~11 KB** | Removes 11 KB of generated CSS stored in post JSON; also fixes render-blocking inline CSS |
| **P2** | Strip embedded media objects from UAGB icon-list badges; reference media by ID only (`url`, `id`, `alt`, `label`, `icon`) | **~12–19 KB** | Per-badge blob shrinks ~3,350 B → ~600 B. **Also removes stale session nonces that should never be persisted in content.** |
| **P3** | Move repeated inline styles + `.trust-bridge-grid` `<style>` into theme stylesheet (define `.aspc-card`, etc.) | **~6–8 KB per page × every sibling course page** | Biggest cumulative win site-wide; improves editability + CLS |
| **P4** | Convert the 12–14 card cluster into a **synced Pattern** | Edit-ability + future-page shrink | One source of truth; pages reference it |
| **P5** | Externalize the 11 inline SVG icons → icon font / sprite / `<img>` | **~5–7 KB** | Browser can cache icons across pages |
| P6 | Leave the 2 small `<style>` blocks + the bare `<!-- /wp:… -->` closers (~9.6 KB, structurally required) | 0 | Not worth touching |

### Projected outcome
P1 + P2 + P3 together: each page drops from **~117 KB → ~65–75 KB** (35–45% reduction). P3 compounds across every course page sharing the card/badge design — likely the biggest cumulative site-wide win.

### Side benefits
- **Stale nonces** in the UAGB media blobs (P2) are session tokens that should never live in content — fix regardless of size.
- Editor performance improves once it doesn't have to parse ~53 KB of JSON attributes per load.
- Once pages are <80 KB, they become **safely MCP-editable** (current 120 KB exceeds the per-result token cap; only `include_fields` slicing works today).

## Suggested execution order
1. **P2 first** — pure data cleanup, no design change, biggest single win + security cleanup (nonces).
2. **P3** — move shared styles to theme; touch one page to validate, then ripple to siblings.
3. **P1** — swap EssentialBlocks tabs/buttons (verify visual parity in Visual editor).
4. **P5** — externalize SVGs (asset-level change).
5. **P4** — convert card cluster to synced Pattern as the new authoring primitive going forward.

Do P2 + P3 on **one page first** (recommend ASPC = 1835), verify visually, then propagate.
