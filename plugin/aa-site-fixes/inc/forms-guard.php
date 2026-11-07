<?php
/**
 * AA — Contact form guard   (Fluent Forms)
 *
 * 1. SPAM GATE. Every entry on "Training Contact us" (form 5) since early
 *    October was a bot: all five interest boxes ticked, a link or an advert in
 *    the message, often first name == last name. A submission that looks like
 *    that is refused with a validation message before it is stored, mailed or
 *    sent to HubSpot. A real request (one or two interests, no link) passes.
 *
 * 2. HUBSPOT PAYLOAD. HubSpot rejected the form's feed with "Cannot
 *    deserialize value ... from Array value": a list where it expects a
 *    single value. Before the feed sends, list values are joined with ";"
 *    (HubSpot's multi-value separator) and a legacy [{property,value}] list
 *    is turned into a {property: value} map. The payload before and after is
 *    kept in the option aa_ff_hs_last for inspection.
 *
 * 3. HUBSPOT RELAY. Independently of the feed, each accepted entry on form 5
 *    is posted to the HubSpot lead form (the same Forms API call the checkout
 *    telemetry uses), so a contact and a form-submission notification exist
 *    even when the feed fails. The Forms API only accepts fields that exist
 *    on that HubSpot form, so the email goes in the field and the name and
 *    interests go in the page name; the message itself stays in the Fluent
 *    Forms entry and its notification email.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_ff_guard_forms' ) ) :

/** Form IDs the gate and the relay apply to. */
function aa_ff_guard_forms() { return apply_filters( 'aa_ff_guard_forms', array( 5 ) ); }

function aa_ff_field( $data, $key ) {
	$v = isset( $data[ $key ] ) ? $data[ $key ] : '';
	return is_string( $v ) ? trim( $v ) : $v;
}

/** True when a submission has the signature of the bots that hit form 5. */
function aa_ff_looks_automated( $data ) {
	$names = isset( $data['names'] ) && is_array( $data['names'] ) ? $data['names'] : array();
	$first = isset( $names['first_name'] ) ? trim( (string) $names['first_name'] ) : '';
	$last  = isset( $names['last_name'] ) ? trim( (string) $names['last_name'] ) : '';
	$email = strtolower( (string) aa_ff_field( $data, 'email' ) );
	$msg   = (string) aa_ff_field( $data, 'description' );
	$boxes = isset( $data['checkbox'] ) && is_array( $data['checkbox'] ) ? count( $data['checkbox'] ) : 0;

	$has_link = (bool) preg_match( '~https?://|www\.|\[url=~i', $msg )
	         || (bool) preg_match( '~(^|[\s(])[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|org|net|xyz|ru|io|shop|site|online|click|link|top)(/|[\s).,]|$)~i', $msg )  // bare domain
	         || (bool) preg_match( '~[$€£]\s?\d|\d\s?% ?off~i', $msg );                                                                                // a price pitch
	$same     = $first !== '' && strcasecmp( $first, $last ) === 0;
	$all      = $boxes >= 5;
	$cyrillic = (bool) preg_match( '/\p{Cyrillic}/u', $msg . $first );
	$spoofed  = (bool) preg_match( '/@agile-agilist\.com$/', $email );   // nobody here uses the public form
	$junk     = $first !== '' && ! preg_match( '/[aeiouy]/i', $first ) && strlen( $first ) > 6;  // consonant-only names

	if ( $spoofed ) { return 'spoofed sender'; }
	if ( $all && ( $has_link || $same || $cyrillic || $junk ) ) { return 'all interests + link/duplicate name'; }
	if ( $has_link && ( $same || $cyrillic || $junk ) ) { return 'link + duplicate name'; }
	return '';
}

/* 1. Refuse before the entry exists. */
add_filter( 'fluentform/validation_errors', function ( $errors, $data, $form ) {
	if ( ! is_object( $form ) || ! in_array( (int) $form->id, aa_ff_guard_forms(), true ) ) { return $errors; }
	if ( ! is_array( $data ) ) { return $errors; }
	$why = aa_ff_looks_automated( $data );
	if ( $why === '' ) { return $errors; }
	$errors = is_array( $errors ) ? $errors : array();
	$errors['description'] = array( 'aa_spam' => 'This message looks automated. Please email info@agile-agilist.com and we will reply the same day.' );
	$log = (array) get_option( 'aa_ff_blocked', array() );
	array_unshift( $log, array( 't' => current_time( 'mysql' ), 'form' => (int) $form->id, 'why' => $why, 'email' => (string) aa_ff_field( $data, 'email' ) ) );
	update_option( 'aa_ff_blocked', array_slice( $log, 0, 100 ), false );
	return $errors;
}, 20, 3 );

