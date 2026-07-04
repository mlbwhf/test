# Agile Agilist — AI-visibility runbook

Mapped 1-to-1 against the five-phase plan. Every item is tagged
**[SHIPPED]** (in this repo, ready to deploy), **[OPS]** (needs you or
an agency with real accounts), or **[DATA]** (needs your data, then I
can wire it).

Files referenced live under `seo/` unless noted otherwise. Grep to
find:
```
grep -rn "TODO(deploy)" seo/
```

---

## Phase 1 — Make sure AI can read you (this week)

### 1.1 robots.txt + Cloudflare AI-bot check
- **[SHIPPED]** Clean `seo/robots.txt` with explicit allow for GPTBot,
  OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended,
  Applebot-Extended, CCBot, Bytespider, and every other current AI
  crawler. Overwrite the live `robots.txt` and re-verify in Search
  Console + Bing Webmaster Tools' robots.txt tester.
- **[OPS]** Cloudflare: dashboard → Security → Bots → **switch
  "Block AI crawlers" OFF**. This is on by default as of 2024; it's
  the single biggest cause of "why can't Claude see me?" complaints.
  Do the same for any WAF rule that blocks user-agents by regex.
- **[OPS]** Hostinger: verify no server-level rule in
  `.htaccess` or nginx conf blocks the same bots. Ask support if unsure.
- **[OPS]** Confirm visits in the last 30 days:
  ```
  cat access.log | grep -iE 'gptbot|oai-searchbot|claudebot|perplexitybot|chatgpt-user|google-extended' | wc -l
  ```
  If zero, one of the three above rules is still blocking.

### 1.2 Bing Webmaster Tools + IndexNow
- **[OPS]** bing.com/webmasters → Add site → verify via meta tag or
  DNS. ChatGPT retrieves primarily via Bing; treat this as important
  as Google Search Console.
- **[OPS]** Enable **IndexNow** in the same panel. AIOSEO has a
  built-in IndexNow toggle — turn it on so every publish pings Bing.
- **[OPS]** Submit `sitemap.xml` in Bing WMT. Re-submit after every
  batch of published pages.

### 1.3 Last-audit fixes (leaked pages, AI-Native slug dupe, blog URL split)
- **[DATA]** I don't have the audit list. Export from
  `wp-admin → Tools → Redirection → 404s` (CSV) and Search Console →
  Pages → "Not indexed" → export CSV. Paste back and I'll generate
  the 301 map — one commit, done.
- Reference: existing `agile-agilist-strategic-optimization-plan.md`
  already flagged the SPC 4-title cannibalisation. That's a canonical
  fix — pick one URL per language, 301 the rest.

### 1.4 Sitewide JSON-LD schema
- **[SHIPPED]** `seo/aa-jsonld-sitewide-snippet.php` — one WPCode
  snippet emits the right JSON-LD per URL: Organization + WebSite on
  every page, Course on every mapped course URL, LocalBusiness on
  `/locations/{city}/` hubs, FAQPage on any page that has an
  `aa_faq_jsonld` custom field.
- Beats per-page paste (the pattern in
  `schema-jsonld-pack.md`) because it doesn't rot when editors add new
  pages. Editing course dates once (in the `$AA_COURSES` array in the
  snippet) updates every course page's schema.
- **[OPS]** Deploy: WPCode → Add New → **PHP Snippet** → paste →
  Location "Site Wide Header" → Save + Activate.
- **[OPS]** Validate each covered URL at
  search.google.com/test/rich-results after activation.

---

## Phase 2 — Own your entity (weeks 2–4)

### 2.1 Uncopyable claim page
- **[SHIPPED]** `seo/ai-native-canada-landing.html` — a
  self-contained page with the H1 stated plainly:
  *"Agile Agilist is the only certified face-to-face AI-Native
  instructor in Canada."* Three verifiable proofs, canonical wording
  block, AboutPage + Person JSON-LD.
- **[OPS]** Publish at `/ai-native-canada/`. Add to primary nav.

### 2.2 Canonical wording — repeated verbatim, everywhere
The claim page has a "canonical wording" box. Paste that same
sentence, unchanged, on:

- **[OPS]** `/about/` — first paragraph under "The Practice"
- **[OPS]** LinkedIn company page → About
- **[OPS]** LinkedIn instructor personal profile → About
- **[OPS]** Scaled Agile partner directory listing bio
- **[OPS]** Google Business Profile → Business description

**Consistency is the point.** Rephrasing it "for variety" fragments what
LLMs learn about your entity.

### 2.3 NAP + entity data consistency
- **[OPS]** Fields to make identical across every profile
  (site footer, three Google Business Profiles, LinkedIn, Eventbrite,
  Corsizio, Scaled Agile directory):

| Field | Canonical value |
|---|---|
| Legal name | Agile Agilist Inc. |
| Trading name | Agile Agilist |
| Website | https://agile-agilist.com |
| Phone | [fill] |
| Email | hello@agile-agilist.com |
| Description | *(canonical wording from claim page)* |
| Categories | Certification body · Training centre · Business consultant |

Any variance (e.g. "Agile-Agilist Inc" vs "Agile Agilist Inc.")
splits the entity in the LLM's mental model. Audit with a spreadsheet.

### 2.4 Hard numbers in crawlable HTML
- **[OPS]** Homepage — replace any sliders or images that contain
  "3,000+ students / 248+ classes / IBM • EY • Bombardier •
  US Air Force" with **plain HTML text** (headings + paragraphs).
  Screenshots and Divi sliders don't get indexed for text.
