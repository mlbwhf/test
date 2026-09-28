/* ============================================================================
   CAREER PATHS  —  [aa_career_paths] and [aa_career_tracks]
   ----------------------------------------------------------------------------
   From the "Agile Agilist hero rebuild" design handoff. The markup, the CSS and
   the tab script are the designer's; what changed is how it gets its data and
   how it is installed.

   INSTALLED AS A SNIPPET, NOT A CHILD THEME. The handoff installs four files
   into wp-content/themes/<child>/inc/aa-career/ and requires them from
   functions.php. There is no theme-file access on this site -- every line of
   PHP here goes through WPCode -- so the enqueue block, AACP_DIR, aacp_url()
   and the JSON file are gone. The CSS lives in the site's CSS snippet beside
   everything else, the script prints once in the footer, and the data is the
   array below.

   THE DATA IS OURS, NOT THE HANDOFF'S. The JSON shipped with placeholder
   salaries, placeholder cohort dates and several URLs its README flags as
   guesses. Three of those guesses are wrong -- /training/safe/advanced-scrum-master/
   is /training/safe/asm/, and all three AI-Native steps pointed at the category
   page rather than the courses. So nothing here carries its own copy of a name,
   a URL or a figure:

     pay    aa_salary_data()   the dataset the salary chart renders
     name   aa_reg_cert_label()
     url    aa_reg_code_url()
     dates  aa_reg_upcoming()  the real cohort calendar, via aacp_next_cohort

   Only the ladders themselves and the "unlocks" role wording live here.

   THE LADDERS ARE THE CORRECTED ONES. The handoff's first path was
   SSM -> SASM -> RTE -> LPM under the title "Scrum Master to portfolio
   leader", which is the path the client rejected twice: portfolio funding is
   not the step after running a train. Delivery ends at the train here, and
   Lean Portfolio Management sits on the product-and-portfolio ladder where it
   belongs.

   EVERY LADDER MUST ASCEND. The last step is amber-topped and read as the
   destination, so a path whose final salary is lower than the one before it
   reads as a mistake. Anything reordered here has to keep that true.
   ========================================================================== */

if ( ! function_exists( 'aacp_data' ) ) :

/**
 * Median total comp for a credential, in thousands, from the shared dataset.
 *
 * Returns 0 for a code with no published median. A step with no figure cannot
 * be drawn -- the bar height is a normalised salary -- so aacp_data() drops it
 * rather than invent one. That is why Large Solution is not a step on the
 * delivery ladder even though it is where the ladder ends on the track pages:
 * no salary source publishes a median for a 2026 credential yet.
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

/**
 * The ladders. Filter 'aacp_data' to swap the source.
 *
 * A step is just a code: the name, the URL and the pay are looked up, so this
 * array cannot drift from the course pages or from the salary chart.
 */
