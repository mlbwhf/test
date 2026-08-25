<?php
/**
 * Agile Agilist — COURSE HERO + REGISTRATION  [aa_course_hero] [aa_course_register]
 * -----------------------------------------------------------------------------
 * Built to the course-page handoff (hero 3A + registration 2B), with the
 * handoff's invoice stub replaced by real Stripe Checkout.
 *
 * THREE SNIPPETS, one per kind — same split as the calendar, for the same
 * reason. Never paste the CSS or JS into this file.
 *   1. WPCode -> CSS Snippet        "AA - Register CSS"  <- aa-register.css
 *   2. WPCode -> JavaScript Snippet "AA - Register JS"   <- aa-register.js
 *                                   (Site Wide Footer)
 *   3. WPCode -> PHP Snippet        "AA - Register PHP"  <- this file
 *                                   (Auto Insert, Run Everywhere)
 *
 * USE, one course per page:
 *     [aa_course_hero course="spc"]         hero with the compact date picker
 *     [aa_course_register course="spc"]     full list + two-step registration
 *
 * -----------------------------------------------------------------------------
 * MONEY: WHAT IS TRUSTED AND WHAT IS NOT
 *
 * The browser sends a cohort id and a seat count. It does NOT send a price,
 * and if it did the price would be ignored. data-price exists in the markup
 * only so the page can show a running total; anyone with devtools can change
 * it to 1. The amount charged is looked up HERE, from aa_reg_courses(), and
 * the seat count is re-clamped here against seats actually left.
 *
 * NOTHING CHARGES UNTIL YOU SWITCH IT ON. aa_reg_is_live() is false until the
 * "prices confirmed" box is ticked in Settings -> AA Registration. Until then
 * the register button is disabled and the checkout endpoint refuses. The
 * prices in the table below were transcribed from the live course pages and
 * have NOT been verified against your Stripe account or your finance records;
 * charging a wrong amount is worse than not charging at all, so the default
 * is off. Check every row, then tick the box.
 *
 * KEYS are never in this file. It reads the constants AA_STRIPE_SECRET and
 * AA_STRIPE_WEBHOOK_SECRET if wp-config.php defines them, otherwise options
 * set on the settings page. A secret key pasted into a snippet is a secret
 * stored in the posts table and shown to every admin who opens the editor.
 *
 * PAYMENT: CHECKOUT SESSIONS, not Payment Links. This creates a session per
 * click. The alternative — a static Stripe Payment Link — was considered and
 * rejected for this site:
 *
 *   Price integrity. The Offer JSON-LD on the page and the amount charged both
 *   come from one table here, so structured data cannot advertise a price the
 *   checkout does not honour. A link's price lives in the Stripe dashboard and
 *   silently diverges the day either side changes.
 *   Seats. A session is refused when a batch is full or over-booked. A link
 *   with adjustable quantity lets a buyer raise the seat count on Stripe's own
 *   page, past any check made here.
 *   Maintenance. One link per class is impossible with a generated schedule —
 *   201 batches live at once, about seven new every week, 364 a year to create
 *   and retire, each dying when its date passes.
 *
 * The cost is one server round trip before the redirect, roughly a third of a
 * second, covered by the button's "Taking you to Stripe…" state. Stripe hosts
 * the identical mobile-optimised payment page either way, so nothing about the
 * payment experience, its SEO or its readability differs.
 *
 * A per-course 'payment_link' is still honoured if one is set, and the cohort
 * rides along as client_reference_id — kept for a fixed-price course where the
 * link already exists. It is not the recommended path.
 *
 * WEBHOOK: point Stripe at  <site>/wp-json/aa/v1/stripe-webhook  for the
 * checkout.session.completed event. That, not the browser returning, is what
 * records a sale — a buyer can close the tab on the Stripe page after paying.
 * -----------------------------------------------------------------------------
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* Double-load guard — see the calendar snippet for why the whole body is
   wrapped rather than guarded with an early return. */
if ( ! function_exists( 'aa_reg_courses' ) ) :

/**
 * COURSES and their SCHEDULING RULES.
 *
 * Cohorts are GENERATED from a weekly cadence, not typed out. At the cadences
 * this business actually runs — ASPC and SPC every Monday and Thursday, RTE
 * every Monday, Wednesday and Friday — a hand-written list is 364 entries a
 * year for three courses, and every one of them would need re-checking against
 * the holiday rule. The rule is the maintainable artefact; the dates fall out
 * of it.
 *
 *   cadence  one entry per weekly start: day of week + time slot
 *   days     class length, which is also what the blackout rule tests against
 *   weeks    how far ahead to publish
 *   seats    room size (sold seats are tracked separately and subtracted)
 *   extra    explicit one-off starts, for anything the cadence cannot express
 *
 * PRICES were transcribed from the live course pages and are NOT verified.
 * Nothing charges until the box is ticked in Settings -> AA Registration.
 */
function aa_reg_courses() {
	return array(
		'spc' => array(
			'code'     => 'SPC',
			'name'     => 'Implementing SAFe® with SPC Certification',
			'eyebrow'  => 'Live online · SPC certification',
			'h1'       => 'Implementing SAFe® in four days.',
			'lede'     => 'Taught by practising SPCTs, capped at 18 seats, exam fee included. Leave with the toolkit to launch your first train — not a certificate you file away.',
			'url'      => '/training/adv-safe/spc/',
			'currency' => 'usd',
			'price'    => 2875,
			'days'     => 4,
			'seats'    => 18,
			'weeks'    => 26,
			'cadence'  => array(
				array( 'dow' => 'Mon', 'slot' => 'morning' ),
				array( 'dow' => 'Thu', 'slot' => 'morning' ),
			),
			'proof'    => array( 'SPCT-led', '18 seats max', 'Exam fee included' ),
			// 'payment_link' => 'https://buy.stripe.com/xxxx',  // see PAYMENT LINKS below
		),
		'aspc' => array(
			'code'     => 'ASPC',
			'name'     => 'Advanced SAFe® Practice Consultant Certification',
			'eyebrow'  => 'Live online · ASPC certification',
			'h1'       => 'Advanced SAFe® Practice Consultant.',
			'lede'     => 'Go beyond SPC — advanced coaching, measuring transformation outcomes, and guiding complex enterprise change at portfolio and solution level.',
			'url'      => '/training/adv-safe/aspc/',
			'currency' => 'usd',
			'price'    => 2899,
			'days'     => 3,
			'seats'    => 18,
			'weeks'    => 26,
			'cadence'  => array(
				array( 'dow' => 'Mon', 'slot' => 'morning' ),
				array( 'dow' => 'Thu', 'slot' => 'morning' ),
			),
			'proof'    => array( 'SPCT-led', '18 seats max', 'Exam fee included' ),
		),
		'rte' => array(
			'code'     => 'RTE',
			'name'     => 'SAFe® Release Train Engineer Certification',
			'eyebrow'  => 'Live online · RTE certification',
			'h1'       => 'Release Train Engineer in three days.',
			'lede'     => 'Become the servant leader of the Agile Release Train — facilitating ART events, driving relentless improvement, and leading PI execution.',
			'url'      => '/training/adv-safe/rte/',
			'currency' => 'usd',
			'price'    => 2150,
			'days'     => 3,
			'seats'    => 18,
			'weeks'    => 26,
			'cadence'  => array(
				array( 'dow' => 'Mon', 'slot' => 'morning' ),
				array( 'dow' => 'Wed', 'slot' => 'morning' ),
				array( 'dow' => 'Fri', 'slot' => 'afternoon' ),   // Friday always afternoon
			),
			'proof'    => array( 'SPCT-led', '18 seats max', 'Exam fee included' ),
		),
	);
}

/**
 * Days no class may touch — not as a start, not as an end, not in between.
 *
 * This is the HARD list, and it is short on purpose: only the two days nobody
 * will sit in a classroom. Every other public holiday is handled the opposite
 * way, by aa_reg_holidays() below — offered rather than removed.
 */
function aa_reg_blackout() {
	return array(
		'12-25',   // Christmas Day
		'01-01',   // New Year's Day
	);
}

