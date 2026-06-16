<?php
/**
 * Agile Agilist — Populate Fluent Forms Cohort dropdown from the Events Calendar
 * -----------------------------------------------------------------------------
 * Scope: ONLY form #3, ONLY the field named "dropdown" (the "Cohort Date" field).
 * Effect: its options become your upcoming "sa" events — label = event title + date,
 *         value = event Post ID  (so it matches the page links ?cohort=<id> and your
 *         existing {get.cohort} default value, which pre-selects the clicked cohort).
 *
 * INSTALL: WPCode → Add Snippet → PHP Snippet → paste → Auto Insert: Run Everywhere → Activate.
 * It auto-detects the event post type / category taxonomy / start-date meta key.
 * To pin them instead of auto-detecting, edit the three values in $CFG below.
 */

add_filter( 'fluentform/rendering_field_data', function ( $data, $form ) {

	// --- guard: only our form + only the cohort dropdown field ---
	if ( empty( $form->id ) || (int) $form->id !== 3 ) { return $data; }
	$name = isset( $data['attributes']['name'] ) ? $data['attributes']['name'] : '';
	if ( $name !== 'dropdown' ) { return $data; }            // <-- the Cohort Date field's name
	if ( empty( $data['element'] ) || $data['element'] !== 'select' ) { return $data; }

	$CFG = array(
		'category'  => 'sa',
		'post_type' => '',   // e.g. 'wp_events' — leave '' to auto-detect
		'taxonomy'  => '',   // e.g. 'event_categories' — leave '' to auto-detect
		'date_meta' => '',   // e.g. 'start_ts' — leave '' to auto-detect
		'limit'     => 12,
	);

	$opts = aaff_cohort_options( $CFG );
	if ( empty( $opts ) ) { return $data; }                  // nothing found → leave field untouched

	// Build Fluent Forms option structures (set both shapes for version safety)
	$advanced = array();
	$flat     = array();
	foreach ( $opts as $o ) {
		$advanced[] = array( 'label' => $o['label'], 'value' => (string) $o['value'], 'calc_value' => '' );
		$flat[ (string) $o['value'] ] = $o['label'];
	}
	if ( ! isset( $data['settings'] ) || ! is_array( $data['settings'] ) ) { $data['settings'] = array(); }
	$data['settings']['advanced_options'] = $advanced;
	$data['options'] = $flat;

	return $data;
}, 20, 2 );

/* Query upcoming "sa" events → [ ['value'=>ID,'label'=>'Title — Mon D, YYYY'], ... ] */
if ( ! function_exists( 'aaff_cohort_options' ) ) {
function aaff_cohort_options( $CFG ) {

	/* taxonomy */
	$taxonomy = $CFG['taxonomy']; $term = false;
	$cands = array_filter( array( $CFG['taxonomy'], 'event_categories', 'wp_events_categories',
		'eec_event_categories', 'events_categories', 'event-categories', 'eec_events_categories' ) );
	foreach ( $cands as $tx ) {
		if ( $tx && taxonomy_exists( $tx ) ) {
			$m = get_term_by( 'slug', $CFG['category'], $tx );
			if ( $m && ! is_wp_error( $m ) ) { $term = $m; $taxonomy = $tx; break; }
		}
	}

	/* post type(s) */
	$pts = array();
	if ( $CFG['post_type'] ) { $pts = array( $CFG['post_type'] ); }
	elseif ( $taxonomy && taxonomy_exists( $taxonomy ) ) {
		$to = get_taxonomy( $taxonomy ); $pts = is_array( $to->object_type ) ? $to->object_type : array();
	}
	if ( empty( $pts ) ) { foreach ( array( 'wp_events','eec_events','events','event' ) as $p ) { if ( post_type_exists( $p ) ) { $pts[] = $p; } } }

	/* query */
	$args = array( 'post_type' => $pts ?: 'any', 'post_status' => 'publish', 'posts_per_page' => 60, 'no_found_rows' => true );
	if ( $term ) { $args['tax_query'] = array( array( 'taxonomy' => $taxonomy, 'field' => 'term_id', 'terms' => $term->term_id ) ); }
	$events = get_posts( $args );
	if ( empty( $events ) ) { return array(); }

	/* detect date meta */
	$dm = $CFG['date_meta'];
	if ( ! $dm ) {
		$meta = get_post_meta( $events[0]->ID );
		$pref = array( 'start_ts','event_start_ts','event_start_date','start_date','_start_ts','eec_event_start_date','evcal_srow','start_date_time' );
		foreach ( $pref as $k ) { if ( isset( $meta[ $k ] ) && aaff_dateish( $meta[ $k ][0] ) ) { $dm = $k; break; } }
		if ( ! $dm ) { foreach ( $meta as $k => $v ) { if ( stripos( $k, 'start' ) !== false && aaff_dateish( $v[0] ) ) { $dm = $k; break; } } }
	}

	/* build + sort upcoming */
	$rows = array();
	foreach ( $events as $ev ) {
		$ts = $dm ? aaff_ts( get_post_meta( $ev->ID, $dm, true ) ) : 0;
		if ( ! $ts || $ts < strtotime( 'today' ) ) { continue; }
		$title = html_entity_decode( get_the_title( $ev ), ENT_QUOTES );
		$date  = wp_date( 'M j, Y', $ts );
		$label = ( stripos( $title, (string) wp_date( 'Y', $ts ) ) !== false ) ? $title : ( $title . ' — ' . $date );
		$rows[] = array( 'ts' => $ts, 'value' => $ev->ID, 'label' => $label );
	}
	usort( $rows, function ( $a, $b ) { return $a['ts'] - $b['ts']; } );
	return array_slice( $rows, 0, (int) $CFG['limit'] );
}}

if ( ! function_exists( 'aaff_dateish' ) ) {
function aaff_dateish( $v ) { if ( is_numeric( $v ) && (int) $v > 100000000 ) { return true; } return $v && strtotime( $v ) !== false; }}
if ( ! function_exists( 'aaff_ts' ) ) {
function aaff_ts( $v ) { if ( is_numeric( $v ) && (int) $v > 100000000 ) { return (int) $v; } $t = $v ? strtotime( $v ) : false; return $t ?: 0; }}
