# /services/operating-model/ — layer CTAs point away from their service pages

Page **28854**, one `core/html` block. Two find-and-replace edits in the block.

I am giving you the strings rather than pushing the change because my local copy
of this page (`snippets/backup-live/28854.html`) is from 10 Aug and the page was
edited on 19 Aug. The whole page is a single HTML block, so writing my copy back
would silently revert nine days of work. Each string below occurs **exactly
once** in the page.

## The pattern

Five layers, each with one `op-btn-c` button. Three of the five leave the
operating model:

| Layer | Currently links to | Service page | Verdict |
|---|---|---|---|
| 01 Scaling Iterative Model | `/services/scaling-iterative-model/` | 28858 ✓ | correct |
| 02 Innovation Culture | `/services/innovation-culture/` | 1705 ✓ | correct |
| 03 AI-Native | `/training/ai-native/` | **28869** `/services/ai-native-operating-model/` | **wrong** |
| 04 AI Automation | `/services/digital-transformation/` | *does not exist* | see below |
| 05 Mutation | `/assessments/mutation-readiness/` | **28870** `/services/mutation/` | **wrong** — the one you found |

## Edit 1 — Mutation (the one you reported)

FIND
```
href="/assessments/mutation-readiness/"
```
REPLACE
```
href="/services/mutation/"
```

Then the button label, which currently names the assessment:

FIND
```
>Mutation Readiness &#10230;</a>
```
REPLACE
```
>Mutation &#10230;</a>
```

That matches the other four, which are all labelled with the page they open.

**Keeping the assessment reachable.** The panel copy already says "Mutation
Readiness is the discipline of…", so link that phrase instead of spending the
one button on it:

FIND
```
The layer that makes change permanent. Mutation Readiness is the discipline
```
REPLACE
```
The layer that makes change permanent. <a href="/assessments/mutation-readiness/" style="color:#8FCFCF;text-decoration:underline">Mutation Readiness</a> is the discipline
```

## Edit 2 — AI-Native (same bug, not reported)

Layer 03 sends someone reading about the operating model into the training
catalogue. `/services/ai-native-operating-model/` (28869, published, "Service ·
Operating Model · Layer") is the matching page and the one the menu already
uses.

FIND
```
href="/training/ai-native/"
```
REPLACE
```
href="/services/ai-native-operating-model/"
```
FIND
```
>AI-Native training &#10230;</a>
```
REPLACE
```
>AI-Native Operating Model &#10230;</a>
```

Say the word if you would rather layer 03 kept pointing at training — it is a
defensible choice, just not the one the other four make.

## Layer 04 — a decision, not a fix

**There is no `/services/ai-automation/` page.** The children of Services are:
mutation, ai-native-operating-model, scaling-iterative-model, operating-model,
product-operating-model, innovation-culture, digital-transformation,
business-agility. So layer 04 pointing at `/services/digital-transformation/`
is the closest thing that exists, not a typo.

But the label and the destination disagree, in three places at once:

- the layer 04 button says "Digital Transformation" while the layer is called
  "AI Automation"
- **menu item 28864** says "AI Automation" and points at
  `/services/digital-transformation/`, so the breadcrumb on arrival reads
  "Digital Transformation"
- `aa-nav-js.js` line 406 maps `/services/ai-automation/` to a breadcrumb — an
  entry for a URL that does not exist, so it never fires

Two coherent ways out, and it is your call which:

1. **Create `/services/ai-automation/`** as a real layer page alongside the
   other four. The breadcrumb map already expects it, so that entry starts
   working the day the page exists.
2. **Rename the layer to "Digital Transformation"** everywhere — the page, the
   menu item, and the tab label — and delete the dead breadcrumb entry.

Option 1 is more work and matches the five-layer story the page tells. Option 2
is honest about what is actually behind the link today.