/**
 * North American public holidays for one year, as Y-m-d => label.
 *
 * These are NOT blackouts. A Monday public holiday makes the long weekend that
 * people plan training around — Labour Day, Memorial Day, Family Day — and the
 * class that starts on it is one of the easiest to fill. So a Monday holiday
 * produces TWO offers: the holiday Monday itself, and the next working day for
 * anyone who does want the day off. That is an addition to the cadence, not a
 * substitution.
 *
 * Covers both countries because the audience spans both. Dates are computed,
 * not tabulated, so this does not expire: PHP's relative formats give the
 * nth-weekday rules exactly, and Good Friday hangs off easter_date() where the
 * calendar extension is present.
 */
function aa_reg_holidays( $year ) {
	$y = (int) $year;
	$d = function ( $expr ) use ( $y ) {
		return date( 'Y-m-d', strtotime( $expr . ' ' . $y ) );
	};
	$out = array(
		$y . '-01-01'                              => "New Year's Day",
		$d( 'third monday of february' )           => 'Family Day / Presidents Day',
		$d( 'last monday of may' )                 => 'Memorial Day',
		$d( 'monday this week', 0 )                => '',   // placeholder, removed below
		$y . '-06-19'                              => 'Juneteenth',
		$y . '-07-01'                              => 'Canada Day',
		$y . '-07-04'                              => 'Independence Day',
		$d( 'first monday of august' )             => 'Civic Holiday',
		$d( 'first monday of september' )          => 'Labour Day',
		$d( 'second monday of october' )           => 'Thanksgiving (CA) / Indigenous Peoples Day',
		$y . '-11-11'                              => 'Remembrance Day / Veterans Day',
		$d( 'fourth thursday of november' )        => 'Thanksgiving (US)',
		$y . '-12-25'                              => 'Christmas Day',
		$y . '-12-26'                              => 'Boxing Day',
	);
	unset( $out[ $d( 'monday this week', 0 ) ] );

	// Victoria Day: the Monday on or before 24 May.
	$vic = new DateTime( $y . '-05-24' );
	$vic->modify( 'monday this week' );
	if ( $vic > new DateTime( $y . '-05-24' ) ) { $vic->modify( '-1 week' ); }
	$out[ $vic->format( 'Y-m-d' ) ] = 'Victoria Day';

	if ( function_exists( 'easter_date' ) ) {
		$out[ date( 'Y-m-d', strtotime( '-2 days', easter_date( $y ) ) ) ] = 'Good Friday';
	}
	unset( $out[''] );
	return $out;
}

/** True when this date is a public holiday in either country. */
function aa_reg_is_holiday( $ymd ) {
	static $cache = array();
	$y = substr( $ymd, 0, 4 );
	if ( ! isset( $cache[ $y ] ) ) { $cache[ $y ] = aa_reg_holidays( $y ); }
	return isset( $cache[ $y ][ $ymd ] );
}

/** The next day that is neither a weekend nor a public holiday. */
function aa_reg_next_working_day( $ymd ) {
	$d = new DateTime( $ymd );
	for ( $i = 0; $i < 10; $i++ ) {
		$d->modify( '+1 day' );
		$dow = (int) $d->format( 'N' );
		if ( $dow >= 6 ) { continue; }
		if ( aa_reg_is_holiday( $d->format( 'Y-m-d' ) ) ) { continue; }
		return $d->format( 'Y-m-d' );
	}
	return null;
}

/**
 * Weekday or weekend, judged by the WHOLE span, not the start day.
 *
 * A Monday-to-Thursday class is a weekday class. The Thursday start of the
 * same cadence runs Thursday to Sunday and is the weekend option — which is
 * exactly how these courses offer one: there is no Saturday start, the weekend
 * option is the mid-week start that carries over. Classifying by start day
 * called every Mon+Thu batch "weekday" and left the weekend filter empty.
 */
function aa_reg_kind( $start, $days ) {
	$d = new DateTime( $start );
	for ( $i = 0; $i < max( 1, (int) $days ); $i++ ) {
		if ( (int) $d->format( 'N' ) >= 6 ) { return 'weekend'; }
		$d->modify( '+1 day' );
	}
	return 'weekday';
}

/** How many replacement starts to offer when the rule drops a scheduled one. */
function aa_reg_backfill() { return 2; }

function aa_reg_is_blacked( $ymd ) {
	$b = aa_reg_blackout();
	return in_array( substr( $ymd, 5 ), $b, true ) || in_array( $ymd, $b, true );
}

/** True when no day of the span touches a blackout date. */
function aa_reg_span_ok( $start, $days ) {
	$d = new DateTime( $start );
	for ( $i = 0; $i < max( 1, (int) $days ); $i++ ) {
		if ( aa_reg_is_blacked( $d->format( 'Y-m-d' ) ) ) { return false; }
		$d->modify( '+1 day' );
	}
	return true;
}

function aa_reg_slot_label( $slot ) {
	return $slot === 'afternoon' ? 'Weekday afternoon batch'
	     : ( $slot === 'evening' ? 'Evening batch' : 'Weekday morning batch' );
}
function aa_reg_slot_hours( $slot ) {
	return $slot === 'afternoon' ? '1–9 ET' : ( $slot === 'evening' ? '6–10 ET' : '9–5 ET' );
}

/**
 * Turn the cadence into dated cohorts, holiday rule applied.
 *
 * Blocked starts are not simply dropped — a fortnight with no ASPC in it is a
 * fortnight of lost bookings. Each blocked start is replaced by the next
 * available day(s), weekends included, which is how "no class starts Thu 24
 * Dec, but classes start 26, 27 and 28 Dec" comes out of the same rule rather
 * than being typed in.
 */
function aa_reg_generate( $slug, $course ) {
	static $memo = array();
	$tz    = new DateTimeZone( 'America/New_York' );
	$today = new DateTime( 'now', $tz );
	$today->setTime( 0, 0, 0 );
	$key   = $slug . '|' . $today->format( 'Y-m-d' );
	if ( isset( $memo[ $key ] ) ) { return $memo[ $key ]; }

	$days  = max( 1, (int) $course['days'] );
	$weeks = max( 1, (int) ( isset( $course['weeks'] ) ? $course['weeks'] : 26 ) );
	$limit = ( clone $today )->modify( '+' . $weeks . ' weeks' );

	$taken   = array();   // start date => true, so backfill cannot collide
	$planned = array();   // every cadence start in the window, valid or not

	foreach ( (array) $course['cadence'] as $rule ) {
		$d = clone $today;
		// first occurrence of this weekday on or after today
		$d->modify( 'this week ' . $rule['dow'] );
		if ( $d < $today ) { $d->modify( '+1 week' ); }
		while ( $d <= $limit ) {
			$planned[] = array( 'start' => $d->format( 'Y-m-d' ), 'slot' => $rule['slot'] );
			$d->modify( '+1 week' );
		}
	}
	usort( $planned, function ( $a, $b ) { return strcmp( $a['start'], $b['start'] ); } );

	/* TWO PASSES, and the order matters. Scheduled classes are placed first,
	   then blocked ones look for replacement days among what is left. Done in
	   one pass, a backfill searching forward from a blocked Friday would claim
	   the following Monday before the Monday rule got there — and the real
	   Monday morning class would vanish, replaced by an "afternoon" class on a
	   Monday, inheriting the slot of the Friday it stood in for. */
	$out     = array();
	$blocked = array();
	foreach ( $planned as $p ) {
		if ( ! aa_reg_span_ok( $p['start'], $days ) ) { $blocked[] = $p; continue; }
		if ( isset( $taken[ $p['start'] ] ) ) { continue; }
		$taken[ $p['start'] ] = true;
		$out[] = aa_reg_make( $slug, $course, $p['start'], $p['slot'] );

		/* A public holiday on a cadence day is an opportunity, not an
		   obstacle. The long weekend it makes — Labour Day, Memorial Day,
		   Family Day — is when people can take training without spending
		   leave, so that start stays. Alongside it goes the next working day,
		   for everyone who wants the holiday off. Two offers where the
		   calendar would otherwise force a choice. */
		if ( aa_reg_is_holiday( $p['start'] ) ) {
			$twin = aa_reg_next_working_day( $p['start'] );
			if ( $twin && ! isset( $taken[ $twin ] ) && aa_reg_span_ok( $twin, $days )
				&& new DateTime( $twin, $tz ) <= $limit ) {
				$taken[ $twin ] = true;
				$out[] = aa_reg_make( $slug, $course, $twin, $p['slot'], 'twin' );
			}
		}
	}
	foreach ( $blocked as $p ) {
		$added = 0;
		$probe = new DateTime( $p['start'], $tz );
		for ( $i = 1; $i <= 7 && $added < aa_reg_backfill(); $i++ ) {
			$probe->modify( '+1 day' );
			if ( $probe > $limit ) { break; }
			$cand = $probe->format( 'Y-m-d' );
			if ( isset( $taken[ $cand ] ) || ! aa_reg_span_ok( $cand, $days ) ) { continue; }
			$taken[ $cand ] = true;
			$out[] = aa_reg_make( $slug, $course, $cand, $p['slot'], 'backfill' );
			$added++;
		}
	}
	usort( $out, function ( $a, $b ) { return strcmp( $a['start'], $b['start'] ); } );
	return $memo[ $key ] = $out;
}

