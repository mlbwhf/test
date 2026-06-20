# Registration rollout — original page integration + all courses
_How to (1) put payment on the original /sa/ page, and (2) roll the same registration out to every course. The schedule snippet already supports `category` + `price`, so one engine serves all courses._

---
## Part 1 — Put payment on the ORIGINAL /sa/ page (retire the pilot)
/sa/ (24467) is 104 KB classic/freeform → **edit in wp-admin, not MCP**. Paste these **4 blocks** where you want the enroll experience (under the hero is ideal):

1. **Enroll band** — *Custom HTML block* (course name + price + "See dates").
2. **`[aa_cohorts]`** — *Shortcode block* (the schedule cards).
3. **#enroll-form intro** — *Custom HTML block* (the "Register & pay" heading + the yellow selected-cohort indicator + the small JS).
4. **`[fluentform id="3"]`** — *Shortcode block* (the form expands under the clicked cohort).

Paste-ready markup: `leading-safe-sa-enroll-FINAL.md` + `enroll-section-paste-block.md`.
Then **retire the pilot (26639)**: set it to draft, or 301 it → `/training/safe/sa/`. Result: one canonical course+payment page.

> Note: the form's accordion JS finds the form via `.fluentform_wrapper_3`. With the latest snippet (DOM-ready fix) this works wherever the form sits on the page.

---
## Part 2 — Roll out to ALL courses (repeatable recipe)
For each course, repeat 3 steps. Nothing in the snippet changes — you pass a different `category`, `price`, and form id.

### Step A — Events (one category per course)
In the events calendar, give each course its **own event category** and add its cohorts:
`sa` (done) · `popm` · `ssm`/`asm` · `spc` · `aspc` · `rte` · `lpm` · `apm` · `devops` · `ai-native`
The schedule reads `[aa_cohorts category="<cat>"]` → shows only that course's upcoming cohorts. Dates update by editing the event (single source of truth).

### Step B — Form (duplicate per course)
1. Fluent Forms → **duplicate** the Leading SAFe form.
2. Set the **Stripe payment item** to that course's **price** (price lives in the form, not the snippet).
3. Keep the **Cohort field name = `dropdown`** (duplicating preserves it) so the populator works.
4. Note the new **form ID**. Add the same **2 emails** (admin + ticket) and the **HubSpot** feed (or duplicate them).

> One form per course is the simplest, most robust model (each carries its own price + cohorts). A single shared form with dynamic price is possible but fragile — not recommended.

### Step C — Paste the enroll block on the course page
Same 4 blocks as Part 1, with the course's values:
```
[Enroll band — course name + price]
[aa_cohorts category="popm" price="$XXX"]
[#enroll-form intro + indicator JS]
[fluentform id="<that course's form id>"]
```

### The one piece to generalize: the cohort-dropdown populator
Your live snippet populates **form 3** from category **sa**. For multiple courses, replace it with this **form→category map** version so every course form's dropdown auto-fills from its own events (value = event Post ID, matching the schedule links):

```php
/* Populate each course form's Cohort dropdown from its event category.
   Add one line per course: form_id => category-slug. Field name must be "dropdown". */
add_filter( 'fluentform/rendering_field_data', function ( $data, $form ) {
	$MAP = array(
		3  => 'sa',        // Leading SAFe (live form)
		// 5  => 'popm',
		// 6  => 'asm',
		// 7  => 'spc',
		// add: form_id => 'category-slug'
	);
	$fid = (int) ( $form->id ?? 0 );
	if ( ! isset( $MAP[ $fid ] ) ) { return $data; }
	$name = $data['attributes']['name'] ?? '';
	if ( $name !== 'dropdown' || ( $data['element'] ?? '' ) !== 'select' ) { return $data; }

	$term = get_term_by( 'slug', $MAP[ $fid ], 'event_category' );
	if ( ! $term ) { return $data; }
	$events = get_posts( array(
		'post_type'      => 'wp_events',
		'post_status'    => 'publish',
		'posts_per_page' => 30,
		'no_found_rows'  => true,
		'tax_query'      => array( array( 'taxonomy' => 'event_category', 'field' => 'term_id', 'terms' => $term->term_id ) ),
	) );
	$opts = array();
	foreach ( $events as $ev ) {
		$ts = (int) get_post_meta( $ev->ID, 'start_ts', true );
		if ( $ts && $ts < strtotime( 'today' ) ) { continue; }
		$label = html_entity_decode( get_the_title( $ev ), ENT_QUOTES );
		$opts[] = array( 'ts' => $ts, 'label' => $label, 'value' => (string) $ev->ID );
	}
	usort( $opts, function ( $a, $b ) { return $a['ts'] - $b['ts']; } );
	if ( ! $opts ) { return $data; }

	$adv = array(); $flat = array();
	foreach ( $opts as $o ) { $adv[] = array( 'label' => $o['label'], 'value' => $o['value'], 'calc_value' => '' ); $flat[ $o['value'] ] = $o['label']; }
	$data['settings']['advanced_options'] = $adv;
	$data['options'] = $flat;
	return $data;
}, 20, 2 );
```
- On each course form, set the Cohort field **Advanced → Default Value = `{get.cohort}`** (so the clicked cohort pre-selects).
- This + `[aa_cohorts category="X"]` keeps the schedule and the form on the **same event Post IDs** per course.

---
## Per-course rollout checklist (copy for each)
- [ ] Event category created + cohorts added (with `start_ts`)
- [ ] Form duplicated, price set, field name `dropdown`, default `{get.cohort}`
- [ ] Emails (admin + ticket) + HubSpot feed added to the form
- [ ] Form id added to the `$MAP` above
- [ ] Enroll block pasted on the course page (`category` + `price` + form id)
- [ ] Tested: schedule shows dates → click cohort → form expands pre-selected → Stripe test pays → email + entry + HubSpot

## Where to test it
Do all of this on the **Hostinger sandbox** first (Stripe test mode) — prove one extra course end-to-end, then replicate live.
