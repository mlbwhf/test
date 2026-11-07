<?php
/**
 * AA — Training menu: NEW on the new classes, not on the Core category.
 *
 * The menu snippet in WPCode (38123) has this change in its code, but WPCode
 * is still running its preload copy of the older code. Until that copy is
 * refreshed (Update in the WPCode editor), this file produces the same
 * result from the outside:
 *
 *  - the Core category loses its isNew flag through the menu's own filters;
 *  - a NEW pill is drawn on the three new class cards with CSS, only when the
 *    card does not already carry one (so nothing doubles once the new menu
 *    code is live).
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_menu_new_slugs' ) ) :

function aa_sf_menu_new_slugs() {
	return function_exists( 'aa_mm_new_slugs' ) ? (array) aa_mm_new_slugs() : array( 'large-solution', 'launching-ai-native-arts', 'ai-native-ready-certification' );
}

function aa_sf_menu_strip_core_new( $cats ) {
	if ( ! is_array( $cats ) ) { return $cats; }
	foreach ( $cats as $i => $c ) {
		if ( is_array( $c ) && isset( $c['isNew'] ) ) { unset( $cats[ $i ]['isNew'] ); }
	}
	return $cats;
}
add_filter( 'aa_mm_categories', 'aa_sf_menu_strip_core_new', 20 );
add_filter( 'aa_mm_data', function ( $d ) {
	if ( is_array( $d ) && ! empty( $d['categories'] ) ) { $d['categories'] = aa_sf_menu_strip_core_new( $d['categories'] ); }
	return $d;
}, 20 );

add_action( 'wp_head', function () {
	if ( is_admin() ) { return; }
	$sel = array();
	foreach ( aa_sf_menu_new_slugs() as $slug ) {
		$sel[] = '.aa-mm__card[data-id="' . esc_attr( $slug ) . '"] .aa-mm__h:not(:has(.aa-mm__new))::after';
	}
	echo '<style id="aa-sf-menu-new">' . implode( ',', $sel ) . '{content:"NEW";display:inline-block;margin-inline-start:6px;vertical-align:middle;font:600 9px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.1em;padding:2px 6px;border-radius:100px;background:#F2B66D;color:#0B2E35;animation:aamBlink 2.4s ease-in-out infinite}</style>' . "\n";
}, 41 );

endif;