function aa_reg_make( $slug, $course, $start, $slot, $reason = '' ) {
	$days = max( 1, (int) $course['days'] );
	$end  = ( new DateTime( $start ) )->modify( '+' . ( $days - 1 ) . ' day' );
	$kind = aa_reg_kind( $start, $days );
	// Say WHY an off-cadence date exists. "added date" on the Tuesday after
	// Labour Day reads like padding; "after the holiday" tells the buyer it is
	// the alternative to the long-weekend class sitting right above it.
	$note = '';
	if ( aa_reg_is_holiday( $start ) )   { $note = ' · long weekend'; }
	elseif ( $reason === 'twin' )        { $note = ' · after the holiday'; }
	elseif ( $reason === 'backfill' )    { $note = ' · added date'; }
	return array(
		'id'    => $slug . '-' . $start,
		'start' => $start,
		'end'   => $end->format( 'Y-m-d' ),
		'slot'  => $slot,
		'kind'  => $kind,
		'seats' => (int) ( isset( $course['seats'] ) ? $course['seats'] : 18 ),
		'batch' => ( $kind === 'weekend' ? 'Weekend batch' : aa_reg_slot_label( $slot ) ) . $note,
		'hours' => aa_reg_slot_hours( $slot ),
	);
}

/** Room size minus seats already sold. Never trusts a client-supplied count. */
function aa_reg_seats_left( $course, $cohort ) {
	$sold = (array) get_option( 'aa_reg_sold', array() );
	$n    = (int) $cohort['seats'] - ( isset( $sold[ $cohort['id'] ] ) ? (int) $sold[ $cohort['id'] ] : 0 );
	return max( 0, $n );
}

/** Hard ceiling on one order, so a typo in the stepper cannot buy the room. */
function aa_reg_max_seats() { return 12; }

/** One cohort by id, with its course. Returns null for anything unrecognised. */
function aa_reg_find( $cohort_id ) {
	foreach ( aa_reg_courses() as $slug => $course ) {
		foreach ( aa_reg_generate( $slug, $course ) as $c ) {
			if ( $c['id'] === $cohort_id ) {
				return array( 'slug' => $slug, 'course' => $course, 'cohort' => $c );
			}
		}
	}
	return null;
}

/**
 * Stripe credentials. Constants win over options so wp-config.php can hold
 * them; the options exist because this site installs code by pasting, not by
 * editing files.
 */
function aa_reg_key( $which ) {
	if ( $which === 'secret' ) {
		if ( defined( 'AA_STRIPE_SECRET' ) && AA_STRIPE_SECRET ) { return AA_STRIPE_SECRET; }
		return (string) get_option( 'aa_reg_stripe_secret', '' );
	}
	if ( defined( 'AA_STRIPE_WEBHOOK_SECRET' ) && AA_STRIPE_WEBHOOK_SECRET ) { return AA_STRIPE_WEBHOOK_SECRET; }
	return (string) get_option( 'aa_reg_stripe_webhook', '' );
}

/** Charging is off until prices are confirmed AND a secret key exists. */
function aa_reg_is_live() {
	return get_option( 'aa_reg_prices_confirmed' ) === 'yes' && aa_reg_key( 'secret' ) !== '';
}

/* ============================================================================
   SETTINGS  —  Settings -> AA Registration
   Keys and the go-live switch live here rather than in the snippet body.
   ========================================================================== */
add_action( 'admin_menu', function () {
	add_options_page( 'AA Registration', 'AA Registration', 'manage_options', 'aa-reg', 'aa_reg_settings_page' );
} );

add_action( 'admin_init', function () {
	register_setting( 'aa_reg', 'aa_reg_stripe_secret', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'aa_reg', 'aa_reg_stripe_webhook', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'aa_reg', 'aa_reg_prices_confirmed', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	register_setting( 'aa_reg', 'aa_reg_autoplace', array( 'sanitize_callback' => 'sanitize_text_field' ) );
} );

function aa_reg_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) { return; }
	$live = aa_reg_is_live();
	echo '<div class="wrap"><h1>AA Registration</h1>';
	echo '<p style="font-size:14px">Checkout is <strong>' . ( $live ? 'LIVE — cards will be charged' : 'OFF — the register button is disabled' ) . '</strong>.</p>';
	echo '<form method="post" action="options.php">';
	settings_fields( 'aa_reg' );
	echo '<table class="form-table">';
	echo '<tr><th scope="row">Stripe secret key</th><td><input type="password" name="aa_reg_stripe_secret" value="' . esc_attr( get_option( 'aa_reg_stripe_secret', '' ) ) . '" class="regular-text" autocomplete="off">'
	   . '<p class="description">Starts <code>sk_live_</code> or <code>sk_test_</code>. Use a test key first. Ignored if wp-config.php defines AA_STRIPE_SECRET.</p></td></tr>';
	echo '<tr><th scope="row">Stripe webhook secret</th><td><input type="password" name="aa_reg_stripe_webhook" value="' . esc_attr( get_option( 'aa_reg_stripe_webhook', '' ) ) . '" class="regular-text" autocomplete="off">'
	   . '<p class="description">Starts <code>whsec_</code>. From the Stripe webhook you point at <code>' . esc_html( home_url( '/wp-json/aa/v1/stripe-webhook' ) ) . '</code> for <code>checkout.session.completed</code>.</p></td></tr>';
	echo '<tr><th scope="row">Prices confirmed</th><td><label><input type="checkbox" name="aa_reg_prices_confirmed" value="yes"' . checked( get_option( 'aa_reg_prices_confirmed' ), 'yes', false ) . '> I have checked every price and currency in the snippet against what we actually charge.</label>'
	   . '<p class="description">Until this is ticked nothing can be charged. The prices in the code were transcribed from the live course pages and never verified against finance.</p></td></tr>';
	echo '<tr><th scope="row">Replace the hero and the Fluent Form</th><td><label><input type="checkbox" name="aa_reg_autoplace" value="yes"' . checked( get_option( 'aa_reg_autoplace' ), 'yes', false ) . '> On course pages, swap the old hero for the new one and the Fluent Form for the new registration.</label>'
	   . '<p class="description">No page edits either way &mdash; the swap happens as the page renders, and unticking this puts the old hero and form straight back. Applies only to pages whose slug has a row in <code>aa_reg_courses()</code>: <code>'
	   . esc_html( implode( '</code>, <code>', array_keys( aa_reg_courses() ) ) ) . '</code>. Leave this off if you would rather place <code>[aa_course_hero]</code> and <code>[aa_course_register]</code> in the pages by hand.</p></td></tr>';
	echo '</table>';
	submit_button();
	echo '</form>';

	echo '<h2>Seats sold</h2><table class="widefat striped" style="max-width:640px"><thead><tr><th>Cohort</th><th>Price</th><th>Capacity</th><th>Sold</th><th>Left</th></tr></thead><tbody>';
	foreach ( aa_reg_courses() as $slug => $course ) {
		foreach ( aa_reg_generate( $slug, $course ) as $c ) {
			$sold = (array) get_option( 'aa_reg_sold', array() );
			echo '<tr><td><code>' . esc_html( $c['id'] ) . '</code></td>'
			   . '<td>' . esc_html( strtoupper( $course['currency'] ) . ' ' . number_format_i18n( $course['price'] ) ) . '</td>'
			   . '<td>' . (int) $c['seats'] . '</td>'
			   . '<td>' . ( isset( $sold[ $c['id'] ] ) ? (int) $sold[ $c['id'] ] : 0 ) . '</td>'
			   . '<td>' . aa_reg_seats_left( $course, $c ) . '</td></tr>';
		}
	}
	echo '</tbody></table></div>';
}

