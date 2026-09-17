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
			/* $2,899 -- matched to Corsizio, which is the other place this same
			   cohort is sold. The two were $24 apart and a buyer could see both. */
			'price'    => 2899,
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
			/* 2200, set apart from Large Solution deliberately: they are two
			   different courses and were sharing one price. */
			'price'    => 2200,
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

		/* LARGE SOLUTION SAFe -- CORRECTED AGAINST SCALED AGILE'S OWN 26.9
		   SESSION MATERIAL (the SPCT masterclass handout, Sep 2026).

		   THREE THINGS IN THIS ROW WERE WRONG AND ARE NOW FIXED.

		   1. THE EXAM. Every other row here says "Exam fee included", and it was
		      copied onto this one. Scaled Agile's own material for this course
		      describes it as giving attendees access to the course materials and
		      says nothing whatsoever about an exam or a certification. We do not
		      assert a credential we cannot verify, so 'incl' opts this row out
		      of the site-wide "exam included" wording -- see aa_reg_incl() --
		      and the proof list says what we can actually stand behind. If an
		      exam does exist, put it back; do not put it back on an assumption.

		   2. THE FIRST DATE was 21 Sep 2026. Scaled Agile's launch plan sets
		      general availability at 22 Sep 2026 and says delivery begins then.
		      A 21 Sep start would have run the class the day before we are
		      permitted to. Moved to the first cadence day on the far side of
		      that date.

		   3. THE COURSE IS NOT WHAT THE ROW DESCRIBED. The lede was written for
		      the older Large Solution configuration -- Solution Trains, solution
		      intent, suppliers. The 26.9 course is built around seven
		      competencies and introduces the value stream network as a loosely
		      coupled alternative to the Solution Train, which is the substantive
		      change and was missing entirely.

		   Still from the supplied outline and unverified: the price and the
		   cadence. Scaled Agile expects this class to run mostly as a private
		   audience, so the public cadence below is worth a decision rather than
		   an inheritance from RTE.

		   The page at 'url' is published (33677, child of Advanced SAFe) and
		   built from this row: [aa_course_hero] and [aa_course_register] both
		   read it, so the price, the length and the first date on the page are
		   these values and cannot drift from them. */
		'large-solution' => array(
			'code'     => 'LSS',
			'name'     => 'Implementing Large Solution SAFe®',
			'eyebrow'  => 'Live online · Implementing Large Solution SAFe®',
			'h1'       => 'Implementing Large Solution SAFe®.',
			'lede'     => 'For people building complex, large-scale systems. Scale Lean-Agile practice through the updated Large Solution Delivery (LSD) discipline — cross-enterprise coordination with external partners and the wider solution ecosystem, for delivery that is faster, more predictable and higher quality.',
			'url'      => '/training/adv-safe/large-solution/',
			'crumb'    => 'Advanced SAFe',
			'currency' => 'usd',
			'price'    => 2150,   // from the supplied outline; same as RTE
			'days'     => 2,      // confirmed 2 days
			/* 22 Sep 2026 is Scaled Agile's GA date -- the first day the course
			   may be delivered. Wednesday the 23rd is the first cadence day on
			   or after it. */
			'from'     => '2026-09-23',
			'seats'    => 18,
			'weeks'    => 26,
			'cadence'  => array(
				array( 'dow' => 'Mon', 'slot' => 'morning' ),
				array( 'dow' => 'Wed', 'slot' => 'morning' ),
				array( 'dow' => 'Fri', 'slot' => 'afternoon' ),
			),
			/* NOT "exam fee included" -- see the note above this row. */
			'incl'     => 'course materials included',
			'proof'    => array( 'SPCT-led', '18 seats max', 'Course materials included' ),
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

		   Quarterly, and the two cities are a MONTH apart, not a week: Dubai
		   opens in September, Riyadh in October, then Dec/Jan, Mar/Apr and so
		   on. Both were originally later -- Dubai October, Riyadh November --
		   which is why the home page showed no Gulf date in September at all.
		   They cannot both sit in September: three courses take three of the
		   month's four Sundays per city, so a shared month would put two
		   classes in different countries on the same day. A month apart keeps
		   each city's three courses in their own weeks and one trainer able to
		   fly to both.

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
				array( 'key' => 'dubai',       'label' => 'Dubai, UAE',           'region' => 'gulf', 'every' => 3, 'first' => '2026-09-06' ),
				array( 'key' => 'riyadh',      'label' => 'Riyadh, Saudi Arabia', 'region' => 'gulf', 'every' => 3, 'first' => '2026-10-04' ),
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
				array( 'key' => 'dubai',       'label' => 'Dubai, UAE',           'region' => 'gulf', 'every' => 3, 'first' => '2026-09-13' ),
				array( 'key' => 'riyadh',      'label' => 'Riyadh, Saudi Arabia', 'region' => 'gulf', 'every' => 3, 'first' => '2026-10-11' ),
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
				array( 'key' => 'dubai',       'label' => 'Dubai, UAE',           'region' => 'gulf', 'every' => 3, 'first' => '2026-09-20' ),
				array( 'key' => 'riyadh',      'label' => 'Riyadh, Saudi Arabia', 'region' => 'gulf', 'every' => 3, 'first' => '2026-10-18' ),
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

/**
 * HOW MANY STARTS A MONTH, IN THIS LANGUAGE.
 *
 * English runs on demand -- the weekly cadence stands, and load decides. The
 * mirrors do not: we do not fill a French SPC every week, and publishing dates
 * we will not run is worse than publishing fewer.
 *
 * Returns 0 for "no cap".
 *
 *   SPC, ASPC            fr 2   es 1   ar 1
 *   SA, SSM, POPM        fr 2   es 2   ar 1
 *   AI-Native            fr 1   es 1   ar 1
 *   everything else      fr 2   es 2   ar 1
 *
 * The per-language defaults carry most of that; only the rows that disagree
 * with their language's default are listed. A capped month keeps the FIRST N
 * dates of the English schedule rather than inventing its own, so a French
 * cohort id is always one English also offers -- which is what stops a French
 * sale from resolving to nothing in the webhook, where there is no language.
 */
function aa_reg_per_month( $slug, $lang = null ) {
	$lang = ( $lang === null ) ? aa_reg_lang() : $lang;
	if ( $lang === 'en' ) { return 0; }

	/* A language with no entry here gets one a month rather than "uncapped".
	   0 means no cap, which is right for English and wrong for a language we
	   have just started publishing in -- the schedule would fill with dates
	   nobody is staffed to teach. */
	$defaults = array( 'fr' => 2, 'es' => 2, 'ar' => 1 );

	$by_course = array(
		/* The consultant credentials: French is the only place we run them
		   twice, because we are the only partner running them in French. */
		'spc'  => array( 'es' => 1, 'ar' => 1 ),
		'aspc' => array( 'es' => 1, 'ar' => 1 ),
		/* AI-Native is monthly everywhere. */
		'ai-native-foundations'           => array( 'fr' => 1, 'es' => 1, 'ar' => 1 ),
		'ai-native-change-agent'          => array( 'fr' => 1, 'es' => 1, 'ar' => 1 ),
		'ai-native-ready-certification-2' => array( 'fr' => 1, 'es' => 1, 'ar' => 1 ),
	);

	if ( isset( $by_course[ $slug ][ $lang ] ) ) { return (int) $by_course[ $slug ][ $lang ]; }
	return isset( $defaults[ $lang ] ) ? (int) $defaults[ $lang ] : 1;
}

function aa_reg_generate( $slug, $course ) {
	static $memo = array();
	$tz    = new DateTimeZone( 'America/New_York' );
	$today = new DateTime( 'now', $tz );
	$today->setTime( 0, 0, 0 );
	/* THE LANGUAGE IS PART OF THE KEY. The list is capped per language, so a
	   key without it serves whichever mirror rendered first to everyone. */
	$key   = $slug . '|' . aa_reg_lang() . '|' . $today->format( 'Y-m-d' );
	if ( isset( $memo[ $key ] ) ) { return $memo[ $key ]; }

	$days  = max( 1, (int) $course['days'] );
	$weeks = max( 1, (int) ( isset( $course['weeks'] ) ? $course['weeks'] : 26 ) );
	/* EARLIEST DATE THIS COURSE IS OFFERED, if it is not simply "today".
	   A newly announced course has a launch date -- the cadence is right, but
	   nobody should be able to book it next Tuesday because the rule says
	   Tuesday. 'from' moves the floor; everything downstream, including the
	   publishing window, measures from there so a launch still gets a full
	   window of dates rather than a stub. Absent, the floor is today and
	   nothing changes for the courses that already run. */
	$floor = clone $today;
	if ( ! empty( $course['from'] ) ) {
		$f = new DateTime( $course['from'], $tz );
		$f->setTime( 0, 0, 0 );
		if ( $f > $floor ) { $floor = $f; }
	}
	$limit = ( clone $floor )->modify( '+' . $weeks . ' weeks' );

	// A course with cities is scheduled per city, not on a weekly cadence.
	if ( ! empty( $course['schedule'] ) ) {
		return $memo[ $key ] = aa_reg_generate_places( $slug, $course, $floor, $limit, $tz );
	}

	$taken   = array();   // start date => true, so backfill cannot collide
	$planned = array();   // every cadence start in the window, valid or not

	foreach ( (array) $course['cadence'] as $rule ) {
		$d = clone $floor;
		// first occurrence of this weekday on or after the floor
		$d->modify( 'this week ' . $rule['dow'] );
		if ( $d < $floor ) { $d->modify( '+1 week' ); }
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

	/* THE PER-LANGUAGE CAP, applied last and to the sorted list, so a capped
	   month keeps the earliest dates rather than an arbitrary slice. */
	$cap = aa_reg_per_month( $slug );
	if ( $cap > 0 ) {
		$per = array();
		$kept = array();
		foreach ( $out as $c ) {
			$m = substr( $c['start'], 0, 7 );
			if ( ! isset( $per[ $m ] ) ) { $per[ $m ] = 0; }
			if ( $per[ $m ] >= $cap ) { continue; }
			$per[ $m ]++;
			$kept[] = $c;
		}
		$out = $kept;
	}

	return $memo[ $key ] = $out;
}

/**
 * ONE-OFF MOVES — a single run that does not sit on its course's cadence.
 *
 * Keyed by course slug and the date the CADENCE produced, because that date is
 * the thing being excepted. The cadence itself is untouched: every other run of
 * the course is generated exactly as before, which is what makes this an
 * exception rather than a new rule.
 *
 * THE COHORT KEEPS THE ID THE CADENCE GAVE IT. The id is how Stripe metadata,
 * the seat ledger and every ?cohort= link already issued refer to this run, and
 * none of them should stop resolving because the class moved by a day. It is
 * the same run on a different date, not a different run. Nothing shows the id
 * to a buyer; the dates they see come from 'start' and 'end', which do move.
 *
 * An entry here is deliberate, so it is applied after the blackout and span
 * checks a generated date goes through rather than being subject to them.
 * Check the new date yourself before adding one.
 */
function aa_reg_moves() {
	return array(
		/* Asked for on 11 Sep 2026: these two both ran Monday the 14th on their
		   cadence and run Tuesday the 15th instead. One-off, both courses. */
		'spc'  => array( '2026-09-14' => '2026-09-15' ),
		'aspc' => array( '2026-09-14' => '2026-09-15' ),
	);
}

function aa_reg_make( $slug, $course, $start, $slot, $reason = '', $place = null ) {
	/* Applied before anything is derived from the date: the end date, the
	   weekday/weekend kind and the holiday note all have to describe where the
	   class actually runs. Only the id keeps the cadence date. */
	$cadence_start = $start;
	$moves         = aa_reg_moves();
	if ( isset( $moves[ $slug ][ $start ] ) ) { $start = $moves[ $slug ][ $start ]; }

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
		'id'    => $slug . '-' . $cadence_start,
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
		$c['id']       = $slug . '-' . $place['key'] . '-' . $cadence_start;
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
		/* WHAT THE PRICE COVERS, IN THE PAGE'S OWN WORDS.
		   The builder below used to hard-code "Exam fee included" for every
		   derived course. Most of them do include it, so nobody noticed -- but
		   Large Solution has no exam at all, and a page that says the fee is
		   included is not a wording problem, it is a false claim about what
		   somebody is buying. A page that knows better says so in data-incl;
		   one that says nothing keeps the old default. */
		'incl'   => trim( $attr( 'incl' ) ),
		/* THE EARLIEST DATE THIS COURSE MAY RUN, same meaning as 'from' in the
		   hand table. Without it a mirror generates from today, and Large
		   Solution -- which Scaled Agile did not release until 22 Sep 2026 --
		   would have offered French buyers a start date before the course was
		   allowed to be delivered at all. */
		'from'   => preg_match( '/^\d{4}-\d{2}-\d{2}$/', $attr( 'from' ) ) ? $attr( 'from' ) : '',
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

		$row = array(
			'code'     => $code !== '' ? $code : strtoupper( $slug ),
			'name'     => $p->post_title,
			'eyebrow'  => aa_reg_t( 'live_online', 'Live online' ) . ' · ' . $title,
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
			/* aa_reg_t() rather than literals: these render on the /fr/, /es/
			   and /ar/ mirrors too, where two English words in the proof row
			   were the last untranslated thing in the hero. */
			'from'     => $cfg['from'],
			'incl'     => $cfg['incl'],
			'proof'    => array(
				aa_reg_t( 'live_online', 'Live online' ),
				$cfg['incl'] !== '' ? $cfg['incl'] : aa_reg_t( 'exam_included', 'exam included' ),
			),
		);

		/* A MIRROR OVERRIDES THE TABLE; IT DOES NOT REPLACE IT.
		   The AI-Native courses are scheduled per city, in 'schedule' -- a key
		   no page can express. Returning the page's row on its own threw that
		   away and silently re-scheduled them onto a weekly cadence, so a
		   French visitor would have been offered dates that do not exist.

		   Starting from the table row and laying the page's values over it
		   means a mirror can say what it knows -- its own title, lede, price,
		   what the price covers -- and inherit everything it has no way of
		   stating. Empty values are dropped first, so a page that omits
		   data-from or data-incl inherits those too instead of blanking them. */
		$row    = array_filter( $row, function ( $v ) { return $v !== '' && $v !== null; } );
		$base   = aa_reg_courses();
		$merged = isset( $base[ $slug ] ) ? array_merge( $base[ $slug ], $row ) : $row;

		/* THE FILTER ABOVE DROPS A KEY; THE READERS STILL EXPECT IT.
		   Dropping empties is what lets a page inherit 'from' and 'incl' from
		   the table instead of blanking them -- but a course with NO table row
		   inherits nothing, so a mirror whose post_excerpt is empty came back
		   with no 'lede' key at all. aa_reg_hero() reads $course['lede']
		   directly, so every such hero raised "Undefined array key" on render,
		   WPCode logged it, and the snippet was switched off. The whole file
		   went dark because one page had no excerpt.

		   So the shape is guaranteed rather than assumed. Absent is the same
		   as empty to every reader here; the difference only ever mattered to
		   the merge, and the merge has already happened. */
		foreach ( array( 'code', 'name', 'eyebrow', 'h1', 'lede', 'url',
		                 'crumb', 'currency', 'incl', 'from' ) as $k ) {
			if ( ! isset( $merged[ $k ] ) ) { $merged[ $k ] = ''; }
		}
		if ( empty( $merged['proof'] ) || ! is_array( $merged['proof'] ) ) {
			$merged['proof'] = array();
		}

		$cache[ $key ] = $merged;
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
/**
 * Does this course URL actually resolve to a published page?
 *
 * Large Solution is sold from the schedule but has no page of its own yet, so
 * every link to it was a 404 at the end of a registration journey. Rather than
 * hide the course -- it is a real course on the real schedule -- the calendar
 * asks this and then does not link: the bar becomes a button, the panel drops
 * its "full course details" link, and the in-place form takes the money where
 * it stands. Nothing else has to know which courses have pages.
 */
function aa_reg_page_exists( $url ) {
	static $seen = array();
	$path = trim( (string) parse_url( (string) $url, PHP_URL_PATH ), '/' );
	if ( $path === '' ) { return false; }
	if ( isset( $seen[ $path ] ) ) { return $seen[ $path ]; }
	$seen[ $path ] = false;
	/* FAILS OPEN. A course page that cannot be looked up is assumed to exist:
	   the cost of a wrong "yes" is one broken link, and the cost of a wrong
	   "no" is unlinking every course on the page -- which would strip the
	   calendar of exactly the internal links it exists to provide. */
	if ( ! function_exists( 'get_page_by_path' ) ) { $seen[ $path ] = true; return true; }
	$p = get_page_by_path( $path );
	$seen[ $path ] = ( $p && ( ! isset( $p->post_status ) || $p->post_status === 'publish' ) );
	return $seen[ $path ];
}

/**
 * @param string     $course_key  '' on a track page, which sells several courses.
 * @param array|null $course      null with it: there is no single price or date set.
 */
function aa_reg_config_script( $course_key = '', $course = null, $cur = 'usd' ) {
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
		'price'          => $course ? (int) $course['price'] : 0,
		/* EVERY DATE THIS COURSE CAN ACTUALLY BE BOUGHT ON.
		   The calendar draws wp_events posts; the registration sells batches
		   generated from a cadence. Those are two different sets of dates and
		   they only mostly overlap — a past event, an import that never
		   matched the cadence, or anything beyond the generated window exists
		   on the calendar and is not on sale. Offering checkout on one of
		   those and letting the server refuse is a dead end at the last step,
		   which is exactly where a buyer will not try again. So the calendar
		   asks first. ~90 dates, under a kilobyte. */
		'dates'          => ( $course_key && $course ) ? array_values( array_map(
			function ( $c ) { return $c['start']; },
			aa_reg_upcoming( $course_key, $course )
		) ) : array(),
		'symbol'         => strtolower( $cur ) === 'cad' ? 'C$' : ( strtolower( $cur ) === 'eur' ? '€' : '$' ),
		'locale'         => strtolower( $cur ) === 'cad' ? 'en-CA' : ( strtolower( $cur ) === 'eur' ? 'de-DE' : 'en-US' ),
		'nonce'          => wp_create_nonce( 'wp_rest' ),
		'msgUnavailable' => 'Online payment is switched off right now — please contact us and we will register you.',
		'msgSending'     => 'Taking you to Stripe…',
		'msgError'       => 'We could not start checkout. Please try again, or email us and we will register you by hand.',
	) ) . ';</script>';
}

/**
 * @param bool $fixed The component owning this form sets its own batch, so a
 *                    pick made elsewhere on the page must not retarget it.
 *                    The track calendar rebuilds its panel per bar; without
 *                    this, choosing a bar and then a course in the hero card
 *                    would leave the form pointed at the wrong cohort.
 */
function aa_reg_inline( $course, $cohort, $cur, $prefix = 'aareg', $fixed = false ) {
	$live = aa_reg_is_live();
	return '<form class="aareg-inline ' . esc_attr( $prefix ) . '-inline" data-aa-inline novalidate'
	     . ( $fixed ? ' data-aa-inline-fixed' : '' )
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
	/* A one-day course starts and ends on the same date, and the range form
	   rendered that as "Sep 17-17". Leading the AI-Native Organization is one
	   day, so this was on every surface that course appears on. */
	if ( $s->format( 'Y-m-d' ) === $e->format( 'Y-m-d' ) ) {
		return $s->format( 'M j' ) . $y;
	}
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

/**
 * HOW MUCH ROOM THE PICKER LEAVES THE COPY COLUMN, IN BLOCKS.
 *
 * The two columns are centred against each other, so whatever the copy column
 * does not fill shows up as dead space above AND below it. How much there is
 * depends entirely on the course: SPC renders six rows plus a month tab strip
 * and runs ~620px, while AI-Native Foundations has one cohort in its first
 * month, no scroll, and runs ~390px -- where the two columns already balance.
 *
 * So this cannot be a fixed block of extra copy. Written for SPC it would
 * overflow AI-Native; written for AI-Native it would leave SPC as it is now.
 *
 * The picker's height is driven by the FIRST month's panel -- the others are
 * rendered hidden -- capped by the CSS at about six rows, plus the tab strip
 * when there is more than one month. One row is roughly the copy column's
 * natural height, so anything above that is room to fill -- which leaves a
 * course showing a single cohort in its first month with exactly one extra
 * line rather than none.
 *
 * Returns 0..3. At 0 the hero renders exactly as it does today.
 */
function aa_reg_hero_room( $months ) {
	if ( ! $months ) { return 0; }
	$first  = reset( $months );
	$rows   = min( 6, count( $first['items'] ) );
	$blocks = $rows - 1;
	if ( count( $months ) > 1 ) { $blocks++; }   // the tab strip is worth about a row
	return max( 0, min( 3, $blocks ) );
}

/**
 * WHERE A COURSE LEADS, ASSERTED RATHER THAN SCRAPED.
 *
 * aa_hh_page_bits() reads "next steps" off the course page's own markup, and
 * on SPC that produced SASM -- a sideways move at best, and for someone who
 * has just qualified to teach SAFe it reads as a step down. A page's own
 * cross-sell links are not a progression ladder, and treating them as one is
 * what put it there.
 *
 * So the ladder is stated here. Labels and URLs are looked up in
 * aa_reg_courses() rather than typed, so a chip can only ever name a course
 * that actually exists and its link can only ever be that course's real URL --
 * a renamed or retired course drops out of the list instead of 404ing.
 *
 * 'caption' is the line above the chips: a direction, not a credential. "an
 * AI-Native Trainer" is where the track leads, and is deliberately phrased as
 * an ambition rather than as a named certification we award.
 *
 * A course with no entry here falls back to whatever its page says, unchanged.
 */
function aa_reg_hero_next( $slug ) {
	$map = array(
		/* Implementing SAFe. The consultant ladder continues to Advanced SPC,
		   and widens into AI-Native and the two portfolio/product courses --
		   APM and LPM are not "after" SPC so much as alongside it, which is why
		   they belong on the same row rather than further down it. */
		'spc' => array(
			'caption' => aa_reg_t( 'next_progress', 'Progress to' ),
			'courses' => array( 'aspc', 'ai-native-foundations', 'apm', 'lpm' ),
		),
		/* Leading SAFe. The usual next step is Lean Portfolio Management --
		   the same audience, one level up the funding and strategy stack. */
		'sa' => array(
			'caption' => aa_reg_t( 'next_progress', 'Progress to' ),
			'courses' => array( 'lpm' ),
		),
		/* Advanced SPC. Someone already qualified to teach SAFe does not
		   progress to another SAFe role course; the track that is still ahead
		   of them is AI-Native. */
		'aspc' => array(
			'caption' => aa_reg_t( 'next_ainative', 'Become an AI-Native Trainer' ),
			'courses' => array(
				'ai-native-foundations',
				'ai-native-change-agent',
				'ai-native-ready-certification-2',
			),
		),
	);

	if ( ! isset( $map[ $slug ] ) ) { return null; }

	$items = array();
	foreach ( $map[ $slug ]['courses'] as $k ) {
		/* aa_reg_course(), not aa_reg_courses(): APM and LPM are not in the
		   hand-written table and resolve from their own pages. A slug that
		   resolves to nothing is skipped, so a chip can never be a dead link. */
		$c = aa_reg_course( $k );
		if ( ! $c || empty( $c['url'] ) || empty( $c['name'] ) ) { continue; }
		$items[] = array( 'label' => $c['name'], 'url' => $c['url'] );
	}
	if ( ! $items ) { return null; }

	return array( 'caption' => $map[ $slug ]['caption'], 'items' => $items );
}

/**
 * The optional copy that fills that room, most useful first.
 *
 * Every line here is read back off the course's own published page by
 * aa_hh_page_bits() -- the same source the home page's course brief uses, so
 * the two say the same thing and nothing new is claimed anywhere. That
 * function lives in the Home Hero snippet, hence the guard: with it inactive
 * this returns nothing and the hero is exactly what it is today.
 */
function aa_reg_hero_more( $slug, $room ) {
	if ( $room < 1 || ! function_exists( 'aa_hh_page_bits' ) ) { return ''; }

	$bits = aa_hh_page_bits( $slug );
	$rows = array();

	if ( ! empty( $bits['learn'] ) ) {
		$rows[] = array( aa_reg_t( 'youll_learn', 'You will learn' ), $bits['learn'] );
	}
	if ( ! empty( $bits['career'] ) ) {
		$rows[] = array( aa_reg_t( 'leads_to', 'Leads to' ), $bits['career'] );
	}
	if ( ! $rows && empty( $bits['next'] ) ) { return ''; }

	$h = '<div class="aahero-more">';

	foreach ( array_slice( $rows, 0, $room ) as $r ) {
		$h .= '<div class="aahero-morerow">'
		    . '<p class="aahero-minilabel">' . esc_html( $r[0] ) . '</p>'
		    . '<p class="aahero-moretext">' . esc_html( $r[1] ) . '</p></div>';
	}

	/* The progression chips are last because they are the least specific: they
	   answer "and then what", which only matters once the first two have
	   landed. Only shown when there is room left over after them. */
	$next = aa_reg_hero_next( $slug );
	if ( ! $next && ! empty( $bits['next'] ) ) {
		$next = array(
			'caption' => aa_reg_t( 'progress_to', 'Progress to' ),
			'items'   => array_map( function ( $n ) {
				return is_array( $n )
					? array( 'label' => isset( $n['label'] ) ? $n['label'] : '',
					         'url'   => isset( $n['url'] ) ? $n['url'] : '' )
					: array( 'label' => (string) $n, 'url' => '' );
			}, (array) $bits['next'] ),
		);
	}

	if ( $room >= 3 && $next ) {
		$h .= '<div class="aahero-morerow">'
		    . '<p class="aahero-minilabel">' . esc_html( $next['caption'] ) . '</p>'
		    . '<ul class="aahero-next">';
		foreach ( array_slice( $next['items'], 0, 4 ) as $n ) {
			if ( $n['label'] === '' ) { continue; }
			$h .= '<li>' . ( $n['url']
				? '<a href="' . esc_url( $n['url'] ) . '">' . esc_html( $n['label'] ) . '</a>'
				: esc_html( $n['label'] ) ) . '</li>';
		}
		$h .= '</ul></div>';
	}

	return $h . '</div>';
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
	/* Guarded because this one line, unguarded, is what a missing key turned
	   into a site-wide outage. A hero with no lede renders without one. */
	$lede = isset( $course['lede'] ) ? (string) $course['lede'] : '';
	if ( $lede !== '' ) {
		$h .= '<p class="aahero-lede">' . esc_html( $lede ) . '</p>';
	}
	$h .= '<ul class="aahero-proof">';
	foreach ( $course['proof'] as $p ) { $h .= '<li>' . esc_html( $p ) . '</li>'; }
	/* The salary sits with the proof pills rather than in its own row: it is
	   the same kind of claim as "exam fee included" -- one short fact about
	   what the course is worth -- and it costs no vertical space here. Only
	   when the course page publishes one. */
	if ( function_exists( 'aa_hh_page_bits' ) ) {
		$sal = aa_hh_page_bits( $a['course'] );
		if ( ! empty( $sal['salary'] ) ) {
			$h .= '<li class="aahero-proof-pay">' . esc_html( $sal['salary'] ) . '</li>';
		}
	}
	$h .= '</ul>';
	$h .= '<div class="aahero-facts"><div><p class="aahero-minilabel">' . esc_html( aa_reg_t( 'next_batch', 'Next batch' ) ) . '</p>'
	    . '<p class="aahero-fact" data-hero-range>' . esc_html( aa_reg_range( $first['start'], $first['end'] ) ) . '</p></div>'
	    . '<span class="aahero-rule" aria-hidden="true"></span>'
	    . '<div><p class="aahero-minilabel">' . esc_html( aa_reg_t( 'investment', 'Investment' ) ) . '</p><p class="aahero-fact">'
	    . esc_html( aa_reg_money( $course['price'], $course['currency'] ) )
	    . ' <span class="aahero-factnote">' . esc_html( aa_reg_incl( $course ) ) . '</span></p></div></div>';
	$h .= aa_reg_hero_more( $a['course'], aa_reg_hero_room( $months ) );
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

/* ============================================================================
   TRACK CALENDAR  —  [aa_track_calendar]
   ----------------------------------------------------------------------------
   For a TRACK landing page, which lists several courses, where [aa_course_hero]
   and [aa_course_register] each speak for exactly one.

   WHY THIS EXISTS. /training/ai-native/ was showing an empty calendar because
   the shortcode there, [aa_cohorts], renders wp_events posts filtered by an
   event_category term -- and no AI-Native dates were ever entered as events.
   Meanwhile the three AI-Native courses have ninety upcoming cohorts between
   them, generated from the cadence rules in aa_reg_courses(). The dates were
   never missing; the page was reading the wrong source.

   So this reads the same generated source the course heroes read. Nothing to
   enter, nothing to keep in sync, and a cohort cannot appear here and be
   missing from the course page.

   DELIBERATELY NOT INTERACTIVE. The hero's picker is a checkout: it needs one
   course, one price and one currency to post to Stripe. A track page has three
   of each, so every row here is a LINK to that course's own enrol section with
   the cohort preselected. The purchase happens in one place, on the course
   page, which is also the only place seat counts and prices are authoritative.

   USE:  [aa_track_calendar courses="ai-native-foundations,ai-native-change-agent,ai-native-ready-certification-2"]
         [aa_track_calendar courses="..." months="3" limit="24"]
   ========================================================================== */
/** One sentence of course copy, short enough to sit in a panel. */
/**
 * WHAT THE PRICE INCLUDES, PER COURSE.
 *
 * "exam included" was hardcoded at six render sites and printed under every
 * price on the site. That is true of the SAFe role and advanced courses, whose
 * fee carries a Scaled Agile exam voucher. It is NOT true of everything we
 * sell, and a course whose certification we cannot verify must not have one
 * asserted for it by boilerplate.
 *
 * A course row can now set 'incl' to say what its own fee covers. Everything
 * that does not set it keeps the old wording, so this changes nothing anywhere
 * except where a row opts out on purpose.
 */
function aa_reg_incl( $course ) {
	if ( is_array( $course ) && ! empty( $course['incl'] ) ) {
		return (string) $course['incl'];
	}
	return aa_reg_t( 'exam_included', 'exam included' );
}

function aa_reg_blurb( $course, $max = 165 ) {
	$s = trim( wp_strip_all_tags( isset( $course['lede'] ) ? $course['lede'] : '' ) );
	if ( $s === '' ) { return ''; }
	if ( function_exists( 'mb_strlen' ) ? mb_strlen( $s ) <= $max : strlen( $s ) <= $max ) { return $s; }
	$cut = function_exists( 'mb_substr' ) ? mb_substr( $s, 0, $max ) : substr( $s, 0, $max );
	$sp  = strrpos( $cut, ' ' );
	if ( $sp > 40 ) { $cut = substr( $cut, 0, $sp ); }
	return rtrim( $cut, " ,.;:-" ) . '…';
}

/**
 * WHICH CALENDAR RUNS.
 *
 * 'track'  -- the spanning-bar calendar built in this file.
 * anything else (the default) -- the site's original calendar, untouched.
 *
 * An option rather than a code edit, because the choice is a judgement about
 * how the schedule reads, and that should not need a deploy and a WPCode save
 * to reverse. The default is the original: a swap this visible should be opted
 * into, not inherited by anyone who installs the snippet.
 */
function aa_reg_calendar_mode() {
	return (string) get_option( 'aa_reg_calendar', 'track' );
}

/** The shortcode to fall back to when the track calendar is switched off. */
function aa_reg_calendar_fallback() {
	return (string) get_option( 'aa_reg_calendar_fallback', '[easy_events_calendar]' );
}

function aa_reg_track_calendar( $atts ) {
	$a = shortcode_atts( array(
		'courses' => '',
		/* Three, not six. Every month is rendered into the HTML and all but the
		   first hidden, so the schedule is crawlable without scripts -- but six
		   months of a seven-course track is 1,386 bars and 446KB of page, and
		   the hosting provider noticed. Three is still ~140 dates in the
		   source. */
		'months'  => 3,
		'heading' => '',
		'label'   => '',
		/* 0 = every published date. A positive number caps how many dates each
		   course contributes -- see the note where it is read. */
		'per'     => 0,
	), $atts, 'aa_track_calendar' );

	/* courses="all" is the hub view: every certification across every track.
	   See aa_reg_all_course_slugs() for how the list is assembled. */
	$slugs = ( strtolower( trim( (string) $a['courses'] ) ) === 'all' )
		? aa_reg_all_course_slugs()
		: array_filter( array_map( 'trim', explode( ',', (string) $a['courses'] ) ) );
	if ( ! $slugs ) { return ''; }

	/* HOW MANY DATES PER COURSE.
	   Our courses run on a cadence -- SPC is every Monday and Thursday for 26
	   weeks -- so "every published cohort" is really "every possible start
	   date", which is a large, low-information set. Seven courses over six
	   months was 1,386 bars and 446KB, and the hosting provider noticed. All
	   twenty-five over a quarter would be worse.

	   A visitor asking "when can I take RTE" is answered by the next two or
	   three dates, not the next forty. So the hub caps per course and says so;
	   a single-track page leaves it at 0 and shows everything, because there
	   the full cadence is the point. */
	$per = max( 0, (int) $a['per'] );

	/* The seven-colour palette from the handoff, assigned by course order, so a
	   track with three courses and a track with seven both work untouched. */
	$pal = array(
		array( '#0E8074', '#F4FAF9', '#D6EBE8' ),
		array( '#101C33', '#F5F6F8', '#DDE1E8' ),
		array( '#D34B2A', '#FDF5F2', '#F2DAD1' ),
		array( '#B3702A', '#FCF7F0', '#EEE0CC' ),
		array( '#3E6B5C', '#F4F8F6', '#D9E5DF' ),
		array( '#4A5E86', '#F5F7FB', '#DCE2EE' ),
		array( '#7A5B8F', '#F8F5FA', '#E5DCEC' ),
	);

	$meta  = array();     // code => course + colour
	$byday = array();     // Y-m-d => list of cohorts, for the month index
	$all   = array();     // every cohort, flat -- what the bars are drawn from
	$i = 0;

	foreach ( $slugs as $slug ) {
		$course = aa_reg_course( $slug );
		if ( ! $course ) { continue; }
		$code = isset( $course['code'] ) ? $course['code'] : strtoupper( $slug );
		$c3   = $pal[ $i % count( $pal ) ];
		$days = max( 1, (int) $course['days'] );
		$meta[ $code ] = array(
			'name'  => $course['name'],
			'url'   => $course['url'],
			'page'  => aa_reg_page_exists( $course['url'] ),
			'blurb' => aa_reg_blurb( $course ),
			'proof' => isset( $course['proof'] ) && is_array( $course['proof'] ) ? $course['proof'] : array(),
			'incl'  => aa_reg_incl( $course ),
			'price' => $course['price'],
			'cur'   => $course['currency'],
			'days'  => $days,
			'short' => $days . 'd',
			'color' => $c3[0], 'tint' => $c3[1], 'bd' => $c3[2],
		);
		$i++;

		$taken = 0;
		foreach ( aa_reg_upcoming( $slug, $course ) as $c ) {
			if ( $per && $taken >= $per ) { break; }
			$taken++;
			$row = array( 'c' => $c, 'code' => $code, 'course' => $course, 'slug' => $slug );
			$byday[ $c['start'] ][] = $row;
			$all[] = $row;
		}
	}
	if ( ! $all ) { return ''; }
	ksort( $byday );
	usort( $all, function ( $x, $y ) { return strcmp( $x['c']['start'], $y['c']['start'] ); } );

	/* Months to render. Every one goes into the HTML and all but the first are
	   hidden, rather than being built by JS on demand: the dates are the reason
	   this page exists, and a crawler or an assistant that does not run scripts
	   should still see six months of them. */
	$months = array();
	foreach ( array_keys( $byday ) as $k ) {
		$mk = substr( $k, 0, 7 );
		if ( ! isset( $months[ $mk ] ) ) { $months[ $mk ] = array(); }
		$months[ $mk ][] = $k;
	}
	$months = array_slice( $months, 0, max( 1, (int) $a['months'] ), true );

	/* The selection is A COHORT, not a day. A day can hold five starts, and a
	   panel answering "what is on the 14th" had to list all five -- which is
	   what made the register block taller than the calendar beside it. A bar is
	   one cohort, so clicking one has exactly one answer. */
	$sel    = $all[0];
	$sel_id = $sel['c']['id'];

	/* THE PANEL SHOWS ONE COHORT, AND ONE COHORT IS NOT A SCHEDULE.
	   Selecting a bar answers "this date", but a visitor for whom that date
	   does not work then has to go back and hunt the grid for the next one. So
	   the panel also carries the next few starts OF THE SAME COURSE as pickable
	   chips -- the schedule in the place where the decision is being made.
	   Eight is enough to cover a month of a twice-weekly course without turning
	   the panel back into the list it replaced. */
	$dates = array();
	foreach ( $all as $row ) {
		$code = $row['code'];
		if ( ! isset( $dates[ $code ] ) ) { $dates[ $code ] = array(); }
		if ( count( $dates[ $code ] ) >= 8 ) { continue; }
		$dates[ $code ][] = array(
			'id'    => $row['c']['id'],
			'label' => aa_reg_range( $row['c']['start'], $row['c']['end'], true ),
		);
	}

	$dir = aa_reg_dir_attr();
	$h   = '<section class="aatc"' . $dir . ' data-aatc>';
	if ( $a['heading'] !== '' ) { $h .= '<h2 class="aatc-h">' . esc_html( $a['heading'] ) . '</h2>'; }

	/* Certification filter. This is also the colour key -- each chip carries
	   its course's dot -- so the calendar needs no second legend. */
	if ( count( $meta ) > 1 ) {
		$h .= '<div class="aat-chips" role="group" aria-label="' . esc_attr( aa_reg_t( 'filter_cert', 'Filter by certification' ) ) . '">'
		    . '<button type="button" class="aat-chip" data-aatc-code="All" aria-pressed="true">'
		    . '<span class="aat-dot" style="background:#101C33"></span>' . esc_html( aa_reg_t( 'all_certs', 'All certifications' ) ) . '</button>';
		foreach ( $meta as $code => $m ) {
			$h .= '<button type="button" class="aat-chip" data-aatc-code="' . esc_attr( $code ) . '" aria-pressed="false"'
			    . ' title="' . esc_attr( $m['name'] ) . '">'
			    . '<span class="aat-dot" style="background:' . esc_attr( $m['color'] ) . '"></span>' . esc_html( $code ) . '</button>';
		}
		$h .= '</div>';
	}

	/* ONE CARD, two columns. The calendar and the cohort it has selected are
	   halves of the same object, so they share a border rather than floating as
	   two cards with a gap between them. */
	$h .= '<div class="aat-cal"><div class="aat-calmain">';

	$mkeys = array_keys( $months );
	$h .= '<div class="aat-calcard__head"><div>'
	    . '<p class="aat-calcard__eyebrow">' . esc_html( aa_reg_t( 'upcoming_cohorts', 'Upcoming cohorts' ) ) . '</p>'
	    . '<strong class="aat-calcard__month" data-aatc-monthlabel>' . esc_html( ( new DateTime( $mkeys[0] . '-01' ) )->format( 'F Y' ) ) . '</strong>'
	    . '</div><div class="aat-calcard__nav">'
	    . '<button type="button" class="aat-navbtn" data-aatc-prev aria-label="' . esc_attr( aa_reg_t( 'prev_month', 'Previous month' ) ) . '" disabled>&#8249;</button>'
	    . '<button type="button" class="aat-navbtn" data-aatc-next aria-label="' . esc_attr( aa_reg_t( 'next_month', 'Next month' ) ) . '"' . ( count( $mkeys ) > 1 ? '' : ' disabled' ) . '>&#8250;</button>'
	    . '</div></div>';

	$h .= '<div class="aat-calscroll"><div class="aat-calinner">'
	    . '<div class="aat-dows">';
	foreach ( array( 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ) as $d ) { $h .= '<span>' . $d . '</span>'; }
	$h .= '</div>';

	$mi = 0;
	foreach ( $months as $mk => $days_in ) {
		$y = (int) substr( $mk, 0, 4 );
		$m = (int) substr( $mk, 5, 2 );
		$firstts = mktime( 0, 0, 0, $m, 1, $y );
		$lead    = (int) date( 'w', $firstts );   // Sunday-first, as the course pages are
		$rows    = (int) ceil( ( $lead + (int) date( 't', $firstts ) ) / 7 );

		$h .= '<div class="aat-grid" data-aatc-month="' . esc_attr( $mk ) . '"' . ( $mi === 0 ? '' : ' hidden' ) . '>';
		for ( $w = 0; $w < $rows; $w++ ) {
			$w0 = mktime( 0, 0, 0, $m, 1 - $lead + $w * 7, $y );
			$w6 = mktime( 0, 0, 0, $m, 1 - $lead + $w * 7 + 6, $y );

			/* EVERY COHORT THAT TOUCHES THIS WEEK, clipped to it. A class that
			   starts on Monday and ends on Thursday is one bar four columns
			   wide; one that runs Thursday to Sunday is drawn in both week rows.
			   This is what makes the length of a course visible -- and what
			   shows a class running straight through Saturday and Sunday, which
			   is what the day-chip grid could never say. */
			$bars = array();
			foreach ( $all as $row ) {
				$cs = strtotime( $row['c']['start'] );
				$ce = strtotime( $row['c']['end'] );
				if ( $ce < $w0 || $cs > $w6 ) { continue; }
				$from = max( $cs, $w0 );
				$to   = min( $ce, $w6 );
				$bars[] = array(
					'row'  => $row,
					'col'  => (int) round( ( $from - $w0 ) / 86400 ) + 1,
					'span' => (int) round( ( $to - $from ) / 86400 ) + 1,
					'open' => ( $cs < $w0 ),
					'more' => ( $ce > $w6 ),
					'sort' => $cs,
				);
			}

			/* Lanes. First-fit by start date, so bars never overlap and the
			   week is as short as it can be. */
			usort( $bars, function ( $x, $y ) {
				if ( $x['sort'] === $y['sort'] ) { return $x['col'] - $y['col']; }
				return ( $x['sort'] < $y['sort'] ) ? -1 : 1;
			} );
			$lanes = array();
			foreach ( $bars as $bi => $b ) {
				$li = 0;
				while ( isset( $lanes[ $li ] ) && $lanes[ $li ] > $b['col'] ) { $li++; }
				$lanes[ $li ] = $b['col'] + $b['span'];
				$bars[ $bi ]['lane'] = $li;
			}

			/* SEVEN COURSES RUNNING TWICE A WEEK IS TEN CLASSES IN SESSION AT
			   ONCE, and ten stacked bars make a week row taller than a phone.
			   The week is capped at five lanes and opens on demand -- but every
			   bar is still in the HTML, hidden by CSS rather than dropped, so
			   the whole schedule remains in the page for a crawler and for
			   anyone reading with styles off. */
			$nlanes = count( $lanes );
			$cap    = 5;

			$h .= '<div class="aat-week' . ( $nlanes > $cap ? ' aat-week--over' : '' ) . '">'
			    . '<div class="aat-week__days">';
			for ( $col = 0; $col < 7; $col++ ) {
				$ts = mktime( 0, 0, 0, $m, 1 - $lead + $w * 7 + $col, $y );
				$h .= '<span class="aat-dnum' . ( (int) date( 'n', $ts ) === $m ? '' : ' aat-dnum--out' ) . '">'
				    . (int) date( 'j', $ts ) . '</span>';
			}
			$h .= '</div>';

			$h .= '<div class="aat-week__lanes"' . ( $bars ? '' : ' data-aatc-empty="1"' ) . '>';
			foreach ( $bars as $b ) {
				$row = $b['row'];
				$mm  = $meta[ $row['code'] ];
				$c   = $row['c'];
				$on  = ( $c['id'] === $sel_id );
				$cls = 'aat-bar'
				     . ( $b['open'] ? ' aat-bar--from' : '' )
				     . ( $b['more'] ? ' aat-bar--to' : '' )
				     . ( $on ? ' aat-bar--on' : '' );

				/* A COURSE WITHOUT A PAGE IS STILL A COURSE.
				   Large Solution sells from the schedule and has no page yet, so
				   linking its bar was a 404 at the end of the journey. It gets a
				   button instead; the panel beside the calendar takes the money
				   either way. */
				$link = $mm['page'];
				$url  = $mm['url'] . ( strpos( $mm['url'], '?' ) === false ? '?' : '&' )
				      . 'cohort=' . rawurlencode( $c['id'] ) . '#enroll';

				$style = 'grid-column:' . (int) $b['col'] . '/span ' . (int) $b['span']
				       . ';grid-row:' . ( (int) $b['lane'] + 1 )
				       . ';--bar:' . esc_attr( $mm['color'] )
				       . ';--bar-tint:' . esc_attr( $mm['tint'] )
				       . ';--bar-bd:' . esc_attr( $mm['bd'] );

				$h .= '<' . ( $link ? 'a' : 'button' ) . ' class="' . $cls . '"'
				    . ( $link ? ' href="' . esc_url( $url ) . '"' : ' type="button"' )
				    . ' data-aatc-co="' . esc_attr( $c['id'] ) . '"'
				    . ' data-aatc-c="' . esc_attr( $row['code'] ) . '"'
				    . ' style="' . $style . '"'
				    . ' aria-label="' . esc_attr( $mm['name'] . ' · ' . aa_reg_range( $c['start'], $c['end'] )
				        . ' · ' . $mm['days'] . ' ' . aa_reg_t( 'days_l', 'days' ) ) . '">'
				    . '<b class="aat-bar__code">' . esc_html( $row['code'] ) . '</b>';
				/* The tail of a run that began in the previous week is one or
				   two columns wide. A range and a length do not fit and are
				   already stated on the head of the same run, so it carries the
				   code alone. */
				if ( ! $b['open'] ) {
					$h .= '<span class="aat-bar__range">' . esc_html( aa_reg_range( $c['start'], $c['end'] ) ) . '</span>'
					    . '<span class="aat-bar__d">' . esc_html( $mm['short'] ) . '</span>';
				}
				$h .= '</' . ( $link ? 'a' : 'button' ) . '>';
			}
			$h .= '</div>';
			if ( $nlanes > $cap ) {
				$h .= '<button type="button" class="aat-week__more" data-aatc-more'
				    . ' aria-expanded="false">' . esc_html( sprintf(
					aa_reg_t( 'n_more_classes', '+%d more this week' ), $nlanes - $cap ) ) . '</button>';
			}
			$h .= '</div>';
		}
		$h .= '</div>';
		$mi++;
	}
	$h .= '</div></div>';

	/* Mobile list -- same cohorts, no sideways scroll. Which one shows is purely
	   a media query; both are in the HTML and both drive the same panel. */
	$h .= '<div class="aat-callist">';
	$mi = 0;
	foreach ( $months as $mk => $days_in ) {
		$h .= '<div data-aatc-mob="' . esc_attr( $mk ) . '"' . ( $mi === 0 ? '' : ' hidden' ) . '>';
		$h .= '<div class="aat-calmonth">' . esc_html( ( new DateTime( $mk . '-01' ) )->format( 'F Y' ) ) . '</div>';
		foreach ( $all as $row ) {
			if ( substr( $row['c']['start'], 0, 7 ) !== $mk ) { continue; }
			$mm = $meta[ $row['code'] ];
			$c  = $row['c'];
			$h .= '<button type="button" class="aat-calday" data-aatc-co="' . esc_attr( $c['id'] ) . '"'
			    . ' data-aatc-c="' . esc_attr( $row['code'] ) . '"'
			    . ' aria-pressed="' . ( $c['id'] === $sel_id ? 'true' : 'false' ) . '">'
			    . '<span class="aat-calday__date"><b><time datetime="' . esc_attr( $c['start'] ) . '">'
			    . esc_html( date( 'M j', strtotime( $c['start'] ) ) ) . '</time></b>'
			    . '<span>' . esc_html( date( 'D', strtotime( $c['start'] ) ) ) . '</span></span>'
			    . '<span class="aat-calday__codes"><span class="aat-calday__code" style="background:' . esc_attr( $mm['tint'] )
			    . ';color:' . esc_attr( $mm['color'] ) . '">' . esc_html( $row['code'] ) . '</span>'
			    . '<span class="aat-calday__rng">' . esc_html( aa_reg_range( $c['start'], $c['end'] ) ) . '</span></span>'
			    . '<span class="aat-calday__n">' . esc_html( $mm['short'] ) . '</span></button>';
		}
		$h .= '</div>';
		$mi++;
	}
	$h .= '</div>';

	/* The bar already says how long a course is, so the note says the thing a
	   buyer gets wrong instead: a four-day class does not pause for the
	   weekend. */
	$h .= '<p class="aat-legend">' . esc_html( aa_reg_t( 'bar_note',
		'Each bar covers the full length of the course, weekends included. Pick one to see the details.' ) ) . '</p>';
	$h .= '</div>';

	/* THE REGISTER PANEL, and it registers. Server-rendered for the first
	   cohort so the page is complete without scripts; the JS only repaints it
	   on a click. The form posts a cohort id, which the checkout resolves
	   across every course -- so this works on a track page that sells seven
	   courses exactly as it does on a course page that sells one, and it works
	   for a course with no page of its own at all. */
	$h .= '<aside class="aat-side"><div class="aat-side__head">'
	    . '<span class="aat-side__dot"></span>'
	    . esc_html( aa_reg_t( 'selected_cohort', 'Selected cohort' ) ) . '</div>'
	    . '<div class="aat-side__body" data-aatc-panel>'
	    . aa_reg_track_panel( $sel, $meta, $a['label'], $dates ) . '</div>'
	    . '<p class="aat-private">' . esc_html( aa_reg_t( 'no_dates', "Dates don't work?" ) ) . ' '
	    . '<a href="/contact/">' . esc_html( aa_reg_t( 'private', 'Ask for a private cohort' ) ) . '</a></p>'
	    . '</aside>';

	$h .= '</div>';

	/* Everything the panel needs, so a bar click does not re-query the server.

	   SPLIT BY WHAT ACTUALLY VARIES. This used to write one flat record per
	   cohort carrying fifteen fields -- of which ten (name, blurb, proof, days,
	   price, url and three colours) are properties of the COURSE and identical
	   across every one of its cohorts. On Advanced SAFe that meant 283 copies
	   of the same 165-character blurb, the same proof list and the same URL:
	   147KB of JSON, a third of the page, nearly all of it the same sentences
	   over and over.

	   Seven course records and 283 slim cohort records say the same thing. The
	   JS merges the two when it paints a card. Empty fields are dropped rather
	   than written as "", because most cohorts are online and carry no place. */
	$coursemeta = array();
	foreach ( $meta as $code => $mm ) {
		$coursemeta[ $code ] = array(
			'name'  => $mm['name'],
			'blurb' => $mm['blurb'],
			'proof' => array_values( $mm['proof'] ),
			'incl'  => isset( $mm['incl'] ) ? $mm['incl'] : '',
			'days'  => $mm['days'],
			'price' => aa_reg_money( $mm['price'], $mm['cur'] ),
			'raw'   => (int) $mm['price'],
			'url'   => $mm['page'] ? $mm['url'] : '',
			'color' => $mm['color'], 'tint' => $mm['tint'], 'bd' => $mm['bd'],
		);
	}

	$payload = array();
	foreach ( $all as $row ) {
		$c   = $row['c'];
		$rec = array(
			'code'  => $row['code'],
			'range' => aa_reg_range( $c['start'], $c['end'] ),
			'left'  => aa_reg_seats_left( $row['course'], $c ),
		);
		if ( ! empty( $c['place'] ) ) { $rec['place'] = $c['place']; }
		if ( ! empty( $c['hours'] ) ) { $rec['hours'] = $c['hours']; }
		$payload[ $c['id'] ] = $rec;
	}
	$h .= '<script>window.AA_TC=' . wp_json_encode( array(
		'courses' => $coursemeta,
		'cohorts' => $payload,
		'dates'   => $dates,
		'months'  => array_keys( $months ),
		'label'   => $a['label'],
		'live'    => aa_reg_is_live(),
		'labels'  => array(
			'seatsLeft' => aa_reg_t( 'seats_left_n', '%d seats left' ),
			/* Per-course now -- see aa_reg_incl(). This one is the fallback the
			   script uses for a course whose row says nothing. */
			'incl'      => aa_reg_t( 'exam_included', 'exam included' ),
			'dates'     => aa_reg_t( 'dates', 'Dates' ),
			'schedule'  => aa_reg_t( 'duration', 'Duration' ),
			'daysL'     => aa_reg_t( 'days_l', 'days' ),
			'email'     => aa_reg_t( 'your_email', 'Your email' ),
			'seats'     => aa_reg_t( 'seats', 'Seats' ),
			'pay'       => aa_reg_t( 'pay', 'Pay securely with Stripe' ),
			'payOff'    => aa_reg_t( 'pay_off', 'Registration temporarily unavailable' ),
			'payNote'   => 'Exam fee included. You will be taken to Stripe to pay.',
			'payOffNote'=> 'Online payment is switched off right now — please contact us.',
			'details'    => aa_reg_t( 'full_details', 'Full course details' ),
			'otherDates' => aa_reg_t( 'other_dates', 'Other dates' ),
		),
	) ) . ';</script>';

	/* The checkout endpoint and nonce. On a course page aa_reg_panel() emits
	   this with a course attached; here there is no single course, and none is
	   needed -- the form sends a cohort id and the server resolves it. */
	$h .= aa_reg_config_script();

	return $h . '</section>';
}

/**
 * ONE cohort as the register card. Shared by the server render and the JS.
 *
 * Deliberately small. The old panel listed every cohort starting on the chosen
 * day, which on a seven-course track meant five cards stacked under a heading
 * -- taller than the calendar it sat beside, and the reason the whole block
 * fell below the calendar instead of next to it.
 */
function aa_reg_track_panel( $row, $meta, $label = '', $dates = array() ) {
	if ( ! $row || ! isset( $meta[ $row['code'] ] ) ) { return ''; }
	$mm    = $meta[ $row['code'] ];
	$c     = $row['c'];
	$left  = aa_reg_seats_left( $row['course'], $c );
	$where = trim( ( ! empty( $c['place'] ) ? $c['place'] . ' · ' : '' ) . ( isset( $c['hours'] ) ? $c['hours'] : '' ), ' ·' );

	$out  = '<article class="aat-co" style="--bar:' . esc_attr( $mm['color'] ) . '">';
	$out .= '<p class="aat-co__eyebrow">' . esc_html( $label !== '' ? $label : $row['code'] ) . '</p>';
	$out .= '<h3 class="aat-co__h">' . esc_html( $mm['name'] ) . '</h3>';
	if ( $mm['blurb'] !== '' ) {
		$out .= '<p class="aat-co__blurb">' . esc_html( $mm['blurb'] ) . '</p>';
	}
	$out .= '<dl class="aat-co__facts">'
	     . '<div><dt>' . esc_html( aa_reg_t( 'dates', 'Dates' ) ) . '</dt>'
	     . '<dd>' . esc_html( aa_reg_range( $c['start'], $c['end'] ) ) . '</dd></div>'
	     . '<div><dt>' . esc_html( aa_reg_t( 'duration', 'Duration' ) ) . '</dt>'
	     . '<dd>' . (int) $mm['days'] . ' ' . esc_html( aa_reg_t( 'days_l', 'days' ) ) . '</dd></div>';
	if ( $where !== '' ) {
		$out .= '<div class="aat-co__facts-wide"><dt>' . esc_html( aa_reg_t( 'format', 'Format' ) ) . '</dt>'
		     . '<dd>' . esc_html( $where ) . '</dd></div>';
	}
	$out .= '</dl>';

	/* PRICE SITS WITH THE FACTS, not below them.
	   It used to come after the other-dates list and the inclusions, four
	   blocks down and usually below the fold -- so the panel answered when and
	   how long, and made you scroll past a list of alternative dates to find
	   out what it costs. Dates, duration, format, price: that is the set
	   somebody is deciding on, and it belongs together. */
	$out .= '<div class="aat-co__pay"><div class="aat-co__price">' . esc_html( aa_reg_money( $mm['price'], $mm['cur'] ) ) . '</div>'
	     . '<div class="aat-co__incl">' . esc_html( isset( $mm['incl'] ) ? $mm['incl'] : aa_reg_t( 'exam_included', 'exam included' ) )
	     . ( $left <= 6 ? ' · ' . esc_html( sprintf( aa_reg_t( 'seats_left_n', '%d seats left' ), $left ) ) : '' ) . '</div></div>';

	/* The rest of this course's schedule, right where the decision is made. */
	$others = isset( $dates[ $row['code'] ] ) ? $dates[ $row['code'] ] : array();
	if ( count( $others ) > 1 ) {
		$out .= '<div class="aat-co__dates"><p class="aat-co__dateslabel">'
		     . esc_html( aa_reg_t( 'other_dates', 'Other dates' ) ) . '</p><div class="aat-co__datelist">';
		$n = 0;
		foreach ( $others as $d ) {
			if ( $d['id'] === $c['id'] ) { continue; }
			if ( ++$n > 6 ) { break; }
			$out .= '<button type="button" class="aat-dateopt" data-aatc-co="' . esc_attr( $d['id'] ) . '">'
			     . esc_html( $d['label'] ) . '</button>';
		}
		$out .= '</div></div>';
	}

	if ( $mm['proof'] ) {
		$out .= '<ul class="aat-co__proof">';
		foreach ( $mm['proof'] as $p ) { $out .= '<li>' . esc_html( $p ) . '</li>'; }
		$out .= '</ul>';
	}

	$out .= aa_reg_inline(
		array( 'price' => $mm['price'] ),
		$c,
		$mm['cur'],
		'aatco',
		true
	);

	if ( $mm['page'] ) {
		$out .= '<a class="aat-co__more" href="' . esc_url( $mm['url'] ) . '">'
		     . esc_html( aa_reg_t( 'full_details', 'Full course details' ) ) . ' &#10230;</a>';
	}
	$out .= '</article>';
	return $out;
}

add_shortcode( 'aa_track_calendar', 'aa_reg_track_calendar' );

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

/**
 * A COURSE PAGE GETS THE SAME CALENDAR AS ITS TRACK PAGE.
 *
 * The per-course calendar on a course page comes from [easy_event_calendar_mini],
 * which the mini-calendar snippet already takes over at priority 10. This takes
 * it one step earlier, so the bar calendar a visitor meets on /training/adv-safe/
 * is the same object they meet on /training/adv-safe/aspc/ -- same bars, same
 * week shape, and the same panel beside it that registers where it stands
 * instead of sending them somewhere else to do it.
 *
 * Returning $short (false) leaves the tag alone, so anything this cannot build
 * -- a page with no course, a course with no schedule -- falls through to the
 * mini calendar exactly as before. Switching this snippet off does the same.
 * It is gated on the same setting as the hero and form swap, because it is the
 * same decision: use the new components, or do not.
 */
add_filter( 'pre_do_shortcode_tag', function ( $short, $tag, $attr ) {
	if ( $tag !== 'easy_event_calendar_mini' ) { return $short; }
	if ( ! aa_reg_autoplace_on() ) { return $short; }
	/* Off by default -- the original calendar stays unless the track calendar
	   is explicitly switched on. */
	if ( aa_reg_calendar_mode() !== 'track' ) { return $short; }

	$slug = aa_reg_page_course();
	if ( $slug === '' ) { return $short; }
	$course = aa_reg_course( $slug );
	if ( ! $course ) { return $short; }

	$out = aa_reg_track_calendar( array(
		'courses' => $slug,
		'months'  => 3,
		'label'   => isset( $course['crumb'] ) ? $course['crumb'] : '',
	) );
	return ( $out !== '' ) ? $out : $short;
}, 9, 3 );

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
/**
 * FORCE THE LANGUAGE FOR ONE RESOLUTION.
 *
 * aa_reg_lang() reads the queried page, which is exactly right while a page is
 * rendering and useless in a REST request -- there is no queried object, so it
 * reports English and every price resolves to the English one. That was
 * harmless while every mirror carried the same price. It stopped being harmless
 * the moment French was priced differently: the French page showed one number
 * and the checkout charged another.
 *
 * Set it, resolve the course, clear it. Never leave it set.
 */
function aa_reg_lang_override( $set = null ) {
	static $override = null;
	if ( $set !== null ) { $override = ( $set === '' ) ? null : (string) $set; }
	return $override;
}

function aa_reg_lang( $post = null ) {
	if ( $post === null ) {
		/* Before the cache, not after -- the cache is per-request and an
		   override is the one thing allowed to bypass it. */
		$ov = aa_reg_lang_override();
		if ( $ov !== null ) { return $ov; }
		static $cur = null;
		if ( $cur !== null ) { return $cur; }

		$obj = get_queried_object();
		if ( ! ( $obj instanceof WP_Post ) && isset( $GLOBALS['post'] ) ) { $obj = $GLOBALS['post']; }

		/* DO NOT CACHE A GUESS.
		   This used to store 'en' when there was no post to read, and 'en' is
		   not an answer here -- it is "asked too early". Anything that reaches
		   aa_reg_lang() before the main query is set up (a meta-description
		   builder on wp_head, a widget, a plugin applying the_content to make
		   an excerpt) poisoned the cache for the whole request. The page body
		   still rendered French, because that comes from the page's own
		   content, while every filter that asks "what language is this?"
		   answered English -- so the menu kept its English links under French
		   labels, and the first click left the French site.

		   Answering 'en' uncached is the same behaviour for a genuinely
		   English request and self-corrects the moment there is a post. */
		if ( ! ( $obj instanceof WP_Post ) ) { return 'en'; }

		$cur = aa_reg_lang( $obj );
		return $cur;
	}
	if ( ! ( $post instanceof WP_Post ) ) { return 'en'; }
	$anc  = get_post_ancestors( $post->ID );
	$root = $anc ? get_post( end( $anc ) ) : $post;
	if ( ! $root ) { return 'en'; }
	return in_array( $root->post_name, aa_reg_lang_roots(), true ) ? $root->post_name : 'en';
}

/** The right-to-left languages, as a list rather than one hard-coded code. */
function aa_reg_rtl_langs() {
	return array( 'ar', 'he', 'fa', 'ur' );
}

function aa_reg_is_rtl( $lang = null ) {
	$lang = ( $lang === null ) ? aa_reg_lang() : $lang;
	return in_array( $lang, aa_reg_rtl_langs(), true );
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
			/* ---- Added: the 32 keys that had no Spanish string. */
			'all_certs'        => 'Todas las certificaciones',
			'ask_dates'        => 'Consultar fechas',
			'bar_note'         => 'Cada barra cubre la duración completa del curso, fines de semana incluidos. Haz clic para ver el detalle.',
			'board_foot'       => '%1$d fechas en %2$d certificaciones. El ancho de la barra son días fuera de la oficina.',
			'certification'    => 'Certificación',
			'certifications'   => 'certificaciones',
			'date'             => 'fecha',
			'days_l'           => 'días',
			'duration'         => 'Duración',
			'filter_cert'      => 'Filtrar por certificación',
			'find_cert'        => 'Encontrar mi certificación',
			'format'           => 'Formato',
			'from_price'       => 'desde',
			'full_details'     => 'Detalles completos del curso',
			'leads_to'         => 'Conduce a',
			'n_more_classes'   => '+%d más esta semana',
			'next_ainative'    => 'Conviértete en formador AI-Native',
			'next_month'       => 'Mes siguiente',
			'next_progress'    => 'Avanzar a',
			'next_start'       => 'próximo inicio',
			'one_cohort'       => 'una convocatoria',
			'other_dates'      => 'Otras fechas',
			'prev_month'       => 'Mes anterior',
			'progress_to'      => 'Avanzar a',
			'register_now'     => 'Inscribirse',
			'resched'          => 'cambio de fecha sin coste',
			'seats_left_n'     => '%d plazas disponibles',
			'selected_cohort'  => 'Convocatoria seleccionada',
			'today'            => 'hoy',
			'upcoming_cohorts' => 'Próximas convocatorias',
			'weeks_ltr'        => 'Las semanas se leen de izquierda a derecha',
			'youll_learn'      => 'Aprenderás',
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
			/* ---- Added: the 32 keys that had no French string and were
			   falling back to English on every /fr/ page. */
			'all_certs'        => 'Toutes les certifications',
			'ask_dates'        => 'Demander les dates',
			'bar_note'         => 'Chaque barre couvre toute la durée du cours, week-ends compris. Cliquez pour voir le détail.',
			'board_foot'       => '%1$d dates réparties sur %2$d certifications. La largeur des barres correspond aux jours d\'absence.',
			'certification'    => 'Certification',
			'certifications'   => 'certifications',
			'date'             => 'date',
			'days_l'           => 'jours',
			'duration'         => 'Durée',
			'filter_cert'      => 'Filtrer par certification',
			'find_cert'        => 'Trouver ma certification',
			'format'           => 'Format',
			'from_price'       => 'à partir de',
			'full_details'     => 'Détails complets du cours',
			'leads_to'         => 'Mène à',
			'n_more_classes'   => '+%d autres cette semaine',
			'next_ainative'    => 'Devenez formateur AI-Native',
			'next_month'       => 'Mois suivant',
			'next_progress'    => 'Évoluer vers',
			'next_start'       => 'prochaine session',
			'one_cohort'       => 'une session',
			'other_dates'      => 'Autres dates',
			'prev_month'       => 'Mois précédent',
			'progress_to'      => 'Évoluer vers',
			'register_now'     => 'S\'inscrire',
			'resched'          => 'report sans frais',
			'seats_left_n'     => '%d places restantes',
			'selected_cohort'  => 'Session sélectionnée',
			'today'            => 'aujourd\'hui',
			'upcoming_cohorts' => 'Prochaines sessions',
			'weeks_ltr'        => 'Les semaines se lisent de gauche à droite',
			'youll_learn'      => 'Vous apprendrez',
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
			/* ---- Added: the 32 keys that had no Arabic string. Arabic is
			   right-to-left; the calendar's "left to right" note is written
			   as the reading direction of the board, not translated literally. */
			'all_certs'        => 'جميع الشهادات',
			'ask_dates'        => 'اسأل عن المواعيد',
			'bar_note'         => 'كل شريط يغطي مدة الدورة كاملة، بما في ذلك عطلة نهاية الأسبوع. اختر واحدًا لعرض التفاصيل.',
			'board_foot'       => '%1$d موعدًا عبر %2$d شهادة. عرض الشريط يمثل أيام الغياب عن العمل.',
			'certification'    => 'الشهادة',
			'certifications'   => 'شهادات',
			'date'             => 'موعد',
			'days_l'           => 'أيام',
			'duration'         => 'المدة',
			'filter_cert'      => 'تصفية حسب الشهادة',
			'find_cert'        => 'اعثر على شهادتي',
			'format'           => 'الصيغة',
			'from_price'       => 'ابتداءً من',
			'full_details'     => 'تفاصيل الدورة كاملة',
			'leads_to'         => 'يؤدي إلى',
			'n_more_classes'   => '+%d أخرى هذا الأسبوع',
			'next_ainative'    => 'كن مدرّب AI-Native',
			'next_month'       => 'الشهر التالي',
			'next_progress'    => 'التقدم إلى',
			'next_start'       => 'أقرب موعد',
			'one_cohort'       => 'دفعة واحدة',
			'other_dates'      => 'مواعيد أخرى',
			'prev_month'       => 'الشهر السابق',
			'progress_to'      => 'التقدم إلى',
			'register_now'     => 'سجّل',
			'resched'          => 'تغيير الموعد بدون رسوم',
			'seats_left_n'     => 'بقي %d مقعد',
			'selected_cohort'  => 'الدفعة المختارة',
			'today'            => 'اليوم',
			'upcoming_cohorts' => 'الدفعات القادمة',
			'weeks_ltr'        => 'الأسابيع مرتبة أفقيًا',
			'youll_learn'      => 'سوف تتعلم',
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

	/* THE BUYER'S LANGUAGE, AND THEREFORE THE BUYER'S PRICE.
	   The mirrors are not priced alike -- French SPC and ASPC are list price
	   because we are the only partner running them in French, and that number
	   lives on the French page. This request has no queried object, so without
	   the override aa_reg_course() hands back the English row and we charge the
	   English price for a French sale. Resolve it in their language, take the
	   price from there, and fall back to the English row if the mirror has no
	   usable price rather than failing the sale. */
	$buyer_lang = aa_reg_lang_of( array(), (string) $req->get_header( 'referer' ) );
	if ( $buyer_lang !== 'en' ) {
		aa_reg_lang_override( $buyer_lang );
		$mirror = aa_reg_course( $found['slug'] );
		aa_reg_lang_override( '' );
		if ( $mirror && ! empty( $mirror['price'] ) ) {
			$course['price']    = $mirror['price'];
			$course['currency'] = ! empty( $mirror['currency'] ) ? $mirror['currency'] : $course['currency'];
			$course['name']     = ! empty( $mirror['name'] ) ? $mirror['name'] : $course['name'];
		}
	}

	// THE amount. From the table, never from the request.
	$unit = (int) round( $course['price'] * 100 );
	if ( $unit < 100 ) {
		return new WP_Error( 'aa_price', 'That cohort has no price configured.', array( 'status' => 409 ) );
	}

	$return = home_url( $course['url'] );
	/* One token, used three times: the success URL, the registration record,
	   and the link to the invoice in the confirmation email. */
	$token = wp_generate_password( 32, false, false );
	$body = array(
		'mode'                 => 'payment',
		/* THE CONFIRMATION PAGE, NOT THE COURSE PAGE. Sending a buyer back to
		   the page they just bought from shows them the thing they have
		   already done. The token is minted HERE rather than in the webhook so
		   it can be in this URL: Stripe redirects the moment the payment
		   clears, which is usually before the webhook has finished writing the
		   registration. The page holds until the record appears. */
		'success_url'          => aa_reg_confirm_url( $token ),
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
		'metadata[token]'   => $token,
		/* The page they bought from, so the confirmation can be written in the
		   language they have been reading. aa_reg_lang() cannot help here --
		   this runs as a REST request with no queried object, so it always
		   reports English. */
		'metadata[lang]'    => $buyer_lang,
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
	/* REMEMBER WHICH SESSION THIS TOKEN BELONGS TO.
	   The token travels back on the success URL; the session id is what Stripe
	   can be asked about. Holding the pair for a fortnight is what lets the
	   confirmation page reconcile a sale the webhook never delivered -- see
	   aa_reg_reconcile(). Stored, not derived, because Stripe cannot look a
	   session up by our metadata. */
	if ( ! empty( $json['id'] ) ) {
		set_transient( 'aa_reg_tok_' . $token, $json['id'], 14 * DAY_IN_SECONDS );
	}

	return array( 'url' => $json['url'] );
}

/**
 * RECOVER A SALE THE WEBHOOK NEVER DELIVERED.
 *
 * The confirmation page used to say "the registration is safe either way
 * because the webhook owns it." That was the assumption, and it was wrong
 * twice: the endpoint spent three years subscribed to charge.captured, and
 * after that was fixed a delivery still failed to land. Both times a buyer
 * paid, got nothing, and nobody knew until they wrote in.
 *
 * So the webhook is no longer the only path. When someone lands on the
 * confirmation page with a token that has no registration behind it, we ask
 * Stripe about their session directly and record the sale ourselves.
 *
 * THIS DOES NOT TRUST THE BROWSER. The browser supplies an opaque token and
 * nothing else -- no amount, no cohort, no claim of having paid. The token is
 * exchanged server-side for a session id we stored at checkout, that session
 * is fetched from Stripe with our own secret key, and the sale is recorded
 * only if STRIPE says payment_status is paid. The browser cannot manufacture a
 * registration; it can only prompt us to go and ask.
 *
 * Idempotent twice over: it returns early if the token already resolves, and
 * aa_reg_record_sale() refuses an id it has already written.
 */
/**
 * THE SWEEP — every paid session, whether or not anything told us about it.
 *
 * There are now three ways a sale gets recorded, deliberately, because each
 * one fails differently:
 *
 *   1. the webhook          fastest, and the only one that needs Stripe to
 *                           reach us. Spent three years pointed at the wrong
 *                           event, then failed to deliver again after that was
 *                           fixed.
 *   2. the confirmation page catches what the webhook missed, but only if the
 *                           buyer actually lands back on the site. Close the
 *                           tab on Stripe's page and it never runs.
 *   3. this sweep            needs nothing. It asks Stripe hourly what it has
 *                           been paid and records anything we have not.
 *
 * A single failure can no longer lose a sale, which is the whole point: two
 * buyers paid and got silence, and both times we found out because a person
 * complained rather than because a system noticed.
 *
 * ONLY OUR OWN SESSIONS. A session is skipped unless it carries a cohort we
 * recognise, in our metadata or as a client_reference_id. This account also
 * takes payments through other tools, and none of them should ever be turned
 * into a training registration by this.
 *
 * Deduplication is aa_reg_record_sale()'s job -- it refuses a session id it
 * has already written, so the sweep and the other two paths cannot double up.
 */
function aa_reg_sweep() {
	if ( ! aa_reg_key( 'secret' ) || ! function_exists( 'aa_reg_record_sale' ) ) { return; }

	/* Three days back. Long enough to cover an outage over a weekend, short
	   enough that the sweep stays one cheap request. */
	$since = time() - ( 3 * DAY_IN_SECONDS );
	$res   = wp_remote_get(
		'https://api.stripe.com/v1/checkout/sessions?limit=100&created[gte]=' . $since,
		array(
			'timeout' => 20,
			'headers' => array( 'Authorization' => 'Basic ' . base64_encode( aa_reg_key( 'secret' ) . ':' ) ),
		)
	);
	if ( is_wp_error( $res ) || (int) wp_remote_retrieve_response_code( $res ) !== 200 ) { return; }

	$body = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( empty( $body['data'] ) || ! is_array( $body['data'] ) ) { return; }

	$recovered = 0;
	foreach ( $body['data'] as $sess ) {
		if ( ! is_array( $sess ) ) { continue; }
		if ( ! isset( $sess['payment_status'] ) || $sess['payment_status'] !== 'paid' ) { continue; }

		$meta   = isset( $sess['metadata'] ) ? (array) $sess['metadata'] : array();
		$cohort = isset( $meta['cohort'] ) ? $meta['cohort']
		        : ( isset( $sess['client_reference_id'] ) ? $sess['client_reference_id'] : '' );
		if ( $cohort === '' || ! aa_reg_find( $cohort ) ) { continue; }   // not ours

		if ( aa_reg_record_sale( $sess, 'sweep:' . $sess['id'] ) ) { $recovered++; }
	}

	if ( $recovered ) {
		wp_mail(
			get_option( 'admin_email' ),
			sprintf( 'Sweep recovered %d registration%s - the Stripe webhook is not working',
				$recovered, $recovered === 1 ? '' : 's' ),
			"The hourly sweep found paid checkout sessions that no webhook had recorded.\n\n"
			. "Those buyers now have their registrations and confirmations, so nothing is owed\n"
			. "to them. But the webhook is still not delivering, and every sale is arriving up\n"
			. "to an hour late because of it.\n\n"
			. "Check the endpoint's recent deliveries for the response code."
		);
	}
}
add_action( 'aa_reg_sweep_event', 'aa_reg_sweep' );

/* Self-scheduling: no activation hook to forget, and re-arms itself if the
   schedule is ever cleared. */
add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'aa_reg_sweep_event' ) ) {
		wp_schedule_event( time() + 300, 'hourly', 'aa_reg_sweep_event' );
	}
} );