function aacp_data() {
	static $data = null;
	if ( null !== $data ) { return $data; }

	$paths = array(
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

	$roles = aacp_roles();
	$out   = array();
	foreach ( $paths as $p ) {
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
		$out[] = $p;
	}

	$data = apply_filters( 'aacp_data', array(
		'provider'    => array( 'name' => 'Agile Agilist', 'url' => home_url( '/' ) ),
		'roadmapUrl'  => '/cert-recommender/',
		'calendarUrl' => '/training/',
		'categories'  => array( 'safe' => 'SAFe by Role', 'adv-safe' => 'Advanced SAFe', 'ai-native' => 'AI-Native' ),
		'paths'       => $out,
	) );
	return $data;
}

/**
 * The next real cohort for a step, from the live calendar.
 *
 * The handoff shipped hard-coded dates and a filter to replace them. This is
 * that filter. aa_reg_upcoming() already drops finished and sold-out cohorts,
 * so anything it returns is bookable; a course with none left renders
 * "New dates soon" against the calendar, which is the handoff's own fallback.
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

/** One id per block on the page, without depending on wp_unique_id(). */
function aacp_uid() {
	static $n = 0;
	$n++;
	return 'aacp-' . $n;
}

function aacp_shortcode( $atts ) {
	$a = shortcode_atts( array(
		'mode' => 'home', 'category' => 'safe', 'course' => 'RTE', 'id' => '', 'eyebrow' => '',
	), $atts, 'aa_career_paths' );

	$d = aacp_data();
	if ( empty( $d['paths'] ) ) { return ''; }
	$GLOBALS['aacp_used'] = true;

	$mode   = in_array( $a['mode'], array( 'home', 'category', 'course' ), true ) ? $a['mode'] : 'home';
	$cat    = sanitize_key( $a['category'] );
	$course = strtoupper( sanitize_text_field( $a['course'] ) );
	$paths  = $d['paths'];

	if ( 'category' === $mode ) {
		$paths = array_values( array_filter( $paths, function ( $p ) use ( $cat ) {
			return in_array( $cat, $p['cats'], true );
		} ) );
		if ( 'adv-safe' === $cat ) {
			usort( $paths, function ( $x, $y ) {
				return ( isset( $x['advOrder'] ) ? $x['advOrder'] : 9 ) - ( isset( $y['advOrder'] ) ? $y['advOrder'] : 9 );
			} );
		}
	}
	if ( 'course' === $mode ) {
		$paths = array_values( array_filter( $paths, function ( $p ) use ( $course ) {
			foreach ( $p['steps'] as $s ) { if ( $s['code'] === $course ) { return true; } }
			return false;
		} ) );
	}
	if ( ! $paths ) { $paths = $d['paths']; }

	$cat_name    = isset( $d['categories'][ $cat ] ) ? $d['categories'][ $cat ] : 'SAFe';
	$course_step = null;
	foreach ( $d['paths'] as $p ) {
		foreach ( $p['steps'] as $s ) { if ( $s['code'] === $course ) { $course_step = $s; break 2; } }
	}

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
		$copy = array( '( 02 ) — Career paths', 'Pick the role you want next.', 'We map the certifications that get you there.',
			'Four ladders into the roles these credentials actually hire for. Every step shows what it unlocks, the median pay, and the next live cohort.' );
	}
	if ( $a['eyebrow'] ) { $copy[0] = $a['eyebrow']; }

	$uid   = aacp_uid();
	$multi = count( $paths ) > 1;
	$o     = '<section class="aacp" data-aacp' . ( $a['id'] ? ' id="' . esc_attr( $a['id'] ) . '"' : '' ) . ' aria-labelledby="' . $uid . '-h">';
	$o    .= '<div class="aacp-head"><div><p class="aacp-eyebrow"><i aria-hidden="true"></i>' . esc_html( $copy[0] ) . '</p>'
		. '<h2 id="' . $uid . '-h">' . esc_html( $copy[1] ) . ' <em>' . esc_html( $copy[2] ) . '</em></h2></div>'
		. '<p class="aacp-intro">' . esc_html( $copy[3] ) . '</p></div>';

	if ( $multi ) {
		$o .= '<div class="aacp-tabs" role="tablist" aria-label="Career paths">';
		foreach ( $paths as $i => $p ) {
			$n    = count( $p['steps'] );
			$lift = $p['steps'][ $n - 1 ]['pay'] - $p['steps'][0]['pay'];
			$o   .= '<button type="button" class="aacp-tab" role="tab" id="' . $uid . '-t' . $i . '" aria-controls="' . $uid . '-' . esc_attr( $p['slug'] ) . '" aria-selected="' . ( 0 === $i ? 'true' : 'false' ) . '"' . ( $i ? ' tabindex="-1"' : '' ) . '>'
				. '<span class="aacp-kicker">' . esc_html( $p['kicker'] ) . '</span>'
				. '<span class="aacp-tab-title">From ' . esc_html( $p['from'] ) . ' to <em>' . esc_html( $p['to'] ) . '</em></span>'
				. '<span class="aacp-tab-lift">+' . aacp_money( $lift ) . ' median lift · ' . $n . ' steps</span></button>';
		}
		$o .= '</div>';
	}

	$ld = array();
	foreach ( $paths as $i => $p ) {
		$n    = count( $p['steps'] );
		$pays = wp_list_pluck( $p['steps'], 'pay' );
		$max  = max( $pays );
		$min  = min( $pays );
		$lift = $p['steps'][ $n - 1 ]['pay'] - $p['steps'][0]['pay'];
		$adv  = 'category' === $mode && 'adv-safe' === $cat && ! empty( $p['advEntry'] );
		$here = 0;
		foreach ( $p['steps'] as $j => $s ) {
			if ( ( 'course' === $mode && $s['code'] === $course ) || ( $adv && $s['code'] === $p['advEntry'] ) ) { $here = $j; }
		}
		$ladder = 'course' === $mode || $adv;

		$o .= '<div class="aacp-panel" id="' . $uid . '-' . esc_attr( $p['slug'] ) . '"' . ( $multi ? ' role="tabpanel" aria-labelledby="' . $uid . '-t' . $i . '"' : '' ) . '>';
		$o .= '<div class="aacp-ptop"><div><h3>' . esc_html( $p['from'] . ' → ' . $p['to'] ) . '</h3><p>' . esc_html( $p['blurb'] ) . '</p></div>'
			. '<dl class="aacp-kpis"><div><dt>median pay lift across the path</dt><dd>+' . aacp_money( $lift ) . '</dd></div>'
			. '<div><dt>months, typical pace</dt><dd>' . esc_html( $p['months'] ) . '</dd></div></dl></div>';
		$o .= '<ol class="aacp-ladder" style="--n:' . $n . '" aria-label="' . esc_attr( $n . '-step path: ' . implode( ', then ', wp_list_pluck( $p['steps'], 'name' ) ) ) . '">';

		$courses = array();
		foreach ( $p['steps'] as $j => $s ) {
			$r       = $max === $min ? 1 : ( $s['pay'] - $min ) / ( $max - $min );
			$is_here = $j === $here;
			$past    = $ladder && $j < $here;
			if ( 'course' === $mode )  { $flag = $is_here ? 'This course' : ( $j === $here + 1 ? 'Next step' : ( $past ? 'Before' : '' ) ); }
			elseif ( $adv )            { $flag = $is_here ? 'Start here' : ( $past ? 'Prerequisite' : '' ); }
			else                       { $flag = 0 === $j ? 'Start here' : ''; }
			$soft    = $ladder && ! $is_here;
			$c       = aacp_cohort( $s );
			$reg_url = $c ? $c['url'] : $d['calendarUrl'];

			$cls = 'aacp-step' . ( $is_here ? ' is-here' : '' ) . ( $is_here && $ladder ? ' is-focus' : '' ) . ( $past ? ' is-past' : '' );
			$o  .= '<li class="' . $cls . '" style="--r:' . round( $r, 3 ) . ';--j:' . $j . '">'
				. '<span class="aacp-bar" aria-hidden="true"><i></i></span>'
				. '<div class="aacp-srow"><span class="aacp-stepno">Step ' . sprintf( '%02d', $j + 1 ) . '</span>'
				. ( $flag ? '<span class="aacp-flag' . ( $soft ? ' aacp-flag--soft' : '' ) . '">' . esc_html( $flag ) . '</span>' : '' ) . '</div>'
				. '<p class="aacp-pay"><b>' . aacp_money( $s['pay'] ) . '</b><span>median total comp</span></p>'
				. '<h4><a href="' . esc_url( $s['url'] ) . '">' . esc_html( $s['name'] ) . '</a> <abbr title="' . esc_attr( $s['name'] ) . '">(' . esc_html( $s['code'] ) . ')</abbr></h4>'
				. '<p class="aacp-role">Unlocks — ' . esc_html( $s['role'] ) . '</p>'
				. '<div class="aacp-sfoot"><span class="aacp-next">Next cohort · '
				. ( $c ? '<time datetime="' . esc_attr( $c['start'] ) . '">' . esc_html( aacp_range( $c['start'], $c['end'] ) ) . '</time>' : '<strong>New dates soon</strong>' ) . '</span>'
				. '<a class="aacp-reg" href="' . esc_url( $reg_url ) . '" aria-label="' . esc_attr( 'Register for ' . $s['name'] ) . '">' . ( $is_here && 'course' === $mode ? 'Register now' : 'Register' ) . ' <span aria-hidden="true">⟶</span></a></div></li>';

			$course_ld = array(
				'@type' => 'Course', 'name' => $s['name'], 'courseCode' => $s['code'], 'url' => $s['url'],
				'description' => $s['name'] . ' certification. Prepares for: ' . $s['role'] . '.',
				'provider' => array( '@type' => 'Organization', 'name' => $d['provider']['name'], 'sameAs' => $d['provider']['url'] ),
			);
			if ( $c ) {
				$course_ld['hasCourseInstance'] = array( '@type' => 'CourseInstance', 'courseMode' => 'online', 'startDate' => $c['start'], 'endDate' => $c['end'] );
			}
			$courses[] = $course_ld;
		}
		$o .= '</ol>';

		$cta = $p['steps'][ $here ];
		$cc  = aacp_cohort( $cta );
		$o  .= '<div class="aacp-ctas">'
			. '<a class="aacp-cta" href="' . esc_url( $cc ? $cc['url'] : $d['calendarUrl'] ) . '">Register for ' . esc_html( $cta['name'] ) . ( $cc ? ' · ' . esc_html( aacp_range( $cc['start'], $cc['end'] ) ) : '' ) . ' <span aria-hidden="true">⟶</span></a>'
			. '<a class="aacp-cta2" href="' . esc_url( $d['roadmapUrl'] ) . '">Get my free 12-month roadmap</a>'
			. '<a class="aacp-cta3" href="' . esc_url( $p['trackUrl'] ) . '">Explore the ' . esc_html( $p['trackName'] ) . ' track <span aria-hidden="true">⟶</span></a>'
			. '</div></div>';

		$ld[] = array( '@type' => 'ListItem', 'position' => $i + 1, 'item' => array(
			'@type' => 'EducationalOccupationalProgram',
			'name' => 'Career path: ' . $p['from'] . ' to ' . $p['to'],
			'description' => $p['blurb'],
			'url' => ( 'home' === $mode ? home_url( '/' ) : get_permalink() ) . '#' . $uid . '-' . $p['slug'],
			'provider' => array( '@type' => 'Organization', 'name' => $d['provider']['name'], 'sameAs' => $d['provider']['url'] ),
			'educationalProgramMode' => 'online',
			'occupationalCredentialAwarded' => implode( ', ', wp_list_pluck( $p['steps'], 'name' ) ),
			'salaryUponCompletion' => array( '@type' => 'MonetaryAmountDistribution', 'currency' => 'USD', 'duration' => 'P1Y',
				'median' => $p['steps'][ $n - 1 ]['pay'] * 1000 ),
			'hasCourse' => $courses,
		) );
	}

	$o .= '<script type="application/ld+json">' . wp_json_encode( array(
		'@context' => 'https://schema.org', '@type' => 'ItemList',
		'name' => wp_strip_all_tags( $copy[1] . ' ' . $copy[2] ), 'itemListElement' => $ld,
	), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>';
	$o .= '</section>';
	return $o;
}
add_shortcode( 'aa_career_paths', 'aacp_shortcode' );

/**
 * The "Or browse by track" chip row that sits under the block on the home page.
 *
 * Built from aa_home_track_data() -- the same source the tracks accordion used
 * -- so the tally on each chip is the real number of certifications in that
 * track and cannot go stale when a course is added.
 */
function aacp_tracks_shortcode( $atts ) {
	if ( ! function_exists( 'aa_home_track_data' ) ) { return ''; }
	$a  = shortcode_atts( array( 'label' => 'Or browse by track' ), $atts, 'aa_career_tracks' );
	$tr = aa_home_track_data( '' );
	if ( ! $tr ) { return ''; }

	$h = '<div class="aacp-tracks"><span class="aacp-tracks-l">' . esc_html( $a['label'] ) . '</span><ul>';
	foreach ( $tr as $t ) {
		$h .= '<li><a href="' . esc_url( $t['href'] ) . '">' . esc_html( $t['label'] )
		   . '<span>' . count( $t['certs'] ) . '</span></a></li>';
	}
	return $h . '</ul></div>';
}
add_shortcode( 'aa_career_tracks', 'aacp_tracks_shortcode' );

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
 * No page edits: every course page already ships <section id="path"> and its
 * jump menu already links to it, so swapping the body keeps the anchor, the
 * numbering and the menu intact. A course on no ladder is left alone rather
 * than shown a block that does not mention it.
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
	$body = aacp_shortcode( array( 'mode' => 'course', 'course' => $code ) );
	if ( $body === '' ) { return $content; }

	$open = substr( $content, $span[0], strpos( $content, '>', $span[0] ) - $span[0] + 1 );
	return substr( $content, 0, $span[0] ) . $open . $body . '</section>' . substr( $content, $span[1] );
}
add_filter( 'the_content', 'aacp_course_swap', 12 );

