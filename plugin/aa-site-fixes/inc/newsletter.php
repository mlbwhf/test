<?php
/**
 * AA — Monthly newsletter, built and sent on a schedule
 *
 * The footer promises "Monthly SAFe + AI-Native insights. New cohort dates."
 * This sends it. Once a month (first Tuesday, 10:00 site time, both settable
 * under Tools → Newsletter) every address collected by the footer Subscribe
 * box gets one email, built at send time from what the site already knows:
 *
 *   - an optional note you type in Tools → Newsletter (used once, then cleared)
 *   - the next dates of the main classes, read from the registration schedule
 *   - up to three blog posts published since the last issue
 *   - the team-training link
 *
 * NOTHING IS INVENTED. No salary figures, no prices, no claims: only class
 * names, dates and post titles the site already publishes. A month with no
 * dates and no posts sends nothing.
 *
 * SAFEGUARDS
 *   - Two days before each issue, the exact email goes to info@ first, with
 *     a "Skip this month" link.
 *   - The FIRST issue is not sent until someone presses "Approve and start
 *     sending" in that preview (or on the settings page). After that it runs
 *     on its own.
 *   - Only people who subscribed in the footer get it. Every email has a
 *     one-click unsubscribe link (also offered to the mail app as
 *     List-Unsubscribe) and the business postal address.
 *   - Sent in small batches, one email per person, never a shared To/Bcc.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_nl_settings' ) ) :

function aa_sf_nl_settings() {
	$d = array( 'on' => 1, 'approved' => 0, 'week' => 1, 'dow' => 'tuesday', 'hour' => 10, 'notify' => 'info@agile-agilist.com', 'note' => '', 'skip' => '', 'preview' => '', 'last' => '', 'last_at' => '' );
	$s = get_option( 'aa_sf_nl', array() );
	return array_merge( $d, is_array( $s ) ? $s : array() );
}
function aa_sf_nl_set( $k, $v ) { $s = aa_sf_nl_settings(); $s[ $k ] = $v; update_option( 'aa_sf_nl', $s, false ); }

function aa_sf_nl_key( $what ) { return substr( hash_hmac( 'sha256', $what, wp_salt( 'auth' ) . '|aa-nl' ), 0, 32 ); }
function aa_sf_nl_link( $do, $arg = '' ) {
	return add_query_arg( array( 'action' => 'aa_sf_nl', 'do' => $do, 'a' => rawurlencode( $arg ), 'k' => aa_sf_nl_key( $do . '|' . $arg ) ), admin_url( 'admin-post.php' ) );
}
function aa_sf_nl_unsub_link( $email ) {
	$e = rtrim( strtr( base64_encode( strtolower( $email ) ), '+/', '-_' ), '=' );
	return add_query_arg( array( 'action' => 'aa_sf_nl', 'do' => 'unsub', 'a' => $e, 'k' => aa_sf_nl_key( 'unsub|' . $e ) ), admin_url( 'admin-post.php' ) );
}

/** When this month's issue goes out (site time). $ym = 'Y-m'. */
function aa_sf_nl_send_time( $ym, $s = null ) {
	$s     = $s ?: aa_sf_nl_settings();
	$words = array( 1 => 'first', 2 => 'second', 3 => 'third', 4 => 'fourth' );
	$w     = isset( $words[ (int) $s['week'] ] ) ? $words[ (int) $s['week'] ] : 'first';
	$dow   = in_array( $s['dow'], array( 'monday', 'tuesday', 'wednesday', 'thursday', 'friday' ), true ) ? $s['dow'] : 'tuesday';
	$d     = new DateTime( $ym . '-01 00:00:00', wp_timezone() );
	$d->modify( $w . ' ' . $dow . ' of ' . $d->format( 'F Y' ) );
	$d->setTime( max( 0, min( 23, (int) $s['hour'] ) ), 0, 0 );
	return $d;
}
/** The next issue that has not gone out: array( 'ym' => 'Y-m', 'at' => DateTime ). */
function aa_sf_nl_next( $now = null ) {
	$s   = aa_sf_nl_settings();
	$now = $now ?: new DateTime( 'now', wp_timezone() );
	$ym  = $now->format( 'Y-m' );
	$at  = aa_sf_nl_send_time( $ym, $s );
	$end = ( clone $at )->modify( '+3 days' );
	if ( $s['last'] === $ym || $now > $end ) {
		$ym = ( new DateTime( $ym . '-01', wp_timezone() ) )->modify( '+1 month' )->format( 'Y-m' );
		$at = aa_sf_nl_send_time( $ym, $s );
	}
	return array( 'ym' => $ym, 'at' => $at );
}