/* Registrations are posts so they are searchable and exportable like anything
   else in wp-admin, rather than rows only this code knows how to read. */
add_action( 'init', function () {
	register_post_type( 'aa_registration', array(
		'label'           => 'Registrations',
		'public'          => false,
		'show_ui'         => true,
		'show_in_menu'    => true,
		'menu_icon'       => 'dashicons-tickets-alt',
		'capability_type' => 'post',
		'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
		'map_meta_cap'    => true,
		'supports'        => array( 'title', 'custom-fields' ),
	) );
} );

/* ============================================================================
   MARKUP
   ========================================================================== */

/** "Oct 5–8, 2026" / "Oct 29 – Nov 1, 2026". */
function aa_reg_range( $start, $end, $short = false ) {
	$tz = new DateTimeZone( 'America/New_York' );
	$s  = new DateTime( $start, $tz );
	$e  = new DateTime( $end, $tz );
	$y  = $short ? '' : ', ' . $e->format( 'Y' );
	if ( $s->format( 'Y-m' ) === $e->format( 'Y-m' ) ) {
		return $s->format( 'M j' ) . '–' . $e->format( 'j' ) . $y;
	}
	return $s->format( 'M j' ) . ' – ' . $e->format( 'M j' ) . $y;
}

function aa_reg_money( $amount, $currency ) {
	$sym = strtolower( $currency ) === 'cad' ? 'C$' : ( strtolower( $currency ) === 'eur' ? '€' : '$' );
	return $sym . number_format_i18n( (float) $amount );
}

/** Upcoming cohorts only, grouped by month index, in date order. */
function aa_reg_upcoming( $slug, $course ) {
	$today = ( new DateTime( 'now', new DateTimeZone( 'America/New_York' ) ) )->format( 'Y-m-d' );
	$out   = array();
	foreach ( aa_reg_generate( $slug, $course ) as $c ) {
		if ( $c['end'] < $today ) { continue; }          // finished classes are not offers
		if ( aa_reg_seats_left( $course, $c ) < 1 ) { continue; }   // sold out
		$out[] = $c;
	}
	usort( $out, function ( $a, $b ) { return strcmp( $a['start'], $b['start'] ); } );
	return $out;
}

function aa_reg_month_key( $iso ) { return (int) substr( $iso, 5, 2 ); }
function aa_reg_month_label( $iso ) {
	return ( new DateTime( $iso ) )->format( 'M Y' );
}

/** Shared: month tab rail + panels, for whichever component asks. */
function aa_reg_months( $cohorts ) {
	$by = array();
	foreach ( $cohorts as $c ) {
		$k = aa_reg_month_key( $c['start'] ) . '-' . substr( $c['start'], 0, 4 );
		if ( ! isset( $by[ $k ] ) ) {
			$by[ $k ] = array(
				'label' => aa_reg_month_label( $c['start'] ),
				'long'  => ( new DateTime( $c['start'] ) )->format( 'F Y' ),
				'items' => array(),
			);
		}
		$by[ $k ]['items'][] = $c;
	}
	return $by;
}

/** Above this many batches in a month, the picker switches from cards to rows.
    Four is where the design says date cards stop working, and it matches what
    a two-up card grid can show without becoming a wall. */
function aa_reg_dense_at() { return 4; }

function aa_reg_batches_label( $n ) {
	return $n === 1 ? '1 batch' : $n . ' batches';
}

/** Group a month's cohorts under the Monday of their week. */
function aa_reg_by_week( $items ) {
	$weeks = array();
	foreach ( $items as $c ) {
		$d = new DateTime( $c['start'] );
		$d->modify( 'monday this week' );
		$k = $d->format( 'Y-m-d' );
		if ( ! isset( $weeks[ $k ] ) ) { $weeks[ $k ] = array( 'monday' => $k, 'items' => array() ); }
		$weeks[ $k ]['items'][] = $c;
	}
	ksort( $weeks );
	return $weeks;
}

/**
 * The month tab rail. Hero and schedule both need one, identically wired —
 * roving tabindex, aria-controls, the long month name for the heading — and
 * two copies of that is two places for an a11y detail to rot.
 */
function aa_reg_tabs( $prefix, $months ) {
	$h = '<nav class="' . $prefix . '-tabs" role="tablist" aria-label="Choose a month">';
	$i = 0;
	foreach ( $months as $k => $m ) {
		$on = $i === 0;
		$h .= '<button type="button" role="tab" class="' . $prefix . '-tab' . ( $on ? ' is-on' : '' ) . '"'
		    . ' id="' . $prefix . '-tab-' . esc_attr( $k ) . '" aria-selected="' . ( $on ? 'true' : 'false' ) . '"'
		    . ' aria-controls="' . $prefix . '-panel-' . esc_attr( $k ) . '" data-month="' . esc_attr( $k ) . '"'
		    . ' data-month-name="' . esc_attr( $m['long'] ) . '"'
		    . ( $on ? '' : ' tabindex="-1"' ) . '>' . esc_html( $m['label'] ) . '</button>';
		$i++;
	}
	return $h . '</nav>';
}

/**
 * One batch as a single-line row, for either component.
 *
 * $prefix switches the class namespace so the hero keeps its own selectors
 * (its JS binds .aahero-card / .aahero-cardbtn) while sharing this markup and
 * every rule that decides what a row says — the kind, the seat state, the
 * holiday note. Two renderers meant two chances to disagree about what a
 * batch is called.
 */
function aa_reg_row( $course, $c, $is_first, $cur, $prefix = 'aacal' ) {
	$left  = aa_reg_seats_left( $course, $c );
	$hot   = $left <= 6;
	$kind  = isset( $c['kind'] ) ? $c['kind'] : aa_reg_kind( $c['start'], $course['days'] );
	$start = new DateTime( $c['start'] );
	return '<article class="' . $prefix . '-card' . ( $is_first ? ' is-on' : '' ) . '"'
	     . ' data-cohort="' . esc_attr( $c['id'] ) . '" data-kind="' . esc_attr( $kind ) . '"'
	     . ' data-start="' . esc_attr( $c['start'] ) . '" data-end="' . esc_attr( $c['end'] ) . '"'
	     . ' data-range="' . esc_attr( aa_reg_range( $c['start'], $c['end'] ) ) . '"'
	     . ' data-batch="' . esc_attr( $c['batch'] ) . '"'
	     . ' data-price="' . (int) $course['price'] . '"'
	     . ' data-short="' . esc_attr( aa_reg_range( $c['start'], $c['end'], true ) ) . '"'
	     . ' data-seats-left="' . (int) $left . '">'
	     . '<button type="button" class="' . $prefix . '-cardbtn" aria-pressed="' . ( $is_first ? 'true' : 'false' ) . '">'
	     . '<span class="' . $prefix . '-date"><span class="' . $prefix . '-daynum">' . esc_html( $start->format( 'j' ) ) . '</span>'
	     . '<span class="' . $prefix . '-daymon">' . esc_html( strtoupper( $start->format( 'M' ) ) ) . '</span></span>'
	     . '<span class="' . $prefix . '-body">'
	     . '<span class="' . $prefix . '-line"><span class="' . $prefix . '-range">'
	     . esc_html( aa_reg_range( $c['start'], $c['end'], true ) ) . '</span>'
	     . ( $is_first ? '<span class="' . $prefix . '-flag">Next available</span>' : '' ) . '</span>'
	     . '<span class="' . $prefix . '-line2"><span class="' . $prefix . '-kind">'
	     . esc_html( ucfirst( $kind ) . ' · ' . $c['hours'] ) . '</span>'
	     . '<span class="' . $prefix . '-status' . ( $hot ? ' is-hot' : '' ) . '">'
	     . esc_html( $hot ? sprintf( '%d seats left', $left ) : 'Seats open' ) . '</span></span>'
	     . '</span>'
	     . '<span class="' . $prefix . '-price">' . esc_html( aa_reg_money( $course['price'], $cur ) ) . '</span>'
	     . '<span class="' . $prefix . '-check" aria-hidden="true">&#10003;</span>'
	     . '</button></article>';
}

