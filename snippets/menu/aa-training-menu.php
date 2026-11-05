<?php
/**
 * AA — Training menu   [aa_training_menu mode="page|dropdown"]
 *
 * WPCode: PHP snippet, "Run everywhere". Paste everything below the <?php line.
 *
 * The Training mega menu from the design handoff (design_handoff_mega_menu,
 * html/mega-menu.html + wordpress/aa-mm): category rail with the sliding
 * highlight, class cards with the + / ✓ shortlist toggle and flying dot,
 * search across every category, the sticky shortlist tray, keyboard arrows on
 * the tabs and swipe between categories. Markup, CSS and JS are the handoff's
 * own; what this file changes is listed here so nobody has to diff it.
 *
 *  1. DATA IS LIVE. The handoff ships placeholder names, dates and URLs in
 *     training-menu.json. Here each class resolves through the register
 *     snippet (aa_reg_course / aa_reg_upcoming), so the "Next" date on a card
 *     is the next date the course page sells, and the link is the real page.
 *     The categories themselves are data (aa_mm_categories) exactly as the
 *     handoff asks: add an entry and it appears with its own colour.
 *  2. HEADER DROPDOWN, NOT ONLY A PAGE. The panel prints once per page in the
 *     footer and opens under the Training tab (hover-intent, or click). The
 *     Training item's "aa-mega" class is swapped for "aa-mm-trigger" at render
 *     time, so the old two-column panel no longer opens for Training and the
 *     mobile accordion (which reads the same WordPress menu) is untouched.
 *     Deactivate this snippet and the old panel is back; nothing was edited.
 *  3. "Pick dates (n)" goes to the selection flow at /training/select/ with
 *     the shortlisted class ids; a single class goes to its page's #enroll
 *     (the pages have no #register). Classes the flow does not offer fall
 *     back to the first class's page.
 *  4. FONTS. The handoff names Instrument Sans, Instrument Serif and IBM Plex
 *     Mono. None is fetched: the sans inherits the site font, the serif falls
 *     to Newsreader (already loaded site-wide), the mono to the system mono.
 *     Three fewer font files on every page; the shapes are near-identical at
 *     these sizes.
 *  5. Page mode ([aa_training_menu] on /training/) also prints the plain
 *     <details> index and the ItemList JSON-LD. The dropdown does not: it is
 *     on every page, and the home page already carries the course ItemList.
 *  6. /training-menu.txt is served from the same data, and listed in llms.txt
 *     when the "AA — Agent ready" snippet is active.
 *  7. [aa_compare_table] renders the Core comparison table for /training/compare/
 *     from the selection-flow snippet's own table (same rows, same data).
 */

if ( ! defined( 'ABSPATH' ) ) { return; }

/* ============================================================================
   DATA
   ========================================================================== */

/**
 * The categories, in rail order. "courses" are register slugs (the course
 * page's slug), which is also what the selection flow takes in ?classes=.
 */
function aa_mm_categories() {
	return apply_filters( 'aa_mm_categories', array(
		array( 'id' => 'ai',    'name' => 'AI-Native',        'eyebrow' => 'Flagship',      'blurb' => 'Lead delivery with AI',
		       'desc' => 'The AI-Native track: from foundations to launching AI-powered release trains.', 'color' => '#8FCFCF',
		       'courses' => array( 'ai-native-foundations', 'ai-native-ready-certification', 'ai-native-ready-certification-2', 'ai-native-change-agent', 'launching-ai-native-arts' ) ),
		array( 'id' => 'core',  'name' => 'Core',             'eyebrow' => 'Start here',    'blurb' => 'Where most teams begin', 'isNew' => true,
		       'desc' => 'The essentials for teams and the people who run them. Pick the roles you need on your train.', 'color' => '#F2B66D',
		       'courses' => array( 'devops', 'team-practitioner', 'sa', 'scrum-master', 'popm' ) ),
		array( 'id' => 'roles', 'name' => 'SAFe Roles',       'eyebrow' => 'Role-based',    'blurb' => 'Advanced and specialist roles',
		       'desc' => 'Role certifications beyond the Core set: advanced Scrum, business ownership, engineering, architecture and large solutions.', 'color' => '#0E8074',
		       'courses' => array( 'asm', 'bo', 'ase', 'arch', 'large-solution' ) ),
		array( 'id' => 'adv',   'name' => 'Advanced SAFe',    'eyebrow' => 'Certification', 'blurb' => 'SPC, RTE, portfolio',
		       'desc' => 'Advanced practitioner and consultant certifications for leaders of transformation.', 'color' => '#5B8DEF',
		       'courses' => array( 'spc', 'aspc', 'rte', 'apm', 'lpm' ) ),
		array( 'id' => 'micro', 'name' => 'Micro-Credential', 'eyebrow' => 'Short & sharp', 'blurb' => 'Half-day to one day',
		       'desc' => 'Focused skills you can add in a day or less.', 'color' => '#C98BDB',
		       'courses' => array( 'responsible-ai-safe', 'conflict-collaboration', 'value-stream-mapping', 'agile-contracting-government' ) ),
		array( 'id' => 'ind',   'name' => 'SAFe by Industry', 'eyebrow' => 'Specialised',   'blurb' => 'Hardware, government',
		       'desc' => 'SAFe tuned for regulated and hardware-heavy environments.', 'color' => '#E58D7A',
		       'courses' => array( 'safe-for-hardware', 'safe-for-hardware-teams', 'sa-gov' ) ),
	) );
}

/**
 * The card name, code and page for each slug. The register snippet's names
 * are the long certification titles; a menu card wants the short name the
 * design uses. The URL and duration are only fallbacks for a page the
 * register cannot resolve (no #aa-cohorts element on it).
 */
