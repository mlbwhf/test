<?php
/**
 * Agile Agilist — HOME PAGE HERO  [aa_home_hero]
 * =============================================================================
 * WPCode -> PHP Snippet, Auto Insert -> Run Everywhere. Name "AA – Home Hero".
 * Pairs with two more snippets:
 *     WPCode -> CSS Snippet         "AA – Home Hero CSS"  <- aa-home-hero.css
 *     WPCode -> JavaScript Snippet  "AA – Home Hero JS"   <- aa-home-hero.js
 *                                   (Site Wide Footer)
 *
 * Replaces the <section class="aa-hero"> block on the home page with the 1A
 * design: headline on the left, an interactive cohort picker on the right that
 * speaks the SAME vocabulary as the course pages (track chips, week groups, day
 * badge, seat status, price, next cohort preselected, one CTA that names the
 * dates it will book).
 *
 * WHAT THIS DELIBERATELY DOES NOT DO, and why
 * ---------------------------------------------------------------------------
 * 1. NO NAVIGATION. The design handoff shipped its own <nav> with a logo and a
 *    menu. The site already has a header and it is not this component's job to
 *    draw one, so that block is dropped entirely.
 *
 * 2. NO RATING, ANYWHERE. The handoff carried a visible "4.9 out of 2,500+"
 *    with five stars AND an aggregateRating in its JSON-LD. Google requires
 *    rating markup to be backed by reviews visible on the same page; markup
 *    that is not is the classic trigger for a structured-data manual action,
 *    and that penalty lands site-wide. There are no on-page reviews here, and
 *    a separate snippet strips aggregateRating from the whole site. Adding it
 *    back in the hero would fight that snippet and lose the argument with
 *    Google either way. "2,500+ certified" stays -- that is a count of people
 *    trained, not a rating.
 *
 * 3. NO CLASS-NAME COLLISION. The handoff's CSS uses .aa-hero, .aa-hero__grid
 *    and .aa-hero__badge -- the exact names the existing home page section
 *    already defines in Additional CSS. Two definitions of the same selector
 *    in one sheet is a coin toss decided by load order. Everything here is
 *    namespaced .aa-hh instead, so the old rules simply stop matching.
 *
 * 4. NO INVENTED PRICES. The handoff's sample data was Canadian (C$3,910 for
 *    SPC) -- an artefact of the old geo-IP snippet. Every price here comes from
 *    the same generated schedule the course pages sell from, so the homepage
 *    and the course page can never disagree. Amounts are USD; see the currency
 *    note below.
 *
 * 5. NO PASS OR REFUND PROMISE. What we say is that the exam fee is included
 *    and that exam prep and support come with the course. We do not promise a
 *    pass, a free retake, or a refund if someone does not pass.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* DOUBLE-LOAD GUARD — see the long note in the register snippet. PHP binds
   unconditional top-level functions at COMPILE time, so an early return does
   not prevent a redeclare fatal; only wrapping the declarations does. */
if ( ! function_exists( 'aa_hh_courses' ) ) :

/**
 * Which courses the hero offers, in priority order.
 *
 * Slugs, not records: every fact about a course -- name, price, duration,
 * schedule -- is resolved through aa_reg_course() from the register snippet,
 * which is the one place that knows them. Duplicating any of it here is how
 * the homepage ends up advertising a price the checkout will not honour.
 */
function aa_hh_courses() {
	return apply_filters( 'aa_hh_courses', array(
		'spc', 'aspc', 'rte',
		'ai-native-foundations', 'ai-native-change-agent', 'ai-native-ready-certification-2',
		'lpm', 'apm', 'sa', 'popm', 'scrum-master', 'arch', 'ase', 'devops', 'asm',
		'team-practitioner',
	) );
}

/**
 * One canonical name per track.
 *
 * The two sources disagree about wording for the same thing: the hand-written
 * course table says "Advanced SAFe", while a course resolved from its own page
 * takes the parent page's title, "SAFe Advanced". Left alone that renders two
 * chips for one track, each filtering to half of it. Anything not listed keeps
 * its own name, so a new section appears as itself rather than vanishing.
 */
