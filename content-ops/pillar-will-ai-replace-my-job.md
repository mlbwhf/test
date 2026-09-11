# Pillar: Will AI Replace My Job?

Built 11 September 2026. **All pages are DRAFT — a human sets published.**

The full HTML lives in WordPress (it is long and duplicating it here would drift
out of sync). This file is the structural record: what exists, where it sits,
what each page claims, and what still needs doing.

---

## Structure

```
/indexes/workforce-labor/                         page 395  (existing, published)
└── will-ai-replace-my-job/                       page 2297 PILLAR    ⬅ draft
    ├── customer-support/                         page 2298 cluster   ⬅ draft
    ├── software-developers/                      page 2299 cluster   ⬅ draft
    └── by-occupation/                            page 2300 cluster   ⬅ draft

/reports/ai-replacement-reversal-2026/            page 2293 deep-dive ⬅ draft
    (kept under /reports/ deliberately — it is a report, not a job-family page.
     The pillar links to it as the evidence base. Move it under the pillar only
     if we want URL nesting to mirror topical nesting.)
```

## On "one category"

These are **pages**, and WordPress categories only attach to posts — so a category
term would not have applied to them. The pillar *is* the category in this site's
architecture, which is how `/indexes/` and `/reports/dark-side-of-ai/` already work.
If we also want a post category for future news items on this topic, that is a
separate one-line job.

## What each page carries

| Page | Spine of the argument | Strongest figures |
|---|---|---|
| **2297 Pillar** | Tasks get automated, not jobs. Exposure is wildly uneven, and a large share of replacement decisions are being undone. | WEF +78M net by 2030 · AI = #1 stated layoff reason Mar 2026 (25% of cuts) · 55% employer regret · ~50% of AI layoffs forecast to reverse |
| **2298 Customer support** | AI handles volume well and complexity badly; full replacement has failed everywhere attempted publicly. | Median tier-1 deflection **41.2%** (not the 70–90% advertised) · nuanced complaints <25% · CSAT 4.10 vs 4.30 · re-contact 11.3% vs 8.7% · hybrid 89% vs pure AI 74% · only 20% of leaders actually cut; 95% keeping humans |
| **2299 Developers** | Generation worked; verification became the constraint. The job inverted rather than vanished. | Review 11.4h/wk vs writing 9.8h · PR review time **+441%** · bugs/PR +54% · **+31% merged unreviewed** · GitClear copy-paste 9.4%→15.7%, refactor 21%→3.8% · entry-level postings −67% · 94% of teams don't measure the cost |
| **2300 By occupation** | Production is absorbed; judgement, exceptions and liability survive. Task share ≠ headcount loss. | Translators **98%+** · office/admin **46%** task share · legal 44%, paralegals ~80% · freelance writing −33% · bookkeeping −35–50% by 2028 · HR 30–40% (but IBM *tripled* entry-level hiring) |

## Editorial decisions worth keeping

1. **The thesis is "replacement was mispriced," not "AI doesn't work."** IBM kept the
   94% it automated; Klarna's AI is doing *more* work in 2026 than 2024 (853 FTE
   equivalent, $60M projected). Overstating this would be easy and wrong.
2. **Every page states its own limits.** Exposure percentages come from different
   methodologies and are presented as a ranking, not a forecast. Layoff attribution
   is employer-stated and flagged as a ceiling — "AI" is a more palatable public
   reason than weak demand.
3. **The recurring finding across all three clusters is the same shape:** what
   survives is judgement under ambiguity, exception handling and personal liability.
   That is the pillar's actual argument.
4. **The pipeline problem appears twice by different routes** — support loses the
   entry-level roles that produce escalation specialists; engineering loses the
   juniors that produce reviewers. Worth a dedicated page later.

## Before publishing

- [ ] **Verify the MEDIUM figures at source.** Most were gathered via search-engine
      summaries because external domains are egress-blocked from the working
      session. The Meta figures and named-executive quotes are the best-supported.
- [ ] **Publish in order** — pillar first, then clusters, or the cluster breadcrumbs
      point at a draft.
- [ ] **Add the pillar link to page 395** (`/indexes/workforce-labor/`). Deliberately
      not done yet: linking a published index to draft pages creates dead links.
- [ ] Decide whether 2293 moves under the pillar or stays in `/reports/`.

## Candidate next clusters ("also more")

Ordered by evidence available now:

1. **Will AI replace designers?** — junior graphic design is in every "doomed roles"
   list; Adobe/Figma usage data exists.
2. **Will AI replace analysts and finance roles?** — market research 53% of tasks;
   bookkeeping 35–50%; strong contrast between production and sign-off.
3. **Will AI replace recruiters and HR?** — the sharpest counter-example on the site
   (62% expect AI to run hiring end-to-end, yet Korn Ferry finds 52% *adding* agents,
   and IBM tripled entry-level hiring).
4. **Will AI replace translators?** — highest exposure of any occupation at 98%+;
   deserves its own page rather than one table row.
5. **The entry-level squeeze** — cross-occupation page on the shared pipeline failure.
6. **Will AI replace teachers / clinicians / lawyers?** — high public search demand,
   but licensure and liability make them structurally different; needs its own framing.