function aa_reg_reconcile( $token ) {
	if ( $token === '' || aa_reg_by_token( $token ) ) { return null; }

	$sid = get_transient( 'aa_reg_tok_' . $token );
	if ( ! $sid || ! aa_reg_key( 'secret' ) ) { return null; }

	$res = wp_remote_get(
		'https://api.stripe.com/v1/checkout/sessions/' . rawurlencode( $sid ),
		array(
			'timeout' => 15,
			'headers' => array( 'Authorization' => 'Basic ' . base64_encode( aa_reg_key( 'secret' ) . ':' ) ),
		)
	);
	if ( is_wp_error( $res ) || (int) wp_remote_retrieve_response_code( $res ) !== 200 ) { return null; }

	$sess = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( ! is_array( $sess ) || ! isset( $sess['payment_status'] ) || $sess['payment_status'] !== 'paid' ) {
		return null;
	}

	/* Keyed on the session id rather than an event id, so a webhook that
	   arrives late cannot record the same sale a second time. */
	$post_id = aa_reg_record_sale( $sess, 'reconciled:' . $sid );
	if ( ! $post_id ) { return null; }

	/* This firing means the webhook is not working. The buyer is now served,
	   but somebody has to know the plumbing is broken -- silence is what let
	   this run for three years. */
	wp_mail(
		get_option( 'admin_email' ),
		'Registration recovered without the webhook — check the Stripe endpoint',
		"A buyer reached the confirmation page with a paid session that no webhook had recorded.\n\n"
		. "Their registration has been created and their confirmation sent, so nothing is owed to them.\n"
		. "But the Stripe webhook did not deliver, and the next buyer will hit the same gap.\n\n"
		. "Session: " . $sid . "\n"
		. "Check the endpoint's recent deliveries for the response code."
	);

	return $post_id;
}