function aa_hh_track( $crumb ) {
	$map = array(
		'Advanced SAFe'    => 'Advanced SAFe',
		'SAFe Advanced'    => 'Advanced SAFe',
		'SAFe Roles'       => 'SAFe Roles',
		'SAFe by Industry' => 'SAFe by Industry',
		'AI-Native'        => 'AI-Native',
	);
	$crumb = trim( (string) $crumb );
	return isset( $map[ $crumb ] ) ? $map[ $crumb ] : $crumb;
}

/** Seat count at or below which the row shows a scarcity chip instead of "Seats open". */
function aa_hh_seat_threshold() { return 6; }

/** How many batches the picker lists. Enough to fill the panel, not so many it scrolls forever. */
function aa_hh_limit() { return 12; }

/**
 * Every upcoming batch across the priority courses, soonest first.
 *
 * Returns rows the renderer can use directly. Silently skips a course the
 * register snippet cannot resolve -- a slug that was renamed, or a course page
 * that has lost its #aa-cohorts element -- rather than fataling the home page
 * over one bad entry.
 */
function aa_hh_rows() {
	static $rows = null;
	if ( $rows !== null ) { return $rows; }
	$rows = array();

	if ( ! function_exists( 'aa_reg_course' ) || ! function_exists( 'aa_reg_upcoming' ) ) {
		return $rows;   // register snippet not active; caller falls back
	}

	/* ONE ROW PER COURSE — the soonest batch of each, not the soonest batches
	   overall. Courses here run two or three times a week, so taking the next
	   twelve dates flat gives four RTEs, three SPCs and no AI-Native at all:
	   a panel that looks like a scheduling system rather than a catalogue, and
	   whose track chips are missing the tracks with less frequent classes.
	   Someone choosing a course wants to see the courses; the date they can
	   change on the course page. */
	foreach ( aa_hh_courses() as $slug ) {
		$course = aa_reg_course( $slug );
		if ( ! $course ) { continue; }
		$next = aa_reg_upcoming( $slug, $course );
		if ( ! $next ) { continue; }
		$rows[] = array( 'slug' => $slug, 'course' => $course, 'cohort' => $next[0] );
	}

	usort( $rows, function ( $a, $b ) {
		return strcmp( $a['cohort']['start'], $b['cohort']['start'] );
	} );
	return $rows = array_slice( $rows, 0, aa_hh_limit() );
}

/** "Week of Sep 14" — the group heading, and the key rows are grouped on. */
function aa_hh_week_label( $iso, $str ) {
	$d = new DateTime( $iso );
	$d->modify( 'monday this week' );
	return sprintf( $str['week_of'], $str['mon_short'][ (int) $d->format( 'n' ) - 1 ] . ' ' . $d->format( 'j' ) );
}

/** "Sep 14–17", or "Sep 30–Oct 2" across a month boundary. */
function aa_hh_range( $start, $end, $str ) {
	$s = new DateTime( $start );
	$e = new DateTime( $end );
	$m = function ( $d ) use ( $str ) { return $str['mon_short'][ (int) $d->format( 'n' ) - 1 ]; };
	if ( $s->format( 'Y-m-d' ) === $e->format( 'Y-m-d' ) ) { return $m( $s ) . ' ' . $s->format( 'j' ); }
	if ( $s->format( 'Y-m' ) === $e->format( 'Y-m' ) ) {
		return $m( $s ) . ' ' . $s->format( 'j' ) . '–' . $e->format( 'j' );
	}
	return $m( $s ) . ' ' . $s->format( 'j' ) . '–' . $m( $e ) . ' ' . $e->format( 'j' );
}

