# Handoff: The Two Chasms Framework — website

## Overview
Homepage for **twochasms.com** (@twochasms). It introduces the Two Chasms framework — Moore's adoption curve with a second chasm splitting the mainstream — and routes visitors to the team assessment (/assess), the workshops, the cast and the books.

Five journey states: **Reflex → Playground (chasm one: control → trust) → Signal sensing → Immune (chasm two: metrics → signals) → Mutation**. Two failure states: stuck in chasm one / two. The visual system is a ball leaping across three ground segments; it lands amber when the team arrives.

## About the design files
`design-reference/` holds **design references created in HTML** — they show intended look and behaviour; they are not production code. Recreate them in the target environment.
Two implementations are provided and *are* production-ready starting points:
- `html/` — static build of the homepage (HTML + one CSS file + 4 lines of JS). Ships on any static host.
- `wordpress/twochasms/` — the same page as a classic PHP theme.
If you build in React/Next/Astro etc., port `html/index.html` + `site.css`, using the codebase's own conventions.

## Fidelity
**High fidelity.** Colours, type, spacing and motion are final.

## Screen: Homepage (/)
Max width 1100px, 32px gutters, all sections stack vertically.
1. **Masthead** — 1px #D7DDE3 bottom border, 16px vertical padding. Left: curve-leap mark 40px + "Two Chasms" 22px/900/-.035em. Centre: nav (Framework, Assess, Workshops, Cast, Books) mono 11.5px/.12em uppercase, #44505C, current item #101418/600, 22px gap. Right: "Pre-order" button, ink fill, mono 11.5px/600, 10×14px padding. Wraps on narrow widths.
2. **Hero** — 56px top / 24px bottom, 18px gap. Kicker "The Two Chasms Framework" (mono 11.5/.16em/600 amber). h1 "Sense the shift before your *dashboard does.*" Lead (17px, #44505C, 54ch). CTAs: amber "Where's your team? →" → /assess, and text link "The workshops →".
3. **Journey banner** — 1584×420 artboard scaled to container width (SVG viewBox). Ground: rects at y=330 h=22: x 0–520, 640–1000, 1120–1584 (third animates to amber). Faint trail dots r=5 @16% along both arcs. Labels (mono 22px, y≈392, centred): Reflex @300 (#6B7885), Playground @580 (amber/600), Signal sensing @860 (#6B7885), Immune @1060 (amber/600), Mutation @1260 (ink/600). Animation in DESIGN-TOKENS.md.
4. **Where it comes from** — #F7F9FB band with hairlines top/bottom. h2 "Moore found one chasm. *Teams fall into a second.*" Explanatory lead. White panel (1px border, 16px pad) holding the **overlay SVG** (viewBox 0 -78 960 590): normal curve, x = 20 + (z+3)/6·920, y = 330 − 250·e^(−z²/2), split at z = −3,−2,−1,0,1,3 with gaps .04/.22/.04/.04 (Moore's chasm is the wide one). Grey fills #C6D0DA (left two) / #DCE4EC (rest). Dashed amber verticals at x=327 (PLAYGROUND = Moore's chasm) and x=480 (IMMUNE = new second chasm, with a white 68px gap rect behind). Ball positions: Reflex (204,268) 35% ink, Signal sensing (403,98) 60% ink, Mutation (664,195) amber r=14. Adopter labels + percentages under the curve; two-row legend.
5. **Five states** — h2 "Five states. *You are standing on one.*" Grid auto-fit minmax(150px,1fr), gap 10px. Card: #F7F9FB, 4px top bar (slate for states 01/03, amber for 02/04/05), 18px pad; white icon well with 120×96 scene; meta row (kind + number, mono 10.5px); name 22px/900; description 13.5px.
6. **Two chasms** — h2 "Two chasms. *Neither is crossed once.*" Two panels (minmax(300px,1fr), gap 14px), 4px left bar (slate / amber), backgrounds #F1F4F7 / #F7F9FB. Body on the left; on the right a "stuck here" scene (ball fallen into chasm 1 or 2, grey).
7. **Assessment** — ink band. Left: kicker "The assessment · 12 minutes" (amber-lt), h2 "Where's your team? *Find the ball.*", lead (#9AA6B2), amber-lt button "Take the assessment →". Right: 360px preview of the 1080×1080 share card ("One chasm down. / Next leap: Immune." + dark scene, ball mid-journey).
8. **Workshops** — h2 "Fourteen workshops. *One per leap.*" Three cards (minmax(240px,1fr), gap 12px), 3px slate top bar, #F7F9FB, 20px pad: P6 The Innovation Matrix (Chasm one), S1 Signal Mapping (Signal sensing), S6 IMMUNE / SignalNet (Chasm two).
9. **Cast band** — ink, 48px padding. h2 "The framework was written *as a story first.*" + line; buttons "Meet the cast" (amber-lt) → /cast and "Pre-order the book →" → /books.
10. **Colophon** — curve mark 22px + "The Two Chasms Framework · © Agile Agilist Inc. · Toronto", mono 11px #6B7885.

## Scene geometry (state icons)
Small scene 120×96: ground y=76 h=8, segments [0–30], [44–76], [90–120]; stand points x=15/60/105; ball d=12; arc peak 44. Ball position at progress t∈[0,2]: hop=floor(t), u=t−hop, x = lerp(stand[hop], stand[hop+1], u), y = G − b/2 − peak·sin(πu). Trail dots every t+=.125 at 30% ball size, 22% opacity. t=0.5 / 1.5 highlight the crossed gap with the chasm tint; t=2 turns ball + last segment amber. "Stuck" variants drop a grey ball into gap 1 or 2 (centres x=37/82). Reference implementation: `scene()` in `design-reference/Two Chasms Site v2.dc.html`.

## Interactions & behaviour
- Hover: buttons invert (amber↔ink; amber-lt→white), text links go amber↔ink, 180ms.
- Journey banner loops continuously; paused under prefers-reduced-motion (site.js).
- Responsive: fluid; all grids use auto-fit and wrap. Gutter 20px ≤520px.
- No state, no storage, no data fetching on this page.

## Not yet designed (do not invent)
- **/assess** — question flow returning one of five states (or a stuck state), producing the shareable result card (see 6C in the brand kit). Every primary CTA points here.
- **/workshops** — full list of fourteen; only P6/S1/S6 are final.
- **/cast, /books** — designed in the previous "Mutation" build (old handoff); need restyling to this header/footer.
- **Interactive IMMUNE rings** from the earlier site are not yet integrated into this page.

## Assets
- Logos/favicons: `html/assets/favicon.svg`; full set in the separate brand kit zip.
- Fonts: Archivo, IBM Plex Mono (Google Fonts, SIL OFL — self-host in production).
- No raster images, no icon library.

## Files
```
README.md  DESIGN-TOKENS.md  CLAUDE.md
html/index.html  html/assets/{site.css, site.js, favicon.svg}
wordpress/README-wordpress.md
wordpress/twochasms/{style.css, functions.php, header.php, footer.php, front-page.php, index.php, assets/}
design-reference/Two Chasms Site v2 (offline).html   ← open in browser
design-reference/*.dc.html + support.js               ← editable source
```