/* ============================================================================
   CONFIRMATION PAGE  —  [aa_reg_confirmation] on /registration-confirmed/
   ----------------------------------------------------------------------------
   Reachable only with a token. Not linked from anywhere, not in the sitemap,
   noindexed, and blank without a valid token -- so it is private without being
   behind a login, which matters because the person reading it has just paid
   and should not be asked to invent a password to see what they bought.

   AGILE AGILIST ONLY. No processor name, no ticketing platform, no partner
   mark, here or in the email or on the invoice. Someone who has just paid
   should see one company, not the plumbing behind it.

   THE RACE IS REAL. Stripe redirects the moment the card clears, which is
   routinely before the webhook has finished writing the registration. So a
   token that resolves to nothing yet is the NORMAL first state, not an error:
   the page says the payment went through and waits, rather than telling
   someone their money has vanished.
   ========================================================================== */

/** The confirmation page URL for a token, or the home page if the page is gone. */
/**
 * THE CONFIRMATION PAGE MUST NEVER BE CACHED. THIS IS THE LOOP.
 *
 * /registration-confirmed/?order=TOKEN is different for every buyer and
 * different on every load -- it holds one person's name, course and dates, and
 * it reloads itself while it waits for the sale to be recorded. A full-page
 * cache in front of it breaks it in two ways, and this site runs SiteGround's:
 *
 *   1. THE LOOP. The waiting page carries a script that sends the browser to
 *      the same URL with t+1. If the cache ignores the query string, every
 *      reload is served the same cached copy -- which still says t=0 and still
 *      points at t=1. The counter never advances, the four-try ceiling is never
 *      reached, and the buyer watches the page bounce forever instead of ever
 *      reaching the "your email is on its way" message.
 *
 *   2. WORSE THAN THE LOOP. One buyer's confirmation, cached, is served to the
 *      next -- someone else's name, course and dates, on a page that says
 *      "thank you" to them by name.
 *
 * DONOTCACHEPAGE is the flag SiteGround Optimizer, WP Rocket, W3TC and
 * LiteSpeed all honour; nocache_headers() covers proxies and the browser.
 */
add_action( 'template_redirect', function () {
	if ( is_admin() ) { return; }

	$has_token = ! empty( $_GET['order'] );
	$slug      = apply_filters( 'aa_reg_confirm_page_slug', 'registration-confirmed' );
	if ( ! $has_token && ! is_page( $slug ) ) { return; }

	foreach ( array( 'DONOTCACHEPAGE', 'DONOTCACHEOBJECT', 'DONOTCACHEDB' ) as $flag ) {
		if ( ! defined( $flag ) ) { define( $flag, true ); }
	}
	nocache_headers();
}, 0 );

function aa_reg_confirm_url( $token ) {
	$slug = apply_filters( 'aa_reg_confirm_page_slug', 'registration-confirmed' );
	$page = get_page_by_path( $slug );
	$base = $page ? get_permalink( $page ) : home_url( '/' );
	return add_query_arg( array( 'order' => $token ), $base );
}

/** The registration for a token, or null. Constant-time compare. */
function aa_reg_by_token( $token ) {
	if ( $token === '' || strlen( $token ) > 64 ) { return null; }
	$hits = get_posts( array(
		'post_type'      => 'aa_registration',
		'post_status'    => 'any',
		'posts_per_page' => 1,
		'no_found_rows'  => true,
		'meta_key'       => 'invoice_token',
		'meta_value'     => $token,
	) );
	if ( ! $hits ) { return null; }
	return hash_equals( (string) get_post_meta( $hits[0]->ID, 'invoice_token', true ), $token )
		? $hits[0] : null;
}

function aa_reg_confirmation_shortcode() {
	$token = isset( $_GET['order'] ) ? sanitize_text_field( wp_unslash( $_GET['order'] ) ) : '';
	if ( $token === '' ) { return ''; }   // no token, nothing to show: the page is blank

	$post = aa_reg_by_token( $token );

	/* ASK STRIPE ON THE FIRST LOAD, NOT THE SECOND.
	   This used to give the webhook one reload's grace before going and asking
	   Stripe itself -- reasonable when a webhook is merely late, and useless
	   when it is broken. Broken is what it has actually been, so every single
	   buyer was paying for that grace with a reload they did not need, and
	   watching the page bounce while they waited for it.

	   Racing the webhook is safe now: aa_reg_record_sale() is idempotent on the
	   session id, so the webhook, this and the sweep can all describe the same
	   sale and only the first one through records it. */
	if ( ! $post ) {
		$recovered = aa_reg_reconcile( $token );
		if ( $recovered ) { $post = get_post( $recovered ); }
	}

	$lang = $post ? (string) get_post_meta( $post->ID, 'lang', true ) : aa_reg_lang();
	$t    = aa_reg_confirm_strings( $lang ? $lang : 'en' );
	$rtl  = aa_reg_is_rtl( $lang ? $lang : 'en' );
	$dir  = ' dir="' . ( $rtl ? 'rtl' : 'ltr' ) . '"';

	/* WAITING, NOT FAILING. Reloads a few times, then stops and says the email
	   is coming -- an endless spinner is worse than a sentence, and the
	   registration is safe either way because the webhook owns it. */
	if ( ! $post ) {
		$try = isset( $_GET['t'] ) ? (int) $_GET['t'] : 0;
		$h   = '<div class="aa-conf"' . $dir . '><h2 class="aa-conf-h">' . esc_html( $t['paid_h'] ) . '</h2>'
		     . '<p class="aa-conf-p">' . esc_html( $try < 4 ? $t['pending'] : $t['pending_slow'] ) . '</p></div>';
		if ( $try < 4 ) {
			$next = esc_url( add_query_arg( array( 'order' => $token, 't' => $try + 1 ) ) );
			$h   .= '<script>setTimeout(function(){location.href=' . wp_json_encode( $next ) . ';},4000);</script>';
		}
		return $h;
	}

	$data = aa_reg_invoice_data( $post->ID );
	$name = $data ? $data['name'] : '';

	$h  = '<div class="aa-conf"' . $dir . '>';
	$h .= '<p class="aa-conf-eyebrow">' . esc_html( $t['confirmed_eyebrow'] ) . '</p>';
	$h .= '<h2 class="aa-conf-h">' . esc_html( $name !== '' ? sprintf( $t['confirmed_h'], $name ) : $t['paid_h'] ) . '</h2>';
	$h .= '<p class="aa-conf-p">' . esc_html( sprintf( $t['confirmed_p'], (string) get_post_meta( $post->ID, 'email', true ) ) ) . '</p>';
	$h .= '<p class="aa-conf-p">' . esc_html( $t['next_p'] ) . '</p>';
	if ( $data ) {
		$h .= '<div class="aa-conf-inv">' . aa_reg_invoice_html( $data, $lang ? $lang : 'en' ) . '</div>';
	}
	$h .= '<p class="aa-conf-print"><button type="button" onclick="window.print()">' . esc_html( $t['print'] ) . '</button></p>';
	return $h . '</div>';
}
add_shortcode( 'aa_reg_confirmation', 'aa_reg_confirmation_shortcode' );

/**
 * Keep both token pages out of search results and out of the sitemap.
 *
 * noindex alone stops them being listed; the sitemap filter stops them being
 * offered up in the first place. Neither is the security boundary -- the token
 * is -- but a receipt with someone's name and what they paid has no business
 * being crawlable.
 */
function aa_reg_private_pages_noindex() {
	if ( isset( $_GET['order'] ) ) {
		echo '<meta name="robots" content="noindex,nofollow,noarchive">' . "\n";
	}
}
add_action( 'wp_head', 'aa_reg_private_pages_noindex', 1 );

function aa_reg_exclude_from_sitemap( $args, $post_type ) {
	if ( $post_type !== 'page' ) { return $args; }
	$out = array();
	foreach ( array( 'registration-confirmed', 'payment-receipt' ) as $slug ) {
		$p = get_page_by_path( $slug );
		if ( $p ) { $out[] = $p->ID; }
	}
	if ( $out ) {
		$args['post__not_in'] = array_merge( isset( $args['post__not_in'] ) ? (array) $args['post__not_in'] : array(), $out );
	}
	return $args;
}
add_filter( 'wp_sitemaps_posts_query_args', 'aa_reg_exclude_from_sitemap', 10, 2 );

/* ============================================================================
   INVOICE  —  the buyer's receipt, in the format you already issue
   ----------------------------------------------------------------------------
   Modelled on your own invoice document, NOT on the Eventbrite samples. Those
   are 2019 Canadian events: an "HST Invoice" from Digital Tango ltee carrying
   its HST registration number and 13% tax. Reproducing that shape would put a
   tax line and a registration number on a document that is a tax record, for
   sales that are priced in USD with no tax collected. Your own format states
   "Sales Tax $0" and "All prices are in USD", which is what the checkout
   actually does, so that is what this issues.

   If you do start collecting tax, this needs revisiting properly -- with the
   real registrant details and rates -- rather than by adding a line here.

   Delivered two ways, because they fail differently: inline in the
   confirmation email, which needs no attachment and no PDF library; and as a
   permanent page the buyer can return to and print, since email gets deleted.
   ========================================================================== */

/** A stable, human order number. Derived, so it never needs its own counter. */
function aa_reg_order_no( $post_id ) {
	return 'AA-' . str_pad( (string) (int) $post_id, 6, '0', STR_PAD_LEFT );
}

/**
 * Card brand and last four, asked of Stripe.
 *
 * The checkout.session object does not carry them, so this is one extra call
 * per sale. It is best-effort by design: a failure returns '' and the invoice
 * simply omits the payment line rather than guessing at how someone paid.
 */
function aa_reg_card_line( $payment_intent ) {
	if ( ! $payment_intent || ! aa_reg_key( 'secret' ) ) { return ''; }
	$res = wp_remote_get(
		'https://api.stripe.com/v1/payment_intents/' . rawurlencode( $payment_intent )
			. '?expand[]=payment_method',
		array(
			'timeout' => 15,
			'headers' => array( 'Authorization' => 'Basic ' . base64_encode( aa_reg_key( 'secret' ) . ':' ) ),
		)
	);
	if ( is_wp_error( $res ) || wp_remote_retrieve_response_code( $res ) !== 200 ) { return ''; }
	$pi = json_decode( wp_remote_retrieve_body( $res ), true );
	$card = isset( $pi['payment_method']['card'] ) ? $pi['payment_method']['card'] : null;
	if ( ! $card ) { return ''; }
	$brand = isset( $card['brand'] ) ? ucfirst( (string) $card['brand'] ) : '';
	$last4 = isset( $card['last4'] ) ? (string) $card['last4'] : '';
	return trim( $brand . ( $last4 ? ' &middot; ' . $last4 : '' ) );
}

/** Invoice fields for one registration, or null. */
function aa_reg_invoice_data( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post || $post->post_type !== 'aa_registration' ) { return null; }

	$cohort = (string) get_post_meta( $post_id, 'cohort', true );
	$found  = $cohort ? aa_reg_find( $cohort ) : null;
	$cur    = strtoupper( (string) get_post_meta( $post_id, 'currency', true ) );
	$total  = (int) get_post_meta( $post_id, 'amount_total', true );
	$seats  = max( 1, (int) get_post_meta( $post_id, 'seats', true ) );

	return array(
		'order_no'  => aa_reg_order_no( $post_id ),
		'date'      => get_the_date( 'j F Y', $post ),
		'status'    => 'Completed',
		'card'      => (string) get_post_meta( $post_id, 'card', true ),
		'name'      => trim( str_replace( ' — ' . $cohort, '', $post->post_title ) ),
		'email'     => (string) get_post_meta( $post_id, 'email', true ),
		'desc'      => $found ? $found['course']['name'] : $cohort,
		'range'     => $found ? aa_reg_range( $found['cohort']['start'], $found['cohort']['end'] ) : '',
		'seats'     => $seats,
		/* Unit price from the total, not from the course table: the table is
		   today's price and this is a record of what was actually charged. */
		'unit'      => $seats > 0 ? $total / $seats : $total,
		'total'     => $total,
		'currency'  => $cur ? $cur : 'USD',
	);
}

/** The invoice, as HTML. Used by the email and by the printable page. */
function aa_reg_invoice_html( $d, $lang = 'en' ) {
	if ( ! $d ) { return ''; }
	$t   = aa_reg_confirm_strings( $lang );
	$rtl = aa_reg_is_rtl( $lang );
	$m   = function ( $cents ) use ( $d ) {
		return $d['currency'] . ' ' . number_format( $cents / 100, 2 );
	};

	$cell = 'padding:9px 12px;border-bottom:1px solid #E4EFEF;font-size:13.5px;color:#0E3A44';
	$head = 'padding:9px 12px;background:#F3FAFA;border-bottom:1px solid #CDE6E6;font-size:11px;'
	      . 'letter-spacing:.06em;text-transform:uppercase;color:#5E7378;text-align:left';
	$tot  = 'padding:6px 12px;font-size:13.5px;color:#0E3A44';

	$h  = '<div dir="' . ( $rtl ? 'rtl' : 'ltr' ) . '" style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;'
	    . 'color:#0E3A44;max-width:640px;border:1px solid #E4EFEF;border-radius:8px;padding:22px">';

	$h .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
	    . '<td style="font-size:19px;font-weight:700;letter-spacing:.02em">' . esc_html( $t['invoice'] ) . '</td>'
	    . '<td style="text-align:' . ( $rtl ? 'left' : 'right' ) . ';font-size:13px;color:#5E7378">'
	    . esc_html( $t['order_no'] ) . ' ' . esc_html( $d['order_no'] ) . '</td></tr></table>';

	$meta = array(
		$t['order_date'] => $d['date'],
		$t['status_l']   => ( $d['status'] === 'Completed' ? $t['completed'] : $d['status'] ),
		$t['delivery']   => $t['eticket'],
		$t['paid_by']    => $d['card'],
	);
	$h .= '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px 0 18px">';
	foreach ( $meta as $k => $v ) {
		if ( $v === '' ) { continue; }
		$h .= '<tr><td style="padding:3px 14px 3px 0;font-size:12.5px;color:#5E7378">' . esc_html( $k ) . '</td>'
		    . '<td style="padding:3px 0;font-size:12.5px;color:#0E3A44;font-weight:600">' . wp_kses_post( $v ) . '</td></tr>';
	}
	$h .= '</table>';

	$h .= '<p style="margin:0 0 4px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#5E7378">'
	    . esc_html( $t['invoice_to'] ) . '</p>'
	    . '<p style="margin:0 0 18px;font-size:13.5px;line-height:1.5">'
	    . esc_html( $d['name'] ) . '<br>' . esc_html( $d['email'] ) . '</p>';

	$h .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">'
	    . '<tr><th style="' . $head . '">' . esc_html( $t['qty'] ) . '</th>'
	    . '<th style="' . $head . '">' . esc_html( $t['description'] ) . '</th>'
	    . '<th style="' . $head . ';text-align:right">' . esc_html( $t['unit_price'] ) . '</th>'
	    . '<th style="' . $head . ';text-align:right">' . esc_html( $t['line_total'] ) . '</th></tr>'
	    . '<tr><td style="' . $cell . '">' . (int) $d['seats'] . '</td>'
	    . '<td style="' . $cell . '">' . esc_html( $d['desc'] )
	    . ( $d['range'] ? '<br><span style="color:#5E7378;font-size:12px">' . esc_html( $d['range'] ) . '</span>' : '' )
	    . '</td>'
	    . '<td style="' . $cell . ';text-align:right;white-space:nowrap">' . esc_html( $m( $d['unit'] ) ) . '</td>'
	    . '<td style="' . $cell . ';text-align:right;white-space:nowrap">' . esc_html( $m( $d['total'] ) ) . '</td></tr>'
	    . '</table>';

	$h .= '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:12px;'
	    . ( $rtl ? 'margin-right:auto' : 'margin-left:auto' ) . '">'
	    . '<tr><td style="' . $tot . ';color:#5E7378">' . esc_html( $t['subtotal'] ) . '</td>'
	    . '<td style="' . $tot . ';text-align:right;white-space:nowrap">' . esc_html( $m( $d['total'] ) ) . '</td></tr>'
	    . '<tr><td style="' . $tot . ';color:#5E7378">' . esc_html( $t['sales_tax'] ) . '</td>'
	    . '<td style="' . $tot . ';text-align:right">' . esc_html( $m( 0 ) ) . '</td></tr>'
	    . '<tr><td style="' . $tot . ';font-weight:700;border-top:1px solid #CDE6E6">' . esc_html( $t['total_l'] ) . '</td>'
	    . '<td style="' . $tot . ';font-weight:700;text-align:right;white-space:nowrap;border-top:1px solid #CDE6E6">'
	    . esc_html( $m( $d['total'] ) ) . '</td></tr></table>';

	$h .= '<p style="margin:16px 0 0;font-size:12px;color:#5E7378">'
	    . esc_html( sprintf( $t['currency_note'], $d['currency'] ) ) . '</p>';

	return $h . '</div>';
}

/**
 * Where the printable invoice lives.
 *
 * Points at whichever published page carries [aa_reg_invoice]; /payment-receipt/
 * already exists, so that is the default. Returns '' when no such page is
 * published, and the email then simply omits the link rather than sending
 * people to a 404.
 */
function aa_reg_invoice_page() {
	$slug = apply_filters( 'aa_reg_invoice_page_slug', 'payment-receipt' );
	$page = get_page_by_path( $slug );
	return $page ? get_permalink( $page ) : '';
}

/** The buyer's own invoice URL, token included. */
function aa_reg_invoice_url( $post_id ) {
	$base  = aa_reg_invoice_page();
	$token = get_post_meta( $post_id, 'invoice_token', true );
	if ( ! $base || ! $token ) { return ''; }
	return add_query_arg( array( 'order' => $token ), $base );
}

/**
 * [aa_reg_invoice] — the printable copy. Put it on /payment-receipt/.
 *
 * The token IS the authorisation: it is 32 random characters, it is only ever
 * sent to the address that paid, and it is compared in constant time so the
 * page cannot be used as an oracle for guessing one. No login, because asking
 * someone to create an account to see the receipt for something they already
 * bought is how receipts go unread.
 */
function aa_reg_invoice_shortcode() {
	$token = isset( $_GET['order'] ) ? sanitize_text_field( wp_unslash( $_GET['order'] ) ) : '';
	if ( $token === '' || strlen( $token ) > 64 ) {
		return '<p>' . esc_html__( 'This invoice link is not valid.', 'default' ) . '</p>';
	}

	$hits = get_posts( array(
		'post_type'      => 'aa_registration',
		'post_status'    => 'any',
		'posts_per_page' => 1,
		'no_found_rows'  => true,
		'meta_key'       => 'invoice_token',
		'meta_value'     => $token,
	) );
	$post = $hits ? $hits[0] : null;

	// Constant-time compare, so response timing cannot leak a partial match.
	if ( ! $post || ! hash_equals( (string) get_post_meta( $post->ID, 'invoice_token', true ), $token ) ) {
		return '<p>' . esc_html__( 'This invoice link is not valid.', 'default' ) . '</p>';
	}

	$data = aa_reg_invoice_data( $post->ID );
	if ( ! $data ) { return '<p>' . esc_html__( 'This invoice link is not valid.', 'default' ) . '</p>'; }

	$lang = (string) get_post_meta( $post->ID, 'lang', true );
	return '<div class="aa-invoice">' . aa_reg_invoice_html( $data, $lang ? $lang : 'en' ) . '</div>';
}
add_shortcode( 'aa_reg_invoice', 'aa_reg_invoice_shortcode' );

/** Noindex the receipt page: it is a private document with a public URL. */
function aa_reg_invoice_noindex() {
	if ( ! is_page() || ! isset( $_GET['order'] ) ) { return; }
	echo '<meta name="robots" content="noindex,nofollow">' . "\n";
}
add_action( 'wp_head', 'aa_reg_invoice_noindex', 1 );

/* ============================================================================
   CONFIRMATION EMAIL
   ----------------------------------------------------------------------------
   Sent from the WEBHOOK, never from the browser. The success_url is just where
   Stripe sends someone afterwards -- it can be opened by hand, closed before it
   loads, or hit twice, and none of that is evidence that money moved. The
   webhook is the only place the site learns a payment actually succeeded, and
   it is already the place that records the registration and the seat count.

   Idempotency comes free: the duplicate-event guard above returns before this
   runs, so a Stripe retry cannot send a second copy.

   A failure here must not fail the request. Stripe retries any non-2xx, and
   retrying a webhook whose only fault was a mail server timeout would
   double-book seats to fix an email. The outcome is recorded on the
   registration instead, so a failure is visible without being destructive.
   ========================================================================== */

/**
 * Which language to write the confirmation in.
 *
 * Read from the checkout metadata when present, else from the path of the page
 * the buyer checked out on. A French buyer who has read a French page and paid
 * on a French page should not get an English receipt; getting this wrong is
 * small, but it is the first email after taking their money.
 */
function aa_reg_lang_of( $meta, $fallback_url = '' ) {
	if ( ! empty( $meta['lang'] ) && in_array( $meta['lang'], aa_reg_lang_roots(), true ) ) {
		return $meta['lang'];
	}
	$path = $fallback_url ? (string) parse_url( $fallback_url, PHP_URL_PATH ) : '';
	foreach ( aa_reg_lang_roots() as $code ) {
		if ( strpos( $path, '/' . $code . '/' ) === 0 ) { return $code; }
	}
	return 'en';
}

/** The confirmation copy, per language. English is the fallback for each key. */
function aa_reg_confirm_strings( $lang ) {
	$all = array(
		'en' => array(
			'subject'  => 'You are registered — %1$s, %2$s',
			'hi'       => 'Hi %s,',
			'hi_plain' => 'Hi,',
			'lede'     => 'Your place is confirmed. Here are the details.',
			'course'   => 'Course', 'dates' => 'Dates', 'seats' => 'Seats', 'paid' => 'Paid',
			'next_h'   => 'What happens next',
			'next_p'   => 'Your joining link and any pre-course material will be sent to this address before the class starts.',
			'move_h'   => 'Need to move dates?',
			'move_p'   => 'Reply to this email and we will move you to another cohort. Rescheduling carries no fee.',
			'receipt'  => 'Your invoice is below. Keep it for your records.',
			'invoice'=>'Invoice','order_no'=>'Order','order_date'=>'Order date','status_l'=>'Status',
			'delivery'=>'Delivery method','eticket'=>'eTicket','paid_by'=>'Paid by','invoice_to'=>'Invoice to',
			'qty'=>'Qty','description'=>'Description','unit_price'=>'Unit price','line_total'=>'Line total',
			'subtotal'=>'Subtotal','sales_tax'=>'Sales tax','total_l'=>'Total',
			'completed'=>'Completed','currency_note'=>'All prices are in %s.','view_invoice'=>'View or print your invoice',
			'paid_h'=>'Payment received','pending'=>'We are confirming your registration. This takes a few seconds.','pending_slow'=>'Your payment went through. Your confirmation is on its way by email — you can close this page.','confirmed_eyebrow'=>'Registration confirmed','confirmed_h'=>'You are registered, %s.','confirmed_p'=>'We have emailed the details and your invoice to %s.','print'=>'Print this page',
			'sign'     => 'Agile Agilist',
		),
		'es' => array(
			'subject'  => 'Inscripción confirmada — %1$s, %2$s',
			'hi'       => 'Hola %s:',
			'hi_plain' => 'Hola:',
			'lede'     => 'Tu plaza está confirmada. Estos son los detalles.',
			'course'   => 'Curso', 'dates' => 'Fechas', 'seats' => 'Plazas', 'paid' => 'Importe',
			'next_h'   => 'Qué ocurre ahora',
			'next_p'   => 'Te enviaremos a esta dirección el enlace de acceso y el material previo antes de que empiece la clase.',
			'move_h'   => '¿Necesitas cambiar de fechas?',
			'move_p'   => 'Responde a este correo y te cambiamos a otra convocatoria. El cambio no tiene coste.',
			'receipt'  => 'Tu factura aparece a continuación. Consérvala para tus registros.',
			'invoice'=>'Factura','order_no'=>'Pedido','order_date'=>'Fecha del pedido','status_l'=>'Estado',
			'delivery'=>'Método de entrega','eticket'=>'Entrada electrónica','paid_by'=>'Pagado con','invoice_to'=>'Facturar a',
			'qty'=>'Cant.','description'=>'Descripción','unit_price'=>'Precio unitario','line_total'=>'Total línea',
			'subtotal'=>'Subtotal','sales_tax'=>'Impuestos','total_l'=>'Total',
			'completed'=>'Completado','currency_note'=>'Todos los precios están en %s.','view_invoice'=>'Ver o imprimir tu factura',
			'paid_h'=>'Pago recibido','pending'=>'Estamos confirmando tu inscripción. Tardará unos segundos.','pending_slow'=>'Tu pago se ha realizado. La confirmación llegará por correo — puedes cerrar esta página.','confirmed_eyebrow'=>'Inscripción confirmada','confirmed_h'=>'Ya estás inscrito, %s.','confirmed_p'=>'Hemos enviado los detalles y tu factura a %s.','print'=>'Imprimir esta página',
			'sign'     => 'Agile Agilist',
		),
		'fr' => array(
			'subject'  => 'Inscription confirmée — %1$s, %2$s',
			'hi'       => 'Bonjour %s,',
			'hi_plain' => 'Bonjour,',
			'lede'     => 'Votre place est confirmée. Voici les détails.',
			'course'   => 'Formation', 'dates' => 'Dates', 'seats' => 'Places', 'paid' => 'Montant',
			'next_h'   => 'La suite',
			'next_p'   => 'Votre lien de connexion et les éventuels supports préparatoires seront envoyés à cette adresse avant le début de la session.',
			'move_h'   => 'Besoin de changer de dates ?',
			'move_p'   => 'Répondez à cet e-mail et nous vous placerons sur une autre session. Le report est sans frais.',
			'receipt'  => 'Votre facture figure ci-dessous. Conservez-la pour vos dossiers.',
			'invoice'=>'Facture','order_no'=>'Commande','order_date'=>'Date de commande','status_l'=>'Statut',
			'delivery'=>'Mode de livraison','eticket'=>'Billet électronique','paid_by'=>'Payé par','invoice_to'=>'Facturer à',
			'qty'=>'Qté','description'=>'Description','unit_price'=>'Prix unitaire','line_total'=>'Total ligne',
			'subtotal'=>'Sous-total','sales_tax'=>'Taxes','total_l'=>'Total',
			'completed'=>'Terminée','currency_note'=>'Tous les prix sont en %s.','view_invoice'=>'Voir ou imprimer votre facture',
			'paid_h'=>'Paiement reçu','pending'=>'Nous confirmons votre inscription. Cela prend quelques secondes.','pending_slow'=>'Votre paiement est passé. Votre confirmation arrive par e-mail — vous pouvez fermer cette page.','confirmed_eyebrow'=>'Inscription confirmée','confirmed_h'=>'Vous êtes inscrit, %s.','confirmed_p'=>'Nous avons envoyé les détails et votre facture à %s.','print'=>'Imprimer cette page',
			'sign'     => 'Agile Agilist',
		),
		'ar' => array(
			'subject'  => 'تم تأكيد تسجيلك — %1$s، %2$s',
			'hi'       => 'مرحبًا %s،',
			'hi_plain' => 'مرحبًا،',
			'lede'     => 'تم تأكيد مقعدك. إليك التفاصيل.',
			'course'   => 'الدورة', 'dates' => 'التواريخ', 'seats' => 'المقاعد', 'paid' => 'المبلغ المدفوع',
			'next_h'   => 'الخطوات التالية',
			'next_p'   => 'سنرسل إلى هذا البريد رابط الحضور وأي مواد تحضيرية قبل بداية الدورة.',
			'move_h'   => 'تحتاج إلى تغيير التواريخ؟',
			'move_p'   => 'ردّ على هذه الرسالة وسننقلك إلى دورة أخرى. إعادة الجدولة بدون رسوم.',
			'receipt'  => 'فاتورتك موضحة أدناه. يُرجى الاحتفاظ بها في سجلاتك.',
			'invoice'=>'فاتورة','order_no'=>'الطلب','order_date'=>'تاريخ الطلب','status_l'=>'الحالة',
			'delivery'=>'طريقة التسليم','eticket'=>'تذكرة إلكترونية','paid_by'=>'طريقة الدفع','invoice_to'=>'الفاتورة إلى',
			'qty'=>'الكمية','description'=>'الوصف','unit_price'=>'سعر الوحدة','line_total'=>'إجمالي البند',
			'subtotal'=>'المجموع الفرعي','sales_tax'=>'الضريبة','total_l'=>'الإجمالي',
			'completed'=>'مكتمل','currency_note'=>'جميع الأسعار بعملة %s.','view_invoice'=>'عرض الفاتورة أو طباعتها',
			'paid_h'=>'تم استلام الدفعة','pending'=>'نؤكّد تسجيلك الآن. يستغرق ذلك بضع ثوانٍ.','pending_slow'=>'تمت عملية الدفع بنجاح. سيصلك التأكيد بالبريد الإلكتروني — يمكنك إغلاق هذه الصفحة.','confirmed_eyebrow'=>'تم تأكيد التسجيل','confirmed_h'=>'تم تسجيلك، %s.','confirmed_p'=>'أرسلنا التفاصيل والفاتورة إلى %s.','print'=>'طباعة هذه الصفحة',
			'sign'     => 'Agile Agilist',
		),
	);
	$en = $all['en'];
	return isset( $all[ $lang ] ) ? array_merge( $en, $all[ $lang ] ) : $en;
}

/**
 * Build and send the buyer's confirmation. Returns true when wp_mail accepted it.
 *
 * Everything stated here is something we can actually do: the dates that were
 * bought, the amount that was charged, joining details before the class, and a
 * reschedule at no fee. No pass promise, no refund promise, and no claim about
 * course materials that varies between the SAFe and AI-Native catalogues.
 */
function aa_reg_send_confirmation( $args ) {
	$email = isset( $args['email'] ) ? $args['email'] : '';
	if ( ! $email || ! is_email( $email ) ) { return false; }

	$lang  = isset( $args['lang'] ) ? $args['lang'] : 'en';
	$t     = aa_reg_confirm_strings( $lang );
	$rtl   = aa_reg_is_rtl( $lang );

	/* Resolve the cohort back to a course and a date range. A cohort id we
	   cannot resolve still gets an email -- it just names the id rather than
	   inventing a course, because the buyer has paid either way. */
	$found  = isset( $args['cohort'] ) ? aa_reg_find( $args['cohort'] ) : null;
	$course = $found ? $found['course']['name'] : ( isset( $args['course'] ) ? $args['course'] : '' );
	$range  = $found ? aa_reg_range( $found['cohort']['start'], $found['cohort']['end'] ) : '';
	if ( $course === '' ) { $course = isset( $args['cohort'] ) ? $args['cohort'] : ''; }

	$seats  = max( 1, (int) ( isset( $args['seats'] ) ? $args['seats'] : 1 ) );
	$paid   = '';
	if ( ! empty( $args['amount'] ) ) {
		$paid = strtoupper( (string) $args['amount_currency'] ) . ' '
		      . number_format( (int) $args['amount'] / 100, 2 );
	}

	$name    = isset( $args['name'] ) ? trim( (string) $args['name'] ) : '';
	$greet   = $name !== '' ? sprintf( $t['hi'], $name ) : $t['hi_plain'];
	$subject = sprintf( $t['subject'], $course, $range );

	/* Inline styles and a table, because an email client is not a browser: no
	   stylesheet, no web font, nothing that depends on CSS the recipient's
	   client may strip. dir is set for Arabic. */
	$row = function ( $k, $v ) {
		return $v === '' ? '' :
			'<tr><td style="padding:6px 14px 6px 0;color:#5E7378;font-size:14px;white-space:nowrap">'
			. esc_html( $k ) . '</td>'
			. '<td style="padding:6px 0;color:#0E3A44;font-size:14px;font-weight:600">'
			. esc_html( $v ) . '</td></tr>';
	};

	$html  = '<div dir="' . ( $rtl ? 'rtl' : 'ltr' ) . '" style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;'
	       . 'color:#0E3A44;font-size:15px;line-height:1.6;max-width:560px">';
	$html .= '<p>' . esc_html( $greet ) . '</p>';
	$html .= '<p>' . esc_html( $t['lede'] ) . '</p>';
	$html .= '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;border-collapse:collapse">'
	       . $row( $t['course'], $course )
	       . $row( $t['dates'], $range )
	       . $row( $t['seats'], (string) $seats )
	       . $row( $t['paid'], $paid )
	       . '</table>';
	$html .= '<p style="margin:18px 0 4px;font-weight:600">' . esc_html( $t['next_h'] ) . '</p>';
	$html .= '<p style="margin:0">' . esc_html( $t['next_p'] ) . '</p>';
	$html .= '<p style="margin:18px 0 4px;font-weight:600">' . esc_html( $t['move_h'] ) . '</p>';
	$html .= '<p style="margin:0">' . esc_html( $t['move_p'] ) . '</p>';
	$html .= '<p style="margin:22px 0 0;color:#5E7378;font-size:13px">' . esc_html( $t['receipt'] ) . '</p>';

	/* The invoice, in the format you already issue, inline rather than
	   attached: no PDF library to install, and nothing for a mail client to
	   refuse to open. The link below it is the copy that outlives the email. */
	if ( ! empty( $args['post_id'] ) ) {
		$data = aa_reg_invoice_data( (int) $args['post_id'] );
		if ( $data ) {
			$html .= '<div style="margin:26px 0 0">' . aa_reg_invoice_html( $data, $lang ) . '</div>';
			$url = aa_reg_invoice_url( (int) $args['post_id'] );
			if ( $url ) {
				$html .= '<p style="margin:14px 0 0;font-size:13px">'
				       . '<a href="' . esc_url( $url ) . '" style="color:#127E88">'
				       . esc_html( $t['view_invoice'] ) . '</a></p>';
			}
		}
	}

	$html .= '<p style="margin:22px 0 0">' . esc_html( $t['sign'] ) . '</p></div>';

	$reply   = apply_filters( 'aa_reg_confirmation_reply_to', get_option( 'admin_email' ) );
	$headers = array( 'Content-Type: text/html; charset=UTF-8' );
	if ( $reply && is_email( $reply ) ) { $headers[] = 'Reply-To: ' . $reply; }

	/* One filter over the finished message, so the wording, the recipient or
	   the headers can be changed without editing this function. */
	$mail = apply_filters( 'aa_reg_confirmation', array(
		'to'      => $email,
		'subject' => $subject,
		'body'    => $html,
		'headers' => $headers,
	), $args );

	if ( empty( $mail['to'] ) ) { return false; }
	return (bool) wp_mail( $mail['to'], $mail['subject'], $mail['body'], $mail['headers'] );
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

	/* The sale is recorded by a function rather than inline, because the webhook
	   is no longer the only thing that can record one. See aa_reg_reconcile(). */
	$eid = isset( $event['id'] ) ? $event['id'] : '';
	$post_id = aa_reg_record_sale( $s, $eid );
	if ( $post_id === null ) { return array( 'ok' => true, 'duplicate' => true ); }
	return array( 'ok' => true, 'id' => $post_id );
}