function aa_sf_nl_recipients() {
	$list = get_option( 'aa_sf_subscribers', array() );
	$out  = array();
	foreach ( is_array( $list ) ? $list : array() as $email => $r ) {
		if ( ! is_email( $email ) || ! empty( $r['unsub'] ) ) { continue; }
		$out[ $email ] = is_array( $r ) ? $r : array();
	}
	return $out;
}

/* ---------------------------------------------------------------- content */

function aa_sf_nl_classes() {
	if ( ! function_exists( 'aa_reg_course' ) || ! function_exists( 'aa_reg_upcoming' ) ) { return array(); }
	$slugs = apply_filters( 'aa_sf_nl_courses', array( 'ai-native-foundations', 'ai-native-change-agent', 'launching-ai-native-arts', 'sa', 'popm', 'scrum-master', 'spc', 'rte' ) );
	$from  = ( new DateTime( 'now', wp_timezone() ) )->modify( '+3 days' )->format( 'Y-m-d' );
	$to    = ( new DateTime( 'now', wp_timezone() ) )->modify( '+60 days' )->format( 'Y-m-d' );
	$out   = array();
	foreach ( $slugs as $slug ) {
		$c = aa_reg_course( $slug );
		if ( ! is_array( $c ) || empty( $c['name'] ) || empty( $c['url'] ) ) { continue; }
		if ( function_exists( 'aa_reg_on_sale' ) && ! aa_reg_on_sale( $c ) ) { continue; }
		$dates = array();
		foreach ( (array) aa_reg_upcoming( $slug, $c ) as $h ) {
			if ( $h['start'] < $from || $h['start'] > $to ) { continue; }
			$dates[] = function_exists( 'aa_reg_range' ) ? aa_reg_range( $h['start'], $h['end'], true ) : $h['start'];
			if ( count( $dates ) >= 3 ) { break; }
		}
		if ( ! $dates ) { continue; }
		$out[] = array( 'name' => trim( preg_replace( '/\s+Certification$/i', '', (string) $c['name'] ) ), 'url' => home_url( $c['url'] ), 'dates' => $dates, 'days' => (int) $c['days'] );
	}
	return $out;
}

function aa_sf_nl_posts( $since ) {
	$q = array( 'post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 3, 'orderby' => 'date', 'order' => 'DESC', 'no_found_rows' => true, 'ignore_sticky_posts' => true,
	            'date_query' => array( array( 'after' => $since, 'inclusive' => false ) ) );
	if ( function_exists( 'pll_default_language' ) ) { $q['lang'] = 'en'; }
	$out = array();
	foreach ( get_posts( $q ) as $p ) {
		$ex = has_excerpt( $p ) ? get_the_excerpt( $p ) : wp_trim_words( wp_strip_all_tags( strip_shortcodes( $p->post_content ) ), 28, '…' );
		$out[] = array( 'title' => get_the_title( $p ), 'url' => get_permalink( $p ), 'excerpt' => wp_strip_all_tags( $ex ) );
	}
	return $out;
}

