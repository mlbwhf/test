<?php
/**
 * AA — Checkout guard and checkout log
 *
 * WHY THIS IS IN THE PLUGIN. The same guard exists as WPCode snippet 37856,
 * but it was saved straight into the database and WPCode only runs code its
 * own editor has saved: its rescue counter (aa_checkout_nonce_rescued) has
 * never moved. On 9 Nov 2026 two LPM buyers pressed Pay within an hour and
 * neither reached Stripe, with nothing logged anywhere.
 *
 * 1. GUARD. Course pages are served from the page cache with a WordPress REST
 *    nonce printed into them. A nonce dies after 12–24 hours, and WordPress
 *    then answers the Pay request with 403 "Cookie check failed" before the
 *    checkout code runs. /aa/v1/checkout and /aa/v1/batches are public and
 *    never act as a logged-in user, so for those two routes only a dead nonce
 *    is cleared and the request runs as the logged-out visitor it was.
 *    Each rescue is counted in aa_checkout_nonce_rescued.
 *
 * 2. LOG. Every response from /aa/v1/checkout is recorded in the option
 *    aa_sf_checkout_log (last 100): time, HTTP status, error code and
 *    message, email, batch, seats. A refusal emails info@ once per buyer per
 *    hour, unless the older telemetry snippet is running and already does.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_cg_is_ours' ) ) :

function aa_sf_cg_route() {
	$route = '';
	if ( isset( $GLOBALS['wp'] ) && is_object( $GLOBALS['wp'] ) && ! empty( $GLOBALS['wp']->query_vars['rest_route'] ) ) {
		$route = (string) $GLOBALS['wp']->query_vars['rest_route'];
	} elseif ( isset( $_GET['rest_route'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		$route = (string) wp_unslash( $_GET['rest_route'] ); // phpcs:ignore
	} elseif ( isset( $_SERVER['REQUEST_URI'] ) ) {
		$route = (string) wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ), PHP_URL_PATH ); // phpcs:ignore
	}
	return $route;
}

function aa_sf_cg_is_ours() {
	return (bool) preg_match( '#/aa/v1/(checkout|batches)/?$#', aa_sf_cg_route() );
}

/* After core's cookie check (priority 100). */
add_filter( 'rest_authentication_errors', function ( $result ) {
	if ( ! is_wp_error( $result ) || $result->get_error_code() !== 'rest_cookie_invalid_nonce' || ! aa_sf_cg_is_ours() ) {
		return $result;
	}
	wp_set_current_user( 0 );
	$n = get_option( 'aa_checkout_nonce_rescued', array() );
	$n = is_array( $n ) ? $n : array();
	$n['count'] = (int) ( isset( $n['count'] ) ? $n['count'] : 0 ) + 1;
	$n['last']  = gmdate( 'c' );
	$n['by']    = 'aa-site-fixes';
	update_option( 'aa_checkout_nonce_rescued', $n, false );
	return true;
}, 102 );

/* Log every checkout response. */
add_filter( 'rest_post_dispatch', function ( $response, $server, $request ) {
	if ( ! ( $request instanceof WP_REST_Request ) || ! preg_match( '#^/aa/v1/checkout/?$#', (string) $request->get_route() ) ) {
		return $response;
	}
	$p      = (array) $request->get_json_params();
	$status = is_object( $response ) && method_exists( $response, 'get_status' ) ? (int) $response->get_status() : 0;
	$data   = is_object( $response ) && method_exists( $response, 'get_data' ) ? $response->get_data() : array();
	$data   = is_array( $data ) ? $data : array();
	$ok     = $status >= 200 && $status < 300 && ! empty( $data['url'] );
	$e = array(
		't'      => current_time( 'mysql' ),
		'ok'     => $ok ? 1 : 0,
		'status' => $status,
		'code'   => $ok ? '' : (string) ( isset( $data['code'] ) ? $data['code'] : '' ),
		'msg'    => $ok ? '' : mb_substr( wp_strip_all_tags( (string) ( isset( $data['message'] ) ? $data['message'] : '' ) ), 0, 200 ),
		'email'  => sanitize_email( (string) ( isset( $p['email'] ) ? $p['email'] : '' ) ),
		'cohort' => sanitize_text_field( (string) ( isset( $p['cohort'] ) ? $p['cohort'] : ( ( isset( $p['course'] ) ? $p['course'] : '' ) . ' ' . ( isset( $p['start'] ) ? $p['start'] : '' ) ) ) ),
		'seats'  => (int) ( isset( $p['seats'] ) ? $p['seats'] : 0 ),
		'ref'    => esc_url_raw( (string) ( isset( $_SERVER['HTTP_REFERER'] ) ? wp_unslash( $_SERVER['HTTP_REFERER'] ) : '' ) ), // phpcs:ignore
	);
	$log = get_option( 'aa_sf_checkout_log', array() );
	$log = is_array( $log ) ? $log : array();
	array_unshift( $log, $e );
	update_option( 'aa_sf_checkout_log', array_slice( $log, 0, 100 ), false );

	if ( ! $ok && ! function_exists( 'aa_ct_alert' ) ) {
		$key = 'aa_sf_cg_mail_' . md5( ( $e['email'] ?: 'anon' ) . '|' . $e['cohort'] );
		if ( ! get_transient( $key ) ) {
			set_transient( $key, 1, HOUR_IN_SECONDS );
			wp_mail( 'info@agile-agilist.com',
				'CHECKOUT FAILED — ' . ( $e['email'] ?: 'visitor' ) . ( $e['cohort'] ? ' — ' . trim( $e['cohort'] ) : '' ),
				"A buyer pressed Pay and did not reach Stripe.\n\n"
				. 'Email: ' . ( $e['email'] ?: 'not given' ) . "\n"
				. 'Class: ' . ( trim( $e['cohort'] ) ?: 'unknown' ) . ' · seats ' . $e['seats'] . "\n"
				. 'Answer: HTTP ' . $status . ' ' . $e['code'] . ' — ' . $e['msg'] . "\n"
				. 'Page: ' . ( $e['ref'] ?: 'unknown' ) . "\n" );
		}
	}
	return $response;
}, 20, 3 );

endif;
