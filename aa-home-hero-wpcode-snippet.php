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
		/* ADVANCED SAFe */
		'aspc',                             // Advanced Practice Consultant
		'spc',                              // Implementing SAFe
		'rte',                              // Release Train Engineer
		'lpm',                              // Lean Portfolio Management
		'apm',                              // Agile Product Management

		/* FOUNDATIONAL */
		'sa',                               // Leading SAFe
		'scrum-master',                     // SAFe Scrum Master (SSM)
		'popm',                             // Product Owner / Product Manager

		/* AI-NATIVE */
		'ai-native-foundations',
		'ai-native-change-agent',           // AI-Native Value Architect
		'ai-native-ready-certification-2',  // Leading the AI-Native Organization
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
function aa_hh_track( $crumb, $slug = '' ) {
	/* BY COURSE FIRST, BECAUSE THE PARENT PAGE IS NOT A CATEGORY.
	   The track used to come only from the course's parent page title, which
	   grouped by where a page lives rather than what the course is: everything
	   under /training/safe/ became "SAFe Roles" whether it was Leading SAFe or
	   Lean Portfolio Management, and ARCH and ASE became "SAFe by Industry"
	   because of the folder they sit in, not because they are industry courses.

	   Scaled Agile's own split is foundational versus advanced, so that is what
	   this maps to. Assignment is per course and editable in one place. The two
	   worth arguing about are SPC and ASPC -- consultant credentials rather than
	   role credentials -- which sit under Advanced here because that is where a
	   buyer would look for them. */
	$by_slug = array(
		// Foundational — the entry courses, no prerequisites.
		'sa'                => 'Foundational',   // Leading SAFe
		'team-practitioner' => 'Foundational',   // SAFe for Teams
		'scrum-master'      => 'Foundational',   // SAFe Scrum Master
		'popm'              => 'Foundational',   // Product Owner / Product Manager
		'devops'            => 'Foundational',   // SAFe DevOps

		// Advanced — role and specialist credentials, most assuming a prerequisite.
		'asm'               => 'Advanced SAFe',  // Advanced Scrum Master
		'rte'               => 'Advanced SAFe',
		'lpm'               => 'Advanced SAFe',
		'apm'               => 'Advanced SAFe',
		'arch'              => 'Advanced SAFe',  // was "SAFe by Industry"
		'ase'               => 'Advanced SAFe',  // was "SAFe by Industry"
		'spc'               => 'Advanced SAFe',
		'aspc'              => 'Advanced SAFe',

		// AI-Native — its own track, and the reason the industry chip went.
		'ai-native-foundations'           => 'AI-Native',
		'ai-native-change-agent'          => 'AI-Native',
		'ai-native-ready-certification-2' => 'AI-Native',
	);
	$slug = trim( (string) $slug );
	if ( $slug !== '' && isset( $by_slug[ $slug ] ) ) { return $by_slug[ $slug ]; }

	/* Fallback for a course not listed above -- a new page, or one resolved
	   from its own #aa-cohorts element. It keeps the old crumb behaviour so a
	   new course appears as itself rather than vanishing from every chip. */
	$map = array(
		'Advanced SAFe'    => 'Advanced SAFe',
		'SAFe Advanced'    => 'Advanced SAFe',
		'SAFe Roles'       => 'Foundational',
		'SAFe by Industry' => 'Advanced SAFe',
		'AI-Native'        => 'AI-Native',
	);
	$crumb = trim( (string) $crumb );
	return isset( $map[ $crumb ] ) ? $map[ $crumb ] : $crumb;
}

/** Display order for the chips: where a buyer starts, then depth, then AI. */
function aa_hh_track_order() {
	return array( 'Foundational', 'Advanced SAFe', 'AI-Native' );
}

/** Seat count at or below which the row shows a scarcity chip instead of "Seats open". */
function aa_hh_seat_threshold() { return 6; }

/**
 * How many batches the picker lists.
 *
 * WAS 12, AGAINST A CATALOGUE OF 16. One row per course, sorted by date, then
 * sliced -- and the SAFe courses run two or three times a week while the
 * AI-Native ones are monthly, so every SAFe course had a date in the next three
 * days and all three AI-Native courses sat at Sep 3, 10 and 17. Sorting by date
 * put them last and the slice removed them: the home page showed twelve SAFe
 * courses all starting the same Monday, no AI-Native track at all, and nothing
 * dated past August. The newest and most strategic track was the one the cap
 * silently deleted.
 *
 * A GLOBAL CAP IS THE WRONG SHAPE. Raising it to fit all sixteen only turned a
 * truncated list into a long one -- thirteen courses sharing one Monday under a
 * single week heading, which tells a visitor nothing about what we teach. The
 * cap that matters is per track, below. This one is the ceiling for the panel
 * as a whole and should sit above what the per-track caps can produce.
 */
