# The Two Chasms Framework templates

Built-in templates under the **Two Chasms** method tab, from Mark Saymen's *The Innovation Playground* and *The Mutation Age*. Source: `packages/core/src/twochasms.ts`.

## The five states

| State | Kind | Operating-model wave | Workshops |
|---|---|---|---|
| Reflex | ground | 01 Iterative delivery at scale | R0 Five-State Readiness Check |
| Playground | crossing (chasm one: control → trust) | 02 Innovation in cadence | P1 Charter the Playground · P2 Attention Audit · P3 The Candor Contract · P4 First Useful Moment · P5 The Cultural Wall · P6 The Innovation Matrix · P7 The Rebrand Test |
| Signal Sensing | ground | 03 AI-Native | S1 Signal Mapping · S2 Grown, Not Built · S3 Observe, Don't Ask · S4 Sensemaking Cells |
| Immune | crossing (chasm two: metrics → signals) | 04 AI automation | S5 Governance Latency · S6 IMMUNE / SignalNet · S7 The Blind-Spot Register |
| Mutation | ground | 05 Mutation | M1 The Living Playbook · M2 Mutation Readiness, facilitated |

Plus **The Two Chasms Framework · Foundations**, a two-day class board with one lesson per state built from condensed workshop steps.

## How a workshop board is laid out

A "Start here" strip (purpose with artifact, source and state; the timed agenda; who is in the room; the facilitator's rules), one frame per step with its exercises, and a final frame holding the artifact and the sentence the room writes beneath it. Exercises use the same vocabulary as the class boards (`slide`, `stickies`, `zones`, `table`, `canvas`, `link`), so a workshop is authored in a few lines in `TWO_CHASMS_WORKSHOPS` and edited on the board like any other template.

## Adding or changing a workshop

Add a `WorkshopSpec` to `TWO_CHASMS_WORKSHOPS` with a code, state, source, purpose, room, artifact, rules, steps and closing sentence. `twochasms.test.ts` checks that every card lands inside its frame, every state has a workshop and ids stay unique across the whole catalog. Keep quotes verbatim from the books; name any outside research a step relies on.

Content © Mark Saymen, The Two Chasms Framework.
