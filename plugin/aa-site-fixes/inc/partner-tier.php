<?php
/**
 * AA — Gold is now Platinum, everywhere a page says it
 *
 * Agile Agilist moved from Gold to Platinum SPCT partner (Nov 2026). The old
 * tier is still written into page titles ("… | Gold SPCT Trainer | …"), the
 * site footer ("a Scaled Agile Gold Partner"), hero lines ("taught by a Gold
 * SPCT"), the Course JSON-LD and the Spanish, French and Arabic mirrors.
 *
 * The WPCode snippet "AA — Claims" carries the same three rules but only on
 * the_content, so it never reached titles, the footer or schema, and WPCode
 * does not run snippets saved outside its editor anyway.
 *
 * This rewrites the finished HTML of every public page once, before the page
 * cache stores it. Anchored on the partner phrase, never on "Gold" alone:
 *   Gold Partner, Gold SPCT Partner, Gold partners      -> Platinum …
 *   Gold SPCT, Gold SPCTs, Gold SPCT Trainer             -> Platinum SPCT …
 *   SPCT Gold (French word order)                        -> SPCT Platinum
 * URLs and slugs are untouched: the rules need a space between the words.
 *
 * Exclusivity claims ("the only … in Canada") are deliberately NOT added here:
 * they depend on the market a page is for and belong in that page's copy.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_tier_fix' ) ) :

function aa_sf_tier_fix( $html ) {
	if ( ! is_string( $html ) || $html === '' || stripos( $html, 'gold' ) === false ) { return $html; }
	$sp  = '(?:\s|&nbsp;|&#160;|\x{00A0})+';
	$out = preg_replace(
		array(
			'/\bGold(?=' . $sp . '(?:SPCT' . $sp . ')?partners?\b)/iu',
			'/\bGold(?=' . $sp . 'SPCTs?\b)/u',
			'/\b(SPCTs?' . $sp . ')Gold\b/u',
		),
		array( 'Platinum', 'Platinum', '${1}Platinum' ),
		$html
	);
	return is_string( $out ) ? $out : $html;   /* bad UTF-8: leave the page as it was */
}

add_action( 'template_redirect', function () {
	if ( is_admin() || wp_doing_ajax() || is_feed() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) { return; }
	ob_start( 'aa_sf_tier_fix' );
}, 0 );

/* Titles and descriptions built outside the page body (AIOSEO, wp_title,
   feeds, the browser tab of a cached page) get the same rule. */
foreach ( array( 'pre_get_document_title', 'document_title', 'aioseo_title', 'aioseo_description', 'aioseo_og_title', 'aioseo_og_description', 'aioseo_twitter_title', 'aioseo_twitter_description' ) as $aa_sf_f ) {
	add_filter( $aa_sf_f, function ( $v ) { return is_string( $v ) ? aa_sf_tier_fix( $v ) : $v; }, 99 );
}
unset( $aa_sf_f );

endif;
