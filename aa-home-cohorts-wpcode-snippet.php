<?php
/**
 * Agile Agilist — HOME HERO cohort list  [aa_home_cohorts]
 * -----------------------------------------------------------------------------
 * The hero panel on the home page shows the next live cohort for a *priority*
 * set of courses, not the whole catalogue — high-value certifications first.
 *
 * Reuses the plumbing already pinned for [aa_cohorts]:
 *     post type  wp_events
 *     taxonomy   event_category   (term slug = course code, e.g. "aspc")
 *     date meta  start_ts         (Unix timestamp)
 *     optional   seats_left, end_ts
 * All classes run 09:00–17:00 Eastern, so dates are formatted in that zone and
 * stay correct across DST.
 *
 * USE (inside the home page's Custom HTML block, or its own shortcode block):
 *     [aa_home_cohorts]
 *     [aa_home_cohorts limit="8"]
 *     [aa_home_cohorts courses="aspc,spc,rte,lpm,apm"]
 *     [aa_home_cohorts debug="1"]           (admin only)
 *
 * Emits the <li> rows for ul#aa-cohorts AND the matching Course /
 * CourseInstance JSON-LD, so the structured data always describes the dates
 * actually printed on the page.
 *
 * NOTE: "ai-native" is in the default priority order but has no event_category
 * term on the site yet. Courses with no upcoming event are skipped silently,
 * so the panel simply fills from the next priority course until that term and
 * its events exist.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Priority order — highest-value certifications first. */
function aa_home_cohort_catalog() {
	return array(
		'aspc' => array( 'code' => 'ASPC', 'name' => 'Adv. Practice Consultant', 'days' => 4, 'url' => '/training/adv-safe/aspc/',      'schema' => 'Advanced SAFe® Practice Consultant (ASPC)' ),
		'spc'  => array( 'code' => 'SPC',  'name' => 'Implementing SAFe',        'days' => 4, 'url' => '/training/adv-safe/spc/',       'schema' => 'Implementing SAFe® (SPC)' ),
		'rte'  => array( 'code' => 'RTE',  'name' => 'Release Train Engineer',   'days' => 3, 'url' => '/training/adv-safe/rte/',       'schema' => 'SAFe® Release Train Engineer (RTE)' ),
		'lpm'  => array( 'code' => 'LPM',  'name' => 'Lean Portfolio Management','days' => 2, 'url' => '/training/adv-safe/lpm/',       'schema' => 'SAFe® Lean Portfolio Management (LPM)' ),
		// no event_category term yet — see note above
		'ai-native' => array( 'code' => 'AI', 'name' => 'AI-Native Foundations', 'days' => 2, 'url' => '/training/ai-native/ai-native-foundations/', 'schema' => 'AI-Native Foundations' ),
		'apm'  => array( 'code' => 'APM',  'name' => 'Agile Product Management', 'days' => 3, 'url' => '/training/adv-safe/apm/',        'schema' => 'SAFe® Agile Product Management (APM)' ),
		'popm' => array( 'code' => 'POPM', 'name' => 'SAFe POPM',                'days' => 2, 'url' => '/training/safe/popm/',           'schema' => 'SAFe® Product Owner / Product Manager (POPM)' ),
		'ssm'  => array( 'code' => 'SSM',  'name' => 'SAFe Scrum Master',        'days' => 2, 'url' => '/training/safe/scrum-master/',   'schema' => 'SAFe® Scrum Master (SSM)' ),
	);
}

/** Next upcoming event for one course slug, or null. */
function aa_home_next_cohort( $slug, $now ) {
	$term = get_term_by( 'slug', $slug, 'event_category' );
	if ( ! $term || is_wp_error( $term ) ) { return null; }

	$posts = get_posts( array(
		'post_type'      => 'wp_events',
		'post_status'    => 'publish',
		'posts_per_page' => 12,
		'no_found_rows'  => true,
		'meta_key'       => 'start_ts',
		'orderby'        => 'meta_value_num',
		'order'          => 'ASC',
		'meta_query'     => array( array( 'key' => 'start_ts', 'value' => $now, 'compare' => '>=', 'type' => 'NUMERIC' ) ),
		'tax_query'      => array( array( 'taxonomy' => 'event_category', 'field' => 'term_id', 'terms' => $term->term_id ) ),
	) );
	if ( empty( $posts ) ) { return null; }

	$p     = $posts[0];
	$start = (int) get_post_meta( $p->ID, 'start_ts', true );
	$end   = (int) get_post_meta( $p->ID, 'end_ts', true );
	$seats = get_post_meta( $p->ID, 'seats_left', true );

	return array(
		'id'    => $p->ID,
		'start' => $start,
		'end'   => $end ?: 0,
		'seats' => ( $seats === '' || $seats === null ) ? null : (int) $seats,
	);
}