/** array( subject, html ) for one recipient, or null when there is nothing to say. */
function aa_sf_nl_build( $ym, $email, $preview = false ) {
	$s       = aa_sf_nl_settings();
	$month   = ( new DateTime( $ym . '-01', wp_timezone() ) )->format( 'F Y' );
	$classes = aa_sf_nl_classes();
	$since   = $s['last_at'] !== '' ? $s['last_at'] : ( new DateTime( 'now', wp_timezone() ) )->modify( '-35 days' )->format( 'Y-m-d H:i:s' );
	$posts   = aa_sf_nl_posts( $since );
	$note    = trim( (string) $s['note'] );
	if ( ! $classes && ! $posts && $note === '' ) { return null; }

	$utm  = function ( $url ) use ( $ym ) { return add_query_arg( array( 'utm_source' => 'newsletter', 'utm_medium' => 'email', 'utm_campaign' => 'monthly-' . $ym ), $url ); };
	$e    = 'esc_html';
	$h2   = 'margin:0 0 12px;font:400 22px/1.2 Georgia,\'Times New Roman\',serif;color:#0B2E35;';
	$eye  = 'margin:0 0 6px;font:700 11px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#0E8074;';
	$addr = function_exists( 'aa_ag_address_line' ) ? aa_ag_address_line() : '55 Village Centre Place, Mississauga, ON L4Z 1V9, Canada';
	$unsub = aa_sf_nl_unsub_link( $email );

	$b = '';
	if ( $preview ) {
		$b .= '<tr><td style="padding:16px 24px;background:#FFF6E6;border-bottom:1px solid #F2B66D;font:14px/1.5 Arial,Helvetica,sans-serif;color:#0B2E35;">'
		    . '<strong>Preview.</strong> This is the ' . $e( $month ) . ' newsletter as subscribers will get it. It goes to ' . count( aa_sf_nl_recipients() ) . ' subscriber(s) on '
		    . $e( aa_sf_nl_send_time( $ym )->format( 'l, F j \a\t g:i a' ) ) . ' (site time).<br>'
		    . ( $s['approved'] ? '' : '<strong>The first issue waits for your approval:</strong> <a href="' . esc_url( aa_sf_nl_link( 'approve', $ym ) ) . '" style="color:#0E8074;font-weight:700;">Approve and start sending</a> &nbsp;·&nbsp; ' )
		    . '<a href="' . esc_url( aa_sf_nl_link( 'skip', $ym ) ) . '" style="color:#0E8074;">Skip this month</a> &nbsp;·&nbsp; '
		    . '<a href="' . esc_url( admin_url( 'tools.php?page=aa-sf-newsletter' ) ) . '" style="color:#0E8074;">Add a note or change the schedule</a></td></tr>';
	}
	$b .= '<tr><td style="padding:24px 24px 18px;background:#0B2E35;"><span style="font:700 20px/1.2 Arial,Helvetica,sans-serif;color:#ffffff;">Agile Agilist</span>'
	    . '<span style="display:block;margin-top:6px;font:700 11px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8FCFCF;">Monthly · ' . $e( $month ) . '</span></td></tr>';

	$b .= '<tr><td style="padding:24px 24px 6px;font:16px/1.6 Arial,Helvetica,sans-serif;color:#0B2E35;">';
	if ( $note !== '' ) { foreach ( preg_split( '/\R{2,}/', $note ) as $para ) { $b .= '<p style="margin:0 0 14px;">' . nl2br( $e( trim( $para ) ) ) . '</p>'; } }
	else { $b .= '<p style="margin:0 0 14px;">Here are the next class dates' . ( $posts ? ' and what we published this month' : '' ) . '.</p>'; }
	$b .= '</td></tr>';

	if ( $classes ) {
		$b .= '<tr><td style="padding:10px 24px 8px;"><p style="' . $eye . '">Upcoming classes</p><h2 style="' . $h2 . '">Live online, instructor-led</h2>'
		    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #DCEAE8;">';
		foreach ( $classes as $c ) {
			$b .= '<tr><td style="padding:12px 0;border-bottom:1px solid #DCEAE8;font:15px/1.45 Arial,Helvetica,sans-serif;color:#0B2E35;">'
			    . '<a href="' . esc_url( $utm( $c['url'] ) ) . '" style="color:#0B2E35;font-weight:700;text-decoration:none;">' . $e( $c['name'] ) . '</a>'
			    . '<span style="display:block;margin-top:3px;color:#5C7479;font-size:14px;">' . $e( implode( '  ·  ', $c['dates'] ) ) . '</span>'
			    . '<a href="' . esc_url( $utm( $c['url'] ) . '#enroll' ) . '" style="display:inline-block;margin-top:6px;color:#0E8074;font-weight:700;font-size:14px;text-decoration:none;">See dates and register ⟶</a></td></tr>';
		}
		$b .= '</table><p style="margin:10px 0 0;font:13px/1.5 Arial,Helvetica,sans-serif;color:#5C7479;">The exam fee is included in every class. All classes: <a href="' . esc_url( $utm( home_url( '/training/' ) ) ) . '" style="color:#0E8074;">agile-agilist.com/training</a></p></td></tr>';
	}

	if ( $posts ) {
		$b .= '<tr><td style="padding:22px 24px 4px;"><p style="' . $eye . '">From the blog</p><h2 style="' . $h2 . '">What we published</h2>';
		foreach ( $posts as $p ) {
			$b .= '<p style="margin:0 0 14px;font:15px/1.5 Arial,Helvetica,sans-serif;color:#0B2E35;"><a href="' . esc_url( $utm( $p['url'] ) ) . '" style="color:#0E8074;font-weight:700;text-decoration:none;">' . $e( $p['title'] ) . '</a>'
			    . '<span style="display:block;margin-top:3px;color:#5C7479;font-size:14px;">' . $e( $p['excerpt'] ) . '</span></p>';
		}
		$b .= '</td></tr>';
	}

	$b .= '<tr><td style="padding:14px 24px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#F4F9F8;border-radius:10px;padding:18px;font:15px/1.5 Arial,Helvetica,sans-serif;color:#0B2E35;">'
	    . '<strong>Training a team?</strong> Private classes on your dates, or a block of seats in public classes. '
	    . '<a href="' . esc_url( $utm( home_url( '/team-training/' ) ) ) . '" style="color:#0E8074;font-weight:700;text-decoration:none;">Request a team quote ⟶</a></td></tr></table>'
	    . '<p style="margin:18px 0 0;font:15px/1.5 Arial,Helvetica,sans-serif;color:#0B2E35;">John Scott, Agile Agilist<br><span style="color:#5C7479;font-size:14px;">Reply to this email and it reaches us at info@agile-agilist.com.</span></p></td></tr>';

	$b .= '<tr><td style="padding:16px 24px 22px;border-top:1px solid #DCEAE8;font:12px/1.6 Arial,Helvetica,sans-serif;color:#7C9296;">Agile Agilist · ' . $e( $addr ) . '<br>'
	    . 'You are receiving this because you subscribed at agile-agilist.com. <a href="' . esc_url( $unsub ) . '" style="color:#7C9296;text-decoration:underline;">Unsubscribe</a>.</td></tr>';

	$pre  = $classes ? 'Next dates: ' . $classes[0]['name'] . ' ' . $classes[0]['dates'][0] . ( isset( $classes[1] ) ? ', ' . $classes[1]['name'] . ' ' . $classes[1]['dates'][0] : '' ) . '.' : 'What we published this month.';
	$subj = 'Agile Agilist · ' . $month . ': new class dates' . ( $posts ? ' and what we published' : '' );
	$html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . $e( $subj ) . '</title></head>'
	      . '<body style="margin:0;padding:0;background:#EEF4F3;"><div style="display:none;max-height:0;overflow:hidden;color:#EEF4F3;">' . $e( $pre ) . '</div>'
	      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF4F3;"><tr><td align="center" style="padding:20px 10px;">'
	      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">' . $b . '</table></td></tr></table></body></html>';
	return array( 'subject' => ( $preview ? '[Preview] ' : '' ) . $subj, 'html' => $html, 'classes' => count( $classes ), 'posts' => count( $posts ) );
}

