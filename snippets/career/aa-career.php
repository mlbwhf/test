/* ============================================================================
   CAREER PATHS + FIND YOUR TRAINING   —   [aa_career_paths]
   ----------------------------------------------------------------------------
   From the v2 "career paths + find your training" design handoff. The markup,
   the CSS and the script are the designer's. What changed is how it is
   installed and where it gets its facts.

   INSTALLED AS A SNIPPET, NOT A CHILD THEME. The handoff copies four files into
   wp-content/themes/<child>/inc/aa-career/ and requires them from
   functions.php. There is no theme-file access on this site -- all PHP goes
   through WPCode -- so the enqueue block, AACP_DIR, aacp_url() and the JSON
   file are gone. The CSS lives in the site's CSS snippet beside everything
   else; the script prints once in the footer.

   NOTHING HERE CARRIES ITS OWN COPY OF A FACT. The shipped JSON held
   placeholder salaries, placeholder cohort dates and, by its own README, five
   guessed URLs -- four of which are wrong for this site. So every figure, name,
   URL, date and track is looked up:

     pay     aa_salary_data()        the dataset the salary chart renders
     name    aa_reg_cert_label()
     url     aa_reg_code_url()
     dates   aa_reg_upcoming()       the real cohort calendar
     tracks  aa_home_track_data()    the real five tracks, with real tallies

   Only the ladders and the "unlocks" wording are written here.

   THE LADDERS ARE THE CORRECTED ONES. The handoff still ships
   SSM -> SASM -> RTE -> LPM as "Scrum Master to portfolio leader", the path the
   client rejected twice: portfolio funding is not the step after running a
   train. Delivery ends at the train, and Lean Portfolio Management sits on the
   product-and-portfolio ladder.

   EVERY LADDER MUST ASCEND. The last step is amber-topped and reads as the
   destination, so a path whose final salary is below the one before it reads
   as a mistake. Anything reordered here has to keep that true.

   TWO COPY LINES DID NOT SURVIVE REVIEW. The shipped intro ended "Pass
   guarantee -- or your next cohort is on us", which is the exact promise this
   site is not allowed to make; and the provenance line credited the figures to
   "Agile Agilist graduate outcomes", which is not where they come from. Both
   are rewritten below.
   ========================================================================== */

if ( ! function_exists( 'aacp_data' ) ) :

/**
 * Median total comp for a credential, in thousands, from the shared dataset.
 *
 * Returns 0 for a code with no published median. A step with no figure cannot
 * be drawn -- the bar height IS the salary -- so aacp_data() drops it rather
 * than invent one. That is why Large Solution is not a step on the delivery
 * ladder even though that is where the ladder ends on the track pages.
 */
function aacp_pay( $code ) {
	if ( ! function_exists( 'aa_salary_data' ) ) { return 0; }
	$d = aa_salary_data();
	foreach ( (array) $d['bands'] as $b ) {
		if ( $b['code'] === $code ) { return (int) $b['median']; }
	}
	return isset( $d['extra'][ $code ] ) ? (int) $d['extra'][ $code ] : 0;
}

/** The role a credential hires into, for the "Unlocks —" line. */
function aacp_roles() {
	return array(
		'SSM'    => 'Scrum Master, Team Coach',
		'SASM'   => 'Senior Scrum Master, multi-team coach',
		'RTE'    => 'Release Train Engineer, Agile Delivery Manager',
		'POPM'   => 'Product Owner, Product Manager',
		'APM'    => 'Senior / Group Product Manager',
		'LPM'    => 'Portfolio Manager, Head of VMO',
		'SA'     => 'Agile Lead, Delivery Manager',
		'SPC'    => 'SAFe Practice Consultant, Agile Coach',
		'ASPC'   => 'Enterprise Agile Coach, Principal Consultant',
		'AINF'   => 'AI-literate manager, team lead',
		'AINCA'  => 'AI Transformation Lead',
		'AINORG' => 'VP AI, Chief AI Officer track',
	);
}

/** The ladders, as codes. Names, URLs and pay are resolved in aacp_data(). */
function aacp_ladders() {
	return array(
		array(
			'slug' => 'delivery', 'cats' => array( 'safe', 'adv-safe' ), 'advOrder' => 1, 'advEntry' => 'RTE',
			'kicker' => 'Team & delivery', 'from' => 'Scrum Master', 'to' => 'release train leadership',
			'months' => '18–24', 'trackName' => 'SAFe by Role', 'trackUrl' => '/training/safe/',
			'blurb'  => 'Start on one team, grow into team-of-teams, then run an Agile Release Train. '
			          . 'The most-hired ladder in SAFe job postings — and the one most employers advertise '
			          . 'under a title other than RTE.',
			'codes'  => array( 'SSM', 'SASM', 'RTE' ),
		),
		array(
			'slug' => 'product', 'cats' => array( 'safe', 'adv-safe' ), 'advOrder' => 2, 'advEntry' => 'APM',
			'kicker' => 'Product & portfolio', 'from' => 'Product Owner', 'to' => 'portfolio leader',
			'months' => '12–18', 'trackName' => 'Advanced SAFe', 'trackUrl' => '/training/adv-safe/',
			'blurb'  => 'Own the team backlog, then the ART roadmap, then the portfolio — where the funding '
			          . 'decisions are made rather than received.',
			'codes'  => array( 'POPM', 'APM', 'LPM' ),
		),
		array(
			'slug' => 'coaching', 'cats' => array( 'safe', 'adv-safe' ), 'advOrder' => 0, 'advEntry' => 'SPC',
			'kicker' => 'Coaching', 'from' => 'team lead', 'to' => 'enterprise coach',
			'months' => '12–24', 'trackName' => 'Advanced SAFe', 'trackUrl' => '/training/adv-safe/',
			'blurb'  => 'Lead the change, get licensed to teach and launch trains, then coach whole '
			          . 'enterprises — and build the internal cadre that keeps it going.',
			'codes'  => array( 'SA', 'SPC', 'ASPC' ),
		),
		array(
			'slug' => 'ai-native', 'cats' => array( 'ai-native' ),
			'kicker' => 'AI-Native · New 2026', 'from' => 'AI-curious', 'to' => 'AI-Native executive',
			'months' => '6–12', 'trackName' => 'AI-Native', 'trackUrl' => '/training/ai-native/',
			'blurb'  => 'Foundational AI literacy through to redesigning how an enterprise works with AI. '
			          . 'No coding required.',
			'codes'  => array( 'AINF', 'AINCA', 'AINORG' ),
		),
	);
}

