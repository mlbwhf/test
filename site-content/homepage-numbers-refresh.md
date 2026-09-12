# Homepage "AI by the numbers" refresh — queued edits (page ID 6)

Prepared 2026-08-07. Apply as four small `wp_alter_post` search/replace edits
(small payloads, WAF-friendly). Sources verified this session.

## Why this refresh is more than a date bump

Two figures on the live page are now **wrong**, not merely stale:

1. **Worldwide AI spend — $2.5T is outdated.** Gartner *raised* the 2026 forecast
   in May 2026 from $2.52T (+44%) to **$2.59T (+47% YoY)**. The page still shows
   the January number.
2. **Gen-AI use — 71% is the wrong number.** McKinsey's current figure is **72%**
   of organizations using generative AI, up from 33% in 2024 (a +39pt swing, not
   the +38 shown). The card is also labelled "Survey" rather than the actual source.

Also: the standing disclaimer ("2024–2025 comparisons are illustrative estimates
pending source confirmation") can now be partly retired — the gen-AI series
(33% → 72%) is McKinsey's own, so only the spend series remains derived.

---

## Edit 1 — refresh the date stamp

SEARCH:
```
>Updated June 2026</span>
```
REPLACE:
```
>Updated August 2026</span>
```

## Edit 2 — honest disclaimer (retires the blanket "illustrative" caveat)

SEARCH:
```
The trend matters as much as the number. 2026 headline figures are sourced; 2024–2025 comparisons are illustrative estimates pending source confirmation.
```
REPLACE:
```
The trend matters as much as the number. Headline figures and the generative-AI series are primary-sourced; intermediate spend years are DERIVED from Gartner's stated growth rates and marked as such.
```

## Edit 3 — worldwide AI spend: $2.5T → $2.59T, +47% YoY

SEARCH:
```
>$2.5<span style="font-size:28px;color:#2545f5;">T</span></div>
```
REPLACE:
```
>$2.59<span style="font-size:28px;color:#2545f5;">T</span></div>
```

Then the bar series + footer (separate replace, same card):

SEARCH:
```
<span class="tai-mono" style="font-size:10px;color:#9a9aa2;width:24px;">'25</span><span style="height:7px;width:60%;background:#d3d3da;border-radius:1px;"></span></div>
```
REPLACE:
```
<span class="tai-mono" style="font-size:10px;color:#9a9aa2;width:24px;">'25</span><span style="height:7px;width:68%;background:#d3d3da;border-radius:1px;"></span></div>
```

SEARCH:
```
>Gartner · ~2.3×</div>
```
REPLACE:
```
>Gartner · +47% YoY</div>
```

## Edit 4 — generative AI: 71% → 72%, correct source + delta

SEARCH:
```
>71<span style="font-size:28px;color:#2545f5;">%</span></div>
```
REPLACE:
```
>72<span style="font-size:28px;color:#2545f5;">%</span></div>
```

SEARCH:
```
<span class="tai-mono" style="font-size:10px;color:#9a9aa2;width:24px;">'26</span><span style="height:7px;width:71%;background:#2545f5;border-radius:1px;"></span></div>
```
REPLACE:
```
<span class="tai-mono" style="font-size:10px;color:#9a9aa2;width:24px;">'26</span><span style="height:7px;width:72%;background:#2545f5;border-radius:1px;"></span></div>
```

SEARCH:
```
>Survey · +38 pts</div>
```
REPLACE:
```
>McKinsey · +39 pts</div>
```

---

## Sources verified 2026-08-07

- Gartner, "Worldwide AI Spending to Grow 47% in 2026" (19 May 2026) — $2.59T for
  2026; $3.3T projected 2027; AI = ~41% of all IT spend in 2026 (from ~32% in 2025).
- McKinsey State of Organizations 2026 (survey Jun–Sep 2025, n=10,018) — 88% use AI
  in at least one function; 72% use generative AI, up from 33% in 2024.
- Stanford HAI 2026 AI Index — inference cost for GPT-3.5-class performance fell
  >280× (Nov 2022 → Oct 2024); global corporate AI investment $581.7B in 2025 (+130%).

## Optional follow-up (not queued — needs owner's call)

The 88% "organizations using AI" card could carry a sharper counterpoint: McKinsey
now reports only ~7% have scaled generative AI enterprise-wide, and just 19% report
AI-driven revenue gains above 5%. That tension (near-universal adoption, thin
returns) is the site's house argument and would strengthen the section — but it
changes the card's meaning, so it is left for approval rather than applied silently.
