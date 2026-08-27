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
/* THE DOUBLE-LOAD GUARD BELOW HAS A SHARP EDGE. It stops a second copy of
   this file from causing a redeclare fatal — but "second" means whichever
   WPCode happens to run LATER, and the loser is skipped in its entirety. So
   two active copies do not merge: the OLDER snippet can win outright and the
   newer one becomes dead code, with no error anywhere to say so.

   That is not hypothetical. It is what "the hero still looks the old way and
   nothing else changed" means on a site with two active Register PHP
   snippets: the older copy, from before automatic placement existed, is the
   one running.

   NEVER LEAVE TWO COPIES ACTIVE. [aa_reg_selftest] prints the build below, so
   you can tell which copy is live — and if the shortcode prints nothing at
   all, an older copy without it is the one running. */
/* IS A SECOND COPY ALREADY LOADED? Ask BEFORE the guard runs, because after it
   the answer is always yes. If another copy of this file is active, everything
   below is skipped and this file is dead code — silently. That silence is what
   made "the hero still looks the old way" take a day to find: an older snippet
   was winning, autoplace never attached, and nothing anywhere said so.
   Now it says so, in wp-admin and on the page itself for logged-in admins. */
$aa_reg_already_loaded = function_exists( 'aa_reg_courses' );

if ( ! defined( 'AA_REG_BUILD' ) ) {
	define( 'AA_REG_BUILD', '2026-08-26 · autoplace + AI-Native + lazy months' );
}

if ( $aa_reg_already_loaded ) {
	$aa_reg_warn = 'Two copies of "AA – Register PHP" are active. Only the one that'
	             . ' loaded first is running, and it may be the older one — this copy is'
	             . ' being skipped entirely. Delete the duplicate in WPCode → Code Snippets,'
	             . ' leaving exactly one. Build seen first: ' . AA_REG_BUILD;

	add_action( 'admin_notices', function () use ( $aa_reg_warn ) {
		if ( ! current_user_can( 'manage_options' ) ) { return; }
		echo '<div class="notice notice-error"><p><strong>AA Registration:</strong> '
		   . esc_html( $aa_reg_warn ) . '</p></div>';
	} );
	// Also on the front end, where the symptom actually shows. Admins only.
	add_action( 'wp_footer', function () use ( $aa_reg_warn ) {
		if ( ! current_user_can( 'manage_options' ) ) { return; }
		echo '<div style="position:fixed;left:12px;bottom:12px;z-index:2147483000;max-width:420px;'
		   . 'background:#8B1A1A;color:#fff;padding:12px 14px;border-radius:6px;'
		   . 'font:12px/1.5 system-ui,sans-serif">' . esc_html( $aa_reg_warn ) . '</div>';
	}, 99 );
}

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
			'crumb'    => 'Advanced SAFe',
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
			'crumb'    => 'Advanced SAFe',
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
			'crumb'    => 'Advanced SAFe',
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

		/* ------------------------------------------------------------------
		   THE AI-NATIVE SUITE — classroom courses, one date a month per city.
		   Keys are page slugs, because that is what auto-placement matches on.

		   Everything below was read off your own live pages, not invented:

		     AINF   11792  $1,500  ai-native-foundations
		     AINCA  11818  $2,500  ai-native-change-agent          3 days
		     AINORG 23813  $1,500  ai-native-ready-certification-2 2 days, cohort of 12

		   ONE DURATION IS UNCONFIRMED. AINCA states three days in four places
		   (the chip, the curriculum heading, the FAQ, and courseWorkload P3D)
		   and AINORG states two the same way. AI-Native Foundations states its
		   price but not its length anywhere I can read; the 2 comes from
		   redesign-build/courses.json, whose price for that course ($1,150) is
		   already known to be stale. Confirm it before going live — it decides
		   the end date printed on every generated cohort.

		   DATES. You gave one: the first AI-Native Value Architect in
		   Mississauga is Thursday 10 September, the second Thursday. The rest
		   follow one rule rather than a list — each course takes its own week
		   of the month so one trainer is never in two rooms at once:

		     Foundations      1st Thursday     Value Architect  2nd Thursday
		     Leading the Org  3rd Thursday

		   The Gulf cities run on SUNDAYS, not Thursdays. Thursday-plus-Friday
		   straddles the Gulf weekend, so every class there would be a weekend
		   class; Sunday is the first working day of the week in both.
		   Quarterly, staggered a week apart for the same trainer reason.

		   Change any of it by changing 'first' — the whole series follows.
		   ------------------------------------------------------------------ */
		'ai-native-foundations' => array(
			'code'     => 'AINF',
			'name'     => 'AI-Native Foundations Certification',
			'eyebrow'  => 'In person · AINF certification',
			'h1'       => 'AI-Native Foundations.',
			'lede'     => 'Personal AI fluency — get genuinely productive with AI tools in your own work. The entry credential of the AI-Native track, and the prerequisite for Value Architect.',
			'url'      => '/training/ai-native/ai-native-foundations/',
			'crumb'    => 'AI-Native',
			'currency' => 'usd',
			'price'    => 1500,
			'days'     => 2,          // UNCONFIRMED — see the note above
			'seats'    => 18,
			'weeks'    => 78,         // 18 months: a monthly course needs a longer window
			'proof'    => array( 'In person', 'Exam fee included', 'No prerequisites' ),
			'schedule' => array(
				array( 'key' => 'mississauga', 'label' => 'Mississauga, Canada',  'region' => 'na',   'every' => 1, 'first' => '2026-09-03' ),
				array( 'key' => 'dubai',       'label' => 'Dubai, UAE',           'region' => 'gulf', 'every' => 3, 'first' => '2026-10-04' ),
				array( 'key' => 'riyadh',      'label' => 'Riyadh, Saudi Arabia', 'region' => 'gulf', 'every' => 3, 'first' => '2026-11-01' ),
			),
		),
		'ai-native-change-agent' => array(
			'code'     => 'AINCA',
			// Renamed from "AI-Native Change Agent". The URL deliberately still
			// says change-agent: renaming the slug would need a 301 and would
			// reset the page's search history for no gain.
			'name'     => 'AI-Native Value Architect Certification',
			'eyebrow'  => 'In person · AI-Native Value Architect',
			'h1'       => 'AI-Native Value Architect.',
			'lede'     => 'Lead enterprise AI adoption — diagnose readiness, build the roadmap, drive the habits, govern the risk, and measure sustained change. Requires AI-Native Foundations first.',
			'url'      => '/training/ai-native/ai-native-change-agent/',
			'crumb'    => 'AI-Native',
			'currency' => 'usd',
			'price'    => 2500,
			'days'     => 2,
			'seats'    => 18,
			'weeks'    => 78,
			'proof'    => array( 'In person', 'Exam fee included', 'AINF required' ),
			'schedule' => array(
				array( 'key' => 'mississauga', 'label' => 'Mississauga, Canada',  'region' => 'na',   'every' => 1, 'first' => '2026-09-10' ),
				array( 'key' => 'dubai',       'label' => 'Dubai, UAE',           'region' => 'gulf', 'every' => 3, 'first' => '2026-10-11' ),
				array( 'key' => 'riyadh',      'label' => 'Riyadh, Saudi Arabia', 'region' => 'gulf', 'every' => 3, 'first' => '2026-11-08' ),
			),
		),
		'ai-native-ready-certification-2' => array(
			'code'     => 'AINORG',
			'name'     => 'Leading the AI-Native Organization',
			'eyebrow'  => 'In person · Executive workshop',
			'h1'       => 'Leading the AI-Native Organization.',
			'lede'     => 'A two-day executive cohort capped at twelve senior leaders — CEOs, COOs, CTOs, CAIOs — designing the AI-Native operating model, with six months of follow-up coaching included.',
			'url'      => '/training/ai-native/ai-native-ready-certification-2/',
			'crumb'    => 'AI-Native',
			'currency' => 'usd',
			'price'    => 1500,
			'days'     => 1,
			'seats'    => 12,         // the page says "capped at 12 senior leaders"
			'weeks'    => 78,
			'proof'    => array( '12 seats max', 'Six months coaching', 'Exam fee included' ),
			'schedule' => array(
				array( 'key' => 'mississauga', 'label' => 'Mississauga, Canada',  'region' => 'na',   'every' => 1, 'first' => '2026-09-17' ),
				array( 'key' => 'dubai',       'label' => 'Dubai, UAE',           'region' => 'gulf', 'every' => 3, 'first' => '2026-10-18' ),
				array( 'key' => 'riyadh',      'label' => 'Riyadh, Saudi Arabia', 'region' => 'gulf', 'every' => 3, 'first' => '2026-11-15' ),
			),
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
	return aa_reg_next_working_day_in( $ymd, 'na' );
}

/**
 * The next working day in a given region.
 *
 * The plain version above is North American and stays that way for the
 * live-online courses, which are sold on a North American calendar. It cannot
 * be reused for a Gulf city: it skips Sunday, which is the first working day
 * of the week in Saudi Arabia and the UAE, and it accepts Friday, which is
 * not a working day there at all. Using it for Dubai would move a class off a
 * perfectly good Sunday and onto a Friday.
 */