/** Chrome copy. Certification names are proper nouns and are never translated. */
function aa_hh_strings( $lang ) {
	$all = array(
		'en' => array(
			'badge'      => 'Land the role, lead the team, transform the organization',
			'h1a'        => 'Get certified by the people',
			'h1b'        => 'who',
			'h1em'       => 'run the transformations.',
			'sub'        => 'Live, instructor-led SAFe® and AI-Native certification that gets professionals hired and promoted. Exam fee included, with exam prep and support throughout.',
			'cta_browse' => 'Browse all cohorts',
			'cta_dated'  => 'Reserve %s · %s',
			'results'    => 'See client results',
			'certified'  => '2,500+ certified',
			'eyebrow'    => 'Next cohorts',
			'season'     => 'Live online · next %d weeks',
			'count_all'  => '%d upcoming batches',
			'count_one'  => '1 upcoming batch',
			'count_filt' => '%1$d of %2$d batches',
			'all_tracks' => 'All tracks',
			'week_of'    => 'Week of %s',
			'batches'    => '%d batches',
			'batch_one'  => '1 batch',
			'next_avail' => 'Next available',
			'seats_open' => 'Seats open',
			'seats_left' => '%d seats left',
			'weekday'    => 'Weekday',
			'weekend'    => 'Weekend',
			'no_match'   => 'No batches match this track.',
			'buy_for'    => 'Registering for %1$s · %2$s',
			'foot'       => 'All batches run live in English.',
			'foot_link'  => 'Full calendar',
			'empty'      => 'See all upcoming cohorts',
			'trust'      => 'Trusted by',
			'currency'   => 'Prices shown in USD. Cards are charged in USD; if your card is issued in another currency your bank sets the exchange rate and may add its own fee, so the amount on your statement can differ. The exact amount is shown before you pay.',
			'mon_short'  => array( 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ),
		),
	);
	return isset( $all[ $lang ] ) ? $all[ $lang ] : $all['en'];
}

/**
 * The trust row. Sectors, not client names or logos.
 *
 * The handoff shipped six placeholder names. Naming a client -- or showing
 * their mark -- needs their permission, and "Gov of Canada" in particular is
 * a claim worth being able to evidence. Sectors say the same thing about
 * reach and need nobody's sign-off. Swap in real logos through the filter
 * once permissions exist.
 */
function aa_hh_trust() {
	return apply_filters( 'aa_hh_trust', array(
		'Banking', 'Government', 'Telecom', 'Healthcare', 'Insurance', 'Retail',
	) );
}