- **[OPS]** Same for the About page. The existing
  `homepage.fixed.html` in this repo has a marquee logo strip — keep
  it but back it with a `<div>` of plain-text client names that's
  visually hidden with `.sr-only`. Screenreaders and LLMs read it;
  humans see the marquee.

---

## Phase 3 — Content built for citation

### 3.1 Answer-first course-page restructure
- **[SHIPPED]** `seo/course-page-answer-first-pattern.md` — the
  pattern documented, plus a full worked example for
  `/training/safe/sa/` (Leading SAFe) covering the seven canonical
  buyer questions in question-form H2s + 40–100 word direct answers.
  Also ships the FAQPage post-meta JSON the sitewide schema snippet
  automatically emits.
- **[OPS]** Priority order for applying the pattern (from the
  existing strategic plan): SA → SPC → AI-Native Foundations → ASPC
  → RTE → rest.

### 3.2 Original data — "State of SAFe Training in Canada 2026"
- **[DATA]** I can build the report shell once you send the raw
  data: pass rates by cert, alumni salary outcomes, demand by city
  (from your GA4 city breakdown — that dataset is already partially
  in `agile-agilist-strategic-optimization-plan.md` section 6).
- Ship as `/state-of-safe-canada-2026/` with an executive summary,
  6–8 charts, a downloadable PDF, and a JSON-LD `Report` node.
  LLMs treat annual named reports as canonical citations.
- **[OPS]** Announce with a LinkedIn post + one-time cross-post to
  r/agile and r/scrum (see Phase 4). Repeat annually.

### 3.3 Content refresh cadence
- **[OPS]** Thursday blog cadence already exists — extend to
  course pages **quarterly**: bump the "Updated on YYYY-MM-DD" line
  at the top of each course page + a 3–5 sentence "What's new this
  quarter" block. LLMs prioritize fresh content.

---

## Phase 4 — Off-site (highest impact, most skipped)

### 4.1 Community mentions
- **[OPS]** Set up profiles under a real name on
  r/agile, r/scrum, r/AgilePM, Quora. Answer questions genuinely for
  two months without pitching. Then in month three, cite Agile
  Agilist where it's truly the right answer.
- **[OPS]** Rule: never link-drop. LLMs devalue that pattern and
  moderators kill it. Answer the question in full, mention Agile
  Agilist as the resource once, done.

### 4.2 Third-party roundups + podcasts
- **[OPS]** Target list — request inclusion in the next update:
  - CIO.com "best SAFe certification providers"
  - IIBA "top Agile trainers Canada"
  - Capterra / G2 SAFe training category
  - Scrum Master Toolbox Podcast (guest)
  - Agile Uprising Podcast (guest)
  - The Agile Coach Podcast (guest)
- Third-party authority is what actually moves LLM citations; llms.txt,
  question-headings and FAQ sprinkling alone move very little.

---

## Phase 5 — Measure monthly

### 5.1 GA4 AI-referrer segments
- **[OPS]** GA4 → Explorations → new Free-form report:
  - Dimension: **Session source / medium**
  - Filter: source contains any of `chatgpt.com`, `perplexity.ai`,
    `gemini.google.com`, `claude.ai`, `bing.com/chat`, `chat.openai.com`
  - Metric: Sessions, Engaged sessions, Conversions
- Save as "AI referrers". Watch monthly delta.

### 5.2 Monthly prompt panel
- **[OPS]** Fixed panel of 10 buyer questions:
  1. "best SAFe training in Canada"
  2. "where to get AI-Native certified in Canada"
  3. "SPC certification Toronto"
  4. "how much does Leading SAFe cost in Canada"
  5. "SAFe Gold Partner Canada"
  6. "certified face-to-face AI-Native instructor Canada"
  7. "Agile Agilist review"
  8. "best SAFe RTE certification"
  9. "SPC vs ASPC which one"
  10. "SAFe Gold Partner vs Scaled Agile"
- Run each in ChatGPT, Claude, Perplexity, Gemini, Bing Chat on the
  1st of every month. Score: **mention rate** (0/5 → 5/5) per prompt.
  Log in a spreadsheet. That's the real KPI.

---

## Deploy order (compressed)

```
Week 1
├── [SHIPPED] Push seo/robots.txt → live
├── [OPS]     Cloudflare AI-bot allow
├── [OPS]     Bing WMT + IndexNow on
├── [SHIPPED] Deploy aa-jsonld-sitewide-snippet.php via WPCode
└── [OPS]     Verify with search.google.com/test/rich-results

Week 2
├── [SHIPPED] Publish /ai-native-canada/ from the landing HTML
├── [OPS]     Update About, LinkedIn, GBP, SAI directory with canonical wording
└── [OPS]     NAP consistency spreadsheet

Weeks 3–4
├── [SHIPPED] Apply answer-first pattern to SA course page (worked example ready)
├── [OPS]     Then SPC → AI-Native Foundations → ASPC → RTE → rest
└── [OPS]     Set aa_faq_jsonld post-meta on each restructured page

Month 2
├── [DATA]    Send data → I'll build /state-of-safe-canada-2026/
├── [OPS]     Podcast outreach + community profile warm-up
└── [OPS]     Set up GA4 AI-referrer segment + first prompt panel

Ongoing
└── [OPS]     Monthly prompt panel + GA4 review
```

---

## What I'd re-check quarterly

- New AI-crawler user-agents appear every few months
  (`Applebot-Extended` is recent). Update `robots.txt` when they land.
- Cloudflare defaults change silently. Recheck the AI-bot toggle each quarter.
- Schema.org's Course type gets extended occasionally. Re-run the
  rich-results test on one course URL each quarter.
- Prompt panel: rotate two of the ten prompts every quarter so the
  panel keeps pace with how buyers actually phrase questions.
