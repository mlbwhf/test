<?php
/**
 * AA — Training menu: Innovation Framework category
 *
 * Adds the Innovation Framework certifications (layer 02 of the operating
 * model) to the Training mega menu, as their own category after AI-Native:
 * Innovation Creator, Innovation Facilitator, Innovation Leader. The category
 * title and "See all" link go to /training/innovation-framework/.
 *
 * These classes are not in the register (no price or cohort yet), so the
 * cards are built here and show "Dates on request" until they are. Added
 * through the menu's aa_mm_data filter, after its hourly cache, so it shows
 * as soon as the plugin is active. English pages only: the course pages are
 * English for now.
 *
 * The mobile menu is the WordPress Main Nav, edited separately.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_mm_innov_courses' ) ) :

function aa_sf_mm_innov_courses() {
	$b = '/training/innovation-framework/';
	return apply_filters( 'aa_sf_mm_innov_courses', array(
		'innovation-creator'     => array( 'Innovation Creator',     '2 days', $b . 'innovation-creator/' ),
		'innovation-facilitator' => array( 'Innovation Facilitator', '3 days', $b . 'innovation-facilitator/' ),
		'innovation-leader'      => array( 'Innovation Leader',      '1 day',  $b . 'innovation-leader/' ),
	) );
}

add_filter( 'aa_mm_data', function ( $d ) {
	if ( ! is_array( $d ) || empty( $d['categories'] ) ) { return $d; }
	if ( function_exists( 'aa_mm_lang' ) && aa_mm_lang() !== 'en' ) { return $d; }
	foreach ( $d['categories'] as $c ) { if ( isset( $c['id'] ) && $c['id'] === 'innov' ) { return $d; } }

	$ids = array();
	foreach ( aa_sf_mm_innov_courses() as $slug => $c ) {
		$d['courses'][ $slug ] = array(
			'id' => $slug, 'name' => $c[0], 'code' => '', 'duration' => $c[1],
			'next' => '', 'iso' => '', 'url' => home_url( $c[2] ), 'flow' => false,
		);
		$ids[] = $slug;
	}
	$cat = array(
		'id' => 'innov', 'name' => 'Innovation Framework', 'eyebrow' => 'New · Layer 02', 'blurb' => 'Creator, Facilitator, Leader',
		'desc' => 'Certifications for the people who run innovation on cadence, built on the Two Chasms Framework.',
		'color' => '#E9C46A', 'isNew' => true, 'courses' => $ids,
	);
	/* After AI-Native, so the two newest tracks sit together. */
	$out = array(); $done = false;
	foreach ( $d['categories'] as $c ) {
		$out[] = $c;
		if ( ! $done && isset( $c['id'] ) && $c['id'] === 'ai' ) { $out[] = $cat; $done = true; }
	}
	if ( ! $done ) { $out[] = $cat; }
	$d['categories'] = $out;
	return $d;
}, 25 ); // after menu-new.php (20), which strips isNew from every category

add_filter( 'aa_sf_mm_landing_urls', function ( $u ) {
	$u['innov'] = '/training/innovation-framework/';
	return $u;
} );

endif;