/**
 * The five tracks, from the picker that already exists.
 *
 * The handoff shipped its own copy of the tracks with hand-counted tallies --
 * which already disagreed with its own header (five tracks totalling 39 certs,
 * under a heading saying 19). aa_home_track_data() is the source the tracks
 * accordion used, so the tally is the real number of courses in each track and
 * cannot go stale when one is added. It is language-aware too, so the /fr/,
 * /es/ and /ar/ mirrors get their own labels.
 */
function aacp_tracks() {
	if ( ! function_exists( 'aa_home_track_data' ) ) { return array(); }
	$out = array();
	foreach ( aa_home_track_data( '' ) as $t ) {
		$certs = array();
		foreach ( $t['certs'] as $c ) {
			$certs[] = array(
				'name' => $c['name'] . ( $c['code'] !== '' ? ' (' . $c['code'] . ')' : '' ),
				'code' => $c['code'],
				'url'  => $c['url'],
			);
		}
		if ( ! $certs ) { continue; }
		$n = count( $certs );
		$out[] = array(
			'slug'    => $t['cat'],
			'cat'     => $t['cat'],
			'name'    => $t['label'],
			'tally'   => $n,
			'count'   => $n . ' ' . ( 1 === $n ? 'certification' : 'certifications' ),
			'url'     => $t['href'],
			'desc'    => $t['desc'],
			'bestFor' => $t['for'],
			'certs'   => $certs,
		);
	}
	return $out;
}

function aacp_data() {
	static $data = null;
	if ( null !== $data ) { return $data; }

	$roles = aacp_roles();
	$paths = array();
	foreach ( aacp_ladders() as $p ) {
		$steps = array();
		foreach ( $p['codes'] as $code ) {
			$pay = aacp_pay( $code );
			if ( $pay <= 0 ) { continue; }          /* no published median, no bar */
			$steps[] = array(
				'code' => $code,
				'name' => function_exists( 'aa_reg_cert_label' ) ? aa_reg_cert_label( $code ) : $code,
				'role' => isset( $roles[ $code ] ) ? $roles[ $code ] : '',
				'pay'  => $pay,
				'url'  => function_exists( 'aa_reg_code_url' ) ? aa_reg_code_url( $code ) : '',
			);
		}
		if ( count( $steps ) < 2 ) { continue; }    /* a one-step ladder is not a path */
		unset( $p['codes'] );
		$p['steps'] = $steps;
		$paths[] = $p;
	}

	$tracks  = aacp_tracks();
	$ncerts  = 0;
	foreach ( $tracks as $t ) { $ncerts += $t['tally']; }
	$npaths  = count( $paths );

	$data = apply_filters( 'aacp_data', array(
		'provider'    => array( 'name' => 'Agile Agilist', 'url' => home_url( '/' ) ),
		'roadmapUrl'  => '/cert-recommender/',
		'calendarUrl' => '/training/',
		'catalogueUrl'=> '/training/',
		'categories'  => array( 'safe' => 'SAFe by Role', 'adv-safe' => 'Advanced SAFe', 'ai-native' => 'AI-Native' ),
		'paths'       => $paths,
		'tracks'      => $tracks,
		'homeCopy'    => array(
			'eyebrow' => '( 02 ) — Find your training',
			/* Counted, not typed. The shipped copy said "19 certifications" over
			   a track list totalling 39. The count comes from the track picker,
			   so if that ever fails to resolve the headline would read
			   "0 certifications" -- it drops the number rather than print a
			   wrong one. */
			'h2a'     => $ncerts > 0
				? sprintf( '%d certifications. %d career paths.', $ncerts, $npaths )
				: sprintf( 'Every certification. %d career paths.', $npaths ),
			'h2b'     => 'Start from the role you want, or the course you need.',
			/* THE SHIPPED LINE ENDED "Pass guarantee -- or your next cohort is
			   on us." That is the promise this site is not allowed to make, in
			   both halves: the guarantee and the free retake. */
			'intro'   => 'Live virtual classrooms. Exam included. Recordings forever. '
			           . 'Exam preparation and support with every cohort.',
		),
		'trackSwitchLabel' => sprintf( '%d tracks · %d certifications', count( $tracks ), $ncerts ),
		'salaryAsOf'       => '2026-09',
		'salaryAsOfLabel'  => 'Sep 2026',
		/* THE SHIPPED LINE CREDITED "Agile Agilist graduate outcomes". We do not
		   collect graduate outcome data, so this says where the figures actually
		   come from -- the same sources the salary chart cites. */
		'salarySource'     => 'Median US total compensation by role, from Scaled Agile, LinkedIn Salary '
		                    . 'and Payscale. Compensation is role-based; course fees are separate.',
		/* Empty on purpose: the handoff pointed "How we measure" at
		   /career-outcomes/, which does not exist. The footer omits the link
		   rather than shipping a 404. Fill this in when that page is written. */
		'methodUrl'        => '',
	) );
	return $data;
}

