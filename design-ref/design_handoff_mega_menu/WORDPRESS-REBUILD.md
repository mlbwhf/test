# WORDPRESS-REBUILD.md — rebuild guide for Claude Code

Target: agile-agilist.com, WordPress + Astra child theme. Everything here is already written. Your job is to install it, connect real data, and verify. Do not redesign.

## 1. What maps to what
| Design (reference/) | Working HTML (html/) | WordPress |
|---|---|---|
| Training Mega Menu | `mega-menu.html` | `wordpress/aa-mm/aa-mm.php` (`[aa_training_menu]`), `assets/aa-mm.css`, `assets/aa-mm.js` |
| Course Selection Flow | `select-flow.html` | `includes/flow.php` (`[aa_class_flow]`), `assets/aa-fl.css`, `assets/aa-fl.js`, theme template `wordpress/theme/page-training-select.php` |
| Compare (step 3) | `compare-table.html` | `[aa_compare_table]`, theme template `page-training-compare.php` |
| Cohort dates on course pages | — | `[aa_cohort_list class="devops"]` |
| Plain-text index | `training-menu.txt` | `/training-menu.txt` route in `aa-mm.php` |
| Data | `data/training-menu.json` | `wordpress/aa-mm/data/training-menu.json` (keep identical) |

## 2. Install steps
1. Copy `wordpress/aa-mm/` to `wp-content/plugins/aa-mm/`. Activate. Settings → Permalinks → Save (registers `/training-menu.txt`).
2. Copy `wordpress/theme/page-training-select.php` and `page-training-compare.php` into the Astra child theme root.
3. Create pages: **Training** (`/training/`, shortcode `[aa_training_menu]`); **Select classes** (`/training/select/`, template "Training — Select classes"); **Compare classes** (`/training/compare/`, template "Training — Compare classes"). Parent page for the last two is Training.
4. On each Core course page, add `[aa_cohort_list class="<id>"]` just above the registration section (ids: devops, sp, la, sm, popm, rte).
5. Header (optional): add `[aa_training_menu mode="dropdown"]` to the Astra header and the CSS class `aa-mm-trigger` on the Training menu item.
6. Add `/training-menu.txt` and `/training/compare/` to `/llms.txt` and the sitemap. Exclude `/training/select/` from the sitemap.

## 3. Wire real data (replace placeholders)
Use the `aa_mm_data` filter in a small mu-plugin. Do not edit PHP markup.
```php
add_filter( 'aa_mm_data', function ( $d ) {
  foreach ( $d['courses'] as $id => &$c ) {
    $c['url']   = aa_real_url( $id );                // real course permalink
    $c['price'] = aa_server_price( $id );             // the price checkout will charge, formatted
    if ( isset( $c['cohorts'] ) ) { $c['cohorts'] = aa_live_cohorts( $id ); } // see shape below
    $first = aa_soonest_open( $c['cohorts'] ?? [] ); if ( $first ) { $c['iso'] = $first['start']; $c['next'] = $first['label']; }
  }
  return $d;
} );
```
Cohort shape: `{ id, start (Y-m-d), end (Y-m-d), label ("Nov 19–20"), days ("Thu–Fri"), time ("09:00–17:00 ET"), seats ("open"|"low"|"full"), seatsLabel ("4 seats left") }`. The cohort `id` must be the same id the course page's registration section already understands (`?cohort=<id>`). Past cohorts are dropped by the templates. Never show a price that checkout will not charge.

## 4. Seat check (optional but recommended)
`[aa_class_flow check_url="/wp-json/aa/v1/cohorts/status"]`. The flow calls `GET <check_url>?cohorts=d1,s1`, expects `{"full":["s1"]}`, times out at 1.5s and then proceeds (the course page re-checks). A full cohort shows the refusal message and returns the buyer to step 2. No email is sent.

## 5. Checkout handoff
"Continue to payment" does `location.assign(<course url>?cohort=<id>&seats=<n>#register)`. Same tab. Only the cohort id and seat count travel. The email field is NOT in the flow: the existing course-page checkout collects it (the design mock shows an email field; leave it out so no personal data touches this page or any URL).
- The course page must open with that cohort selected and show the same seat count (the existing handoff work, see "Handoff Arrival" in the earlier design notes).
- For several classes, remaining classes are saved in `sessionStorage.aa_fl_queue` as `[{id,cohort,seats}]`. Read it on the course page after a successful order to offer "Continue to <next class>". Build that banner only if multi-class is wanted; otherwise delete the queue write in `aa-fl.js`.

## 6. URL state
`/training/select/?classes=devops,sp&cohorts=d1,s1`. Ids only. Opening it lands on step 2 with those choices set. Menu shortlist button → this URL. Update the menu CTA (`aa-mm.js`, `cta.href`) to point to `/training/select/?classes=<ids>` when more than one class is chosen, and keep the single-class link to the course page `#register`.

## 7. Progressive enhancement contract
- With JS off: step 1 cards, step 2 date pickers (native checkboxes and radios), and the full compare table are visible stacked. The step bar, bottom bar, tabs and register panel are hidden (`.aa-fl:not(.is-ready)`).
- JS adds only: `is-ready`, step switching, summary, diff toggle, seat stepper, URL sync, checkout navigation.
- Nothing is fetched to render content.

## 8. Verification checklist
- [ ] Menu: Core NEW tag; SAFe Roles = ASM, BO, ASE, Architects, LSSP; Advanced SAFe = SPC, ASPC, RTE, APM, LPM.
- [ ] Select flow end to end at 360, 390, 1280px. No horizontal page scroll. Bottom bar visible with iOS keyboard closed.
- [ ] Overlap alert appears under the later class and disables Continue. Full cohort cannot be chosen.
- [ ] Refusal text sits in a `role="alert"` region right above the button and is on screen at the click.
- [ ] Back button from the course page returns to the flow with choices restored and no stuck spinner (`pageshow`).
- [ ] `curl -s /training/compare/` shows every class, price and date in the HTML. `curl -s /training-menu.txt` returns 200 text/plain.
- [ ] Rich Results Test passes for the `ItemList` (menu) and `Course`/`CourseInstance` (course pages).
- [ ] `/training/select/` has `noindex,follow`; compare page is indexable.
- [ ] Reduced motion: no animation, no flying dot.
- [ ] RTL: arrows flip; dates and prices in `<bdi>`/`<time>`.
- [ ] No `target="_blank"`, no email in any URL, no price computed client-side.

## 9. Known gaps to confirm with the owner
Real prices, dates, prerequisites and URLs; whether multi-class single payment is wanted; whether the header dropdown is wanted or only the /training/ page; French, Spanish and Arabic strings (all wrapped in `__()`; the JS strings in `aa-fl.js` and `aa-mm.js` need `wp_localize_script` or `wp.i18n` before translation).
