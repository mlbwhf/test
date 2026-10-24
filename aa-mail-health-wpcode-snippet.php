<?php
/**
 * Agile Agilist — MAIL HEALTH  [no shortcode; admin notice + hourly retry]
 * ---------------------------------------------------------------------------
 * WHAT HAPPENED
 *
 * Nathan Bowers paid $850 for POPM on 19 October and never got a confirmation.
 * The registration was recorded correctly -- cohort, seat, invoice token, all
 * there. The email failed, and so did the "CONFIRMATION EMAIL FAILED" alert to
 * the admin inbox, because both go out through the same wp_mail().
 *
 * wp_mail() has been failing for EVERY message since 28 September. WP Mail
 * SMTP's Google/Gmail mailer lost its OAuth token and every send since then
 * has come back 401 CREDENTIALS_MISSING -- 50 logged failures by 23 October.
 * That is every registration confirmation, every admin alert, every form
 * notification and every automated reply the site sent in that time.
 *
 * Nobody noticed for a month because the only alarm was an email.
 *
 * WHAT THIS DOES
 *
 *   1. It watches every wp_mail() on the site. A failure is recorded; a later
 *      success clears it. Not just registrations -- forms, the beta-reader
 *      access emails, everything that goes through wp_mail().
 *
 *   2. While mail is failing, or while any paid registration has no
 *      confirmation, every admin screen shows a red banner saying so. It does
 *      not use email to say email is broken.
 *
 *   3. Every hour it retries the confirmation for any NEW paid registration
 *      that has not got one yet. Once the mailer is reconnected, a confirmation
 *      that failed goes out within the hour, on its own.
 *
 * WHAT IT DELIBERATELY DOES NOT RETRY
 *
 * The automatic retry only touches registrations made after this snippet was
 * installed, for a class that has not started yet. The backlog is listed in
 * the banner with a Send button, and a person decides. Jada's record still
 * says rte-2026-10-21 although she was moved to the 27th, and she and Thomas
 * Green were both handled by hand -- an automatic resend would have sent the
 * wrong dates, or a second email to people already looked after.
 *
 * WHAT IT CANNOT FIX
 *
 * The mailer itself. That is a reconnection in WP Mail SMTP, done once by
 * someone signed in to the Google account. This snippet makes sure the next
 * time it breaks, it is on screen the same day and nothing is lost.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Off switch, so this can be disabled without deleting the snippet. */
function aa_mh_enabled() { return true; }

/* ---------------------------------------------------------------------------
   State. One option, small, never autoloaded on the front end.
   -------------------------------------------------------------------------- */
function aa_mh_get() {
	$h = get_option( 'aa_mail_health', array() );
	return is_array( $h ) ? $h : array();
}

function aa_mh_put( $h ) {
	update_option( 'aa_mail_health', $h, false );
}

/**
 * When this was installed. The automatic retry only ever reaches registrations
 * made after it, so turning it on cannot mail the backlog behind anyone's back.
 */
function aa_mh_installed_at() {
	$t = (int) get_option( 'aa_mail_health_installed', 0 );
	if ( ! $t ) {
		$t = time();
		add_option( 'aa_mail_health_installed', $t, '', false );
	}
	return $t;
}

/* ---------------------------------------------------------------------------
   1. Watch every wp_mail().
   -------------------------------------------------------------------------- */
add_action( 'wp_mail_failed', 'aa_mh_on_fail' );

function aa_mh_on_fail( $error ) {
	if ( ! aa_mh_enabled() ) { return; }
	$h = aa_mh_get();

	if ( empty( $h['down'] ) ) {
		$h['down']       = 1;
		$h['down_since'] = time();
		$h['fails']      = 0;
	}
	$h['fails']     = (int) ( isset( $h['fails'] ) ? $h['fails'] : 0 ) + 1;
	$h['last_fail'] = time();

	/* The transport's own message, cut short. Not the recipient: an address is
	   personal data and the banner does not need it to say what is wrong. */
	$msg = is_wp_error( $error ) ? $error->get_error_message() : '';
	$h['last_error'] = function_exists( 'mb_substr' ) ? mb_substr( (string) $msg, 0, 300 ) : substr( (string) $msg, 0, 300 );

	aa_mh_put( $h );
}