function aa_mm_overrides() {
	return apply_filters( 'aa_mm_overrides', array(
		'ai-native-foundations'            => array( 'AI-Native Foundations',            'AINF',   '/training/ai-native/ai-native-foundations/',            '2 days' ),
		'ai-native-ready-certification'    => array( 'AI-Native SAFe Fundamentals',      'AINSF',  '/training/ai-native/ai-native-ready-certification/',    '1 day' ),
		'ai-native-ready-certification-2'  => array( 'Leading the AI-Native Org',        'AINORG', '/training/ai-native/ai-native-ready-certification-2/',  '1 day' ),
		'ai-native-change-agent'           => array( 'AI-Native Value Architect',        'AINVA',  '/training/ai-native/ai-native-change-agent/',           '2 days' ),
		'launching-ai-native-arts'         => array( 'Launching AI-Native ARTs',         'ARTL',   '/training/ai-native/launching-ai-native-arts/',         '2 days' ),
		'devops'                           => array( 'SAFe DevOps',                      'SDP',    '/training/safe/devops/',                                '2 days' ),
		'team-practitioner'                => array( 'SAFe for Teams (SP)',              'SP',     '/training/safe-industry/team-practitioner/',            '2 days' ),
		'sa'                               => array( 'Leading SAFe (SA)',                'SA',     '/training/safe/sa/',                                    '2 days' ),
		'scrum-master'                     => array( 'Scrum Master',                     'SSM',    '/training/safe/scrum-master/',                          '2 days' ),
		'popm'                             => array( 'SAFe POPM',                        'POPM',   '/training/safe/popm/',                                  '2 days' ),
		'asm'                              => array( 'Advanced Scrum Master',            'SASM',   '/training/safe/asm/',                                   '2 days' ),
		'bo'                               => array( 'Business Owner',                   'BO',     '/training/safe/bo/',                                    '2 days' ),
		'ase'                              => array( 'Agile Software Engineering (ASE)', 'ASE',    '/training/safe/ase/',                                   '3 days' ),
		'arch'                             => array( 'SAFe for Architects',              'ARCH',   '/training/safe/arch/',                                  '3 days' ),
		'large-solution'                   => array( 'Large Solution SAFe (LSSP)',       'LSSP',   '/training/adv-safe/large-solution/',                    '2 days' ),
		'spc'                              => array( 'Implementing SAFe (SPC)',          'SPC',    '/training/adv-safe/spc/',                               '4 days' ),
		'aspc'                             => array( 'Adv. Practice Consultant (ASPC)',  'ASPC',   '/training/adv-safe/aspc/',                              '4 days' ),
		'rte'                              => array( 'Release Train Engineer (RTE)',     'RTE',    '/training/adv-safe/rte/',                               '3 days' ),
		'apm'                              => array( 'Agile Product Mgmt (APM)',         'APM',    '/training/adv-safe/apm/',                               '3 days' ),
		'lpm'                              => array( 'Lean Portfolio Mgmt (LPM)',        'LPM',    '/training/adv-safe/lpm/',                               '2 days' ),
		'responsible-ai-safe'              => array( 'Achieving Responsible AI',         'RAI',    '/training/safe-found/responsible-ai-safe/',             '~6 hours' ),
		'conflict-collaboration'           => array( 'Conflict & Collaboration',         'AF-CC',  '/training/safe-found/conflict-collaboration/',          '~6 hours' ),
		'value-stream-mapping'             => array( 'Value Stream Mapping',             'AF-VSM', '/training/safe-found/value-stream-mapping/',            '~6 hours' ),
		'agile-contracting-government'     => array( 'Agile Contracting for Government', 'ACG',    '/training/safe-found/agile-contracting-government/',    '~6 hours' ),
		'safe-for-hardware'                => array( 'SAFe for Hardware',                'SHWP',   '/training/safe-industry/safe-for-hardware/',            '2 days' ),
		'safe-for-hardware-teams'          => array( 'SAFe for Hardware Teams',          'SHWA',   '/training/safe-industry/safe-for-hardware-teams/',      '2 days' ),
		'sa-gov'                           => array( 'Leading SAFe for Government',      'SA-GOV', '/training/safe-industry/sa-gov/',                       '2 days' ),
	) );
}

function aa_mm_lang() {
	return function_exists( 'aa_reg_lang' ) ? (string) aa_reg_lang() : 'en';
}

/** Which classes the selection flow offers (so the CTA knows where it can send a shortlist). */
function aa_mm_flow_slugs() {
	return function_exists( 'aa_fl_class_slugs' ) ? (array) aa_fl_class_slugs() : array( 'sa', 'scrum-master', 'popm', 'devops', 'team-practitioner', 'rte' );
}

function aa_mm_select_url() {
	return apply_filters( 'aa_mm_select_url', home_url( '/training/select/' ) );
}

/** One class, resolved live. Null if nothing is known about it. */
function aa_mm_course( $slug ) {
	$ov   = aa_mm_overrides();
	$o    = isset( $ov[ $slug ] ) ? $ov[ $slug ] : null;
	$c    = function_exists( 'aa_reg_course' ) ? aa_reg_course( $slug ) : null;
	if ( ! is_array( $c ) && ! $o ) { return null; }
	$en   = aa_mm_lang() === 'en';

	$name = is_array( $c ) && ! empty( $c['name'] ) ? wp_strip_all_tags( (string) $c['name'] ) : '';
	if ( $o && ( $en || $name === '' ) ) { $name = $o[0]; }     // short design name in English; the mirror's own name elsewhere
	$code = is_array( $c ) && ! empty( $c['code'] ) ? (string) $c['code'] : ( $o ? $o[1] : '' );
	if ( ! preg_match( '/^[A-Z0-9][A-Z0-9-]{1,7}$/', $code ) ) { $code = $o ? $o[1] : ''; }
	$url  = is_array( $c ) && ! empty( $c['url'] ) ? (string) $c['url'] : ( $o ? $o[2] : '' );
	if ( $url === '' ) { return null; }

	$days = is_array( $c ) && ! empty( $c['days'] ) ? (int) $c['days'] : 0;
	$dur  = $days > 0 ? ( $days === 1 ? __( '1 day', 'aa-mm' ) : sprintf( __( '%d days', 'aa-mm' ), $days ) ) : ( $o ? $o[3] : '' );

	$next = ''; $iso = '';
	if ( is_array( $c ) && function_exists( 'aa_reg_upcoming' ) ) {
		$tomorrow = ( new DateTime( 'tomorrow', new DateTimeZone( 'America/New_York' ) ) )->format( 'Y-m-d' );
		foreach ( (array) aa_reg_upcoming( $slug, $c ) as $k ) {
			if ( empty( $k['start'] ) || (string) $k['start'] < $tomorrow ) { continue; }
			$iso  = (string) $k['start'];
			$next = date_i18n( 'M j', strtotime( $iso ) );
			break;
		}
	}
	return array(
		'id'       => (string) $slug,
		'name'     => $name,
		'code'     => $code,
		'duration' => $dur,
		'next'     => $next,
		'iso'      => $iso,
		'url'      => home_url( $url ),
		'flow'     => in_array( $slug, aa_mm_flow_slugs(), true ),
	);
}

/**
 * Everything the menu renders, cached for an hour per language. The register
 * generates every course's schedule to find the next date, which is not
 * something to do on every page view.
 */
function aa_mm_data() {
	$key = 'aa_mm_data_' . aa_mm_lang();
	$d   = get_transient( $key );
	if ( ! is_array( $d ) || empty( $d['categories'] ) ) {
		$cats = array(); $courses = array();
		foreach ( aa_mm_categories() as $cat ) {
			$ids = array();
			foreach ( (array) $cat['courses'] as $slug ) {
				if ( ! isset( $courses[ $slug ] ) ) {
					$c = aa_mm_course( $slug );
					if ( $c ) { $courses[ $slug ] = $c; }
				}
				if ( isset( $courses[ $slug ] ) ) { $ids[] = $slug; }
			}
			if ( ! $ids ) { continue; }
			$cat['courses'] = $ids;
			$cats[] = $cat;
		}
		$d = array( 'defaultCategory' => 'core', 'categories' => $cats, 'courses' => $courses );
		set_transient( $key, $d, HOUR_IN_SECONDS );
	}
	return apply_filters( 'aa_mm_data', $d );
}

function aa_mm_flush() {
	foreach ( array( 'en', 'fr', 'es', 'ar' ) as $l ) { delete_transient( 'aa_mm_data_' . $l ); }
}
add_action( 'save_post_page', 'aa_mm_flush' );
add_action( 'update_option_aa_reg_sold', 'aa_mm_flush' );
add_action( 'update_option_aa_reg_prices_confirmed', 'aa_mm_flush' );

/* ============================================================================
   MARKUP  (the handoff's aa-mm.php, with the differences listed at the top)
   ========================================================================== */