function aa_sf_nl_mail( $to, $mail, $unsub = '' ) {
	$headers = array( 'Content-Type: text/html; charset=UTF-8', 'Reply-To: Agile Agilist <info@agile-agilist.com>' );
	if ( $unsub !== '' ) { $headers[] = 'List-Unsubscribe: <' . $unsub . '>'; $headers[] = 'List-Unsubscribe-Post: List-Unsubscribe=One-Click'; }
	return (bool) wp_mail( $to, $mail['subject'], $mail['html'], $headers );
}

function aa_sf_nl_send_preview( $ym ) {
	$s    = aa_sf_nl_settings();
	$mail = aa_sf_nl_build( $ym, $s['notify'], true );
	if ( ! $mail ) { return false; }
	return aa_sf_nl_mail( $s['notify'], $mail );
}

/* ------------------------------------------------------------------- run */

function aa_sf_nl_tick() {
	$s = aa_sf_nl_settings();
	if ( ! $s['on'] ) { return; }
	$now  = new DateTime( 'now', wp_timezone() );
	$next = aa_sf_nl_next( $now );
	$ym   = $next['ym']; $at = $next['at'];

	/* Two days before: the preview, once per issue. */
	if ( $s['preview'] !== $ym && $now >= ( clone $at )->modify( '-2 days' ) && $now < ( clone $at )->modify( '+3 days' ) && aa_sf_nl_recipients() ) {
		if ( aa_sf_nl_send_preview( $ym ) ) { aa_sf_nl_set( 'preview', $ym ); }
	}
	if ( $now < $at || $s['skip'] === $ym || ! $s['approved'] ) { return; }

	/* The issue, in batches. Each row remembers the last issue it was sent. */
	$list = get_option( 'aa_sf_subscribers', array() );
	$list = is_array( $list ) ? $list : array();
	$sent = 0; $left = 0;
	foreach ( aa_sf_nl_recipients() as $email => $r ) {
		if ( isset( $r['nl'] ) && $r['nl'] === $ym ) { continue; }
		if ( $sent >= 40 ) { $left++; continue; }
		$mail = aa_sf_nl_build( $ym, $email );
		if ( ! $mail ) { aa_sf_nl_set( 'last', $ym ); aa_sf_nl_log( $ym, 0, 'nothing to send' ); return; }
		$list[ $email ]['nl'] = $ym;                       /* marked first, so a crash cannot send twice */
		update_option( 'aa_sf_subscribers', $list, false );
		if ( aa_sf_nl_mail( $email, $mail, aa_sf_nl_unsub_link( $email ) ) ) { $sent++; }
	}
	if ( $sent ) { aa_sf_nl_log( $ym, $sent, '' ); }
	if ( $left ) { if ( ! wp_next_scheduled( 'aa_sf_nl_tick_more' ) ) { wp_schedule_single_event( time() + 180, 'aa_sf_nl_tick_more' ); } return; }
	aa_sf_nl_set( 'last', $ym );
	aa_sf_nl_set( 'last_at', current_time( 'mysql' ) );
	if ( $s['note'] !== '' ) { aa_sf_nl_set( 'note', '' ); }  /* a note is for one issue */
}
add_action( 'aa_sf_nl_tick', 'aa_sf_nl_tick' );
add_action( 'aa_sf_nl_tick_more', 'aa_sf_nl_tick' );
add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'aa_sf_nl_tick' ) ) { wp_schedule_event( time() + 300, 'hourly', 'aa_sf_nl_tick' ); }
} );