function aa_hh_render( $atts ) {
	$a = shortcode_atts( array( 'lang' => 'en' ), $atts, 'aa_home_hero' );
	$str  = aa_hh_strings( $a['lang'] );
	$rows = aa_hh_rows();

	$h = '<section class="aa-hh" aria-labelledby="aa-hh-h1">';

	/* ---------- left column: the pitch ---------- */
	$h .= '<div class="aa-hh-grid"><div class="aa-hh-pitch">'
	    . '<p class="aa-hh-badge"><span class="aa-hh-dot" aria-hidden="true"></span>'
	    . esc_html( $str['badge'] ) . '</p>'
	    . '<h1 class="aa-hh-title" id="aa-hh-h1"><span>' . esc_html( $str['h1a'] ) . '</span>'
	    . '<span>' . esc_html( $str['h1b'] ) . ' <em>' . esc_html( $str['h1em'] ) . '</em></span></h1>'
	    . '<p class="aa-hh-sub">' . esc_html( $str['sub'] ) . '</p>';

	/* The CTA is rendered with a real destination and real text, then kept in
	   sync by JS as the selection changes. A JS-only label would be an empty
	   button for anything that does not run scripts, and this is the primary
	   call to action on the site's most-linked page. */
	$first = $rows ? $rows[0] : null;
	$cta_href = $first
		? aa_hh_enrol_url( $first )
		: '/training/';
	$cta_text = $first
		? sprintf( $str['cta_dated'],
			aa_hh_range( $first['cohort']['start'], $first['cohort']['end'], $str ),
			$first['course']['code'] )
		: $str['cta_browse'];

	$h .= '<div class="aa-hh-actions">'
	    . '<a class="aa-hh-cta" data-hh-cta href="' . esc_url( $cta_href ) . '">'
	    . '<span data-hh-cta-label>' . esc_html( $cta_text ) . '</span>'
	    . '<i aria-hidden="true">&#10230;</i></a>'
	    . '<p class="aa-hh-meta"><strong>' . esc_html( $str['certified'] ) . '</strong>'
	    . '<span aria-hidden="true">·</span>'
	    . '<a href="/customers/">' . esc_html( $str['results'] ) . ' &#10230;</a></p>'
	    . '</div></div>';

	/* ---------- right column: the picker ---------- */
	$h .= '<div class="aa-hh-pick" id="aa-cohorts">';

	if ( ! $rows ) {
		/* Never an empty panel. Without the register snippet there is no
		   schedule to show, so send people to the page that has one. */
		$h .= '<a class="aa-hh-empty" href="/training/">' . esc_html( $str['empty'] ) . ' &#10230;</a>'
		    . '</div></div></section>';
		return $h;
	}

	$tracks = array();
	foreach ( $rows as $r ) {
		$t = aa_hh_track( $r['course']['crumb'] );
		if ( $t !== '' && ! in_array( $t, $tracks, true ) ) { $tracks[] = $t; }
	}

	$weeks_ahead = 0;
	$last_start  = end( $rows );
	if ( $last_start ) {
		$weeks_ahead = (int) ceil(
			( strtotime( $last_start['cohort']['start'] ) - time() ) / ( 7 * DAY_IN_SECONDS )
		);
	}

	$h .= '<div class="aa-hh-pickhead"><div>'
	    . '<p class="aa-hh-eyebrow"><span class="aa-hh-dot aa-hh-dot--warm" aria-hidden="true"></span>'
	    . esc_html( $str['eyebrow'] ) . '</p>'
	    . '<p class="aa-hh-season">' . esc_html( sprintf( $str['season'], max( 1, $weeks_ahead ) ) ) . '</p></div>'
	    . '<p class="aa-hh-count" data-hh-count aria-live="polite">'
	    . esc_html( count( $rows ) === 1 ? $str['count_one'] : sprintf( $str['count_all'], count( $rows ) ) )
	    . '</p></div>';

	$h .= '<div class="aa-hh-chips" role="group" aria-label="Filter by track">'
	    . '<button type="button" class="aa-hh-chip is-on" data-hh-track="" aria-pressed="true">'
	    . esc_html( $str['all_tracks'] ) . '</button>';
	foreach ( $tracks as $t ) {
		$h .= '<button type="button" class="aa-hh-chip" data-hh-track="' . esc_attr( $t )
		    . '" aria-pressed="false">' . esc_html( $t ) . '</button>';
	}
	$h .= '</div>';

	/* Rows, grouped by week. Server-rendered, so the dates are real text in
	   the HTML for crawlers and for anything reading the page without JS. */
	$by_week = array();
	foreach ( $rows as $r ) {
		$k = aa_hh_week_label( $r['cohort']['start'], $str );
		if ( ! isset( $by_week[ $k ] ) ) { $by_week[ $k ] = array(); }
		$by_week[ $k ][] = $r;
	}

	$h .= '<div class="aa-hh-list" data-hh-list>';
	$n = 0;
	foreach ( $by_week as $label => $group ) {
		$h .= '<section class="aa-hh-week" data-hh-week>'
		    . '<div class="aa-hh-weekhead"><h2>' . esc_html( $label ) . '</h2>'
		    . '<p data-hh-weekcount>' . esc_html( count( $group ) === 1 ? $str['batch_one'] : sprintf( $str['batches'], count( $group ) ) )
		    . '</p></div><div class="aa-hh-rows">';
		foreach ( $group as $r ) {
			$h .= aa_hh_row( $r, $str, $n === 0 );
			$n++;
		}
		$h .= '</div></section>';
	}
	$h .= '<p class="aa-hh-nomatch" data-hh-nomatch hidden>' . esc_html( $str['no_match'] ) . '</p>';
	$h .= '</div>';

	/* ---------- checkout, in place ----------
	   One form for the whole panel, retargeted as the selection changes,
	   rather than twelve forms nobody will use eleven of. It posts the batch
	   id and nothing else about the course: aa_reg_find() resolves that id to
	   its course server-side, so the home page never has to know -- or be able
	   to influence -- what anything costs. */
	if ( function_exists( 'aa_reg_inline' ) && function_exists( 'aa_reg_is_live' ) ) {
		$first = $rows[0];
		$h .= '<div class="aa-hh-buy" id="aa-hh-buy">'
		    . '<p class="aa-hh-buyhead" data-hh-buyhead>'
		    . esc_html( sprintf( $str['buy_for'],
		        aa_hh_range( $first['cohort']['start'], $first['cohort']['end'], $str ),
		        $first['course']['code'] ) )
		    . '</p>'
		    . aa_reg_inline( $first['course'], $first['cohort'], $first['course']['currency'], 'aahh' )
		    . '</div>';
		$h .= aa_hh_config_script();
	}

	$h .= '<p class="aa-hh-foot">' . esc_html( $str['foot'] )
	    . ' <a href="/training/">' . esc_html( $str['foot_link'] ) . ' &#10230;</a></p>';

	/* The currency disclaimer sits with the prices it qualifies, not in a
	   footer nobody reads. Small, but present on the same screen as the
	   number and before anything is clicked. */
	$h .= '<p class="aa-hh-legal">' . esc_html( $str['currency'] ) . '</p>';

	$h .= '</div></div>';

	/* ---------- trust row ---------- */
	$h .= '<div class="aa-hh-trust"><span class="aa-hh-trust-label">' . esc_html( $str['trust'] ) . '</span>';
	foreach ( aa_hh_trust() as $t ) {
		$h .= '<span class="aa-hh-trust-item">' . esc_html( $t ) . '</span>';
	}
	$h .= '</div>';

	$h .= '</section>';
	$h .= aa_hh_schema( $rows );
	return $h;
}