function aa_mm_card( $id, $c, $i ) {
	$h  = '<li class="aa-mm__card" style="--i:' . (int) $i . '" data-id="' . esc_attr( $id ) . '" data-name="' . esc_attr( $c['name'] ) . '"'
	    . ' data-next="' . esc_attr( $c['next'] ) . '" data-url="' . esc_url( $c['url'] ) . '" data-flow="' . ( $c['flow'] ? '1' : '0' ) . '"'
	    . ' data-search="' . esc_attr( strtolower( $c['name'] . ' ' . $c['code'] ) ) . '">'
	    . '<div class="aa-mm__row"><h3 class="aa-mm__h"><a class="aa-mm__name" href="' . esc_url( $c['url'] ) . '">' . esc_html( $c['name'] ) . '</a></h3>'
	    . '<button type="button" class="aa-mm__add" aria-pressed="false" data-id="' . esc_attr( $id ) . '" aria-label="' . esc_attr( sprintf( __( 'Add %s to shortlist', 'aa-mm' ), $c['name'] ) ) . '"><span aria-hidden="true">+</span></button></div>'
	    . '<div class="aa-mm__meta">';
	if ( $c['code'] !== '' )     { $h .= '<span class="aa-mm__code">' . esc_html( $c['code'] ) . '</span>'; }
	if ( $c['duration'] !== '' ) { $h .= '<span>' . esc_html( $c['duration'] ) . '</span>'; }
	if ( $c['iso'] !== '' ) {
		$h .= '<span aria-hidden="true">·</span><span>' . esc_html__( 'Next', 'aa-mm' ) . ' <time datetime="' . esc_attr( $c['iso'] ) . '">' . esc_html( $c['next'] ) . '</time></span>';
	} else {
		$h .= '<span aria-hidden="true">·</span><span>' . esc_html__( 'Dates on request', 'aa-mm' ) . '</span>';
	}
	return $h . '</div></li>';
}

function aa_mm_jsonld( $courses ) {
	$items = array(); $p = 0;
	foreach ( $courses as $c ) {
		$item = array(
			'@type'    => 'Course',
			'name'     => $c['name'],
			'url'      => $c['url'],
			'provider' => array( '@type' => 'Organization', 'name' => 'Agile Agilist', 'url' => home_url( '/' ) ),
		);
		if ( $c['code'] !== '' ) { $item['courseCode'] = $c['code']; }
		if ( $c['iso'] !== '' )  { $item['hasCourseInstance'] = array( '@type' => 'CourseInstance', 'courseMode' => 'Online', 'startDate' => $c['iso'] ); }
		$items[] = array( '@type' => 'ListItem', 'position' => ++$p, 'item' => $item );
	}
	return '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@type' => 'ItemList', 'name' => 'Agile Agilist training classes', 'itemListElement' => $items ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>';
}

function aa_mm_render( $atts = array() ) {
	$atts = shortcode_atts( array( 'mode' => 'page' ), $atts, 'aa_training_menu' );
	$drop = $atts['mode'] === 'dropdown';
	$d    = aa_mm_data();
	$cats = $d['categories']; $courses = $d['courses'];
	if ( ! $cats ) { return ''; }
	aa_mm_assets();

	$h  = $drop ? '<div class="aa-mm-drop" id="aa-mm-drop" role="region" aria-label="' . esc_attr__( 'Training classes', 'aa-mm' ) . '">' : '';
	$h .= '<div class="aa-mm' . ( $drop ? ' aa-mm--drop' : '' ) . '" data-aa-mm data-default="' . esc_attr( $d['defaultCategory'] ) . '" data-select="' . esc_url( aa_mm_select_url() ) . '">';
	$h .= '<div class="aa-mm__top"><div><p class="aa-mm__eyebrow">' . esc_html__( 'Training · pick your classes', 'aa-mm' ) . '</p><p class="aa-mm__sub">' . esc_html__( 'Choose a category, tick the classes you want. They collect in your shortlist.', 'aa-mm' ) . '</p></div>'
	    . '<label class="aa-mm__search"><span aria-hidden="true">⌕</span><input type="search" placeholder="' . esc_attr__( 'Search all classes', 'aa-mm' ) . '" aria-label="' . esc_attr__( 'Search all classes', 'aa-mm' ) . '" autocomplete="off" enterkeyhint="search"></label></div>';
	$h .= '<div class="aa-mm__body"><div class="aa-mm__rail" role="tablist" aria-label="' . esc_attr__( 'Categories', 'aa-mm' ) . '"><span class="aa-mm__pill" aria-hidden="true"></span>';
	foreach ( $cats as $c ) {
		$h .= '<button type="button" role="tab" class="aa-mm__tab" id="aa-mm-tab-' . esc_attr( $c['id'] ) . '" aria-controls="aa-mm-panel-' . esc_attr( $c['id'] ) . '" aria-selected="false" data-cat="' . esc_attr( $c['id'] ) . '" style="--c:' . esc_attr( $c['color'] ) . '">'
		    . '<i class="aa-mm__dot"></i><span class="aa-mm__tabtxt"><b>' . esc_html( $c['name'] ) . ( ! empty( $c['isNew'] ) ? ' <u class="aa-mm__new">' . esc_html__( 'NEW', 'aa-mm' ) . '</u>' : '' ) . '</b><small>' . esc_html( $c['blurb'] ) . '</small></span><em>' . count( $c['courses'] ) . '</em></button>';
	}
	$h .= '</div><div class="aa-mm__panels">';
	foreach ( $cats as $c ) {
		$h .= '<section class="aa-mm__panel" role="tabpanel" id="aa-mm-panel-' . esc_attr( $c['id'] ) . '" aria-labelledby="aa-mm-tab-' . esc_attr( $c['id'] ) . '" data-cat="' . esc_attr( $c['id'] ) . '" data-name="' . esc_attr( $c['name'] ) . '" style="--c:' . esc_attr( $c['color'] ) . '">'
		    . '<header class="aa-mm__band" data-n="' . esc_attr( str_pad( (string) count( $c['courses'] ), 2, '0', STR_PAD_LEFT ) ) . '"><p class="aa-mm__eyebrow aa-mm__eyebrow--light">' . esc_html( $c['eyebrow'] ) . '</p><h2>' . esc_html( $c['name'] ) . '</h2><p>' . esc_html( $c['desc'] ) . '</p></header>'
		    . '<p class="aa-mm__status">' . esc_html( sprintf( _n( '%d class in %s. Next dates shown.', '%d classes in %s. Next dates shown.', count( $c['courses'] ), 'aa-mm' ), count( $c['courses'] ), $c['name'] ) ) . '</p>'
		    . '<ul class="aa-mm__grid">';
		foreach ( $c['courses'] as $i => $id ) { $h .= aa_mm_card( $id, $courses[ $id ], $i ); }
		$h .= '</ul></section>';
	}
	$h .= '<section class="aa-mm__panel aa-mm__results is-off" style="--c:#8FCFCF"><header class="aa-mm__band" data-n="··"><p class="aa-mm__eyebrow aa-mm__eyebrow--light">' . esc_html__( 'Search', 'aa-mm' ) . '</p><h2 data-aa-mm-rtitle></h2></header><p class="aa-mm__status" role="status" aria-live="polite"></p><ul class="aa-mm__grid"></ul></section>';
	$h .= '</div></div>';
	$h .= '<div class="aa-mm__trayw" inert><div class="aa-mm__tray"><div class="aa-mm__trayin"><div class="aa-mm__sheet" id="aa-mm-sheet' . ( $drop ? '-d' : '' ) . '"><ul class="aa-mm__chips"></ul></div><div class="aa-mm__bar">'
	    . '<button type="button" class="aa-mm__trayhead" aria-expanded="false" aria-controls="aa-mm-sheet' . ( $drop ? '-d' : '' ) . '"><span class="aa-mm__count" data-aa-mm-count>0</span><b>' . esc_html__( 'Your shortlist', 'aa-mm' ) . '</b><i class="aa-mm__caret" aria-hidden="true"></i></button>'
	    . '<div class="aa-mm__actions"><a class="aa-mm__cta" href="' . esc_url( aa_mm_select_url() ) . '" data-aa-mm-cta>' . esc_html__( 'Pick a date', 'aa-mm' ) . ' <span class="aa-mm__arrow" aria-hidden="true">⟶</span></a><button type="button" class="aa-mm__clear">' . esc_html__( 'Clear', 'aa-mm' ) . '</button></div>'
	    . '</div></div></div></div>';
	if ( ! $drop ) {
		$h .= '<details class="aa-mm__index"><summary>' . esc_html__( 'All classes as a plain list', 'aa-mm' ) . '</summary><div class="aa-mm__idxin">';
		foreach ( $cats as $c ) {
			$h .= '<h3>' . esc_html( $c['name'] ) . '</h3><p>' . esc_html( $c['desc'] ) . '</p><ul>';
			foreach ( $c['courses'] as $id ) {
				$k  = $courses[ $id ];
				$h .= '<li><a href="' . esc_url( $k['url'] ) . '">' . esc_html( $k['name'] ) . '</a>' . ( $k['code'] !== '' ? ' (' . esc_html( $k['code'] ) . ')' : '' ) . ( $k['duration'] !== '' ? ' · ' . esc_html( $k['duration'] ) : '' )
				    . ( $k['iso'] !== '' ? ' · ' . esc_html__( 'next', 'aa-mm' ) . ' <time datetime="' . esc_attr( $k['iso'] ) . '">' . esc_html( $k['next'] ) . '</time>' : '' ) . '</li>';
			}
			$h .= '</ul>';
		}
		$h .= '</div></details>';
	}
	$h .= '<p class="aa-mm__sr" role="status" aria-live="polite"></p>';
	if ( ! $drop ) { $h .= aa_mm_jsonld( $courses ); }
	$h .= '</div>' . ( $drop ? '</div>' : '' );
	return $h;
}
add_shortcode( 'aa_training_menu', 'aa_mm_render' );