/**
 * RECORD ONE PAID SALE. Idempotent on the Stripe id it is given.
 *
 * Extracted from the webhook so that the confirmation page can call it too.
 * Returns the new post id, or null when this sale is already recorded.
 */
/**
 * WHICH COURSE COSTS THIS, IN THIS CURRENCY.
 *
 * The cohort is the thing a sale is supposed to carry, and our own checkout
 * always carries it -- in metadata and again in client_reference_id. A payment
 * that arrives with NEITHER did not come through our checkout: a Stripe Payment
 * Link used directly, a link shared by hand, a dashboard-created payment. Those
 * are real sales and the money is real, so they are recorded either way.
 *
 * The amount is then the only thing left that identifies anything. It cannot
 * give us the DATE -- a course runs many cohorts at one price -- but it can
 * usually give us the COURSE, which is the difference between an invoice that
 * says "Lean Portfolio Management" and one that says nothing at all.
 *
 * AMBIGUITY RETURNS NOTHING. Two courses at the same price make the amount
 * useless as an identifier, and a wrong course name on an invoice is worse than
 * a missing one. Prices here are read from the same table the checkout charges
 * from, so this cannot drift from what was actually billed.
 */
function aa_reg_course_by_amount( $cents, $currency = 'usd' ) {
	$cents = (int) $cents;
	if ( $cents < 100 ) { return ''; }
	$cur = strtolower( (string) $currency );

	/* EVERY LANGUAGE, NOT JUST ENGLISH. Prices differ per language on purpose
	   -- French RTE is 2450 where English is 2150 -- and this runs from the
	   Stripe webhook, where aa_reg_lang() has no queried page and answers
	   'en'. Checking only the English table meant a French sale matched
	   nothing at all, which is the one case this function exists for.

	   Keyed by slug, so a course that matches in two languages still counts
	   once: we are identifying the COURSE, and the language it was sold in
	   does not change which one it is. */
	$hits = array();
	foreach ( array_merge( array( 'en' ), aa_reg_lang_roots() ) as $lang ) {
		aa_reg_lang_override( $lang );
		foreach ( aa_reg_all_course_slugs() as $slug ) {
			$c = aa_reg_course( $slug );
			if ( ! $c || empty( $c['price'] ) ) { continue; }
			if ( strtolower( (string) $c['currency'] ) !== $cur ) { continue; }
			if ( (int) round( $c['price'] * 100 ) === $cents ) { $hits[ $slug ] = true; }
		}
		aa_reg_lang_override( '' );
	}
	if ( count( $hits ) !== 1 ) { return ''; }
	$only = array_keys( $hits );
	return (string) $only[0];
}

/**
 * THE SOONEST COHORT THIS COURSE STILL HAS.
 *
 * Used when a payment arrives naming a course but no date. It is the same list
 * the course page offers, in the same order, so the date a buyer is put on is
 * one they could have chosen themselves a minute earlier -- not an invention.
 */
function aa_reg_next_cohort_for( $slug ) {
	$course = aa_reg_course( $slug );
	if ( ! $course ) { return null; }
	foreach ( aa_reg_upcoming( $slug, $course ) as $c ) { return $c; }
	return null;
}

/**
 * EVERY COURSE, AND WHETHER IT CAN ACTUALLY BE SOLD.  [aa_reg_wiring]
 *
 * A course is "wired" when all four of these hold. Any one missing is a way for
 * a sale to arrive that we cannot complete:
 *
 *   price      nothing to charge, so the checkout refuses with aa_price
 *   page       aa_reg_page_exists(), or the calendar links into a 404
 *   cohorts    an upcoming date, or there is nothing to buy
 *   unique     no other course shares its price, so a payment that arrives
 *              with no cohort can still be traced back to it by amount
 *
 * The last one is the one nobody thinks about. Two courses at one price are
 * fine until a Payment Link fires without a cohort, and then neither can be
 * identified from the money alone.
 */
function aa_reg_wiring_shortcode() {
	if ( ! current_user_can( 'edit_pages' ) ) { return ''; }

	$slugs  = aa_reg_all_course_slugs();
	$byprice = array();
	$rows    = array();

	foreach ( $slugs as $slug ) {
		$c = aa_reg_course( $slug );
		if ( ! $c ) {
			$rows[] = array( 'slug' => $slug, 'name' => $slug, 'price' => 0, 'cur' => '',
			                 'page' => false, 'next' => null, 'dead' => true );
			continue;
		}
		$cents = (int) round( $c['price'] * 100 );
		$key   = strtolower( $c['currency'] ) . ':' . $cents;
		if ( $cents > 0 ) {
			if ( ! isset( $byprice[ $key ] ) ) { $byprice[ $key ] = array(); }
			$byprice[ $key ][] = $slug;
		}
		$rows[] = array(
			'slug'  => $slug,
			'name'  => ! empty( $c['name'] ) ? $c['name'] : $slug,
			'price' => $c['price'],
			'cur'   => $c['currency'],
			'key'   => $key,
			'page'  => aa_reg_page_exists( isset( $c['url'] ) ? $c['url'] : '' ),
			'next'  => aa_reg_next_cohort_for( $slug ),
			'dead'  => false,
		);
	}

	$bad = 0;
	$h   = '<table class="aalangrep__t"><thead><tr><th>Course</th><th>Price</th><th>Page</th>'
	     . '<th>Next cohort</th><th>Price unique</th></tr></thead><tbody>';
	foreach ( $rows as $r ) {
		$okprice = ! $r['dead'] && $r['price'] > 0;
		$okpage  = ! empty( $r['page'] );
		$oknext  = ! empty( $r['next'] );
		$okuniq  = ! $r['dead'] && isset( $byprice[ $r['key'] ] ) && count( $byprice[ $r['key'] ] ) === 1;
		if ( ! ( $okprice && $okpage && $oknext && $okuniq ) ) { $bad++; }

		$yes = '<td class="is-yes">&#10003;</td>';
		$no  = '<td class="is-no">&mdash;</td>';
		$h .= '<tr><td>' . esc_html( $r['name'] ) . ' <small style="color:#8A8375">'
		    . esc_html( $r['slug'] ) . '</small></td>'
		    . ( $okprice ? '<td>' . esc_html( aa_reg_money( $r['price'], $r['cur'] ) ) . '</td>' : $no )
		    . ( $okpage ? $yes : $no )
		    . ( $oknext ? '<td>' . esc_html( aa_reg_range( $r['next']['start'], $r['next']['end'], true ) ) . '</td>' : $no )
		    . ( $okuniq ? $yes : '<td class="is-no">shared</td>' )
		    . '</tr>';
	}
	$h .= '</tbody></table>';

	$head = $bad === 0
		? '<p><strong>All ' . count( $rows ) . ' courses are wired.</strong> Every one has a price, a page, an upcoming cohort, and a price no other course shares.</p>'
		: '<p><strong>' . (int) $bad . ' of ' . count( $rows ) . ' courses are not fully wired.</strong> '
		  . 'A course missing a price cannot be charged for; missing a page gives the calendar a dead link; '
		  . 'missing a cohort means there is nothing to buy; a shared price means a payment arriving without '
		  . 'a cohort cannot be traced back to it.</p>';

	return $head . $h;
}
add_shortcode( 'aa_reg_wiring', 'aa_reg_wiring_shortcode' );

/**
 * THE BUYER HAS PAID AND WE DO NOT KNOW WHICH DATE THEY BOUGHT.
 *
 * What used to happen: aa_reg_send_confirmation() ran anyway, resolved the
 * empty cohort to nothing, and sent "You are registered — , " with an empty
 * course, empty dates and an invoice describing nothing. A real buyer received
 * exactly that. Silence would have been better, and this is better than both.
 *
 * It states only what is true -- the amount, the card, the course where the
 * amount identifies one -- and says a human is confirming the date. No invented
 * cohort, no invented dates, and no claim that they are registered, because
 * until somebody picks the cohort they are not on a class list.
 */
function aa_reg_send_pending_notice( $args ) {
	$email = isset( $args['email'] ) ? $args['email'] : '';
	if ( ! $email || ! is_email( $email ) ) { return false; }

	$lang = isset( $args['lang'] ) ? $args['lang'] : 'en';
	$rtl  = aa_reg_is_rtl( $lang );
	$name = isset( $args['name'] ) ? trim( (string) $args['name'] ) : '';

	$t = array(
		'en' => array(
			'subject' => 'We have your payment — confirming your dates',
			'hi'      => 'Hi %s,',
			'hi_p'    => 'Hi,',
			'lede'    => 'Your payment has gone through and we have it safely. One thing is outstanding: we need to confirm which cohort dates you are booked on.',
			'what'    => 'What we have',
			'course'  => 'Course',
			'dates'   => 'Dates',
			'paid'    => 'Paid',
			'next_h'  => 'What happens next',
			'next_p'  => 'A member of the team will email you within one working day with your dates, your joining link and your invoice. If you already know which dates you want, reply to this email and tell us — that is the fastest route.',
			'sorry'   => 'Apologies for the extra step.',
			'sign'    => 'Agile Agilist',
			/* The provisional variant: we know the course and have put them on
			   the next running class. Say which one, and say plainly that they
			   can change it -- moving cohorts costs nothing. */
			'p_subject' => 'Your payment is confirmed — you are on the %s cohort',
			'p_what'    => 'Your registration',
			'p_lede'    => 'Your payment has gone through, thank you. We have placed you on the next cohort we are running:',
			'p_next_p'  => 'You will receive your joining link and your invoice within one working day. If these dates do not suit you, reply to this email and we will move you to another cohort — there is no fee for changing.',
		),
		'fr' => array(
			'subject' => 'Votre paiement est bien reçu — confirmation des dates en cours',
			'hi'      => 'Bonjour %s,',
			'hi_p'    => 'Bonjour,',
			'lede'    => 'Votre paiement est bien passé et nous l’avons enregistré. Il reste un point à confirmer : les dates de la session sur laquelle vous êtes inscrit.',
			'what'    => 'Ce que nous avons',
			'course'  => 'Formation',
			'dates'   => 'Dates',
			'paid'    => 'Montant réglé',
			'next_h'  => 'La suite',
			'next_p'  => 'Un membre de l’équipe vous écrira sous un jour ouvré avec vos dates, votre lien de connexion et votre facture. Si vous savez déjà quelles dates vous souhaitez, répondez simplement à ce message — c’est le plus rapide.',
			'sorry'   => 'Merci de votre patience pour cette étape supplémentaire.',
			'sign'    => 'Agile Agilist',
			'p_subject' => 'Paiement confirmé — vous êtes inscrit à la session du %s',
			'p_what'    => 'Votre inscription',
			'p_lede'    => 'Votre paiement est bien passé, merci. Nous vous avons placé sur la prochaine session que nous animons :',
			'p_next_p'  => 'Vous recevrez votre lien de connexion et votre facture sous un jour ouvré. Si ces dates ne vous conviennent pas, répondez à ce message et nous vous déplacerons sur une autre session — le changement est sans frais.',
		),
	);
	$x = isset( $t[ $lang ] ) ? $t[ $lang ] : $t['en'];

	/* A provisional cohort is one we chose, not one they picked. It changes the
	   whole shape of the message: with dates we can confirm rather than
	   apologise, so the copy switches and the apology line drops. */
	$found = ! empty( $args['cohort'] ) ? aa_reg_find( (string) $args['cohort'] ) : null;
	$range = $found ? aa_reg_range( $found['cohort']['start'], $found['cohort']['end'] ) : '';

	$course = '';
	if ( $found ) {
		$course = $found['course']['name'];
	} elseif ( ! empty( $args['course'] ) ) {
		$c = aa_reg_course( $args['course'] );
		if ( $c && ! empty( $c['name'] ) ) { $course = $c['name']; }
	}

	if ( $range !== '' ) {
		$x['subject'] = sprintf( $x['p_subject'], $range );
		$x['lede']    = $x['p_lede'];
		$x['next_p']  = $x['p_next_p'];
		$x['what']    = $x['p_what'];
		$x['sorry']   = '';
	}

	$paid = '';
	if ( ! empty( $args['amount'] ) ) {
		$paid = strtoupper( (string) $args['amount_currency'] ) . ' '
		      . number_format( (int) $args['amount'] / 100, 2 );
	}

	$greet = $name !== '' ? sprintf( $x['hi'], $name ) : $x['hi_p'];

	$h  = '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;'
	    . 'line-height:1.6;color:#101C33;max-width:560px"' . ( $rtl ? ' dir="rtl"' : '' ) . '>';
	$h .= '<p>' . esc_html( $greet ) . '</p>';
	$h .= '<p>' . esc_html( $x['lede'] ) . '</p>';
	$h .= '<p style="margin:22px 0 6px;font-weight:600">' . esc_html( $x['what'] ) . '</p>';
	$h .= '<table style="border-collapse:collapse;font-size:14px">';
	if ( $course !== '' ) {
		$h .= '<tr><td style="padding:4px 18px 4px 0;color:#5E7378">' . esc_html( $x['course'] )
		    . '</td><td style="padding:4px 0;font-weight:600">' . esc_html( $course ) . '</td></tr>';
	}
	if ( $range !== '' ) {
		$h .= '<tr><td style="padding:4px 18px 4px 0;color:#5E7378">' . esc_html( $x['dates'] )
		    . '</td><td style="padding:4px 0;font-weight:600">' . esc_html( $range ) . '</td></tr>';
	}
	if ( $paid !== '' ) {
		$h .= '<tr><td style="padding:4px 18px 4px 0;color:#5E7378">' . esc_html( $x['paid'] )
		    . '</td><td style="padding:4px 0;font-weight:600">' . esc_html( $paid ) . '</td></tr>';
	}
	$h .= '</table>';
	$h .= '<p style="margin:22px 0 4px;font-weight:600">' . esc_html( $x['next_h'] ) . '</p>';
	$h .= '<p style="margin:0">' . esc_html( $x['next_p'] ) . '</p>';
	if ( $x['sorry'] !== '' ) {
		$h .= '<p style="margin:18px 0 0;color:#5E7378;font-size:13px">' . esc_html( $x['sorry'] ) . '</p>';
	}
	$h .= '<p style="margin:22px 0 0">' . esc_html( $x['sign'] ) . '</p></div>';

	$reply   = apply_filters( 'aa_reg_confirmation_reply_to', get_option( 'admin_email' ) );
	$headers = array( 'Content-Type: text/html; charset=UTF-8' );
	if ( $reply && is_email( $reply ) ) { $headers[] = 'Reply-To: ' . $reply; }

	return (bool) wp_mail( $email, $x['subject'], $h, $headers );
}