/**
 * window.AA_REG for a page that is not a course page.
 *
 * The in-place checkout handler in aa-register.js reads its endpoint, nonce and
 * currency from window.AA_REG. On a course page the register block emits that;
 * the home page has no register block, so it is emitted here -- with NO
 * `course` and NO `dates`, because neither is true of a page showing twelve
 * different courses. The handler only consults those two when a form carries
 * data-start, and these forms carry data-cohort instead.
 *
 * Guarded on the client rather than the server: if a course page ever includes
 * this hero, the register block's config is the fuller one and must win.
 */
function aa_hh_config_script() {
	if ( ! function_exists( 'aa_reg_is_live' ) ) { return ''; }
	$live = aa_reg_is_live();

	return '<script>window.AA_REG=window.AA_REG||' . wp_json_encode( array(
		'checkout'       => $live ? esc_url_raw( rest_url( 'aa/v1/checkout' ) ) : null,
		/* Stripe opens in a NEW TAB from here. The home page is not a checkout
		   page -- someone reading it has usually not finished reading it -- and
		   replacing it with a card form ends the visit whether or not they buy.
		   Course pages keep the same tab: there, buying is the errand. */
		'target'         => '_blank',
		'symbol'         => '$',
		'locale'         => 'en-US',
		'nonce'          => wp_create_nonce( 'wp_rest' ),
		'msgSending'     => 'Taking you to Stripe…',
		'msgError'       => 'We could not start checkout. Please try again.',
		'msgUnavailable' => 'Registration is not available right now.',
	) ) . ';</script>';
}

/** Where a row's CTA goes: the course page's enrol section, on that batch. */
function aa_hh_enrol_url( $r ) {
	$url = $r['course']['url'];
	return $url . ( strpos( $url, '?' ) === false ? '?' : '&' )
	     . 'cohort=' . rawurlencode( $r['cohort']['id'] ) . '#enroll';
}

