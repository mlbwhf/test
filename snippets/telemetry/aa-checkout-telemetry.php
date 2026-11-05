<?php
/**
 * AA — Checkout telemetry   [no shortcode]
 *
 * WPCode: PHP snippet, "Run everywhere". Paste everything below the <?php line.
 *
 * WHY
 *   A buyer pressed Pay twice on the APM page and nothing reached Stripe. The
 *   site had no record of what her browser saw, so the cause had to be
 *   guessed. This snippet keeps that record.
 *
 * WHAT IT RECORDS (Settings → Checkout log, last 200 attempts)
 *   - Every answer the checkout endpoint gives: sent to Stripe, refused (and
 *     why), or a WordPress error before our code ran (dead nonce, WAF, 5xx).
 *   - Failures the browser saw that the server never did: network errors,
 *     non-JSON answers, JavaScript errors on the page, and "Pay pressed but no
 *     request left the browser". The page reports them with a beacon to its
 *     own URL (?aa_ct_beacon=1), which is the request most likely to survive a
 *     strict corporate network.
 *
 * WHAT IT SENDS
 *   One email to info@ per failed buyer per hour, with the buyer's address,
 *   the class, the reason, and the browser, so someone can reach out while
 *   the buyer is still at their desk. Successful handoffs to Stripe are logged
 *   but not emailed.
 *
 * Wrapped in function_exists so a double execution cannot redeclare.
 */

if ( ! defined( 'ABSPATH' ) ) { return; }
if ( ! function_exists( 'aa_ct_log' ) ) :

function aa_ct_settings() {
	$d = array( 'notify' => 'info@agile-agilist.com', 'keep' => 200, 'debounce' => HOUR_IN_SECONDS );
	$s = get_option( 'aa_ct_settings', array() );
	return array_merge( $d, is_array( $s ) ? $s : array() );
}

/** Append one entry and alert when it is a failure. */
function aa_ct_log( $e ) {
	$set = aa_ct_settings();
	$e = array_merge( array(
		't' => current_time( 'mysql' ), 'outcome' => '', 'status' => 0, 'code' => '', 'msg' => '',
		'cohort' => '', 'course' => '', 'email' => '', 'seats' => 0, 'ip' => '', 'ua' => '', 'url' => '', 'source' => 'server',
	), $e );
	$e['msg'] = mb_substr( (string) $e['msg'], 0, 300 );
	$e['ua']  = mb_substr( (string) $e['ua'], 0, 160 );
	$log = get_option( 'aa_ct_log', array() ); $log = is_array( $log ) ? $log : array();
	array_unshift( $log, $e );
	update_option( 'aa_ct_log', array_slice( $log, 0, (int) $set['keep'] ), false );
	/* Email only when a buyer actually tried to pay. A JavaScript error on the
	   page is logged for diagnosis but is not, by itself, a lost sale. */
	if ( $e['outcome'] !== 'to_stripe' && $e['outcome'] !== 'browser_jserror' ) { aa_ct_alert( $e ); }
	return $e;
}

function aa_ct_ip() {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	return $ip ? substr( md5( $ip . wp_salt() ), 0, 10 ) : '';
}

function aa_ct_class_label( $cohort, $course = '' ) {
	$slug = $course;
	if ( ! $slug && preg_match( '/^([a-z0-9-]+)-(\d{4}-\d{2}-\d{2})$/', (string) $cohort, $m ) ) { $slug = $m[1]; }
	$name = $slug;
	if ( $slug && function_exists( 'aa_reg_course' ) ) { $c = aa_reg_course( $slug ); if ( is_array( $c ) && ! empty( $c['name'] ) ) { $name = $c['name']; } }
	$date = preg_match( '/(\d{4}-\d{2}-\d{2})$/', (string) $cohort, $m2 ) ? ' · ' . date_i18n( 'M j, Y', strtotime( $m2[1] ) ) : '';
	return trim( $name . $date );
}