function aa_reg_hero( $atts ) {
	$a       = shortcode_atts( array( 'course' => 'spc' ), $atts, 'aa_course_hero' );
	$courses = aa_reg_courses();
	if ( ! isset( $courses[ $a['course'] ] ) ) { return ''; }
	$course  = $courses[ $a['course'] ];
	$cohorts = aa_reg_upcoming( $a['course'], $course );
	if ( ! $cohorts ) { return ''; }
	$months  = aa_reg_months( $cohorts );
	$first   = $cohorts[0];
	$cur     = $course['currency'];

	$h  = '<section class="aahero" id="aahero" aria-labelledby="aahero-title"><div class="aahero-shell">';
	$h .= '<div class="aahero-copy">';
	$h .= '<p class="aahero-eyebrow">' . esc_html( $course['eyebrow'] ) . '</p>';
	$h .= '<h1 class="aahero-h1" id="aahero-title">' . esc_html( $course['h1'] ) . '</h1>';
	$h .= '<p class="aahero-lede">' . esc_html( $course['lede'] ) . '</p>';
	$h .= '<ul class="aahero-proof">';
	foreach ( $course['proof'] as $p ) { $h .= '<li>' . esc_html( $p ) . '</li>'; }
	$h .= '</ul>';
	$h .= '<div class="aahero-facts"><div><p class="aahero-minilabel">Next batch</p>'
	    . '<p class="aahero-fact" data-hero-range>' . esc_html( aa_reg_range( $first['start'], $first['end'] ) ) . '</p></div>'
	    . '<span class="aahero-rule" aria-hidden="true"></span>'
	    . '<div><p class="aahero-minilabel">Investment</p><p class="aahero-fact">'
	    . esc_html( aa_reg_money( $course['price'], $course['currency'] ) )
	    . ' <span class="aahero-factnote">exam included</span></p></div></div>';
	$h .= '</div>';

	$h .= '<div class="aahero-picker"><div class="aahero-pickhead">'
	    . '<p class="aahero-picktitle">Pick your dates</p>'
	    . '<p class="aahero-picknote">' . esc_html( sprintf( _n( '%d batch scheduled', '%d batches scheduled', count( $cohorts ) ), count( $cohorts ) ) ) . '</p></div>';

	$h .= aa_reg_tabs( 'aahero', $months );

	$i = 0;
	foreach ( $months as $k => $m ) {
		$h .= '<div class="aahero-list" role="tabpanel" id="aahero-panel-' . esc_attr( $k ) . '"'
		    . ' aria-labelledby="aahero-tab-' . esc_attr( $k ) . '" data-month="' . esc_attr( $k ) . '"'
		    . ( $i === 0 ? '' : ' hidden' ) . '>';
		/* The hero lists the nearest few per month, not the whole cadence: at
		   two starts a week that is nine cards in a month tab, which is a
		   scrolling list where a glanceable picker should be. The complete
		   schedule is the panel below. */
		/* Same row renderer as the schedule below, in the hero's namespace. The
		   compact row fits more dates in the picker's fixed height than a card
		   did, and the hero and the list now say the same thing about a batch
		   because one function decides it. */
		foreach ( array_slice( $m['items'], 0, 4 ) as $c ) {
			$h .= aa_reg_row( $course, $c, $c['id'] === $first['id'], $cur, 'aahero' );
		}
		$h .= '</div>';
		$i++;
	}

	$h .= '<a class="aahero-cta" href="#aacal-form" data-hero-cta>Reserve <span data-hero-short>'
	    . esc_html( aa_reg_range( $first['start'], $first['end'], true ) ) . '</span> &#10230;</a>';
	$h .= '<p class="aahero-hint">Takes you to the form below</p>';
	$h .= '<p class="aahero-private">Dates don\'t work? <a href="/contact/">Ask for a private cohort</a></p>';
	$h .= '</div></div>';

	/* The stats bar carries only figures already published elsewhere on the
	   site. The handoff's placeholders — "4.9/5 from 380 alumni", "92%
	   first-attempt pass" — are deliberately not here: a visible star rating
	   is the aggregateRating claim that was stripped from 23 pages, and a
	   pass-rate figure is the pass-guarantee wording the copy rule forbids. */
	$h .= '<div class="aahero-bar"><p class="aahero-scroll">Scroll for the full schedule and registration &#8595;</p>'
	    . '<ul class="aahero-stats"><li><strong>2,500+</strong> trained</li>'
	    . '<li><strong>80+</strong> ARTs launched</li>'
	    . '<li><strong>Exam fee</strong> included</li></ul></div>';
	$h .= '</section>';
	return $h;
}
add_shortcode( 'aa_course_hero', 'aa_reg_hero' );