/* WordPress 5.9+. A single success is proof the transport works again. */
add_action( 'wp_mail_succeeded', 'aa_mh_on_ok' );

function aa_mh_on_ok() {
	if ( ! aa_mh_enabled() ) { return; }
	$h = aa_mh_get();
	if ( ! empty( $h['down'] ) ) {
		$h['down']         = 0;
		$h['recovered_at'] = time();
	}
	$h['last_ok'] = time();
	aa_mh_put( $h );
}

/* ---------------------------------------------------------------------------
   Paid registrations still waiting for a confirmation.
   -------------------------------------------------------------------------- */
function aa_mh_unsent() {
	if ( ! post_type_exists( 'aa_registration' ) ) { return array(); }
	return get_posts( array(
		'post_type'        => 'aa_registration',
		'post_status'      => 'any',
		'numberposts'      => 50,
		'suppress_filters' => true,
		'meta_query'       => array(
			'relation' => 'OR',
			array( 'key' => 'confirmation_sent', 'value' => '1', 'compare' => '!=' ),
			array( 'key' => 'confirmation_sent', 'compare' => 'NOT EXISTS' ),
		),
	) );
}

/** The cohort's start date, or '' if it no longer resolves. */
function aa_mh_cohort_start( $id ) {
	$cohort = (string) get_post_meta( $id, 'cohort', true );
	if ( $cohort === '' || ! function_exists( 'aa_reg_find' ) ) { return ''; }
	$f = aa_reg_find( $cohort );
	return $f ? (string) $f['cohort']['start'] : '';
}

/**
 * Send one confirmation and record the outcome. The same steps as the manual
 * [aa_reg_send] page, so a retry and a click produce the same email.
 */
function aa_mh_send_one( $id, $by ) {
	if ( ! function_exists( 'aa_reg_send_confirmation' ) ) { return false; }
	$reg = get_post( $id );
	if ( ! $reg || $reg->post_type !== 'aa_registration' ) { return false; }

	if ( ! get_post_meta( $id, 'invoice_token', true ) ) {
		update_post_meta( $id, 'invoice_token', wp_generate_password( 32, false, false ) );
	}

	$sent = aa_reg_send_confirmation( array(
		'email'           => (string) get_post_meta( $id, 'email', true ),
		'name'            => trim( preg_replace( '/ — .*$/u', '', $reg->post_title ) ),
		'cohort'          => (string) get_post_meta( $id, 'cohort', true ),
		'course'          => (string) get_post_meta( $id, 'course', true ),
		'seats'           => (int) get_post_meta( $id, 'seats', true ),
		'amount'          => (int) get_post_meta( $id, 'amount_total', true ),
		'amount_currency' => (string) get_post_meta( $id, 'currency', true ),
		'lang'            => (string) get_post_meta( $id, 'lang', true ),
		'post_id'         => $id,
	) );

	update_post_meta( $id, 'confirmation_attempts', (int) get_post_meta( $id, 'confirmation_attempts', true ) + 1 );
	update_post_meta( $id, 'confirmation_sent', $sent ? 1 : 0 );
	if ( $sent ) {
		update_post_meta( $id, 'confirmation_sent_at', current_time( 'mysql' ) );
		update_post_meta( $id, 'confirmation_sent_by', $by );
	}
	return $sent;
}

/* ---------------------------------------------------------------------------
   3. The hourly retry.
   -------------------------------------------------------------------------- */
add_action( 'init', 'aa_mh_schedule' );