function aa_hh_row( $r, $str, $is_first ) {
	$c     = $r['course'];
	$co    = $r['cohort'];
	$start = new DateTime( $co['start'] );
	$left  = function_exists( 'aa_reg_seats_left' ) ? aa_reg_seats_left( $c, $co ) : null;
	$low   = ( $left !== null && $left <= aa_hh_seat_threshold() );

	$kind = in_array( (int) $start->format( 'N' ), array( 6, 7 ), true )
		? $str['weekend'] : $str['weekday'];
	$range = aa_hh_range( $co['start'], $co['end'], $str );

	$status = $low
		? sprintf( $str['seats_left'], (int) $left )
		: $str['seats_open'];

	$aria = $c['name'] . ', ' . $range . ', ' . $kind . ', $' . number_format_i18n( $c['price'] );

	return '<button type="button" class="aa-hh-row' . ( $is_first ? ' is-on' : '' ) . '"'
	     . ' data-hh-row'
	     . ' data-cohort="' . esc_attr( $co['id'] ) . '"'
	     . ' data-start="' . esc_attr( $co['start'] ) . '"'
	     . ' data-track="' . esc_attr( aa_hh_track( $c['crumb'] ) ) . '"'
	     . ' data-code="' . esc_attr( $c['code'] ) . '"'
	     . ' data-range="' . esc_attr( $range ) . '"'
	     . ' data-price="' . (int) $c['price'] . '"'
	     . ' data-href="' . esc_attr( aa_hh_enrol_url( $r ) ) . '"'
	     . ' aria-pressed="' . ( $is_first ? 'true' : 'false' ) . '"'
	     . ' aria-label="' . esc_attr( $aria ) . '">'
	     . '<span class="aa-hh-date"><span class="aa-hh-day">' . esc_html( $start->format( 'j' ) ) . '</span>'
	     . '<span class="aa-hh-mon">' . esc_html( strtoupper( $str['mon_short'][ (int) $start->format( 'n' ) - 1 ] ) ) . '</span></span>'
	     . '<span class="aa-hh-main"><span class="aa-hh-top">'
	     . '<span class="aa-hh-name">' . esc_html( $c['name'] ) . '</span>'
	     . ( $is_first ? '<span class="aa-hh-flag">' . esc_html( $str['next_avail'] ) . '</span>' : '' )
	     . '</span><span class="aa-hh-rowmeta"><span>' . esc_html( $range . ' · ' . $kind ) . '</span>'
	     . '<span class="aa-hh-status' . ( $low ? ' is-low' : '' ) . '">' . esc_html( $status ) . '</span>'
	     . '</span></span>'
	     . '<span class="aa-hh-end"><span class="aa-hh-price">$'
	     . esc_html( number_format_i18n( $c['price'] ) ) . '</span>'
	     . '<span class="aa-hh-check" aria-hidden="true">&#10003;</span></span></button>';
}

/**
 * Course / CourseInstance JSON-LD for the batches actually printed above.
 *
 * NO aggregateRating and NO review. See the header note: there are no on-page
 * reviews to back a rating, a site-wide snippet strips the property anyway,
 * and unsupported rating markup risks a manual action across the whole
 * domain. Offers carry priceCurrency USD, matching what Stripe charges.
 */
