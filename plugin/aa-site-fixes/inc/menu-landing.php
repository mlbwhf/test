<?php
/**
 * AA — Training menu: each category links to its landing page again
 *
 * The old Training panel listed the categories as links (AI-Native →
 * /training/ai-native/, Advanced SAFe → /training/adv-safe/ …). In the new
 * mega menu the categories are tabs that only switch the panel, so on desktop
 * there was no way to reach a category's landing page from the header.
 *
 * Each category panel now carries its landing page twice: the big category
 * title is a link, and a "See all Advanced SAFe classes ⟶" link sits under
 * the description. Same URLs the WordPress menu (Main Nav) uses, so the
 * mobile accordion and the desktop panel agree.
 *
 * Done on the finished HTML of the panel (the header dropdown and the
 * [aa_training_menu] page), so the WPCode menu snippet is not touched.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_mm_landing_urls' ) ) :

function aa_sf_mm_landing_urls() {
	return apply_filters( 'aa_sf_mm_landing_urls', array(
		'ai'    => '/training/ai-native/',
		'core'  => '/training/select/',
		'roles' => '/training/safe/',
		'adv'   => '/training/adv-safe/',
		'micro' => '/training/safe-found/',
		'ind'   => '/training/safe-industry/',
	) );
}

function aa_sf_mm_landing( $html ) {
	if ( ! is_string( $html ) || strpos( $html, 'aa-mm__band' ) === false || strpos( $html, 'aa-mm__all' ) !== false ) { return $html; }
	$urls = aa_sf_mm_landing_urls();
	$out  = preg_replace_callback(
		'~(<section class="aa-mm__panel" role="tabpanel"[^>]*?data-cat="([a-z0-9_-]+)"[^>]*>\s*<header class="aa-mm__band"[^>]*>.*?<h2>)(.*?)(</h2><p>)(.*?)(</p></header>)~s',
		function ( $m ) use ( $urls ) {
			if ( empty( $urls[ $m[2] ] ) ) { return $m[0]; }
			$u    = esc_url( home_url( $urls[ $m[2] ] ) );
			$name = trim( wp_strip_all_tags( $m[3] ) );
			return $m[1] . '<a class="aa-mm__hlink" href="' . $u . '">' . $m[3] . '</a>' . $m[4] . $m[5]
			     . '<a class="aa-mm__all" href="' . $u . '">' . esc_html( sprintf( 'See all %s classes', $name ) ) . ' <span aria-hidden="true">&#10230;</span></a>' . $m[6];
		},
		$html
	);
	return is_string( $out ) ? $out : $html;
}

/* Header dropdown: printed by the menu snippet at wp_footer priority 20. */
add_action( 'wp_footer', function () { if ( ! is_admin() ) { ob_start(); } }, 19 );
add_action( 'wp_footer', function () {
	if ( is_admin() ) { return; }
	echo aa_sf_mm_landing( (string) ob_get_clean() ); // phpcs:ignore -- markup built and escaped by the menu snippet
}, 21 );

/* Page mode: [aa_training_menu] on /training/. */
add_filter( 'do_shortcode_tag', function ( $out, $tag ) {
	return $tag === 'aa_training_menu' ? aa_sf_mm_landing( $out ) : $out;
}, 20, 2 );

add_action( 'wp_head', function () {
	if ( is_admin() ) { return; }
	echo '<style id="aa-sf-mm-landing">.aa-mm__band a.aa-mm__hlink{color:inherit;text-decoration:none}.aa-mm__band a.aa-mm__hlink:hover{text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px}'
	   . '.aa-mm__band a.aa-mm__all{display:inline-flex;align-items:center;gap:6px;width:max-content;max-width:100%;min-height:44px;margin-top:2px;color:#fff;font-weight:700;font-size:14px;text-decoration:underline;text-underline-offset:3px}.aa-mm__band a.aa-mm__all:hover{color:#8FCFCF}'
	   . '.aa-mm__band p:last-of-type{margin:0;font-size:14.5px;line-height:1.5;color:#B9DCDC;max-width:56ch}</style>' . "\n";
}, 42 );

endif;