function aa_sf_nl_log( $ym, $n, $why ) {
	$log = get_option( 'aa_sf_nl_log', array() ); $log = is_array( $log ) ? $log : array();
	if ( isset( $log[ $ym ] ) ) { $n += (int) $log[ $ym ]['n']; }
	$log[ $ym ] = array( 'n' => $n, 't' => current_time( 'mysql' ), 'why' => $why );
	krsort( $log );
	update_option( 'aa_sf_nl_log', array_slice( $log, 0, 36, true ), false );
}

/* ------------------------------------------- links in emails (no login) */

function aa_sf_nl_page( $title, $text ) {
	nocache_headers();
	wp_die( '<h1 style="font:400 28px/1.2 Georgia,serif;color:#0B2E35">' . esc_html( $title ) . '</h1><p style="font:16px/1.6 Arial,sans-serif;color:#35555B">' . esc_html( $text ) . '</p><p><a href="' . esc_url( home_url( '/' ) ) . '">agile-agilist.com</a></p>', esc_html( $title ), array( 'response' => 200 ) );
}
function aa_sf_nl_handle() {
	$do = isset( $_REQUEST['do'] ) ? sanitize_key( $_REQUEST['do'] ) : '';                        // phpcs:ignore WordPress.Security.NonceVerification -- signed link
	$a  = isset( $_REQUEST['a'] ) ? rawurldecode( (string) wp_unslash( $_REQUEST['a'] ) ) : '';   // phpcs:ignore
	$k  = isset( $_REQUEST['k'] ) ? (string) $_REQUEST['k'] : '';                                 // phpcs:ignore
	if ( ! in_array( $do, array( 'unsub', 'approve', 'skip' ), true ) || ! hash_equals( aa_sf_nl_key( $do . '|' . $a ), $k ) ) { aa_sf_nl_page( 'That link is not valid', 'Please use the link from the most recent email, or write to info@agile-agilist.com.' ); }

	if ( $do === 'unsub' ) {
		$email = strtolower( (string) base64_decode( strtr( $a, '-_', '+/' ) ) );
		$list  = get_option( 'aa_sf_subscribers', array() ); $list = is_array( $list ) ? $list : array();
		if ( isset( $list[ $email ] ) && empty( $list[ $email ]['unsub'] ) ) {
			$list[ $email ]['unsub'] = current_time( 'mysql' );
			update_option( 'aa_sf_subscribers', $list, false );
			if ( function_exists( 'aa_sf_sub_token' ) && aa_sf_sub_token() !== '' ) {
				aa_sf_sub_hs( 'PATCH', '/crm/v3/objects/contacts/' . rawurlencode( $email ) . '?idProperty=email', array( 'properties' => array( 'aa_newsletter' => 'Unsubscribed ' . current_time( 'Y-m-d' ) ) ) );
			}
		}
		aa_sf_nl_page( 'You are unsubscribed', 'You will not get the monthly newsletter again. If this was a mistake, subscribe again in the footer of agile-agilist.com.' );
	}
	if ( $do === 'approve' ) { aa_sf_nl_set( 'approved', 1 ); aa_sf_nl_page( 'Approved', 'The newsletter will go out on its scheduled date, and every month after. You will get a preview two days before each issue.' ); }
	if ( $do === 'skip' )    { aa_sf_nl_set( 'skip', preg_match( '/^\d{4}-\d{2}$/', $a ) ? $a : '' ); aa_sf_nl_page( 'Skipped', 'This month\'s newsletter will not be sent. Next month runs as usual.' ); }
}
add_action( 'admin_post_aa_sf_nl', 'aa_sf_nl_handle' );
add_action( 'admin_post_nopriv_aa_sf_nl', 'aa_sf_nl_handle' );