function aa_reg_panel( $atts ) {
	$a       = shortcode_atts( array( 'course' => 'spc' ), $atts, 'aa_course_register' );
	$courses = aa_reg_courses();
	if ( ! isset( $courses[ $a['course'] ] ) ) { return ''; }
	$course  = $courses[ $a['course'] ];
	$cohorts = aa_reg_upcoming( $a['course'], $course );
	if ( ! $cohorts ) { return ''; }
	$months  = aa_reg_months( $cohorts );
	$first   = $cohorts[0];
	$live    = aa_reg_is_live();
	$cur     = $course['currency'];

	$h  = '<section class="aacal" id="aacal" aria-labelledby="aacal-title">';
	$h .= '<a class="aacal-skip" href="#aacal-form">Skip to the registration form</a>';
	$h .= '<div class="aacal-shell"><div class="aacal-left">';

	$first_month = key( $months );
	$h .= '<div class="aacal-lefthead"><div>'
	    . '<p class="aacal-eyebrow">' . esc_html( $course['code'] . ' · ' . $course['days'] . ' days' ) . '</p>'
	    . '<h2 class="aacal-h2" id="aacal-title" data-month-label>' . esc_html( $months[ $first_month ]['long'] ) . '</h2></div>'
	    . '<p class="aacal-count" data-count aria-live="polite">'
	    . esc_html( aa_reg_batches_label( count( $months[ $first_month ]['items'] ) ) ) . '</p></div>';

	$h .= aa_reg_tabs( 'aacal', $months );

	/* The weekday/weekend chips only earn their space once a month is dense
	   enough to need cutting down. At two starts a week a month holds eight or
	   nine batches and the filter is the point of the design; on a course that
	   runs twice a month it is three controls that do nothing. */
	$dense_anywhere = false;
	foreach ( $months as $m ) {
		if ( count( $m['items'] ) > aa_reg_dense_at() ) { $dense_anywhere = true; break; }
	}
	/* Only offer a filter that can return something. SPC and ASPC run Monday
	   and Thursday, so "Weekend" would match nothing all year except the odd
	   holiday replacement — a chip that always yields "0 of 8 batches" is
	   worse than no chip. Checked against the whole schedule, not the visible
	   month, so the chip row does not appear and disappear while tabbing. */
	$kinds = array();
	foreach ( $months as $m ) {
		foreach ( $m['items'] as $c ) {
			$kinds[ isset( $c['kind'] ) ? $c['kind'] : 'weekday' ] = true;
		}
	}
	if ( $dense_anywhere && count( $kinds ) > 1 ) {
		$h .= '<div class="aacal-filters" role="group" aria-label="Filter batches">'
		    . '<span class="aacal-filterlabel">Show</span>'
		    . '<button type="button" class="aacal-chip is-on" data-filter="all" aria-pressed="true">All batches</button>';
		if ( isset( $kinds['weekday'] ) ) {
			$h .= '<button type="button" class="aacal-chip" data-filter="weekday" aria-pressed="false">Weekday</button>';
		}
		if ( isset( $kinds['weekend'] ) ) {
			$h .= '<button type="button" class="aacal-chip" data-filter="weekend" aria-pressed="false">Weekend</button>';
		}
		$h .= '</div>';
	}

	$i = 0;
	foreach ( $months as $k => $m ) {
		$dense = count( $m['items'] ) > aa_reg_dense_at();
		$h .= '<div class="aacal-panel-month' . ( $dense ? '' : ' is-sparse' ) . '" role="tabpanel"'
		    . ' id="aacal-panel-' . esc_attr( $k ) . '" aria-labelledby="aacal-tab-' . esc_attr( $k ) . '"'
		    . ' data-month="' . esc_attr( $k ) . '"' . ( $i === 0 ? '' : ' hidden' ) . '>';

		// Week groups turn one long month into three or four short lists.
		foreach ( aa_reg_by_week( $m['items'] ) as $week ) {
			$h .= '<section class="aacal-week" data-week><div class="aacal-weekhead">'
			    . '<h3>' . esc_html( 'Week of ' . ( new DateTime( $week['monday'] ) )->format( 'M j' ) ) . '</h3>'
			    . '<p data-week-count>' . esc_html( aa_reg_batches_label( count( $week['items'] ) ) ) . '</p>'
			    . '</div><div class="aacal-rows">';
			foreach ( $week['items'] as $c ) {
				$h .= aa_reg_row( $course, $c, $c['id'] === $first['id'], $cur );
			}
			$h .= '</div></section>';
		}
		$h .= '</div>';
		$i++;
	}

	$h .= '<p class="aacal-empty" data-empty hidden>No batches match that filter this month · '
	    . '<button type="button" class="aacal-link" data-filter="all">Show all batches</button></p>';
	$h .= '<p class="aacal-note">All batches run live online in English. <a href="/contact/">Need private dates?</a></p>';
	$h .= '</div>';

	/* ---- right: two-step form ---- */
	$h .= '<div class="aacal-right" id="aacal-form">';
	// .aacal-num is not decoration: goStep() swaps its text to a tick as the
	// wizard advances, and a bare <span> makes that a null dereference.
	$h .= '<ol class="aacal-steps"><li class="aacal-step is-on" data-step="1"><span class="aacal-num">1</span> Your details</li>'
	    . '<li class="aacal-step" data-step="2"><span class="aacal-num">2</span> Review &amp; pay</li></ol>';
	$h .= '<div class="aacal-selected" aria-live="polite">'
	    . '<p class="aacal-sel-label" data-sel-label>Selected · next available</p>'
	    . '<p class="aacal-sel-range" data-sel-range>' . esc_html( aa_reg_range( $first['start'], $first['end'] ) ) . '</p>'
	    . '<p class="aacal-sel-batch" data-sel-batch>' . esc_html( $first['batch'] ) . '</p></div>';

	/* ONE FIELD. Everything else — cardholder name, billing address, the card —
	   Stripe collects on its own page, and asking for it here first is asking
	   twice. The email stays because it prefills Stripe and because it is the
	   only record of someone who abandons at the payment step. */
	$h .= '<form class="aacal-panel" data-panel="1" novalidate>'
	    . '<label class="aacal-field"><span class="aacal-sr">Work email</span>'
	    . '<input name="email" type="email" autocomplete="email" inputmode="email"'
	    . ' placeholder="Work email" required></label>'
	    . '<div class="aacal-seatsrow"><div><p class="aacal-minilabel">Seats</p>'
	    . '<div class="aacal-stepper"><button type="button" data-seats="-1" aria-label="Fewer seats">&minus;</button>'
	    . '<span data-seats-value aria-live="polite">1</span>'
	    . '<button type="button" data-seats="1" aria-label="More seats">+</button></div></div>'
	    . '<div class="aacal-totalbox"><p class="aacal-minilabel">Total</p>'
	    . '<p class="aacal-total" data-total>' . esc_html( aa_reg_money( $course['price'], $cur ) ) . '</p></div></div>'
	    . '<button type="submit" class="aacal-cta" data-next disabled>Continue to review</button>'
	    . '<p class="aacal-hint" data-hint>Enter your work email to continue.</p>'
	    . '</form>';

	$h .= '<form class="aacal-panel" data-panel="2" hidden novalidate>'
	    . '<dl class="aacal-review">'
	    . '<div><dt>Course</dt><dd>' . esc_html( $course['name'] ) . '</dd></div>'
	    . '<div><dt>Dates</dt><dd data-rev-dates></dd></div>'
	    . '<div><dt>Email</dt><dd data-rev-email>&mdash;</dd></div>'
	    . '<div><dt>Seats</dt><dd data-rev-seats>1</dd></div>'
	    . '<div class="aacal-review-total"><dt>Total &middot; exam fee included</dt>'
	    . '<dd data-rev-total>' . esc_html( aa_reg_money( $course['price'], $cur ) ) . '</dd></div></dl>'
	    . '<label class="aacal-consent"><input type="checkbox" name="consent" required>'
	    . '<span>I agree to the <a href="/terms/">booking terms</a> and to processing my details for this registration.</span></label>'
	    . '<button type="submit" class="aacal-cta" data-pay disabled>'
	    . esc_html( $live ? 'Pay securely with Stripe' : 'Registration temporarily unavailable' ) . '</button>'
	    . '<div class="aacal-backrow"><button type="button" class="aacal-link" data-back>&larr; Edit details</button></div>'
	    . '<p class="aacal-hint" data-hint2>'
	    . esc_html( $live
	        ? 'You will be taken to Stripe to pay. We never see your card details.'
	        : 'Online payment is switched off right now — please contact us and we will register you.' )
	    . '</p></form>';

	$h .= '<div class="aacal-done" data-panel="done" hidden role="status">'
	    . '<p class="aacal-done-h">You\'re in, <span data-done-name>there</span>.</p>'
	    . '<p class="aacal-done-p"><span data-done-summary></span>. Your receipt and joining details are on the way to <span data-done-email>your inbox</span>.</p>'
	    . '<button type="button" class="aacal-link" data-reset>Book another seat</button></div>';

	$h .= '<p class="aacal-fine">Free reschedule up to 10 days before the batch starts. The exam fee is included in the price.</p>';
	$h .= '</div></div>';

	/* Offers describe what is actually purchasable: price, currency, and
	   availability derived from real remaining seats. */
	$instances = array();
	foreach ( $cohorts as $c ) {
		$left = aa_reg_seats_left( $course, $c );
		$instances[] = array(
			'@type'      => 'CourseInstance',
			'courseMode' => 'online',
			'startDate'  => $c['start'],
			'endDate'    => $c['end'],
			'location'   => array( '@type' => 'VirtualLocation', 'url' => home_url( $course['url'] ) ),
			'offers'     => array(
				'@type'         => 'Offer',
				'price'         => (string) $course['price'],
				'priceCurrency' => strtoupper( $cur ),
				'availability'  => $left <= 6 ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
				'url'           => home_url( $course['url'] ),
			),
		);
	}
	$h .= '<script type="application/ld+json">' . wp_json_encode( array(
		'@context'          => 'https://schema.org',
		'@type'             => 'Course',
		'name'              => $course['name'],
		'url'               => home_url( $course['url'] ),
		'provider'          => array( '@type' => 'Organization', 'name' => 'Agile Agilist', 'url' => home_url( '/' ) ),
		'hasCourseInstance' => $instances,
	) ) . '</script>';

	$h .= '</section>';

	/* Config for the JS: the REST route it should post to and a nonce. Emitted
	   next to the markup so it cannot drift from what was registered. */
	$h .= '<script>window.AA_REG=' . wp_json_encode( array(
		'checkout'       => $live ? esc_url_raw( rest_url( 'aa/v1/checkout' ) ) : null,
		'symbol'         => strtolower( $cur ) === 'cad' ? 'C$' : ( strtolower( $cur ) === 'eur' ? '€' : '$' ),
		'locale'         => strtolower( $cur ) === 'cad' ? 'en-CA' : ( strtolower( $cur ) === 'eur' ? 'de-DE' : 'en-US' ),
		'nonce'          => wp_create_nonce( 'wp_rest' ),
		'msgUnavailable' => 'Online payment is switched off right now — please contact us and we will register you.',
		'msgSending'     => 'Taking you to Stripe…',
		'msgError'       => 'We could not start checkout. Please try again, or email us and we will register you by hand.',
	) ) . ';</script>';
	return $h;
}
add_shortcode( 'aa_course_register', 'aa_reg_panel' );