function aa_reg_next_working_day_in( $ymd, $region = 'na' ) {
	$rest = $region === 'gulf' ? array( 5, 6 ) : array( 6, 7 );   // ISO-8601: Mon=1
	$d = new DateTime( $ymd );
	for ( $i = 0; $i < 10; $i++ ) {
		$d->modify( '+1 day' );
		if ( in_array( (int) $d->format( 'N' ), $rest, true ) ) { continue; }
		// The holiday list is North American, so it only blocks NA dates.
		if ( $region === 'na' && aa_reg_is_holiday( $d->format( 'Y-m-d' ) ) ) { continue; }
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
/**
 * Weekday or weekend batch — which depends on where the class runs.
 *
 * North America rests Saturday and Sunday. The Gulf rests Friday and Saturday:
 * Sunday is the first working day of the week in Saudi Arabia and the UAE. A
 * Sunday class in Riyadh is a weekday class, and calling it a weekend batch
 * would be wrong in the label, wrong in the filter, and wrong to a buyer
 * booking leave around it.
 */
function aa_reg_kind( $start, $days, $region = 'na' ) {
	$rest = $region === 'gulf' ? array( 5, 6 ) : array( 6, 7 );   // ISO-8601: Mon=1
	$d = new DateTime( $start );
	for ( $i = 0; $i < max( 1, (int) $days ); $i++ ) {
		if ( in_array( (int) $d->format( 'N' ), $rest, true ) ) { return 'weekend'; }
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
	return $slot === 'afternoon' ? aa_reg_t( 'batch_after', 'Weekday afternoon batch' )
	     : ( $slot === 'evening' ? aa_reg_t( 'batch_evening', 'Evening batch' )
	                             : aa_reg_t( 'batch_morning', 'Weekday morning batch' ) );
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
/**
 * A classroom course's schedule: each city on its own rhythm.
 *
 * The weekly cadence below is for live-online courses, where a class costs a
 * Zoom room and can run twice a week forever. A classroom course cannot: it
 * costs a venue and a trainer's flight, so it runs once a month in the home
 * city and once a quarter in each travel city.
 *
 * The rhythm is the SAME WEEKDAY OF THE SAME WEEK each month, not the same
 * date. A course anchored on Thursday 10 September — the second Thursday —
 * recurs on the second Thursday of every month after it. Repeating "the 10th"
 * would land on a Saturday twice a year and drift across the working week; the
 * nth-weekday form is what a monthly class actually looks like, and it never
 * needs a weekend rule.
 *
 * HOLIDAYS MOVE A CLASSROOM CLASS, they do not twin it. The twin rule — keep
 * the long-weekend class, add one on the next working day — is right for a
 * weekly online course, where an extra date costs nothing and the long weekend
 * is genuinely the slot people want. A monthly classroom class has one date in
 * the month by definition, so a holiday shifts it to the next working day
 * rather than doubling the month's offering and the venue booking with it.
 */
function aa_reg_generate_places( $slug, $course, $today, $limit, $tz ) {
	$days = max( 1, (int) $course['days'] );
	$out  = array();

	foreach ( (array) $course['schedule'] as $place ) {
		if ( empty( $place['first'] ) || empty( $place['key'] ) ) { continue; }
		$every = max( 1, (int) ( isset( $place['every'] ) ? $place['every'] : 1 ) );
		$slot  = isset( $place['slot'] ) ? $place['slot'] : 'morning';
		$region_of_place = ! empty( $place['region'] ) ? $place['region'] : 'na';

		$anchor = new DateTime( $place['first'], $tz );
		$anchor->setTime( 0, 0, 0 );
		// PHP's relative syntax wants the ordinal as a word: "second Thursday
		// of September 2026". A digit there is a parse error, not a fallback.
		$words   = array( 1 => 'first', 2 => 'second', 3 => 'third', 4 => 'fourth', 5 => 'fifth' );
		$n       = (int) ceil( (int) $anchor->format( 'j' ) / 7 );   // the 10th -> the 2nd one
		$nth     = isset( $words[ $n ] ) ? $words[ $n ] : 'first';
		$weekday = $anchor->format( 'l' );

		/* Walk months from the anchor, not from today: the anchor fixes which
		   week of the month this city uses, and a course whose first date has
		   already passed keeps the same rhythm rather than restarting on
		   whatever weekday today happens to be. */
		for ( $i = 0; $i < 60; $i++ ) {
			$month = ( clone $anchor )->modify( 'first day of +' . ( $i * $every ) . ' month' );
			$d     = new DateTime( $month->format( 'Y-m' ) . '-01', $tz );
			$d->modify( $nth . ' ' . $weekday . ' of ' . $d->format( 'F Y' ) );
			$d->setTime( 0, 0, 0 );

			if ( $d > $limit ) { break; }
			if ( $d < $today ) { continue; }

			$start  = $d->format( 'Y-m-d' );
			$reason = '';

			/* NO CLASSROOM COURSE RUNS INTO THE LOCAL WEEKEND.
			   A venue class is booked around a working week, so a span that
			   touches a rest day is pushed to the next start that does not.
			   The rest days are regional — Saturday and Sunday in North
			   America, Friday and Saturday in the Gulf — so this is one rule,
			   not a hard-coded "not Saturday".

			   This is enforced here rather than left to the anchor dates
			   because durations change. A 2-day course anchored on a Thursday
			   is clean; make it 3 days and every date silently runs into
			   Saturday. That happened once already. */
			/* THREE CONSTRAINTS, ONE LOOP — and it has to be one loop.

			   A classroom date must clear all three: it must not touch the
			   blackout, it must not sit on a public holiday, and its whole
			   span must stay inside the local working week. Checking them in
			   sequence does not work, because fixing the third can break the
			   first: the first version tested the weekend, then moved off
			   holidays, and the holiday move pushed a span straight back into
			   Saturday. The test caught two such dates. So the date advances
			   until it satisfies everything at once.

			   The rest days are regional — Saturday and Sunday in North
			   America, Friday and Saturday in the Gulf — so "no Saturday
			   classes" is expressed as a rule about the local working week
			   rather than hard-coded to one weekday.

			   It is enforced here rather than left to well-chosen anchors
			   because durations change. A 2-day course anchored on a Thursday
			   is clean; make it 3 days and every date silently runs into the
			   weekend. That is exactly what happened when Value Architect was
			   3 days. */
			$guard = 0;
			while ( $guard < 20 ) {
				$bad_span    = ! aa_reg_span_ok( $start, $days );
				$bad_holiday = ( $region_of_place === 'na' ) && aa_reg_is_holiday( $start );
				$bad_weekend = aa_reg_kind( $start, $days, $region_of_place ) === 'weekend';
				if ( ! $bad_span && ! $bad_holiday && ! $bad_weekend ) { break; }
				$next = aa_reg_next_working_day_in( $start, $region_of_place );
				if ( ! $next ) { break; }
				// Say why it moved, using the FIRST reason — a holiday is worth
				// telling the buyer about, sliding off a weekend is not.
				if ( $reason === '' && ( $bad_span || $bad_holiday ) ) { $reason = 'moved'; }
				$start = $next;
				$guard++;
			}

			// Anything still failing is dropped rather than published wrong.
			if ( ! aa_reg_span_ok( $start, $days )
				|| ( $region_of_place === 'na' && aa_reg_is_holiday( $start ) )
				|| aa_reg_kind( $start, $days, $region_of_place ) === 'weekend' ) { continue; }
			if ( new DateTime( $start, $tz ) > $limit ) { continue; }

			$out[] = aa_reg_make( $slug, $course, $start, $slot, $reason, $place );
		}
	}
	usort( $out, function ( $a, $b ) { return strcmp( $a['start'], $b['start'] ); } );
	return $out;
}

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

	// A course with cities is scheduled per city, not on a weekly cadence.
	if ( ! empty( $course['schedule'] ) ) {
		return $memo[ $key ] = aa_reg_generate_places( $slug, $course, $today, $limit, $tz );
	}

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

function aa_reg_make( $slug, $course, $start, $slot, $reason = '', $place = null ) {
	$days   = max( 1, (int) $course['days'] );
	$region = is_array( $place ) && ! empty( $place['region'] ) ? $place['region'] : 'na';
	$end    = ( new DateTime( $start ) )->modify( '+' . ( $days - 1 ) . ' day' );
	$kind   = aa_reg_kind( $start, $days, $region );
	// Say WHY an off-cadence date exists. "added date" on the Tuesday after
	// Labour Day reads like padding; "after the holiday" tells the buyer it is
	// the alternative to the long-weekend class sitting right above it.
	$note = '';
	// The holiday list is North American, so the long-weekend framing only
	// makes sense for a North American city. Nobody in Riyadh has Canadian
	// Remembrance Day off.
	if ( $region === 'na' && aa_reg_is_holiday( $start ) ) { $note = ' · long weekend'; }
	elseif ( $reason === 'twin' )        { $note = ' · after the holiday'; }
	elseif ( $reason === 'backfill' )    { $note = ' · added date'; }
	elseif ( $reason === 'moved' )       { $note = ' · moved off a holiday'; }
	$c = array(
		'id'    => $slug . '-' . $start,
		'start' => $start,
		'end'   => $end->format( 'Y-m-d' ),
		'slot'  => $slot,
		'kind'  => $kind,
		'seats' => (int) ( isset( $course['seats'] ) ? $course['seats'] : 18 ),
		'batch' => ( $kind === 'weekend' ? aa_reg_t( 'batch_weekend', 'Weekend batch' ) : aa_reg_slot_label( $slot ) ) . $note,
		'hours' => aa_reg_slot_hours( $slot ),
	);

	/* A classroom course carries where it runs. The id has to carry it too:
	   two cities can hold the same course on the same day, and the id is what
	   Stripe, the seat ledger and the ?cohort= deep link all key on. */
	if ( is_array( $place ) ) {
		$c['id']       = $slug . '-' . $place['key'] . '-' . $start;
		$c['place']    = $place['label'];
		$c['placeKey'] = $place['key'];
		$c['batch']    = $place['label'] . ' · ' . $c['batch'];
		if ( isset( $place['seats'] ) ) { $c['seats'] = (int) $place['seats']; }
	}
	return $c;
}

/** Room size minus seats already sold. Never trusts a client-supplied count. */
function aa_reg_seats_left( $course, $cohort ) {
	$sold = (array) get_option( 'aa_reg_sold', array() );
	$n    = (int) $cohort['seats'] - ( isset( $sold[ $cohort['id'] ] ) ? (int) $sold[ $cohort['id'] ] : 0 );
	return max( 0, $n );
}

/** Hard ceiling on one order, so a typo in the stepper cannot buy the room. */
function aa_reg_max_seats() { return 12; }

/* ---------------------------------------------------------------------------
   COURSES THE TABLE DOES NOT LIST
   ---------------------------------------------------------------------------
   aa_reg_courses() is a hand-written table of six courses. The site sells
   about twenty. The other fourteen used to get their hero from the old
   "AA - Course JS" snippet, which read its per-course settings from a hidden
   element the page itself carries:

     <div id="aa-cohorts" data-title="SAFe ARCH" data-price="2,200"
          data-strike="" data-days="1,2,4" data-length="3"></div>

   So the data has been on the page the whole time. Reading it here means
   every course page gets the new hero and the new registration without
   fourteen more rows of hand-transcribed prices and durations -- and, more to
   the point, without me inventing a course length or a price for a credential
   whose specifics are Scaled Agile's to state, not ours to guess.

   The table still wins wherever it has a row: those six are hand-tuned
   (regional cities, explicit schedules, proof lines) in ways the page element
   cannot express.

   Resolution is by SLUG, not by "the page being rendered", because checkout
   arrives as a REST request with no page context at all and still has to
   price the batch from the server side. */

function aa_reg_derived_days( $spec ) {
	/* data-days uses JavaScript's getDay(): 0 = Sunday .. 6 = Saturday. The
	   cadence here names the weekday, because that is what PHP's relative
	   date parser takes. Saturday and Sunday are dropped rather than
	   translated -- no course starts on a rest day. */
	$names = array( 1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri' );
	$out   = array();
	$seen  = array();
	foreach ( explode( ',', (string) $spec ) as $d ) {
		$d = (int) trim( $d );
		if ( $d < 1 || $d > 5 ) { continue; }   // weekend starts are not offered
		if ( isset( $seen[ $d ] ) ) { continue; }
		$seen[ $d ] = true;
		$out[] = array( 'dow' => $names[ $d ], 'slot' => $d === 5 ? 'afternoon' : 'morning' );
	}
	return $out;
}

function aa_reg_parse_cohorts_el( $content ) {
	if ( strpos( $content, 'aa-cohorts' ) === false ) { return null; }
	if ( ! preg_match( '/<[a-z]+[^>]*id=["\']aa-cohorts["\'][^>]*>/i', $content, $m ) ) { return null; }
	$tag = $m[0];

	$attr = function ( $name ) use ( $tag ) {
		/* FIRST match, deliberately. Several pages carry data-length twice
		   (ASE, ARCH and SP all read data-length="3" data-length="4"), and an
		   HTML parser keeps the first and drops the rest. Matching the browser
		   here means the new hero shows the same number the old one did
		   instead of quietly changing a published course length. */
		if ( preg_match( '/\sdata-' . $name . '=["\']([^"\']*)["\']/i', $tag, $mm ) ) {
			return $mm[1];
		}
		return '';
	};

	$price = (int) preg_replace( '/[^0-9]/', '', $attr( 'price' ) );
	$len   = (int) $attr( 'length' );
	if ( $price < 1 || $len < 1 ) { return null; }   // no price, no sale

	return array(
		'title'  => trim( $attr( 'title' ) ),
		'price'  => $price,
		'days'   => min( 5, $len ),
		'dows'   => aa_reg_derived_days( $attr( 'days' ) ),
	);
}

/** Build a course row from a published page that carries #aa-cohorts. */
function aa_reg_derived_course( $slug ) {
	/* Keyed by language as well as slug: "rte" resolves to a different page,
	   with different copy, on /fr/ than it does in English, and a cache that
	   forgot that would serve whichever mirror was rendered first this request
	   to every later one. */
	$want_lang = aa_reg_lang();
	$key       = $want_lang . '|' . $slug;

	static $cache = array();
	if ( array_key_exists( $key, $cache ) ) { return $cache[ $key ]; }
	$cache[ $key ] = null;

	if ( ! preg_match( '/^[a-z0-9-]{2,80}$/', $slug ) ) { return null; }
	if ( ! function_exists( 'get_posts' ) ) { return null; }

	$pages = get_posts( array(
		'post_type'        => 'page',
		'name'             => $slug,
		'post_status'      => 'publish',
		'numberposts'      => 5,
		'suppress_filters' => true,
	) );

	foreach ( $pages as $p ) {
		/* THE MIRROR IN THE READER'S LANGUAGE, NOT THE FIRST ONE FOUND. The
		   /es/, /fr/ and /ar/ mirrors reuse the English slug, so this query
		   returns up to four pages for "rte" and they differ only in ancestry.
		   Picking the wrong one puts an English h1 on a French page, which is
		   why they were all skipped before. Matching the language instead is
		   what lets a mirror build a hero out of its own translated title,
		   excerpt and breadcrumb. */
		if ( aa_reg_lang( $p ) !== $want_lang ) { continue; }

		$anc = get_post_ancestors( $p->ID );
		$cfg = aa_reg_parse_cohorts_el( $p->post_content );
		if ( ! $cfg ) { continue; }

		$crumb = aa_reg_t( 'training', 'Training' );
		if ( $anc ) {
			$parent = get_post( $anc[0] );
			if ( $parent ) { $crumb = $parent->post_title; }
		}

		$title = $cfg['title'] !== '' ? $cfg['title'] : $p->post_title;
		$code  = strtoupper( preg_replace( '/^SAFe\s*/i', '', $title ) );

		$cache[ $key ] = array(
			'code'     => $code !== '' ? $code : strtoupper( $slug ),
			'name'     => $p->post_title,
			'eyebrow'  => 'Live online · ' . $title,
			'h1'       => $p->post_title,
			/* No invented selling copy. The page's own excerpt is what its
			   author wrote about it; an empty lede renders nothing. */
			'lede'     => trim( wp_strip_all_tags( $p->post_excerpt ) ),
			'url'      => wp_make_link_relative( get_permalink( $p ) ),
			'crumb'    => $crumb,
			'currency' => 'usd',
			'price'    => $cfg['price'],
			'days'     => $cfg['days'],
			'seats'    => 18,
			'weeks'    => 26,
				'cadence'  => $cfg['dows'] ? $cfg['dows'] : array( array( 'dow' => 'Mon', 'slot' => 'morning' ) ),
			'proof'    => array( 'Live online', 'Exam fee included' ),
		);
		break;
	}

	return $cache[ $key ];
}

/**
 * ONE course by slug: the hand-written table first, the page element second.
 *
 * Every lookup goes through here so the two sources can never disagree about
 * which course a slug means.
 */
function aa_reg_course( $slug ) {
	/* ON A MIRROR, THE PAGE WINS. aa_reg_courses() is the hand-written English
	   table and it is keyed on the bare slug -- "rte" is in it, and /fr/rte/ is
	   also post_name "rte". Consulting the table first would hand a French page
	   an English h1, lede and proof list, which is exactly the failure the old
	   blanket refusal was avoiding. Off English, the page's own content is the
	   only source that is already in the right language, so it is asked first
	   and the table is the fallback. */
	if ( aa_reg_lang() !== 'en' ) {
		$derived = aa_reg_derived_course( $slug );
		if ( $derived ) { return $derived; }
	}
	$courses = aa_reg_courses();
	if ( isset( $courses[ $slug ] ) ) { return $courses[ $slug ]; }
	return aa_reg_derived_course( $slug );
}

/** One cohort by id, with its course. Returns null for anything unrecognised. */
function aa_reg_find( $cohort_id ) {
	foreach ( aa_reg_courses() as $slug => $course ) {
		foreach ( aa_reg_generate( $slug, $course ) as $c ) {
			if ( $c['id'] === $cohort_id ) {
				return array( 'slug' => $slug, 'course' => $course, 'cohort' => $c );
			}
		}
	}

	/* A course that lives on its page rather than in the table is not in that
	   loop -- there is no list of them to walk. Its id still names it: the
	   generated form is "<slug>-<start>", so the slug is everything before the
	   date. Resolve that one page and check its schedule. */
	if ( preg_match( '/^([a-z0-9-]+)-(\d{4}-\d{2}-\d{2})$/', $cohort_id, $m ) ) {
		$course = aa_reg_derived_course( $m[1] );
		if ( $course ) {
			foreach ( aa_reg_generate( $m[1], $course ) as $c ) {
				if ( $c['id'] === $cohort_id ) {
					return array( 'slug' => $m[1], 'course' => $course, 'cohort' => $c );
				}
			}
		}
	}
	return null;
}

/**
 * The same lookup, by course and start date.
 *
 * For anything holding a date rather than one of our generated ids — the
 * calendar, whose bars are wp_events posts. Resolving here rather than
 * trusting a client-supplied id keeps one rule intact: the price and the seat
 * count come from the generated schedule, never from the request.
 */
function aa_reg_find_by_date( $course_key, $start ) {
	$course = aa_reg_course( $course_key );
	if ( ! $course ) { return null; }
	if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $start ) ) { return null; }

	foreach ( aa_reg_generate( $course_key, $course ) as $c ) {
		if ( $c['start'] === $start ) {
			return array( 'slug' => $course_key, 'course' => $course, 'cohort' => $c );
		}
	}
	return null;
}

/**
 * The compact in-place checkout.
 *
 * One email field, a seat stepper, a total and a pay button — the smallest
 * thing that can take money. It goes wherever a batch can be chosen, so a
 * buyer who has already decided never has to travel to a form further down
 * the page to say so.
 *
 * It is NOT the two-step wizard. That one stays in the registration block,
 * where the review screen has room to restate what is being bought. Repeating
 * a 30KB wizard three times on one page would be three times the markup for
 * the same purchase.
 *
 * $prefix namespaces the classes so the hero, the calendar panel and the
 * schedule can each hold one without their JS or CSS colliding.
 */
/**
 * The JS config, emitted once per page.
 *
 * The hero and the registration each need it, and a page carries both, so it
 * is emitted by whichever renders first and skipped by the other. Two copies
 * would be harmless but the second would silently overwrite the first, which
 * is the kind of thing that only shows up when the two disagree.
 */
function aa_reg_config_script( $course_key, $course, $cur ) {
	static $done = false;
	if ( $done ) { return ''; }
	$done = true;
	$live = aa_reg_is_live();

	return '<script>window.AA_REG=' . wp_json_encode( array(
		'checkout'       => $live ? esc_url_raw( rest_url( 'aa/v1/checkout' ) ) : null,
		'batches'        => esc_url_raw( rest_url( 'aa/v1/batches' ) ),
		'course'         => $course_key,
		// The authoritative price, for anything rendering a total without a
		// batch of its own to read it from — the calendar's panel form.
		'price'          => (int) $course['price'],
		/* EVERY DATE THIS COURSE CAN ACTUALLY BE BOUGHT ON.
		   The calendar draws wp_events posts; the registration sells batches
		   generated from a cadence. Those are two different sets of dates and
		   they only mostly overlap — a past event, an import that never
		   matched the cadence, or anything beyond the generated window exists
		   on the calendar and is not on sale. Offering checkout on one of
		   those and letting the server refuse is a dead end at the last step,
		   which is exactly where a buyer will not try again. So the calendar
		   asks first. ~90 dates, under a kilobyte. */
		'dates'          => array_values( array_map(
			function ( $c ) { return $c['start']; },
			aa_reg_upcoming( $course_key, $course )
		) ),
		'symbol'         => strtolower( $cur ) === 'cad' ? 'C$' : ( strtolower( $cur ) === 'eur' ? '\u20ac' : '$' ),
		'locale'         => strtolower( $cur ) === 'cad' ? 'en-CA' : ( strtolower( $cur ) === 'eur' ? 'de-DE' : 'en-US' ),
		'nonce'          => wp_create_nonce( 'wp_rest' ),
		'msgUnavailable' => 'Online payment is switched off right now \u2014 please contact us and we will register you.',
		'msgSending'     => 'Taking you to Stripe\u2026',
		'msgError'       => 'We could not start checkout. Please try again, or email us and we will register you by hand.',
	) ) . ';</script>';
}

function aa_reg_inline( $course, $cohort, $cur, $prefix = 'aareg' ) {
	$live = aa_reg_is_live();
	return '<form class="aareg-inline ' . esc_attr( $prefix ) . '-inline" data-aa-inline novalidate'
	     . ' data-cohort="' . esc_attr( $cohort['id'] ) . '"'
	     . ' data-price="' . (int) $course['price'] . '">'
	     . '<label class="aareg-inline-field"><span class="aacal-sr">' . esc_html( aa_reg_t( 'your_email', 'Your email' ) ) . '</span>'
	     . '<input name="email" type="email" autocomplete="email" inputmode="email"'
	     . ' placeholder="Your email" required></label>'
	     . '<div class="aareg-inline-row">'
	     . '<div class="aareg-inline-stepper">'
	     . '<button type="button" data-inline-seats="-1" aria-label="Fewer seats">&minus;</button>'
	     . '<span data-inline-seats-value aria-live="polite">1</span>'
	     . '<button type="button" data-inline-seats="1" aria-label="More seats">+</button></div>'
	     . '<p class="aareg-inline-total" data-inline-total>'
	     . esc_html( aa_reg_money( $course['price'], $cur ) ) . '</p></div>'
	     . '<button type="submit" class="aareg-inline-pay" data-inline-pay' . ( $live ? '' : ' disabled' ) . '>'
	     . esc_html( $live ? aa_reg_t( 'pay', 'Pay securely with Stripe' ) : aa_reg_t( 'pay_off', 'Registration temporarily unavailable' ) ) . '</button>'
	     . '<p class="aareg-inline-note" data-inline-note>'
	     . esc_html( $live
	         ? 'Exam fee included. You will be taken to Stripe to pay.'
	         : 'Online payment is switched off right now — please contact us.' )
	     . '</p></form>';
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
	echo '<tr><th scope="row">Replace the hero and the Fluent Form</th><td>'
	   . '<input type="hidden" name="aa_reg_autoplace" value="no">'
	   . '<label><input type="checkbox" name="aa_reg_autoplace" value="yes"' . checked( aa_reg_autoplace_on(), true, false ) . '> On course pages, swap the old hero for the new one and the Fluent Form for the new registration.</label>'
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
	     . ( $is_first ? '<span class="' . $prefix . '-flag">' . esc_html( aa_reg_t( 'next_avail', 'Next available' ) ) . '</span>' : '' ) . '</span>'
	     . '<span class="' . $prefix . '-line2"><span class="' . $prefix . '-kind">'
	     . esc_html( ucfirst( $kind ) . ' · ' . $c['hours'] ) . '</span>'
	     . '<span class="' . $prefix . '-status' . ( $hot ? ' is-hot' : '' ) . '">'
	     . esc_html( $hot ? sprintf( aa_reg_t( 'seats_left', '%d seats left' ), $left ) : aa_reg_t( 'seats_open', 'Seats open' ) ) . '</span></span>'
	     . '</span>'
	     . '<span class="' . $prefix . '-price">' . esc_html( aa_reg_money( $course['price'], $cur ) ) . '</span>'
	     . '<span class="' . $prefix . '-check" aria-hidden="true">&#10003;</span>'
	     . '</button></article>';
}

/**
 * The breadcrumb the course pages already carry, byte for byte.
 *
 * The new hero replaces the old one wholesale, so anything the old hero had
 * and this one does not simply disappears. This is the one piece being kept
 * unchanged: same markup, same `mono aa-rte-crumb` classes (named for RTE but
 * used by every course page), so the rules already in the sheet style it and
 * nothing needs adding to the CSS.
 *
 * The parent URL is the course URL minus its last segment, which is right for
 * every course on the site — /training/adv-safe/spc/ sits under
 * /training/adv-safe/ — and the label is per course because the pages say
 * "Advanced SAFe" where the parent page is titled "SAFe Advanced".
 */
function aa_reg_crumb( $course ) {
	if ( empty( $course['crumb'] ) || empty( $course['url'] ) ) { return ''; }
	$parent = trailingslashit( dirname( untrailingslashit( $course['url'] ) ) );
	return '<nav aria-label="Breadcrumb" class="mono aa-rte-crumb">'
	     . '<a href="' . esc_url( $parent ) . '">&larr; ' . esc_html( aa_reg_t( 'back_to', 'Back to' ) . ' ' . $course['crumb'] ) . '</a>'
	     . '<span>' . esc_html( $course['code'] ) . '</span></nav>';
}

/**
 * One month of the schedule: week groups, each holding its batch rows.
 *
 * Shared by the panel (for the open month) and by the REST route (for the
 * rest), so a lazily-loaded month is byte-identical to one rendered inline.
 */
function aa_reg_month_html( $course, $m, $first_id, $cur ) {
	$h = '';
	// Week groups turn one long month into three or four short lists.
	foreach ( aa_reg_by_week( $m['items'] ) as $week ) {
		$h .= '<section class="aacal-week" data-week><div class="aacal-weekhead">'
		    . '<h3>' . esc_html( aa_reg_t( 'week_of', 'Week of' ) . ' ' . ( new DateTime( $week['monday'] ) )->format( 'M j' ) ) . '</h3>'
		    . '<p data-week-count>' . esc_html( aa_reg_batches_label( count( $week['items'] ) ) ) . '</p>'
		    . '</div><div class="aacal-rows">';
		foreach ( $week['items'] as $c ) {
			$h .= aa_reg_row( $course, $c, $c['id'] === $first_id, $cur );
		}
		$h .= '</div></section>';
	}
	return $h;
}

function aa_reg_hero( $atts ) {
	$a       = shortcode_atts( array( 'course' => 'spc' ), $atts, 'aa_course_hero' );
	$course  = aa_reg_course( $a['course'] );
	if ( ! $course ) { return ''; }
	$cohorts = aa_reg_upcoming( $a['course'], $course );
	if ( ! $cohorts ) { return ''; }
	$months  = aa_reg_months( $cohorts );
	$first   = $cohorts[0];
	$cur     = $course['currency'];

	$h  = '<section class="aahero' . aa_reg_dir_class() . '" id="aahero"' . aa_reg_dir_attr()
	    . ' aria-labelledby="aahero-title"><div class="aahero-shell">';
	$h .= '<div class="aahero-copy">';
	$h .= aa_reg_crumb( $course );
	$h .= '<p class="aahero-eyebrow">' . esc_html( $course['eyebrow'] ) . '</p>';
	$h .= '<h1 class="aahero-h1" id="aahero-title">' . esc_html( $course['h1'] ) . '</h1>';
	$h .= '<p class="aahero-lede">' . esc_html( $course['lede'] ) . '</p>';
	$h .= '<ul class="aahero-proof">';
	foreach ( $course['proof'] as $p ) { $h .= '<li>' . esc_html( $p ) . '</li>'; }
	$h .= '</ul>';
	$h .= '<div class="aahero-facts"><div><p class="aahero-minilabel">' . esc_html( aa_reg_t( 'next_batch', 'Next batch' ) ) . '</p>'
	    . '<p class="aahero-fact" data-hero-range>' . esc_html( aa_reg_range( $first['start'], $first['end'] ) ) . '</p></div>'
	    . '<span class="aahero-rule" aria-hidden="true"></span>'
	    . '<div><p class="aahero-minilabel">' . esc_html( aa_reg_t( 'investment', 'Investment' ) ) . '</p><p class="aahero-fact">'
	    . esc_html( aa_reg_money( $course['price'], $course['currency'] ) )
	    . ' <span class="aahero-factnote">' . esc_html( aa_reg_t( 'exam_included', 'exam included' ) ) . '</span></p></div></div>';
	$h .= '</div>';

	$h .= '<div class="aahero-picker"><div class="aahero-pickhead">'
	    . '<p class="aahero-picktitle">' . esc_html( aa_reg_t( 'pick_dates', 'Pick your dates' ) ) . '</p>'
	    . '<p class="aahero-picknote">' . esc_html( sprintf( count( $cohorts ) === 1 ? aa_reg_t( 'batch_1', '%d batch scheduled' ) : aa_reg_t( 'batch_n', '%d batches scheduled' ), count( $cohorts ) ) ) . '</p></div>';

	$h .= aa_reg_tabs( 'aahero', $months );

	$i = 0;
	foreach ( $months as $k => $m ) {
		$h .= '<div class="aahero-list" role="tabpanel" id="aahero-panel-' . esc_attr( $k ) . '"'
		    . ' aria-labelledby="aahero-tab-' . esc_attr( $k ) . '" data-month="' . esc_attr( $k ) . '"'
		    . ( $i === 0 ? '' : ' hidden' ) . '>';
		/* The whole month, in a list the CSS caps and scrolls after about five
		   rows. It used to be cut to the nearest four with no way to reach the
		   rest — on a course running twice a week that hid two thirds of the
		   month behind nothing at all, and the month tab said "14 batches"
		   above four of them. Capped and scrollable keeps the hero glanceable
		   without lying about what is in the month. */
		/* Same row renderer as the schedule below, in the hero's namespace, so
		   the hero and the list say the same thing about a batch. */
		foreach ( $m['items'] as $c ) {
			$h .= aa_reg_row( $course, $c, $c['id'] === $first['id'], $cur, 'aahero' );
		}
		$h .= '</div>';
		$i++;
	}

	/* The hero takes the money itself. It used to carry a "Reserve <dates>"
	   button that scrolled to the form at the bottom of the page — which is a
	   round trip and a re-pick for someone who has already chosen up here. The
	   compact checkout below is the whole purchase.

	   The link to the full schedule stays, because the hero shows one course's
	   next few months and someone may genuinely want the rest. */
	$h .= aa_reg_config_script( $a['course'], $course, $cur );
	$h .= aa_reg_inline( $course, $first, $cur, 'aahero' );
	$h .= '<p class="aahero-hint"><a href="#aacal" data-hero-cta>' . esc_html( aa_reg_t( 'full_schedule', 'See the full schedule' ) ) . ' &#10230;</a></p>';
	$h .= '<p class="aahero-private">' . esc_html( aa_reg_t( 'no_dates', 'Dates don\'t work?' ) )
	    . ' <a href="/contact/">' . esc_html( aa_reg_t( 'private', 'Ask for a private cohort' ) ) . '</a></p>';
	$h .= '</div></div>';

	/* The stats bar carries only figures already published elsewhere on the
	   site. The handoff's placeholders — "4.9/5 from 380 alumni", "92%
	   first-attempt pass" — are deliberately not here: a visible star rating
	   is the aggregateRating claim that was stripped from 23 pages, and a
	   pass-rate figure is the pass-guarantee wording the copy rule forbids. */
	$h .= '<div class="aahero-bar"><p class="aahero-scroll">' . esc_html( aa_reg_t( 'scroll', 'Scroll for the full schedule and registration' ) ) . ' &#8595;</p>'
	    . '<ul class="aahero-stats"><li><strong>2,500+</strong> ' . esc_html( aa_reg_t( 'trained', 'trained' ) ) . '</li>'
	    . '<li><strong>80+</strong> ' . esc_html( aa_reg_t( 'arts', 'ARTs launched' ) ) . '</li>'
	    . '<li><strong>' . esc_html( aa_reg_t( 'exam_fee', 'Exam fee' ) ) . '</strong> ' . esc_html( aa_reg_t( 'included', 'included' ) ) . '</li></ul></div>';
	$h .= '</section>';
	return $h;
}
add_shortcode( 'aa_course_hero', 'aa_reg_hero' );

function aa_reg_panel( $atts ) {
	$a       = shortcode_atts( array( 'course' => 'spc' ), $atts, 'aa_course_register' );
	$course  = aa_reg_course( $a['course'] );
	if ( ! $course ) { return ''; }
	$cohorts = aa_reg_upcoming( $a['course'], $course );
	if ( ! $cohorts ) { return ''; }
	$months  = aa_reg_months( $cohorts );
	$first   = $cohorts[0];
	$live    = aa_reg_is_live();
	$cur     = $course['currency'];

	$h  = '<section class="aacal' . aa_reg_dir_class() . '" id="aacal"' . aa_reg_dir_attr()
	    . ' aria-labelledby="aacal-title">';
	$h .= '<a class="aacal-skip" href="#aacal-form">' . esc_html( aa_reg_t( 'skip_form', 'Skip to the registration form' ) ) . '</a>';
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
		    . '<button type="button" class="aacal-chip is-on" data-filter="all" aria-pressed="true">' . esc_html( aa_reg_t( 'all_batches', 'All batches' ) ) . '</button>';
		if ( isset( $kinds['weekday'] ) ) {
			$h .= '<button type="button" class="aacal-chip" data-filter="weekday" aria-pressed="false">' . esc_html( aa_reg_t( 'weekday', 'Weekday' ) ) . '</button>';
		}
		if ( isset( $kinds['weekend'] ) ) {
			$h .= '<button type="button" class="aacal-chip" data-filter="weekend" aria-pressed="false">' . esc_html( aa_reg_t( 'weekend', 'Weekend' ) ) . '</button>';
		}
		$h .= '</div>';
	}

	/* Only the open month's rows are in the page. The others arrive from
	   /wp-json/aa/v1/batches the first time their tab is used.

	   A row is about 1.4KB of markup, and a course running three times a week
	   for 26 weeks has 78 of them: RTE's panel was 108KB of HTML, on pages
	   already being trimmed for weight. Every one of those rows was hidden —
	   a tab panel carries `hidden` until its tab is picked — so the bytes were
	   paid for on every load and read by nobody.

	   Nothing is lost with JavaScript off either, and that is worth being
	   precise about: a `hidden` panel stays hidden without JS, so the later
	   months were already unreachable. What used to be 108KB of unreachable
	   markup is now one month of reachable markup.

	   The fragment is rendered by aa_reg_row() on the server, the same call as
	   below, so there is still exactly one thing that decides what a batch is
	   called. */
	$i = 0;
	foreach ( $months as $k => $m ) {
		$dense = count( $m['items'] ) > aa_reg_dense_at();
		$h .= '<div class="aacal-panel-month' . ( $dense ? '' : ' is-sparse' ) . '" role="tabpanel"'
		    . ' id="aacal-panel-' . esc_attr( $k ) . '" aria-labelledby="aacal-tab-' . esc_attr( $k ) . '"'
		    . ' data-month="' . esc_attr( $k ) . '"'
		    . ' data-month-count="' . (int) count( $m['items'] ) . '"'
		    . ( $i === 0 ? '' : ' hidden data-lazy="1"' ) . '>';
		if ( $i === 0 ) {
			$h .= aa_reg_month_html( $course, $m, $first['id'], $cur );
		}
		$h .= '</div>';
		$i++;
	}

	$h .= '<p class="aacal-empty" data-empty hidden>' . esc_html( aa_reg_t( 'no_match', 'No batches match that filter this month' ) ) . ' · '
	    . '<button type="button" class="aacal-link" data-filter="all">' . esc_html( aa_reg_t( 'show_all', 'Show all batches' ) ) . '</button></p>';
	/* THE LANGUAGES ARE A SELLING POINT, NOT A DISCLAIMER. The old line said
	   only "All batches run live online in English", which reads as a limit and
	   hides that we teach the same courses in four languages. What is on the
	   schedule below is still the English cohorts, so the sentence keeps saying
	   so plainly rather than implying a Spanish batch can be booked from this
	   list -- it points at the conversation instead. */
	$h .= '<p class="aacal-note">' . esc_html( aa_reg_t( 'languages', 'Live online in English. Also delivered in Spanish, French and Arabic — ' ) )
	    . '<a href="/contact/">' . esc_html( aa_reg_t( 'languages_cta', 'ask about a cohort in your language, or private dates' ) ) . '</a>.</p>';
	$h .= '</div>';

	/* ---- right: two-step form ---- */
	$h .= '<div class="aacal-right" id="aacal-form">';
	// .aacal-num is not decoration: goStep() swaps its text to a tick as the
	// wizard advances, and a bare <span> makes that a null dereference.
	$h .= '<ol class="aacal-steps"><li class="aacal-step is-on" data-step="1"><span class="aacal-num">1</span> ' . esc_html( aa_reg_t( 'step_details', 'Your details' ) ) . '</li>'
	    . '<li class="aacal-step" data-step="2"><span class="aacal-num">2</span> ' . esc_html( aa_reg_t( 'step_pay', 'Review & pay' ) ) . '</li></ol>';
	$h .= '<div class="aacal-selected" aria-live="polite">'
	    . '<p class="aacal-sel-label" data-sel-label>' . esc_html( aa_reg_t( 'selected', 'Selected · next available' ) ) . '</p>'
	    . '<p class="aacal-sel-range" data-sel-range>' . esc_html( aa_reg_range( $first['start'], $first['end'] ) ) . '</p>'
	    . '<p class="aacal-sel-batch" data-sel-batch>' . esc_html( $first['batch'] ) . '</p></div>';

	/* ONE FIELD. Everything else — cardholder name, billing address, the card —
	   Stripe collects on its own page, and asking for it here first is asking
	   twice. The email stays because it prefills Stripe and because it is the
	   only record of someone who abandons at the payment step. */
	$h .= '<form class="aacal-panel" data-panel="1" novalidate>'
	    . '<label class="aacal-field"><span class="aacal-sr">' . esc_html( aa_reg_t( 'your_email', 'Your email' ) ) . '</span>'
	    . '<input name="email" type="email" autocomplete="email" inputmode="email"'
	    . ' placeholder="Your email" required></label>'
	    . '<div class="aacal-seatsrow"><div><p class="aacal-minilabel">' . esc_html( aa_reg_t( 'seats', 'Seats' ) ) . '</p>'
	    . '<div class="aacal-stepper"><button type="button" data-seats="-1" aria-label="Fewer seats">&minus;</button>'
	    . '<span data-seats-value aria-live="polite">1</span>'
	    . '<button type="button" data-seats="1" aria-label="More seats">+</button></div></div>'
	    . '<div class="aacal-totalbox"><p class="aacal-minilabel">' . esc_html( aa_reg_t( 'total', 'Total' ) ) . '</p>'
	    . '<p class="aacal-total" data-total>' . esc_html( aa_reg_money( $course['price'], $cur ) ) . '</p></div></div>'
	    . '<button type="submit" class="aacal-cta" data-next disabled>' . esc_html( aa_reg_t( 'continue', 'Continue to review' ) ) . '</button>'
	    . '<p class="aacal-hint" data-hint>' . esc_html( aa_reg_t( 'enter_email', 'Enter your email to continue.' ) ) . '</p>'
	    . '</form>';

	$h .= '<form class="aacal-panel" data-panel="2" hidden novalidate>'
	    . '<dl class="aacal-review">'
	    . '<div><dt>' . esc_html( aa_reg_t( 'course', 'Course' ) ) . '</dt><dd>' . esc_html( $course['name'] ) . '</dd></div>'
	    . '<div><dt>' . esc_html( aa_reg_t( 'dates', 'Dates' ) ) . '</dt><dd data-rev-dates></dd></div>'
	    . '<div><dt>' . esc_html( aa_reg_t( 'email', 'Email' ) ) . '</dt><dd data-rev-email>&mdash;</dd></div>'
	    . '<div><dt>' . esc_html( aa_reg_t( 'seats', 'Seats' ) ) . '</dt><dd data-rev-seats>1</dd></div>'
	    . '<div class="aacal-review-total"><dt>' . esc_html( aa_reg_t( 'total_exam', 'Total · exam fee included' ) ) . '</dt>'
	    . '<dd data-rev-total>' . esc_html( aa_reg_money( $course['price'], $cur ) ) . '</dd></div></dl>'
	    . '<label class="aacal-consent"><input type="checkbox" name="consent" required>'
	    . '<span>I agree to the <a href="/terms/">booking terms</a> and to processing my details for this registration.</span></label>'
	    . '<button type="submit" class="aacal-cta" data-pay disabled>'
	    . esc_html( $live ? aa_reg_t( 'pay', 'Pay securely with Stripe' ) : aa_reg_t( 'pay_off', 'Registration temporarily unavailable' ) ) . '</button>'
	    . '<div class="aacal-backrow"><button type="button" class="aacal-link" data-back>&larr; Edit details</button></div>'
	    . '<p class="aacal-hint" data-hint2>'
	    . esc_html( $live
	        ? 'You will be taken to Stripe to pay. We never see your card details.'
	        : 'Online payment is switched off right now — please contact us and we will register you.' )
	    . '</p></form>';

	$h .= '<div class="aacal-done" data-panel="done" hidden role="status">'
	    . '<p class="aacal-done-h">You\'re in, <span data-done-name>there</span>.</p>'
	    . '<p class="aacal-done-p"><span data-done-summary></span>. Your receipt and joining details are on the way to <span data-done-email>your inbox</span>.</p>'
	    . '<button type="button" class="aacal-link" data-reset>' . esc_html( aa_reg_t( 'book_another', 'Book another seat' ) ) . '</button></div>';

	/* No fixed reschedule window. Rescheduling carries no fee, but "up to 10
	   days before the batch starts" is a deadline nobody agreed to and one a
	   buyer could hold us to. State the fee and not the window. */
	$h .= '<p class="aacal-fine">' . esc_html( aa_reg_t( 'fine', 'Need to move dates? Rescheduling carries no fee. The exam fee is included in the price.' ) ) . '</p>';
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

	$h .= aa_reg_config_script( $a['course'], $course, $cur );
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

/**
 * True when the swap is switched on.
 *
 * ON BY DEFAULT, and off only when explicitly turned off. It used to default
 * to off so the new hero could be looked at before it went live everywhere —
 * but the cost of that was a silent one: install all three snippets correctly
 * and the site looks exactly as it did, with nothing anywhere saying why. An
 * unticked box is indistinguishable from a broken install, and it cost us
 * several rounds of debugging.
 *
 * The settings form posts a hidden 'no' before the checkbox, so an unticked
 * box stores 'no' rather than nothing — which is what lets "never configured"
 * (default on) be told apart from "deliberately turned off".
 */
function aa_reg_autoplace_on() {
	return get_option( 'aa_reg_autoplace', 'yes' ) !== 'no';
}

/* ============================================================================
   LANGUAGE
   ----------------------------------------------------------------------------
   The mirrors under /es/, /fr/ and /ar/ used to be refused outright: the swap
   checked the page's top-level ancestor and left translated pages on the old
   hero rather than give a French page an English one. That was the right call
   while the copy lived only in aa_reg_courses(), and it is why Arabic was
   still showing the old format long after every English page had moved.

   It is no longer necessary, because aa_reg_derived_course() builds a course
   out of the page it is standing on -- title, lede, breadcrumb and cohort
   config all come from that page's own post_title, post_excerpt, parent and
   #aa-cohorts element. On a Spanish page those are already Spanish. The only
   English left was this file's own chrome, and that is what the table below
   translates. So the rule flips: the mirrors are not skipped, they are read.

   English is the fallback for every key. A missing translation renders the
   English word rather than an empty element or a raw key.
   ========================================================================== */

/** 'en' | 'es' | 'fr' | 'ar' for a post, or for the current page if omitted. */
function aa_reg_lang( $post = null ) {
	if ( $post === null ) {
		static $cur = null;
		if ( $cur !== null ) { return $cur; }
		$obj = get_queried_object();
		if ( ! ( $obj instanceof WP_Post ) && isset( $GLOBALS['post'] ) ) { $obj = $GLOBALS['post']; }
		$cur = ( $obj instanceof WP_Post ) ? aa_reg_lang( $obj ) : 'en';
		return $cur;
	}
	if ( ! ( $post instanceof WP_Post ) ) { return 'en'; }
	$anc  = get_post_ancestors( $post->ID );
	$root = $anc ? get_post( end( $anc ) ) : $post;
	if ( ! $root ) { return 'en'; }
	return in_array( $root->post_name, aa_reg_lang_roots(), true ) ? $root->post_name : 'en';
}

/** Arabic is the only right-to-left language we publish in. */
function aa_reg_is_rtl( $lang = null ) {
	return ( $lang === null ? aa_reg_lang() : $lang ) === 'ar';
}

/**
 * lang and dir for the two section roots.
 *
 * Set on the section rather than left to the theme because these two sections
 * are swapped into pages whose <html dir> we do not control, and a mirrored
 * grid with a left-to-right price column reads as a rendering fault. dir is an
 * HTML attribute, not styling, so it also fixes the things CSS cannot: where
 * the caret sits in the email field, which way the date range reads, and how a
 * screen reader announces the row.
 */
function aa_reg_dir_attr() {
	$lang = aa_reg_lang();
	if ( $lang === 'en' ) { return ''; }
	return ' lang="' . esc_attr( $lang ) . '"' . ( aa_reg_is_rtl( $lang ) ? ' dir="rtl"' : '' );
}

/** ' is-rtl' when the page is Arabic, for the handful of rules dir cannot reach. */
function aa_reg_dir_class() {
	return aa_reg_is_rtl() ? ' is-rtl' : '';
}

/**
 * The chrome, in four languages.
 *
 * Only strings this file renders itself. Anything that belongs to the course
 * -- its name, its lede, its breadcrumb -- comes from the page and is already
 * in the right language, so it is deliberately absent here.
 */
function aa_reg_strings() {
	return array(
		'es' => array(
			'next_batch'    => 'Próxima convocatoria',
			'investment'    => 'Inversión',
			'exam_included' => 'examen incluido',
			'pick_dates'    => 'Elige tus fechas',
			'batch_1'       => '%d convocatoria programada',
			'batch_n'       => '%d convocatorias programadas',
			'full_schedule' => 'Ver el calendario completo',
			'no_dates'      => '¿No te encajan las fechas?',
			'private'       => 'Solicita una convocatoria privada',
			'scroll'        => 'Desplázate para ver el calendario y la inscripción',
			'trained'       => 'formados',
			'arts'          => 'ART lanzados',
			'exam_fee'      => 'Tasa de examen',
			'included'      => 'incluida',
			'skip_form'     => 'Ir al formulario de inscripción',
			'all_batches'   => 'Todas las convocatorias',
			'weekday'       => 'Entre semana',
			'weekend'       => 'Fin de semana',
			'show_all'      => 'Mostrar todas las convocatorias',
			'no_match'      => 'Ninguna convocatoria coincide con ese filtro este mes',
			'languages'     => 'En directo en línea, en inglés. También impartimos en español, francés y árabe — ',
			'languages_cta' => 'consulta por una convocatoria en tu idioma o fechas privadas',
			'selected'      => 'Seleccionada · próxima disponible',
			'your_email'    => 'Tu correo electrónico',
			'seats'         => 'Plazas',
			'total'         => 'Total',
			'continue'      => 'Continuar a la revisión',
			'enter_email'   => 'Introduce tu correo para continuar.',
			'course'        => 'Curso',
			'dates'         => 'Fechas',
			'email'         => 'Correo electrónico',
			'total_exam'    => 'Total · tasa de examen incluida',
			'pay'           => 'Paga de forma segura con Stripe',
			'pay_off'       => 'Inscripción no disponible temporalmente',
			'book_another'  => 'Reservar otra plaza',
			'fine'          => '¿Necesitas cambiar de fechas? El cambio no tiene coste. La tasa de examen está incluida en el precio.',
			'step_details'  => 'Tus datos',
			'step_pay'      => 'Revisar y pagar',
			'next_avail'    => 'Próxima disponible',
			'seats_left'    => 'quedan %d plazas',
			'seats_open'    => 'Plazas disponibles',
			'week_of'       => 'Semana del',
			'batch_weekend' => 'Convocatoria de fin de semana',
			'batch_morning' => 'Convocatoria entre semana, mañanas',
			'batch_after'   => 'Convocatoria entre semana, tardes',
			'batch_evening' => 'Convocatoria de tarde-noche',
			'back_to'       => 'Volver a',
			'training'      => 'Formación',
			'live_online'   => 'En directo en línea',
			'exam_inc_full' => 'Tasa de examen incluida',
		),
		'fr' => array(
			'next_batch'    => 'Prochaine session',
			'investment'    => 'Investissement',
			'exam_included' => 'examen inclus',
			'pick_dates'    => 'Choisissez vos dates',
			'batch_1'       => '%d session programmée',
			'batch_n'       => '%d sessions programmées',
			'full_schedule' => 'Voir le calendrier complet',
			'no_dates'      => 'Les dates ne conviennent pas ?',
			'private'       => 'Demandez une session privée',
			'scroll'        => 'Faites défiler pour le calendrier et l\'inscription',
			'trained'       => 'formés',
			'arts'          => 'ART lancés',
			'exam_fee'      => 'Frais d\'examen',
			'included'      => 'inclus',
			'skip_form'     => 'Aller au formulaire d\'inscription',
			'all_batches'   => 'Toutes les sessions',
			'weekday'       => 'En semaine',
			'weekend'       => 'Week-end',
			'show_all'      => 'Afficher toutes les sessions',
			'no_match'      => 'Aucune session ne correspond à ce filtre ce mois-ci',
			'languages'     => 'En direct en ligne, en anglais. Également dispensé en espagnol, français et arabe — ',
			'languages_cta' => 'demandez une session dans votre langue, ou des dates privées',
			'selected'      => 'Sélectionnée · prochaine disponible',
			'your_email'    => 'Votre e-mail',
			'seats'         => 'Places',
			'total'         => 'Total',
			'continue'      => 'Continuer vers la récapitulation',
			'enter_email'   => 'Saisissez votre e-mail pour continuer.',
			'course'        => 'Formation',
			'dates'         => 'Dates',
			'email'         => 'E-mail',
			'total_exam'    => 'Total · frais d\'examen inclus',
			'pay'           => 'Payer en toute sécurité avec Stripe',
			'pay_off'       => 'Inscription temporairement indisponible',
			'book_another'  => 'Réserver une autre place',
			'fine'          => 'Besoin de changer de dates ? Le report est sans frais. Les frais d\'examen sont compris dans le prix.',
			'step_details'  => 'Vos coordonnées',
			'step_pay'      => 'Vérifier et payer',
			'next_avail'    => 'Prochaine disponible',
			'seats_left'    => 'il reste %d places',
			'seats_open'    => 'Places disponibles',
			'week_of'       => 'Semaine du',
			'batch_weekend' => 'Session de week-end',
			'batch_morning' => 'Session en semaine, le matin',
			'batch_after'   => 'Session en semaine, l\'après-midi',
			'batch_evening' => 'Session en soirée',
			'back_to'       => 'Retour à',
			'training'      => 'Formations',
			'live_online'   => 'En direct en ligne',
			'exam_inc_full' => 'Frais d\'examen inclus',
		),
		'ar' => array(
			'next_batch'    => 'الدورة القادمة',
			'investment'    => 'الاستثمار',
			'exam_included' => 'الامتحان مشمول',
			'pick_dates'    => 'اختر التواريخ المناسبة لك',
			'batch_1'       => 'دورة واحدة مجدولة',
			'batch_n'       => '%d دورات مجدولة',
			'full_schedule' => 'عرض الجدول الكامل',
			'no_dates'      => 'التواريخ لا تناسبك؟',
			'private'       => 'اطلب دورة خاصة',
			'scroll'        => 'مرّر لأسفل لعرض الجدول الكامل والتسجيل',
			'trained'       => 'متدرب',
			'arts'          => 'قطار إصدار رشيق تم إطلاقه',
			'exam_fee'      => 'رسوم الامتحان',
			'included'      => 'مشمولة',
			'skip_form'     => 'الانتقال إلى نموذج التسجيل',
			'all_batches'   => 'كل الدورات',
			'weekday'       => 'أيام الأسبوع',
			'weekend'       => 'عطلة نهاية الأسبوع',
			'show_all'      => 'عرض كل الدورات',
			'no_match'      => 'لا توجد دورات تطابق هذا التصفية هذا الشهر',
			'languages'     => 'مباشر عبر الإنترنت بالإنجليزية. نقدّمها أيضًا بالإسبانية والفرنسية والعربية — ',
			'languages_cta' => 'اسأل عن دورة بلغتك أو عن مواعيد خاصة',
			'selected'      => 'المحددة · الأقرب المتاحة',
			'your_email'    => 'بريدك الإلكتروني',
			'seats'         => 'المقاعد',
			'total'         => 'الإجمالي',
			'continue'      => 'المتابعة إلى المراجعة',
			'enter_email'   => 'أدخل بريدك الإلكتروني للمتابعة.',
			'course'        => 'الدورة',
			'dates'         => 'التواريخ',
			'email'         => 'البريد الإلكتروني',
			'total_exam'    => 'الإجمالي · رسوم الامتحان مشمولة',
			'pay'           => 'ادفع بأمان عبر Stripe',
			'pay_off'       => 'التسجيل غير متاح مؤقتًا',
			'book_another'  => 'حجز مقعد آخر',
			'fine'          => 'تحتاج إلى تغيير التواريخ؟ إعادة الجدولة بدون رسوم. رسوم الامتحان مشمولة في السعر.',
			'step_details'  => 'بياناتك',
			'step_pay'      => 'المراجعة والدفع',
			'next_avail'    => 'الأقرب المتاحة',
			'seats_left'    => 'بقي %d مقاعد',
			'seats_open'    => 'مقاعد متاحة',
			'week_of'       => 'أسبوع',
			'batch_weekend' => 'دورة عطلة نهاية الأسبوع',
			'batch_morning' => 'دورة صباحية في أيام الأسبوع',
			'batch_after'   => 'دورة بعد الظهر في أيام الأسبوع',
			'batch_evening' => 'دورة مسائية',
			'back_to'       => 'العودة إلى',
			'training'      => 'التدريب',
			'live_online'   => 'مباشر عبر الإنترنت',
			'exam_inc_full' => 'رسوم الامتحان مشمولة',
		),
	);
}

/** One chrome string in the current page's language, English if untranslated. */
function aa_reg_t( $key, $en ) {
	$lang = aa_reg_lang();
	if ( $lang === 'en' ) { return $en; }
	$all = aa_reg_strings();
	return isset( $all[ $lang ][ $key ] ) && $all[ $lang ][ $key ] !== ''
		? $all[ $lang ][ $key ]
		: $en;
}

/** Top-level section slugs that mean "this is a translated mirror". */
function aa_reg_lang_roots() {
	return array( 'es', 'fr', 'ar' );
}

/**
 * The course this page is for, or '' — matched on the page slug.
 *
 * ENGLISH PAGES ONLY, and that restriction is the whole point of this
 * function rather than a plain slug lookup. The mirrors reuse the English
 * slug — /training/adv-safe/rte/, /fr/rte/, /es/rte/ and /ar/rte/ are all
 * post_name "rte" — so a bare slug match would swap a French page's hero for
 * one built from aa_reg_courses(), whose h1, lede and proof lines are all
 * English. A French visitor would get an English hero and an English
 * registration form on a French page.
 *
 * So a page under a language root is left alone. When the course table grows
 * per-language copy, this is the one place that has to change.
 *
 * A slug with no row in aa_reg_courses() also returns '', which is what keeps
 * the other courses untouched until their cadence is known.
 */
function aa_reg_page_course() {
	static $key = null;
	if ( $key !== null ) { return $key; }
	$key = '';
	if ( is_admin() ) { return $key; }

	$obj = get_queried_object();
	if ( ! ( $obj instanceof WP_Post ) && isset( $GLOBALS['post'] ) ) { $obj = $GLOBALS['post']; }
	if ( ! ( $obj instanceof WP_Post ) || $obj->post_type !== 'page' ) { return $key; }

	/* The language sections are no longer refused here. aa_reg_course() now
	   resolves a mirror from its own page, and every string this file renders
	   goes through aa_reg_t(), so /es/, /fr/ and /ar/ get the same design in
	   their own words instead of being left behind on the old hero. */
	if ( ! aa_reg_course( $obj->post_name ) ) { return $key; }

	$key = $obj->post_name;
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
	if ( empty( $block['blockName'] ) ) { return $html; }
	if ( ! aa_reg_autoplace_on() ) { return $html; }
	$course = aa_reg_page_course();
	if ( $course === '' ) { return $html; }

	/* THE BLANK GAP ABOVE THE REGISTRATION.
	   The old "AA - Course JS" snippet filled two mount points on every course
	   page: #aa-agenda in the hero, and #aa-pick under the heading "Select your
	   class, then your registration opens below". With that snippet switched
	   off they are empty divs -- and #aa-agenda no longer matters, because this
	   snippet replaces the whole hero section it lived in, but #aa-pick sits in
	   the #enroll section, which nothing replaces. So the page renders a
	   heading promising a picker, then several hundred pixels of nothing, and
	   only then the real registration.

	   Both the heading and the empty div go. Not the rest of the block: the
	   "what's included" card lives in the same core/html and is still true.

	   Only the EMPTY div is matched. If something ever fills #aa-pick again,
	   this stops matching and leaves it alone rather than deleting a working
	   picker. */
	if ( $block['blockName'] === 'core/html' ) {
		if ( strpos( $html, 'aa-pick' ) === false ) { return $html; }
		$cleaned = preg_replace(
			'#(?:<h\d\b[^>]*>(?:(?!</h\d>).)*?</h\d>\s*)?<div\b[^>]*\bid="aa-pick"[^>]*>\s*</div>#is',
			'',
			$html,
			1
		);
		return $cleaned !== null ? $cleaned : $html;
	}

	if ( $block['blockName'] !== 'core/group' ) { return $html; }

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
   [aa_reg_selftest]  —  why is this page not doing what I expect?
   ----------------------------------------------------------------------------
   Put it on any page and view it as an administrator; it prints nothing for
   anyone else, so it is safe to leave in place. It answers, in one look, every
   question that otherwise takes a round of screenshots:

     - is the snippet running at all
     - is the swap switched on
     - did this page resolve to a course, and if not, why not
     - does this page actually CONTAIN the two blocks the swap looks for
     - how many batches the schedule generates for it

   That last pair is the one that matters. The hero and the registration are
   swapped by the same filter, so "the hero changed but the list did not" can
   only mean the page has an aa-hero block and no aa-reg block — which this
   prints, instead of leaving it to be guessed at.
   ========================================================================== */
function aa_reg_find_classes( $blocks, &$found ) {
	foreach ( (array) $blocks as $b ) {
		if ( ! empty( $b['attrs']['className'] ) ) {
			foreach ( preg_split( '/\s+/', $b['attrs']['className'] ) as $c ) {
				if ( $c !== '' ) {
					$key = $b['blockName'] . ' .' . $c;
					$found[ $key ] = isset( $found[ $key ] ) ? $found[ $key ] + 1 : 1;
				}
			}
		}
		if ( ! empty( $b['innerBlocks'] ) ) { aa_reg_find_classes( $b['innerBlocks'], $found ); }
	}
}

add_shortcode( 'aa_reg_selftest', function () {
	if ( ! current_user_can( 'manage_options' ) ) { return ''; }

	$obj = get_queried_object();
	if ( ! ( $obj instanceof WP_Post ) && isset( $GLOBALS['post'] ) ) { $obj = $GLOBALS['post']; }

	$courses = aa_reg_courses();
	$slug    = $obj instanceof WP_Post ? $obj->post_name : '(no post)';
	$course  = aa_reg_page_course();

	$why = '';
	if ( $course === '' && $obj instanceof WP_Post ) {
		if ( ! aa_reg_course( $obj->post_name ) ) {
			$why = ' — no row in aa_reg_courses(), and no #aa-cohorts element on the page';
		} else {
			$anc  = get_post_ancestors( $obj->ID );
			$root = $anc ? get_post( end( $anc ) ) : null;
			$why  = $root && in_array( $root->post_name, aa_reg_lang_roots(), true )
				? ' — under the /' . $root->post_name . '/ language root, English pages only'
				: ' — slug matches but the page did not resolve';
		}
	}

	$found = array();
	if ( $obj instanceof WP_Post && function_exists( 'parse_blocks' ) ) {
		aa_reg_find_classes( parse_blocks( $obj->post_content ), $found );
	}
	$hero = isset( $found['core/group .aa-hero'] ) ? $found['core/group .aa-hero'] : 0;
	$reg  = isset( $found['core/group .aa-reg'] )  ? $found['core/group .aa-reg']  : 0;

	$lines = array(
		'build              : ' . AA_REG_BUILD,
		'snippet            : loaded (this box proves it)',
		'swap switched on   : ' . ( aa_reg_autoplace_on() ? 'YES' : 'NO  <- Settings > AA Registration' ),
		'checkout live      : ' . ( aa_reg_is_live() ? 'YES' : 'no (prices unconfirmed or no key)' ),
		'this page slug     : ' . $slug,
		'resolved course    : ' . ( $course !== '' ? $course : 'NONE' . $why ),
		'',
		'blocks this page has, that the swap looks for:',
		'  core/group .aa-hero : ' . ( $hero ? $hero . '  -> hero will be replaced' : '0  <- NOT ON THIS PAGE' ),
		'  core/group .aa-reg  : ' . ( $reg  ? $reg  . '  -> registration will be replaced' : '0  <- NOT ON THIS PAGE' ),
	);
	if ( $course !== '' ) {
		$c  = aa_reg_course( $course );
		$up = aa_reg_upcoming( $course, $c );
		$lines[] = '';
		$lines[] = 'source             : ' . ( isset( $courses[ $course ] ) ? 'aa_reg_courses() table' : '#aa-cohorts element on the page' );
		$lines[] = 'schedule for ' . $course . ' : ' . count( $up ) . ' batches, '
		         . $c['days'] . ' day(s), ' . strtoupper( $c['currency'] ) . ' ' . number_format_i18n( $c['price'] );
		if ( $up ) { $lines[] = 'first batch        : ' . $up[0]['start'] . ' (' . $up[0]['id'] . ')'; }
	}
	$lines[] = '';
	$lines[] = 'courses configured : ' . implode( ', ', array_keys( $courses ) );

	return '<pre style="font:12px/1.5 monospace;background:#F5FAFA;border:1px solid #CFE3E3;padding:12px;white-space:pre-wrap">'
		. esc_html( implode( "\n", $lines ) ) . '</pre>';
} );

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
	register_rest_route( 'aa/v1', '/batches', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',   // public: the schedule is public
		'callback'            => 'aa_reg_batches',
	) );
} );

/**
 * GET /wp-json/aa/v1/batches?course=rte&month=2026-11
 *
 * One month of schedule rows, for a tab the visitor has just opened. Public
 * and read-only: it says nothing the page would not have said if every month
 * had been rendered inline, and it takes no input beyond a course key and a
 * month, both of which are checked against what the server generated rather
 * than trusted.
 */
function aa_reg_batches( WP_REST_Request $req ) {
	$key     = (string) $req->get_param( 'course' );
	$month   = (string) $req->get_param( 'month' );

	$course_row = aa_reg_course( $key );
	if ( ! $course_row ) {
		return new WP_Error( 'aa_course', 'Unknown course.', array( 'status' => 404 ) );
	}
	/* The key aa_reg_months() builds, which is month-then-year ("9-2026"), not
	   ISO. Checked against that shape here and then against the real key set
	   below, so a made-up month is a 404 rather than anything reaching a date
	   constructor. */
	if ( ! preg_match( '/^\d{1,2}-\d{4}$/', $month ) ) {
		return new WP_Error( 'aa_month', 'Bad month.', array( 'status' => 400 ) );
	}

	$course  = $course_row;
	$cohorts = aa_reg_upcoming( $key, $course );
	if ( ! $cohorts ) {
		return new WP_Error( 'aa_month', 'No batches.', array( 'status' => 404 ) );
	}
	$months = aa_reg_months( $cohorts );
	if ( ! isset( $months[ $month ] ) ) {
		return new WP_Error( 'aa_month', 'No batches that month.', array( 'status' => 404 ) );
	}

	return array(
		'month' => $month,
		'count' => count( $months[ $month ]['items'] ),
		'html'  => aa_reg_month_html( $course, $months[ $month ], $cohorts[0]['id'], $course['currency'] ),
	);
}

function aa_reg_checkout( WP_REST_Request $req ) {
	if ( ! aa_reg_is_live() ) {
		return new WP_Error( 'aa_off', 'Online payment is switched off right now.', array( 'status' => 503 ) );
	}
	$d = (array) $req->get_json_params();

	$found = aa_reg_find( isset( $d['cohort'] ) ? (string) $d['cohort'] : '' );

	/* SECOND WAY IN: course + start date.
	   The calendar's bars are wp_events posts, so the id it holds belongs to a
	   different space than the generated batch ids — it can never satisfy the
	   lookup above. It sends the start date instead, and the batch is resolved
	   HERE, against the same generated schedule, so the price still comes from
	   the table and not from anything the browser said. */
	if ( ! $found && ! empty( $d['course'] ) && ! empty( $d['start'] ) ) {
		$found = aa_reg_find_by_date( (string) $d['course'], (string) $d['start'] );
	}

	if ( ! $found ) {
		$msg = ! empty( $d['start'] )
			? 'There is no batch of this course on that date. Pick one from the schedule.'
			: 'That batch is not available. Please pick another date.';
		return new WP_Error( 'aa_cohort', $msg, array( 'status' => 400 ) );
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