/**
 * The next real cohort for a step, from the live calendar.
 *
 * The handoff shipped hard-coded dates and a filter to replace them. This is
 * that filter. aa_reg_upcoming() already drops finished and sold-out cohorts,
 * so anything it returns is bookable; a course with none renders "New dates
 * soon" against the calendar, which is the handoff's own fallback.
 */
function aacp_live_cohort( $c, $code ) {
	if ( ! function_exists( 'aa_reg_upcoming' ) || ! function_exists( 'aa_reg_code_url' ) ) { return $c; }
	$slug = function_exists( 'aa_reg_slug_from_url' ) ? aa_reg_slug_from_url( aa_reg_code_url( $code ) ) : '';
	if ( $slug === '' || ! function_exists( 'aa_reg_course' ) ) { return $c; }
	$course = aa_reg_course( $slug );
	if ( ! $course ) { return $c; }
	$up = aa_reg_upcoming( $slug, $course );
	if ( ! $up ) { return null; }
	return array( 'start' => $up[0]['start'], 'end' => $up[0]['end'], 'url' => aa_reg_code_url( $code ) );
}
add_filter( 'aacp_next_cohort', 'aacp_live_cohort', 10, 2 );

function aacp_cohort( $step ) {
	$c = apply_filters( 'aacp_next_cohort',
		array( 'start' => '', 'end' => '', 'url' => $step['url'] ), $step['code'] );
	if ( empty( $c['start'] ) || strtotime( $c['start'] ) < strtotime( 'today' ) ) { return null; }
	return $c;
}

function aacp_range( $start, $end ) {
	$s = strtotime( $start );
	$e = strtotime( $end ? $end : $start );
	if ( $s === $e ) { return date_i18n( 'M j', $s ); }
	if ( date( 'm', $s ) === date( 'm', $e ) ) { return date_i18n( 'M j', $s ) . '–' . date_i18n( 'j', $e ); }
	return date_i18n( 'M j', $s ) . ' – ' . date_i18n( 'M j', $e );
}

function aacp_money( $k ) { return '$' . intval( $k ) . 'K'; }

/** Plain-language one-sentence answer for a path — the line LLMs and snippets quote. */
function aacp_answer( $p ) {
	$n = count( $p['steps'] );
	return sprintf( '%s to %s: %s. Median pay rises from %s to %s (+%s) over a typical %s months.',
		$p['from'], $p['to'],
		implode( ', then ', array_map( function ( $s ) { return $s['name'] . ' (' . $s['code'] . ')'; }, $p['steps'] ) ),
		aacp_money( $p['steps'][0]['pay'] ), aacp_money( $p['steps'][ $n - 1 ]['pay'] ),
		aacp_money( $p['steps'][ $n - 1 ]['pay'] - $p['steps'][0]['pay'] ), $p['months'] );
}

