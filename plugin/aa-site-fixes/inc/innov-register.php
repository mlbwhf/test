<?php
/**
 * AA — Innovation Framework certifications: reserve a seat in the first cohort
 *
 * The Innovation Creator, Facilitator and Leader pages sent "Join the launch
 * list" to another site. They now take the reservation here: a short form on
 * each page (and on the track's landing page, with the certification as a
 * choice). No payment is taken and no price or date is promised, because none
 * is set yet; the form says so, and the checkout is not involved at all. When
 * the date and price are fixed, the people on this list are written to first.
 *
 *  - The form is added to the page output (pages built with class "aa-ifw"),
 *    above the closing banner, and the "Join the launch list" buttons are
 *    pointed at it. The page content itself is not edited.
 *  - Same handling as the team quote form: posts to admin-post.php, no nonce
 *    (cached page), hidden field + script token + five-per-hour limit against
 *    bots. Stored under wp-admin → Team quotes with the title starting
 *    "First cohort:", emailed to the team with Reply-To set to the person,
 *    confirmed to them, and sent to the HubSpot lead form.
 *  - ?reserved=1 shows the thank-you state and pushes "innov_reserved" to the
 *    dataLayer.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_ir_certs' ) ) :

function aa_sf_ir_certs() {
	return apply_filters( 'aa_sf_ir_certs', array(
		'innovation-creator'     => 'Innovation Creator (2 days)',
		'innovation-facilitator' => 'Innovation Facilitator (3 days)',
		'innovation-leader'      => 'Innovation Leader (executive, 1 day)',
	) );
}
function aa_sf_ir_opts() {
	return array(
		'seats' => array( 'Just me', '2–4', '5–9', '10 or more' ),
		'when'  => array( 'As soon as it runs', 'Within 3 months', 'Later in the year', 'Not sure yet' ),
	);
}

function aa_sf_ir_back( $args ) {
	$ref = wp_get_referer();
	$url = $ref ? remove_query_arg( array( 'reserved', 'rerr' ), $ref ) : home_url( '/training/innovation-framework/' );
	wp_safe_redirect( add_query_arg( $args, preg_replace( '/#.*$/', '', $url ) ) . '#reserve', 303 );
	exit;
}

function aa_sf_ir_handle() {
	$p = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification -- cached public form, see header
	if ( ! empty( $p['ir_website'] ) || empty( $p['ir_js'] ) || $p['ir_js'] !== 'ok' ) { aa_sf_ir_back( array( 'reserved' => 1 ) ); }

	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	$key = 'aa_ir_rl_' . md5( $ip . wp_salt() );
	$n   = (int) get_transient( $key );
	if ( $n >= 5 ) { aa_sf_ir_back( array( 'rerr' => 'busy' ) ); }
	set_transient( $key, $n + 1, HOUR_IN_SECONDS );

	$certs = aa_sf_ir_certs(); $opt = aa_sf_ir_opts();
	$f = array(
		'name'    => sanitize_text_field( isset( $p['ir_name'] ) ? $p['ir_name'] : '' ),
		'email'   => sanitize_email( isset( $p['ir_email'] ) ? $p['ir_email'] : '' ),
		'company' => sanitize_text_field( isset( $p['ir_company'] ) ? $p['ir_company'] : '' ),
		'role'    => sanitize_text_field( isset( $p['ir_role'] ) ? $p['ir_role'] : '' ),
		'cert'    => sanitize_key( isset( $p['ir_cert'] ) ? $p['ir_cert'] : '' ),
		'seats'   => sanitize_text_field( isset( $p['ir_seats'] ) ? $p['ir_seats'] : '' ),
		'when'    => sanitize_text_field( isset( $p['ir_when'] ) ? $p['ir_when'] : '' ),
		'notes'   => sanitize_textarea_field( isset( $p['ir_notes'] ) ? $p['ir_notes'] : '' ),
	);
	if ( $f['name'] === '' || ! is_email( $f['email'] ) ) { aa_sf_ir_back( array( 'rerr' => 'fields' ) ); }
	if ( ! isset( $certs[ $f['cert'] ] ) ) { $f['cert'] = 'innovation-creator'; }
	if ( ! in_array( $f['seats'], $opt['seats'], true ) ) { $f['seats'] = ''; }
	if ( ! in_array( $f['when'], $opt['when'], true ) ) { $f['when'] = ''; }

	if ( function_exists( 'aa_ff_looks_automated' ) ) {
		$parts = preg_split( '/\s+/', $f['name'], 2 );
		$why   = aa_ff_looks_automated( array(
			'names' => array( 'first_name' => $parts[0], 'last_name' => isset( $parts[1] ) ? $parts[1] : $parts[0] ),
			'email' => $f['email'], 'description' => $f['notes'] . ' ' . $f['company'], 'checkbox' => array(),
		) );
		if ( $why !== '' ) { aa_sf_ir_back( array( 'rerr' => 'spam' ) ); }
	}

	$cname = $certs[ $f['cert'] ];
	$ref   = wp_get_referer();
	$body  = implode( "\n", array(
		'Certification: ' . $cname,
		'Name: ' . $f['name'],
		'Email: ' . $f['email'],
		'Organization: ' . ( $f['company'] ?: '—' ),
		'Role: ' . ( $f['role'] ?: '—' ),
		'Seats: ' . ( $f['seats'] ?: '—' ),
		'Timing: ' . ( $f['when'] ?: '—' ),
		'', 'Notes:', $f['notes'] !== '' ? $f['notes'] : '—', '',
		'No payment taken. No date or price was promised.',
		'Sent from: ' . ( $ref ? $ref : home_url( '/training/innovation-framework/' ) ),
	) );
	$title = 'First cohort: ' . $cname . ' — ' . $f['name'] . ( $f['company'] ? ' (' . $f['company'] . ')' : '' );

	if ( post_type_exists( 'aa_team_quote' ) ) {
		$id = wp_insert_post( array( 'post_type' => 'aa_team_quote', 'post_status' => 'private', 'post_title' => $title, 'post_content' => $body ), true );
		if ( ! is_wp_error( $id ) ) {
			update_post_meta( $id, '_aa_tq_email', $f['email'] );
			update_post_meta( $id, '_aa_tq_size', $f['seats'] );
			update_post_meta( $id, '_aa_tq_when', $f['when'] );
			update_post_meta( $id, '_aa_tq_course', $f['cert'] );
		}
	}

	$to = function_exists( 'aa_tq_notify_to' ) ? aa_tq_notify_to() : 'info@agile-agilist.com';
	wp_mail( $to, $title, $body . "\n\nAll requests: " . admin_url( 'edit.php?post_type=aa_team_quote' ), array( 'Reply-To: ' . $f['name'] . ' <' . $f['email'] . '>' ) );

	$first = preg_split( '/\s+/', $f['name'] );
	wp_mail( $f['email'], 'Your place on the first-cohort list: ' . $cname,
		'Hi ' . $first[0] . ",\n\n"
		. 'Thank you. You are on the list for the first ' . $cname . " cohort.\n\n"
		. "Nothing is charged now. As soon as the date and price are set, we will write to this address first, and you decide then whether to take the seat.\n\n"
		. "If you have a question in the meantime, reply to this email.\n\n"
		. "John Scott, Agile Agilist\ninfo@agile-agilist.com\n" . home_url( '/training/innovation-framework/' ),
		array( 'Reply-To: Agile Agilist <info@agile-agilist.com>' ) );

	$portal = '46316757'; $hsform = 'c6f0d4c1-d233-4875-9b0c-4528cda02237';
	if ( function_exists( 'aa_ct_settings' ) ) { $s = aa_ct_settings(); if ( ! empty( $s['hs_portal'] ) ) { $portal = $s['hs_portal']; } if ( ! empty( $s['hs_form'] ) ) { $hsform = $s['hs_form']; } }
	$fields = array( array( 'name' => 'email', 'value' => $f['email'] ), array( 'name' => 'firstname', 'value' => $first[0] ) );
	wp_remote_post( 'https://api.hsforms.com/submissions/v3/integration/submit/' . rawurlencode( $portal ) . '/' . rawurlencode( $hsform ), array(
		'timeout' => 8, 'blocking' => false, 'headers' => array( 'Content-Type' => 'application/json' ),
		'body'    => wp_json_encode( array( 'fields' => $fields, 'context' => array(
			'pageUri'  => $ref ? esc_url_raw( $ref ) : home_url( '/training/innovation-framework/' ),
			'pageName' => mb_substr( 'First cohort: ' . $cname . ' — ' . ( $f['seats'] ?: 'seats ?' ) . ( $f['company'] ? ' — ' . $f['company'] : '' ) . ( $f['when'] ? ' — ' . $f['when'] : '' ), 0, 250 ),
		) ) ),
	) );

	aa_sf_ir_back( array( 'reserved' => 1 ) );
}
add_action( 'admin_post_nopriv_aa_innov_reserve', 'aa_sf_ir_handle' );
add_action( 'admin_post_aa_innov_reserve', 'aa_sf_ir_handle' );

function aa_sf_ir_form( $cert ) {
	$certs = aa_sf_ir_certs(); $opt = aa_sf_ir_opts();
	$one   = isset( $certs[ $cert ] );
	$sel   = function ( $name, $label, $items ) {
		$h = '<label>' . esc_html( $label ) . '<select name="' . esc_attr( $name ) . '"><option value="">Choose…</option>';
		foreach ( $items as $v ) { $h .= '<option>' . esc_html( $v ) . '</option>'; }
		return $h . '</select></label>';
	};
	$pick = '';
	if ( $one ) {
		$pick = '<input type="hidden" name="ir_cert" value="' . esc_attr( $cert ) . '">';
	} else {
		$pick = '<label class="ifr-wide">Certification<select name="ir_cert">';
		foreach ( $certs as $k => $v ) { $pick .= '<option value="' . esc_attr( $k ) . '">' . esc_html( $v ) . '</option>'; }
		$pick .= '</select></label>';
	}
	$what = $one ? preg_replace( '/\s*\(.*$/', '', $certs[ $cert ] ) : 'Innovation Framework';

	return '<section id="reserve" class="ifr" aria-labelledby="ifr-h">'
	     . '<style>.ifr{scroll-margin-top:90px}.ifr-box{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:28px 44px;padding:32px;background:#fff;border:1px solid #DCEAEA;border-top:4px solid #F2B66D}'
	     . '.ifr h2{font-size:clamp(28px,3.6vw,40px)!important;line-height:1.1!important}.ifr-pts{margin:16px 0 0;padding:0;list-style:none}.ifr-pts li{padding:9px 0 9px 26px;border-bottom:1px solid #DCEAEA;font-size:15px;color:#3C565E;position:relative}.ifr-pts li:before{content:"\2713";position:absolute;left:0;color:#0E8074;font-weight:700}'
	     . '.ifr form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ifr label{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:600;color:#0B2E35}.ifr .ifr-wide{grid-column:1/-1}'
	     . '.ifr input,.ifr select,.ifr textarea{min-height:48px;padding:10px 12px;border:1px solid #B9CFCF;border-radius:2px;font:400 16px/1.4 inherit;color:#0B2E35;background:#fff;width:100%}.ifr textarea{min-height:84px;resize:vertical}'
	     . '.ifr input:focus,.ifr select:focus,.ifr textarea:focus{outline:3px solid #F2B66D;outline-offset:1px;border-color:#0E8074}'
	     . '.ifr button{grid-column:1/-1;min-height:52px;border:0;border-radius:2px;background:#0B2E35;color:#fff;font:700 16px/1.3 inherit;cursor:pointer}.ifr button:hover{background:#0E8074}'
	     . '.ifr-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}.ifr-note{grid-column:1/-1;margin:0;font-size:12.5px;color:#5E7378}'
	     . '.ifr-msg{grid-column:1/-1;margin:0;padding:12px 14px;font-size:15px}.ifr-ok{background:#E3F3F1;border-left:4px solid #0E8074}.ifr-bad{background:#FDECEA;border-left:4px solid #B42318}'
	     . '@media (max-width:860px){.ifr-box{grid-template-columns:1fr;padding:22px 18px}}@media (max-width:520px){.ifr form{grid-template-columns:1fr}}</style>'
	     . '<div class="ifr-box"><div>'
	     . '<span class="mono" style="color:#0E8074">First cohort · Registration open</span>'
	     . '<h2 id="ifr-h" style="margin-top:10px">Reserve your seat in the <em>first ' . esc_html( $what ) . ' cohort.</em></h2>'
	     . '<ul class="ifr-pts"><li>No payment now. Nothing is charged when you reserve.</li><li>You hear the date and the price before anyone else.</li><li>You decide then whether to take the seat.</li><li>Live, instructor-led, with the workshops from the book.</li></ul>'
	     . '</div>'
	     . '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" id="ifr-form">'
	     . '<p class="ifr-msg ifr-ok" id="ifr-ok" hidden role="status">You are on the list. We have sent a confirmation to your email, and we will write to you first when the date and price are set.</p>'
	     . '<p class="ifr-msg ifr-bad" id="ifr-bad" hidden role="alert">Please check your name and email and try again.</p>'
	     . '<input type="hidden" name="action" value="aa_innov_reserve"><input type="hidden" name="ir_js" value=""><div class="ifr-hp" aria-hidden="true"><label>Website<input type="text" name="ir_website" tabindex="-1" autocomplete="off"></label></div>'
	     . $pick
	     . '<label>Full name<input type="text" name="ir_name" autocomplete="name" required></label>'
	     . '<label>Work email<input type="email" name="ir_email" autocomplete="email" inputmode="email" required></label>'
	     . '<label>Organization<input type="text" name="ir_company" autocomplete="organization"></label>'
	     . '<label>Your role<input type="text" name="ir_role" autocomplete="organization-title"></label>'
	     . $sel( 'ir_seats', 'Seats', $opt['seats'] ) . $sel( 'ir_when', 'When would you take it?', $opt['when'] )
	     . '<label class="ifr-wide">Anything we should know? (optional)<textarea name="ir_notes" rows="3"></textarea></label>'
	     . '<button type="submit">Reserve my seat &#10230;</button>'
	     . '<p class="ifr-note">We use your details to contact you about this certification. Nothing is charged.</p>'
	     . '</form></div>'
	     . '<script>(function(){var f=document.getElementById("ifr-form");if(!f)return;f.addEventListener("submit",function(){f.ir_js.value="ok"});'
	     . 'var q=new URLSearchParams(location.search);if(q.get("reserved")){document.getElementById("ifr-ok").hidden=false;[].forEach.call(f.querySelectorAll("label,button,.ifr-note"),function(e){e.hidden=true});try{(window.dataLayer=window.dataLayer||[]).push({event:"innov_reserved",aa_page:location.pathname})}catch(e){}}'
	     . 'else if(q.get("rerr")){var b=document.getElementById("ifr-bad");b.hidden=false;if(q.get("rerr")==="busy")b.textContent="Too many requests from this connection. Please email info@agile-agilist.com."}})();</script>'
	     . '</section>';
}

add_filter( 'the_content', function ( $html ) {
	if ( is_admin() || ! is_string( $html ) || strpos( $html, 'class="aa-ifw"' ) === false || strpos( $html, 'id="reserve"' ) !== false ) { return $html; }
	$slug = (string) get_post_field( 'post_name', get_the_ID() );
	$form = aa_sf_ir_form( $slug );
	$pos  = strpos( $html, '<section><div class="ifw-final">' );
	if ( $pos === false ) { return $html; }
	$html = substr( $html, 0, $pos ) . $form . substr( $html, $pos );
	/* Every "Join the launch list" button now goes to the form on this page. */
	$html = str_replace(
		array( 'href="https://twochasms.com/">Join the launch list &rarr;</a>', 'Be first in the <em>first cohort.</em>', 'Join the <em>first cohort.</em>' ),
		array( 'href="#reserve">Reserve your seat &rarr;</a>', 'Reserve your seat in the <em>first cohort.</em>', 'Reserve your seat in the <em>first cohort.</em>' ),
		$html
	);
	$html = str_replace( 'go to the launch list first', 'go first to the people who reserve', $html );
	return $html;
}, 22 );

endif;