function aa_reg_record_sale( $s, $eid ) {
	/* IDEMPOTENT ON THE EVENT ID **AND** ON THE SESSION ID.
	   Stripe retries until it gets a 2xx, so the same event can arrive more than
	   once -- that is what the event check is for. But the event id is not the
	   only way one sale reaches here twice: the webhook records with Stripe's
	   event id and the sweep with "sweep:<session id>", so a session that both
	   routes see passes the event check on each, and the buyer gets a second
	   registration, a second seat off the count and a second confirmation in
	   their inbox. Stripe retries a failed webhook for up to three days, which
	   is exactly the sweep's own window -- so the two overlapping is the normal
	   case, not the edge one.

	   The session id is the thing that is actually one sale. It was already
	   being stored; it was simply never checked. */
	$sid = isset( $s['id'] ) ? (string) $s['id'] : '';
	foreach ( array( array( 'stripe_event', (string) $eid ), array( 'stripe_session', $sid ) ) as $probe ) {
		if ( $probe[1] === '' ) { continue; }
		if ( get_posts( array( 'post_type' => 'aa_registration', 'post_status' => 'any',
			'posts_per_page' => 1, 'fields' => 'ids', 'no_found_rows' => true,
			'meta_key' => $probe[0], 'meta_value' => $probe[1] ) ) ) {
			return null;
		}
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

	/* NO COHORT MEANS THIS DID NOT COME THROUGH OUR CHECKOUT.
	   Both of our routes carry it -- a session in metadata, a Payment Link in
	   client_reference_id -- so an empty one is a payment made some other way.
	   The money is real and gets recorded regardless; what changes is that we
	   stop pretending we know what was bought. The amount can usually name the
	   course even when nothing names the date. */
	$amount_cents = isset( $s['amount_total'] ) ? (int) $s['amount_total'] : 0;
	$currency_in  = isset( $s['currency'] ) ? sanitize_text_field( $s['currency'] ) : 'usd';
	$course_slug  = isset( $meta['course'] ) ? sanitize_text_field( $meta['course'] ) : '';
	if ( $cohort === '' && $course_slug === '' ) {
		$course_slug = aa_reg_course_by_amount( $amount_cents, $currency_in );
	}

	/* AN EMPTY COHORT MUST NOT SURVIVE THIS FUNCTION.
	   Knowing the course but not the date, the honest default is not "blank" --
	   it is the next class we are actually running. We put them on it, mark the
	   assignment provisional, and tell them the dates in the email with an
	   explicit invitation to reply if they wanted different ones. Worst case
	   somebody moves them, which we do without a fee anyway; best case, and it
	   is the common case, they bought the next one and are simply registered.

	   needs_cohort stays 1 either way -- a human still confirms it. What changes
	   is that the buyer is never left holding a receipt for nothing, and the
	   class list is never short a name nobody knew about. */
	$provisional = 0;
	if ( $cohort === '' && $course_slug !== '' ) {
		$next = aa_reg_next_cohort_for( $course_slug );
		if ( $next && ! empty( $next['id'] ) ) {
			$cohort      = sanitize_text_field( $next['id'] );
			$provisional = 1;
		}
	}

	$post_id = wp_insert_post( array(
		'post_type'   => 'aa_registration',
		'post_status' => 'private',
		'post_title'  => trim( $name . ' — ' . ( $cohort !== '' ? $cohort : 'COHORT UNKNOWN' )
		                       . ( $provisional ? ' (provisional)' : '' ) ),
		'meta_input'  => array(
			'stripe_event'   => $eid,
			'stripe_session' => isset( $s['id'] ) ? sanitize_text_field( $s['id'] ) : '',
			'cohort'         => $cohort,
			'course'         => $course_slug,
			/* The flag a human acts on. [aa_reg_attention] lists them. A
			   provisional cohort still needs confirming -- it is a good guess,
			   not the buyer telling us. */
			'needs_cohort'   => ( $cohort === '' || $provisional ) ? 1 : 0,
			'cohort_provisional' => $provisional,
			'seats'          => $seats,
			'email'          => $email,
			'phone'          => isset( $s['customer_details']['phone'] ) ? sanitize_text_field( $s['customer_details']['phone'] ) : '',
			'amount_total'   => isset( $s['amount_total'] ) ? (int) $s['amount_total'] : 0,
			'currency'       => isset( $s['currency'] ) ? sanitize_text_field( $s['currency'] ) : '',
			/* How they paid, for the invoice. Best-effort: an empty value drops
			   the line rather than guessing. */
			'card'           => aa_reg_card_line( isset( $s['payment_intent'] ) ? (string) $s['payment_intent'] : '' ),
			/* The key to the printable copy. Random, because an invoice carries
			   a name, an email and an amount -- a sequential id would let anyone
			   walk the list. */
			/* The token from the checkout, so the confirmation page the buyer is
			   already looking at resolves to this record. Only minted here if
			   the sale came in some other way -- a Payment Link, say -- which
			   carries no metadata of ours. */
			'invoice_token'  => ! empty( $meta['token'] ) ? sanitize_text_field( $meta['token'] )
			                                              : wp_generate_password( 32, false, false ),
			'lang'           => aa_reg_lang_of( $meta ),
		),
	) );

	if ( $cohort ) {
		$sold = (array) get_option( 'aa_reg_sold', array() );
		$sold[ $cohort ] = ( isset( $sold[ $cohort ] ) ? (int) $sold[ $cohort ] : 0 ) + $seats;
		update_option( 'aa_reg_sold', $sold, false );
	}

	/* The buyer's confirmation. After the record and the seat count, so a mail
	   failure cannot cost us the registration, and its outcome is stored on the
	   registration rather than thrown away -- an unsent confirmation is
	   something someone has to act on, and it should not need log archaeology
	   to find. */
	/* A CONFIRMATION THAT CONFIRMS NOTHING IS WORSE THAN NO CONFIRMATION.
	   With an empty cohort the template resolved the course to '' and the dates
	   to '', and sent "You are registered — , " with an invoice describing
	   nothing. A paying customer received exactly that. When we cannot name the
	   date, the buyer gets a short note saying the payment landed and a human is
	   confirming their dates -- true, useful, and it invents nothing. */
	$buyer_lang = aa_reg_lang_of( $meta );
	if ( $cohort === '' || $provisional ) {
		$sent = aa_reg_send_pending_notice( array(
			'email'           => $email,
			'name'            => $name,
			'course'          => $course_slug,
			'cohort'          => $provisional ? $cohort : '',
			'amount'          => $amount_cents,
			'amount_currency' => $currency_in,
			'lang'            => $buyer_lang,
		) );
	} else {
		$sent = aa_reg_send_confirmation( array(
			'email'           => $email,
			'name'            => $name,
			'cohort'          => $cohort,
			'course'          => $course_slug,
			'seats'           => $seats,
			'amount'          => $amount_cents,
			'amount_currency' => $currency_in,
			'lang'            => $buyer_lang,
			'post_id'         => $post_id && ! is_wp_error( $post_id ) ? $post_id : 0,
		) );
	}
	if ( $post_id && ! is_wp_error( $post_id ) ) {
		update_post_meta( $post_id, 'confirmation_sent', $sent ? 1 : 0 );
	}

	/* THE ADMIN MAIL SAYS WHICH OF THE TWO HAPPENED, IN THE SUBJECT.
	   A cohort-less sale is something a person has to finish by hand, and it
	   should not need anyone to read the body to notice. */
	if ( $provisional ) {
		$subject = 'CONFIRM COHORT — paid registration placed provisionally on ' . $cohort
		         . ( $sent ? '' : ' (BUYER EMAIL FAILED)' );
	} elseif ( $cohort === '' ) {
		$subject = 'ACTION NEEDED — paid registration with NO COHORT'
		         . ( $sent ? '' : ' (BUYER EMAIL FAILED)' );
	} else {
		$subject = ( $sent ? 'Paid registration — ' : 'Paid registration (CONFIRMATION EMAIL FAILED) — ' ) . $cohort;
	}
	wp_mail(
		get_option( 'admin_email' ),
		$subject,
		sprintf(
			"%s (%s)\nCohort: %s\nCourse: %s\nSeats: %d\nPaid: %s %s\nSession: %s\nRecord: %d%s",
			$name, $email,
			$cohort !== '' ? $cohort . ( $provisional ? '  ** PROVISIONAL — we chose this, the buyer did not **' : '' )
			               : '(none — sale did not come through our checkout)',
			$course_slug !== '' ? $course_slug : '(unknown)',
			$seats,
			strtoupper( $currency_in ),
			number_format( $amount_cents / 100, 2 ),
			isset( $s['id'] ) ? $s['id'] : '',
			(int) $post_id,
			$provisional
				? "\n\nThe sale carried no cohort, so it was placed on the next upcoming " . $course_slug . " cohort and the seat was counted.\nThe buyer has been told these dates and invited to reply if they wanted different ones.\nConfirm or move them, then clear needs_cohort."
				: ( $cohort === '' ? "\n\nSet the cohort on this registration, then resend the confirmation.\nUntil then the buyer has been told only that their payment landed." : '' )
		)
	);

	return $post_id;
}

endif; // double-load guard

/* ============================================================================
   AA — LANGUAGE SWITCHING, AND KNOWING WHAT IS TRANSLATED
   ----------------------------------------------------------------------------
   THE COMPLAINT: you click a language and land on the same English page.

   THE CAUSE: most English pages have no mirror. There are 14 French course
   pages, 13 Spanish and 5 Arabic against far more in English -- no homepage,
   no track pages, no services or contact in any language. A switcher that
   offers four languages on every page is offering something that mostly does
   not exist, and what it does when the target is missing (stay put, or bounce
   to the home page) is what you are seeing.

   WHY NOT FIX POLYLANG. Polylang is installed but it is not what decides
   language here -- aa_reg_lang() reads the page's root ancestor, so /fr/spc/ is
   French because it sits under a page called "fr". Polylang's own default is
   set to Arabic, which does not match the URLs at all. Linking 50-odd pages by
   hand in a plugin that is not driving the behaviour is work that can silently
   come undone the next time somebody edits a page.

   THE CONVENTION INSTEAD. The mirrors already reuse the English slug and
   differ only in ancestry -- aa_reg_derived_course() has relied on that for
   months. A switcher built on the same rule cannot drift out of step, because
   it reads the same thing the rest of the file reads: the page's own URL.

   Three things come out of it:
     [aa_lang_switch]   offers ONLY the languages this page actually exists in
     [aa_lang_report]   the matrix -- which pages are translated, which are not
     hreflang           emitted automatically, so Google stops treating the
                        mirrors as unrelated near-duplicates
   ========================================================================== */

function aa_reg_lang_names() {
	return array(
		'en' => 'English',
		'fr' => 'Français',
		'es' => 'Español',
		'ar' => 'العربية',
	);
}

/**
 * Mirrors whose slug is NOT the English one.
 *
 * Keyed on the English post_name. Most mirrors reuse the slug, so this stays
 * short -- but Leading SAFe does not (/training/safe/sa/ against
 * /fr/leading-safe-sa/) and a slug-only switcher would call it untranslated.
 */
function aa_reg_slug_map() {
	return array(
		/* Spanish translated this one and the map did not know: the page is
		   /es/liderando-safe-sa/, not /es/leading-safe-sa/. The switcher was
		   looking for a slug that does not exist and concluding, correctly by
		   its own rule, that there is no Spanish page. There is. */
		'sa'       => array( 'fr' => 'leading-safe-sa', 'es' => 'liderando-safe-sa', 'ar' => 'leading-safe-sa' ),
		'training' => array( 'es' => 'formacion', 'ar' => 'formation' ),

		/* THE ASSESSMENTS. Every one of these exists in French and Spanish and
		   not one of them was reachable from the switcher, because the mirrors
		   translated the slug as well as the page -- /fr/evaluation-agile/ for
		   /assessments/agile-assessment/. The convention the switcher relies on
		   is "same slug, different ancestry", and these seven pairs quietly
		   broke it. That is the "I click French and land on the same English
		   page" complaint, in full: the page was always there. */
		'assessments'                   => array( 'fr' => 'evaluations',                    'es' => 'evaluaciones' ),
		'agile-assessment'              => array( 'fr' => 'evaluation-agile',               'es' => 'evaluacion-agile' ),
		'ai-assessment'                 => array( 'fr' => 'evaluation-ia',                  'es' => 'evaluacion-ia' ),
		'product-management-assessment' => array( 'fr' => 'evaluation-product-management',  'es' => 'evaluacion-product-management' ),
		'innovation-framework'          => array( 'fr' => 'evaluation-innovation',          'es' => 'evaluacion-innovacion' ),
		'mutation-readiness'            => array( 'fr' => 'evaluation-preparation-mutation','es' => 'evaluacion-preparacion-mutacion' ),
		'agile-maturity'                => array( 'fr' => 'evaluation-maturite-agile',      'es' => 'evaluacion-madurez-agile' ),
	);
}

/** The English slug for a page, whichever language it is in. */
function aa_reg_en_slug( $slug, $lang ) {
	if ( $lang === 'en' ) { return $slug; }
	foreach ( aa_reg_slug_map() as $en => $per ) {
		if ( isset( $per[ $lang ] ) && $per[ $lang ] === $slug ) { return $en; }
	}
	return $slug;
}

/** The slug this English page uses in $lang. */
function aa_reg_slug_in( $en_slug, $lang ) {
	$map = aa_reg_slug_map();
	return isset( $map[ $en_slug ][ $lang ] ) ? $map[ $en_slug ][ $lang ] : $en_slug;
}

/**
 * EVERY LANGUAGE THIS PAGE ACTUALLY EXISTS IN, as lang => permalink.
 *
 * A language that resolves to nothing is simply absent from the array. That is
 * the whole fix: the switcher cannot offer a page that is not there.
 */
function aa_reg_translations( $post = null ) {
	if ( $post === null ) { $post = get_queried_object(); }
	if ( ! ( $post instanceof WP_Post ) ) { return array(); }

	static $cache = array();
	if ( isset( $cache[ $post->ID ] ) ) { return $cache[ $post->ID ]; }

	$here    = aa_reg_lang( $post );
	$en_slug = aa_reg_en_slug( $post->post_name, $here );
	$out     = array();

	foreach ( array_keys( aa_reg_lang_names() ) as $lang ) {
		$slug  = aa_reg_slug_in( $en_slug, $lang );
		$pages = get_posts( array(
			'post_type'        => 'page',
			'name'             => $slug,
			'post_status'      => 'publish',
			'numberposts'      => 6,
			'suppress_filters' => true,
		) );
		foreach ( $pages as $p ) {
			/* aa_reg_lang() answers this for both directions: an English page
			   is one whose root ancestor is not a language root. */
			if ( aa_reg_lang( $p ) !== $lang ) { continue; }
			$out[ $lang ] = get_permalink( $p->ID );
			break;
		}
	}

	$cache[ $post->ID ] = $out;
	return $out;
}

/**
 * [aa_lang_switch]
 *
 * Renders nothing at all when the page exists in only one language -- a
 * switcher with one option is furniture, not navigation.
 */
function aa_reg_lang_switch( $atts ) {
	$a = shortcode_atts( array( 'class' => '' ), $atts, 'aa_lang_switch' );

	$found = aa_reg_translations();
	if ( count( $found ) < 2 ) { return ''; }

	$here  = aa_reg_lang();
	$names = aa_reg_lang_names();

	$h = '<nav class="aalang ' . esc_attr( $a['class'] ) . '" aria-label="Language">';
	foreach ( $names as $lang => $label ) {
		if ( ! isset( $found[ $lang ] ) ) { continue; }
		$on = ( $lang === $here );
		$h .= '<a class="aalang__i' . ( $on ? ' is-on' : '' ) . '"'
		    . ' href="' . esc_url( $found[ $lang ] ) . '"'
		    . ' lang="' . esc_attr( $lang ) . '"'
		    . ( $lang === 'ar' ? ' dir="rtl"' : '' )
		    . ( $on ? ' aria-current="true"' : '' ) . '>'
		    . esc_html( $label ) . '</a>';
	}
	$h .= '</nav>';
	return $h;
}
add_shortcode( 'aa_lang_switch', 'aa_reg_lang_switch' );

/**
 * HREFLANG.
 *
 * Without this Google has no way to know /fr/spc/ and /training/adv-safe/spc/
 * are the same page in two languages -- they are near-identical in structure,
 * share a price block and a schedule, and the coverage report already shows 29
 * URLs where Google picked a canonical we did not. Emitted only when there is
 * more than one, and x-default points at English.
 */
function aa_reg_hreflang() {
	if ( ! is_singular( 'page' ) ) { return; }
	$found = aa_reg_translations();
	if ( count( $found ) < 2 ) { return; }

	foreach ( $found as $lang => $url ) {
		echo "\n" . '<link rel="alternate" hreflang="' . esc_attr( $lang ) . '" href="' . esc_url( $url ) . '" />';
	}
	if ( isset( $found['en'] ) ) {
		echo "\n" . '<link rel="alternate" hreflang="x-default" href="' . esc_url( $found['en'] ) . '" />';
	}
	echo "\n";
}
add_action( 'wp_head', 'aa_reg_hreflang', 8 );

/**
 * [aa_lang_report]
 *
 * The matrix: every published English page, and which languages it exists in.
 * Put it on a private page. It answers "what is actually translated" without
 * anyone clicking a switcher to find out.
 */
function aa_reg_lang_report() {
	if ( ! current_user_can( 'edit_pages' ) ) {
		return '<p>The translation report is for editors.</p>';
	}

	$pages = get_posts( array(
		'post_type'        => 'page',
		'post_status'      => 'publish',
		'numberposts'      => 400,
		'orderby'          => 'title',
		'order'            => 'ASC',
		'suppress_filters' => true,
	) );

	/* THE COLUMNS ARE WHATEVER LANGUAGES WE PUBLISH IN, not three names typed
	   into this function. A report that has to be edited before it can show a
	   new language is a report that will quietly keep showing the old three. */
	$names = aa_reg_lang_names();
	$langs = aa_reg_lang_roots();
	$rows  = array();
	$tally = array_fill_keys( $langs, 0 );
	$total = 0;

	foreach ( $pages as $p ) {
		if ( aa_reg_lang( $p ) !== 'en' ) { continue; }   // mirrors are columns, not rows
		$found = aa_reg_translations( $p );
		$total++;
		foreach ( $langs as $l ) {
			if ( isset( $found[ $l ] ) ) { $tally[ $l ]++; }
		}
		$rows[] = array( 'post' => $p, 'found' => $found );
	}

	$sum = array();
	foreach ( $langs as $l ) {
		$sum[] = ( isset( $names[ $l ] ) ? $names[ $l ] : strtoupper( $l ) ) . ' ' . $tally[ $l ];
	}
	$h  = '<div class="aalangrep"><p class="aalangrep__sum">' . (int) $total . ' English pages &middot; '
	    . esc_html( implode( ' · ', $sum ) ) . '</p>';
	$h .= '<table class="aalangrep__t"><thead><tr><th>Page</th>';
	foreach ( $langs as $l ) { $h .= '<th>' . esc_html( strtoupper( $l ) ) . '</th>'; }
	$h .= '</tr></thead><tbody>';
	foreach ( $rows as $r ) {
		$h .= '<tr><td><a href="' . esc_url( get_permalink( $r['post']->ID ) ) . '">'
		    . esc_html( $r['post']->post_title ) . '</a></td>';
		foreach ( $langs as $l ) {
			$h .= isset( $r['found'][ $l ] )
				? '<td class="is-yes"><a href="' . esc_url( $r['found'][ $l ] ) . '">&#10003;</a></td>'
				: '<td class="is-no">&mdash;</td>';
		}
		$h .= '</tr>';
	}
	$h .= '</tbody></table></div>';
	return $h;
}
add_shortcode( 'aa_lang_report', 'aa_reg_lang_report' );

/**
 * SUPERSEDED MIRRORS, REDIRECTED RATHER THAN DELETED.
 *
 * /fr/formation/ was the French training hub before /fr/training/ replaced it.
 * Both were live, both ranked, and a visitor could land on either -- one of
 * them showing the old design and an older list of courses.
 *
 * Deleting the old one throws away whatever ranking it has and hands anyone
 * holding the link a 404. A 301 moves both. The map is keyed on post id, not
 * on a path, so it cannot fire on the wrong page if a slug is ever reused, and
 * it only ever runs on a singular page request.
 */
function aa_reg_superseded() {
	return array(
		/* old page id => the page that replaced it */
		29287 => '/fr/training/',
	);
}

function aa_reg_redirect_superseded() {
	if ( is_admin() || ! is_singular( 'page' ) ) { return; }

	$id  = get_queried_object_id();
	$map = aa_reg_superseded();
	if ( ! isset( $map[ $id ] ) ) { return; }

	$target = home_url( $map[ $id ] );
	/* Never redirect a page to itself: that is an infinite loop served to
	   every visitor, and it would be found by them rather than by us. */
	if ( untrailingslashit( $target ) === untrailingslashit( get_permalink( $id ) ) ) { return; }

	wp_safe_redirect( $target, 301 );
	exit;
}
add_action( 'template_redirect', 'aa_reg_redirect_superseded' );

/* ============================================================================
   AA — THE SITE IS IN A LANGUAGE, NOT THE PAGE
   ----------------------------------------------------------------------------
   THE COMPLAINT: you switch to French, and the page is French -- but the menu
   is still English, and the first link you click puts you back on the English
   site. The switch worked; it just only ever switched one page.

   THE CAUSE: the language lives in the URL and aa_reg_lang() reads it off the
   page. Nothing else knew. The theme renders one menu, built once, pointing at
   English pages, and it renders that same menu on /fr/spc/ as on /spc/.

   WHY NOT A SECOND MENU. Duplicating the menu per language means four menus to
   keep in step by hand, and they drift the moment somebody adds a course. The
   mirrors already follow a rule -- same slug, different ancestry -- and that
   rule is enough to rewrite the menu we already have, item by item, at render.
   A course added in French appears in the French menu because the page exists,
   not because anyone remembered to add it twice.

   WHAT IS REWRITTEN: menu links and labels, links inside page content, and the
   logo's link home. An item with no mirror keeps its English URL rather than
   disappearing -- a visitor who can reach a page in the wrong language is
   better served than one who cannot reach it at all.
   ========================================================================= */

/**
 * This page's mirror in $lang, or '' — one query, memoised.
 *
 * aa_reg_translations() answers the same question for every language at once,
 * which is right for the switcher and wasteful here: the menu asks about one
 * language, forty times a page.
 */
function aa_reg_mirror_of( $post, $lang ) {
	if ( ! ( $post instanceof WP_Post ) ) { return ''; }

	static $memo = array();
	$key = $post->ID . '|' . $lang;
	if ( isset( $memo[ $key ] ) ) { return $memo[ $key ]; }
	$memo[ $key ] = '';

	$here = aa_reg_lang( $post );
	if ( $here === $lang ) { return ''; }

	$slug  = aa_reg_slug_in( aa_reg_en_slug( $post->post_name, $here ), $lang );
	$pages = get_posts( array(
		'post_type'        => 'page',
		'name'             => $slug,
		'post_status'      => 'publish',
		'numberposts'      => 6,
		'suppress_filters' => true,
	) );
	foreach ( $pages as $p ) {
		if ( aa_reg_lang( $p ) !== $lang ) { continue; }
		$memo[ $key ] = get_permalink( $p->ID );
		break;
	}
	return $memo[ $key ];
}

/** The same, from a URL rather than a post. '' when there is nothing to swap. */
function aa_reg_mirror_url( $url, $lang ) {
	$url = trim( (string) $url );
	if ( $url === '' || $url[0] === '#' ) { return ''; }
	if ( preg_match( '#^(mailto:|tel:|javascript:)#i', $url ) ) { return ''; }

	/* Only our own pages. An absolute URL elsewhere is somebody else's site and
	   rewriting it would be both wrong and rude. */
	$host = wp_parse_url( $url, PHP_URL_HOST );
	if ( $host && $host !== wp_parse_url( home_url(), PHP_URL_HOST ) ) { return ''; }

	$parts = wp_parse_url( $url );
	$path  = isset( $parts['path'] ) ? (string) $parts['path'] : '';
	if ( $path === '' ) { return ''; }

	/* Already under a language root: either it is the right one, in which case
	   there is nothing to do, or it is a deliberate cross-language link. */
	foreach ( aa_reg_lang_roots() as $root ) {
		if ( strpos( $path, '/' . $root . '/' ) === 0 ) { return ''; }
	}

	/* THE PATH IS WHAT MOVES; THE QUERY AND THE FRAGMENT COME ALONG.
	   get_permalink() returns a bare page URL, so the first version of this
	   dropped everything after the path -- and on a course page almost every
	   link has something after the path. "?cohort=spc-2026-10-12#enroll"
	   became the top of the page with no cohort selected, and a section link
	   like "#salary" on a full path stopped jumping anywhere. The page still
	   loaded, which is why it read as navigation breaking rather than as an
	   error. Memoise the base by path; re-attach the rest per link. */
	static $memo = array();
	$key = $path . '|' . $lang;
	if ( ! isset( $memo[ $key ] ) ) {
		$id = url_to_postid( $path );
		$memo[ $key ] = $id ? aa_reg_mirror_of( get_post( $id ), $lang ) : '';
	}
	$base = $memo[ $key ];
	if ( $base === '' ) { return ''; }

	if ( ! empty( $parts['query'] ) ) {
		$base .= ( strpos( $base, '?' ) === false ? '?' : '&' ) . $parts['query'];
	}
	if ( ! empty( $parts['fragment'] ) ) {
		$base .= '#' . $parts['fragment'];
	}
	return $base;
}

/**
 * Menu labels that are not simply the page's title.
 *
 * Where a menu item carries the page title unchanged, swapping the URL swaps
 * the label with it and nothing is needed here. This is for the ones somebody
 * shortened by hand -- "Lean Portfolio Mgmt (LPM)" is not what the page is
 * called, so following the page would change the label as well as translate it.
 */
function aa_reg_menu_labels() {
	return array(
		'Home'         => array( 'fr' => 'Accueil',      'es' => 'Inicio',        'ar' => 'الرئيسية' ),
		'Training'     => array( 'fr' => 'Formations',   'es' => 'Formación',     'ar' => 'التدريب' ),
		'Courses'      => array( 'fr' => 'Formations',   'es' => 'Cursos',        'ar' => 'الدورات' ),
		'Services'     => array( 'fr' => 'Services',     'es' => 'Servicios',     'ar' => 'الخدمات' ),
		'Assessments'  => array( 'fr' => 'Évaluations',  'es' => 'Evaluaciones',  'ar' => 'التقييمات' ),
		'About'        => array( 'fr' => 'À propos',     'es' => 'Acerca de',     'ar' => 'من نحن' ),
		'Contact'      => array( 'fr' => 'Contact',      'es' => 'Contacto',      'ar' => 'اتصل بنا' ),
		'Customers'    => array( 'fr' => 'Nos clients',  'es' => 'Clientes',      'ar' => 'عملاؤنا' ),
		'Blog'         => array( 'fr' => 'Blog',         'es' => 'Blog',          'ar' => 'المدونة' ),
		'FAQ'          => array( 'fr' => 'FAQ',          'es' => 'Preguntas frecuentes', 'ar' => 'الأسئلة الشائعة' ),
		'Global Offices'    => array( 'fr' => 'Nos bureaux',        'es' => 'Oficinas' ),
		'Send us a message' => array( 'fr' => 'Nous écrire',        'es' => 'Escríbenos' ),
		'Agile Career Selector' => array( 'fr' => 'Sélecteur de parcours', 'es' => 'Selector de carrera' ),
		'Lean Portfolio Mgmt (LPM)' => array( 'fr' => 'Lean Portfolio Mgmt (LPM)', 'es' => 'Lean Portfolio Mgmt (LPM)' ),
		'Agile Product Mgmt (APM)'  => array( 'fr' => 'Agile Product Mgmt (APM)',  'es' => 'Agile Product Mgmt (APM)' ),
		'Digital Transformation'    => array( 'fr' => 'Transformation numérique',  'es' => 'Transformación digital' ),
		'Innovation Culture'        => array( 'fr' => 'Culture d’innovation',      'es' => 'Cultura de innovación' ),
		'Product Operating Model'   => array( 'fr' => 'Modèle opérationnel produit','es' => 'Modelo operativo de producto' ),
		'Operating Model in the Age of AI' => array( 'fr' => 'Le modèle opérationnel à l’ère de l’IA', 'es' => 'Modelo operativo en la era de la IA' ),
		'Value Stream Mapping'      => array( 'fr' => 'Value Stream Mapping',      'es' => 'Value Stream Mapping' ),
		'Conflict & Collaboration'  => array( 'fr' => 'Conflit et collaboration',  'es' => 'Conflicto y colaboración' ),
		'Achieving Responsible AI'  => array( 'fr' => 'Une IA responsable',        'es' => 'IA responsable' ),
		'Agile Maturity'            => array( 'fr' => 'Maturité Agile',            'es' => 'Madurez Agile' ),
		'Innovation Framework'      => array( 'fr' => 'Innovation Framework',      'es' => 'Innovation Framework' ),
		'AI-Native'                 => array( 'fr' => 'AI-Native',                 'es' => 'AI-Native' ),
		'AI Automation'             => array( 'fr' => 'Automatisation par l’IA',   'es' => 'Automatización con IA' ),
		'Mutation'                  => array( 'fr' => 'Mutation',                  'es' => 'Mutación' ),
	);
}

function aa_reg_localise_menu( $items ) {
	$lang = aa_reg_lang();
	if ( $lang === 'en' || ! is_array( $items ) ) { return $items; }

	$labels = aa_reg_menu_labels();
	$home   = untrailingslashit( home_url( '/' ) );

	foreach ( $items as $item ) {
		if ( ! isset( $item->url ) ) { continue; }

		/* The home link, which resolves to no page and so would never match. */
		if ( untrailingslashit( $item->url ) === $home ) {
			$item->url = home_url( '/' . $lang . '/' );
			$plain     = html_entity_decode( (string) $item->title, ENT_QUOTES, 'UTF-8' );
			if ( isset( $labels[ $plain ][ $lang ] ) ) { $item->title = $labels[ $plain ][ $lang ]; }
			continue;
		}

		$id = ( isset( $item->object ) && $item->object === 'page' && ! empty( $item->object_id ) )
			? (int) $item->object_id
			: url_to_postid( $item->url );
		if ( ! $id ) { continue; }

		$src = get_post( $id );
		$url = aa_reg_mirror_of( $src, $lang );
		if ( $url === '' ) { continue; }   // no mirror: leave it in English rather than hide it

		/* A menu item can carry an anchor -- "Cohorts" pointing at
		   /training/#cohorts -- and the mirror is a bare page URL. Same trap
		   as the content links; same fix. */
		$was = wp_parse_url( $item->url );
		if ( ! empty( $was['query'] ) ) {
			$url .= ( strpos( $url, '?' ) === false ? '?' : '&' ) . $was['query'];
		}
		if ( ! empty( $was['fragment'] ) ) {
			$url .= '#' . $was['fragment'];
		}

		$item->url = $url;

		/* THE LABEL, and three rules in order of confidence.
		   A hand-written label gets its hand-written translation. A label that
		   is simply the page's title follows the page, which is why most items
		   need no entry at all. Anything else keeps the English it had -- a
		   wrong translation in a menu is worse than an untranslated one. */
		$plain = html_entity_decode( (string) $item->title, ENT_QUOTES, 'UTF-8' );
		if ( isset( $labels[ $plain ][ $lang ] ) ) {
			$item->title = $labels[ $plain ][ $lang ];
		} elseif ( $plain === html_entity_decode( get_the_title( $id ), ENT_QUOTES, 'UTF-8' ) ) {
			$mirror_id = url_to_postid( $url );
			if ( $mirror_id ) { $item->title = get_the_title( $mirror_id ); }
		}
	}
	return $items;
}
add_filter( 'wp_nav_menu_objects', 'aa_reg_localise_menu', 20 );

/**
 * Links inside the page, same rule.
 *
 * The French course pages carry English links in their "career path" sections
 * -- /training/safe/asm/ and the like -- written before the mirrors existed.
 * Rewriting at render means they follow the mirrors as those appear, instead of
 * needing every page edited again.
 */
function aa_reg_localise_links( $html ) {
	$lang = aa_reg_lang();
	if ( $lang === 'en' || is_admin() || ! is_string( $html ) || $html === '' ) { return $html; }
	if ( strpos( $html, 'href=' ) === false ) { return $html; }
	/* An off switch that does not need this 300KB file edited to reach. Drop
	   add_filter( 'aa_reg_rewrite_content_links', '__return_false' ); in any
	   other snippet and the body is served exactly as stored. */
	if ( ! apply_filters( 'aa_reg_rewrite_content_links', true ) ) { return $html; }

	$out = preg_replace_callback(
		'#href=(["\'])([^"\']+)\1#i',
		function ( $m ) use ( $lang ) {
			$url = aa_reg_mirror_url( $m[2], $lang );
			return $url === '' ? $m[0] : 'href=' . $m[1] . esc_url( $url ) . $m[1];
		},
		$html
	);

	/* preg_replace_callback returns null on failure -- backtrack limit, bad
	   UTF-8 -- and returning that would blank the page body. Keep the original
	   rather than serve nothing. */
	return ( $out === null ) ? $html : $out;
}
add_filter( 'the_content', 'aa_reg_localise_links', 20 );

/** The logo links home; on a mirror, home is that language's home. */
function aa_reg_localise_logo( $html ) {
	$lang = aa_reg_lang();
	if ( $lang === 'en' || ! is_string( $html ) || $html === '' ) { return $html; }
	return str_replace(
		array( 'href="' . home_url( '/' ) . '"', 'href="' . untrailingslashit( home_url( '/' ) ) . '"' ),
		'href="' . home_url( '/' . $lang . '/' ) . '"',
		$html
	);
}
add_filter( 'get_custom_logo', 'aa_reg_localise_logo', 20 );

/**
 * [aa_lang_debug] — why is this page's navigation in the language it is in?
 *
 * Put it on any page, in any language, and read it while logged in. It answers
 * the three questions that decide everything above, in order, so a wrong answer
 * names its own cause rather than needing the whole chain re-derived:
 *
 *   what aa_reg_lang() says       -- 'en' on a /fr/ page means it was asked
 *                                    before the query was ready, and every
 *                                    filter below it will do nothing
 *   whether the filters are on    -- a snippet saved inactive looks identical
 *                                    to a snippet with a bug
 *   what each menu item resolves  -- a blank mirror is a missing page, which
 *                                    is content, not code
 */
function aa_reg_lang_debug_shortcode() {
	if ( ! current_user_can( 'edit_pages' ) ) { return ''; }

	$lang = aa_reg_lang();
	$id   = get_queried_object_id();
	$post = $id ? get_post( $id ) : null;
	$anc  = $post ? get_post_ancestors( $post->ID ) : array();
	$root = $anc ? get_post( end( $anc ) ) : $post;

	$l   = array();
	$l[] = 'aa_reg_lang()      : ' . $lang . ( $lang === 'en' ? '   <-- English; everything below is a no-op' : '' );
	$l[] = 'this page          : #' . (int) $id . '  ' . ( $post ? $post->post_name : '(none)' );
	$l[] = 'root ancestor slug : ' . ( $root ? $root->post_name : '(none)' )
	     . ( $root && in_array( $root->post_name, aa_reg_lang_roots(), true ) ? '   (a language root)' : '   (not a language root -> English)' );
	$l[] = '';
	$l[] = 'menu filter   : ' . ( has_filter( 'wp_nav_menu_objects', 'aa_reg_localise_menu' ) ? 'attached' : 'NOT ATTACHED' );
	$l[] = 'content filter: ' . ( has_filter( 'the_content', 'aa_reg_localise_links' ) ? 'attached' : 'NOT ATTACHED' );
	$l[] = 'logo filter   : ' . ( has_filter( 'get_custom_logo', 'aa_reg_localise_logo' ) ? 'attached' : 'NOT ATTACHED' );
	$l[] = 'content rewrite enabled: ' . ( apply_filters( 'aa_reg_rewrite_content_links', true ) ? 'yes' : 'no (switched off)' );
	$l[] = '';

	$locs = get_nav_menu_locations();
	$term = isset( $locs['primary'] ) ? (int) $locs['primary'] : 0;
	$l[]  = 'primary menu  : ' . ( $term ? '#' . $term : 'NONE ASSIGNED' );

	if ( $term ) {
		$items = wp_get_nav_menu_items( $term );
		if ( $items ) {
			$l[] = str_pad( 'LABEL', 34 ) . str_pad( 'POINTS AT', 40 ) . 'MIRROR IN ' . strtoupper( $lang );
			foreach ( array_slice( $items, 0, 40 ) as $it ) {
				$oid = ( $it->object === 'page' && $it->object_id ) ? (int) $it->object_id : url_to_postid( $it->url );
				$src = $oid ? get_post( $oid ) : null;
				$mir = $src ? aa_reg_mirror_of( $src, $lang ) : '';
				$l[] = str_pad( mb_substr( wp_strip_all_tags( $it->title ), 0, 32 ), 34 )
				     . str_pad( mb_substr( (string) wp_make_link_relative( $it->url ), 0, 38 ), 40 )
				     . ( $mir !== '' ? wp_make_link_relative( $mir ) : '— none —' );
			}
		}
	}

	return '<pre style="font-size:12px;line-height:1.5;overflow-x:auto;background:#F8FCFC;'
	     . 'border:1px solid #DCEAEA;padding:16px">' . esc_html( implode( "\n", $l ) ) . '</pre>';
}
add_shortcode( 'aa_lang_debug', 'aa_reg_lang_debug_shortcode' );

/**
 * THE OLD COURSE PAGES HAVE AN EMPTY HOLE WHERE THE DATES SHOULD BE.
 *
 * Those pages carry <div id="aa-cohorts" ...></div> in the hero card, under a
 * heading that says "choose a cohort". It was filled by the register JS that
 * shipped with that design. That snippet was replaced by the current one, which
 * drives the new accordion instead and binds nothing to this element -- and no
 * stylesheet defines .aa-cohorts either. So the div has been an empty gap ever
 * since, on every old-design course page, in every language. The PHP only ever
 * READ this element, for its data- attributes, which is why the hero kept
 * reporting the right price above a picker with nothing in it.
 *
 * Filling it on the server rather than restoring the old JS: the dates already
 * come from aa_reg_upcoming(), the same source the new pages use, so the two
 * designs cannot disagree about what is running.
 *
 * Deliberately self-styled. The CSS that once styled this element is gone, and
 * a page whose stylesheet I cannot see is not a page to hand class names to.
 * Colours are inherited, so it reads correctly on the dark card these sit in
 * and on a light one if any page differs.
 */
function aa_reg_fill_cohort_picker( $html ) {
	if ( is_admin() || ! is_string( $html ) || $html === '' ) { return $html; }
	if ( strpos( $html, 'aa-cohorts' ) === false ) { return $html; }

	$post = get_post();
	if ( ! ( $post instanceof WP_Post ) ) { return $html; }

	$course = aa_reg_course( $post->post_name );
	if ( ! $course ) { return $html; }

	$rows = aa_reg_upcoming( $post->post_name, $course );
	if ( ! $rows ) { return $html; }

	$out = preg_replace_callback(
		'#(<div[^>]*id=["\']aa-cohorts["\'][^>]*>)(\s*)(</div>)#i',
		function ( $m ) use ( $rows, $course ) {
			/* The hidden data-carriers on the newer mirror pages are the same
			   element doing a different job. Never make one visible. */
			if ( preg_match( '/\shidden|display\s*:\s*none/i', $m[1] ) ) { return $m[0]; }

			$li = '';
			foreach ( array_slice( $rows, 0, 4 ) as $c ) {
				$label = aa_reg_range( $c['start'], $c['end'], true );
				$left  = (int) aa_reg_seats_left( $course, $c );
				$li .= '<a href="' . esc_url( '?cohort=' . $c['id'] . '#enroll' ) . '"'
				     . ' style="display:flex;justify-content:space-between;align-items:center;gap:12px;'
				     . 'padding:10px 13px;border:1px solid currentColor;border-radius:8px;'
				     . 'text-decoration:none;color:inherit;font-size:14px;opacity:.92">'
				     . '<span>' . esc_html( $label ) . '</span>'
				     . ( $left > 0
				         ? '<span style="font-size:11.5px;opacity:.75">' . esc_html( sprintf( aa_reg_t( 'seats_left', '%d seats left' ), $left ) ) . '</span>'
				         : '' )
				     . '</a>';
			}

			return $m[1]
			     . '<div style="display:flex;flex-direction:column;gap:8px;margin:12px 0">' . $li . '</div>'
			     . $m[3];
		},
		$html
	);

	return ( $out === null ) ? $html : $out;
}
add_filter( 'the_content', 'aa_reg_fill_cohort_picker', 21 );

/**
 * [aa_reg_attention] — paid registrations that a human still has to finish.
 *
 * Put it on a private admin page. Anything listed here is money we have taken
 * where nobody has picked the cohort yet, which means the buyer is holding a
 * "we are confirming your dates" note and is not on any class list. It should
 * normally be empty.
 */
function aa_reg_attention_shortcode() {
	if ( ! current_user_can( 'edit_pages' ) ) { return ''; }

	$rows = get_posts( array(
		'post_type'        => 'aa_registration',
		'post_status'      => 'any',
		'numberposts'      => 200,
		'meta_key'         => 'needs_cohort',
		'meta_value'       => '1',
		'suppress_filters' => true,
	) );

	if ( ! $rows ) {
		return '<p><strong>Nothing needs attention.</strong> Every paid registration has a cohort.</p>';
	}

	$h = '<table class="aalangrep__t"><thead><tr><th>Buyer</th><th>Course</th><th>Cohort</th>'
	   . '<th>Paid</th><th>Stripe session</th><th>Record</th></tr></thead><tbody>';
	foreach ( $rows as $r ) {
		$course = (string) get_post_meta( $r->ID, 'course', true );
		$c      = $course ? aa_reg_course( $course ) : null;
		$cents  = (int) get_post_meta( $r->ID, 'amount_total', true );
		$cur    = strtoupper( (string) get_post_meta( $r->ID, 'currency', true ) );

		/* Two different jobs share this list and they are not the same urgency.
		   A blank cohort is a buyer with no dates at all. A provisional one is a
		   buyer who has dates and a seat -- somebody just has to agree with the
		   guess. Say which is which rather than making the reader open each. */
		$coh  = (string) get_post_meta( $r->ID, 'cohort', true );
		$prov = (int) get_post_meta( $r->ID, 'cohort_provisional', true );
		if ( $coh === '' ) {
			$cell = '<strong style="color:#B3261E">none — pick one</strong>';
		} elseif ( $prov ) {
			$pf   = aa_reg_find( $coh );
			$cell = esc_html( $pf ? aa_reg_range( $pf['cohort']['start'], $pf['cohort']['end'] ) : $coh )
			      . '<br><span style="color:#8A6D00;font-size:12px">provisional — confirm or move</span>';
		} else {
			$cell = esc_html( $coh );
		}

		$h .= '<tr>'
		    . '<td>' . esc_html( (string) get_post_meta( $r->ID, 'email', true ) ) . '</td>'
		    . '<td>' . esc_html( $c && ! empty( $c['name'] ) ? $c['name'] : ( $course !== '' ? $course : 'unknown' ) ) . '</td>'
		    . '<td>' . $cell . '</td>'
		    . '<td>' . esc_html( $cur . ' ' . number_format( $cents / 100, 2 ) ) . '</td>'
		    . '<td style="font-family:ui-monospace,monospace;font-size:11px">'
		    . esc_html( (string) get_post_meta( $r->ID, 'stripe_session', true ) ) . '</td>'
		    . '<td><a href="' . esc_url( get_edit_post_link( $r->ID ) ) . '">#' . (int) $r->ID . '</a></td>'
		    . '</tr>';
	}
	$h .= '</tbody></table>';
	return $h;
}
add_shortcode( 'aa_reg_attention', 'aa_reg_attention_shortcode' );

/**
 * [aa_reg_send] — send (or resend) a confirmation and invoice, by hand.
 *
 * WHY THIS EXISTS. A sale that did not come through our checkout -- Corsizio,
 * Eventbrite, a bank transfer -- never reaches aa_reg_record_sale(), so nothing
 * ever sends the buyer anything. Thomas J Green paid for an October SPC on
 * 14 September and was still waiting weeks later, because there was no way to
 * send a confirmation except by writing one by hand.
 *
 * WHY IT IS A BUTTON AND NOT A HOOK. The previous attempt at this ran on init,
 * on every page load, for every visitor, and took the site down. A shortcode
 * that does nothing until an administrator posts a form has no such reach: no
 * request without a valid nonce and manage_options does anything at all, and a
 * logged-out visitor sees nothing, because the shortcode returns '' for them.
 *
 * Put it on a private page next to [aa_reg_attention].
 */
function aa_reg_send_shortcode() {
	if ( ! current_user_can( 'manage_options' ) ) { return ''; }

	$notice = '';

	/* The only side effect in this file that a human triggers directly. Nonce
	   first, capability already checked, and the id has to resolve to one of
	   our own registrations -- a post id alone is not authorisation. */
	if ( isset( $_POST['aa_send_id'], $_POST['aa_send_nonce'] )
		&& wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['aa_send_nonce'] ) ), 'aa_reg_send' ) ) {

		$id  = (int) $_POST['aa_send_id'];
		$reg = get_post( $id );
		if ( ! $reg || $reg->post_type !== 'aa_registration' ) {
			$notice = '<p><strong>That is not a registration.</strong></p>';
		} else {
			/* A registration entered by hand has no token, and without one
			   aa_reg_invoice_url() returns '' and the email quietly goes out
			   with no invoice link -- which is most of what the buyer wanted.
			   Mint it here, once, rather than anywhere it would have to be
			   written down or passed around. */
			if ( ! get_post_meta( $id, 'invoice_token', true ) ) {
				update_post_meta( $id, 'invoice_token', wp_generate_password( 32, false, false ) );
			}

			$email = (string) get_post_meta( $id, 'email', true );
			$sent  = aa_reg_send_confirmation( array(
				'email'           => $email,
				'name'            => trim( preg_replace( '/ — .*$/u', '', $reg->post_title ) ),
				'cohort'          => (string) get_post_meta( $id, 'cohort', true ),
				'course'          => (string) get_post_meta( $id, 'course', true ),
				'seats'           => (int) get_post_meta( $id, 'seats', true ),
				'amount'          => (int) get_post_meta( $id, 'amount_total', true ),
				'amount_currency' => (string) get_post_meta( $id, 'currency', true ),
				'lang'            => (string) get_post_meta( $id, 'lang', true ),
				'post_id'         => $id,
			) );
			update_post_meta( $id, 'confirmation_sent', $sent ? 1 : 0 );
			if ( $sent ) {
				update_post_meta( $id, 'confirmation_sent_at', current_time( 'mysql' ) );
				update_post_meta( $id, 'confirmation_sent_by', get_current_user_id() );
			}
			$notice = $sent
				? '<p><strong>Sent to ' . esc_html( $email ) . '.</strong> The invoice link is in the email.</p>'
				: '<p><strong>wp_mail() refused for ' . esc_html( $email ) . '.</strong> Nothing was sent; the mail transport is the thing to look at, not this page.</p>';
		}
	}

	$rows = get_posts( array(
		'post_type'        => 'aa_registration',
		'post_status'      => 'any',
		'numberposts'      => 100,
		'suppress_filters' => true,
	) );

	$h = $notice . '<table class="aalangrep__t"><thead><tr><th>Buyer</th><th>Cohort</th>'
	   . '<th>Paid</th><th>Confirmation</th><th></th></tr></thead><tbody>';

	foreach ( $rows as $r ) {
		$sent  = (int) get_post_meta( $r->ID, 'confirmation_sent', true );
		$when  = (string) get_post_meta( $r->ID, 'confirmation_sent_at', true );
		$cents = (int) get_post_meta( $r->ID, 'amount_total', true );
		$cur   = strtoupper( (string) get_post_meta( $r->ID, 'currency', true ) );

		$h .= '<tr>'
		    . '<td>' . esc_html( (string) get_post_meta( $r->ID, 'email', true ) ) . '</td>'
		    . '<td>' . esc_html( (string) get_post_meta( $r->ID, 'cohort', true ) ) . '</td>'
		    . '<td>' . esc_html( $cur . ' ' . number_format( $cents / 100, 2 ) ) . '</td>'
		    . '<td>' . ( $sent
				? '<span class="is-yes">sent' . ( $when ? ' ' . esc_html( $when ) : '' ) . '</span>'
				: '<strong style="color:#B3261E">never sent</strong>' ) . '</td>'
		    . '<td><form method="post" style="margin:0">'
		    . wp_nonce_field( 'aa_reg_send', 'aa_send_nonce', true, false )
		    . '<input type="hidden" name="aa_send_id" value="' . (int) $r->ID . '">'
		    . '<button type="submit">' . ( $sent ? 'Resend' : 'Send' ) . '</button>'
		    . '</form></td>'
		    . '</tr>';
	}
	$h .= '</tbody></table>';
	return $h;
}
add_shortcode( 'aa_reg_send', 'aa_reg_send_shortcode' );



/* The Corsizio one-shot for Thomas J Green Jr lived here and has been removed.
   It hooked init and ran on EVERY page load, calling aa_reg_find() before it
   marked itself done -- so anything that threw in there threw on every request
   and never got past its own guard. If WPCode was deactivating this snippet on
   a fatal, this was the most likely source. Re-add it as an admin-only,
   manually triggered action, never as an init hook that fires for visitors. */


/**
 * AA – Training category pages: EDITORIAL COPY
 * -----------------------------------------------------------------------------
 * The five track landing pages, in the design from the training-category
 * handoff. Copy layer only -- courses, prices, durations and cohorts come from
 * aa_reg_course(), so nothing here can contradict what the checkout charges.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS COPY IS SHAPED THE WAY IT IS
 *
 * The hero sits directly beside the registration card, which makes it the most
 * expensive text on the site: it is read by a person deciding whether to spend
 * $2,899, by a search engine deciding what the page is about, and by an
 * assistant deciding what to quote. Those three want different things, and the
 * first draft of this file served only the first.
 *
 * 1. SEARCH. "The credentials that move you into the senior seat." is a good
 *    line containing no term anyone searches. People type "Advanced SAFe
 *    certification", "SPC certification", "RTE course". The keyword now sits
 *    in the h1 -- which is the h1 for the page -- and the benefit moved into
 *    'accent', the italic tail, where it still lands emotionally.
 *
 * 2. ASSISTANTS AND ANSWER ENGINES quote sentences, not fragments, and they
 *    cannot quote a number whose caveat is elsewhere on the page. So 'sub' is
 *    two complete sentences carrying the entities that identify this page --
 *    course names, duration, format, what is included -- and every figure is
 *    stated with its qualifier attached. Nothing here needs the rest of the
 *    page to be true.
 *
 * 3. MOBILE. The h1 renders up to 52px. At 390px a nine-word headline is four
 *    or five lines and pushes the register card below the fold, on the one
 *    page where the card is the point. Headlines are held to six words or
 *    fewer, with 'accent' able to wrap onto its own line without stranding a
 *    single word.
 *
 * 'points' is new: three short factual chips beside the CTA. They repeat the
 * facts a buyer scans for -- duration, what is included, what happens if the
 * date stops working -- in a form that survives being read on a phone at a
 * glance, and that an answer engine can lift as a list.
 *
 * ---------------------------------------------------------------------------
 * COPY RULES BAKED IN, all previously ruled on:
 *   - exam prep and support; never a pass guarantee, never money back on a
 *     failed exam
 *   - rescheduling is free and carries no notice window
 *   - no star ratings, no aggregate review claims
 *   - salary is role context and never a course outcome, and the caveat is a
 *     sentence rather than a footnote so it travels with the number
 *   - nothing asserted about Scaled Agile credentials that our own pages do
 *     not already say
 *
 * 'accent' is the italic serif tail and carries its own full stop.
 */



/**
 * TRACK COPY IN THE READER'S LANGUAGE.
 *
 * aa_training_copy() is the English original and stays the source of truth for
 * structure: every key a track has in English it has everywhere. This is the
 * override layer -- a language supplies only the fields it has translated, and
 * anything it omits falls through to English, exactly the way aa_reg_t() works.
 *
 * That is what makes a French track page cost a page with one shortcode on it
 * rather than a rebuilt template: the design is in the snippet, the schedule
 * and the prices are read live, and only the words live here.
 *
 * FRENCH IS COMPLETE. Spanish and Arabic are deliberately absent for now and
 * fall through to English, which is what those pages already show -- so adding
 * this changes nothing for them until their copy is written.
 */
function aa_training_copy_i18n() {
	return array(
		'fr' => array(
			'adv-safe' => array(
				'label'  => 'SAFe Avancé',
				'kicker' => 'Postes seniors',
				'title'  => 'Certification SAFe Avancé',
				'accent' => 'pour le poste senior.',
				'sub'    => 'SPC, ASPC, RTE, LPM, APM, SAFe Architect et Large Solution SAFe, '
				          . 'en direct virtuel avec un SPCT Gold, examen inclus. Ce sont les '
				          . 'certifications que les grandes entreprises recherchent quand elles '
				          . 'recrutent quelqu’un pour diriger une transformation, et non pour y '
				          . 'participer.',
				'comp'   => 'En direct virtuel · examen inclus · report sans frais.',
				'points' => array( '2 à 4 jours', 'Examen inclus', 'Report sans frais' ),
			),
			'safe-roles' => array(
				'label'  => 'Rôles SAFe essentiels',
				'kicker' => 'Commencez ici',
				'title'  => 'Certification SAFe',
				'accent' => 'par rôle.',
				'sub'    => 'Leading SAFe, SAFe Scrum Master, Product Owner / Product Manager, '
				          . 'Advanced Scrum Master, DevOps, SAFe for Teams et Business Owner. La '
				          . 'plupart durent deux jours en direct virtuel, examen inclus : vous '
				          . 'passez l’examen et repartez certifié dans la même semaine.',
				'comp'   => 'Deux jours · examen inclus · report sans frais.',
				'points' => array( 'Deux jours', 'Examen inclus', 'Certifié cette semaine' ),
			),
			'ai-native' => array(
				'label'  => 'AI-Native',
				'kicker' => 'Nouveau en 2026',
				'title'  => 'Certification AI-Native',
				'accent' => 'pour les rôles recrutés aujourd’hui.',
				'sub'    => 'AI-Native Foundations, AI-Native Value Architect et Leading the '
				          . 'AI-Native Organization — trois certifications pour des rôles qui '
				          . 'n’existaient pas il y a deux ans et que l’on trouve aujourd’hui dans '
				          . 'les offres d’emploi. Conçues pour celles et ceux qui dirigent le '
				          . 'travail : aucune programmation requise.',
				'comp'   => 'En présentiel et en direct virtuel · examen inclus.',
				'points' => array( '1 à 2 jours', 'Aucune programmation requise', 'Présentiel ou virtuel' ),
			),
			'safe-found' => array(
				'label'  => 'Micro-certifications',
				'kicker' => 'Un jour, une compétence',
				'title'  => 'Micro-certifications SAFe',
				'accent' => 'en une seule journée.',
				'sub'    => 'Des certifications d’une journée qui viennent compléter les '
				          . 'certifications complètes : chacune approfondit une seule compétence '
				          . 'et donne droit à un badge numérique émis par Scaled Agile. '
				          . 'Réservez-en une, ajoutez la spécialisation, et vous êtes de retour à '
				          . 'votre bureau dès le lendemain.',
				'comp'   => 'Une journée · badge numérique émis par Scaled Agile.',
				'points' => array( 'Une journée', 'Badge numérique', 'Aucun examen à réviser' ),
			),
			'safe-industry' => array(
				'label'  => 'SAFe par secteur',
				'kicker' => 'Votre secteur',
				'title'  => 'Formation SAFe',
				'accent' => 'pour votre secteur.',
				'sub'    => 'Secteur public, défense, matériel et livraison réglementée — les '
				          . 'mêmes certifications SAFe, enseignées au regard des contrats, de la '
				          . 'conformité et des jalons d’approbation propres à votre secteur. '
				          . 'Animées par des formateurs qui ont piloté ces programmes de '
				          . 'l’intérieur.',
				'comp'   => 'En direct virtuel et en présentiel · examen inclus.',
				'points' => array( 'Spécifique au secteur', 'Examen inclus', 'Présentiel possible' ),
			),
		),
	);
}