function aacp_render( $atts = array() ) {
	$a = shortcode_atts( array(
		'mode' => 'home', 'category' => 'safe', 'course' => 'RTE', 'view' => 'auto',
		'id' => '', 'eyebrow' => '', 'bare' => '0', 'schema' => '1',
	), $atts, 'aa_career_paths' );

	$d = aacp_data();
	if ( empty( $d['paths'] ) ) { return ''; }
	$GLOBALS['aacp_used'] = true;

	$mode   = in_array( $a['mode'], array( 'home', 'category', 'course' ), true ) ? $a['mode'] : 'home';
	$cat    = sanitize_key( $a['category'] );
	$course = strtoupper( sanitize_text_field( $a['course'] ) );
	$view   = 'auto' === $a['view'] ? ( 'course' === $mode ? 'paths' : 'both' ) : ( 'both' === $a['view'] ? 'both' : 'paths' );
	$bare   = '1' === (string) $a['bare'];
	$pre    = $a['id'] ? sanitize_html_class( $a['id'] ) : 'cp';

	/* ---------- which paths ---------- */
	$paths = $d['paths'];
	if ( 'category' === $mode ) {
		$paths = array_values( array_filter( $paths, function ( $p ) use ( $cat ) { return in_array( $cat, $p['cats'], true ); } ) );
		if ( 'adv-safe' === $cat ) {
			usort( $paths, function ( $x, $y ) { return ( isset( $x['advOrder'] ) ? $x['advOrder'] : 9 ) - ( isset( $y['advOrder'] ) ? $y['advOrder'] : 9 ); } );
		}
	}
	if ( 'course' === $mode ) {
		$paths = array_values( array_filter( $paths, function ( $p ) use ( $course ) {
			foreach ( $p['steps'] as $s ) { if ( $s['code'] === $course ) { return true; } } return false;
		} ) );
	}
	if ( ! $paths ) { $paths = $d['paths']; }

	/* ---------- which tracks ---------- */
	$tracks = 'home' === $mode ? $d['tracks'] : array_values( array_filter( $d['tracks'], function ( $t ) use ( $cat ) { return $t['cat'] === $cat; } ) );
	if ( ! $tracks ) { $view = 'paths'; }
	$course_track = null;
	foreach ( $d['tracks'] as $t ) { foreach ( $t['certs'] as $c ) { if ( $c['code'] === $course ) { $course_track = $t; } } }

	/* ---------- copy ---------- */
	$cat_name    = isset( $d['categories'][ $cat ] ) ? $d['categories'][ $cat ] : 'SAFe';
	$course_step = null;
	foreach ( $d['paths'] as $p ) { foreach ( $p['steps'] as $s ) { if ( $s['code'] === $course ) { $course_step = $s; break 2; } } }
	if ( 'course' === $mode && $course_step ) {
		$copy = array( 'Where ' . $course . ' takes you', $course_step['name'] . ' is one step.', 'Here is the whole climb.',
			'See what ' . $course . ' unlocks, what comes before it, and the next move after it — with median pay and the next live cohort for each step.' );
	} elseif ( 'category' === $mode && 'adv-safe' === $cat ) {
		$copy = array( 'Career paths · ' . $cat_name, 'Already certified?', 'Take the step into leadership.',
			'Each ladder starts at the advanced course that moves you up — prerequisites shown for context, with median pay and the next live cohort.' );
	} elseif ( 'category' === $mode ) {
		$copy = array( 'Career paths · ' . $cat_name, 'Pick the role you want next.', 'These are the ' . $cat_name . ' ladders.',
			'Each path shows the role every certification unlocks, the median pay, and the next live cohort — so you know which course to book first.' );
	} else {
		$h    = $d['homeCopy'];
		$copy = array( $h['eyebrow'], $h['h2a'], $h['h2b'], $h['intro'] );
	}
	if ( $a['eyebrow'] ) { $copy[0] = $a['eyebrow']; }

	$both  = 'both' === $view;
	$multi = count( $paths ) > 1;
	$o  = '<section class="aacp" data-aacp data-view="goal"' . ( $a['id'] ? ' id="' . esc_attr( $a['id'] ) . '" data-aa-section="' . esc_attr( $a['id'] ) . '"' : '' )
		. ( $bare ? ' data-bare' : ' aria-labelledby="' . $pre . '-h"' ) . '>';
	if ( ! $bare ) {
		$o .= '<div class="aacp-head"><div><p class="aacp-eyebrow"><i aria-hidden="true"></i>' . esc_html( $copy[0] ) . '</p>'
			. '<h2 id="' . $pre . '-h">' . esc_html( $copy[1] ) . ' <em>' . esc_html( $copy[2] ) . '</em></h2></div>'
			. '<p class="aacp-intro">' . esc_html( $copy[3] ) . '</p></div>';
	}

	/* ---------- view switch (JS only — hidden without JS, where both views show) ---------- */
	if ( $both ) {
		$ncerts = 0; foreach ( $tracks as $t ) { $ncerts += count( $t['certs'] ); }
		$o .= '<div class="aacp-switch" role="radiogroup" aria-label="Browse training">'
			. '<button type="button" role="radio" aria-checked="true" data-view="goal">By career goal <span>' . count( $paths ) . ' ' . ( 1 === count( $paths ) ? 'path' : 'paths' ) . '</span></button>'
			. '<button type="button" role="radio" aria-checked="false" tabindex="-1" data-view="track">' . ( count( $tracks ) > 1 ? 'By track' : 'All courses' )
			. ' <span>' . esc_html( count( $tracks ) > 1 && ! empty( $d['trackSwitchLabel'] ) ? $d['trackSwitchLabel'] : $ncerts . ' courses' ) . '</span></button></div>';
	}

	/* ---------- GOAL VIEW ---------- */
	$o .= '<div class="aacp-view" data-view-panel="goal">';
	if ( $both ) { $o .= '<h3 class="aacp-vh">Career paths</h3>'; }
	if ( $multi ) {
		$o .= '<div class="aacp-tabs" role="tablist" aria-label="Career paths">';
		foreach ( $paths as $i => $p ) {
			$n = count( $p['steps'] );
			$o .= '<button type="button" class="aacp-tab" role="tab" id="' . $pre . '-pt-' . esc_attr( $p['slug'] ) . '" aria-controls="' . $pre . '-path-' . esc_attr( $p['slug'] ) . '" aria-selected="' . ( 0 === $i ? 'true' : 'false' ) . '"' . ( $i ? ' tabindex="-1"' : '' ) . '>'
				. '<span class="aacp-kicker">' . esc_html( $p['kicker'] ) . '</span>'
				. '<span class="aacp-tab-title">From ' . esc_html( $p['from'] ) . ' to <em>' . esc_html( $p['to'] ) . '</em></span>'
				. '<span class="aacp-tab-lift">+' . aacp_money( $p['steps'][ $n - 1 ]['pay'] - $p['steps'][0]['pay'] ) . ' median lift · ' . $n . ' steps</span></button>';
		}
		$o .= '</div>';
	}

	$ld_paths = array();
	foreach ( $paths as $i => $p ) {
		$n    = count( $p['steps'] );
		$pays = wp_list_pluck( $p['steps'], 'pay' );
		$max  = max( $pays ); $min = min( $pays );
		$lift = $p['steps'][ $n - 1 ]['pay'] - $p['steps'][0]['pay'];
		$adv  = 'category' === $mode && 'adv-safe' === $cat && ! empty( $p['advEntry'] );
		$here = 0;
		foreach ( $p['steps'] as $j => $s ) {
			if ( ( 'course' === $mode && $s['code'] === $course ) || ( $adv && $s['code'] === $p['advEntry'] ) ) { $here = $j; }
		}
		$ladder = 'course' === $mode || $adv;
		$pid    = $pre . '-path-' . $p['slug'];

		$o .= '<article class="aacp-panel" id="' . esc_attr( $pid ) . '"' . ( $multi ? ' role="tabpanel" aria-labelledby="' . $pre . '-pt-' . esc_attr( $p['slug'] ) . '"' : '' ) . '>';
		$o .= '<div class="aacp-ptop"><div><h4 class="aacp-ph">' . esc_html( $p['from'] . ' → ' . $p['to'] ) . '</h4>'
			. '<p class="aacp-answer">' . esc_html( aacp_answer( $p ) ) . '</p>'
			. '<p class="aacp-blurb">' . esc_html( $p['blurb'] ) . '</p></div>'
			. '<dl class="aacp-kpis"><div><dt>median pay lift across the path</dt><dd>+' . aacp_money( $lift ) . '</dd></div>'
			. '<div><dt>months, typical pace</dt><dd>' . esc_html( $p['months'] ) . '</dd></div></dl></div>';
		$o .= '<ol class="aacp-ladder" style="--n:' . $n . '">';

		$courses = array();
		foreach ( $p['steps'] as $j => $s ) {
			$r       = $max === $min ? 1 : ( $s['pay'] - $min ) / ( $max - $min );
			$is_here = $j === $here;
			$past    = $ladder && $j < $here;
			if ( 'course' === $mode ) { $flag = $is_here ? 'This course' : ( $j === $here + 1 ? 'Next step' : ( $past ? 'Before' : '' ) ); }
			elseif ( $adv ) { $flag = $is_here ? 'Start here' : ( $past ? 'Prerequisite' : '' ); }
			else { $flag = 0 === $j ? 'Start here' : ''; }
			$c   = aacp_cohort( $s );
			$cls = 'aacp-step' . ( $is_here ? ' is-here' : '' ) . ( $is_here && $ladder ? ' is-focus' : '' ) . ( $past ? ' is-past' : '' );
			$o  .= '<li class="' . $cls . '" data-code="' . esc_attr( $s['code'] ) . '" style="--r:' . round( $r, 3 ) . ';--j:' . $j . '">'
				. '<span class="aacp-bar" aria-hidden="true"><i></i></span>'
				. '<div class="aacp-srow"><span class="aacp-stepno">Step ' . sprintf( '%02d', $j + 1 ) . '</span>'
				. ( $flag ? '<span class="aacp-flag' . ( $ladder && ! $is_here ? ' aacp-flag--soft' : '' ) . '">' . esc_html( $flag ) . '</span>' : '' )
				. '<span class="aacp-flag aacp-flag--pick">Your pick</span></div>'
				. '<p class="aacp-pay"><b>' . aacp_money( $s['pay'] ) . '</b><span>median total comp</span></p>'
				. '<h5><a href="' . esc_url( $s['url'] ) . '">' . esc_html( $s['name'] ) . '</a> <abbr title="' . esc_attr( $s['name'] ) . '">(' . esc_html( $s['code'] ) . ')</abbr></h5>'
				. '<p class="aacp-role">Unlocks — ' . esc_html( $s['role'] ) . '</p>'
				. '<div class="aacp-sfoot"><span class="aacp-next">Next cohort · '
				. ( $c ? '<time datetime="' . esc_attr( $c['start'] ) . '">' . esc_html( aacp_range( $c['start'], $c['end'] ) ) . '</time>' : '<strong>New dates soon</strong>' ) . '</span>'
				. '<a class="aacp-reg" href="' . esc_url( $c ? $c['url'] : $d['calendarUrl'] ) . '" aria-label="' . esc_attr( 'Register for ' . $s['name'] ) . '">' . ( $is_here && 'course' === $mode ? 'Register now' : 'Register' ) . ' <span aria-hidden="true">⟶</span></a></div></li>';

			$cl = array( '@type' => 'Course', 'name' => $s['name'], 'courseCode' => $s['code'], 'url' => $s['url'],
				'description' => $s['name'] . ' certification. Prepares for: ' . $s['role'] . '.',
				'provider' => array( '@type' => 'Organization', 'name' => $d['provider']['name'], 'sameAs' => $d['provider']['url'] ) );
			if ( $c ) { $cl['hasCourseInstance'] = array( '@type' => 'CourseInstance', 'courseMode' => 'online', 'startDate' => $c['start'], 'endDate' => $c['end'] ); }
			$courses[] = $cl;
		}
		$o .= '</ol>';

		$cta = $p['steps'][ $here ];
		$cc  = aacp_cohort( $cta );
		$o  .= '<div class="aacp-ctas">'
			. '<a class="aacp-cta" href="' . esc_url( $cc ? $cc['url'] : $d['calendarUrl'] ) . '">Register for ' . esc_html( $cta['name'] ) . ( $cc ? ' · ' . esc_html( aacp_range( $cc['start'], $cc['end'] ) ) : '' ) . ' <span aria-hidden="true">⟶</span></a>'
			. '<a class="aacp-cta2" href="' . esc_url( $d['roadmapUrl'] ) . '">Get my free 12-month roadmap</a>'
			. '<a class="aacp-cta3" href="' . esc_url( $p['trackUrl'] ) . '">Explore the ' . esc_html( $p['trackName'] ) . ' track <span aria-hidden="true">⟶</span></a>'
			. '</div></article>';

		$ld_paths[] = array( '@type' => 'ListItem', 'position' => $i + 1, 'item' => array(
			'@type' => 'EducationalOccupationalProgram',
			'name' => 'Career path: ' . $p['from'] . ' to ' . $p['to'],
			'description' => aacp_answer( $p ),
			'url' => ( 'home' === $mode ? home_url( '/' ) : get_permalink() ) . '#' . $pid,
			'provider' => array( '@type' => 'Organization', 'name' => $d['provider']['name'], 'sameAs' => $d['provider']['url'] ),
			'educationalProgramMode' => 'online',
			'timeToComplete' => 'P' . intval( $p['months'] ) . 'M',
			'occupationalCredentialAwarded' => implode( ', ', wp_list_pluck( $p['steps'], 'name' ) ),
			'salaryUponCompletion' => array( '@type' => 'MonetaryAmountDistribution', 'currency' => 'USD', 'duration' => 'P1Y', 'median' => $p['steps'][ $n - 1 ]['pay'] * 1000 ),
			'hasCourse' => $courses,
		) );
	}
	$o .= '</div>';

	/* ---------- TRACK VIEW (the existing five-track picker, now linked to paths) ---------- */
	if ( $both ) {
		$tmulti = count( $tracks ) > 1;
		$o .= '<div class="aacp-view" data-view-panel="track">';
		$o .= '<h3 class="aacp-vh">' . ( $tmulti ? 'Training tracks' : 'All ' . esc_html( $tracks[0]['name'] ) . ' courses' ) . '</h3>';
		if ( $tmulti ) {
			$o .= '<div class="aacp-ttabs" role="tablist" aria-label="Training tracks">';
			foreach ( $tracks as $i => $t ) {
				$o .= '<button type="button" class="aacp-ttab" role="tab" id="' . $pre . '-tt-' . esc_attr( $t['slug'] ) . '" aria-controls="' . $pre . '-track-' . esc_attr( $t['slug'] ) . '" aria-selected="' . ( 0 === $i ? 'true' : 'false' ) . '"' . ( $i ? ' tabindex="-1"' : '' ) . '>'
					. '<span class="aacp-tnum">' . sprintf( '%02d', $i + 1 ) . '</span><span>' . esc_html( $t['name'] ) . '</span><span class="aacp-tcount">' . intval( $t['tally'] ) . '</span></button>';
			}
			$o .= '</div>';
		}
		foreach ( $tracks as $i => $t ) {
			$o .= '<article class="aacp-tpanel" id="' . $pre . '-track-' . esc_attr( $t['slug'] ) . '"' . ( $tmulti ? ' role="tabpanel" aria-labelledby="' . $pre . '-tt-' . esc_attr( $t['slug'] ) . '"' : '' ) . '>'
				. '<div class="aacp-thead"><h4>' . esc_html( $t['name'] ) . '</h4><span>' . esc_html( $t['count'] ) . '</span></div>'
				. '<p class="aacp-tdesc">' . esc_html( $t['desc'] ) . '</p><ul class="aacp-certs">';
			foreach ( $t['certs'] as $c ) {
				$o .= '<li><a href="' . esc_url( $c['url'] ) . '">' . esc_html( $c['name'] ) . '</a>'
					. ( $c['code'] ? '<button type="button" class="aacp-pathbtn" data-focus="' . esc_attr( $c['code'] ) . '" aria-label="' . esc_attr( 'See the career path for ' . $c['name'] ) . '">Career path <span aria-hidden="true">⟶</span></button>' : '' ) . '</li>';
			}
			$o .= '</ul><div class="aacp-tfoot"><span>Best for — ' . esc_html( $t['bestFor'] ) . '</span>'
				. '<a class="aacp-cta aacp-cta--sm" href="' . esc_url( $t['url'] ) . '">View the ' . esc_html( $t['name'] ) . ' track <span aria-hidden="true">⟶</span></a></div></article>';
		}
		$o .= '</div>';
	}

	/* ---------- course pages: sibling links (internal linking) ---------- */
	if ( 'course' === $mode && $course_track ) {
		$o .= '<nav class="aacp-more" aria-label="' . esc_attr( 'More ' . $course_track['name'] . ' courses' ) . '"><span>More in ' . esc_html( $course_track['name'] ) . '</span><ul>';
		foreach ( $course_track['certs'] as $c ) {
			if ( $c['code'] === $course ) { continue; }
			$o .= '<li><a href="' . esc_url( $c['url'] ) . '">' . esc_html( $c['name'] ) . '</a></li>';
		}
		$o .= '</ul></nav>';
	}

	/* ---------- footer: switch hint + data provenance (E-E-A-T) ---------- */
	$o .= '<div class="aacp-foot">';
	if ( $both ) {
		$o .= '<p class="aacp-hint"><span class="aacp-hint--goal">Know which course you want? <button type="button" data-view-to="track">Browse by track</button></span>'
			. '<span class="aacp-hint--track">Not sure which course comes first? <button type="button" data-view-to="goal">Start from a career goal</button></span>'
			. ' · <a href="' . esc_url( $d['catalogueUrl'] ) . '">all certifications <span aria-hidden="true">⟶</span></a></p>';
	}
	/* The "How we measure" link is only printed when there is a page behind it. */
	$o .= '<p class="aacp-source">' . esc_html( $d['salarySource'] ) . ' Updated <time datetime="' . esc_attr( $d['salaryAsOf'] ) . '">' . esc_html( $d['salaryAsOfLabel'] ) . '</time>'
		. ( $d['methodUrl'] !== '' ? ' · <a href="' . esc_url( $d['methodUrl'] ) . '">How we measure</a>' : '' ) . '</p></div>';

	if ( '1' === (string) $a['schema'] ) {
		$graph = array( array( '@type' => 'ItemList', 'name' => wp_strip_all_tags( $copy[1] . ' ' . $copy[2] ), 'itemListElement' => $ld_paths ) );
		if ( $both ) {
			$tl = array();
			foreach ( $tracks as $i => $t ) {
				$tl[] = array( '@type' => 'ListItem', 'position' => $i + 1, 'name' => $t['name'], 'url' => $t['url'], 'description' => $t['desc'] );
			}
			$graph[] = array( '@type' => 'ItemList', 'name' => 'Training tracks', 'itemListElement' => $tl );
		}
		$o .= '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => $graph ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>';
	}
	return $o . '</section>';
}
add_shortcode( 'aa_career_paths', 'aacp_render' );