/** One email per buyer (or per visitor when the address is unknown) per hour. */
function aa_ct_alert( $e ) {
	$set = aa_ct_settings();
	$key = 'aa_ct_n_' . md5( ( $e['email'] ?: $e['ip'] ) . '|' . $e['cohort'] );
	if ( get_transient( $key ) ) { return; }
	set_transient( $key, 1, (int) $set['debounce'] );
	$class = aa_ct_class_label( $e['cohort'], $e['course'] );
	$who   = $e['email'] ? $e['email'] : 'unknown buyer (no email captured)';
	$why   = trim( $e['code'] . ' ' . $e['msg'] );
	$subject = 'CHECKOUT FAILED — ' . ( $e['email'] ?: 'visitor' ) . ( $class ? ' — ' . $class : '' );
	$body  = "A buyer could not get to Stripe.\n\n"
	       . "Who:     " . $who . "\n"
	       . "Class:   " . ( $class ?: '(none selected)' ) . ( $e['seats'] ? ' · ' . (int) $e['seats'] . ' seat(s)' : '' ) . "\n"
	       . "When:    " . $e['t'] . " (site time)\n"
	       . "Where:   " . ( $e['source'] === 'browser' ? 'seen in the browser' : 'answered by the server' ) . ( $e['status'] ? ', HTTP ' . (int) $e['status'] : '' ) . "\n"
	       . "Reason:  " . ( $why ?: 'not stated' ) . "\n"
	       . "Browser: " . ( $e['ua'] ?: 'unknown' ) . "\n"
	       . ( $e['url'] ? "Page:    " . $e['url'] . "\n" : '' )
	       . "\nWhat to do: if there is an address, reply with a direct link or a payment link within the hour; the buyer is probably still at the page.\n"
	       . "Log: " . admin_url( 'options-general.php?page=aa-checkout-log' ) . "\n";
	wp_mail( $set['notify'], $subject, $body );
}

/* ----------------------------------------------------------------------------
   SERVER SIDE: every answer the checkout endpoint gives, including the ones
   WordPress produces before our callback runs (nonce, auth, WAF-style 403).
   ------------------------------------------------------------------------- */
add_filter( 'rest_post_dispatch', function ( $result, $server, $request ) {
	if ( ! ( $request instanceof WP_REST_Request ) || $request->get_method() !== 'POST' || $request->get_route() !== '/aa/v1/checkout' ) { return $result; }
	$d = (array) $request->get_json_params();
	$status = $result instanceof WP_REST_Response ? (int) $result->get_status() : 200;
	$data   = $result instanceof WP_REST_Response ? $result->get_data() : $result;
	$code = ''; $msg = ''; $outcome = 'to_stripe';
	if ( is_wp_error( $result ) ) { $code = $result->get_error_code(); $msg = $result->get_error_message(); $outcome = 'refused'; $status = $status ?: 400; }
	elseif ( $status >= 400 ) { $code = isset( $data['code'] ) ? (string) $data['code'] : ''; $msg = isset( $data['message'] ) ? (string) $data['message'] : ''; $outcome = strpos( $code, 'aa_' ) === 0 ? 'refused' : 'wp_error'; }
	elseif ( ! is_array( $data ) || empty( $data['url'] ) ) { $outcome = 'odd'; $msg = 'No Stripe URL in the answer'; }
	aa_ct_log( array(
		'outcome' => $outcome, 'status' => $status, 'code' => $code, 'msg' => $msg,
		'cohort' => isset( $d['cohort'] ) ? sanitize_text_field( (string) $d['cohort'] ) : '', 'course' => isset( $d['course'] ) ? sanitize_key( $d['course'] ) : '',
		'email' => isset( $d['email'] ) ? sanitize_email( $d['email'] ) : '', 'seats' => isset( $d['seats'] ) ? (int) $d['seats'] : 0,
		'ip' => aa_ct_ip(), 'ua' => isset( $_SERVER['HTTP_USER_AGENT'] ) ? (string) $_SERVER['HTTP_USER_AGENT'] : '', 'source' => 'server',
	) );
	return $result;
}, 10, 3 );

/* ----------------------------------------------------------------------------
   BROWSER SIDE: the page reports what the server never saw.
   ------------------------------------------------------------------------- */