/* --------------------------------------------------- Tools → Newsletter */

add_action( 'admin_menu', function () {
	add_management_page( 'Newsletter', 'Newsletter', 'manage_options', 'aa-sf-newsletter', 'aa_sf_nl_admin' );
} );
function aa_sf_nl_admin() {
	$s = aa_sf_nl_settings(); $next = aa_sf_nl_next(); $n = count( aa_sf_nl_recipients() );
	$log = get_option( 'aa_sf_nl_log', array() ); $log = is_array( $log ) ? $log : array();
	$post = esc_url( admin_url( 'admin-post.php' ) );
	echo '<div class="wrap"><h1>Newsletter</h1>';
	if ( isset( $_GET['msg'] ) ) { echo '<div class="notice notice-success"><p>' . esc_html( sanitize_text_field( wp_unslash( $_GET['msg'] ) ) ) . '</p></div>'; } // phpcs:ignore
	echo '<p><strong>' . (int) $n . '</strong> subscriber(s) (<a href="' . esc_url( admin_url( 'tools.php?page=aa-sf-subscribers' ) ) . '">list</a>). '
	   . 'Next issue: <strong>' . esc_html( $next['at']->format( 'l, F j, Y \a\t g:i a' ) ) . '</strong> (site time)'
	   . ( $s['skip'] === $next['ym'] ? ' — <strong>skipped</strong>' : '' ) . '. A preview goes to ' . esc_html( $s['notify'] ) . ' two days before.</p>';
	if ( ! $s['on'] ) { echo '<p><strong>Sending is switched off.</strong></p>'; }
	elseif ( ! $s['approved'] ) { echo '<div class="notice notice-warning inline"><p><strong>Not approved yet.</strong> Nothing is sent to subscribers until you approve the first issue: send yourself a preview, then press Approve.</p></div>'; }

	echo '<form method="post" action="' . $post . '">' . wp_nonce_field( 'aa_sf_nl_admin', '_wpnonce', true, false ) . '<input type="hidden" name="action" value="aa_sf_nl_admin">'
	   . '<table class="form-table"><tr><th>Send automatically</th><td><label><input type="checkbox" name="on" value="1"' . checked( 1, (int) $s['on'], false ) . '> Yes, every month</label></td></tr>'
	   . '<tr><th>When</th><td>The <select name="week">';
	foreach ( array( 1 => 'first', 2 => 'second', 3 => 'third', 4 => 'fourth' ) as $k => $v ) { echo '<option value="' . (int) $k . '"' . selected( $k, (int) $s['week'], false ) . '>' . esc_html( $v ) . '</option>'; }
	echo '</select> <select name="dow">';
	foreach ( array( 'monday', 'tuesday', 'wednesday', 'thursday', 'friday' ) as $d ) { echo '<option value="' . esc_attr( $d ) . '"' . selected( $d, $s['dow'], false ) . '>' . esc_html( ucfirst( $d ) ) . '</option>'; }
	echo '</select> of the month at <input type="number" name="hour" min="0" max="23" value="' . (int) $s['hour'] . '" style="width:64px">:00 (site time)</td></tr>'
	   . '<tr><th>Preview goes to</th><td><input type="email" name="notify" value="' . esc_attr( $s['notify'] ) . '" class="regular-text"></td></tr>'
	   . '<tr><th>Your note for the next issue</th><td><textarea name="note" rows="5" class="large-text" placeholder="Optional. Appears at the top of the next issue only, in your words.">' . esc_textarea( $s['note'] ) . '</textarea></td></tr></table>'
	   . '<p><button class="button button-primary" name="go" value="save">Save</button> '
	   . '<button class="button" name="go" value="preview">Save and send me a preview now</button> '
	   . ( $s['approved'] ? '' : '<button class="button" name="go" value="approve">Approve and start sending</button> ' )
	   . '<button class="button" name="go" value="' . ( $s['skip'] === $next['ym'] ? 'unskip' : 'skip' ) . '">' . ( $s['skip'] === $next['ym'] ? 'Do not skip the next issue' : 'Skip the next issue' ) . '</button></p></form>';

	echo '<h2>Sent</h2><table class="widefat striped" style="max-width:640px"><thead><tr><th>Issue</th><th>Emails</th><th>When</th><th></th></tr></thead><tbody>';
	foreach ( $log as $ym => $r ) { echo '<tr><td>' . esc_html( $ym ) . '</td><td>' . (int) $r['n'] . '</td><td>' . esc_html( $r['t'] ) . '</td><td>' . esc_html( $r['why'] ) . '</td></tr>'; }
	if ( ! $log ) { echo '<tr><td colspan="4">Nothing sent yet.</td></tr>'; }
	echo '</tbody></table></div>';
}
add_action( 'admin_post_aa_sf_nl_admin', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); }
	check_admin_referer( 'aa_sf_nl_admin' );
	$s = aa_sf_nl_settings(); $p = wp_unslash( $_POST );
	$s['on']     = empty( $p['on'] ) ? 0 : 1;
	$s['week']   = max( 1, min( 4, (int) ( isset( $p['week'] ) ? $p['week'] : 1 ) ) );
	$s['dow']    = isset( $p['dow'] ) ? sanitize_key( $p['dow'] ) : 'tuesday';
	$s['hour']   = max( 0, min( 23, (int) ( isset( $p['hour'] ) ? $p['hour'] : 10 ) ) );
	$s['notify'] = isset( $p['notify'] ) && is_email( $p['notify'] ) ? sanitize_email( $p['notify'] ) : $s['notify'];
	$s['note']   = isset( $p['note'] ) ? sanitize_textarea_field( $p['note'] ) : '';
	$go  = isset( $p['go'] ) ? sanitize_key( $p['go'] ) : 'save';
	$msg = 'Saved.';
	if ( $go === 'approve' ) { $s['approved'] = 1; $msg = 'Approved. The newsletter will go out on its scheduled date.'; }
	update_option( 'aa_sf_nl', $s, false );
	$next = aa_sf_nl_next();
	if ( $go === 'skip' )   { aa_sf_nl_set( 'skip', $next['ym'] ); $msg = 'The next issue will be skipped.'; }
	if ( $go === 'unskip' ) { aa_sf_nl_set( 'skip', '' ); $msg = 'The next issue will be sent.'; }
	if ( $go === 'preview' ) { $msg = aa_sf_nl_send_preview( $next['ym'] ) ? 'Preview sent to ' . $s['notify'] . '.' : 'Nothing to preview: no class dates, no new posts and no note.'; }
	wp_safe_redirect( add_query_arg( array( 'page' => 'aa-sf-newsletter', 'msg' => rawurlencode( $msg ) ), admin_url( 'tools.php' ) ) );
	exit;
} );

endif;
