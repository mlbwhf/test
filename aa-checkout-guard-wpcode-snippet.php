<?php
/**
 * Agile Agilist — CHECKOUT GUARD  [no shortcode; REST only]
 * ---------------------------------------------------------------------------
 * WHAT HAPPENED
 *
 * Naomi Pozzi tried to pay for LPM at 7:31 on the morning of the class, on her
 * iPhone, and "the screen does not advance when I click on pay securely with
 * Stripe". Four days earlier another buyer's SPC checkout opened Stripe
 * without trouble. Nothing in the checkout code changed in between.
 *
 * WHY
 *
 * Every course page prints a WordPress REST nonce into its config
 * (wp_create_nonce('wp_rest')), and the Pay button sends it back as
 * X-WP-Nonce. A nonce lives 12-24 hours. The site runs SiteGround's Speed
 * Optimizer, which serves course pages from a full-page cache -- so once a
 * cached copy is older than a day, every visitor gets a page carrying a dead
 * nonce.
 *
 * WordPress checks that header for logged-out visitors too. A dead one makes
 * core answer 403 "Cookie check failed" before our checkout code runs at all.
 * The button shows "Taking you to Stripe...", turns back, and a small line of
 * text appears under it -- which on a phone reads as "nothing happened".
 *
 * Whether a buyer can pay therefore depends on how old the cached copy of the
 * page is. That is why it worked on the 24th and not on the 28th.
 *
 * THE FIX
 *
 * The nonce buys nothing on these routes. /aa/v1/checkout and /aa/v1/batches
 * are public by design -- buyers are not logged in -- and neither reads who
 * the user is: checkout prices from the server's own table and sends the
 * buyer to Stripe, batches lists dates. A nonce is a CSRF guard for acting AS a
 * logged-in user, and these routes never do.
 *
 * So for those two routes only, a failed nonce check is cleared and the
 * request runs as a logged-out visitor, which is what it was anyway. Every
 * other REST route keeps core's behaviour exactly.
 *
 * Separate from the register snippet on purpose: this goes live the moment it
 * is activated, without waiting on that snippet's save.
 *
 * Each rescue is counted in the option aa_checkout_nonce_rescued, so it can be
 * confirmed afterwards that this was the cause -- a count above zero means a
 * buyer would have been turned away.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Off switch, so this can be disabled without deleting the snippet. */
function aa_cg_enabled() { return true; }

/** Is this request for one of our public routes? */
function aa_cg_is_ours() {
	$route = '';
	if ( isset( $GLOBALS['wp'] ) && is_object( $GLOBALS['wp'] ) && ! empty( $GLOBALS['wp']->query_vars['rest_route'] ) ) {
		$route = (string) $GLOBALS['wp']->query_vars['rest_route'];
	} elseif ( isset( $_SERVER['REQUEST_URI'] ) ) {
		$route = (string) wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ), PHP_URL_PATH );
	}
	return (bool) preg_match( '#/aa/v1/(checkout|batches)/?$#', $route );
}

/* After core's own cookie check, which runs at priority 100. */
add_filter( 'rest_authentication_errors', 'aa_cg_rescue', 101 );

function aa_cg_rescue( $result ) {
	if ( ! aa_cg_enabled() ) { return $result; }
	if ( ! is_wp_error( $result ) || $result->get_error_code() !== 'rest_cookie_invalid_nonce' ) {
		return $result;
	}
	if ( ! aa_cg_is_ours() ) { return $result; }

	/* Run it as the logged-out visitor it would have been with no header. */
	wp_set_current_user( 0 );

	$n = get_option( 'aa_checkout_nonce_rescued', array() );
	$n = is_array( $n ) ? $n : array();
	$n['count'] = (int) ( isset( $n['count'] ) ? $n['count'] : 0 ) + 1;
	$n['last']  = gmdate( 'c' );
	update_option( 'aa_checkout_nonce_rescued', $n, false );

	return true;
}