/** "Sep 3–4" / "Sep 30–Oct 2", in Eastern time. */
function aa_home_date_range( $start, $end, $days ) {
	$tz = new DateTimeZone( 'America/New_York' );
	$s  = ( new DateTime( '@' . $start ) )->setTimezone( $tz );
	$e  = $end ? ( new DateTime( '@' . $end ) )->setTimezone( $tz )
	           : ( clone $s )->modify( '+' . max( 0, (int) $days - 1 ) . ' days' );
	if ( $s->format( 'Y-m-d' ) === $e->format( 'Y-m-d' ) ) { return $s->format( 'M j' ); }
	if ( $s->format( 'M' ) === $e->format( 'M' ) )        { return $s->format( 'M j' ) . '–' . $e->format( 'j' ); }
	return $s->format( 'M j' ) . '–' . $e->format( 'M j' );
}

add_shortcode( 'aa_home_cohorts', function ( $atts ) {

	$a = shortcode_atts( array(
		'courses' => 'aspc,spc,rte,lpm,ai-native,apm,popm,ssm',
		'limit'   => 6,
		'schema'  => '1',
		'debug'   => '',
	), $atts, 'aa_home_cohorts' );

	$catalog = aa_home_cohort_catalog();
	// Cut off at the start of today in Eastern time, not "right now", so a
	// cohort that begins today is still listed during the morning.
	$today   = new DateTime( 'now', new DateTimeZone( 'America/New_York' ) );
	$today->setTime( 0, 0, 0 );
	$now     = $today->getTimestamp();
	$limit   = max( 1, (int) $a['limit'] );

	$rows = array();
	$dbg  = array();
	foreach ( array_filter( array_map( 'trim', explode( ',', $a['courses'] ) ) ) as $slug ) {
		if ( count( $rows ) >= $limit )  { break; }
		if ( ! isset( $catalog[ $slug ] ) ) { $dbg[] = $slug . ': not in catalog'; continue; }
		$next = aa_home_next_cohort( $slug, $now );
		if ( ! $next ) { $dbg[] = $slug . ': no upcoming event'; continue; }
		$rows[] = array( 'slug' => $slug, 'c' => $catalog[ $slug ], 'e' => $next );
		$dbg[]  = $slug . ': ' . gmdate( 'Y-m-d', $next['start'] );
	}

	if ( empty( $rows ) ) {
		// Never print an empty panel — send people to the full schedule instead.
		return '<li><a class="coh" href="/training/"><span><span class="coh-n">See all upcoming cohorts</span>'
		     . '<span class="coh-d">Live-virtual · new dates monthly</span></span>'
		     . '<span class="coh-r"><span class="coh-in">View schedule ⟶</span></span></a></li>';
	}

	$html = '';
	$instances = array();
	$first = true;
	foreach ( $rows as $r ) {
		$c = $r['c']; $e = $r['e'];
		$range = aa_home_date_range( $e['start'], $e['end'], $c['days'] );
		$iso   = ( new DateTime( '@' . $e['start'] ) )->setTimezone( new DateTimeZone( 'America/New_York' ) )->format( 'Y-m-d' );

		$seats_html = '';
		if ( $e['seats'] !== null && $e['seats'] > 0 ) {
			$low = $e['seats'] <= 6 ? ' low' : '';
			$seats_html = '<span class="seats' . $low . '">' . (int) $e['seats'] . ' seats left</span>';
		}

		$html .= '<li><a class="coh"' . ( $first ? ' data-on="1"' : '' )
		      . ' data-code="' . esc_attr( $c['code'] ) . '"'
		      . ' data-start="' . esc_attr( $iso ) . '"'
		      . ' href="' . esc_url( $c['url'] ) . '?cohort=' . (int) $e['id'] . '">'
		      . '<span><span class="coh-n">' . esc_html( $c['name'] ) . '</span>'
		      . '<span class="coh-d">Live-virtual · ' . esc_html( $range ) . '</span></span>'
		      . '<span class="coh-r">' . $seats_html . '<span class="coh-in" data-in>&nbsp;</span></span></a></li>';
		$first = false;

		$instances[] = array(
			'@type'    => 'Course',
			'name'     => $c['schema'],
			'url'      => home_url( $c['url'] ),
			'provider' => array( '@id' => home_url( '/' ) . '#org' ),
			'hasCourseInstance' => array(
				'@type'      => 'CourseInstance',
				'courseMode' => 'online',
				'startDate'  => $iso,
			),
		);
	}

	if ( $a['schema'] === '1' && $instances ) {
		$html .= '<script type="application/ld+json">'
		      . wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => $instances ) )
		      . '</script>';
	}

	if ( $a['debug'] && current_user_can( 'manage_options' ) ) {
		$html .= '<pre style="background:#101C33;color:#3FBFAE;padding:12px;font-size:12px;white-space:pre-wrap">'
		      . esc_html( "aa_home_cohorts\n" . implode( "\n", $dbg ) ) . '</pre>';
	}

	return $html;
} );