function aa_hh_limit() { return 14; }

/**
 * How many courses each track may show.
 *
 * The panel is a catalogue, so its job is to show the SHAPE of what we teach --
 * three tracks, a few courses each -- not to list every date we run. Thirteen
 * SAFe courses and three AI-Native ones, sorted by a date they mostly share,
 * reads as a scheduling dump; four per track reads as a menu.
 *
 * Within a track the order is aa_hh_courses(), which is a curated priority
 * list, NOT the date -- the dates tie, so sorting by them picked essentially at
 * random. Reorder that list to change which courses lead a track.
 *
 * 6, not 4: aa_hh_courses() is now itself the curation -- eleven named courses
 * rather than everything we run -- so this no longer decides what appears, it
 * only stops one track swamping the panel if that list grows. Advanced SAFe
 * currently holds five, so a cap of 4 would have quietly dropped APM: the same
 * failure as the old global slice, one level down. Keep this above the largest
 * track.
 */
function aa_hh_per_track() { return 6; }

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
	$priority = 0;
	foreach ( aa_hh_courses() as $slug ) {
		$course = aa_reg_course( $slug );
		if ( ! $course ) { continue; }
		$next = aa_reg_upcoming( $slug, $course );
		if ( ! $next ) { continue; }
		$rows[] = array(
			'slug'     => $slug,
			'course'   => $course,
			'cohort'   => $next[0],
			/* Position in aa_hh_courses(), kept so the curated order survives
			   the sort. Every SAFe course starts the same Monday, so date alone
			   leaves the tie to be broken by whatever order they came back in. */
			'priority' => $priority++,
		);
	}

	/* Curated order within a track; date only decides between tracks, below.
	   A plain sort by date was what deleted the AI-Native track: "soonest" and
	   "most frequent" are the same thing, so the monthly courses sorted last
	   and the cap removed them -- the track a visitor is least likely to
	   stumble on was the one guaranteed to be dropped. */
	usort( $rows, function ( $a, $b ) {
		return $a['priority'] <=> $b['priority'];
	} );

	$kept    = array();
	$per     = array();
	foreach ( $rows as $r ) {
		if ( count( $kept ) >= aa_hh_limit() ) { break; }
		$t = aa_hh_track( isset( $r['course']['crumb'] ) ? $r['course']['crumb'] : '', $r['slug'] );
		$n = isset( $per[ $t ] ) ? $per[ $t ] : 0;
		if ( $n >= aa_hh_per_track() ) { continue; }
		$per[ $t ] = $n + 1;
		$kept[]    = $r;
	}

	/* Back into date order for display: the panel still reads soonest first,
	   it is just no longer the thing that decides membership. */
	usort( $kept, function ( $a, $b ) {
		return strcmp( $a['cohort']['start'], $b['cohort']['start'] ) ?: ( $a['priority'] <=> $b['priority'] );
	} );
	return $rows = $kept;
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
			/* Two forms, because the first cohort is often days away and
			   "next 1 weeks" is the sort of thing a buyer reads as neglect. */
			'brief_label' => 'You\'re looking at',
			'brief_day'   => '%d day',
			'brief_days'  => '%d days',
			'brief_exam'  => 'Exam fee included',
			'brief_leads' => 'Leads to',
			'brief_learn' => 'You\'ll learn',
			'season'     => 'Live online · next %d weeks',
			'season_one' => 'Live online · next week',
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

/* =============================================================================
   COURSE BRIEF — the left column's empty space, filled by the selection
   -----------------------------------------------------------------------------
   The pitch column is about 300px of copy beside a 740px card, and the handoff
   proposes using that gap rather than closing it: show the selected course's
   brief under the CTA, swapped as the visitor clicks rows.

   THE CONTENT COMES FROM THE CATALOGUE, NOT THE HANDOFF'S JSON. That file says
   of itself that it is "inferred, not supplied by the client" and asks for
   validation before launch -- and it is wrong in the ways that matter: it
   invents contact hours ("4 days - 32 hrs"), and it asserts what an SPC is
   licensed to teach, which is Scaled Agile's to define and not ours to claim
   on a home page. Every field below is instead read from aa_reg_course(), the
   same record the course page and the checkout use, so the hero cannot say
   something the course page contradicts.

     title  <- the course's own name
     desc   <- its published lede
     days   <- its real duration
     exam   <- "Exam fee included", true of every course we sell
     level  <- the track, from aa_hh_track()

   OUTCOMES ARE DELIBERATELY EMPTY. The design calls for three verb-first
   outcomes per course and the catalogue has nothing that honestly fills that
   shape -- 'proof' is a facts list ("Live online", "Exam fee included") and
   would just restate the pills. Rather than ship invented ones, the block
   renders only for courses with real entries in aa_hh_outcomes(). Fill that in
   from each course page's own curriculum section and the block appears.
   ========================================================================== */

