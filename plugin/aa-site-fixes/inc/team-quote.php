<?php
/**
 * AA — Team quote   [aa_team_quote]
 *
 * The form on /team-training/. Every course page's "Request a team quote"
 * strip links here with ?course=<slug>, and the form opens with that class
 * already chosen and its public per-seat price shown.
 *
 *  - Posts to admin-post.php (no nonce: the page is cached, and a cached nonce
 *    expires). Spam is stopped by a hidden field, a token set by JavaScript at
 *    submit time, the same bot signature check as the contact form, and a
 *    limit of five requests per visitor per hour.
 *  - Each request is stored as a private "Team quote" (wp-admin → Team quotes),
 *    emailed to the team with Reply-To set to the requester, confirmed to the
 *    requester, and sent to the HubSpot lead form so a contact and a
 *    submission notification exist there.
 *  - After sending, the page shows a thank-you state at ?sent=1 and pushes a
 *    "team_quote_submitted" event to the dataLayer for GTM / GA4 / Ads.
 *
 * Nothing here quotes a discount. Prices shown are the public per-seat prices
 * the course pages already show; the group price is written by a person.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_tq_courses' ) ) :

function aa_tq_notify_to() { return apply_filters( 'aa_tq_notify', 'info@agile-agilist.com' ); }

/** [ slug => [ name, code, group label ] ] in menu order, from the Training menu's own data when it is there. */
function aa_tq_courses() {
	static $out = null;
	if ( $out !== null ) { return $out; }
	$out = array();
	if ( function_exists( 'aa_mm_categories' ) && function_exists( 'aa_mm_overrides' ) ) {
		$ov = aa_mm_overrides();
		foreach ( aa_mm_categories() as $cat ) {
			foreach ( (array) $cat['courses'] as $slug ) {
				if ( isset( $out[ $slug ] ) || ! isset( $ov[ $slug ] ) ) { continue; }
				$out[ $slug ] = array( $ov[ $slug ][0], $ov[ $slug ][1], $cat['name'] );
			}
		}
	}
	if ( ! $out && function_exists( 'aa_reg_courses' ) ) {
		foreach ( aa_reg_courses() as $slug => $c ) {
			$out[ $slug ] = array( wp_strip_all_tags( (string) $c['name'] ), isset( $c['code'] ) ? (string) $c['code'] : '', 'Classes' );
		}
	}
	return $out;
}

/** "Name (CODE)", without doubling a code the name already carries. */
function aa_tq_label( $c ) {
	return $c[1] !== '' && stripos( $c[0], '(' . $c[1] . ')' ) === false ? $c[0] . ' (' . $c[1] . ')' : $c[0];
}

/** Public per-seat price for a class, or 0 when the register cannot say. */
function aa_tq_price( $slug ) {
	if ( ! function_exists( 'aa_reg_course' ) ) { return 0; }
	$c = aa_reg_course( $slug );
	return is_array( $c ) && ! empty( $c['price'] ) && is_numeric( $c['price'] ) ? (int) $c['price'] : 0;
}

function aa_tq_options() {
	return array(
		'size'   => array( 'Under 5', '5–9', '10–19', '20–49', '50+' ),
		'format' => array( 'Private class for our team', 'Seats in public classes', 'A programme across several roles', 'Not sure yet' ),
		'where'  => array( 'Live online', 'On-site', 'Either' ),
		'when'   => array( 'Within a month', '1–3 months', '3–6 months', 'Just exploring' ),
	);
}

/* ---------------------------------------------------------------- storage */

add_action( 'init', function () {
	register_post_type( 'aa_team_quote', array(
		'labels'          => array( 'name' => 'Team quotes', 'singular_name' => 'Team quote', 'menu_name' => 'Team quotes', 'all_items' => 'Team quotes' ),
		'public'          => false,
		'show_ui'         => true,
		'show_in_menu'    => true,
		'menu_position'   => 26,
		'menu_icon'       => 'dashicons-groups',
		'supports'        => array( 'title', 'editor' ),
		'capability_type' => 'post',
		'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
		'map_meta_cap'    => true,
		'show_in_rest'    => false,
	) );
} );

add_filter( 'manage_aa_team_quote_posts_columns', function ( $c ) {
	return array( 'cb' => $c['cb'], 'title' => 'Request', 'aa_tq_email' => 'Email', 'aa_tq_size' => 'Team', 'aa_tq_when' => 'When', 'date' => 'Received' );
} );
add_action( 'manage_aa_team_quote_posts_custom_column', function ( $col, $id ) {
	$map = array( 'aa_tq_email' => '_aa_tq_email', 'aa_tq_size' => '_aa_tq_size', 'aa_tq_when' => '_aa_tq_when' );
	if ( isset( $map[ $col ] ) ) { echo esc_html( (string) get_post_meta( $id, $map[ $col ], true ) ); }
}, 10, 2 );