/**
 * The tab script, printed once and only on a page that rendered the block.
 *
 * Progressive enhancement, exactly as the handoff intends: the server renders
 * every panel visible and this only turns them into ARIA tabs. With the script
 * blocked, every path is still on the page and still readable, which is the
 * whole reason the block is server-rendered.
 */
function aacp_footer_js() {
	if ( empty( $GLOBALS['aacp_used'] ) ) { return; }
	/* NOWDOC, NOT A ?> BLOCK. The snippet body has no opening <?php of its own
	   -- WPCode supplies it -- so dropping out of PHP mid-file to print markup
	   works but leaves the rest of the file one stray character away from
	   rendering itself to the page. A nowdoc never interpolates and never
	   leaves PHP mode. */
	echo <<<'AACPJS'
<script id="aa-career-js">
(function(){function init(root){if(root.dataset.aacpReady)return;root.dataset.aacpReady='1';
var tabs=Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
var panels=Array.prototype.slice.call(root.querySelectorAll('.aacp-panel'));
if(!panels.length)return;root.classList.add('aacp--js');
function select(i,focus,animate){tabs.forEach(function(t,k){var on=k===i;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;if(on&&focus)t.focus();});
panels.forEach(function(p,k){if(k===i){p.hidden=false;if(animate){p.classList.add('is-growing');void p.offsetWidth;setTimeout(function(){p.classList.remove('is-growing');},30);}}else{p.hidden=true;}});
if(tabs[i]){var strip=tabs[i].parentNode;if(strip.scrollWidth>strip.clientWidth)strip.scrollTo({left:tabs[i].offsetLeft-strip.offsetLeft,behavior:'smooth'});}}
var start=0;tabs.forEach(function(t,k){if(t.getAttribute('aria-selected')==='true')start=k;});
if(location.hash)panels.forEach(function(p,k){if('#'+p.id===location.hash)start=k;});
select(start,false);
tabs.forEach(function(t,k){t.addEventListener('click',function(){select(k,false,true);});
t.addEventListener('keydown',function(e){var n=tabs.length,j=null;
if(e.key==='ArrowRight'||e.key==='ArrowDown')j=(k+1)%n;
if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=(k-1+n)%n;
if(e.key==='Home')j=0;if(e.key==='End')j=n-1;
if(j!==null){e.preventDefault();select(j,true,true);}});});}
function boot(){document.querySelectorAll('[data-aacp]').forEach(init);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();})();
</script>
AACPJS;
}
add_action( 'wp_footer', 'aacp_footer_js', 20 );

endif;