function aa_training_copy() {
	return array(

		/* ---------------------------------------------------------------
		   ADVANCED SAFe -- SPC, ASPC, RTE, APM, LPM, ARCH, Large Solution
		   Audience is already certified and already working in SAFe. They
		   are buying seniority, so the keyword carries the benefit.
		   --------------------------------------------------------------- */
		'adv-safe' => array(
			'label'   => 'Advanced SAFe',
			'kicker'  => 'Senior roles',
			'title'   => 'Advanced SAFe certification',
			'accent'  => 'for the senior seat.',
			'sub'     => 'SPC, ASPC, RTE, LPM, APM, SAFe Architect and Implementing Large Solution SAFe, '
			           . 'taught live online by a Gold SPCT with the exam fee included. These are the '
			           . 'credentials enterprises screen for when they are hiring someone to lead a '
			           . 'transformation rather than take part in one.',
			'comp'    => 'Live online · exam fee included · reschedule at no fee.',
			'points'  => array( '2–4 days', 'Exam fee included', 'Reschedule at no fee' ),
		),

		/* ---------------------------------------------------------------
		   CORE SAFe ROLES
		   First certification for most buyers. The decision is "will this
		   get me screened in", and the objection is how long it takes.
		   --------------------------------------------------------------- */
		'safe-roles' => array(
			'label'   => 'Core SAFe Roles',
			'kicker'  => 'Start here',
			'title'   => 'SAFe certification',
			'accent'  => 'by role.',
			'sub'     => 'Leading SAFe, SAFe Scrum Master, Product Owner / Product Manager, Advanced '
			           . 'Scrum Master, DevOps, SAFe for Teams and Business Owner. Most run two days '
			           . 'live online with the exam fee included, so you can sit the exam and be '
			           . 'certified inside the same week.',
			'comp'    => 'Two days · exam fee included · reschedule at no fee.',
			'points'  => array( 'Two days', 'Exam fee included', 'Certified this week' ),
		),

		/* ---------------------------------------------------------------
		   AI-NATIVE
		   Newest track. Leads on the roles rather than the technology, and
		   answers the objection this audience actually raises out loud.
		   --------------------------------------------------------------- */
		'ai-native' => array(
			'label'   => 'AI-Native',
			'kicker'  => 'New for 2026',
			'title'   => 'AI-Native certification',
			'accent'  => 'for the roles being hired now.',
			'sub'     => 'AI-Native Foundations, AI-Native Value Architect and Leading the AI-Native '
			           . 'Organization — three certifications for roles that did not exist two years '
			           . 'ago and are on job boards today. Built for the people who lead the work, so '
			           . 'no coding is required.',
			'comp'    => 'In person and live online · exam fee included.',
			'points'  => array( '1–2 days', 'No coding required', 'In person or live online' ),
		),

		/* ---------------------------------------------------------------
		   MICRO-CREDENTIALS
		   Not a career change, a top-up. Sells the low cost of taking one,
		   which is the actual reason someone books.
		   --------------------------------------------------------------- */
		'safe-found' => array(
			'label'   => 'Micro-credentials',
			'kicker'  => 'One day, one skill',
			'title'   => 'SAFe micro-credentials',
			'accent'  => 'in a single day.',
			'sub'     => 'One-day credentials that sit between the full certifications, each going '
			           . 'deep on one skill and carrying a digital badge issued by Scaled Agile. '
			           . 'Book one, add the specialisation, and be back at your desk tomorrow.',
			'comp'    => 'One day · digital badge issued by Scaled Agile.',
			'points'  => array( 'One day', 'Digital badge', 'No exam to revise for' ),
		),

		/* ---------------------------------------------------------------
		   SAFe BY INDUSTRY
		   Same certifications, different constraints. This buyer has been
		   told generic agile does not survive their contract or regulator,
		   so the opening answers that before anything else.
		   --------------------------------------------------------------- */
		'safe-industry' => array(
			'label'   => 'SAFe by Industry',
			'kicker'  => 'Your sector',
			'title'   => 'SAFe training',
			'accent'  => 'for your industry.',
			'sub'     => 'Government, defence, hardware and regulated delivery — the same SAFe '
			           . 'certifications, taught against the contracts, compliance and approval gates '
			           . 'your sector works under. Delivered by instructors who have run these '
			           . 'programmes inside them.',
			'comp'    => 'Live online and in person · exam fee included.',
			'points'  => array( 'Sector-specific', 'Exam fee included', 'In person available' ),
		),
	);
}

/** English base, with the reader's language laid over it where it exists. */
function aa_training_copy_l10n() {
	$base = aa_training_copy();
	$lang = function_exists( 'aa_reg_lang' ) ? aa_reg_lang() : 'en';
	$over = aa_training_copy_i18n();
	if ( $lang === 'en' || empty( $over[ $lang ] ) ) { return $base; }
	foreach ( $over[ $lang ] as $slug => $fields ) {
		if ( ! isset( $base[ $slug ] ) ) { continue; }
		$base[ $slug ] = array_merge( $base[ $slug ], $fields );
	}
	return $base;
}

/**
 * The salary caveat, one sentence, on every page.
 *
 * Prose and not a footnote on purpose: this is the sentence that has to travel
 * if a search engine or an assistant quotes the band, and a figure quoted
 * without it reads as a promise about what the course pays.
 */
function aa_training_salary_note() {
	return 'Figures are median total compensation for the role, from Scaled Agile, LinkedIn '
	     . 'Salary and Payscale. Compensation reflects the role and the market, not the '
	     . 'certification on its own, and course fees are separate.';
}


/**
 * AA – TRACK LANDING PAGE  [aa_training_category category="adv-safe"]
 * -----------------------------------------------------------------------------
 * The five training category pages, in the design from the training-category
 * handoff, built on our own data.
 *
 * WHAT COMES FROM WHERE, and why it matters:
 *
 *   courses, prices, durations, cohorts   aa_reg_course() / aa_reg_upcoming()
 *   headline, opening, chips              aa_training_copy()
 *
 * The handoff hand-maintains prices and cohorts in a JS data file, and its own
 * notes flag the prices for ai-native and safe-roles as placeholders. They were
 * wrong: it lists Leading SAFe at $1,095 where the site charges $997, and
 * AI-Native Value Architect at $2,295 where the site charges $2,500. A landing
 * page quoting a price the checkout does not honour is worse than no landing
 * page, so every figure here is read from the same table the checkout reads.
 *
 * Hand-maintained cohorts are the same trap one level down: that is exactly
 * what left /training/ai-native/ showing an empty calendar. Nothing on this
 * page is entered by hand twice.
 *
 * SECTIONS. Hero and calendar are built here. Career impact, certification
 * costs and roles-in-demand need salary bands, role definitions and live
 * postings -- genuinely editorial content that is not in any system yet -- so
 * they are deliberately absent rather than filled with invented numbers.
 * Adding them is a data edit once that content exists.
 */



/** Which courses belong to which track. Slugs, resolved through aa_reg_course(). */
function aa_training_courses( $cat ) {
	$map = array(
		'adv-safe'      => array( 'spc', 'aspc', 'rte', 'apm', 'lpm', 'arch', 'large-solution' ),
		'safe-roles'    => array( 'sa', 'scrum-master', 'popm', 'asm', 'devops', 'team-practitioner', 'bo' ),
		'ai-native'     => array( 'ai-native-foundations', 'ai-native-change-agent', 'ai-native-ready-certification-2' ),
		/* THESE TWO USED TO TAKE THEIR LIST FROM THE PAGE'S OWN CHILDREN.
		   That works in English, where the queried page is the English track
		   page and its children are the course pages. It fails everywhere else:
		   a French track page has no children -- the French course pages are
		   flat under /fr/ -- so the accordion came out empty. Hand lists are
		   language-independent, because they are slugs and aa_reg_course()
		   resolves each one in the reader's language. */
		'safe-found'    => array( 'conflict-collaboration', 'value-stream-mapping',
		                          'responsible-ai-safe', 'agile-contracting-government' ),
		'safe-industry' => array( 'arch', 'ase', 'safe-for-hardware-teams',
		                          'sa-gov', 'team-practitioner' ),
	);
	if ( ! empty( $map[ $cat ] ) ) { return $map[ $cat ]; }

	/* NO HAND LIST: USE THE PAGE'S OWN CHILDREN.
	   A track page is the parent of its course pages, so the hub already knows
	   what is in it and there is nothing to keep in step -- a course added or
	   retired later shows up without an edit here. The three tracks above keep
	   their hand lists because they pull in courses that do not sit under them
	   (Large Solution, for one), which children alone would miss.
	   A child that is not a course resolves to nothing in aa_reg_course() and
	   is skipped, so an SEO landing page filed under a track cannot smuggle
	   itself into the calendar. */
	if ( ! function_exists( 'get_queried_object_id' ) ) { return array(); }
	$id = get_queried_object_id();
	if ( ! $id ) { return array(); }

	$kids = get_posts( array(
		'post_type'        => 'page',
		'post_parent'      => $id,
		'post_status'      => 'publish',
		'numberposts'      => 40,
		'orderby'          => 'menu_order title',
		'order'            => 'ASC',
		'suppress_filters' => true,
	) );

	$out = array();
	foreach ( $kids as $k ) { $out[] = $k->post_name; }
	return $out;
}

/**
 * EVERY COURSE SLUG ON THE SITE, for the hub calendar.
 *
 * Built from the same two sources aa_training_courses() uses, so the hub can
 * never disagree with a track page about what is in that track:
 *
 *   - the hand lists, for the three tracks that pull in a course filed
 *     somewhere else (Large Solution sits outside adv-safe, for one);
 *   - the child pages of each track, for the two that have no hand list, and
 *     as a safety net for the three that do -- a course added under a track
 *     later appears here without an edit.
 *
 * aa_training_courses() reads get_queried_object_id() to find those children,
 * which is right on a track page and wrong on the hub, where the queried page
 * is /training/ itself. So the children are resolved by path here instead.
 *
 * A child that is not a course resolves to nothing in aa_reg_course() and is
 * skipped downstream, so an SEO landing page filed under a track cannot get
 * itself into the calendar.
 */
function aa_reg_track_children( $cat ) {
	if ( ! function_exists( 'get_page_by_path' ) ) { return array(); }
	$parent = get_page_by_path( 'training/' . $cat );
	if ( ! $parent ) { return array(); }

	$kids = get_posts( array(
		'post_type'        => 'page',
		'post_parent'      => $parent->ID,
		'post_status'      => 'publish',
		'numberposts'      => 60,
		'orderby'          => 'menu_order title',
		'order'            => 'ASC',
		'suppress_filters' => true,
	) );

	$out = array();
	foreach ( $kids as $k ) { $out[] = $k->post_name; }
	return $out;
}

function aa_reg_all_course_slugs() {
	static $cache = null;
	if ( $cache !== null ) { return $cache; }

	$tracks = array( 'adv-safe', 'safe-roles', 'ai-native', 'safe-industry', 'safe-found' );

	/* Keyed rather than appended, so a course listed by hand AND present as a
	   child -- which is most of them -- appears once. */
	$seen = array();
	foreach ( $tracks as $cat ) {
		foreach ( aa_reg_track_children( $cat ) as $slug ) { $seen[ $slug ] = true; }
	}
	/* The hand lists last, so a course that sits outside every track is still
	   in the hub. */
	foreach ( array_keys( aa_reg_courses() ) as $slug ) { $seen[ $slug ] = true; }

	$cache = array_keys( $seen );
	return $cache;
}

function aa_training_category_shortcode( $atts ) {
	$a = shortcode_atts( array( 'category' => 'adv-safe', 'h' => 'h1' ), $atts, 'aa_training_category' );

	$copy = aa_training_copy_l10n();
	$cat  = $a['category'];
	if ( ! isset( $copy[ $cat ] ) ) { return ''; }
	$c = $copy[ $cat ];

	/* THIS SHORTCODE IS THE PAGE'S HERO. IT MUST NEVER RENDER NOTHING.
	   It used to return '' when a track resolved no courses, which was harmless
	   while the pages still carried their own hero underneath. They do not any
	   more -- that hero was removed BECAUSE this one replaced it -- so an empty
	   return is now a page that opens with no heading, no lede and no h1 at
	   all. It happened, on the tracks whose course list comes from their child
	   pages.

	   Everything above the register card is copy, and the copy is always there.
	   So the hero is unconditional from here down, and only the parts that
	   genuinely need a schedule -- the card and the calendar -- are skipped. */
	$slugs = aa_training_courses( $cat );

	/* A slug that will not resolve is skipped rather than rendered as a broken
	   row: a course with no page cannot be registered for. */
	$courses = array();
	foreach ( $slugs as $slug ) {
		$course = aa_reg_course( $slug );
		if ( $course && ! empty( $course['url'] ) ) { $courses[ $slug ] = $course; }
	}

	/* Next cohort per course, and the soonest overall -- the hero's default.
	   The whole upcoming list is kept too: the hero card offers several dates
	   per course, not just the next one. */
	$next = array();
	$ups  = array();
	foreach ( $courses as $slug => $course ) {
		$up = aa_reg_upcoming( $slug, $course );
		if ( $up ) { $next[ $slug ] = $up[0]; $ups[ $slug ] = $up; }
	}
	/* A TRACK WITH NOTHING ON THE SCHEDULE STILL HAS A PAGE. Micro-credentials
	   are blended e-learning with no cohort to pick, and returning nothing here
	   left those pages with no heading at all. The hero is built from copy and
	   course names; only the register card and the calendar need dates, and
	   both are skipped rather than faked. */
	$first_slug = '';
	$first      = null;
	$fc         = null;
	if ( $next ) {
		uasort( $next, function ( $x, $y ) { return strcmp( $x['start'], $y['start'] ); } );
		$first_slug = key( $next );
		$first      = $next[ $first_slug ];
		$fc         = $courses[ $first_slug ];
	}

	/* One <h1> per page. The pages already carry their own heading in some
	   cases, so h="h2" demotes this rather than shipping a second one. */
	$H = ( $a['h'] === 'h2' ) ? 'h2' : 'h1';

	/* No schedule, no register column -- and a two-column grid with one child
	   is a card half of which is empty. It stays one column in that case. */
	$h  = '<section class="aat-hero"' . aa_reg_dir_attr() . '>'
	    . '<div class="aat-hero__grid' . ( $first ? '' : ' aat-hero__grid--solo' ) . '">'
	    . '<div class="aat-hero__copy">';
	$h .= '<div class="aat-hero__kicker"><b>' . esc_html( $c['label'] ) . '</b><i></i><span>'
	    . esc_html( $c['kicker'] ) . '</span></div>';
	$h .= '<' . $H . ' class="aat-hero__h">' . esc_html( $c['title'] )
	    . ' <em>' . esc_html( $c['accent'] ) . '</em></' . $H . '>';
	$h .= '<p class="aat-hero__sub">' . esc_html( $c['sub'] ) . '</p>';

	/* THE STAT RAIL.
	   Four numbers, every one of them read off the schedule rather than written
	   down anywhere: how many certifications this track holds, when the next
	   class of any of them starts, the lowest price in the track, and the
	   spread of course lengths. Nothing here can go stale, and nothing here is
	   a claim -- they are the four things a buyer weighs before deciding to
	   read further.

	   It replaces the chip row, which said "2-4 days / Exam fee included /
	   Reschedule at no fee". The last two of those the line under the buttons
	   already says word for word, and the first is now a stat. */
	$stats = array();
	if ( $courses ) {
		$stats[] = array(
			(string) count( $courses ),
			aa_reg_t( 'certifications', 'certifications' ),
		);
	}
	if ( $first ) {
		$d_min = null; $d_max = null; $p_min = null; $p_cur = 'usd';
		foreach ( $courses as $slug => $course ) {
			if ( ! isset( $next[ $slug ] ) ) { continue; }
			$d     = max( 1, (int) $course['days'] );
			$d_min = ( $d_min === null ) ? $d : min( $d_min, $d );
			$d_max = ( $d_max === null ) ? $d : max( $d_max, $d );
			if ( $p_min === null || $course['price'] < $p_min ) {
				$p_min = $course['price'];
				$p_cur = $course['currency'];
			}
		}
		$stats[] = array(
			aa_reg_range( $first['start'], $first['end'], true ),
			aa_reg_t( 'next_start', 'next start' ),
		);
		if ( $p_min !== null ) {
			$stats[] = array(
				aa_reg_money( $p_min, $p_cur ),
				aa_reg_t( 'from_price', 'from' ),
			);
		}
		if ( $d_min !== null ) {
			$stats[] = array(
				( $d_min === $d_max ) ? (string) $d_min : $d_min . '–' . $d_max,
				aa_reg_t( 'days_l', 'days' ),
			);
		}
	}
	if ( $stats ) {
		$h .= '<div class="aat-hero__stats">';
		foreach ( $stats as $s ) {
			$h .= '<div><span class="aat-hero__statv">' . esc_html( $s[0] ) . '</span>'
			    . '<span class="aat-hero__statl">' . esc_html( $s[1] ) . '</span></div>';
		}
		$h .= '</div>';
	}

	/* ONE CTA, THE SAME ON EVERY TRACK. "Register" is what the page is for and
	   it says so in the same words on all five, rather than each track wording
	   its own invitation. It lands on the calendar, which is where every date
	   and the form that takes the money both are.

	   Where there is no schedule there is no #cohorts section to land on, so
	   the button changes rather than pointing at an anchor that is not there. */
	$h .= '<div class="aat-hero__btns">';
	if ( $next ) {
		$h .= '<a class="aat-cta" href="#cohorts">' . esc_html( aa_reg_t( 'register_now', 'Register' ) )
		    . ' <span class="aat-cta__arrow">&#10230;</span></a>';
	} else {
		$h .= '<a class="aat-cta" href="/contact/">' . esc_html( aa_reg_t( 'ask_dates', 'Ask about dates' ) )
		    . ' <span class="aat-cta__arrow">&#10230;</span></a>';
	}
	$h .= '<a class="aat-btn2" href="/assessments/cert-recommender/">'
	    . esc_html( aa_reg_t( 'find_cert', 'Find my certification' ) ) . '</a></div>';
	$h .= '<p class="aat-hero__foot">' . esc_html( $c['comp'] ) . '</p>';
	$h .= '</div>';

	/* THE REGISTRATION CARD, AND IT REGISTERS.
	   It used to show the next date for the chosen certification and a button
	   that sent you to the course page to pick it a second time -- one date,
	   and a round trip to buy it. It is a picker now, in the shape the home
	   page and the course pages already use: choose the certification, choose
	   from its next few dates, pay where you stand. Every option is a real
	   cohort at a real price, and the form posts a cohort id which the server
	   resolves -- so this sells any course on the track, including one with no
	   page of its own to send anyone to. */
	if ( $first ) {
		$h .= '<div class="aat-reg" data-aah>';
		$h .= '<label class="aat-field"><span>' . esc_html( aa_reg_t( 'certification', 'Certification' ) ) . '</span>'
		    . '<span class="aat-select"><select data-aah-course>';
		foreach ( $courses as $slug => $course ) {
			if ( ! isset( $next[ $slug ] ) ) { continue; }
			$h .= '<option value="' . esc_attr( $slug ) . '"' . ( $slug === $first_slug ? ' selected' : '' ) . '>'
			    . esc_html( $course['name'] ) . '</option>';
		}
		$h .= '</select></span></label>';

		/* Every course's dates are in the page and all but one are hidden --
		   the same contract the calendar keeps, for the same reason: the
		   schedule is what a crawler comes for, and it should not need a
		   change event to exist. */
		foreach ( $courses as $slug => $course ) {
			if ( empty( $ups[ $slug ] ) ) { continue; }
			$h .= '<div class="aat-dates" data-aah-dates="' . esc_attr( $slug ) . '"'
			    . ( $slug === $first_slug ? '' : ' hidden' ) . '>'
			    . '<p class="aat-dates__label">' . esc_html( aa_reg_t( 'pick_dates', 'Pick your dates' ) ) . '</p>'
			    . '<div class="aat-dates__list">';
			$j = 0;
			foreach ( $ups[ $slug ] as $n ) {
				if ( $j >= 6 ) { break; }
				$h .= '<button type="button" class="aat-dateopt' . ( $j === 0 ? ' is-on' : '' ) . '"'
				    . ' data-aah-pick="' . esc_attr( $n['id'] ) . '"'
				    . ' data-price="' . (int) $course['price'] . '"'
				    . ' aria-pressed="' . ( $j === 0 ? 'true' : 'false' ) . '">'
				    . '<b>' . esc_html( aa_reg_range( $n['start'], $n['end'] ) ) . '</b>'
				    . '<span>' . (int) $course['days'] . ' ' . esc_html( aa_reg_t( 'days_l', 'days' ) ) . '</span>'
				    . '</button>';
				$j++;
			}
			$h .= '</div></div>';
		}

		/* The endpoint and the nonce. The calendar below emits these too and
		   the call is single-shot, but a track whose courses have no schedule
		   renders no calendar -- and this card would then have a pay button
		   wired to nothing. */
		$h .= aa_reg_config_script();
		$h .= aa_reg_inline( $fc, $first, $fc['currency'], 'aahreg', true );
		$h .= '<p class="aat-reg__note">' . esc_html( aa_reg_incl( $fc ) ) . ' &middot; '
		    . esc_html( aa_reg_t( 'resched', 'reschedule at no fee' ) ) . '</p>';
		$h .= '</div>';
	}

	$h .= '</div></section>';

	/* The calendar. Which one is a setting -- see aa_reg_calendar_mode(). The
	   section wrapper and its id are the same either way, so the page's own
	   nav link lands in the same place whichever calendar is rendering. */
	if ( $next && aa_reg_calendar_mode() !== 'track' ) {
		$h .= '<section id="cohorts" class="aat-cohorts-sec">'
		    . do_shortcode( aa_reg_calendar_fallback() )
		    . '</section>';
	} elseif ( $next ) {
		$h .= '<section id="cohorts" class="aat-cohorts-sec">'
		    . aa_reg_track_calendar( array(
			'courses' => implode( ',', array_keys( $courses ) ),
			/* THREE MONTHS, NOT SIX. Every month is rendered into the HTML and
			   all but the first hidden, so the crawler sees the schedule without
			   running scripts -- but six months of a seven-course track is 1,386
			   bars and 283 cohorts, and the hosting provider noticed. Three is
			   still ~140 dates in the source, which is more than enough to be
			   the answer to "when does SPC run"; the rest are one click away. */
			'months'  => 3,
			'label'   => $c['label'],
		) )
		    . '</section>';
	}

	return $h;
}
add_shortcode( 'aa_training_category', 'aa_training_category_shortcode' );


/**
 * AA — SALARY INSIGHTS                                   [aa_salary_insights]
 * ============================================================================
 * WPCode -> PHP Snippet, Run Everywhere.
 *
 * Section 04 of the training design, as a shortcode that can stand on any page:
 * a band chart of what each credential's roles pay, and a column of career
 * paths. Picking a path redraws the chart as that ladder, in order, with the
 * step-by-step lift between credentials.
 *
 * WHY A SHORTCODE AND NOT PART OF aa_training_category().
 * The category shortcode is not changing -- that was the instruction, and it is
 * the right one: it sells courses and it works. This is a separate block that
 * goes wherever it is wanted, including on pages that have no course list at
 * all. One implementation, five parent pages, the hub, nothing rewritten.
 *
 * WHERE THE NUMBERS LIVE.
 * Not in the page, and not in this file beyond a fallback. They are in the
 * option `aa_salary_data`, so the figures can be revised without touching code
 * and -- this is the part that matters here -- without anyone having to open
 * WPCode and press Update to make the change take effect. Salary figures get
 * revised yearly by a human; course code does not.
 *
 * The defaults below are what /training/ has been publishing. They are carried
 * over deliberately rather than corrected, because that was the call. The
 * sources line is a required part of the block, not decoration -- a figure with
 * no attribution is the thing we are trying not to publish.
 */

/**
 * The dataset. Option first, fallback second, so the block renders on a site
 * where the option was never written.
 *
 * medians and ranges are thousands of USD. `extra` carries codes that appear in
 * a path ladder but have no band of their own -- without it a path step would
 * render with an empty figure, which looks like a bug rather than a gap.
 */
function aa_salary_data() {
	$stored = get_option( 'aa_salary_data' );
	if ( is_array( $stored ) && ! empty( $stored['bands'] ) ) {
		return $stored;
	}

	return array(
		'bands' => array(
			array( 'code' => 'SPC',  'median' => 195, 'lo' => 165, 'hi' => 240 ),
			/* From the Advanced SAFe page, which carried a figure the shared set
			   did not. Same provenance as the rest -- and the same caveat. */
			array( 'code' => 'ASPC', 'median' => 210, 'lo' => 180, 'hi' => 280 ),
			array( 'code' => 'ARCH', 'median' => 185, 'lo' => 160, 'hi' => 240 ),
			array( 'code' => 'RTE',  'median' => 172, 'lo' => 135, 'hi' => 260 ),
			array( 'code' => 'APM',  'median' => 170, 'lo' => 140, 'hi' => 220 ),
			array( 'code' => 'LPM',  'median' => 165, 'lo' => 145, 'hi' => 210 ),
			array( 'code' => 'SDP',  'median' => 140, 'lo' => 115, 'hi' => 175 ),
			array( 'code' => 'POPM', 'median' => 135, 'lo' => 110, 'hi' => 170 ),
			array( 'code' => 'SSM',  'median' => 110, 'lo' =>  92, 'hi' => 135 ),
		),
		/* Codes used by a path ladder that have no band row of their own. */
		'extra' => array(
			'SASM'   => 130,
			'AINF'   => 140,
			'AINCA'  => 180,
			'AINORG' => 280,
		),
		'paths' => array(
			array(
				'kicker' => 'Team & delivery track',
				'title'  => 'From Scrum Master to',
				'accent' => 'portfolio leader.',
				'blurb'  => 'Start on the team, grow into ART leadership, then move into enterprise portfolio management.',
				'steps'  => array( 'SSM', 'SASM', 'RTE', 'LPM', 'SPC' ),
			),
			/* The two journeys the Advanced SAFe page already published. They
			   surface only on a page whose codes cover them -- see the filter
			   in the shortcode. */
			array(
				'kicker' => 'Change agent track',
				'title'  => 'From RTE to',
				'accent' => 'SPC.',
				'blurb'  => 'Progress from Release Train facilitation to enterprise-transformation consultancy.',
				'steps'  => array( 'RTE', 'SPC', 'ASPC' ),
			),
			array(
				'kicker' => 'Portfolio track',
				'title'  => 'From APM to',
				'accent' => 'LPM.',
				'blurb'  => 'Advance from product-level strategy to portfolio-level Lean investment governance.',
				'steps'  => array( 'APM', 'LPM' ),
			),
			array(
				'kicker' => 'Product track',
				'title'  => 'From PO to',
				'accent' => 'product leadership.',
				'blurb'  => 'Move from Product Owner to Agile Product Manager, then into portfolio-level product strategy.',
				'steps'  => array( 'POPM', 'APM', 'LPM' ),
			),
			array(
				'kicker' => 'AI-Native track · New 2026',
				'title'  => 'From AI-curious to',
				'accent' => 'AI-Native executive.',
				'blurb'  => 'Foundational AI literacy through to leading an AI-Native enterprise. No coding required.',
				'steps'  => array( 'AINF', 'AINCA', 'AINORG' ),
			),
			/* AI-GUIDED ARCHITECTURE. The destination here is a role, not a
			   credential we sell -- which is why `dest` exists and why it
			   carries no salary figure. See the note on `dest` below. */
			array(
				'kicker' => 'AI-guided architecture · Emerging',
				'title'  => 'From the train to',
				'accent' => 'AI-guided architecture.',
				'blurb'  => 'Some RTEs and team coaches are moving toward architecting value with AI in the loop. '
				          . 'It is one route on from the train, not the only one, and not a replacement for the RTE role.',
				'steps'  => array( 'RTE', 'AINCA' ),
				/* OUR VIEW, IN OUR VOICE. An earlier draft credited this reading
				   to Scaled Agile. It came from a partner briefing in which the
				   speaker was explicit that they did not want it taken to market
				   as a definitive position -- so attributing it to them would put
				   words in their mouth they had just declined to say, which is
				   the one representation the courseware licence forbids.
				   Saying it as ours is both accurate and permitted. */
				'dest'   => array(
					'label' => 'AI-Native Value Architect',
					'note'  => 'An emerging role, not a certification we offer, and not where every RTE '
					         . 'or Scrum Master is headed. It is the direction we see some taking as AI '
					         . 'moves into how value gets designed.',
				),
			),
		),
		'sources' => 'Sources: Scaled Agile, LinkedIn Salary, Payscale · 2026.',
	);
}

/**
 * Seven colours, assigned by position. A track with a different number of
 * credentials needs no CSS change -- which is the only reason the palette is
 * here in PHP rather than as eight hand-written classes.
 */
function aa_salary_palette() {
	return array( '#0E8074', '#D34B2A', '#B3702A', '#3D6B8E', '#7A5A96', '#2F8F5B', '#9A4B5E' );
}

/**
 * The full name behind a code, taken from the course table so this block and
 * the course pages can never disagree about what "APM" stands for. Falls back
 * to the code, because a path may legitimately reference a credential that has
 * no course row yet.
 */
function aa_salary_label( $code ) {
	if ( ! function_exists( 'aa_reg_courses' ) ) {
		return $code;
	}
	foreach ( aa_reg_courses() as $course ) {
		if ( isset( $course['code'] ) && $course['code'] === $code ) {
			/* "SAFe® Release Train Engineer Certification" -> the useful middle.
			   The badge already says RTE; repeating it in the label is noise. */
			$name = isset( $course['name'] ) ? $course['name'] : $code;
			$name = preg_replace( '/^SAFe®?\s*/u', '', $name );
			$name = preg_replace( '/\s*Certification$/u', '', $name );
			return trim( $name );
		}
	}
	return $code;
}

/**
 * The course page for a code, so a band or a step chip is a way in rather than
 * a dead end. Empty when the credential has no page -- the markup drops the
 * link rather than pointing at a 404.
 */
function aa_salary_url( $code ) {
	if ( ! function_exists( 'aa_reg_courses' ) ) {
		return '';
	}
	foreach ( aa_reg_courses() as $course ) {
		if ( isset( $course['code'] ) && $course['code'] === $code && ! empty( $course['url'] ) ) {
			return $course['url'];
		}
	}
	return '';
}

/**
 * [aa_salary_insights]
 *
 *   paths="0"    chart only, no path column. For a narrow page.
 *   codes=""     restrict the bands to these codes, comma separated, so a
 *                track page can show only its own credentials.
 *   heading=""   override the H2. Empty renders the default.
 *
 * Everything is in the server's HTML: every band, every figure, every path.
 * The script only moves what is already there. With scripts off this is still
 * a complete, readable salary table -- which is the version a crawler and an
 * assistant see, and the reason the figures are worth publishing at all.
 */
function aa_salary_insights_shortcode( $atts ) {
	$a = shortcode_atts( array(
		'paths'   => '1',
		'codes'   => '',
		'heading' => '',
		'num'     => '',
	), $atts, 'aa_salary_insights' );

	$data = aa_salary_data();
	if ( empty( $data['bands'] ) ) {
		return '';
	}

	$bands = $data['bands'];

	/* A track page wants its own credentials, in the dataset's order. */
	if ( $a['codes'] !== '' ) {
		$want  = array_map( 'trim', explode( ',', strtoupper( $a['codes'] ) ) );
		$bands = array_values( array_filter( $bands, function ( $b ) use ( $want ) {
			return in_array( $b['code'], $want, true );
		} ) );
		if ( ! $bands ) {
			return '';
		}
	}

	$pal   = aa_salary_palette();
	$extra = isset( $data['extra'] ) ? (array) $data['extra'] : array();
	$paths = ( $a['paths'] === '1' && ! empty( $data['paths'] ) ) ? $data['paths'] : array();

	/* A TRACK PAGE SHOWS ITS OWN JOURNEYS.
	   With codes= set, a path survives only if every step it names is on the
	   page. Otherwise the Advanced SAFe page would offer a ladder ending in a
	   credential whose bar is not in the chart, and clicking it would redraw
	   around a row that is not there. */
	if ( $a['codes'] !== '' && $paths ) {
		$have = array();
		foreach ( $bands as $b ) { $have[ $b['code'] ] = true; }
		$paths = array_values( array_filter( $paths, function ( $pp ) use ( $have ) {
			foreach ( (array) $pp['steps'] as $st ) {
				if ( empty( $have[ $st ] ) ) { return false; }
			}
			return true;
		} ) );
	}

	/* The chart's scale. Rounded up to the next 25 so the axis is a round
	   number and the widest bar does not touch the right edge. */
	$hi = 0;
	foreach ( $bands as $b ) {
		$hi = max( $hi, (int) $b['hi'] );
	}
	foreach ( $extra as $v ) {
		$hi = max( $hi, (int) $v );
	}
	$scale = max( 25, (int) ( ceil( $hi / 25 ) * 25 ) );

	/* Colour per code, by position, for bands and step chips alike. */
	$colour = array();
	$i      = 0;
	foreach ( $bands as $b ) {
		$colour[ $b['code'] ] = $pal[ $i % count( $pal ) ];
		$i++;
	}
	foreach ( array_keys( $extra ) as $code ) {
		if ( ! isset( $colour[ $code ] ) ) {
			$colour[ $code ] = $pal[ $i % count( $pal ) ];
			$i++;
		}
	}

	$pct = function ( $v ) use ( $scale ) {
		return round( ( (float) $v / $scale ) * 100, 2 );
	};
	$money = function ( $k ) {
		return '$' . number_format( (int) $k ) . 'K';
	};

	$h  = '<section class="aas" data-aas>';
	$h .= '<div class="aas__head">';
	$h .= '<span class="aas__kicker">'
	    . ( $a['num'] !== '' ? esc_html( $a['num'] ) . ' &middot; ' : '' ) . 'Career and pay</span>';
	$h .= '<h2 class="aas__h2">' . ( $a['heading'] !== ''
		? esc_html( $a['heading'] )
		: 'Pick a path. <em>Watch what it pays.</em>' ) . '</h2>';
	$h .= '<p class="aas__lede">Every credential&rsquo;s median and range. Choose a path and the chart '
	    . 'redraws as that ladder, in order, with the lift between each step.</p>';
	$h .= '</div>';

	$h .= '<div class="aas__grid">';

	/* ---- the chart ------------------------------------------------------ */
	$h .= '<div class="aas__chart">';
	$h .= '<div class="aas__bandhead" data-aas-head>'
	    . '<b data-aas-title>All credentials</b>'
	    . '<span data-aas-sub>' . count( $bands ) . ' roles &middot; median and range</span>'
	    . '<button type="button" class="aas__reset" data-aas-reset hidden>Show all</button>'
	    . '</div>';

	$h .= '<div class="aas__bands aas__bands--all" data-aas-bands>';
	foreach ( $bands as $n => $b ) {
		$c = $colour[ $b['code'] ];
		$h .= '<div class="aas__band" data-aas-band="' . esc_attr( $b['code'] ) . '"'
		    . ' data-median="' . esc_attr( $b['median'] ) . '"'
		    . ' data-lo="' . esc_attr( $b['lo'] ) . '"'
		    . ' data-hi="' . esc_attr( $b['hi'] ) . '">';
		$h .= '<span class="aas__step" data-aas-step>' . ( $n + 1 ) . '</span>';
		$h .= '<span class="aas__badge" style="background:' . esc_attr( $c ) . '1F;color:'
		    . esc_attr( $c ) . '">' . esc_html( $b['code'] ) . '</span>';
		$h .= '<span class="aas__track">'
		    . '<span class="aas__bar" data-aas-bar style="left:' . $pct( $b['lo'] ) . '%;width:'
		    . ( $pct( $b['hi'] ) - $pct( $b['lo'] ) ) . '%;background:' . esc_attr( $c ) . '"></span>'
		    . '<span class="aas__mark" data-aas-mark style="left:' . $pct( $b['median'] ) . '%"></span>'
		    . '</span>';
		$h .= '<span class="aas__fig">'
		    . '<b class="aas__median" data-aas-median>' . esc_html( $money( $b['median'] ) ) . '</b>'
		    . '<span class="aas__sub" data-aas-subfig>' . esc_html( $money( $b['lo'] ) . '–' . $money( $b['hi'] ) ) . '</span>'
		    . '</span>';
		$h .= '</div>';
	}
	$h .= '</div>';

	/* The disclaimer is not optional and not small print. A median is market
	   data about a role; it is not what this course pays you. */
	$h .= '<p class="aas__note">' . esc_html( isset( $data['sources'] ) ? $data['sources'] : '' )
	    . ' Median total compensation is role-based market data, not a guaranteed course outcome. '
	    . 'Course fees are separate.</p>';
	$h .= '</div>';

	/* ---- the paths ------------------------------------------------------ */
	if ( $paths ) {
		/* PRE-RESOLVE, then render twice: once into the <select>, once into the
		   panels. Building the ladders first means a path with fewer than two
		   priced steps never reaches either, so the dropdown cannot offer a
		   choice that has no panel behind it. */
		$ready = array();
		foreach ( $paths as $p => $path ) {
			$steps = array();
			foreach ( (array) $path['steps'] as $code ) {
				$med = null;
				foreach ( $bands as $b ) {
					if ( $b['code'] === $code ) { $med = (int) $b['median']; break; }
				}
				if ( $med === null && isset( $extra[ $code ] ) ) { $med = (int) $extra[ $code ]; }
				if ( $med === null ) { continue; }
				$steps[] = array( 'code' => $code, 'median' => $med );
			}
			if ( count( $steps ) < 2 ) { continue; }

			$first = $steps[0]['median'];
			$last  = $steps[ count( $steps ) - 1 ]['median'];
			$ready[ $p ] = array(
				'path'  => $path,
				'steps' => $steps,
				'lift'  => $first > 0 ? (int) round( ( ( $last - $first ) / $first ) * 100 ) : 0,
				'dest'  => ! empty( $path['dest'] ) ? $path['dest'] : null,
			);
		}
	}

	if ( ! empty( $ready ) ) {
		$h .= '<div class="aas__paths">';

		/* A DROPDOWN RATHER THAN A COLUMN OF CARDS.
		   Only one path is ever active, so four cards spent a whole column
		   showing three states nobody had chosen. The select states the choice
		   in one line and gives the chart the room instead. Every panel is
		   still in the HTML with all but the chosen one hidden, so a crawler
		   reads all of them. */
		$h .= '<label class="aas__field">'
		    . '<span class="aas__kicker">Career path</span>'
		    . '<span class="aas__select"><select data-aas-select>'
		    . '<option value="">All credentials</option>';
		foreach ( $ready as $p => $R ) {
			$h .= '<option value="' . esc_attr( $p ) . '">'
			    . esc_html( trim( $R['path']['title'] . ' ' . $R['path']['accent'] ) ) . '</option>';
		}
		$h .= '</select></span></label>';

		foreach ( $ready as $p => $R ) {
			$path = $R['path'];
			$h .= '<div class="aas__panel" data-aas-panel="' . esc_attr( $p ) . '" hidden>';
			$h .= '<span class="aas__path-kicker">' . esc_html( $path['kicker'] ) . '</span>';
			$h .= '<span class="aas__path-p">' . esc_html( $path['blurb'] ) . '</span>';

			$h .= '<span class="aas__steps">';
			foreach ( $R['steps'] as $s ) {
				$c  = isset( $colour[ $s['code'] ] ) ? $colour[ $s['code'] ] : '#0E8074';
				$h .= '<span class="aas__stepwrap">';
				$h .= '<span class="aas__chip">'
				    . '<span class="aas__dot" style="background:' . esc_attr( $c ) . '"></span>'
				    . esc_html( $s['code'] )
				    . ' <em>' . esc_html( $money( $s['median'] ) ) . '</em></span>';
				$h .= '<span class="aas__arrow" aria-hidden="true">&rarr;</span>';
				$h .= '</span>';
			}

			/* A DESTINATION ROLE, not a credential. It gets a chip so the ladder
			   ends somewhere, and no money, because no salary source exists for
			   a title this new. An invented figure here would be the worst one
			   on the page: newest role, thinnest evidence, most prominent spot. */
			if ( $R['dest'] ) {
				$h .= '<span class="aas__stepwrap">'
				    . '<span class="aas__chip aas__chip--dest">'
				    . '<span class="aas__dot aas__dot--open"></span>'
				    . esc_html( $R['dest']['label'] ) . '</span>'
				    . '<span class="aas__arrow" aria-hidden="true">&rarr;</span>'
				    . '</span>';
			}
			$h .= '</span>';

			/* The lift is suppressed on a path whose destination has no figure.
			   Quoting the climb between the two credentials before it puts a
			   small number under a panel whose whole argument is the step that
			   number does not cover. */
			if ( $R['lift'] > 0 && ! $R['dest'] ) {
				$h .= '<span class="aas__lift">+' . $R['lift'] . '% from first step to last</span>';
			}
			if ( $R['dest'] && ! empty( $R['dest']['note'] ) ) {
				$h .= '<span class="aas__destnote">' . esc_html( $R['dest']['note'] ) . '</span>';
			}

			$h .= '<script type="application/json" data-aas-ladder="' . esc_attr( $p ) . '">'
			    . wp_json_encode( array(
					'label' => trim( $path['title'] . ' ' . $path['accent'] ),
					'steps' => $R['steps'],
				) ) . '</script>';
			$h .= '</div>';
		}
		$h .= '</div>';
	}

	$h .= '</div>';

	/* The scale, so the script can recompute a bar's geometry without having to
	   know the dataset. Two integers, not a copy of the content. */
	$h .= '<span hidden data-aas-scale="' . esc_attr( $scale ) . '"></span>';
	$h .= '</section>';

	return $h;
}
add_shortcode( 'aa_salary_insights', 'aa_salary_insights_shortcode' );

