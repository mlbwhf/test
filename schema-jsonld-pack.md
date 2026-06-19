# Schema (JSON-LD) Pack — paste into AIOSEO
_AIOSEO isn't MCP-writable, so apply each per page: **wp-admin → edit page → AIOSEO → Schema → Add Schema → Custom (JSON)** (or use a header-injection/WPCode "site-wide header" snippet scoped by URL). Pairs with the titles/metas in `gsc-quickwin-optimization-pack.md`._

> Google validates these at search.google.com/test/rich-results. `Course` needs `name` + `description` + `provider`. I've kept them minimal-valid (no fake price/rating). Add `hasCourseInstance`/`offers` only when real dates & prices exist (template at bottom).

## Provider (same on every agile-agilist course)
```json
"provider": { "@type": "Organization", "name": "Agile Agilist", "sameAs": "https://agile-agilist.com" }
```

---
## agile-agilist.com — Course schema per page

### /training/safe/asm/
```json
{"@context":"https://schema.org","@type":"Course","name":"SAFe® Advanced Scrum Master (ASM) Certification","description":"SAFe® Advanced Scrum Master (SASM) certification — taught by an Authorised SAFe Instructor (SPC/ASPC), live-virtual, exam included. Lead high-performing Agile teams in a SAFe enterprise.","url":"https://agile-agilist.com/training/safe/asm/","provider":{"@type":"Organization","name":"Agile Agilist","sameAs":"https://agile-agilist.com"}}
```
### /training/ai-native/ai-native-foundations/
```json
{"@context":"https://schema.org","@type":"Course","name":"AI-Native Foundations Certification","description":"AI-Native Foundations certification: prompt engineering, AI ethics and daily AI workflows. No coding required. Taught by an Authorised SAFe Instructor (SPC/ASPC), live-virtual, exam included.","url":"https://agile-agilist.com/training/ai-native/ai-native-foundations/","provider":{"@type":"Organization","name":"Agile Agilist","sameAs":"https://agile-agilist.com"}}
```
### /training/adv-safe/aspc/
```json
{"@context":"https://schema.org","@type":"Course","name":"Advanced SAFe Practice Consultant (ASPC) Certification","description":"Advance from SPC to ASPC — lead large-scale, AI-native SAFe transformations. SPCT-led 4-day cohorts, exam included.","url":"https://agile-agilist.com/training/adv-safe/aspc/","provider":{"@type":"Organization","name":"Agile Agilist","sameAs":"https://agile-agilist.com"}}
```
### /training/adv-safe/spc/  (canonical SPC)
```json
{"@context":"https://schema.org","@type":"Course","name":"Implementing SAFe® (SPC) Certification — SAFe 6 Practice Consultant","description":"Become a SAFe® Practice Consultant (SPC) — train teams and launch Agile Release Trains. SPCT-led, SAFe 6.0, exam & pass support.","url":"https://agile-agilist.com/training/adv-safe/spc/","provider":{"@type":"Organization","name":"Agile Agilist","sameAs":"https://agile-agilist.com"}}
```
### /training/safe/devops/
```json
{"@context":"https://schema.org","@type":"Course","name":"SAFe® DevOps (SDP) Certification","description":"SAFe® DevOps Practitioner (SDP) certification — build a continuous delivery pipeline with CALMR. Taught by an Authorised SAFe Instructor (SPC/ASPC), live-virtual, exam included.","url":"https://agile-agilist.com/training/safe/devops/","provider":{"@type":"Organization","name":"Agile Agilist","sameAs":"https://agile-agilist.com"}}
```
### /training/safe/popm/
```json
{"@context":"https://schema.org","@type":"Course","name":"SAFe® Product Owner / Product Manager (POPM) Certification","description":"SAFe® POPM certification — taught by an Authorised SAFe Instructor (SPC/ASPC), live-virtual, exam included. Build, prioritize and deliver value in a SAFe enterprise.","url":"https://agile-agilist.com/training/safe/popm/","provider":{"@type":"Organization","name":"Agile Agilist","sameAs":"https://agile-agilist.com"}}
```
### /training/adv-safe/lpm/
```json
{"@context":"https://schema.org","@type":"Course","name":"SAFe® Lean Portfolio Management (LPM) Certification","description":"SAFe® LPM certification — Lean budgets, portfolio strategy and governance to connect strategy to execution. Taught by an Authorised SAFe Instructor (SPC/ASPC), exam included.","url":"https://agile-agilist.com/training/adv-safe/lpm/","provider":{"@type":"Organization","name":"Agile Agilist","sameAs":"https://agile-agilist.com"}}
```
### /training/safe/sa/  (Leading SAFe — has real price + cohorts → richest schema)
```json
{"@context":"https://schema.org","@type":"Course","name":"Leading SAFe® (SAFe Agilist) Certification","description":"Leading SAFe® / SAFe Agilist certification — SPCT-led, live-virtual, exam included, pass guarantee.","url":"https://agile-agilist.com/training/safe/sa/","provider":{"@type":"Organization","name":"Agile Agilist","sameAs":"https://agile-agilist.com"},"offers":{"@type":"Offer","category":"Paid","price":"850","priceCurrency":"USD","url":"https://agile-agilist.com/training/safe/sa/"}}
```

---
## report-ai.org — /diagnostic/ (WebPage + the tool)
```json
{"@context":"https://schema.org","@type":"WebPage","name":"Enterprise AI Readiness Diagnostic","url":"https://report-ai.org/diagnostic/","description":"Free 2-minute self-assessment that baselines enterprise AI readiness across six dimensions and benchmarks against the AI-Native Maturity Model.","isPartOf":{"@type":"WebSite","name":"Report AI","url":"https://report-ai.org"},"publisher":{"@type":"Organization","name":"Report AI","sameAs":"https://report-ai.org"}}
```

---
## CourseInstance template (add to any course once dates/price are firm)
```json
"hasCourseInstance":[{
  "@type":"CourseInstance",
  "courseMode":"online",
  "courseWorkload":"P2D",
  "startDate":"2026-07-09",
  "endDate":"2026-07-10",
  "location":{"@type":"VirtualLocation","url":"https://agile-agilist.com/training/safe/sa/"},
  "offers":{"@type":"Offer","price":"850","priceCurrency":"USD","availability":"https://schema.org/InStock"}
}]
```

## Order of work
1. Apply the **titles/metas** (Sections A→B of the GSC pack).
2. Paste the **Course schema** above into each page's AIOSEO → Schema → Custom.
3. Validate 2–3 in the Rich Results Test.
4. Request indexing in GSC for the updated URLs.