/* 2. Make the HubSpot feed's payload acceptable to HubSpot's v3 API. */
function aa_ff_hs_normalize( $v ) {
	if ( ! is_array( $v ) ) { return $v; }
	$keys = array_keys( $v );
	$list = $keys === range( 0, count( $v ) - 1 );
	if ( $list ) {
		$pairs = true;
		foreach ( $v as $row ) { if ( ! is_array( $row ) || ! array_key_exists( 'property', $row ) || ! array_key_exists( 'value', $row ) ) { $pairs = false; break; } }
		if ( $pairs && $v ) {                                   // legacy [{property,value}] -> {property: value}
			$out = array();
			foreach ( $v as $row ) { $out[ (string) $row['property'] ] = aa_ff_hs_normalize( $row['value'] ); }
			return $out;
		}
		$scalars = true;
		foreach ( $v as $x ) { if ( is_array( $x ) || is_object( $x ) ) { $scalars = false; break; } }
		if ( $scalars ) { return implode( ';', array_map( 'strval', $v ) ); }   // multi-value -> "a;b;c"
	}
	foreach ( $v as $k => $x ) { $v[ $k ] = aa_ff_hs_normalize( $x ); }
	if ( ! $list && isset( $v['properties'] ) && is_array( $v['properties'] ) && ! $v['properties'] ) { $v['properties'] = new stdClass(); }  // {} not []
	return $v;
}
function aa_ff_hs_filter( $data, $feed = null, $entry = null ) {
	$before = $data;
	$data   = aa_ff_hs_normalize( $data );
	update_option( 'aa_ff_hs_last', array( 't' => current_time( 'mysql' ), 'before' => $before, 'after' => $data ), false );
	return $data;
}
add_filter( 'fluentform/integration_data_hubspot', 'aa_ff_hs_filter', 20, 3 );
add_filter( 'fluentform_integration_data_hubspot', 'aa_ff_hs_filter', 20, 3 );

/* 3. Relay accepted entries to the HubSpot lead form. */
add_action( 'fluentform/submission_inserted', function ( $entry_id, $data, $form ) {
	if ( ! is_object( $form ) || ! in_array( (int) $form->id, aa_ff_guard_forms(), true ) || ! is_array( $data ) ) { return; }
	$email = sanitize_email( (string) aa_ff_field( $data, 'email' ) );
	if ( ! is_email( $email ) ) { return; }
	$portal = '46316757'; $hsform = 'c6f0d4c1-d233-4875-9b0c-4528cda02237';
	if ( function_exists( 'aa_ct_settings' ) ) { $s = aa_ct_settings(); if ( ! empty( $s['hs_portal'] ) ) { $portal = $s['hs_portal']; } if ( ! empty( $s['hs_form'] ) ) { $hsform = $s['hs_form']; } }
	$key = 'aa_ff_hs_' . md5( $email . '|' . (int) $form->id );
	if ( get_transient( $key ) ) { return; }
	set_transient( $key, 1, 10 * MINUTE_IN_SECONDS );
	$names = isset( $data['names'] ) && is_array( $data['names'] ) ? $data['names'] : array();
	$who   = trim( ( isset( $names['first_name'] ) ? $names['first_name'] : '' ) . ' ' . ( isset( $names['last_name'] ) ? $names['last_name'] : '' ) );
	$int   = isset( $data['checkbox'] ) && is_array( $data['checkbox'] ) ? implode( ', ', array_map( 'sanitize_text_field', $data['checkbox'] ) ) : '';
	$name  = 'Contact form: ' . $form->title . ( $who ? ' — ' . $who : '' ) . ( $int ? ' — ' . $int : '' ) . ' — entry #' . (int) $entry_id;
	$uri   = ! empty( $_SERVER['HTTP_REFERER'] ) ? esc_url_raw( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) : home_url( '/' );
	wp_remote_post( 'https://api.hsforms.com/submissions/v3/integration/submit/' . rawurlencode( $portal ) . '/' . rawurlencode( $hsform ), array(
		'timeout' => 8, 'blocking' => false,
		'headers' => array( 'Content-Type' => 'application/json' ),
		'body'    => wp_json_encode( array(
			'fields'  => array( array( 'name' => 'email', 'value' => $email ) ),
			'context' => array( 'pageUri' => $uri, 'pageName' => mb_substr( $name, 0, 250 ) ),
		) ),
	) );
}, 20, 3 );

endif;