/* ============================================================================
   AUTOMATIC PLACEMENT  —  no page edits at all
   ----------------------------------------------------------------------------
   The two shortcodes above can be pasted into a page by hand. They do not have
   to be. Every course page is built from the same template, and two of its
   blocks are the ones being replaced:

       <!-- wp:group {"className":"aa-sec aa-hero"} -->   the hero
       <!-- wp:group {"className":"aa-reg"} -->           [fluentform id="8"]

   so this swaps them at render time, keyed on the page slug. Nothing is
   written to the pages, which matters for three reasons:

     - A shortcode pasted into a page before this snippet is active renders as
       the literal text [aa_course_hero course="spc"] to every visitor. With no
       page edit there is no window in which that can happen.
     - Switching the snippet off restores the old hero and the Fluent Form
       exactly, with nothing to undo by hand.
     - It covers the /es/, /fr/ and /ar/ mirrors of each course, and the other
       courses as their cadences are added, without touching those pages
       either.

   OFF BY DEFAULT. The new hero is not the old hero: it carries the batch
   picker and the next-batch/price facts, and it drops the breadcrumb, the
   chips and the credential lockup. Tick "Replace the hero and the Fluent Form"
   in Settings -> AA Registration when you have looked at one and want it, and
   untick it to put the old pages straight back.
   ========================================================================== */

/** True when the swap is switched on in settings. */
function aa_reg_autoplace_on() {
	return get_option( 'aa_reg_autoplace' ) === 'yes';
}

/**
 * The course this page is for, or '' — matched on the page slug.
 *
 * The slug is the course key on every language mirror (/training/adv-safe/rte/,
 * /fr/rte/, /es/rte/), so one lookup covers them all. A slug with no row in
 * aa_reg_courses() returns '' and the page is left alone, which is what keeps
 * the other 16 courses untouched until their cadence is known.
 */
function aa_reg_page_course() {
	static $key = null;
	if ( $key !== null ) { return $key; }
	$key = '';
	if ( ! is_admin() ) {
		$obj = get_queried_object();
		if ( ! ( $obj instanceof WP_Post ) && isset( $GLOBALS['post'] ) ) { $obj = $GLOBALS['post']; }
		if ( $obj instanceof WP_Post && $obj->post_type === 'page' ) {
			$courses = aa_reg_courses();
			if ( isset( $courses[ $obj->post_name ] ) ) { $key = $obj->post_name; }
		}
	}
	return $key;
}

/** Does this block carry $want in its className? Token match, not substring. */
function aa_reg_block_has_class( $block, $want ) {
	if ( empty( $block['attrs']['className'] ) ) { return false; }
	return in_array( $want, preg_split( '/\s+/', $block['attrs']['className'] ), true );
}

/**
 * Swap the hero block and the Fluent Form block for our own.
 *
 * Runs on every block on every page, so it leaves as early as it can: the
 * course lookup is cached after the first call and returns '' for all but the
 * handful of pages that have a cadence.
 */
function aa_reg_autoplace( $html, $block ) {
	if ( empty( $block['blockName'] ) || $block['blockName'] !== 'core/group' ) { return $html; }
	if ( ! aa_reg_autoplace_on() ) { return $html; }
	$course = aa_reg_page_course();
	if ( $course === '' ) { return $html; }

	if ( aa_reg_block_has_class( $block, 'aa-hero' ) ) {
		return aa_reg_hero( array( 'course' => $course ) );
	}
	if ( aa_reg_block_has_class( $block, 'aa-reg' ) ) {
		return aa_reg_panel( array( 'course' => $course ) );
	}
	return $html;
}
add_filter( 'render_block', 'aa_reg_autoplace', 10, 2 );

/* ============================================================================
   CHECKOUT  —  POST /wp-json/aa/v1/checkout
   ========================================================================== */
add_action( 'rest_api_init', function () {
	register_rest_route( 'aa/v1', '/checkout', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',   // public: buyers are not logged in
		'callback'            => 'aa_reg_checkout',
	) );
	register_rest_route( 'aa/v1', '/stripe-webhook', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',   // authenticated by signature, below
		'callback'            => 'aa_reg_webhook',
	) );
} );

function aa_reg_checkout( WP_REST_Request $req ) {
	if ( ! aa_reg_is_live() ) {
		return new WP_Error( 'aa_off', 'Online payment is switched off right now.', array( 'status' => 503 ) );
	}
	$d = (array) $req->get_json_params();

	$found = aa_reg_find( isset( $d['cohort'] ) ? (string) $d['cohort'] : '' );
	if ( ! $found ) {
		return new WP_Error( 'aa_cohort', 'That cohort is not available.', array( 'status' => 400 ) );
	}
	$course = $found['course'];
	$cohort = $found['cohort'];

	$email = isset( $d['email'] ) ? sanitize_email( $d['email'] ) : '';
	if ( ! is_email( $email ) ) {
		return new WP_Error( 'aa_email', 'Please enter a valid email address.', array( 'status' => 400 ) );
	}
	/* No name is required from the page. Stripe collects the cardholder name
	   and returns it on the session as customer_details.name, which the
	   webhook writes to the registration. Asking here would only duplicate it. */

	// Seats: clamp to the order ceiling AND to seats actually left. The client
	// sends a number; it does not get to decide what is possible.
	$left  = aa_reg_seats_left( $course, $cohort );
	$seats = max( 1, min( aa_reg_max_seats(), (int) ( isset( $d['seats'] ) ? $d['seats'] : 1 ) ) );
	if ( $left < 1 ) {
		return new WP_Error( 'aa_full', 'That batch is now full.', array( 'status' => 409 ) );
	}
	if ( $seats > $left ) {
		return new WP_Error( 'aa_seats', sprintf( 'Only %d seat(s) left on that batch.', $left ), array( 'status' => 409 ) );
	}

	/* PAYMENT LINK MODE. If the course carries one, the buyer goes to that
	   link instead of a session created here. The cohort travels as
	   client_reference_id, which is the only per-purchase value a static link
	   can carry, and the webhook below reads it when metadata is absent.

	   Everything above still runs first — unknown cohort, bad email, full
	   batch and too many seats are all refused before the link is handed
	   over. What a link CANNOT do is enforce the rest: its price is fixed on
	   the link, so per-cohort or early-bird pricing is out, and if the link
	   allows quantity changes the buyer can raise the seat count on Stripe's
	   page, past the check just made here. The webhook records what was
	   actually bought, so an oversell is caught — but after the money. Use
	   links for a fixed-price course; use sessions when seats are tight. */
	if ( ! empty( $course['payment_link'] ) ) {
		return array( 'url' => add_query_arg( array(
			'client_reference_id' => rawurlencode( $cohort['id'] ),
			'prefilled_email'     => rawurlencode( $email ),
		), $course['payment_link'] ) );
	}

	// THE amount. From the table, never from the request.
	$unit = (int) round( $course['price'] * 100 );
	if ( $unit < 100 ) {
		return new WP_Error( 'aa_price', 'That cohort has no price configured.', array( 'status' => 409 ) );
	}

	$return = home_url( $course['url'] );
	$body = array(
		'mode'                 => 'payment',
		'success_url'          => add_query_arg( array( 'aa_paid' => $cohort['id'], 'aa_seats' => $seats ), $return ) . '#aacal',
		'cancel_url'           => $return . '#aacal-form',
		'customer_email'       => $email,
		'client_reference_id'  => $cohort['id'],
		'line_items[0][quantity]'                              => $seats,
		'line_items[0][price_data][currency]'                  => strtolower( $course['currency'] ),
		'line_items[0][price_data][unit_amount]'               => $unit,
		'line_items[0][price_data][product_data][name]'        => $course['name'],
		'line_items[0][price_data][product_data][description]' => aa_reg_range( $cohort['start'], $cohort['end'] ) . ' · ' . $cohort['batch'],
		'metadata[cohort]'  => $cohort['id'],
		'metadata[course]'  => $found['slug'],
		'metadata[seats]'   => $seats,
	);

	$res = wp_remote_post( 'https://api.stripe.com/v1/checkout/sessions', array(
		'timeout' => 20,
		'headers' => array(
			'Authorization' => 'Basic ' . base64_encode( aa_reg_key( 'secret' ) . ':' ),
			'Content-Type'  => 'application/x-www-form-urlencoded',
			// A double-click must not create two sessions — and therefore must
			// not be able to become two charges.
			'Idempotency-Key' => 'aa-' . md5( $cohort['id'] . '|' . $email . '|' . $seats . '|' . gmdate( 'YmdH' ) ),
		),
		'body'    => $body,
	) );

	if ( is_wp_error( $res ) ) {
		return new WP_Error( 'aa_stripe', 'Could not reach the payment provider. Please try again.', array( 'status' => 502 ) );
	}
	$json = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( (int) wp_remote_retrieve_response_code( $res ) >= 300 || empty( $json['url'] ) ) {
		// Stripe's own message can name a live/test key mismatch or a bad
		// currency; log it for an admin but never echo it to the buyer.
		error_log( 'AA checkout: Stripe said ' . wp_remote_retrieve_body( $res ) );
		return new WP_Error( 'aa_stripe', 'Could not start checkout. Please try again.', array( 'status' => 502 ) );
	}
	return array( 'url' => $json['url'] );
}