/* ============================================================================
   HEADER DROPDOWN
   ========================================================================== */

function aa_mm_dropdown_on() {
	return get_option( 'aa_mm_dropdown', 'yes' ) !== 'no';
}

/* The Training item opens this panel, not the old one. Primary (desktop)
   location only: the mobile menu is the accordion and keeps its classes. */
add_filter( 'wp_nav_menu_objects', function ( $items, $args ) {
	if ( ! aa_mm_dropdown_on() || ! is_array( $items ) ) { return $items; }
	if ( empty( $args->theme_location ) || $args->theme_location !== 'primary' ) { return $items; }
	foreach ( $items as $it ) {
		if ( (int) $it->menu_item_parent !== 0 ) { continue; }
		$cls = (array) $it->classes;
		if ( ! in_array( 'aa-mega', $cls, true ) ) { continue; }
		$path = strtolower( trim( (string) wp_parse_url( (string) $it->url, PHP_URL_PATH ), '/' ) );
		$last = $path === '' ? '' : substr( $path, strrpos( '/' . $path, '/' ) );
		if ( ! in_array( $last, array( 'training', 'formation', 'formacion', 'formación' ), true ) && stripos( (string) $it->title, 'training' ) === false ) { continue; }
		$cls = array_values( array_diff( $cls, array( 'aa-mega' ) ) );
		$cls[] = 'aa-mm-trigger';
		$it->classes = $cls;
	}
	return $items;
}, 30, 2 );

/* One panel per page, printed from the footer. */
add_action( 'wp_footer', function () {
	if ( is_admin() || is_feed() || ! aa_mm_dropdown_on() ) { return; }
	if ( function_exists( 'is_customize_preview' ) && is_customize_preview() ) { return; }
	echo aa_mm_render( array( 'mode' => 'dropdown' ) ); // phpcs:ignore -- escaped as it is built
}, 20 );

/* ============================================================================
   ASSETS  (handoff aa-mm.css / aa-mm.js, printed once per page)
   ========================================================================== */

function aa_mm_assets() {
	static $done = false;
	if ( $done ) { return; }
	$done = true;
	add_action( 'wp_footer', 'aa_mm_print_assets', 30 );
	if ( did_action( 'wp_footer' ) ) { aa_mm_print_assets(); }
}

/* The CSS goes in <head> on every page so the dropdown never paints unstyled;
   the JS at the end of the body. */
add_action( 'wp_head', function () {
	if ( is_admin() || ! aa_mm_dropdown_on() ) { return; }
	echo '<style id="aa-mm-css">' . aa_mm_css() . '</style>' . "\n";
}, 40 );

function aa_mm_print_assets() {
	static $printed = false;
	if ( $printed ) { return; }
	$printed = true;
	if ( ! aa_mm_dropdown_on() ) { echo '<style id="aa-mm-css">' . aa_mm_css() . '</style>'; }
	echo '<script id="aa-mm-js">' . aa_mm_js() . '</script>';
}