/**
 * Three verb-first outcomes per course slug. Empty by default -- see above.
 *
 * Six words or fewer, and true of the course as published. A course with no
 * entry renders the brief without the outcomes grid, which is a complete panel,
 * not a broken one.
 */
function aa_hh_outcomes() {
	return apply_filters( 'aa_hh_outcomes', array(
		/* 'rte' => array( 'Facilitate PI Planning', 'Run System Demos and I&A', 'Coach the ART' ), */
	) );
}

/**
 * The career line and the curriculum line, read off the course's own page.
 *
 * A hand-kept table was the obvious way and the wrong one: eleven courses of
 * copy maintained in a snippet, drifting from the pages it describes the first
 * time anyone edits a curriculum. These two lines already exist, written and
 * approved, in every course page -- the "Roles you'll qualify for" grid and the
 * first curriculum module. So they are read from there, and the home page says
 * what the course page says because it is literally the same sentence.
 *
 * Cached for twelve hours. Eleven page reads on the home page would otherwise
 * be eleven queries per uncached view; curriculum copy changes a few times a
 * year. Bump the key's version suffix to force a refresh.
 *
 * Anything it cannot find is simply absent -- a course whose page does not use
 * this template renders the brief without these lines rather than with empty
 * ones.
 */
function aa_hh_page_bits( $slug ) {
	static $memo = array();
	$lang = function_exists( 'aa_reg_lang' ) ? aa_reg_lang() : 'en';
	$key  = $lang . '|' . $slug;
	if ( isset( $memo[ $key ] ) ) { return $memo[ $key ]; }

	$tkey = 'aa_hh_bits_v1_' . $lang . '_' . $slug;
	$hit  = function_exists( 'get_transient' ) ? get_transient( $tkey ) : false;
	if ( is_array( $hit ) ) { return $memo[ $key ] = $hit; }

	$out = array( 'career' => '', 'learn' => '' );

	if ( ! preg_match( '/^[a-z0-9-]{2,80}$/', $slug ) || ! function_exists( 'get_posts' ) ) {
		return $memo[ $key ] = $out;
	}

	$pages = get_posts( array(
		'post_type'        => 'page',
		'name'             => $slug,
		'post_status'      => 'publish',
		'numberposts'      => 5,
		'suppress_filters' => true,
	) );

	foreach ( $pages as $pg ) {
		if ( function_exists( 'aa_reg_lang' ) && aa_reg_lang( $pg ) !== $lang ) { continue; }
		$c = $pg->post_content;

		/* CAREER — the role names under "Roles you'll qualify for". Matched from
		   that caption forward so the h3s of other sections cannot be mistaken
		   for roles. Three is what fits the measure. */
		if ( preg_match( '/aa-cap[^>]*>\s*Roles[^<]*<\/div>(.*)$/is', $c, $m )
			&& preg_match_all( '/<h3\b[^>]*>(.*?)<\/h3>/is', $m[1], $r ) ) {
			$roles = array();
			foreach ( $r[1] as $one ) {
				$one = trim( wp_strip_all_tags( $one ) );
				if ( $one !== '' ) { $roles[] = $one; }
				if ( count( $roles ) === 3 ) { break; }
			}
			if ( $roles ) { $out['career'] = implode( ', ', $roles ); }
		}

		/* LEARN — the first curriculum module's own one-liner, or its heading
		   when the page writes no description under it. */
		if ( preg_match(
			'#<h3\b[^>]*class="[^"]*aa-mod-h[^"]*"[^>]*>(.*?)</h3>\s*<p\b[^>]*class="[^"]*aa-mod-p[^"]*"[^>]*>(.*?)</p>#is',
			$c, $m2 ) ) {
			$out['learn'] = trim( wp_strip_all_tags( $m2[2] ) );
		} elseif ( preg_match( '#<h3\b[^>]*class="[^"]*aa-mod-h[^"]*"[^>]*>(.*?)</h3>#is', $c, $m3 ) ) {
			$out['learn'] = trim( wp_strip_all_tags( $m3[1] ) );
		}
		break;
	}

	if ( function_exists( 'set_transient' ) ) {
		set_transient( $tkey, $out, 12 * HOUR_IN_SECONDS );
	}
	return $memo[ $key ] = $out;
}

