<?php
/**
 * Agile Agilist — PERMANENT REDIRECTS  [no shortcode]
 * ---------------------------------------------------------------------------
 * Pages that have moved, and where they went. Every entry is a 301, so search
 * engines carry the old page's ranking to the new address and browsers that
 * followed an old link once go straight there next time.
 *
 * ONLY WHEN THE OLD ADDRESS IS GONE. A redirect fires only on a 404, so this
 * snippet can be activated before a page is moved without bouncing visitors
 * off a page that still exists, and it can never fight a live page that later
 * takes an old address back. Before the move it does nothing; after it, it
 * catches every old link.
 *
 * THE QUERY STRING TRAVELS WITH THE VISITOR. Course links carry ?cohort=... and
 * ad links carry utm_* and msclkid; dropping them would lose the chosen class
 * and the ad attribution.
 *
 * Runs at template_redirect priority 1, ahead of WordPress's own guess at what
 * a 404 meant -- which matches on slug alone and could send /arch/ to the
 * French /fr/arch/ -- and ahead of the 404 page snippet.
 *
 * Keep these entries even after every internal link is updated. Google, old
 * emails, bookmarks and ads still point at the old addresses.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Off switch, so this can be disabled without deleting the snippet. */
function aa_rd_enabled() { return true; }

/** Old path => new path. Both with leading and trailing slashes. */
function aa_rd_map() {
	return array(
		/* 29 Oct 2026: SAFe Architect and ASE are role courses, so they moved
		   from SAFe by Industry to Core SAFe Roles. */
		'/training/safe-industry/arch/' => '/training/safe/arch/',
		'/training/safe-industry/ase/'  => '/training/safe/ase/',
	);
}

add_action( 'template_redirect', 'aa_rd_redirect', 1 );

function aa_rd_redirect() {
	if ( ! aa_rd_enabled() || ! is_404() ) { return; }

	$uri  = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
	$path = (string) wp_parse_url( $uri, PHP_URL_PATH );
	if ( $path === '' ) { return; }
	$key = '/' . trim( strtolower( $path ), '/' ) . '/';

	$map = aa_rd_map();
	if ( ! isset( $map[ $key ] ) ) { return; }

	$to    = home_url( $map[ $key ] );
	$query = (string) wp_parse_url( $uri, PHP_URL_QUERY );
	if ( $query !== '' ) { $to .= '?' . $query; }

	wp_safe_redirect( $to, 301, 'Agile Agilist' );
	exit;
}