/**
 * The credential code behind a course page's slug.
 *
 * NOT strtoupper( $slug ). A course built from its own page manufactures a code
 * by upper-casing the slug, so /training/safe/scrum-master/ calls itself
 * SCRUM-MASTER rather than SSM and matches no ladder. The cert table is keyed
 * by real code and knows each one's URL, so the slug is matched against that.
 */
function aacp_code_for_slug( $slug ) {
	if ( ! function_exists( 'aa_reg_cert_table' ) || ! function_exists( 'aa_reg_slug_from_url' ) ) { return ''; }
	foreach ( array_keys( aa_reg_cert_table() ) as $code ) {
		if ( aa_reg_slug_from_url( aa_reg_code_url( $code ) ) === $slug ) { return $code; }
	}
	return '';
}

/**
 * On a course page, the "Path" section becomes the career block.
 *
 * No page edits: every course page already ships <section id="path"> with a
 * jump-menu entry pointing at it, so swapping the body keeps the anchor and the
 * numbering. schema="0" because these pages already emit their own Course
 * JSON-LD and two of them on one page is worse than none.
 */
function aacp_course_swap( $content ) {
	if ( is_admin() || ! is_page() || is_front_page() ) { return $content; }
	if ( strpos( $content, 'id="path"' ) === false ) { return $content; }
	if ( strpos( $content, 'class="aacp"' ) !== false ) { return $content; }
	if ( ! function_exists( 'aa_reg_section_span' ) ) { return $content; }

	$obj = get_queried_object();
	if ( ! ( $obj instanceof WP_Post ) ) { return $content; }
	$code = aacp_code_for_slug( $obj->post_name );
	if ( $code === '' ) { return $content; }

	$on_a_path = false;
	foreach ( aacp_data()['paths'] as $p ) {
		foreach ( $p['steps'] as $s ) { if ( $s['code'] === $code ) { $on_a_path = true; break 2; } }
	}
	if ( ! $on_a_path ) { return $content; }

	$span = aa_reg_section_span( $content, 'path' );
	if ( ! $span ) { return $content; }
	$body = aacp_render( array( 'mode' => 'course', 'course' => $code, 'id' => 'career', 'schema' => '0' ) );
	if ( $body === '' ) { return $content; }

	$open    = substr( $content, $span[0], strpos( $content, '>', $span[0] ) - $span[0] + 1 );
	$content = substr( $content, 0, $span[0] ) . $open . $body . '</section>' . substr( $content, $span[1] );

	return aacp_move_second( $content, 'path' );
}
add_filter( 'the_content', 'aacp_course_swap', 12 );