/** The brief for one row, or null when the course cannot supply one. */
/**
 * The course preselected when the page loads.
 *
 * NOT simply the first row. The panel is ordered by date, so whichever course
 * happens to run soonest would take the CTA, the brief and the tick -- and that
 * changes week to week for reasons nobody chose. Reordering aa_hh_courses() to
 * put ASPC first moved the preselection off SPC without anyone asking it to,
 * which is exactly the accident this prevents.
 *
 * SPC is the flagship and the anchor date, so it is what the button offers to
 * reserve unless it has no upcoming batch, in which case the soonest row takes
 * over rather than leaving the hero with nothing selected.
 */
function aa_hh_anchor() {
	return apply_filters( 'aa_hh_anchor', 'spc' );
}

/** The row the hero opens on: the anchor course if it is running, else soonest. */
function aa_hh_selected( $rows ) {
	if ( ! $rows ) { return null; }
	$anchor = aa_hh_anchor();
	foreach ( $rows as $r ) {
		if ( $r['slug'] === $anchor ) { return $r; }
	}
	return $rows[0];
}

function aa_hh_brief( $r, $str ) {
	if ( empty( $r['course'] ) ) { return null; }
	$c = $r['course'];

	$desc = isset( $c['lede'] ) ? trim( (string) $c['lede'] ) : '';
	if ( $desc === '' ) { return null; }   // nothing to say; the panel hides

	$days = isset( $c['days'] ) ? (int) $c['days'] : 0;
	$all  = aa_hh_outcomes();
	$slug = $r['slug'];

	return array(
		'track'    => aa_hh_track( isset( $c['crumb'] ) ? $c['crumb'] : '', $slug ),
		'name'     => isset( $c['name'] ) ? $c['name'] : $c['code'],
		'desc'     => $desc,
		'meta'     => array_values( array_filter( array(
			$days > 0 ? sprintf( $days === 1 ? $str['brief_day'] : $str['brief_days'], $days ) : '',
			$str['brief_exam'],
			aa_hh_track( isset( $c['crumb'] ) ? $c['crumb'] : '', $slug ),
		) ) ),
		'outcomes' => isset( $all[ $slug ] ) ? array_slice( (array) $all[ $slug ], 0, 3 ) : array(),
		'points'   => aa_hh_page_bits( $slug ),
	);
}