/* ---------------------------------------------------------------- submit */

function aa_tq_back( $args ) {
	$ref = wp_get_referer();
	$url = $ref ? remove_query_arg( array( 'sent', 'err', 'c', 'n' ), $ref ) : home_url( '/team-training/' );
	$url = preg_replace( '/#.*$/', '', $url );
	wp_safe_redirect( add_query_arg( $args, $url ) . '#quote', 303 );
	exit;
}

function aa_tq_handle() {
	$p = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification -- cached public form, see header
	$f = array(
		'name'    => sanitize_text_field( isset( $p['tq_name'] ) ? $p['tq_name'] : '' ),
		'email'   => sanitize_email( isset( $p['tq_email'] ) ? $p['tq_email'] : '' ),
		'company' => sanitize_text_field( isset( $p['tq_company'] ) ? $p['tq_company'] : '' ),
		'phone'   => sanitize_text_field( isset( $p['tq_phone'] ) ? $p['tq_phone'] : '' ),
		'course'  => sanitize_key( isset( $p['tq_course'] ) ? $p['tq_course'] : '' ),
		'size'    => sanitize_text_field( isset( $p['tq_size'] ) ? $p['tq_size'] : '' ),
		'format'  => sanitize_text_field( isset( $p['tq_format'] ) ? $p['tq_format'] : '' ),
		'where'   => sanitize_text_field( isset( $p['tq_where'] ) ? $p['tq_where'] : '' ),
		'when'    => sanitize_text_field( isset( $p['tq_when'] ) ? $p['tq_when'] : '' ),
		'country' => sanitize_text_field( isset( $p['tq_country'] ) ? $p['tq_country'] : '' ),
		'notes'   => sanitize_textarea_field( isset( $p['tq_notes'] ) ? $p['tq_notes'] : '' ),
	);

	/* Bots: hidden field filled, or no JavaScript token. Answer as if it worked. */
	if ( ! empty( $p['tq_website'] ) || empty( $p['tq_js'] ) || $p['tq_js'] !== 'ok' ) { aa_tq_back( array( 'sent' => 1 ) ); }

	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	$key = 'aa_tq_rl_' . md5( $ip . wp_salt() );
	$n   = (int) get_transient( $key );
	if ( $n >= 5 ) { aa_tq_back( array( 'err' => 'busy' ) ); }
	set_transient( $key, $n + 1, HOUR_IN_SECONDS );

	$opt = aa_tq_options();
	$courses = aa_tq_courses();
	if ( $f['name'] === '' || ! is_email( $f['email'] ) || $f['company'] === '' ) { aa_tq_back( array( 'err' => 'fields' ) ); }
	if ( ! in_array( $f['size'], $opt['size'], true ) ) { $f['size'] = ''; }
	if ( ! in_array( $f['format'], $opt['format'], true ) ) { $f['format'] = ''; }
	if ( ! in_array( $f['where'], $opt['where'], true ) ) { $f['where'] = ''; }
	if ( ! in_array( $f['when'], $opt['when'], true ) ) { $f['when'] = ''; }
	if ( $f['course'] !== '' && $f['course'] !== 'several' && ! isset( $courses[ $f['course'] ] ) ) { $f['course'] = ''; }

	if ( function_exists( 'aa_ff_looks_automated' ) ) {
		$parts = preg_split( '/\s+/', $f['name'], 2 );
		$why   = aa_ff_looks_automated( array(
			'names'       => array( 'first_name' => $parts[0], 'last_name' => isset( $parts[1] ) ? $parts[1] : $parts[0] ),
			'email'       => $f['email'],
			'description' => $f['notes'] . ' ' . $f['company'],
			'checkbox'    => array(),
		) );
		if ( $why !== '' ) {
			$log = (array) get_option( 'aa_ff_blocked', array() );
			array_unshift( $log, array( 't' => current_time( 'mysql' ), 'form' => 'team-quote', 'why' => $why, 'email' => $f['email'] ) );
			update_option( 'aa_ff_blocked', array_slice( $log, 0, 100 ), false );
			aa_tq_back( array( 'err' => 'spam' ) );
		}
	}

	$cname = $f['course'] === 'several' ? 'Several classes' : ( $f['course'] !== '' ? aa_tq_label( $courses[ $f['course'] ] ) : 'Not chosen' );
	$price = $f['course'] && $f['course'] !== 'several' ? aa_tq_price( $f['course'] ) : 0;
	$ref   = wp_get_referer();

	$lines = array(
		'Name: '        . $f['name'],
		'Email: '       . $f['email'],
		'Organization: '. $f['company'],
		'Phone: '       . ( $f['phone'] ?: '—' ),
		'Class: '       . $cname . ( $price ? ' — public price $' . number_format( $price ) . ' USD per seat' : '' ),
		'Team size: '   . ( $f['size'] ?: '—' ),
		'Format: '      . ( $f['format'] ?: '—' ),
		'Delivery: '    . ( $f['where'] ?: '—' ),
		'Timeframe: '   . ( $f['when'] ?: '—' ),
		'Country / time zone: ' . ( $f['country'] ?: '—' ),
		'',
		'Notes:',
		$f['notes'] !== '' ? $f['notes'] : '—',
		'',
		'Sent from: ' . ( $ref ? $ref : home_url( '/team-training/' ) ),
	);
	$body  = implode( "\n", $lines );
	$title = $f['company'] . ' — ' . $cname . ( $f['size'] ? ' — ' . $f['size'] : '' );

	$id = wp_insert_post( array( 'post_type' => 'aa_team_quote', 'post_status' => 'private', 'post_title' => $title, 'post_content' => $body ), true );
	if ( ! is_wp_error( $id ) ) {
		foreach ( $f as $k => $v ) { update_post_meta( $id, '_aa_tq_' . $k, $v ); }
	}

	/* To the team. */
	wp_mail( aa_tq_notify_to(), 'Team quote: ' . $title, $body . "\n\nAll requests: " . admin_url( 'edit.php?post_type=aa_team_quote' ),
		array( 'Reply-To: ' . $f['name'] . ' <' . $f['email'] . '>' ) );

	/* To the requester. Only our own words and our own class name; nothing they typed is echoed back except their first name. */
	$first = preg_split( '/\s+/', $f['name'] );
	wp_mail( $f['email'], 'We received your team training request',
		'Hi ' . $first[0] . ",\n\n"
		. 'Thank you for your request' . ( $f['course'] && $f['course'] !== 'several' ? ' for ' . $cname : '' ) . ". We will reply to this address with a written quote and the dates we can offer.\n\n"
		. "If anything changes in the meantime, reply to this email.\n\n"
		. "John Scott, Agile Agilist\ninfo@agile-agilist.com\n" . home_url( '/' ),
		array( 'Reply-To: Agile Agilist <info@agile-agilist.com>' ) );

	/* To HubSpot, as a lead-form submission. */
	$portal = '46316757'; $hsform = 'c6f0d4c1-d233-4875-9b0c-4528cda02237';
	if ( function_exists( 'aa_ct_settings' ) ) { $s = aa_ct_settings(); if ( ! empty( $s['hs_portal'] ) ) { $portal = $s['hs_portal']; } if ( ! empty( $s['hs_form'] ) ) { $hsform = $s['hs_form']; } }
	$label = 'Team quote: ' . $cname . ' — ' . ( $f['size'] ?: 'size ?' ) . ' — ' . $f['company'] . ( $f['format'] ? ' — ' . $f['format'] : '' ) . ( $f['when'] ? ' — ' . $f['when'] : '' );
	wp_remote_post( 'https://api.hsforms.com/submissions/v3/integration/submit/' . rawurlencode( $portal ) . '/' . rawurlencode( $hsform ), array(
		'timeout' => 8, 'blocking' => false,
		'headers' => array( 'Content-Type' => 'application/json' ),
		'body'    => wp_json_encode( array(
			'fields'  => array( array( 'name' => 'email', 'value' => $f['email'] ) ),
			'context' => array( 'pageUri' => $ref ? esc_url_raw( $ref ) : home_url( '/team-training/' ), 'pageName' => mb_substr( $label, 0, 250 ) ),
		) ),
	) );

	aa_tq_back( array( 'sent' => 1, 'c' => $f['course'], 'n' => $f['size'] ) );
}
add_action( 'admin_post_nopriv_aa_team_quote', 'aa_tq_handle' );
add_action( 'admin_post_aa_team_quote', 'aa_tq_handle' );