/**
 * Move a section to second place, and its nav link with it.
 *
 * REGISTRATION FIRST, CAREER SECOND -- that is the order the client asked for,
 * and on a course page the number a reader counts is the position in the
 * sticky bar nav, not a printed "( 0N )": those sections carry an eyebrow, not
 * a number. So this moves the section in the document and moves its link to
 * the second slot in .aa-bar-nav, and the two stay in step.
 *
 * The nav is the source of the intended order, the same way
 * aa_reg_coaching_second() reads .aahn__scroll on a track page. A link whose
 * section does not exist is skipped rather than allowed to abort the move --
 * one stale menu entry should not decide the layout of the page.
 */
function aacp_move_second( $content, $id ) {
	$nav_a = strpos( $content, '<div class="aa-bar-nav' );
	if ( $nav_a === false ) { return $content; }
	$nav_b = strpos( $content, '</div>', $nav_a );
	if ( $nav_b === false ) { return $content; }
	$nav = substr( $content, $nav_a, $nav_b - $nav_a );

	if ( ! preg_match_all( '#<a href="\#([a-z-]+)"[^>]*>.*?</a>#s', $nav, $m, PREG_SET_ORDER ) ) {
		return $content;
	}
	$order = array();
	foreach ( $m as $one ) { $order[] = $one[1]; }
	if ( count( $order ) < 3 || ! in_array( $id, $order, true ) ) { return $content; }
	if ( isset( $order[1] ) && $order[1] === $id ) { return $content; }   /* already second */

	$mine  = aa_reg_section_span( $content, $id );
	$first = null;
	foreach ( $order as $slug ) {
		if ( $slug === $id ) { continue; }
		$f = aa_reg_section_span( $content, $slug );
		if ( $f ) { $first = $f; break; }
	}
	/* Nothing to do if it is already ahead of the first section. */
	if ( ! $mine || ! $first || $mine[0] < $first[1] ) { return $content; }

	$block   = substr( $content, $mine[0], $mine[1] - $mine[0] );
	$content = substr( $content, 0, $mine[0] ) . substr( $content, $mine[1] );
	$content = substr( $content, 0, $first[1] ) . $block . substr( $content, $first[1] );

	/* ---- the nav, rebuilt in the new order ---- */
	$nav_a = strpos( $content, '<div class="aa-bar-nav' );
	if ( $nav_a === false ) { return $content; }
	$nav_b = strpos( $content, '</div>', $nav_a );
	if ( $nav_b === false ) { return $content; }

	$new_order = array( $order[0], $id );
	foreach ( $order as $i => $slug ) {
		if ( 0 === $i || $slug === $id ) { continue; }
		$new_order[] = $slug;
	}
	$links = array();
	foreach ( $m as $one ) { $links[ $one[1] ] = $one[0]; }

	$old_nav = substr( $content, $nav_a, $nav_b - $nav_a );
	$rebuilt = $old_nav;
	foreach ( $m as $one ) { $rebuilt = str_replace( $one[0], '', $rebuilt ); }
	$html = '';
	foreach ( $new_order as $slug ) {
		if ( isset( $links[ $slug ] ) ) { $html .= $links[ $slug ]; }
	}
	$rebuilt = rtrim( $rebuilt ) . $html;

	return substr( $content, 0, $nav_a ) . $rebuilt . substr( $content, $nav_b );
}