/* ============================================================================
   AA — COHORT TIMELINE BOARD                                [aa_track_board]
   ----------------------------------------------------------------------------
   One lane per certification, one bar per cohort, weeks running left to right.
   BAR WIDTH IS DAYS OUT OF THE OFFICE -- that is the argument of this view and
   the reason it beats a list: a four-day SPC and a one-day micro-credential do
   not look alike.

   IT DOES NOT REPLACE THE CALENDAR. The board answers "when can I fit this in",
   which is what someone holding their own calendar is asking. The month grid
   answers "what is on in November". Landing pages carry both.

   NO LIST FALLBACK, ANYWHERE. The month grid used to collapse to a flat date
   list on a phone, and with our cadence -- a start every Monday, Wednesday and
   Thursday -- that was a wall of near-identical rows. This scrolls sideways
   with the certification names pinned instead, and keeps its shape at any
   width.

   Rendered entirely on the server. Every bar is a real link to that cohort's
   enrolment, so with scripts off it is still a working index of the quarter.
   ========================================================================== */

function aa_reg_board( $atts ) {
	$a = shortcode_atts( array(
		'courses' => 'all',
		'months'  => 3,
		/* Dates per course. The board stays readable only while the bar count
		   stays low -- the same reasoning as the month grid's cap. */
		'per'     => 3,
	), $atts, 'aa_track_board' );

	$slugs = ( strtolower( trim( (string) $a['courses'] ) ) === 'all' )
		? aa_reg_all_course_slugs()
		: array_filter( array_map( 'trim', explode( ',', (string) $a['courses'] ) ) );
	if ( ! $slugs ) { return ''; }

	$per    = max( 0, (int) $a['per'] );
	$months = max( 1, min( 6, (int) $a['months'] ) );

	/* One day in pixels, and the height of one sub-lane. */
	$PXD   = 27;
	$LANEH = 34;
	$LABEL = 186;

	$tz    = new DateTimeZone( 'America/New_York' );
	$today = new DateTime( 'now', $tz );
	$from  = new DateTime( $today->format( 'Y-m-01' ), $tz );
	$to    = ( clone $from )->modify( '+' . $months . ' months' )->modify( '-1 day' );
	$toymd = $to->format( 'Y-m-d' );

	$off = function ( $ymd ) use ( $from, $tz ) {
		$d = DateTime::createFromFormat( 'Y-m-d', $ymd, $tz );
		if ( ! $d ) { return null; }
		$d->setTime( 0, 0 );
		$f = clone $from; $f->setTime( 0, 0 );
		return (int) $f->diff( $d )->format( '%r%a' );
	};

	$total = $off( $toymd ) + 1;
	if ( $total < 1 ) { return ''; }
	$boardw = $total * $PXD;

	/* The same seven colours the month grid uses, assigned by course order, so
	   a code is the same colour wherever it appears on the site. */
	$pal = array(
		array( '#0E8074', '#F4FAF9', '#D6EBE8' ),
		array( '#101C33', '#F5F6F8', '#DDE1E8' ),
		array( '#D34B2A', '#FDF5F2', '#F2DAD1' ),
		array( '#B3702A', '#FCF7F0', '#EEE0CC' ),
		array( '#3E6B5C', '#F4F8F6', '#D9E5DF' ),
		array( '#4A5E86', '#F5F7FB', '#DCE2EE' ),
		array( '#7A5B8F', '#F8F5FA', '#E5DCEC' ),
	);

	$lanes = array();
	$i     = 0;
	$count = 0;

	foreach ( $slugs as $slug ) {
		$course = aa_reg_course( $slug );
		if ( ! $course ) { continue; }
		$code = isset( $course['code'] ) ? $course['code'] : strtoupper( $slug );
		if ( isset( $lanes[ $code ] ) ) { continue; }
		$c3 = $pal[ $i % count( $pal ) ];
		$i++;

		$taken = 0;
		$rows  = array();
		foreach ( aa_reg_upcoming( $slug, $course ) as $c ) {
			if ( $c['start'] > $toymd ) { break; }
			if ( $per && $taken >= $per ) { break; }
			$taken++;
			$rows[] = $c;
			$count++;
		}
		if ( ! $rows ) { continue; }

		$lanes[ $code ] = array(
			'name'  => isset( $course['name'] ) ? $course['name'] : $code,
			'label' => aa_reg_short_name( $course, $code ),
			'url'   => isset( $course['url'] ) ? $course['url'] : '',
			'page'  => aa_reg_page_exists( isset( $course['url'] ) ? $course['url'] : '' ),
			'color' => $c3[0], 'tint' => $c3[1], 'bd' => $c3[2],
			'rows'  => $rows,
			'first' => $rows[0]['start'],
		);
	}
	if ( ! $lanes ) { return ''; }

	/* Soonest first. A lane whose next date is in November has nothing to say
	   to someone looking at September, so it belongs further down. */
	uasort( $lanes, function ( $x, $y ) { return strcmp( $x['first'], $y['first'] ); } );

	$permonth = array();
	foreach ( $lanes as $L ) {
		foreach ( $L['rows'] as $c ) {
			$k = substr( $c['start'], 0, 7 );
			$permonth[ $k ] = isset( $permonth[ $k ] ) ? $permonth[ $k ] + 1 : 1;
		}
	}

	$h  = '<div class="aab" data-aab>';
	$h .= '<div class="aab__head">'
	    . '<span class="aab__kicker">' . esc_html( aa_reg_t( 'weeks_ltr', 'Weeks run left to right' ) ) . '</span>'
	    . '<span class="aab__key"><i class="aab__keybar"></i>' . esc_html( aa_reg_t( 'one_cohort', 'one cohort' ) ) . '</span>'
	    . '<span class="aab__key"><i class="aab__keytoday"></i>' . esc_html( aa_reg_t( 'today', 'today' ) ) . '</span>'
	    . '<span class="aab__hint">' . esc_html( aa_reg_t( 'scroll', 'scroll' ) ) . ' &#8596;</span>'
	    . '</div>';

	$h .= '<div class="aab__scroll"><div class="aab__in" style="width:' . ( $LABEL + $boardw ) . 'px">';

	/* Month bands across the top. */
	$h .= '<div class="aab__lane aab__lane--head">';
	$h .= '<div class="aab__label aab__label--head">' . esc_html( aa_reg_t( 'certification', 'Certification' ) ) . '</div>';
	$h .= '<div class="aab__track" style="width:' . $boardw . 'px">';
	$cur = clone $from;
	while ( $cur <= $to ) {
		$mk = $cur->format( 'Y-m' );
		$s  = max( 0, $off( $cur->format( 'Y-m-01' ) ) );
		$e  = min( $total, $off( ( clone $cur )->modify( 'last day of this month' )->format( 'Y-m-d' ) ) + 1 );
		$n  = isset( $permonth[ $mk ] ) ? (int) $permonth[ $mk ] : 0;
		$h .= '<span class="aab__band" style="left:' . ( $s * $PXD ) . 'px;width:' . ( ( $e - $s ) * $PXD ) . 'px">'
		    . esc_html( $cur->format( 'M ' ) . "'" . $cur->format( 'y' ) )
		    . '<span>' . $n . ' ' . esc_html( $n === 1 ? aa_reg_t( 'date', 'date' ) : aa_reg_t( 'dates', 'dates' ) ) . '</span></span>';
		$cur->modify( 'first day of next month' );
	}
	$h .= '</div></div>';

	foreach ( $lanes as $code => $L ) {
		$subend = array();
		$bars   = '';

		foreach ( $L['rows'] as $c ) {
			$a0 = $off( $c['start'] );
			$b0 = $off( $c['end'] );
			if ( $a0 === null || $b0 === null || $b0 < 0 ) { continue; }

			/* A one-day credential is 27px wide, which cannot hold its own code.
			   The bar widens to fit the label -- and the packing below uses that
			   widened footprint rather than the real end date, or a short bar
			   overlaps the next one's text. */
			$w = max( ( $b0 - $a0 + 1 ) * $PXD - 5, strlen( $code ) * 7.2 + 18 );

			$sub = -1;
			foreach ( $subend as $k => $endpx ) {
				if ( $endpx < $a0 - 0.5 ) { $sub = $k; break; }
			}
			if ( $sub < 0 ) { $sub = count( $subend ); }
			$subend[ $sub ] = $a0 + $w / $PXD;

			$rng = aa_reg_range( $c['start'], $c['end'] );
			$url = $L['url'] . ( strpos( $L['url'], '?' ) === false ? '?' : '&' )
			     . 'cohort=' . rawurlencode( $c['id'] ) . '#enroll';

			$style = 'left:' . ( $a0 * $PXD + 2 ) . 'px;width:' . round( $w ) . 'px;top:'
			       . ( $sub * $LANEH + 4 ) . 'px;background:' . esc_attr( $L['tint'] )
			       . ';border:1px solid ' . esc_attr( $L['bd'] ) . ';color:' . esc_attr( $L['color'] );

			/* A course with no page of its own -- Large Solution sells from the
			   schedule -- gets a span rather than a link to a 404. */
			$tag  = $L['page'] ? 'a' : 'span';
			$bars .= '<' . $tag . ' class="aab__bar' . ( $w < 150 ? ' aab__bar--tight' : '' ) . '"'
			      . ( $L['page'] ? ' href="' . esc_url( $url ) . '"' : '' )
			      . ' style="' . $style . '"'
			      . ' aria-label="' . esc_attr( $L['name'] . ' · ' . $rng ) . '">'
			      . '<b>' . esc_html( $code ) . '</b><i>' . esc_html( $rng ) . '</i>'
			      . '</' . $tag . '>';
		}
		if ( $bars === '' ) { continue; }

		$h .= '<div class="aab__lane" style="height:' . ( max( 1, count( $subend ) ) * $LANEH ) . 'px">';
		$h .= '<div class="aab__label">'
		    . '<span class="aab__code" style="background:' . esc_attr( $L['tint'] ) . ';color:'
		    . esc_attr( $L['color'] ) . '">' . esc_html( $code ) . '</span>'
		    . '<span>' . esc_html( $L['label'] ) . '</span></div>';
		$h .= '<div class="aab__track" style="width:' . $boardw . 'px;background-image:'
		    . 'repeating-linear-gradient(90deg,#EFEBE2 0 1px,transparent 1px ' . ( 7 * $PXD ) . 'px)">'
		    . $bars . '</div></div>';
	}

	/* Today, drawn once across the whole board rather than once per lane. */
	$t = $off( $today->format( 'Y-m-d' ) );
	if ( $t !== null && $t >= 0 && $t < $total ) {
		$h .= '<span class="aab__today" style="left:' . ( $LABEL + $t * $PXD + 1 ) . 'px"></span>';
	}

	$h .= '</div></div>';

	$h .= '<div class="aab__foot"><span>'
	    . sprintf(
			esc_html( aa_reg_t( 'board_foot', '%1$d dates across %2$d certifications. Bar width is days out of the office.' ) ),
			(int) $count, count( $lanes ) )
	    . '</span></div>';

	$h .= '</div>';

	return $h;
}
add_shortcode( 'aa_track_board', 'aa_reg_board' );

/* ============================================================================
   AA — CERTIFICATIONS                                     [aa_track_courses]
   ----------------------------------------------------------------------------
   A track's credentials as cards: the first as a lead panel, the rest two-up.
   Code, name, what it covers, how long, how much, and when it next runs.

   THIS IS THE SECTION THAT SELLS. Price, duration, description and the link to
   the course page exist nowhere else on the page -- the calendar has dates, the
   salary block has pay, and neither of them tells you what the thing is or what
   it costs. So this goes first: a grid of dates means nothing until you have
   picked a credential.

   It replaces a hand-written card grid, and its own inline <style>, on each of
   the five track pages. One block, six pages, one place to change.

   Everything comes from aa_reg_courses() and the track's child pages -- the
   same source the calendar reads -- so a card and a bar cannot disagree about
   when SPC next runs. The salary chip and the next-date the old cards carried
   are gone from here: pay belongs to the salary block, and the full schedule
   belongs to the calendar. Only the next date survives, because "when does this
   start" is part of deciding, not part of browsing.
   ========================================================================== */

function aa_reg_course_card( $slug, $lead = false, $wide = false ) {
	$course = aa_reg_course( $slug );
	if ( ! $course ) { return ''; }

	$code  = isset( $course['code'] ) ? $course['code'] : strtoupper( $slug );
	$url   = isset( $course['url'] ) ? $course['url'] : '';
	$page  = aa_reg_page_exists( $url );
	$days  = max( 1, (int) $course['days'] );
	$blurb = function_exists( 'aa_reg_blurb' ) ? aa_reg_blurb( $course, $lead ? 200 : 130 ) : '';

	/* The next published date, from the same generator the calendar uses. */
	$next = '';
	$href = $url;
	foreach ( aa_reg_upcoming( $slug, $course ) as $c ) {
		$next = aa_reg_range( $c['start'], $c['end'], true );
		$href = $url . ( strpos( $url, '?' ) === false ? '?' : '&' )
		      . 'cohort=' . rawurlencode( $c['id'] ) . '#enroll';
		break;
	}

	$cls = 'aac__card' . ( $lead ? ' aac__card--lead' : '' ) . ( $wide ? ' aac__card--wide' : '' );
	$tag = $page ? 'a' : 'div';

	$h  = '<' . $tag . ' class="' . $cls . '"' . ( $page ? ' href="' . esc_url( $href ) . '"' : '' ) . '>';

	$h .= '<div class="aac__top">';
	$h .= '<span class="aac__code">' . esc_html( $code ) . '</span>';
	if ( $lead ) {
		$h .= '<span class="aac__lede">Start here</span>';
	}
	$h .= '<span class="aac__facts">'
	    . '<span class="aac__days">' . (int) $days . ' ' . esc_html( $days === 1 ? 'day' : 'days' ) . '</span>'
	    . '<span class="aac__price">' . esc_html( aa_reg_money( $course['price'], $course['currency'] ) ) . '</span>'
	    . '</span>';
	$h .= '</div>';

	$h .= '<h3 class="aac__h">' . esc_html( aa_reg_short_name( $course, $code ) ) . '</h3>';
	if ( $blurb !== '' ) {
		$h .= '<p class="aac__p">' . esc_html( $blurb ) . '</p>';
	}

	$h .= '<div class="aac__foot">';
	$h .= '<span class="aac__next">' . ( $next !== ''
		? esc_html( 'Next ' . $next )
		: esc_html( 'Dates on request' ) ) . '</span>';
	$h .= '<span class="aac__go" aria-hidden="true">&#10230;</span>';
	$h .= '</div>';

	$h .= '</' . $tag . '>';
	return $h;
}

/**
 * [aa_track_courses category="adv-safe"]
 *
 * category   which track. Defaults to the page's own, so a track page needs
 *            no attribute at all.
 * heading    override the H2.
 */
function aa_reg_track_courses( $atts ) {
	$a = shortcode_atts( array(
		'category' => '',
		'heading'  => '',
		'kicker'   => 'Certifications',
		'num'      => '',
	), $atts, 'aa_track_courses' );

	$cat = $a['category'];
	if ( $cat === '' ) {
		/* The page's own slug, so the shortcode can be dropped on a track page
		   bare and still know which track it is standing in. */
		$obj = function_exists( 'get_queried_object' ) ? get_queried_object() : null;
		$cat = ( $obj && isset( $obj->post_name ) ) ? $obj->post_name : '';
	}
	if ( $cat === '' ) { return ''; }

	/* Filtered to real courses before counting, or the lead/wide arithmetic is
	   done against pages that will not render. */
	$slugs = aa_reg_track_course_slugs( $cat );
	if ( ! $slugs ) { return ''; }

	$lead = array_shift( $slugs );
	$n    = count( $slugs );

	$h  = '<section class="aac" id="certifications">';
	$h .= '<div class="aac__head">';
	$h .= '<span class="aac__kicker">'
	    . ( $a['num'] !== '' ? esc_html( $a['num'] ) . ' &middot; ' : '' )
	    . esc_html( $a['kicker'] ) . '</span>';
	$h .= '<h2 class="aac__h2">' . ( $a['heading'] !== ''
		? esc_html( $a['heading'] )
		: 'Every credential in this track, <em>one at a time.</em>' ) . '</h2>';
	$h .= '<p class="aac__sub">' . ( $n + 1 ) . ' certifications. Each card links to the course '
	    . 'and its next published date. Exam voucher included.</p>';
	$h .= '</div>';

	$h .= '<div class="aac__grid">';
	$h .= aa_reg_course_card( $lead, true );

	/* An odd number left over would leave a hole in a two-up grid, so the first
	   of them takes the full width instead. */
	$wide = ( $n % 2 === 1 );
	foreach ( $slugs as $i => $slug ) {
		$h .= aa_reg_course_card( $slug, false, ( $wide && $i === 0 ) );
	}
	$h .= '</div>';

	$h .= '</section>';
	return $h;
}
add_shortcode( 'aa_track_courses', 'aa_reg_track_courses' );

/* ============================================================================
   AA — TRACK ACCORDION                                  [aa_track_accordion]
   ----------------------------------------------------------------------------
   Section 01 of the hub. Five tracks side by side; four collapse to vertical
   spines and the open one takes the rest of the width.

   WHY AN ACCORDION AND NOT FIVE STACKED LISTS. Twenty-five certifications laid
   out flat is a page nobody reads to the bottom -- and the brief that produced
   this design rejected list-shaped layouts three times for exactly that. The
   spines keep all five tracks on one screen, so the shape of the catalogue is
   visible before anything is opened, and choosing one costs a click rather
   than a scroll.

   Every track's cards are in the HTML whether or not its panel is open -- the
   closed ones are hidden with CSS, not omitted. So a crawler and an assistant
   read all twenty-five credentials, their prices and their next dates, which
   is the whole SEO payload of this page. Opening a panel moves space; it does
   not fetch anything.

   Cards come from aa_reg_course_card(), the same function the track pages use,
   so a credential looks identical wherever it appears.
   ========================================================================== */

/**
 * A TRACK'S REAL COURSE SLUGS.
 *
 * aa_training_courses() falls back to the QUERIED page's children when a track
 * has no hand list -- correct on a track page, wrong on the hub, where the
 * queried page is /training/ and its children are the five tracks themselves.
 * That is why safe-industry and safe-found rendered as empty and the accordion
 * showed three tracks instead of five.
 *
 * Merging the hand list with the track's own children fixes both directions: a
 * hand-listed course that lives outside its track survives, and a track with no
 * hand list gets its children. Filtering through aa_reg_course() then drops
 * anything that is not a course -- including those five track pages.
 */
function aa_reg_track_course_slugs( $cat ) {
	$all = array_merge( (array) aa_training_courses( $cat ), aa_reg_track_children( $cat ) );
	$all = array_values( array_unique( $all ) );
	return array_values( array_filter( $all, function ( $s ) { return (bool) aa_reg_course( $s ); } ) );
}

function aa_reg_track_accordion( $atts ) {
	$a = shortcode_atts( array(
		/* Order is deliberate: AI-Native first because it is the new thing and
		   the reason a lot of this traffic arrives. */
		'tracks'  => 'ai-native,adv-safe,safe-roles,safe-industry,safe-found',
		'open'    => '',
		'heading' => '',
		/* The page owns the numbering, not the block -- a section that hardcodes
		   its own number is wrong the moment it moves. */
		'num'     => '01',
	), $atts, 'aa_track_accordion' );

	$copy = function_exists( 'aa_training_copy_l10n' ) ? aa_training_copy_l10n() : array();
	$want = array_filter( array_map( 'trim', explode( ',', (string) $a['tracks'] ) ) );
	if ( ! $want ) { return ''; }

	/* One colour per track, so a spine, its cards and the calendar chips for
	   the same certifications read as one family. */
	$pal = array( '#0E8074', '#101C33', '#D34B2A', '#B3702A', '#3E6B5C' );

	$built = array();
	$i     = 0;
	foreach ( $want as $cat ) {
		$slugs = aa_reg_track_course_slugs( $cat );
		if ( ! $slugs ) { continue; }

		$built[] = array(
			'cat'   => $cat,
			'label' => isset( $copy[ $cat ]['label'] ) ? $copy[ $cat ]['label'] : ucwords( str_replace( '-', ' ', $cat ) ),
			'desc'  => isset( $copy[ $cat ]['accent'] ) ? ucfirst( trim( $copy[ $cat ]['accent'], '.' ) ) . '.' : '',
			'href'  => '/training/' . $cat . '/',
			'slugs' => $slugs,
			'color' => $pal[ $i % count( $pal ) ],
		);
		$i++;
	}
	if ( ! $built ) { return ''; }

	$open = $a['open'] !== '' ? $a['open'] : $built[0]['cat'];
	$tot  = 0;
	foreach ( $built as $b ) { $tot += count( $b['slugs'] ); }

	$h  = '<section class="aaa" id="certifications" data-aaa>';
	$h .= '<div class="aaa__head">';
	$h .= '<span class="aaa__kicker">'
	    . ( $a['num'] !== '' ? esc_html( $a['num'] ) . ' &middot; ' : '' ) . 'The catalogue</span>';
	$h .= '<h2 class="aaa__h2">' . ( $a['heading'] !== ''
		? esc_html( $a['heading'] )
		: count( $built ) . ' tracks, <em>one at a time.</em>' ) . '</h2>';
	$h .= '<p class="aaa__lede">' . (int) $tot . ' certifications. Each track opens with its '
	    . 'starting credential; every card links to the course page and its next published date.</p>';
	$h .= '</div>';

	$h .= '<div class="aaa__row">';
	foreach ( $built as $n => $b ) {
		$is = ( $b['cat'] === $open );
		$h .= '<div class="aaa__track' . ( $is ? ' is-open' : '' ) . '"'
		    . ' data-aaa-track="' . esc_attr( $b['cat'] ) . '"'
		    . ' style="--aaa-c:' . esc_attr( $b['color'] ) . '">';

		/* The spine is the control, and it stays a button in the open panel too
		   -- otherwise the only way back out of a track is to open another. */
		$h .= '<button type="button" class="aaa__spine" data-aaa-open="' . esc_attr( $b['cat'] ) . '"'
		    . ' aria-expanded="' . ( $is ? 'true' : 'false' ) . '">'
		    . '<span class="aaa__num">' . sprintf( '%02d', $n + 1 ) . '</span>'
		    . '<span class="aaa__name">' . esc_html( $b['label'] ) . '</span>'
		    . '<span class="aaa__count">' . count( $b['slugs'] ) . '</span>'
		    . '</button>';

		$h .= '<div class="aaa__body">';
		$h .= '<div class="aaa__bar">'
		    . '<h3 class="aaa__h3">' . esc_html( $b['label'] ) . '</h3>'
		    . ( $b['desc'] !== '' ? '<p class="aaa__desc">' . esc_html( $b['desc'] ) . '</p>' : '' )
		    . '<a class="aaa__more" href="' . esc_url( $b['href'] ) . '">Category page &#10230;</a>'
		    . '</div>';

		$slugs = $b['slugs'];
		$lead  = array_shift( $slugs );
		$cnt   = count( $slugs );
		$h .= '<div class="aac__grid aaa__grid">';
		$h .= aa_reg_course_card( $lead, true );
		$wide = ( $cnt % 2 === 1 );
		foreach ( $slugs as $k => $slug ) {
			$h .= aa_reg_course_card( $slug, false, ( $wide && $k === 0 ) );
		}
		$h .= '</div>';

		$h .= '</div></div>';
	}
	$h .= '</div>';

	$h .= '</section>';
	return $h;
}
add_shortcode( 'aa_track_accordion', 'aa_reg_track_accordion' );

/* ============================================================================
   AA — COURSE ACCORDION                                 [aa_course_accordion]
   ----------------------------------------------------------------------------
   The track-page counterpart of [aa_track_accordion]: same spines, same open
   panel, but one row per CERTIFICATION rather than one per track.

   WHAT IT REPLACES. Every track page carried a hand-written grid of course
   cards -- the course name, a blurb, a code and a price, all typed into the
   page. Three things were wrong with that beyond the shape of it:

     - The prices were typed. A track page could say $850 while the register
       card twenty lines above it charged something else, and nothing would
       catch it. Everything here is read from aa_reg_course(), which is the
       same source the checkout uses, so the page cannot quote a price the
       cart will not honour.
     - The dates were absent. A card that links to a course page is a card
       that makes you load another page to find out when it runs. The panel
       lists the next few cohorts and each one links straight to that cohort
       preselected.
     - The list went stale. A course added under a track appeared in the
       calendar and the hub but not in the page's own grid, because the grid
       was a separate hand list.

   The whole catalogue is in the HTML whether or not a panel is open -- closed
   panels are hidden with CSS, not omitted -- so a crawler and an assistant
   read every credential, price and date on the track. Opening a panel moves
   space; it does not fetch anything.
   ========================================================================== */

/**
 * [aa_course_accordion category="adv-safe" num="03"]
 *
 * category  which track. Defaults to the page's own slug, so a track page can
 *           drop the shortcode in bare.
 * id        the section's anchor. Defaults to "courses", which is what the
 *           track pages' own nav and final CTA already point at.
 * open      slug of the course whose panel opens. Defaults to the first.
 * dates     how many cohorts to list per course.
 */
function aa_reg_course_accordion( $atts ) {
	$a = shortcode_atts( array(
		'category' => '',
		'id'       => 'courses',
		'open'     => '',
		'heading'  => '',
		'kicker'   => 'Certifications',
		'num'      => '',
		'dates'    => 4,
	), $atts, 'aa_course_accordion' );

	$cat = trim( $a['category'] );
	if ( $cat === '' ) {
		$obj = function_exists( 'get_queried_object' ) ? get_queried_object() : null;
		$cat = ( $obj && isset( $obj->post_name ) ) ? $obj->post_name : '';
	}
	if ( $cat === '' ) { return ''; }

	$slugs = aa_reg_track_course_slugs( $cat );
	if ( ! $slugs ) { return ''; }

	/* Same palette as the track accordion, so a spine on a track page and the
	   spine for that track on the hub read as one family. */
	$pal = array( '#0E8074', '#101C33', '#D34B2A', '#B3702A', '#3E6B5C', '#2F5D8C', '#7A4E8C' );

	$built = array();
	foreach ( $slugs as $slug ) {
		$course = aa_reg_course( $slug );
		if ( ! $course ) { continue; }
		$code = isset( $course['code'] ) ? $course['code'] : strtoupper( $slug );
		$url  = isset( $course['url'] ) ? $course['url'] : '';

		$dates = array();
		foreach ( aa_reg_upcoming( $slug, $course ) as $c ) {
			$dates[] = $c;
			if ( count( $dates ) >= max( 1, (int) $a['dates'] ) ) { break; }
		}

		$built[] = array(
			'slug'   => $slug,
			'course' => $course,
			'code'   => $code,
			'name'   => aa_reg_short_name( $course, $code ),
			'url'    => $url,
			'page'   => aa_reg_page_exists( $url ),
			'dates'  => $dates,
			'color'  => $pal[ count( $built ) % count( $pal ) ],
		);
	}
	if ( ! $built ) { return ''; }

	/* WHICHEVER STARTS SOONEST OPENS, not whichever is first in the list. The
	   panel a visitor most likely wants open is the one they can actually join
	   next; a track whose lead credential runs in March should not open on it
	   in September. A hand-set open= still wins. */
	$open = trim( $a['open'] );
	if ( $open === '' ) {
		$soonest = '';
		foreach ( $built as $b ) {
			if ( ! $b['dates'] ) { continue; }
			if ( $soonest === '' || $b['dates'][0]['start'] < $soonest ) {
				$soonest = $b['dates'][0]['start'];
				$open    = $b['slug'];
			}
		}
		if ( $open === '' ) { $open = $built[0]['slug']; }
	}

	$copy  = function_exists( 'aa_training_copy_l10n' ) ? aa_training_copy_l10n() : array();
	$label = isset( $copy[ $cat ]['label'] ) ? $copy[ $cat ]['label'] : '';

	$h  = '<section class="aaa aaa--courses" id="' . esc_attr( $a['id'] ) . '" data-aaa>';
	$h .= '<div class="aaa__head">';
	$h .= '<span class="aaa__kicker">'
	    . ( $a['num'] !== '' ? esc_html( $a['num'] ) . ' &middot; ' : '' )
	    . esc_html( $a['kicker'] ) . '</span>';
	$h .= '<h2 class="aaa__h2">' . ( $a['heading'] !== ''
		? esc_html( $a['heading'] )
		: count( $built ) . ' certifications, <em>one at a time.</em>' ) . '</h2>';
	$h .= '<p class="aaa__lede">Open a credential for what it covers, what it costs and when it '
	    . 'next runs. Every course is live-virtual with the exam voucher and the courseware '
	    . 'included, and rescheduling is free &mdash; no deadline, no fee.</p>';
	$h .= '</div>';

	$h .= '<div class="aaa__row">';
	foreach ( $built as $n => $b ) {
		$is = ( $b['slug'] === $open );
		$h .= '<div class="aaa__track' . ( $is ? ' is-open' : '' ) . '"'
		    . ' data-aaa-track="' . esc_attr( $b['slug'] ) . '"'
		    . ' style="--aaa-c:' . esc_attr( $b['color'] ) . '">';

		$h .= '<button type="button" class="aaa__spine" data-aaa-open="' . esc_attr( $b['slug'] ) . '"'
		    . ' aria-expanded="' . ( $is ? 'true' : 'false' ) . '">'
		    . '<span class="aaa__num">' . sprintf( '%02d', $n + 1 ) . '</span>'
		    . '<span class="aaa__name">' . esc_html( $b['code'] ) . '</span>'
		    /* The code alone is all a 64px vertical spine can carry. Below
		       900px the spines turn horizontal and there is room for the name,
		       so it is in the markup and hidden by CSS until then. */
		    . '<span class="aax__sname">' . esc_html( $b['name'] ) . '</span>'
		    . '<span class="aaa__count">'
		    . esc_html( aa_reg_money( $b['course']['price'], $b['course']['currency'] ) )
		    . '</span>'
		    . '</button>';

		$h .= '<div class="aaa__body">';

		$h .= '<div class="aaa__bar">'
		    . '<h3 class="aaa__h3">' . esc_html( $b['name'] ) . '</h3>'
		    . '<span class="aax__code">' . esc_html( $b['code'] ) . '</span>';
		if ( $b['page'] ) {
			$h .= '<a class="aaa__more" href="' . esc_url( $b['url'] ) . '">Course page &#10230;</a>';
		}
		$h .= '</div>';

		$blurb = function_exists( 'aa_reg_blurb' ) ? aa_reg_blurb( $b['course'], 220 ) : '';
		if ( $blurb !== '' ) {
			$h .= '<p class="aax__p">' . esc_html( $blurb ) . '</p>';
		}

		$days = max( 1, (int) $b['course']['days'] );
		$h .= '<div class="aax__facts">'
		    . '<span><b>' . esc_html( aa_reg_money( $b['course']['price'], $b['course']['currency'] ) )
		    . '</b><i>' . esc_html( aa_reg_incl( $b['course'] ) ) . '</i></span>'
		    . '<span><b>' . (int) $days . ' ' . esc_html( $days === 1 ? 'day' : 'days' ) . '</b>'
		    . '<i>live-virtual</i></span>'
		    . '<span><b>' . count( $b['dates'] ) . '</b><i>'
		    . esc_html( count( $b['dates'] ) === 1 ? 'published date' : 'published dates' ) . '</i></span>'
		    . '</div>';

		/* EACH DATE IS A LINK THAT ARRIVES WITH THAT COHORT CHOSEN. The old
		   grid sent you to the course page to pick a date you had already
		   picked; ?cohort=… #enroll lands on the form with it selected. */
		if ( $b['dates'] ) {
			$h .= '<p class="aax__dlabel">' . esc_html( aa_reg_t( 'pick_dates', 'Pick your dates' ) ) . '</p>';
			$h .= '<div class="aax__dates">';
			foreach ( $b['dates'] as $c ) {
				$href = $b['url'] . ( strpos( $b['url'], '?' ) === false ? '?' : '&' )
				      . 'cohort=' . rawurlencode( $c['id'] ) . '#enroll';
				$h .= '<a class="aax__date" href="' . esc_url( $href ) . '">'
				    . '<b>' . esc_html( aa_reg_range( $c['start'], $c['end'] ) ) . '</b>'
				    . '<span>' . (int) $days . ' ' . esc_html( aa_reg_t( 'days_l', 'days' ) ) . '</span>'
				    . '</a>';
			}
			$h .= '</div>';
			$h .= '<p class="aax__note"><a href="#cohorts">Every published date for'
			    . ( $label !== '' ? ' ' . esc_html( $label ) : ' this track' ) . ' &#10230;</a></p>';
		} else {
			$h .= '<p class="aax__note">No published dates for this credential yet. '
			    . '<a href="/about/contact/">Ask us about the next cohort</a> &mdash; it runs as a '
			    . 'private class for six or more.</p>';
		}

		$h .= '</div></div>';
	}
	$h .= '</div>';
	$h .= '</section>';
	return $h;
}
add_shortcode( 'aa_course_accordion', 'aa_reg_course_accordion' );

/* ============================================================================
   AA — HUB HERO AND PAGE NAV                                    [aa_hub_hero]
   ----------------------------------------------------------------------------
   The top of /training/: what this page is, the next few starts, and a sticky
   numbered nav for the sections below it.

   THE STARTS ARE READ, NOT TYPED. Whoever is nearest is whoever the cohort
   generator says is nearest -- so the hero cannot go stale, and it cannot
   disagree with the board twenty lines further down. A hand-written "next
   course: 14 Sep" is wrong within a fortnight and nobody notices.

   Eventbrite stays, as a secondary link that says SELECTED DATES. Not every
   cohort is listed there, and a co-equal "Register via Eventbrite" button
   implies the whole catalogue is.
   ========================================================================== */