function aa_mm_css() {
	return <<<'CSS'
.aa-mm{--ink:#0B2E35;--teal:#0E8074;--mint:#8FCFCF;--mist:#B9DCDC;--line:#DCEAE8;--soft:#F6FAF9;--mute:#5C7479;--aa-mm-serif:'Newsreader',"Instrument Serif",Georgia,serif;--aa-mm-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;position:relative;font-family:inherit;color:var(--ink);background:#fff;border:1px solid #CFE3E1;border-radius:20px;overflow:clip;box-shadow:0 30px 70px rgba(11,46,53,.16);-webkit-font-smoothing:antialiased;text-align:start}
.aa-mm *{box-sizing:border-box}
.aa-mm button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;box-shadow:none;text-transform:none;letter-spacing:normal;line-height:1.2}
.aa-mm a{color:inherit;text-decoration:none}
.aa-mm h2,.aa-mm h3,.aa-mm p,.aa-mm ul{font-family:inherit;color:inherit;margin:0;text-transform:none}
.aa-mm :focus-visible{outline:2px solid var(--teal);outline-offset:2px}
.aa-mm__sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.aa-mm__top{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--soft);border-bottom:1px solid #E6EFEE}
.aa-mm__eyebrow{margin:0 0 3px;font:600 10.5px/1.2 var(--aa-mm-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--teal)}
.aa-mm__eyebrow--light{color:var(--mint)}
.aa-mm__sub{margin:0;font-size:15px;color:#35555B}
.aa-mm__search{display:flex;align-items:center;gap:10px;flex:0 1 320px;min-width:min(100%,220px);height:46px;margin:0;padding:0 16px;border:1px solid #CFE3E1;border-radius:100px;background:#fff;color:var(--teal);transition:border-color .2s,box-shadow .2s}
.aa-mm__search:focus-within{border-color:var(--teal);box-shadow:0 0 0 4px rgba(14,128,116,.12)}
.aa-mm__search input,.aa-mm__search input:focus{flex:1;min-width:0;height:auto;margin:0;padding:0;border:0;outline:0;box-shadow:none;border-radius:0;background:transparent;font:inherit;font-size:16px;line-height:normal;color:var(--ink)}
.aa-mm__body{display:flex;flex-wrap:wrap}
.aa-mm__rail{position:relative;flex:1 1 250px;display:flex;flex-direction:column;gap:4px;padding:14px;border-inline-end:1px solid #E6EFEE}
.aa-mm__pill{position:absolute;left:0;top:0;width:0;height:0;border-radius:12px;background:var(--ink);box-shadow:inset 4px 0 0 var(--c,var(--mint));opacity:0;pointer-events:none;z-index:0;transition:transform .5s cubic-bezier(.3,.8,.2,1),width .5s cubic-bezier(.3,.8,.2,1),height .5s cubic-bezier(.3,.8,.2,1),opacity .25s}
.aa-mm__tab,.aa-mm__tab:hover,.aa-mm__tab:focus{position:relative;z-index:1;display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:8px 14px;border:0;border-radius:12px;background:transparent;color:var(--ink);text-align:start;transition:color .3s,background .2s}
.aa-mm__tab:hover{background:rgba(14,128,116,.08)}
.aa-mm__tab[aria-selected=true],.aa-mm__tab[aria-selected=true]:hover{color:#fff;background:transparent}
.aa-mm:not(.is-ready) .aa-mm__tab[aria-selected=true]{background:var(--ink)}
.aa-mm__dot{flex:none;width:10px;height:10px;border-radius:50%;background:var(--c)}
.aa-mm__tab[aria-selected=true] .aa-mm__dot{animation:aamRing 2.2s ease-out infinite}
.aa-mm__tabtxt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.aa-mm__tabtxt b{font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px}
.aa-mm__tabtxt small{font-size:12px;opacity:.75}
.aa-mm__tab em{font:600 12px var(--aa-mm-mono);font-style:normal;opacity:.8}
.aa-mm__new{text-decoration:none;font:600 9px var(--aa-mm-mono);letter-spacing:.1em;padding:2px 6px;border-radius:100px;background:#F2B66D;color:var(--ink);animation:aamBlink 2.4s ease-in-out infinite}
.aa-mm__panels{flex:3 1 520px;min-width:0;touch-action:pan-y}
.aa-mm__panel.is-off{display:none}
.aa-mm__band{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:8px;padding:22px 24px;color:#fff;background:radial-gradient(120% 140% at 100% 0,color-mix(in srgb,var(--c) 38%,transparent),transparent 62%),linear-gradient(110deg,#0B2E35 35%,#12384A 130%)}
.aa-mm__band>*{position:relative;z-index:1}
.aa-mm__band::before{content:"";position:absolute;width:260px;height:260px;border-radius:50%;background:var(--c);opacity:.2;filter:blur(60px);inset-inline-end:-60px;top:-100px;animation:aamDrift 9s ease-in-out infinite}
.aa-mm__band::after{content:attr(data-n);position:absolute;inset-inline-end:18px;bottom:-22px;font:400 124px/1 var(--aa-mm-serif);color:transparent;-webkit-text-stroke:1px rgba(255,255,255,.2);pointer-events:none}
.aa-mm__band h2{margin:0;font:400 clamp(28px,4vw,38px)/1.05 var(--aa-mm-serif);letter-spacing:-.01em;color:#fff}
.aa-mm__band p:last-child{margin:0;font-size:14.5px;line-height:1.5;color:var(--mist);max-width:56ch}
.aa-mm__status{margin:0;padding:14px 20px 0;font-size:13px;color:var(--mute)}
.aa-mm__grid{list-style:none;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr));gap:10px;padding:16px 20px 20px}
.aa-mm__card{display:flex;flex-direction:column;gap:9px;margin:0;padding:14px;border:1px solid var(--line);border-radius:14px;background:#fff;transition:border-color .25s,background .25s,transform .25s,box-shadow .25s}
.aa-mm__card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(11,46,53,.08)}
.aa-mm__card.is-on{border:1.5px solid var(--teal);background:#F2FAF9;padding:13.5px}
.aa-mm__row{display:flex;align-items:flex-start;gap:10px}
.aa-mm__h{flex:1;min-width:0;margin:0;font-size:15px;font-weight:600;line-height:1.3;letter-spacing:-.005em}
.aa-mm__name:hover{color:var(--teal)}
.aa-mm__add,.aa-mm__add:hover,.aa-mm__add:focus{flex:none;position:relative;width:44px;height:44px;margin:-6px -6px 0 0;padding:0;border-radius:50%;border:1.5px solid #BFD9D5;background:#fff;color:var(--teal);font-size:20px;font-weight:700;line-height:1;transition:background .25s,color .25s,border-color .25s,transform .15s}
.aa-mm__add:hover{border-color:var(--teal)}
.aa-mm__add:active{transform:scale(.9)}
.aa-mm__add[aria-pressed=true],.aa-mm__add[aria-pressed=true]:hover{background:var(--teal);border-color:var(--teal);color:#fff;animation:aamPop .35s ease-out}
.aa-mm__add[aria-pressed=true] span{font-size:0}
.aa-mm__add[aria-pressed=true] span::before{content:"✓";font-size:18px}
.aa-mm__meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:12.5px;color:var(--mute)}
.aa-mm__code{font:600 10.5px var(--aa-mm-mono);letter-spacing:.06em;padding:2px 7px;border-radius:6px;background:#EEF7F6;color:var(--ink)}
.aa-mm__incat{font-size:12px;font-weight:600;color:var(--teal)}
.aa-mm__trayw{display:grid;grid-template-rows:0fr;position:sticky;bottom:0;z-index:5;background:var(--ink);color:#fff;transition:grid-template-rows .45s cubic-bezier(.3,.8,.2,1)}
.aa-mm__trayw.is-open{grid-template-rows:1fr}
.aa-mm__tray{min-height:0;overflow:hidden}
.aa-mm__trayin{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;padding:14px 20px calc(14px + env(safe-area-inset-bottom))}
.aa-mm__bar{display:contents}
.aa-mm__trayhead,.aa-mm__trayhead:hover,.aa-mm__trayhead:focus{order:1;display:flex;align-items:center;gap:10px;background:transparent;border:0;color:#fff;font-size:15px;min-height:44px;padding:0}
.aa-mm__sheet{order:2;flex:1 1 260px;min-width:0}
.aa-mm__actions{order:3;display:flex;flex-wrap:wrap;gap:10px}
.aa-mm__caret{display:none;width:8px;height:8px;border-inline-end:2px solid var(--mint);border-bottom:2px solid var(--mint);transform:rotate(-135deg) translateY(2px);transition:transform .3s}
.aa-mm__count{width:30px;height:30px;border-radius:50%;background:var(--mint);color:var(--ink);font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center}
.aa-mm__count.bump{animation:aamBump .45s ease-out}
.aa-mm__chips{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.aa-mm__chip{display:inline-flex;align-items:center;gap:4px;margin:0;min-height:40px;padding:0 4px 0 14px;border-radius:100px;background:rgba(143,207,207,.16);border:1px solid rgba(143,207,207,.4);font-size:13.5px;font-weight:600;animation:aamPop .35s ease-out}
.aa-mm__chip small{font-weight:500;color:var(--mint);font-size:12.5px}
.aa-mm__chip button,.aa-mm__chip button:hover{width:40px;height:40px;padding:0;border:0;border-radius:50%;background:transparent;color:#fff;font-size:18px;line-height:1}
.aa-mm .aa-mm__cta,.aa-mm .aa-mm__cta:visited{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;border-radius:100px;background:var(--mint);color:var(--ink);font-weight:700;font-size:15px;text-decoration:none;transition:background .2s,transform .15s}
.aa-mm .aa-mm__cta:hover{background:#fff;color:var(--ink)}.aa-mm .aa-mm__cta:active{transform:scale(.97)}
.aa-mm__clear,.aa-mm__clear:hover,.aa-mm__clear:focus{min-height:48px;padding:0 18px;border-radius:100px;background:transparent;border:1px solid rgba(143,207,207,.5);color:#fff;font-weight:600;font-size:14px}
.aa-mm__clear:hover{border-color:var(--mint)}
.aa-mm__index{border-top:1px solid #E6EFEE;background:var(--soft)}
.aa-mm__index summary{padding:16px 20px;font-size:14px;font-weight:600;color:var(--teal);cursor:pointer;min-height:44px}
.aa-mm__idxin{padding:0 20px 20px;font-size:14px;line-height:1.6;color:#35555B}
.aa-mm__idxin h3{margin:16px 0 2px;font-size:15px;color:var(--ink)}.aa-mm__idxin p{margin:0 0 4px}.aa-mm__idxin ul{margin:0;padding-inline-start:18px;list-style:disc}
.aa-mm__idxin a{color:var(--teal);text-decoration:underline;text-underline-offset:2px}
.aa-mm:not(.is-ready) .aa-mm__index{display:none}
[dir=rtl] .aa-mm__arrow{display:inline-block;transform:scaleX(-1)}
.aa-mm__fly{position:fixed;z-index:100090;width:18px;height:18px;border-radius:50%;background:#8FCFCF;box-shadow:0 0 0 4px rgba(143,207,207,.35),0 0 18px #8FCFCF;pointer-events:none}
@keyframes aamPop{0%{transform:scale(.6)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
@keyframes aamBump{0%{transform:scale(1)}40%{transform:scale(1.45)}100%{transform:scale(1)}}
@keyframes aamRing{0%{box-shadow:0 0 0 0 var(--c)}100%{box-shadow:0 0 0 9px transparent}}
@keyframes aamBlink{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes aamDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,36px)}}
@keyframes aamPanel{from{opacity:0;transform:translateX(var(--dx,0))}}
@keyframes aamCard{from{opacity:0;transform:translateY(14px) scale(.98)}}
.aa-mm.is-ready .aa-mm__panel:not(.is-off){animation:aamPanel .4s cubic-bezier(.2,.7,.2,1) backwards}
.aa-mm.is-ready .aa-mm__panel:not(.is-off) .aa-mm__card{animation:aamCard .5s cubic-bezier(.2,.7,.2,1) backwards;animation-delay:calc(var(--i,0)*50ms + 90ms)}
.aa-mm:not(.is-ready) .aa-mm__rail,.aa-mm:not(.is-ready) .aa-mm__add,.aa-mm:not(.is-ready) .aa-mm__search,.aa-mm:not(.is-ready) .aa-mm__results,.aa-mm:not(.is-ready) .aa-mm__trayw{display:none}
.aa-mm:not(.is-ready) .aa-mm__panel{margin-bottom:12px}
@media (max-width:760px){
.aa-mm{border-radius:16px}
.aa-mm__sub{display:none}
.aa-mm__top{padding:12px 14px}.aa-mm__search{flex:1 1 100%}
.aa-mm__rail{flex-direction:row;gap:6px;overflow-x:auto;scroll-snap-type:x proximity;border-inline-end:0;border-bottom:1px solid #E6EFEE;scrollbar-width:none;padding:10px 14px;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 14px,#000 calc(100% - 28px),transparent);mask-image:linear-gradient(90deg,transparent 0,#000 14px,#000 calc(100% - 28px),transparent)}
.aa-mm__rail::-webkit-scrollbar{display:none}
.aa-mm__pill{box-shadow:inset 0 -3px 0 var(--c,var(--mint))}
.aa-mm__tab,.aa-mm__tab:hover{flex:0 0 auto;width:auto;min-height:48px;padding:6px 16px;scroll-snap-align:center;white-space:nowrap}
.aa-mm__tab small,.aa-mm__tab em{display:none}
.aa-mm__band{padding:18px 16px}.aa-mm__band::after{font-size:90px}
.aa-mm__grid{grid-template-columns:1fr;padding:14px 14px 18px}
.aa-mm__h{font-size:16px}
.aa-mm__trayin{flex-direction:column;align-items:stretch;gap:10px;padding:10px 14px calc(12px + env(safe-area-inset-bottom))}
.aa-mm__bar{display:flex;order:2;align-items:center;justify-content:space-between;gap:10px}
.aa-mm__sheet{order:1;flex:none;max-height:0;overflow:auto;transition:max-height .4s cubic-bezier(.3,.8,.2,1)}
.aa-mm__trayw.is-sheet .aa-mm__sheet{max-height:40vh}
.aa-mm__caret{display:block}.aa-mm__trayw.is-sheet .aa-mm__caret{transform:rotate(45deg)}
.aa-mm__actions{flex-wrap:nowrap}.aa-mm__clear{display:none}
.aa-mm .aa-mm__cta{padding:0 20px;white-space:nowrap}
}
/* ---- header dropdown: fixed under the sticky header, desktop only ---- */
.aa-mm-drop{position:fixed;left:50%;top:var(--aa-mm-top,86px);z-index:100010;width:min(1220px,calc(100vw - 40px));transform:translate(-50%,-10px) scale(.99);transform-origin:top center;visibility:hidden;opacity:0;transition:opacity .25s,transform .3s cubic-bezier(.2,.7,.2,1),visibility 0s .3s}
.aa-mm-drop.is-open{visibility:visible;opacity:1;transform:translate(-50%,0);transition-delay:0s}
.aa-mm-drop .aa-mm{max-height:calc(100vh - var(--aa-mm-top,86px) - 24px);overflow:auto;overscroll-behavior:contain;scrollbar-width:thin}
@media (max-width:921px){.aa-mm-drop{display:none}}
@media (min-width:922px){
html body #masthead .main-header-menu > .menu-item.aa-mm-trigger > .sub-menu{display:none !important;visibility:hidden !important}
html body #masthead .main-header-menu > .menu-item.aa-mm-trigger > a .ast-header-navigation-arrow,html body #masthead .main-header-menu > .menu-item.aa-mm-trigger > .ast-menu-toggle{display:none !important}
html body #masthead .main-header-menu > .menu-item.aa-mm-trigger.aa-mm-on > a,html body #masthead .main-header-menu > .menu-item.aa-mm-trigger.aa-mm-on > a.menu-link{background:#8FCFCF !important;color:#0B2E35 !important;font-weight:600 !important;box-shadow:inset 0 -3px 0 #0B2E35 !important;border-radius:0 !important}
html body #masthead .main-header-menu > .menu-item.aa-mm-trigger.aa-mm-on > a::after{display:none !important}
}
@media (prefers-reduced-motion:reduce){.aa-mm *,.aa-mm-drop{animation:none!important;transition:none!important}.aa-mm__fly{display:none}}
CSS;
}

function aa_mm_js() {
	return <<<'JS'
(function(){
  var KEY='aa_mm_sel',RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,ALL=[];
  function load(){try{return JSON.parse(sessionStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function save(a){try{sessionStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
  function init(root){
    var rail=root.querySelector('.aa-mm__rail'),pill=rail.querySelector('.aa-mm__pill'),
        tabs=[].slice.call(rail.querySelectorAll('.aa-mm__tab')),
        panels=[].slice.call(root.querySelectorAll('.aa-mm__panel[data-cat]')),
        host=root.querySelector('.aa-mm__panels'),results=root.querySelector('.aa-mm__results'),
        rgrid=results.querySelector('.aa-mm__grid'),rstatus=results.querySelector('.aa-mm__status'),rtitle=results.querySelector('[data-aa-mm-rtitle]'),
        input=root.querySelector('.aa-mm__search input'),trayw=root.querySelector('.aa-mm__trayw'),
        chips=root.querySelector('.aa-mm__chips'),count=root.querySelector('[data-aa-mm-count]'),
        cta=root.querySelector('[data-aa-mm-cta]'),head=root.querySelector('.aa-mm__trayhead'),
        clear=root.querySelector('.aa-mm__clear'),live=root.querySelector('.aa-mm__sr'),
        select=root.getAttribute('data-select')||'/training/select/',
        cards={},sel=load(),cur=root.getAttribute('data-default')||tabs[0].getAttribute('data-cat');
    panels.forEach(function(p){[].forEach.call(p.querySelectorAll('.aa-mm__card'),function(c){var id=c.getAttribute('data-id');(cards[id]=cards[id]||{el:c,cats:[]}).cats.push(p.getAttribute('data-name'))})});
    var ok=sel.filter(function(id){return cards[id]});if(ok.length!==sel.length){sel=ok;save(sel)}
    function say(t){live.textContent='';setTimeout(function(){live.textContent=t},30)}
    function movePill(){
      var t=tabs.filter(function(x){return x.getAttribute('aria-selected')==='true'})[0];
      if(!t){pill.style.opacity=0;return}
      pill.style.opacity=1;pill.style.setProperty('--c',t.style.getPropertyValue('--c'));
      pill.style.width=t.offsetWidth+'px';pill.style.height=t.offsetHeight+'px';
      pill.style.transform='translate('+t.offsetLeft+'px,'+t.offsetTop+'px)';
      if(rail.scrollWidth>rail.clientWidth+2)rail.scrollTo({left:t.offsetLeft-(rail.clientWidth-t.offsetWidth)/2,behavior:RM?'auto':'smooth'});
    }
    function show(cat,dir){
      cur=cat;root.style.setProperty('--dx',(dir||0)*28+'px');
      tabs.forEach(function(t){var on=t.getAttribute('data-cat')===cat;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1});
      panels.forEach(function(p){p.classList.toggle('is-off',p.getAttribute('data-cat')!==cat)});
      results.classList.add('is-off');movePill();
    }
    function go(step){var i=tabs.findIndex(function(t){return t.getAttribute('data-cat')===cur});var n=Math.max(0,Math.min(tabs.length-1,i+step));if(n!==i){input.value='';show(tabs[n].getAttribute('data-cat'),step)}}
    function bump(){count.classList.remove('bump');void count.offsetWidth;count.classList.add('bump')}
    function fly(btn){
      if(RM)return;requestAnimationFrame(function(){
        var a=btn.getBoundingClientRect(),b=count.getBoundingClientRect();if(!b.width)return;
        var d=document.createElement('span');d.className='aa-mm__fly';d.style.left=(a.left+a.width/2-9)+'px';d.style.top=(a.top+a.height/2-9)+'px';document.body.appendChild(d);
        var dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
        var an=d.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+dx*.55+'px,'+(dy*.55-70)+'px) scale(1.25)',opacity:1,offset:.5},{transform:'translate('+dx+'px,'+dy+'px) scale(.4)',opacity:.5}],{duration:650,easing:'cubic-bezier(.5,0,.3,1)'});
        an.onfinish=function(){d.remove();bump()};
      });
    }
    /* Where "Pick dates" goes: several classes the flow offers -> the flow with
       their ids; otherwise the first class's own registration section. */
    function target(){
      var flow=sel.filter(function(id){return cards[id].el.getAttribute('data-flow')==='1'});
      if(sel.length>1&&flow.length===sel.length){return select+(select.indexOf('?')>-1?'&':'?')+'classes='+encodeURIComponent(sel.join(','))}
      return cards[sel[0]].el.getAttribute('data-url')+'#enroll';
    }
    function sync(){
      root.querySelectorAll('.aa-mm__card').forEach(function(c){
        var on=sel.indexOf(c.getAttribute('data-id'))>-1,b=c.querySelector('.aa-mm__add');
        c.classList.toggle('is-on',on);b.setAttribute('aria-pressed',on);
        b.setAttribute('aria-label',(on?'Remove ':'Add ')+c.getAttribute('data-name')+(on?' from shortlist':' to shortlist'));
      });
      var has=sel.length>0;count.textContent=sel.length;chips.innerHTML='';
      trayw.classList.toggle('is-open',has);trayw.inert=!has;if(!has)trayw.classList.remove('is-sheet');
      sel.forEach(function(id){
        var c=cards[id].el,li=document.createElement('li');li.className='aa-mm__chip';
        li.innerHTML='<span></span> <small></small><button type="button">×</button>';
        li.children[0].textContent=c.getAttribute('data-name');var nx=c.getAttribute('data-next');li.children[1].textContent=nx?'· '+nx:'';
        li.children[2].setAttribute('aria-label','Remove '+c.getAttribute('data-name'));
        li.children[2].addEventListener('click',function(){toggle(id)});chips.appendChild(li);
      });
      if(has){cta.firstChild.textContent=(sel.length>1?'Pick dates ('+sel.length+')':'Pick a date')+' ';cta.href=target()}
    }
    function toggle(id,btn){
      var i=sel.indexOf(id),name=cards[id].el.getAttribute('data-name');
      if(i>-1){sel.splice(i,1);say('Removed '+name+'. '+sel.length+' in shortlist.')}
      else{sel.push(id);say('Added '+name+'. '+sel.length+' in shortlist.');if(btn)fly(btn);else bump()}
      save(sel);ALL.forEach(function(s){s.sel=sel.slice();s.sync()});
    }
    root.addEventListener('click',function(e){
      var add=e.target.closest('.aa-mm__add');if(add){toggle(add.getAttribute('data-id'),add);return}
      var tab=e.target.closest('.aa-mm__tab');
      if(tab){var from=tabs.indexOf(rail.querySelector('[aria-selected=true]')),to=tabs.indexOf(tab);input.value='';show(tab.getAttribute('data-cat'),to>from?1:-1)}
    });
    head.addEventListener('click',function(){var o=trayw.classList.toggle('is-sheet');head.setAttribute('aria-expanded',o)});
    clear.addEventListener('click',function(){sel=[];save(sel);ALL.forEach(function(s){s.sel=[];s.sync()});say('Shortlist cleared.')});
    root.addEventListener('keydown',function(e){if(e.key==='Escape'&&trayw.classList.contains('is-sheet')){trayw.classList.remove('is-sheet');head.setAttribute('aria-expanded',false);head.focus();e.stopPropagation()}});
    rail.addEventListener('keydown',function(e){
      var k=e.key,i=tabs.indexOf(document.activeElement);if(i<0)return;
      var n=k==='ArrowDown'||k==='ArrowRight'?i+1:k==='ArrowUp'||k==='ArrowLeft'?i-1:k==='Home'?0:k==='End'?tabs.length-1:-1;
      if(n<0)return;e.preventDefault();n=(n+tabs.length)%tabs.length;tabs[n].focus();input.value='';show(tabs[n].getAttribute('data-cat'),n>i?1:-1);
    });
    var sx=0,sy=0,st=0;
    host.addEventListener('touchstart',function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now()},{passive:true});
    host.addEventListener('touchend',function(e){
      var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
      if(Date.now()-st<600&&Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.6&&!input.value)go((dx<0?1:-1)*(getComputedStyle(root).direction==='rtl'?-1:1));
    },{passive:true});
    input.addEventListener('input',function(){
      var q=input.value.trim().toLowerCase();if(!q){show(cur,0);return}
      rgrid.innerHTML='';var n=0;
      Object.keys(cards).forEach(function(id){
        var c=cards[id].el;if(c.getAttribute('data-search').indexOf(q)<0)return;
        var k=c.cloneNode(true);k.style.setProperty('--i',n++);var s=document.createElement('span');s.className='aa-mm__incat';s.textContent='In '+cards[id].cats.join(', ');k.appendChild(s);rgrid.appendChild(k);
      });
      panels.forEach(function(p){p.classList.add('is-off')});tabs.forEach(function(t){t.setAttribute('aria-selected',false)});
      results.classList.remove('is-off');rtitle.textContent='Results for “'+input.value.trim()+'”';
      rstatus.textContent=n?n+(n===1?' match':' matches')+' across all categories':'No class matches. Try “SAFe” or “AI”.';
      pill.style.opacity=0;sync();
    });
    var api={get sel(){return sel},set sel(v){sel=v},sync:sync,movePill:movePill};ALL.push(api);
    root.classList.add('is-ready');show(cur,0);sync();
    if(window.ResizeObserver)new ResizeObserver(movePill).observe(rail);else window.addEventListener('resize',movePill);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(movePill);
    return api;
  }
  /* Header dropdown under the Training tab (class aa-mm-trigger, set server-side). */
  function dropdown(){
    var drop=document.getElementById('aa-mm-drop'),li=document.querySelector('#masthead .main-header-menu > .menu-item.aa-mm-trigger'),
        header=document.getElementById('masthead');
    if(!drop||!li||!header||!(window.matchMedia&&matchMedia('(min-width:922px)').matches))return;
    var trig=li.querySelector(':scope > a'),timer,quiet=false;
    function place(){var hb=header.getBoundingClientRect();drop.style.setProperty('--aa-mm-top',(Math.max(0,hb.bottom)+10)+'px')}
    function isOpen(){return drop.classList.contains('is-open')}
    function set(o){
      clearTimeout(timer);
      if(o&&!isOpen()){place();document.querySelectorAll('#masthead .menu-item.aa-mega.aa-open').forEach(function(t){t.classList.remove('aa-open')})}
      drop.classList.toggle('is-open',o);li.classList.toggle('aa-mm-on',o);
      if(trig)trig.setAttribute('aria-expanded',o?'true':'false');
      if(o){ALL.forEach(function(s){s.movePill()})}
    }
    function later(){clearTimeout(timer);timer=setTimeout(function(){set(false)},260)}
    if(trig){trig.setAttribute('aria-haspopup','true');trig.setAttribute('aria-expanded','false');
      /* first click opens; a click while it is open follows the link to /training/ */
      trig.addEventListener('click',function(e){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;if(!isOpen()){e.preventDefault();e.stopImmediatePropagation();set(true)}},true);
    }
    li.addEventListener('mouseenter',function(){clearTimeout(timer);timer=setTimeout(function(){set(true)},120)});
    li.addEventListener('mouseleave',later);
    li.addEventListener('focusin',function(){if(!quiet)set(true)});
    drop.addEventListener('mouseenter',function(){clearTimeout(timer)});
    drop.addEventListener('mouseleave',later);
    [].forEach.call(document.querySelectorAll('#masthead .main-header-menu > .menu-item:not(.aa-mm-trigger)'),function(o){o.addEventListener('mouseenter',function(){set(false)})});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&isOpen()){set(false);if(trig){quiet=true;trig.focus();quiet=false}}});
    document.addEventListener('click',function(e){if(isOpen()&&!drop.contains(e.target)&&!li.contains(e.target))set(false)},true);
    window.addEventListener('scroll',function(){if(isOpen())set(false)},{passive:true});
    window.addEventListener('resize',function(){if(isOpen())place()});
  }
  function boot(){[].forEach.call(document.querySelectorAll('[data-aa-mm]'),init);dropdown()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
JS;
}

/* ============================================================================
   /training-menu.txt  and the llms.txt entries
   ========================================================================== */

add_action( 'parse_request', function () {
	$path = (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '', PHP_URL_PATH ); // phpcs:ignore
	$base = rtrim( (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH ), '/' );
	if ( $base !== '' && strpos( $path, $base ) === 0 ) { $path = substr( $path, strlen( $base ) ); }
	if ( $path !== '/training-menu.txt' ) { return; }
	$d   = aa_mm_data();
	$out = "# Agile Agilist — training classes (plain text index)\n# Live, instructor-led, online. Prices are on each course page and in /llms.txt. Registration: the course page, or " . aa_mm_select_url() . "\n\n";
	foreach ( $d['categories'] as $c ) {
		$out .= '## ' . $c['name'] . ' — ' . $c['desc'] . "\n";
		foreach ( $c['courses'] as $id ) {
			$k    = $d['courses'][ $id ];
			$out .= '- ' . $k['name'] . ( $k['code'] !== '' ? ' (' . $k['code'] . ')' : '' ) . ' | ' . $k['duration'] . ' | ' . ( $k['iso'] !== '' ? 'next class ' . $k['iso'] : 'dates on request' ) . ' | ' . $k['url'] . "\n";
		}
		$out .= "\n";
	}
	if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
	status_header( 200 );
	header( 'Content-Type: text/plain; charset=utf-8' );
	header( 'Cache-Control: public, max-age=3600' );
	header( 'X-Robots-Tag: noindex' );
	echo $out; // phpcs:ignore -- plain text
	exit;
}, 1 );

add_filter( 'aa_ag_key_pages', function ( $pages ) {
	$pages[] = array( '/training/compare/', 'Compare Core classes', 'Price, length, exam and dates side by side' );
	$pages[] = array( '/training-menu.txt', 'Training classes, plain text', 'Every class with its code, length, next date and page' );
	return $pages;
} );

/* ============================================================================
   [aa_compare_table]  — the Core comparison, as a page of its own
   ========================================================================== */

add_shortcode( 'aa_compare_table', function () {
	if ( ! function_exists( 'aa_fl_courses' ) || ! function_exists( 'aa_fl_table' ) ) { return ''; }
	$courses = aa_fl_courses();
	if ( ! $courses ) { return '<p>' . esc_html__( 'No classes to compare right now.', 'aa-mm' ) . '</p>'; }
	$t = aa_fl_table( $courses );
	/* The flow's table carries two things that only mean something inside the
	   flow: the "Your date" row and the "Register this one" buttons. Here the
	   row goes and each button becomes a link to the course's registration. */
	$t = preg_replace( '#<tr data-js data-keep hidden>.*?</tr>#s', '', $t );
	$t = preg_replace_callback( '#<button type="button" class="aa-fl__regone" data-reg="([^"]+)">[^<]*</button>#', function ( $m ) use ( $courses ) {
		$id = $m[1];
		return isset( $courses[ $id ] ) ? '<a class="aa-mm-cmp__reg" href="' . esc_url( $courses[ $id ]['url'] . '#enroll' ) . '">' . esc_html__( 'Register', 'aa-mm' ) . ' ⟶</a>' : '';
	}, $t );
	$css = '<style>.aa-mm-cmp{color:#0B2E35}.aa-mm-cmp .aa-fl__scroll{overflow-x:auto;border:1px solid #DCEAE8;border-radius:16px;background:#fff}.aa-mm-cmp table{border-collapse:collapse;width:100%;min-width:760px;font-size:14px;line-height:1.5;margin:0}.aa-mm-cmp th,.aa-mm-cmp td{padding:12px 14px;text-align:start;vertical-align:top;border:0;border-bottom:1px solid #EEF3F2;background:#fff}.aa-mm-cmp thead th{font-size:15px;font-weight:600}.aa-mm-cmp thead th a{color:#0B2E35;text-decoration:none}.aa-mm-cmp tbody th{position:sticky;inset-inline-start:0;background:#F6FAF9;font:600 11px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:#5C7479;min-width:110px}.aa-mm-cmp .aa-mm-cmp__reg{display:inline-block;margin-top:6px;font-size:12.5px;font-weight:700;color:#0E8074;text-decoration:none}.aa-mm-cmp time{white-space:nowrap}</style>';
	return $css . '<div class="aa-mm-cmp">' . $t . '</div>';
} );