/* ---------------------------------------------------------------- form */

add_shortcode( 'aa_team_quote', function () {
	$opt     = aa_tq_options();
	$courses = aa_tq_courses();
	$sel     = function ( $name, $list, $label, $req = false ) {
		$h = '<label class="aa-tq-f"><span>' . esc_html( $label ) . ( $req ? ' <b aria-hidden="true">*</b>' : '' ) . '</span><select name="' . esc_attr( $name ) . '"' . ( $req ? ' required' : '' ) . '><option value="">Choose…</option>';
		foreach ( $list as $v ) { $h .= '<option>' . esc_html( $v ) . '</option>'; }
		return $h . '</select></label>';
	};

	$copt = '<option value="">Choose a class…</option>';
	$grp  = null;
	foreach ( $courses as $slug => $c ) {
		if ( $c[2] !== $grp ) { $copt .= ( $grp !== null ? '</optgroup>' : '' ) . '<optgroup label="' . esc_attr( $c[2] ) . '">'; $grp = $c[2]; }
		$pr    = aa_tq_price( $slug );
		$copt .= '<option value="' . esc_attr( $slug ) . '"' . ( $pr ? ' data-price="' . esc_attr( number_format( $pr ) ) . '"' : '' ) . '>' . esc_html( aa_tq_label( $c ) ) . '</option>';
	}
	$copt .= ( $grp !== null ? '</optgroup>' : '' ) . '<option value="several">Several classes or a full programme</option>';

	$errs = array(
		'fields' => 'Please add your name, a work email and your organization.',
		'busy'   => 'We have received several requests from this connection in the last hour. Please email info@agile-agilist.com instead.',
		'spam'   => 'This request looks automated. Please email info@agile-agilist.com and we will take it from there.',
	);
	$err = isset( $_GET['err'] ) ? sanitize_key( wp_unslash( $_GET['err'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification

	ob_start(); ?>
<div class="aa-tq" id="aa-tq">
	<div class="aa-tq-done" hidden>
		<p class="aa-tq-eye">Request received</p>
		<h3>Thank you. Your quote is on its way.</h3>
		<p>We have emailed you a confirmation. A written quote with the dates we can offer follows from <a href="mailto:info@agile-agilist.com">info@agile-agilist.com</a>.</p>
		<p><a class="aa-tq-btn aa-tq-ghost" href="<?php echo esc_url( home_url( '/training/' ) ); ?>">Back to all classes</a></p>
	</div>
	<form class="aa-tq-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" novalidate>
		<input type="hidden" name="action" value="aa_team_quote">
		<input type="hidden" name="tq_js" value="">
		<div class="aa-tq-hp" aria-hidden="true"><label>Website <input type="text" name="tq_website" tabindex="-1" autocomplete="off"></label></div>
		<?php if ( $err && isset( $errs[ $err ] ) ) : ?><p class="aa-tq-err" role="alert"><?php echo esc_html( $errs[ $err ] ); ?></p><?php endif; ?>
		<div class="aa-tq-grid">
			<label class="aa-tq-f aa-tq-wide"><span>Class <b aria-hidden="true">*</b></span><select name="tq_course" required><?php echo $copt; // phpcs:ignore -- escaped above ?></select><small class="aa-tq-price" aria-live="polite"></small></label>
			<?php echo $sel( 'tq_size', $opt['size'], 'Team size', true ); // phpcs:ignore ?>
			<?php echo $sel( 'tq_format', $opt['format'], 'Format', true ); // phpcs:ignore ?>
			<?php echo $sel( 'tq_where', $opt['where'], 'Delivery' ); // phpcs:ignore ?>
			<?php echo $sel( 'tq_when', $opt['when'], 'When' ); // phpcs:ignore ?>
			<label class="aa-tq-f"><span>Your name <b aria-hidden="true">*</b></span><input type="text" name="tq_name" autocomplete="name" required></label>
			<label class="aa-tq-f"><span>Work email <b aria-hidden="true">*</b></span><input type="email" name="tq_email" autocomplete="email" inputmode="email" required></label>
			<label class="aa-tq-f"><span>Organization <b aria-hidden="true">*</b></span><input type="text" name="tq_company" autocomplete="organization" required></label>
			<label class="aa-tq-f"><span>Phone</span><input type="tel" name="tq_phone" autocomplete="tel" inputmode="tel"></label>
			<label class="aa-tq-f aa-tq-wide"><span>Country and time zone</span><input type="text" name="tq_country" placeholder="e.g. Canada, Eastern time"></label>
			<label class="aa-tq-f aa-tq-wide"><span>Anything we should know</span><textarea name="tq_notes" rows="4" placeholder="Roles on the team, preferred dates, budget process, purchase order…"></textarea></label>
		</div>
		<button type="submit" class="aa-tq-btn">Request my quote <span aria-hidden="true">⟶</span></button>
		<p class="aa-tq-small">We use these details only to prepare your quote. No newsletter unless you ask for one.</p>
	</form>
</div>
<script id="aa-tq-js">(function(){var r=document.getElementById('aa-tq');if(!r)return;var f=r.querySelector('form'),s=f.querySelector('[name=tq_course]'),p=f.querySelector('.aa-tq-price'),q=new URLSearchParams(location.search);
function price(){var o=s.options[s.selectedIndex],v=o&&o.getAttribute('data-price');p.textContent=v?'Public price $'+v+' USD per seat, exam included. Teams of 5+ get group pricing.':'';}
var c=q.get('course');if(c){for(var i=0;i<s.options.length;i++){if(s.options[i].value===c){s.selectedIndex=i;break;}}}price();s.addEventListener('change',price);
if(q.get('sent')){f.hidden=true;r.querySelector('.aa-tq-done').hidden=false;window.dataLayer=window.dataLayer||[];dataLayer.push({event:'team_quote_submitted',aa_course:q.get('c')||'',aa_team_size:q.get('n')||''});}
f.addEventListener('submit',function(e){var bad=null;[].forEach.call(f.querySelectorAll('[required]'),function(x){var ok=x.value.trim()!==''&&(x.type!=='email'||/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.value));x.toggleAttribute('aria-invalid',!ok);if(!ok&&!bad)bad=x;});
if(bad){e.preventDefault();bad.focus();return;}f.querySelector('[name=tq_js]').value='ok';var b=f.querySelector('button');b.disabled=true;b.firstChild.textContent='Sending… ';});})();</script>
	<?php
	return ob_get_clean();
} );

add_action( 'wp_head', function () {
	if ( ! is_singular() || ! has_shortcode( (string) get_post_field( 'post_content', get_queried_object_id() ), 'aa_team_quote' ) ) { return; }
	echo '<style id="aa-tq-css">'
	   . '.aa-tq{--ink:#0B2E35;--teal:#0E8074;--mint:#8FCFCF;--line:#CFE3E1;--mute:#5C7479}'
	   . '.aa-tq-form,.aa-tq-done{background:#fff;border:1px solid var(--line);border-radius:14px;padding:clamp(18px,4vw,30px)}'
	   . '.aa-tq-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px}'
	   . '.aa-tq-wide{grid-column:1/-1}'
	   . '.aa-tq-f{display:flex;flex-direction:column;gap:6px;margin:0;font-size:14px;font-weight:600;color:var(--ink)}'
	   . '.aa-tq-f b{color:var(--teal)}'
	   . '.aa-tq-f input,.aa-tq-f select,.aa-tq-f textarea{width:100%;min-height:48px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;font:inherit;font-size:16px;font-weight:400;color:var(--ink);box-shadow:none}'
	   . '.aa-tq-f textarea{min-height:110px;resize:vertical}'
	   . '.aa-tq-f :focus{outline:2px solid var(--teal);outline-offset:1px;border-color:var(--teal)}'
	   . '.aa-tq-f [aria-invalid]{border-color:#B3261E}'
	   . '.aa-tq-price{font-size:13px;font-weight:400;color:var(--teal);min-height:1em}'
	   . '.aa-tq-btn,.aa-tq-btn:visited{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;margin-top:20px;padding:0 28px;border:0;border-radius:100px;background:var(--teal);color:#fff;font-weight:700;font-size:16px;text-decoration:none;cursor:pointer}'
	   . '.aa-tq-btn:hover{background:var(--ink);color:#fff}.aa-tq-btn[disabled]{opacity:.7}'
	   . '.aa-tq-ghost,.aa-tq-ghost:visited{background:transparent;color:var(--ink);border:1px solid var(--ink)}'
	   . '.aa-tq-small{margin:12px 0 0;font-size:12.5px;color:var(--mute)}'
	   . '.aa-tq-err{margin:0 0 14px;padding:10px 14px;border-radius:10px;background:#FDECEA;color:#8C1D18;font-size:14px}'
	   . '.aa-tq-eye{margin:0;font:600 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--teal)}'
	   . '.aa-tq-done h3{margin:8px 0 10px;font-family:Newsreader,Georgia,serif;font-weight:400;font-size:28px;color:var(--ink)}'
	   . '.aa-tq-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}'
	   . '@media(max-width:640px){.aa-tq-grid{grid-template-columns:1fr}.aa-tq-btn{width:100%}}'
	   . '</style>' . "\n";
}, 30 );

endif;