function aa_mh_schedule() {
	if ( ! aa_mh_enabled() ) { return; }
	aa_mh_installed_at();
	if ( ! wp_next_scheduled( 'aa_mh_retry' ) ) {
		wp_schedule_event( time() + 300, 'hourly', 'aa_mh_retry' );
	}
}

add_action( 'aa_mh_retry', 'aa_mh_retry' );

function aa_mh_retry() {
	if ( ! aa_mh_enabled() ) { return; }

	$since = aa_mh_installed_at();
	$today = ( new DateTime( 'now', new DateTimeZone( 'America/New_York' ) ) )->format( 'Y-m-d' );

	foreach ( aa_mh_unsent() as $r ) {
		/* The backlog is a person's call. See the header. */
		if ( strtotime( $r->post_date_gmt . ' UTC' ) < $since ) { continue; }

		/* A registration with no confirmed cohort has its own path -- the
		   "we are confirming your dates" note and the needs_cohort list. */
		if ( get_post_meta( $r->ID, 'needs_cohort', true ) === '1' ) { continue; }

		/* A confirmation for a class that has already started tells the buyer
		   nothing useful and looks like a mistake. Leave it on the banner. */
		$start = aa_mh_cohort_start( $r->ID );
		if ( $start === '' || $start < $today ) { continue; }

		/* Two days of hourly tries. Past that the mailer is not coming back on
		   its own and hammering it changes nothing; the banner is still up. */
		if ( (int) get_post_meta( $r->ID, 'confirmation_attempts', true ) >= 48 ) { continue; }

		aa_mh_send_one( $r->ID, 'auto-retry' );
	}
}

/* ---------------------------------------------------------------------------
   The manual Send button in the banner.
   -------------------------------------------------------------------------- */
add_action( 'admin_post_aa_mh_send', 'aa_mh_handle_send' );

function aa_mh_handle_send() {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'Not allowed.' ); }
	check_admin_referer( 'aa_mh_send' );

	$id   = isset( $_POST['aa_mh_id'] ) ? (int) $_POST['aa_mh_id'] : 0;
	$sent = $id ? aa_mh_send_one( $id, (string) get_current_user_id() ) : false;

	$back = wp_get_referer() ? wp_get_referer() : admin_url();
	wp_safe_redirect( add_query_arg( 'aa_mh', $sent ? 'sent' : 'failed', $back ) );
	exit;
}

/* ---------------------------------------------------------------------------
   2. The banner. Every admin screen, administrators only.
   -------------------------------------------------------------------------- */
add_action( 'admin_notices', 'aa_mh_notice' );

