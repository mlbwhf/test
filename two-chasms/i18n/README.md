# Translating the Two Chasms assessments

Both assessments (`/assess` placement, `/maturity` five-state maturity) run on one engine
(`engine/tc-engine.js`, inlined in WordPress template 7). The engine renders every screen from a
**strings table**; nothing the visitor reads is hard-coded. `en.json` is the complete English
catalogue (210 keys). A translation is a copy of it with the same keys and translated values.

## Key layout
| Prefix | What it is | Example |
|---|---|---|
| `ui.*` | engine chrome: buttons, counters, email gate, result labels, share card | `ui.gate.go` → "Show my reading →" |
| `dim.<state>.name` / `.sub` / `.def` | the five states, shared by both assessments | `dim.signal-sensing.name` → "Signal Sensing" |
| `q.<assessment>.<item>` | a statement | `q.maturity.i4` |
| `p.<assessment>.<item>` | the probe line under the statement | `p.maturity.i4` |
| `red.placement.*` | the red panel (Seven Stagnation Signals): names, bands, labels | `red.placement.band.bleed` |
| `read.<assessment>.*` | result copy; `{placeholders}` are filled by the engine — keep them | `read.placement.gap.body` |
| `level.maturity.<id>.name` / `.body` | the five maturity levels | `level.maturity.reactive.body` |
| `ws.<code>` | workshop labels on result buttons | `ws.s6` |

Two-clause headings are split: `ui.persp.title` is the first clause, `ui.persp.title.em` the amber one.
Placeholders (`{at}`, `{weak}`, `{weakSub}`, `{holding}`, `{chasm}`, `{overall}`, `{level}`, `{strong}`,
`{n}`, `{total}`, `{name}`, `{sub}`) must survive translation unchanged; reorder them as the language needs.

Locked spellings (HANDOVER §1): the third state is always two words, *Signal Sensing*; IMMUNE in caps
names the state and the workshop; "immune system" lower-case is the metaphor.

## Shipping a translation
1. Copy `en.json` → `<lang>.json`, translate the values.
2. Build the page with that catalogue (`build_engine.py` reads `en.json`; point it at the new file, or
   paste a second strings block after the English one — later blocks override earlier keys):
   ```html
   <script type="application/json" class="tc-strings">{"ui.start":"Commencer →", ...}</script>
   ```
   The page's own hero/intro HTML (above the engine mount) is ordinary page content and is translated
   like any other WordPress page.
3. Any key missing from the table renders as `[key]` on the page, so gaps are visible, never silent.

The JSON blocks in the live pages are base64-encoded (`data-enc="base64"`) only so they survive being
pasted into WordPress; plain JSON works the same (`python3 build_engine.py --plain`).