/** The panel's markup for one brief. Shared by the server render and the JS swap. */
function aa_hh_brief_html( $b, $str ) {
	if ( ! $b ) { return ''; }

	$glyphs = array( '&#9727;', '&#9670;', '&#9650;' );   // duration, exam, level

	$h  = '<div class="aa-hh-brief-eyebrow">'
	    . '<span class="aa-hh-brief-label">' . esc_html( $str['brief_label'] ) . '</span>'
	    . '<span class="aa-hh-brief-rule" aria-hidden="true"></span>'
	    . '<span class="aa-hh-brief-track">' . esc_html( $b['track'] ) . '</span></div>';

	$h .= '<h2 class="aa-hh-brief-title">' . esc_html( $b['name'] ) . '</h2>';
	$h .= '<p class="aa-hh-brief-desc">' . esc_html( $b['desc'] ) . '</p>';

	if ( $b['meta'] ) {
		$h .= '<ul class="aa-hh-brief-meta">';
		foreach ( array_values( $b['meta'] ) as $i => $m ) {
			$h .= '<li class="aa-hh-brief-pill"><span class="aa-hh-brief-icon" aria-hidden="true">'
			    . ( isset( $glyphs[ $i ] ) ? $glyphs[ $i ] : $glyphs[0] ) . '</span>'
			    . esc_html( $m ) . '</li>';
		}
		$h .= '</ul>';
	}

	/* The two lines that answer "where does this take me" and "what will I
	   actually do in the room". Rendered before the outcomes grid, which stays
	   empty until someone writes real ones. */
	$pts = isset( $b['points'] ) ? $b['points'] : array();
	if ( ! empty( $pts['career'] ) || ! empty( $pts['learn'] ) ) {
		$h .= '<ul class="aa-hh-brief-points">';
		foreach ( array( 'career' => $str['brief_leads'], 'learn' => $str['brief_learn'] ) as $k => $label ) {
			if ( empty( $pts[ $k ] ) ) { continue; }
			$h .= '<li class="aa-hh-brief-point">'
			    . '<span class="aa-hh-brief-tick" aria-hidden="true">&#10003;</span>'
			    . '<span><strong>' . esc_html( $label ) . '</strong> ' . esc_html( $pts[ $k ] ) . '</span></li>';
		}
		$h .= '</ul>';
	}

	if ( $b['outcomes'] ) {
		$h .= '<ul class="aa-hh-brief-outcomes">';
		foreach ( $b['outcomes'] as $o ) {
			$h .= '<li class="aa-hh-brief-outcome">'
			    . '<span class="aa-hh-brief-tick" aria-hidden="true">&#10003;</span>'
			    . '<span>' . esc_html( $o ) . '</span></li>';
		}
		$h .= '</ul>';
	}
	return $h;
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
	/* The anchor course, not the soonest row -- see aa_hh_selected(). */
	$first = aa_hh_selected( $rows );
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
	    . '</div>';

	/* The brief for whatever is selected on load, server-rendered so it is
	   present without JS and indexable, then swapped by the picker. */
	$brief = $first ? aa_hh_brief( $first, $str ) : null;
	if ( $brief ) {
		/* data-slug matches what the JS compares against, so the first
		   select() on load sees no change and leaves the server's markup
		   alone -- without it the panel re-rendered and replayed its fade
		   immediately, for a selection that had not moved. */
		$h .= '<section class="aa-hh-brief" data-hh-brief aria-live="polite"'
		    . ' data-slug="' . esc_attr( $first['slug'] ) . '">'
		    . aa_hh_brief_html( $brief, $str ) . '</section>';
	}

	$h .= '</div>';

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
		$t = aa_hh_track( $r['course']['crumb'], $r['slug'] );
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
	    . '<p class="aa-hh-season">' . esc_html( ( max( 1, $weeks_ahead ) === 1 ? $str['season_one'] : sprintf( $str['season'], $weeks_ahead ) ) ) . '</p></div>'
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
			/* Selected, not first: the tick has to land on the same row the
			   button names, or the hero says SPC and highlights whatever runs
			   soonest. "NEXT AVAILABLE" stays on row zero, because that is a
			   fact about dates rather than about the selection. */
			$h .= aa_hh_row( $r, $str, $n === 0, $first && $r['slug'] === $first['slug'] );
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

	/* Every brief, keyed by course slug, so the picker can swap without a
	   round trip. Keyed by COURSE and not cohort, as the handoff asks: several
	   cohorts of one course share a brief, and only the dates differ. */
	$briefs = array();
	foreach ( $rows as $r ) {
		if ( isset( $briefs[ $r['slug'] ] ) ) { continue; }
		$b = aa_hh_brief( $r, $str );
		if ( $b ) { $briefs[ $r['slug'] ] = aa_hh_brief_html( $b, $str ); }
	}
	if ( $briefs ) {
		$h .= '<script>window.AA_HH_BRIEFS=' . wp_json_encode( $briefs ) . ';</script>';
	}

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

function aa_hh_row( $r, $str, $is_first, $is_on = null ) {
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

	/* Two different ideas that used to share one flag: is_first is "soonest",
	   which earns the NEXT AVAILABLE badge; is_on is "selected", which earns
	   the tick and drives the CTA. They coincided while the anchor happened to
	   sort first and diverged the moment it did not. */
	if ( $is_on === null ) { $is_on = $is_first; }

	return '<button type="button" class="aa-hh-row' . ( $is_on ? ' is-on' : '' ) . '"'
	     . ' data-hh-row'
	     . ' data-cohort="' . esc_attr( $co['id'] ) . '"'
	     . ' data-start="' . esc_attr( $co['start'] ) . '"'
	     . ' data-track="' . esc_attr( aa_hh_track( $c['crumb'], $r['slug'] ) ) . '"'
	     . ' data-slug="' . esc_attr( $r['slug'] ) . '"'
	     . ' data-code="' . esc_attr( $c['code'] ) . '"'
	     . ' data-range="' . esc_attr( $range ) . '"'
	     . ' data-price="' . (int) $c['price'] . '"'
	     . ' data-href="' . esc_attr( aa_hh_enrol_url( $r ) ) . '"'
	     . ' aria-pressed="' . ( $is_on ? 'true' : 'false' ) . '"'
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
