# Why course landing pages lose their styling from a point down

**It is not three stylesheets overwriting each other. Nothing is being overwritten.**
A single `</div>` too many, emitted by a shortcode in the middle of the page, closes
the `.aa-rd` wrapper early. Every rule in the course template is scoped `.aa-rd .x`,
so from that `</div>` onward *nothing matches* and the rest of the page renders with
the browser's defaults — native `▶` markers, plain underlined links, no cards, no grid.

That is why the FAQ and the closing band look like raw HTML on the public site while
looking correct in the editor.

## Evidence

| Check | Result |
|---|---|
| Brace / comment / string balance of the full Additional CSS | balanced, `final_depth=0` |
| Rules Chromium actually parses from the sheet | 871 top-level rules, parses through to the **last** rule in the file — no truncation |
| FAQ markup + real sheet rendered in Chromium | renders **correctly**: 2-col grid, Newsreader, `list-style:none`, `::after "+"`, white cards |
| `.aa-final` closing band, same test | renders correctly — teal band, white button |
| Failing classes that are `.aa-rd`-scoped | `.nr` 1/1, `.aa-faqh` 1/1, `.aa-faqwrap` 2/2, `.aa-faqcol` 1/1, `.aa-faq` 6/6, `.aa-final` 1/1, `.aa-sec` 2/2, `.btn-white` 5/5 |
| Failing classes with an **unscoped** rule | **zero** |
| `aa_reg_hero()` / `aa_reg_panel()` tag balance (rte, spc) | `div 17/17`, `section 1/1`; `div 29/29`, `section 3/3` — clean |

Every single thing that is broken needs `.aa-rd` as an ancestor. Nothing that is broken
has an unscoped fallback rule. That is not a cascade fight — a cascade fight would leave
*some* declarations winning. This is the selector never matching at all.

## Why the editor looks right and the public page does not

The block editor renders every block into its own isolated React subtree, so a surplus
`</div>` inside one Custom HTML block cannot escape that block. On the front end
`the_content` concatenates the raw HTML of every block into one string, and the browser's
parser applies the surplus `</div>` to the nearest open element — which is `.aa-rd`.

Same CSS, same markup, different DOM. That is the whole of the "three styles fighting".

## Where the surplus `</div>` comes from

Ruled out: the Additional CSS, the page markup, `aa_reg_hero()`, `aa_reg_panel()`.

Remaining candidates, all third-party shortcode output, in page order:

1. `[easy_event_calendar_mini category="rte"]` — Xylus *Easy Events Calendar*
2. `[wp_events category="rte" …]` — Xylus *WP Event Aggregator*, inside `.aa-feed-src`
3. `[fluentform id="8"]` — only renders when the register swap is off (it replaces the whole `.aa-reg` group)

`.aa-feed-src` is itself `.aa-rd`-scoped (`position:absolute; left:-9999px`), so there is a
free tell: **if the raw event list is visible on the page, the break is at or before it**
(candidate 1 or 2). If the feed is still hidden and only the FAQ and closing band are
broken, the break is at candidate 3.

## The one check that names it

Paste into DevTools console on the live RTE page:

```js
(() => {
  const rd = document.querySelector('.aa-rd');
  console.log('.aa-rd count:', document.querySelectorAll('.aa-rd').length);
  console.log('#faq inside .aa-rd?', !!document.querySelector('#faq')?.closest('.aa-rd'));
  console.log('LAST element still inside .aa-rd:',
    rd?.lastElementChild?.tagName, rd?.lastElementChild?.className, rd?.lastElementChild?.id);
  let n = rd?.nextElementSibling, out = [];
  while (n && out.length < 6) { out.push(n.tagName + '.' + n.className); n = n.nextElementSibling; }
  console.log('fell OUT of .aa-rd:', out);
})();
```

`#faq inside .aa-rd? false` confirms the diagnosis. **LAST element still inside `.aa-rd`**
names the block immediately before the break — the shortcode in that block is the culprit.

## The fix (once the culprit is named)

Not more CSS. Repair the markup at source, surgically — `do_shortcode_tag` lets us balance
the output of just the offending shortcode and touch nothing else:

```php
add_filter( 'do_shortcode_tag', function ( $output, $tag ) {
    // Only the shortcode that emits unbalanced HTML. Named explicitly so this
    // never runs over anything else on the site.
    if ( $tag === 'REPLACE_WITH_CULPRIT' ) {
        return force_balance_tags( $output );
    }
    return $output;
}, 10, 2 );
```

If the culprit is candidate 1 or 2, the better fix is to remove the shortcode outright —
both are the old Xylus calendar feeding a picker the new calendar has replaced
(see task #15, "Deactivate Xylus plugin + old JS snippet").

## Side note, unrelated to the break

The markup stored on the page and the markup your editor shows you are **not the same**.
Stored: `<!-- wp:group {"tagName":"div","className":"aa-rd",…} -->` with `id="top"` on the
div but no `"anchor"` attribute — which is an invalid block. Your editor's copy has
`"anchor":"top"` and reordered attributes, i.e. Gutenberg is silently auto-repairing these
blocks every time you open the page, and the repair is not saved. Your copy also has a
`<p>` nested inside a `<p>` in the FAQ intro, which the stored version does not. Worth a
save-and-republish pass, but it is not what is breaking the styling.
