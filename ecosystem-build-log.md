# Ecosystem Build Log — report-ai.org & implementingsafe.org
_Updated 2026-06-09. All DRAFTS unless noted._

## report-ai.org (blog_id 255349241, WordPress/Jetpack, MCP ✅)
| Page | ID | Slug | Status | Preview |
|---|---|---|---|---|
| AI-Native Organization Certification | 411 | `/ai-native-certification/` | draft | `report-ai.org/?page_id=411&preview=true` |

**Still to wire on report-ai.org (handover — files in `report-ai/`):**
- `llms.txt` → upload to site root (`report-ai.org/llms.txt`). Can't be done via MCP (root file, not a page).
- Course JSON-LD + ecosystem Organization schema → add via SEO plugin / header (WP strips `<script>` from page content). Source: `report-ai/ecosystem-organization-schema.jsonld`.
- `/diagnostic/` page → the hero CTA points here; needs creating.
- Fill any benchmark stats with REAL primary data (no fabricated numbers).

## implementingsafe.org (blog_id 233382411, WordPress/Jetpack, MCP ✅)
Role: **the OFFICIAL SAFe framework explained** (partner education) — distinct from implementing-safe.com (proprietary 5-D model).
| Page | ID | Slug | Status |
|---|---|---|---|
| Homepage — Official Framework Explained | 7 | `/implementing-safe-framework-explained/` | draft |
| The SAFe Implementation Roadmap, Explained | 5 | `/safe-implementation-roadmap-explained/` | draft |
| SAFe Configurations, Explained | 6 | `/safe-configurations-explained/` | draft |

**Guardrails applied:** original wording only (no reproduction of framework.scaledagile.com), trademark attribution on every page, "not official" disclaimer, nofollow on commercial cross-links.

**Next on implementingsafe.org (if approved):** Roles & ARTs explainer, SAFe Glossary (high-volume informational). Set homepage (page 7) as the static front page on publish.

**Open decisions:**
- scaledagile101.com must NOT also be a SAFe-explainer (would cannibalize implementingsafe.org) — redirect it here or give it a different angle.
- Confirm domain-name use is OK under the Gold Partner agreement before publishing implementingsafe.org publicly (user: owned 2 yrs, no issue — proceeding on their call).