/**
 * /career-paths.txt — a plain-text map of every ladder, for LLM crawlers.
 *
 * Needs one Settings -> Permalinks -> Save to register the rule.
 */
add_action( 'init', function () { add_rewrite_rule( '^career-paths\.txt$', 'index.php?aacp_txt=1', 'top' ); } );
add_filter( 'query_vars', function ( $v ) { $v[] = 'aacp_txt'; return $v; } );
add_action( 'template_redirect', function () {
	if ( ! get_query_var( 'aacp_txt' ) ) { return; }
	$d = aacp_data();
	header( 'Content-Type: text/plain; charset=utf-8' );
	echo "# Agile Agilist — career paths\n\n" . $d['salarySource'] . ' Updated ' . $d['salaryAsOfLabel'] . ".\n\n";
	foreach ( $d['paths'] as $p ) {
		echo '## ' . $p['from'] . ' → ' . $p['to'] . "\n" . aacp_answer( $p ) . "\n";
		foreach ( $p['steps'] as $j => $s ) {
			$c = aacp_cohort( $s );
			echo ( $j + 1 ) . '. ' . $s['name'] . ' (' . $s['code'] . ') — unlocks ' . $s['role'] . ' — median ' . aacp_money( $s['pay'] )
				. ' — next cohort ' . ( $c ? $c['start'] : 'TBA' ) . ' — ' . home_url( $s['url'] ) . "\n";
		}
		echo "\n";
	}
	exit;
} );