function aa_mh_notice() {
	if ( ! aa_mh_enabled() || ! current_user_can( 'manage_options' ) ) { return; }

	$h      = aa_mh_get();
	$down   = ! empty( $h['down'] );
	$unsent = aa_mh_unsent();

	if ( isset( $_GET['aa_mh'] ) ) {
		$ok = ( $_GET['aa_mh'] === 'sent' );
		echo '<div class="notice ' . ( $ok ? 'notice-success' : 'notice-error' ) . ' is-dismissible"><p>'
		   . ( $ok ? 'Confirmation sent.' : '<strong>The confirmation did not go out.</strong> The mailer is still failing &mdash; reconnect it first.' )
		   . '</p></div>';
	}

	if ( ! $down && ! $unsent ) { return; }

	$tz  = wp_timezone();
	$fmt = function ( $ts ) use ( $tz ) {
		return $ts ? ( new DateTime( '@' . (int) $ts ) )->setTimezone( $tz )->format( 'M j, g:ia' ) : '';
	};

	echo '<div class="notice notice-error" style="border-left-width:6px;padding:12px 16px">';

	if ( $down ) {
		echo '<p style="font-size:15px;margin:0 0 6px"><strong>Site email is not being delivered.</strong> '
		   . 'Every email since ' . esc_html( $fmt( isset( $h['down_since'] ) ? $h['down_since'] : 0 ) )
		   . ' has failed &mdash; ' . (int) ( isset( $h['fails'] ) ? $h['fails'] : 0 ) . ' so far, the last at '
		   . esc_html( $fmt( isset( $h['last_fail'] ) ? $h['last_fail'] : 0 ) ) . '. '
		   . 'Registration confirmations, form notifications and admin alerts are not reaching anyone.</p>';
		if ( ! empty( $h['last_error'] ) ) {
			echo '<p style="margin:0 0 6px;color:#646970"><code>' . esc_html( $h['last_error'] ) . '</code></p>';
		}
		echo '<p style="margin:0 0 6px"><a class="button button-primary" href="'
		   . esc_url( admin_url( 'admin.php?page=wp-mail-smtp' ) ) . '">Reconnect the mailer</a> '
		   . '<span style="color:#646970">WP Mail SMTP &rarr; Mailer &rarr; Google / Gmail &rarr; reconnect the Google account.</span></p>';
	}

	if ( $unsent ) {
		$since = aa_mh_installed_at();
		$today = ( new DateTime( 'now', new DateTimeZone( 'America/New_York' ) ) )->format( 'Y-m-d' );

		echo '<p style="font-size:14px;margin:' . ( $down ? '12px' : '0' ) . ' 0 6px"><strong>'
		   . count( $unsent ) . ' paid registration' . ( count( $unsent ) === 1 ? ' has' : 's have' )
		   . ' no confirmation.</strong> These buyers paid and have not been told their dates.</p>';

		echo '<table class="widefat striped" style="max-width:860px;margin:6px 0 4px"><thead><tr>'
		   . '<th>Buyer</th><th>Cohort</th><th>Paid</th><th>Status</th><th></th></tr></thead><tbody>';

		foreach ( $unsent as $r ) {
			$start = aa_mh_cohort_start( $r->ID );
			$cents = (int) get_post_meta( $r->ID, 'amount_total', true );
			$cur   = strtoupper( (string) get_post_meta( $r->ID, 'currency', true ) );
			$new   = strtotime( $r->post_date_gmt . ' UTC' ) >= $since;

			if ( $start !== '' && $start < $today ) {
				$status = '<span style="color:#996800">class has started &mdash; check before sending</span>';
			} elseif ( $new && $start !== '' && (int) get_post_meta( $r->ID, 'confirmation_attempts', true ) < 48 ) {
				$status = 'retrying hourly';
			} elseif ( $new && $start !== '' ) {
				$status = '<strong>retries used up &mdash; needs you</strong>';
			} else {
				$status = '<strong>needs you</strong>';
			}

			echo '<tr>'
			   . '<td>' . esc_html( trim( preg_replace( '/ — .*$/u', '', $r->post_title ) ) ) . '<br><span style="color:#646970">'
			   . esc_html( (string) get_post_meta( $r->ID, 'email', true ) ) . '</span></td>'
			   . '<td>' . esc_html( (string) get_post_meta( $r->ID, 'cohort', true ) ) . '</td>'
			   . '<td>' . esc_html( $cur . ' ' . number_format( $cents / 100, 2 ) ) . '</td>'
			   . '<td>' . $status . '</td>'
			   . '<td><form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="margin:0">'
			   . '<input type="hidden" name="action" value="aa_mh_send">'
			   . '<input type="hidden" name="aa_mh_id" value="' . (int) $r->ID . '">'
			   . wp_nonce_field( 'aa_mh_send', '_wpnonce', true, false )
			   . '<button type="submit" class="button"' . ( $down ? ' disabled title="Reconnect the mailer first"' : '' ) . '>Send</button>'
			   . '</form></td>'
			   . '</tr>';
		}
		echo '</tbody></table>';
		echo '<p style="margin:4px 0 0;color:#646970">Check the cohort is still right before sending. '
		   . 'If you already confirmed someone by hand, open their registration and set '
		   . '<code>confirmation_sent</code> to <code>1</code> to clear them from this list.</p>';
	}

	echo '</div>';
}