function aa_hh_schema( $rows ) {
	if ( ! $rows ) { return ''; }
	$graph = array();
	foreach ( $rows as $r ) {
		$c  = $r['course'];
		$co = $r['cohort'];
		$graph[] = array(
			'@type'       => 'Course',
			'name'        => $c['name'],
			'url'         => home_url( $c['url'] ),
			'provider'    => array(
				'@type' => 'Organization',
				'name'  => 'Agile Agilist',
				'url'   => home_url( '/' ),
			),
			'hasCourseInstance' => array(
				'@type'         => 'CourseInstance',
				'courseMode'    => 'online',
				'startDate'     => $co['start'],
				'endDate'       => $co['end'],
				'courseWorkload' => 'P' . (int) $c['days'] . 'D',
				'location'      => array( '@type' => 'VirtualLocation', 'url' => home_url( $c['url'] ) ),
				'offers'        => array(
					'@type'         => 'Offer',
					'price'         => (string) $c['price'],
					'priceCurrency' => 'USD',
					'availability'  => 'https://schema.org/InStock',
					'url'           => home_url( aa_hh_enrol_url( $r ) ),
				),
			),
		);
	}
	return '<script type="application/ld+json">'
	     . wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => $graph ) )
	     . '</script>';
}

add_shortcode( 'aa_home_hero', 'aa_hh_render' );

/**
 * Swap the existing home hero for this one, with no page edit.
 *
 * The home page's hero is <section class="aa-hero"> inside classic content, so
 * there is no block to filter -- the swap happens on the_content instead,
 * replacing that one section and leaving the other eight untouched.
 *
 * Switched off with the aa_hh_autoplace option, exactly like the register
 * snippet's swap, so it can be reverted without touching the page.
 */
function aa_hh_autoplace_on() {
	return get_option( 'aa_hh_autoplace', 'yes' ) !== 'no';
}

function aa_hh_swap( $content ) {
	if ( is_admin() || ! is_front_page() || ! aa_hh_autoplace_on() ) { return $content; }
	if ( strpos( $content, 'aa-hh' ) !== false ) { return $content; }   // already ours
	if ( strpos( $content, 'aa-hero' ) === false ) { return $content; }

	/* Match the hero section and nothing else. Anchored on the opening tag's
	   own class attribute and closed on the FIRST </section> that balances it,
	   counted rather than matched lazily -- the hero contains no nested
	   <section>, but a lazy match would silently eat the next eight if that
	   ever changed. */
	$open = '<section class="aa-hero"';
	$i = strpos( $content, $open );
	if ( $i === false ) { return $content; }

	$depth = 0;
	$pos   = $i;
	$end   = false;
	while ( preg_match( '#</?section\b#i', $content, $m, PREG_OFFSET_CAPTURE, $pos ) ) {
		$at  = $m[0][1];
		$tag = $m[0][0];
		$pos = $at + strlen( $tag );
		if ( $tag[1] === '/' ) {
			$depth--;
			if ( $depth === 0 ) {
				$close = strpos( $content, '>', $at );
				if ( $close !== false ) { $end = $close + 1; }
				break;
			}
		} else {
			$depth++;
		}
	}
	if ( $end === false ) { return $content; }

	return substr( $content, 0, $i ) . aa_hh_render( array() ) . substr( $content, $end );
}
add_filter( 'the_content', 'aa_hh_swap', 8 );

/** Settings -> AA Home Hero: the one switch, so the swap can be reverted. */
add_action( 'admin_menu', function () {
	add_options_page( 'AA Home Hero', 'AA Home Hero', 'manage_options', 'aa-hh', function () {
		echo '<div class="wrap"><h1>AA Home Hero</h1><form method="post" action="options.php">';
		settings_fields( 'aa_hh' );
		$on = aa_hh_autoplace_on();
		echo '<table class="form-table"><tr><th>Replace the home page hero</th><td>'
		   . '<label><input type="checkbox" name="aa_hh_autoplace" value="yes" '
		   . checked( $on, true, false ) . '> Swap the old hero for the cohort picker</label>'
		   . '<p class="description">No page edit either way &mdash; the swap happens as the page renders, '
		   . 'and unticking this puts the old hero straight back.</p></td></tr></table>';
		submit_button();
		echo '</form></div>';
	} );
} );
add_action( 'admin_init', function () {
	register_setting( 'aa_hh', 'aa_hh_autoplace', array(
		'sanitize_callback' => function ( $v ) { return $v === 'yes' ? 'yes' : 'no'; },
		'default'           => 'yes',
	) );
} );

endif; // double-load guard