/**
 * The view/tab script, printed once and only on a page that rendered the block.
 *
 * NOWDOC, NOT A ?> BLOCK. The snippet body has no opening <?php of its own --
 * WPCode supplies it -- so dropping out of PHP mid-file to print markup works
 * but leaves the rest of the file one stray character away from rendering
 * itself to the page. A nowdoc never interpolates and never leaves PHP mode.
 */
function aacp_footer_js() {
	if ( empty( $GLOBALS['aacp_used'] ) ) { return; }
	echo <<<'AACPJS'
<script id="aa-career-js">
/* Agile Agilist — career paths + find-your-training (v2). Progressive enhancement only:
   the server renders both views, every path and every track; this script adds tabs, the
   goal/track switch and the "Career path" deep-link from a course chip. No dependencies. */
(function () {
  function grow(p) {
    if (!p.classList.contains('aacp-panel')) return;
    p.classList.add('is-growing');
    void p.offsetWidth;
    setTimeout(function () { p.classList.remove('is-growing'); }, 30);
  }

  function tabset(list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus, animate) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach(function (p, k) { if (!p) return; p.hidden = k !== i; if (k === i && animate) grow(p); });
      if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: tabs[i].offsetLeft - list.offsetLeft - 8, behavior: 'smooth' });
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { select(k, false, true); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (k + 1) % n;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (k - 1 + n) % n;
        if (e.key === 'Home') j = 0;
        if (e.key === 'End') j = n - 1;
        if (j !== null) { e.preventDefault(); select(j, true, true); }
      });
    });
    return { select: select, indexOf: function (p) { return panels.indexOf(p); } };
  }

  function init(root) {
    if (root.dataset.aacpReady) return;
    root.dataset.aacpReady = '1';
    root.classList.add('aacp--js');

    var pl = root.querySelector('.aacp-tabs'), tl = root.querySelector('.aacp-ttabs');
    var paths = pl ? tabset(pl) : null, tracks = tl ? tabset(tl) : null;
    if (paths) paths.select(0, false, false);
    if (tracks) tracks.select(0, false, false);

    var views = Array.prototype.slice.call(root.querySelectorAll('[data-view-panel]'));
    var radios = Array.prototype.slice.call(root.querySelectorAll('.aacp-switch [role="radio"]'));
    function setView(v, focus) {
      if (views.length < 2) return;
      root.dataset.view = v;
      radios.forEach(function (r) {
        var on = r.dataset.view === v;
        r.setAttribute('aria-checked', on ? 'true' : 'false');
        r.tabIndex = on ? 0 : -1;
        if (on && focus) r.focus();
      });
      views.forEach(function (p) { p.hidden = p.dataset.viewPanel !== v; });
    }
    setView('goal');
    radios.forEach(function (r, k) {
      r.addEventListener('click', function () { setView(r.dataset.view); });
      r.addEventListener('keydown', function (e) {
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
        e.preventDefault(); setView(radios[(k + 1) % radios.length].dataset.view, true);
      });
    });
    root.querySelectorAll('[data-view-to]').forEach(function (b) {
      b.addEventListener('click', function () { setView(b.dataset.viewTo); scrollToRoot(); });
    });

    function scrollToRoot() {
      var top = root.getBoundingClientRect().top + window.scrollY - 68;
      if (root.getBoundingClientRect().top < 0) window.scrollTo({ top: top, behavior: 'smooth' });
    }

    function focusCourse(code) {
      var step = root.querySelector('.aacp-step[data-code="' + code + '"]');
      if (!step) return;
      var panel = step.closest('.aacp-panel');
      setView('goal');
      if (paths) paths.select(paths.indexOf(panel), false, true);
      root.querySelectorAll('.aacp-step.is-pick').forEach(function (s) { s.classList.remove('is-pick'); });
      step.classList.add('is-pick');
      var top = root.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
    root.querySelectorAll('.aacp-pathbtn').forEach(function (b) {
      b.addEventListener('click', function () { focusCourse(b.dataset.focus); });
    });

    /* deep links: #<id>-path-<slug> or #<id>-track-<slug> open the right view + tab */
    function fromHash() {
      if (!location.hash) return;
      var el = root.querySelector(location.hash.replace(/[^\w#-]/g, ''));
      if (!el) return;
      if (el.classList.contains('aacp-panel')) { setView('goal'); if (paths) paths.select(paths.indexOf(el), false, false); }
      if (el.classList.contains('aacp-tpanel')) { setView('track'); if (tracks) tracks.select(tracks.indexOf(el), false, false); }
    }
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }
  function boot() { document.querySelectorAll('[data-aacp]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
</script>
AACPJS;
}
add_action( 'wp_footer', 'aacp_footer_js', 20 );

endif;