add_action( 'init', function () {
	if ( ! isset( $_GET['aa_ct_beacon'] ) || ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] !== 'POST' ) ) { return; } // phpcs:ignore
	nocache_headers();
	$ip = aa_ct_ip();
	$n = (int) get_transient( 'aa_ct_rl_' . $ip );
	if ( $n >= 30 ) { status_header( 429 ); exit; }
	set_transient( 'aa_ct_rl_' . $ip, $n + 1, HOUR_IN_SECONDS );
	$raw = file_get_contents( 'php://input', false, null, 0, 4096 );
	$d = json_decode( (string) $raw, true );
	if ( ! is_array( $d ) ) { status_header( 400 ); exit; }
	$kind = isset( $d['kind'] ) ? sanitize_key( $d['kind'] ) : 'client';
	aa_ct_log( array(
		'outcome' => 'browser_' . $kind, 'status' => isset( $d['status'] ) ? (int) $d['status'] : 0, 'code' => $kind,
		'msg' => isset( $d['text'] ) ? sanitize_textarea_field( (string) $d['text'] ) : '',
		'cohort' => isset( $d['cohort'] ) ? sanitize_text_field( (string) $d['cohort'] ) : '', 'course' => isset( $d['course'] ) ? sanitize_key( $d['course'] ) : '',
		'email' => isset( $d['email'] ) ? sanitize_email( $d['email'] ) : '', 'seats' => isset( $d['seats'] ) ? (int) $d['seats'] : 0,
		'ip' => $ip, 'ua' => isset( $_SERVER['HTTP_USER_AGENT'] ) ? (string) $_SERVER['HTTP_USER_AGENT'] : '',
		'url' => isset( $d['url'] ) ? esc_url_raw( (string) $d['url'] ) : '', 'source' => 'browser',
	) );
	status_header( 204 ); exit;
}, 1 );

/* URL HYGIENE. Some ad links arrive as /page/#anchor&utm_source=... — the
   tracking parameters glued onto the fragment. The theme's smooth-scroll then
   calls querySelector('#anchor&utm_...') and throws, and analytics never sees
   the UTM values. Before any theme script runs, move everything after the
   first & or ? in the fragment into the query string and keep a clean anchor. */
add_action( 'wp_head', function () {
	if ( is_admin() ) { return; }
	echo '<script id="aa-ct-url">(function(){try{var h=location.hash;if(!h)return;var i=h.search(/[&?]/);if(i<0)return;var anchor=h.slice(0,i),extra=h.slice(i+1).replace(/^[&?]+/,"");var q=location.search;if(extra){q+=(q?"&":"?")+extra}history.replaceState(history.state,"",location.pathname+q+(anchor.length>1?anchor:""))}catch(e){}})();</script>' . "\n";
}, 0 );

add_action( 'wp_footer', function () {
	if ( is_admin() ) { return; }
	?>
<script id="aa-ct">(function(){
var F=window.fetch;if(!F||!document.querySelector('.aareg-inline,.aacal-panel,[data-aa-inline]'))return;
function send(d){try{d.url=location.href;var b=JSON.stringify(d),u=location.pathname+'?aa_ct_beacon=1';
if(!(navigator.sendBeacon&&navigator.sendBeacon(u,new Blob([b],{type:'text/plain'}))))F(u,{method:'POST',body:b,keepalive:true,credentials:'omit'}).catch(function(){})}catch(e){}}
var clicks=0,requests=0;
window.fetch=function(input,init){var url=typeof input==='string'?input:(input&&input.url)||'';var co=url.indexOf('/aa/v1/checkout')>-1,body=null;
if(co){requests++;try{body=JSON.parse((init&&init.body)||'{}')}catch(e){}}
var p=F.apply(this,arguments);if(!co)return p;
function ctx(x){x.cohort=body&&body.cohort;x.course=body&&body.course;x.email=body&&body.email;x.seats=body&&body.seats;return x}
return p.then(function(r){if(!r.ok){r.clone().text().then(function(t){send(ctx({kind:'http',status:r.status,text:t.slice(0,300)}))}).catch(function(){})}
else{r.clone().text().then(function(t){try{var j=JSON.parse(t);if(!j||!j.url)send(ctx({kind:'badanswer',status:r.status,text:t.slice(0,200)}))}catch(e){send(ctx({kind:'notjson',status:r.status,text:t.slice(0,200)}))}}).catch(function(){})}
return r},function(err){send(ctx({kind:'network',text:String(err&&err.message||err)+' · online='+navigator.onLine}));throw err})};
document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-inline-pay],[data-pay]'):null;if(!b||b.disabled)return;
var mine=++clicks;setTimeout(function(){if(requests<mine)send({kind:'noreq',text:'Pay pressed but no checkout request left the browser within 8s'})},8000)},true);
var errs=0;window.addEventListener('error',function(e){if(errs++<3)send({kind:'jserror',text:String(e.message||'').slice(0,200)+' @ '+String(e.filename||'').split('/').pop()+':'+(e.lineno||0)})});
})();</script>
	<?php
}, 99 );