/** The soonest N starts across every course, for the hero. */
/**
 * A COURSE'S SHORT NAME.
 *
 * aa_salary_label() only searches the hand-written table, so a page-derived
 * course fell through to its own code -- which is why the hero read "LPM  LPM"
 * and "APM  APM". This takes the course array we already hold and only falls
 * back to the code when there is genuinely no name.
 */
function aa_reg_short_name( $course, $code ) {
	$name = ( is_array( $course ) && ! empty( $course['name'] ) ) ? $course['name'] : '';
	if ( $name === '' ) { return $code; }
	$name = preg_replace( '/^SAFe®?\s*/u', '', $name );
	$name = preg_replace( '/\s*Certification$/u', '', $name );
	$name = trim( $name );
	return $name !== '' ? $name : $code;
}

function aa_reg_soonest( $limit = 3 ) {
	$out = array();
	foreach ( aa_reg_all_course_slugs() as $slug ) {
		$course = aa_reg_course( $slug );
		if ( ! $course ) { continue; }
		foreach ( aa_reg_upcoming( $slug, $course ) as $c ) {
			$out[] = array( 'slug' => $slug, 'course' => $course, 'c' => $c );
			break;   /* one per course, or a single daily cadence fills the list */
		}
	}
	usort( $out, function ( $x, $y ) { return strcmp( $x['c']['start'], $y['c']['start'] ); } );
	return array_slice( $out, 0, max( 1, (int) $limit ) );
}

/**
 * THE STICKY NUMBERED PAGE NAV.
 *
 * Pulled out of aa_reg_hub_hero() so the track pages can have the same one.
 * They had no internal nav at all: six sections, no table of contents, and the
 * only way to reach the coaching block at the bottom was to scroll past four
 * screens of salary bars and role cards. The hub got a nav and they did not,
 * purely because the nav happened to be written inside the hub's hero.
 *
 * $spec is a comma-separated list of "number:label:anchor" -- the same format
 * the hub already uses, so the two cannot drift apart. An item whose anchor is
 * not on the page is the page's problem, not this function's; it renders the
 * link either way rather than silently dropping it, because a missing nav entry
 * is much harder to notice than a link that does nothing.
 */
function aa_reg_nav_html( $spec, $cta_href = '#cohorts', $cta_label = 'See dates' ) {
	$items = array_filter( array_map( 'trim', explode( ',', (string) $spec ) ) );
	if ( ! $items ) { return ''; }

	$h  = '<nav class="aahn" aria-label="On this page"><div class="aahn__in">';
	$h .= '<div class="aahn__scroll">';
	$h .= '<span class="aahn__label">On this page</span>';
	foreach ( $items as $it ) {
		$parts = explode( ':', $it );
		if ( count( $parts ) < 3 ) { continue; }
		$h .= '<a class="aahn__link" href="#' . esc_attr( trim( $parts[2] ) ) . '">'
		    . '<span>' . esc_html( trim( $parts[0] ) ) . '</span>'
		    . esc_html( trim( $parts[1] ) ) . '</a>';
	}
	$h .= '</div>';
	/* Outside the scroller, or it scrolls out of reach on a narrow desktop
	   window and the nav loses its only call to action. */
	if ( $cta_href !== '' ) {
		$h .= '<a class="aahn__cta" href="' . esc_url( $cta_href ) . '">'
		    . esc_html( $cta_label ) . ' <span aria-hidden="true">&#10230;</span></a>';
	}
	$h .= '</div></nav>';
	return $h;
}

/**
 * [aa_page_nav items="01:Certifications:certifications,…" cta="#cohorts" cta_label="See dates"]
 *
 * Drop it at the top of any page that has numbered sections. The track pages
 * use it; the hub renders the same markup from inside its hero.
 */
function aa_reg_page_nav_shortcode( $atts ) {
	$a = shortcode_atts( array(
		'items'     => '',
		'cta'       => '#cohorts',
		'cta_label' => 'See dates',
	), $atts, 'aa_page_nav' );

	if ( trim( $a['items'] ) === '' ) { return ''; }
	return aa_reg_nav_html( $a['items'], $a['cta'], $a['cta_label'] );
}
add_shortcode( 'aa_page_nav', 'aa_reg_page_nav_shortcode' );

function aa_reg_hub_hero( $atts ) {
	$a = shortcode_atts( array(
		'nav'   => '01:Certifications:certifications,02:Career and pay:career,'
		         . '03:Upcoming cohorts:cohorts,04:Coaching:coaching,05:Contact:contact',
		'count' => 6,
	), $atts, 'aa_hub_hero' );

	$slugs = aa_reg_all_course_slugs();
	$total = count( $slugs );

	/* Every course that has a schedule, with its next few dates. The card sells
	   any of them, so the picker needs all of them -- not a shortlist. */
	$courses = array();
	$ups     = array();
	foreach ( $slugs as $slug ) {
		$course = aa_reg_course( $slug );
		if ( ! $course ) { continue; }
		$next = array();
		foreach ( aa_reg_upcoming( $slug, $course ) as $c ) {
			$next[] = $c;
			if ( count( $next ) >= (int) $a['count'] ) { break; }
		}
		if ( ! $next ) { continue; }
		$courses[ $slug ] = $course;
		$ups[ $slug ]     = $next;
	}

	/* Whichever course starts soonest opens the card. Not the first
	   alphabetically, and not a hand-picked favourite -- the one a visitor can
	   actually join next. */
	$first_slug = '';
	$firstdate  = '';
	foreach ( $ups as $slug => $list ) {
		if ( $firstdate === '' || $list[0]['start'] < $firstdate ) {
			$firstdate  = $list[0]['start'];
			$first_slug = $slug;
		}
	}

	$h = '';

	/* THE NAV GOES ABOVE THE HERO.
	   Below it, it only appears after a full screen of hero has been scrolled
	   past -- so on arrival the page has no visible table of contents at all,
	   which is the one job it has. */
	$h .= aa_reg_nav_html( $a['nav'] );

	$h .= '<section class="aah">';
	$h .= '<div class="aah__grid">';

	$h .= '<div class="aah__copy">';
	$h .= '<span class="aah__kicker">Training &amp; certification</span>';
	$h .= '<h1 class="aah__h1">' . (int) $total . ' certifications, '
	    . '<em>for the people who lead the change.</em></h1>';
	$h .= '<p class="aah__sub">Live-virtual cohorts taught by a Gold SPCT. Every course includes the '
	    . 'exam voucher and the courseware, most run two to four days, and rescheduling is free '
	    . 'with no deadline and no fee.</p>';
	$h .= '<div class="aah__btns">'
	    . '<a class="aah__cta" href="#cohorts">See all dates <span aria-hidden="true">&#10230;</span></a>'
	    . '<a class="aah__btn2" href="#certifications">Browse certifications</a>'
	    . '</div>';
	$h .= '<p class="aah__eb"><a href="https://www.eventbrite.ca/o/agileagilist-56013628813"'
	    . ' target="_blank" rel="noopener noreferrer">Selected dates are also on Eventbrite</a></p>';
	$h .= '</div>';

	/* THE REGISTRATION CARD, IN THE SHAPE THE TRACK PAGES ALREADY USE.
	   Choose the certification, choose from its next dates, pay where you
	   stand. It reuses the .aat-reg markup and the data-aah- contract the
	   landing pages emit, so it needs no CSS and no script of its own -- and
	   the two cards cannot drift apart, because they are the same card.

	   Every course's dates are in the page with all but one hidden, the same
	   contract the calendar keeps: the schedule is what a crawler comes for,
	   and it should not need a change event to exist. */
	if ( $first_slug !== '' ) {
		$fc = $courses[ $first_slug ];
		$h .= '<div class="aat-reg aah__reg" data-aah>';
		$h .= '<label class="aat-field"><span>' . esc_html( aa_reg_t( 'certification', 'Certification' ) ) . '</span>'
		    . '<span class="aat-select"><select data-aah-course>';
		foreach ( $courses as $slug => $course ) {
			$code = isset( $course['code'] ) ? $course['code'] : strtoupper( $slug );
			$h .= '<option value="' . esc_attr( $slug ) . '"' . ( $slug === $first_slug ? ' selected' : '' ) . '>'
			    . esc_html( $code . ' — ' . aa_reg_short_name( $course, $code ) ) . '</option>';
		}
		$h .= '</select></span></label>';

		foreach ( $courses as $slug => $course ) {
			$h .= '<div class="aat-dates" data-aah-dates="' . esc_attr( $slug ) . '"'
			    . ( $slug === $first_slug ? '' : ' hidden' ) . '>'
			    . '<p class="aat-dates__label">' . esc_html( aa_reg_t( 'pick_dates', 'Pick your dates' ) ) . '</p>'
			    . '<div class="aat-dates__list">';
			$j = 0;
			foreach ( $ups[ $slug ] as $n ) {
				$h .= '<button type="button" class="aat-dateopt' . ( $j === 0 ? ' is-on' : '' ) . '"'
				    . ' data-aah-pick="' . esc_attr( $n['id'] ) . '"'
				    . ' data-price="' . (int) $course['price'] . '"'
				    . ' aria-pressed="' . ( $j === 0 ? 'true' : 'false' ) . '">'
				    . '<b>' . esc_html( aa_reg_range( $n['start'], $n['end'] ) ) . '</b>'
				    . '<span>' . (int) $course['days'] . ' ' . esc_html( aa_reg_t( 'days_l', 'days' ) ) . '</span>'
				    . '</button>';
				$j++;
			}
			$h .= '</div></div>';
		}

		$h .= aa_reg_config_script();
		$h .= aa_reg_inline( $fc, $ups[ $first_slug ][0], $fc['currency'], 'aahreg', true );
		$h .= '<p class="aat-reg__note">' . esc_html( aa_reg_incl( $fc ) ) . ' &middot; '
		    . esc_html( aa_reg_t( 'resched', 'reschedule at no fee' ) ) . '</p>';
		$h .= '</div>';
	}

	$h .= '</div></section>';

	return $h;
}
add_shortcode( 'aa_hub_hero', 'aa_reg_hub_hero' );


/* ============================================================================
   AA — UPCOMING COHORTS                                        [aa_cohorts]
   ----------------------------------------------------------------------------
   Both views of the same quarter, with a toggle: the timeline board, and the
   month calendar. Both are rendered server-side and one is hidden, so the
   schedule is in the HTML twice over and neither view depends on the script.

   TWO VIEWS BECAUSE THEY ANSWER DIFFERENT QUESTIONS. The board answers "when
   can I fit this in" -- bar width is days out of the office, which is what
   somebody holding their own calendar needs. The month grid answers "what is
   on in November". Neither one replaces the other, and the calendar is not
   optional: it is what people expect to find under a heading like this.
   ========================================================================== */

function aa_reg_cohorts_section( $atts ) {
	$a = shortcode_atts( array(
		'num'     => '02',
		'courses' => 'all',
		'months'  => 3,
		'per'     => 3,
		'view'    => 'board',
	), $atts, 'aa_cohorts' );

	$board = aa_reg_board( array(
		'courses' => $a['courses'], 'months' => $a['months'], 'per' => $a['per'],
	) );
	$cal = aa_reg_track_calendar( array(
		'courses' => $a['courses'], 'months' => $a['months'], 'per' => $a['per'],
	) );
	if ( $board === '' && $cal === '' ) { return ''; }

	$boardon = ( $a['view'] !== 'calendar' );

	$h  = '<section class="aaq" id="cohorts" data-aaq>';
	$h .= '<div class="aaq__head">';
	$h .= '<span class="aaq__kicker">'
	    . ( $a['num'] !== '' ? esc_html( $a['num'] ) . ' &middot; ' : '' ) . 'Upcoming cohorts</span>';
	$h .= '<h2 class="aaq__h2">The next three months, <em>laid out in time.</em></h2>';
	$h .= '<p class="aaq__lede">Every published date across every track. On the timeline, bar width '
	    . 'is how many days you are out of the office; the calendar shows the same dates by month. '
	    . 'Click any date to register.</p>';
	$h .= '</div>';

	if ( $board !== '' && $cal !== '' ) {
		$h .= '<div class="aaq__bar"><span class="aaq__seg" role="group" aria-label="Calendar view">'
		    . '<button type="button" class="aaq__segbtn" data-aaq-view="board" aria-pressed="'
		    . ( $boardon ? 'true' : 'false' ) . '">Timeline</button>'
		    . '<button type="button" class="aaq__segbtn" data-aaq-view="calendar" aria-pressed="'
		    . ( $boardon ? 'false' : 'true' ) . '">Calendar</button>'
		    . '</span></div>';
	}

	if ( $board !== '' ) {
		$h .= '<div data-aaq-panel="board"' . ( $boardon ? '' : ' hidden' ) . '>' . $board . '</div>';
	}
	if ( $cal !== '' ) {
		$h .= '<div data-aaq-panel="calendar"' . ( $boardon && $board !== '' ? ' hidden' : '' ) . '>' . $cal . '</div>';
	}

	$h .= '</section>';
	return $h;
}
add_shortcode( 'aa_cohorts', 'aa_reg_cohorts_section' );

/* ============================================================================
   AA — HOME PAGE ADDITIONS        [aa_jump_menu] [aa_home_tracks] [aa_cert_count]
   ----------------------------------------------------------------------------
   Two blocks from the home-page design handoff, rebuilt on our own data.

   A. [aa_jump_menu]   sticky in-page section menu, sits right after the hero.
   B. [aa_home_tracks] the certification tracks as a horizontal tab strip,
                       replacing the five hand-typed cards in section 02.

   WHY THIS IS NOT THE HANDOFF'S PHP. The handoff ships aa_home_tracks() and
   aa_home_jump_items() as hardcoded arrays, and every figure in them is wrong
   for us: Micro-credentials "18 = 7 SAFe + 11 ICAgile" where we run four,
   SAFe by Role "6" where we run seven, Advanced "5" where we run seven,
   AI-Native "4" where we run three -- and two of its five hrefs
   (/training/micro-credentials/, /training/safe-by-industry/) are not pages on
   this site. Those are the same five numbers that were already typed into the
   home page and had drifted from the catalogue.

   So nothing here is typed. Track membership comes from
   aa_reg_track_course_slugs(), the credential names and URLs from
   aa_reg_course() -- the same table the checkout reads -- and the labels and
   descriptions from aa_training_copy_l10n(), which is already translated. Add
   a course and the count on the home page moves on its own.

   THE TOTAL IS DISTINCT, NOT A SUM. ARCH sits in both Advanced SAFe and SAFe
   by Industry, and SAFe Practitioner in both Core Roles and SAFe by Industry.
   Adding the five track counts would claim credentials we do not have, so the
   headline figure counts distinct slugs.

   KEPT FROM THE HANDOFF, deliberately:
     - every panel body is in the HTML at all times. Closed panels are
       zero-height + visibility:hidden, never display:none and never removed,
       so all ~26 credential names and five track descriptions are in the
       first fetch;
     - the menu entries are real #anchors, not JS scrolling;
     - the ARIA tabs pattern, including roving tabindex and arrow keys.

   ONE THING CHANGED. The handoff renders the strip with .aahs-nojs on the host
   and has the JS strip it on boot, which means every panel paints open and
   then collapses in front of the reader on every load. The <noscript> block
   alone does the same job without the flash, so the class is not emitted and
   the JS's removeClass is simply a no-op.
   ============================================================================ */

/** Small label table for the two blocks. English base, laid over per language. */
function aa_home_copy_l10n() {
	$en = array(
		'eyebrow'     => 'On this page',
		'nav_cta'     => 'Browse certifications',
		'training'    => 'Training',
		'assessments' => 'Assessments',
		'why'         => 'Why us',
		'methodology' => 'Methodology',
		'consulting'  => 'Consulting',
		'results'     => 'Results',
		'path'        => 'Your path',
		'coaching'    => 'Coaching',
		'tablist'     => 'Certification tracks',
		/* %d is the number of certifications in the open track. */
		'count'       => '%d certifications',
		'track_cta'   => 'View the track',
	);

	$over = array(
		'fr' => array(
			'eyebrow'     => 'Sur cette page',
			'nav_cta'     => 'Voir les certifications',
			'training'    => 'Formations',
			'assessments' => 'Évaluations',
			'why'         => 'Pourquoi nous',
			'methodology' => 'Méthodologie',
			'consulting'  => 'Conseil',
			'results'     => 'Résultats',
			'path'        => 'Votre parcours',
			'coaching'    => 'Coaching',
			'tablist'     => 'Parcours de certification',
			'count'       => '%d certifications',
			'track_cta'   => 'Voir le parcours',
		),
		'es' => array(
			'eyebrow'     => 'En esta página',
			'nav_cta'     => 'Ver las certificaciones',
			'training'    => 'Formación',
			'assessments' => 'Evaluaciones',
			'why'         => 'Por qué nosotros',
			'methodology' => 'Metodología',
			'consulting'  => 'Consultoría',
			'results'     => 'Resultados',
			'path'        => 'Tu itinerario',
			'coaching'    => 'Coaching',
			'tablist'     => 'Itinerarios de certificación',
			'count'       => '%d certificaciones',
			'track_cta'   => 'Ver el itinerario',
		),
		'ar' => array(
			'eyebrow'     => 'في هذه الصفحة',
			'nav_cta'     => 'استعرض الشهادات',
			'training'    => 'التدريب',
			'assessments' => 'التقييمات',
			'why'         => 'لماذا نحن',
			'methodology' => 'المنهجية',
			'consulting'  => 'الاستشارات',
			'results'     => 'النتائج',
			'path'        => 'مسارك',
			'coaching'    => 'الإرشاد المهني',
			'tablist'     => 'مسارات الشهادات',
			'count'       => '%d شهادات',
			'track_cta'   => 'عرض المسار',
		),
	);

	$lang = function_exists( 'aa_reg_lang' ) ? aa_reg_lang() : 'en';
	return isset( $over[ $lang ] ) ? array_merge( $en, $over[ $lang ] ) : $en;
}

/**
 * THE JUMP-MENU ENTRIES.
 *
 * The numerals are the section numbers the page already prints in its own
 * kickers -- "( 02 ) — All training" -- and not a second 01..08 scheme of the
 * menu's own. Two numbering systems on one screen is how a menu starts lying
 * about which section it points at.
 */
function aa_home_jump_items() {
	$L = aa_home_copy_l10n();

	$ids = array(
		'training'    => '02',
		'assessments' => '03',
		'why'         => '04',
		'methodology' => '05',
		'consulting'  => '06',
		'results'     => '07',
		'path'        => '08',
		'coaching'    => '09',
	);

	$out = array();
	foreach ( $ids as $id => $num ) {
		$out[] = array(
			'id'    => $id,
			'num'   => $num,
			'label' => isset( $L[ $id ] ) ? $L[ $id ] : ucfirst( $id ),
		);
	}
	return apply_filters( 'aa_home_jump_items', $out );
}

/**
 * THE FIVE TRACKS, READ RATHER THAN TYPED.
 *
 * Order is the order they already read in on the page: the one-day credentials
 * first, the AI-Native track last because it is the newest and the reader is
 * least likely to be looking for it by name.
 */
function aa_home_track_data( $order = '' ) {
	static $cache = array();

	if ( $order === '' ) {
		$order = 'safe-found,safe-roles,adv-safe,safe-industry,ai-native';
	}
	$lang = function_exists( 'aa_reg_lang' ) ? aa_reg_lang() : 'en';
	$key  = $lang . '|' . $order;
	if ( isset( $cache[ $key ] ) ) { return $cache[ $key ]; }

	if ( ! function_exists( 'aa_reg_track_course_slugs' ) || ! function_exists( 'aa_reg_course' ) ) {
		$cache[ $key ] = array();
		return $cache[ $key ];
	}

	$copy = function_exists( 'aa_training_copy_l10n' ) ? aa_training_copy_l10n() : array();
	$cats = array_filter( array_map( 'trim', explode( ',', (string) $order ) ) );

	$out = array();
	foreach ( $cats as $cat ) {
		$slugs = aa_reg_track_course_slugs( $cat );
		if ( ! $slugs ) { continue; }

		$certs = array();
		foreach ( $slugs as $slug ) {
			$c = aa_reg_course( $slug );
			if ( ! $c ) { continue; }

			/* "SAFe® Release Train Engineer Certification" is the catalogue
			   name; on a chip the trailing word is noise on all five of them. */
			$name = isset( $c['name'] ) ? trim( (string) $c['name'] ) : '';
			$name = trim( preg_replace( '/\s+Certification$/u', '', $name ) );
			if ( $name === '' ) {
				$name = ! empty( $c['code'] ) ? (string) $c['code'] : $slug;
			}

			/* THE CODE IS ONLY WORTH PRINTING WHEN IT IS A REAL CODE.
			   aa_reg_courses() carries proper credential codes -- SPC, RTE,
			   POPM. A course DERIVED from its page has no such field, so
			   aa_reg_derived_course() manufactures one by upper-casing the
			   page's own title: the four micro-credentials came out as
			   "AF: CONFLICT & COLLABORATION", and the chip then printed that
			   immediately followed by "Advanced Facilitator: Conflict &
			   Collaboration" -- the same words twice, once shouted.

			   So a code has to look like a code to be shown: letters, digits
			   and hyphens, two to eight characters. Anything with a space, a
			   colon or more than eight characters is a title wearing capitals
			   and the chip carries the name alone. */
			$code = ! empty( $c['code'] ) ? trim( (string) $c['code'] ) : '';
			if ( ! preg_match( '/^[A-Z0-9][A-Z0-9-]{1,7}$/', $code )
				|| strcasecmp( $code, $name ) === 0 ) {
				$code = '';
			}

			$certs[] = array(
				'slug' => $slug,
				'code' => $code,
				'name' => $name,
				'url'  => ! empty( $c['url'] ) ? (string) $c['url'] : '',
			);
		}
		if ( ! $certs ) { continue; }

		$out[] = array(
			'cat'   => $cat,
			'label' => isset( $copy[ $cat ]['label'] ) ? (string) $copy[ $cat ]['label'] : ucwords( str_replace( '-', ' ', $cat ) ),
			'desc'  => isset( $copy[ $cat ]['sub'] )   ? (string) $copy[ $cat ]['sub'] : '',
			'for'   => isset( $copy[ $cat ]['comp'] )  ? (string) $copy[ $cat ]['comp'] : '',
			'href'  => '/training/' . $cat . '/',
			'certs' => $certs,
		);
	}

	$cache[ $key ] = $out;
	return $out;
}

/** Distinct certifications across the tracks -- see the note on double-counting. */
function aa_home_cert_total() {
	$seen = array();
	foreach ( aa_home_track_data() as $t ) {
		foreach ( $t['certs'] as $c ) { $seen[ $c['slug'] ] = 1; }
	}
	return count( $seen );
}

function aa_home_cert_count_shortcode() {
	$n = aa_home_cert_total();
	return $n > 0 ? (string) $n : '';
}
add_shortcode( 'aa_cert_count', 'aa_home_cert_count_shortcode' );

function aa_home_track_count_shortcode() {
	$n = count( aa_home_track_data() );
	return $n > 0 ? (string) $n : '';
}
add_shortcode( 'aa_track_count', 'aa_home_track_count_shortcode' );

/**
 * Absolute form of a course or track URL, for JSON-LD.
 *
 * aa_reg_course() returns a hand-written relative path for the English table
 * rows and a full permalink for anything derived from a page, so home_url()
 * on its own would produce https://site/https://site/fr/spc/ off English.
 */
function aa_home_abs_url( $url ) {
	$url = trim( (string) $url );
	if ( $url === '' ) { return ''; }
	if ( preg_match( '#^https?://#i', $url ) ) { return $url; }
	return home_url( $url );
}

/** The permalink of the page being rendered, for absolute anchor URLs in JSON-LD. */
function aa_home_self_url() {
	if ( ! function_exists( 'get_queried_object' ) ) { return ''; }
	$obj = get_queried_object();
	if ( ! ( $obj instanceof WP_Post ) ) { return ''; }
	$url = get_permalink( $obj );
	return is_string( $url ) ? $url : '';
}

/**
 * THE BEHAVIOUR, INLINE, ONCE PER PAGE.
 *
 * WHY NOT IN THE SHARED JS SNIPPET. It was, at the bottom of "AA - Register
 * JS". That file is one <script>: an uncaught error in any earlier block in it
 * stops every later block from running, silently and with nothing on the page
 * to say so. This site has lost a working feature to that exact failure more
 * than once, and a home page whose tabs do not respond is indistinguishable
 * from a home page whose tabs were never wired.
 *
 * Emitting it beside the markup makes the block self-contained: it cannot be
 * killed by code it has nothing to do with, and it cannot be half-installed.
 *
 * IT BUILDS NO MARKUP. Both blocks are complete HTML from the shortcodes; this
 * only binds behaviour. Do not "optimise" the closed panels out of the DOM --
 * they are zero-height and visibility:hidden on purpose, so every credential
 * name is in the first fetch.
 */
function aa_home_behaviour_script() {
	static $done = false;
	if ( $done ) { return ''; }
	$done = true;

	$js = <<<'AAJS'
(function(){
'use strict';
function spy(){
  var host=document.querySelector('[data-aa="jump"]');
  if(!host||host.getAttribute('data-aa-bound')==='1')return;
  var links=[].slice.call(host.querySelectorAll('[data-aaj]'));
  var secs=[].slice.call(document.querySelectorAll('[data-aa-section]'));
  if(!links.length||!secs.length||!('IntersectionObserver' in window))return;
  host.setAttribute('data-aa-bound','1');
  var obs=new IntersectionObserver(function(es){
    var v=es.filter(function(e){return e.isIntersecting;})
           .sort(function(a,b){return b.intersectionRatio-a.intersectionRatio;})[0];
    if(!v)return;
    var id=v.target.getAttribute('data-aa-section');
    links.forEach(function(a){
      if(a.getAttribute('data-aaj')===id)a.setAttribute('aria-current','true');
      else a.removeAttribute('aria-current');
    });
  },{rootMargin:'-25% 0px -55% 0px',threshold:[0,0.15,0.4,0.75]});
  secs.forEach(function(s){obs.observe(s);});
}
function tabs(){
  var host=document.querySelector('[data-aa="tracks"]');
  if(!host||host.getAttribute('data-aa-bound')==='1')return;
  host.classList.remove('aahs-nojs');
  var T=[].slice.call(host.querySelectorAll('.aahs-tab'));
  var P=[].slice.call(host.querySelectorAll('.aahs-body'));
  if(!T.length||T.length!==P.length)return;
  host.setAttribute('data-aa-bound','1');
  function sel(i,focus){
    T.forEach(function(t,k){
      var on=k===i;
      t.setAttribute('aria-selected',String(on));
      t.setAttribute('tabindex',on?'0':'-1');
      P[k].setAttribute('data-open',String(on));
      P[k].setAttribute('aria-hidden',String(!on));
    });
    if(focus&&T[i])T[i].focus();
  }
  function cur(){for(var i=0;i<T.length;i++){if(T[i].getAttribute('aria-selected')==='true')return i;}return -1;}
  host.addEventListener('click',function(e){
    var t=e.target&&e.target.closest?e.target.closest('.aahs-tab'):null;
    if(!t)return;
    var i=T.indexOf(t);
    /* selecting MOVES the selection; clicking the open tab is a no-op, so the
       section can never collapse to a bare row of labels */
    if(i>=0)sel(i,false);
  });
  host.addEventListener('keydown',function(e){
    var t=e.target&&e.target.closest?e.target.closest('.aahs-tab'):null;
    if(!t)return;
    var i=T.indexOf(t),n=null;
    var rtl=document.documentElement.getAttribute('dir')==='rtl';
    var fwd=rtl?'ArrowLeft':'ArrowRight', back=rtl?'ArrowRight':'ArrowLeft';
    if(e.key===fwd||e.key==='ArrowDown')n=(i+1)%T.length;
    if(e.key===back||e.key==='ArrowUp')n=(i-1+T.length)%T.length;
    if(e.key==='Home')n=0;
    if(e.key==='End')n=T.length-1;
    if(n===null)return;
    e.preventDefault();sel(n,true);
  });
  sel(cur()<0?0:cur(),false);
}
function init(){try{spy();}catch(e){}try{tabs();}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
AAJS;

	return '<script>' . $js . '</script>';
}

/* ---------------------------------------------------------------------------
   A. STICKY IN-PAGE MENU                                        [aa_jump_menu]
   Real anchors, so the entries are shareable URLs and candidate sitelinks.
   The scrollspy in the JS only decorates them; with scripts off the menu is a
   plain list of working links.
   --------------------------------------------------------------------------- */
function aa_home_jump_shortcode( $atts ) {
	$a = shortcode_atts( array( 'cta' => '/training/' ), $atts, 'aa_jump_menu' );

	$items = aa_home_jump_items();
	if ( ! $items ) { return ''; }
	$L = aa_home_copy_l10n();

	$h  = '<nav class="aaj" data-aa="jump" aria-label="' . esc_attr( $L['eyebrow'] ) . '">';
	$h .= '<div class="aaj-row">';
	$h .= '<span class="aaj-eyebrow">' . esc_html( $L['eyebrow'] ) . '</span>';
	foreach ( $items as $it ) {
		$h .= '<a class="aaj-link" href="#' . esc_attr( $it['id'] ) . '"'
		    . ' data-aaj="' . esc_attr( $it['id'] ) . '">'
		    . '<span class="aaj-num" aria-hidden="true">' . esc_html( $it['num'] ) . '</span>'
		    . esc_html( $it['label'] ) . '</a>';
	}
	if ( $a['cta'] !== '' ) {
		$h .= '<a class="aaj-cta" href="' . esc_url( $a['cta'] ) . '">'
		    . esc_html( $L['nav_cta'] ) . ' &#10230;</a>';
	}
	$h .= '</div></nav>';
	$h .= aa_home_behaviour_script();

	/* SiteNavigationElement, so the sections are candidates for sitelinks. */
	$base = aa_home_self_url();
	if ( $base !== '' ) {
		$el = array();
		foreach ( $items as $n => $it ) {
			$el[] = array(
				'@type'    => 'SiteNavigationElement',
				'position' => $n + 1,
				'name'     => $it['label'],
				'url'      => $base . '#' . $it['id'],
			);
		}
		$h .= '<script type="application/ld+json">'
		    . wp_json_encode( array(
				'@context'        => 'https://schema.org',
				'@type'           => 'ItemList',
				'name'            => $L['eyebrow'],
				'itemListElement' => $el,
			), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
		    . '</script>';
	}

	return $h;
}
add_shortcode( 'aa_jump_menu', 'aa_home_jump_shortcode' );

/* ---------------------------------------------------------------------------
   B. THE TRACK TAB STRIP                                      [aa_home_tracks]
   --------------------------------------------------------------------------- */
function aa_home_tracks_shortcode( $atts ) {
	$a = shortcode_atts( array(
		'tracks' => '',
		'open'   => '',
	), $atts, 'aa_home_tracks' );

	$tr = aa_home_track_data( $a['tracks'] );
	if ( ! $tr ) { return ''; }
	$L = aa_home_copy_l10n();

	$open = 0;
	if ( $a['open'] !== '' ) {
		foreach ( $tr as $i => $t ) {
			if ( $t['cat'] === $a['open'] ) { $open = $i; break; }
		}
	}

	$h  = '<div class="aahs" data-aa="tracks">';
	$h .= '<div class="aahs-tabs" role="tablist" aria-label="' . esc_attr( $L['tablist'] ) . '">';
	foreach ( $tr as $i => $t ) {
		$on = ( $i === $open );
		$h .= '<button type="button" class="aahs-tab" role="tab"'
		    . ' id="aahs-tab-' . esc_attr( $t['cat'] ) . '"'
		    . ' aria-controls="aahs-panel-' . esc_attr( $t['cat'] ) . '"'
		    . ' aria-selected="' . ( $on ? 'true' : 'false' ) . '"'
		    . ' tabindex="' . ( $on ? '0' : '-1' ) . '">'
		    . '<span class="aahs-num" aria-hidden="true">' . sprintf( '%02d', $i + 1 ) . '</span>'
		    . '<span class="aahs-label">' . esc_html( $t['label'] ) . '</span>'
		    . '<span class="aahs-count" aria-hidden="true">' . count( $t['certs'] ) . '</span>'
		    . '</button>';
	}
	$h .= '</div>';

	foreach ( $tr as $i => $t ) {
		$on = ( $i === $open );
		$h .= '<div class="aahs-body" role="tabpanel"'
		    . ' id="aahs-panel-' . esc_attr( $t['cat'] ) . '"'
		    . ' aria-labelledby="aahs-tab-' . esc_attr( $t['cat'] ) . '"'
		    . ' data-open="' . ( $on ? 'true' : 'false' ) . '"'
		    . ' aria-hidden="' . ( $on ? 'false' : 'true' ) . '">';
		$h .= '<div class="aahs-inner">';
		$h .= '<div class="aahs-head"><h3>' . esc_html( $t['label'] ) . '</h3>'
		    . '<span class="aahs-bodycount">'
		    . esc_html( sprintf( $L['count'], count( $t['certs'] ) ) )
		    . '</span></div>';
		if ( $t['desc'] !== '' ) {
			$h .= '<p class="aahs-desc">' . esc_html( $t['desc'] ) . '</p>';
		}
		$h .= '<ul class="aahs-certs">';
		foreach ( $t['certs'] as $c ) {
			$li = ( $c['code'] !== '' ? '<b>' . esc_html( $c['code'] ) . '</b> ' : '' ) . esc_html( $c['name'] );
			$h .= '<li>' . ( $c['url'] !== ''
				? '<a href="' . esc_url( $c['url'] ) . '">' . $li . '</a>'
				: $li ) . '</li>';
		}
		$h .= '</ul>';
		$h .= '<div class="aahs-actions">';
		if ( $t['for'] !== '' ) {
			$h .= '<span class="aahs-for">' . esc_html( $t['for'] ) . '</span>';
		}
		$h .= '<a class="aahs-cta" href="' . esc_url( $t['href'] ) . '">'
		    . esc_html( $L['track_cta'] ) . ' &#10230;</a>';
		$h .= '</div>';
		$h .= '</div></div>';
	}
	$h .= '</div>';
	$h .= aa_home_behaviour_script();

	/* Scripts off: no tab can be switched, so every panel opens and the strip
	   becomes a plain index. Keep in step with the .aahs-nojs rules in the CSS. */
	$h .= '<noscript><style>'
	    . '.aahs .aahs-tabs{display:none}'
	    . '.aahs .aahs-body{grid-template-rows:minmax(0,1fr);opacity:1;visibility:visible;'
	    . 'border:1px solid var(--hs-line);margin-bottom:10px}'
	    . '.aahs .aahs-inner{padding:clamp(22px,2.4vw,30px)}'
	    . '</style></noscript>';

	/* The same content as structured data: a list of tracks, each with the
	   credentials inside it. Emitted here rather than in wp_head so it cannot
	   describe a strip the page did not render. */
	$el = array();
	foreach ( $tr as $i => $t ) {
		$sub = array();
		foreach ( $t['certs'] as $k => $c ) {
			$sub[] = array(
				'@type'    => 'ListItem',
				'position' => $k + 1,
				'name'     => ( $c['code'] !== '' ? $c['code'] . ' — ' : '' ) . $c['name'],
				'url'      => $c['url'] !== '' ? aa_home_abs_url( $c['url'] ) : null,
			);
		}
		$sub = array_map( function ( $x ) {
			if ( $x['url'] === null ) { unset( $x['url'] ); }
			return $x;
		}, $sub );

		$el[] = array(
			'@type'    => 'ListItem',
			'position' => $i + 1,
			'name'     => $t['label'],
			'url'      => aa_home_abs_url( $t['href'] ),
			'item'     => array(
				'@type'           => 'ItemList',
				'name'            => $t['label'],
				'description'     => $t['desc'],
				'numberOfItems'   => count( $t['certs'] ),
				'itemListElement' => $sub,
			),
		);
	}
	$h .= '<script type="application/ld+json">'
	    . wp_json_encode( array(
			'@context'        => 'https://schema.org',
			'@type'           => 'ItemList',
			'name'            => $L['tablist'],
			'numberOfItems'   => count( $tr ),
			'itemListElement' => $el,
		), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
	    . '</script>';

	return $h;
}
add_shortcode( 'aa_home_tracks', 'aa_home_tracks_shortcode' );

/**
 * THE SECTOR BAR UNDER THE HERO, OFF.
 *
 * "Trusted by · Banking · Government · Telecom · Healthcare · Insurance ·
 * Retail" sat between the hero and the in-page menu, pushing the menu a full
 * band further down the page and saying nothing a reader could act on -- six
 * sector nouns are not evidence, and the section names below them are.
 *
 * Switched off through the Home Hero snippet's own filter rather than by
 * deleting its markup, so it comes back in one line the day there are client
 * logos with permission behind it.
 */
add_filter( 'aa_hh_trust', '__return_empty_array' );