/* ============================================================================
   WEBHOOK  —  POST /wp-json/aa/v1/stripe-webhook
   The buyer returning to the site is NOT proof of payment: they can close the
   tab, and the success URL can be typed by hand. This is the only thing that
   records a sale or decrements a seat.
   ========================================================================== */
function aa_reg_webhook( WP_REST_Request $req ) {
	$secret = aa_reg_key( 'webhook' );
	$sig    = $req->get_header( 'stripe_signature' );
	$raw    = $req->get_body();
	if ( ! $secret || ! $sig ) {
		return new WP_Error( 'aa_sig', 'not configured', array( 'status' => 400 ) );
	}

	// Stripe-Signature: t=<ts>,v1=<hmac>[,v1=<hmac>]
	$t = ''; $v1 = array();
	foreach ( explode( ',', $sig ) as $part ) {
		$kv = explode( '=', trim( $part ), 2 );
		if ( count( $kv ) !== 2 ) { continue; }
		if ( $kv[0] === 't' )  { $t = $kv[1]; }
		if ( $kv[0] === 'v1' ) { $v1[] = $kv[1]; }
	}
	if ( $t === '' || ! $v1 ) {
		return new WP_Error( 'aa_sig', 'bad signature', array( 'status' => 400 ) );
	}
	// Reject replays of an old, correctly-signed body.
	if ( abs( time() - (int) $t ) > 300 ) {
		return new WP_Error( 'aa_sig', 'stale', array( 'status' => 400 ) );
	}
	$expected = hash_hmac( 'sha256', $t . '.' . $raw, $secret );
	$ok = false;
	foreach ( $v1 as $candidate ) {
		if ( hash_equals( $expected, $candidate ) ) { $ok = true; break; }
	}
	if ( ! $ok ) {
		return new WP_Error( 'aa_sig', 'bad signature', array( 'status' => 400 ) );
	}

	$event = json_decode( $raw, true );
	if ( ! isset( $event['type'] ) || $event['type'] !== 'checkout.session.completed' ) {
		return array( 'ok' => true, 'ignored' => true );
	}
	$s = isset( $event['data']['object'] ) ? $event['data']['object'] : array();
	if ( isset( $s['payment_status'] ) && $s['payment_status'] !== 'paid' ) {
		return array( 'ok' => true, 'unpaid' => true );
	}

	// Stripe retries until it gets a 2xx, so the same event can arrive more
	// than once. Recording it twice would double-count seats sold.
	$eid = isset( $event['id'] ) ? $event['id'] : '';
	if ( $eid && get_posts( array( 'post_type' => 'aa_registration', 'post_status' => 'any',
		'posts_per_page' => 1, 'fields' => 'ids', 'no_found_rows' => true,
		'meta_key' => 'stripe_event', 'meta_value' => $eid ) ) ) {
		return array( 'ok' => true, 'duplicate' => true );
	}

	$meta   = isset( $s['metadata'] ) ? (array) $s['metadata'] : array();
	// A session we created carries metadata; a Payment Link carries only
	// client_reference_id. Read both so either route records the same sale.
	$cohort = isset( $meta['cohort'] ) ? sanitize_text_field( $meta['cohort'] )
	        : ( isset( $s['client_reference_id'] ) ? sanitize_text_field( $s['client_reference_id'] ) : '' );
	// Quantity is authoritative from the line items when Stripe reports it —
	// a Payment Link buyer may have changed it on Stripe's page.
	$seats  = max( 1, (int) ( isset( $meta['seats'] ) ? $meta['seats'] : 1 ) );
	if ( isset( $s['line_items']['data'][0]['quantity'] ) ) {
		$seats = max( 1, (int) $s['line_items']['data'][0]['quantity'] );
	}
	// Stripe is the source for the buyer's name — the page never asked for it.
	$name   = isset( $s['customer_details']['name'] ) ? sanitize_text_field( $s['customer_details']['name'] )
	        : ( isset( $meta['name'] ) ? sanitize_text_field( $meta['name'] ) : '' );
	$email  = isset( $s['customer_details']['email'] ) ? sanitize_email( $s['customer_details']['email'] )
	        : ( isset( $s['customer_email'] ) ? sanitize_email( $s['customer_email'] ) : '' );

	$post_id = wp_insert_post( array(
		'post_type'   => 'aa_registration',
		'post_status' => 'private',
		'post_title'  => trim( $name . ' — ' . $cohort ),
		'meta_input'  => array(
			'stripe_event'   => $eid,
			'stripe_session' => isset( $s['id'] ) ? sanitize_text_field( $s['id'] ) : '',
			'cohort'         => $cohort,
			'course'         => isset( $meta['course'] ) ? sanitize_text_field( $meta['course'] ) : '',
			'seats'          => $seats,
			'email'          => $email,
			'phone'          => isset( $s['customer_details']['phone'] ) ? sanitize_text_field( $s['customer_details']['phone'] ) : '',
			'amount_total'   => isset( $s['amount_total'] ) ? (int) $s['amount_total'] : 0,
			'currency'       => isset( $s['currency'] ) ? sanitize_text_field( $s['currency'] ) : '',
		),
	) );

	if ( $cohort ) {
		$sold = (array) get_option( 'aa_reg_sold', array() );
		$sold[ $cohort ] = ( isset( $sold[ $cohort ] ) ? (int) $sold[ $cohort ] : 0 ) + $seats;
		update_option( 'aa_reg_sold', $sold, false );
	}

	wp_mail(
		get_option( 'admin_email' ),
		'Paid registration — ' . $cohort,
		sprintf( "%s (%s)\nCohort: %s\nSeats: %d\nPaid: %s %s\nSession: %s",
			$name, $email, $cohort, $seats,
			isset( $s['currency'] ) ? strtoupper( $s['currency'] ) : '',
			isset( $s['amount_total'] ) ? number_format( $s['amount_total'] / 100, 2 ) : '',
			isset( $s['id'] ) ? $s['id'] : '' )
	);

	return array( 'ok' => true, 'id' => $post_id );
}

endif; // double-load guard