/* ----------------------------------------------------------------------------
   ADMIN: Settings → Checkout log
   ------------------------------------------------------------------------- */
add_action( 'admin_menu', function () {
	add_options_page( 'Checkout log', 'Checkout log', 'manage_options', 'aa-checkout-log', 'aa_ct_admin_page' );
} );
add_action( 'admin_post_aa_ct_clear', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); } check_admin_referer( 'aa_ct_clear' );
	update_option( 'aa_ct_log', array(), false );
	wp_safe_redirect( admin_url( 'options-general.php?page=aa-checkout-log' ) ); exit;
} );
function aa_ct_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) { return; }
	$log = get_option( 'aa_ct_log', array() ); $log = is_array( $log ) ? $log : array();
	$set = aa_ct_settings();
	$today = current_time( 'Y-m-d' ); $ok = 0; $bad = 0;
	foreach ( $log as $e ) { if ( substr( $e['t'], 0, 10 ) === $today ) { if ( $e['outcome'] === 'to_stripe' ) { $ok++; } else { $bad++; } } }
	echo '<div class="wrap"><h1>Checkout log</h1>';
	echo '<p>Every attempt to start a payment, newest first. Failures are emailed to <strong>' . esc_html( $set['notify'] ) . '</strong> (one per buyer per hour). Today: <strong>' . $ok . '</strong> handed to Stripe, <strong>' . $bad . '</strong> failed.</p>';
	if ( ! $log ) { echo '<p>No attempts recorded yet.</p></div>'; return; }
	echo '<table class="widefat striped"><thead><tr><th>When</th><th>Buyer</th><th>Class</th><th>Outcome</th><th>Reason</th><th>Browser</th></tr></thead><tbody>';
	foreach ( $log as $e ) {
		$bad = $e['outcome'] !== 'to_stripe';
		echo '<tr><td style="white-space:nowrap">' . esc_html( $e['t'] ) . '</td>';
		echo '<td>' . ( $e['email'] ? '<a href="mailto:' . esc_attr( $e['email'] ) . '">' . esc_html( $e['email'] ) . '</a>' : '<span class="description">unknown</span>' ) . ( $e['seats'] > 1 ? ' · ' . (int) $e['seats'] . ' seats' : '' ) . '</td>';
		echo '<td>' . esc_html( aa_ct_class_label( $e['cohort'], $e['course'] ) ) . '</td>';
		echo '<td><strong style="color:' . ( $bad ? '#B3261E' : '#127E88' ) . '">' . esc_html( $e['outcome'] ) . '</strong>' . ( $e['status'] ? '<br><span class="description">HTTP ' . (int) $e['status'] . '</span>' : '' ) . '</td>';
		echo '<td>' . esc_html( trim( $e['code'] . ' ' . $e['msg'] ) ) . ( $e['url'] ? '<br><span class="description">' . esc_html( $e['url'] ) . '</span>' : '' ) . '</td>';
		echo '<td><span class="description" title="' . esc_attr( $e['ua'] ) . '">' . esc_html( mb_substr( $e['ua'], 0, 60 ) ) . '</span></td></tr>';
	}
	echo '</tbody></table>';
	echo '<p style="margin-top:12px"><a class="button" href="' . esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=aa_ct_clear' ), 'aa_ct_clear' ) ) . '" onclick="return confirm(\'Clear the log?\')">Clear log</a></p></div>';
}

endif;
