# Design tokens — Two Chasms

White ground, Archivo heavy display, IBM Plex Mono for every label. Two accents: amber and slate. The canonical implementation is `html/assets/site.css` (custom properties at the top).

## Colour
| Token | Hex | Use |
|---|---|---|
| --ink | #101418 | Text, dark bands, primary button, the ball |
| --ink-2 | #44505C | Secondary copy, nav |
| --mute | #6B7885 | Mono labels, colophon, "State" kind |
| --faint | #8C97A3 | Tertiary mono, stuck ball, Moore labels |
| --line | #D7DDE3 | Hairlines |
| --line-2 | #C6D0DA | Moore curve (dark grey segments) |
| — | #DCE4EC | Moore curve (light grey segments) |
| --paper | #FFFFFF | Page |
| --wash | #F1F4F7 | Crossing one panel |
| --wash-2 | #F7F9FB | Overlay band, state cards, workshop cards |
| --amber | #C87A16 | Accent, **light grounds only** |
| --amber-lt | #F0A93C | Accent, **dark grounds only** |
| --slate | #3C4E63 | Structure bars (states, crossing one, workshops) |
| --cloud | #9AA6B2 | Body copy on dark |
| --edge | #2A333D | Outline of share card on dark |
| chasm tint | rgba(200,122,22,.16) / dark rgba(240,169,60,.18) | Highlighted gap in state scenes |

## Type
- Archivo 400/500/700/900; IBM Plex Mono 400/500/600, always uppercase, tracking .08–.16em.
- h1 clamp(34px,6vw,64px) / 900 / lh .94 / ls -.03em / max 16ch. Second clause in amber.
- h2 clamp(26px,3.6vw,38px) / 900 / lh 1 / ls -.02em. Second clause in amber (amber-lt on dark).
- h3 21–24px / 900 / ls -.02em. Lead 17px (hero) or 15px / 1.65. Body 13.5px / 1.65. Mono labels 10.5–12px.

## Space & shape
- Max width 1100px, gutter 32px (20px ≤520px). Section padding 56px; dark CTA band 48px.
- Gaps: 10px state cards, 12px workshops, 14px crossings, 40px assess grid.
- **No border radius except the ball (50%). No shadows.** Accent bars 3–4px.

## Motion
- Journey banner: 4.2s loop. Ball follows `M300 314 Q580 -14 860 314 Q1060 -14 1260 314` (in a 1584×420 box) over 0–66% with cubic-bezier(.45,0,.55,1), fades 66–70%; amber landing ball scales in 64–72%, holds to 94%, fades by 100%; third ground segment turns amber 72–94%.
- Hover 180ms. All motion off under prefers-reduced-motion.
