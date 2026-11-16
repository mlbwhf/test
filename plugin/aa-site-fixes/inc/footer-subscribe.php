<?php
/**
 * AA — The footer "Subscribe" box subscribes
 *
 * The footer on every page has "Stay sharp · Monthly SAFe + AI-Native
 * insights" with an email box. Its form was method="get" action="/about/#message":
 * pressing Subscribe took the visitor to the About page's message form with
 * their address in the URL, and nothing was recorded as a subscription. On
 * 10 Nov 2026 a paid-search visitor (SPC page) did exactly that and left.
 *
 * Now the box is handled in place, as its own process:
 *   0. When the page loads, the footer <form> is replaced by a plain group of
 *      fields (no <form> element). HubSpot's form tracker only watches forms,
 *      so it can no longer capture the box and re-submit it to /about/, which
 *      is what happened on 16 Nov 2026 (the visitor landed on About, and the
 *      site recorded nothing).
 *   1. The browser posts the address to this plugin (no page change, and the
 *      address is never put in a URL).
 *   2. It is saved on the site (Tools → Newsletter sign-ups, with CSV).
 *   3. (No HubSpot form submission: see aa_sf_sub_to_hubspot.)
 *   4. With the HubSpot private app token (wp-config AA_HUBSPOT_TOKEN or the
 *      aa_hubspot_token option), the contact also gets the property
 *      "Agile Agilist — newsletter" = "Subscribed <date> · <page>", so a
 *      HubSpot list of subscribers is one filter.
 *   5. The visitor sees "Thanks. You're on the list." where the box was.
 *
 * Bots: a hidden field real people never fill, a minimum time on the page,
 * five sign-ups an hour per address of origin. Without JavaScript the form
 * behaves as it did before.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_sub_handle' ) ) :

function aa_sf_sub_token() {
	if ( defined( 'AA_HUBSPOT_TOKEN' ) && AA_HUBSPOT_TOKEN ) { return (string) AA_HUBSPOT_TOKEN; }
	return (string) get_option( 'aa_hubspot_token', '' );
}

function aa_sf_sub_hs( $method, $path, $body = null ) {
	$args = array( 'method' => $method, 'timeout' => 10, 'headers' => array( 'Authorization' => 'Bearer ' . aa_sf_sub_token(), 'Content-Type' => 'application/json' ) );
	if ( $body !== null ) { $args['body'] = wp_json_encode( $body ); }
	$res = wp_remote_request( 'https://api.hubapi.com' . $path, $args );
	if ( is_wp_error( $res ) ) { return 0; }
	return (int) wp_remote_retrieve_response_code( $res );
}

/** After the visitor has their answer: HubSpot form submission, then the contact property. Returns a short status. */
function aa_sf_sub_to_hubspot( $email, $page, $title, $hutk ) {
	/* NO HUBSPOT FORM SUBMISSION. An earlier version also posted each sign-up
	   to a HubSpot form, and the only one wired up was the Mutation Readiness
	   Assessment form, so every sign-up showed up in HubSpot as a Mutation
	   Readiness entry. The sign-up is written straight onto the contact instead:
	   one contact, one property, nothing posing as another form. */
	$out = '';
	if ( aa_sf_sub_token() === '' ) { return 'no HubSpot token'; }
	if ( ! get_transient( 'aa_sf_sub_prop' ) ) {
		$c = aa_sf_sub_hs( 'POST', '/crm/v3/properties/contacts', array( 'name' => 'aa_newsletter', 'label' => 'Agile Agilist — newsletter', 'type' => 'string', 'fieldType' => 'text', 'groupName' => 'contactinformation', 'description' => 'Set when someone subscribes in the website footer: date and the page they were on.' ) );
		if ( $c === 201 || $c === 409 ) { set_transient( 'aa_sf_sub_prop', 1, WEEK_IN_SECONDS ); }
	}
	$props = array( 'aa_newsletter' => 'Subscribed ' . current_time( 'Y-m-d' ) . ' · ' . $page );
	$path  = '/crm/v3/objects/contacts/' . rawurlencode( $email ) . '?idProperty=email';
	$c     = aa_sf_sub_hs( 'PATCH', $path, array( 'properties' => $props ) );
	if ( $c === 404 ) {
		/* New to HubSpot. The account asks for a legal basis on new contacts; a newsletter opt-in is consent. */
		$c = aa_sf_sub_hs( 'POST', '/crm/v3/objects/contacts', array( 'properties' => $props + array( 'email' => $email, 'hs_legal_basis' => 'Freely given consent from contact' ) ) );
		if ( $c === 409 ) { $c = aa_sf_sub_hs( 'PATCH', $path, array( 'properties' => $props ) ); }                               /* the form submission created it first */
		elseif ( $c >= 400 ) { $c = aa_sf_sub_hs( 'POST', '/crm/v3/objects/contacts', array( 'properties' => $props + array( 'email' => $email ) ) ); }
	}
	return 'contact ' . $c;
}

function aa_sf_sub_handle() {
	nocache_headers();
	$email = sanitize_email( (string) ( isset( $_POST['email'] ) ? wp_unslash( $_POST['email'] ) : '' ) );           // phpcs:ignore WordPress.Security.NonceVerification -- public form on cached pages; guarded below
	$page  = '/' . ltrim( (string) wp_parse_url( esc_url_raw( (string) ( isset( $_POST['page'] ) ? wp_unslash( $_POST['page'] ) : '/' ) ), PHP_URL_PATH ), '/' ); // phpcs:ignore
	$title = mb_substr( sanitize_text_field( (string) ( isset( $_POST['title'] ) ? wp_unslash( $_POST['title'] ) : '' ) ), 0, 160 ); // phpcs:ignore
	$lang  = substr( sanitize_key( (string) ( isset( $_POST['lang'] ) ? $_POST['lang'] : '' ) ), 0, 5 );            // phpcs:ignore
	$trap  = (string) ( isset( $_POST['company_site'] ) ? $_POST['company_site'] : '' );                           // phpcs:ignore
	$ms    = (int) ( isset( $_POST['t'] ) ? $_POST['t'] : 0 );                                                      // phpcs:ignore
	$js    = (string) ( isset( $_POST['js'] ) ? $_POST['js'] : '' );                                                // phpcs:ignore

	if ( ! is_email( $email ) ) { wp_send_json( array( 'ok' => false, 'why' => 'email' ), 200 ); }
	/* A bot gets the same answer a person does, and nothing is stored. */
	if ( $trap !== '' || $js !== 'ok' || $ms < 1500 || preg_match( '/@agile-agilist\.com$/i', $email ) ) { wp_send_json( array( 'ok' => true ), 200 ); }

	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	$key = 'aa_sf_sub_rl_' . md5( $ip );
	$n   = (int) get_transient( $key );
	if ( $n >= 5 ) { wp_send_json( array( 'ok' => false, 'why' => 'rate' ), 200 ); }
	set_transient( $key, $n + 1, HOUR_IN_SECONDS );

	$list = get_option( 'aa_sf_subscribers', array() );
	$list = is_array( $list ) ? $list : array();
	$k    = strtolower( $email );
	$row  = array( 't' => current_time( 'mysql' ), 'page' => $page, 'lang' => $lang, 'hs' => 'pending' );
	if ( isset( $list[ $k ]['nl'] ) ) { $row['nl'] = $list[ $k ]['nl']; }   /* the last newsletter issue this address got; a new sign-up also clears an earlier unsubscribe */
	unset( $list[ $k ] );
	$list = array( $k => $row ) + $list;
	update_option( 'aa_sf_subscribers', array_slice( $list, 0, 5000, true ), false );

	/* Answer the visitor now; HubSpot can take a second or two. */
	ignore_user_abort( true );
	if ( ! headers_sent() ) { header( 'Content-Type: application/json; charset=utf-8' ); }
	echo wp_json_encode( array( 'ok' => true ) );
	if ( function_exists( 'fastcgi_finish_request' ) ) { fastcgi_finish_request(); }
	elseif ( function_exists( 'litespeed_finish_request' ) ) { litespeed_finish_request(); }
	else { while ( ob_get_level() ) { ob_end_flush(); } flush(); }

	$hutk   = (string) ( isset( $_COOKIE['hubspotutk'] ) ? $_COOKIE['hubspotutk'] : '' );
	$status = aa_sf_sub_to_hubspot( $email, $page, $title, $hutk );
	$list   = get_option( 'aa_sf_subscribers', array() );
	if ( is_array( $list ) && isset( $list[ $k ] ) ) { $list[ $k ]['hs'] = $status; update_option( 'aa_sf_subscribers', $list, false ); }
	exit;
}
add_action( 'wp_ajax_aa_sf_subscribe', 'aa_sf_sub_handle' );
add_action( 'wp_ajax_nopriv_aa_sf_subscribe', 'aa_sf_sub_handle' );

/* Front end. */
add_action( 'wp_footer', function () {
	if ( is_admin() ) { return; }
	?>
<script id="aa-sf-subscribe">(function(){
/* The footer box is turned into a plain group of fields (no <form>), so
   HubSpot's form tracker has nothing to capture and re-submit to /about/.
   Without JavaScript the original form stays and behaves as before. */
var URL=<?php echo wp_json_encode( admin_url( 'admin-ajax.php' ) ); ?>,T0=Date.now(),L=(document.documentElement.lang||'en').slice(0,2).toLowerCase();
var M={en:['Thanks. You’re on the list.','Please enter a valid email address.','That didn’t go through. Please try again, or email info@agile-agilist.com.'],
fr:['Merci. Vous êtes inscrit.','Veuillez saisir une adresse courriel valide.','L’envoi a échoué. Réessayez, ou écrivez à info@agile-agilist.com.'],
es:['Gracias. Ya estás en la lista.','Introduce un correo electrónico válido.','No se pudo enviar. Inténtalo de nuevo o escribe a info@agile-agilist.com.']};
var S=M[L]||M.en,OK=L==='ar'?'✓':S[0];
function isNews(f){if(!f||f.tagName!=='FORM')return false;if(f.classList.contains('aa-foot-news-form'))return true;
  return /\/about\/#message$/.test(f.getAttribute('action')||'')&&!!f.querySelector('input[type=email]')&&f.querySelectorAll('input:not([type=hidden]),textarea,select').length===1}
function note(w,t,bad){var p=w.querySelector('.aa-sf-sub-msg');if(!p){p=document.createElement('p');p.className='aa-sf-sub-msg';p.setAttribute('role','status');p.setAttribute('aria-live','polite');w.appendChild(p)}p.textContent=t;p.classList.toggle('is-bad',!!bad)}
function send(w){if(w.__aaBusy)return;var e=w.querySelector('input[type=email]'),b=w.querySelector('button'),v=String(e.value||'').trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v)){note(w,S[1],1);try{e.focus()}catch(x){}return}
  w.__aaBusy=1;if(b)b.disabled=true;
  var d=new FormData();d.append('action','aa_sf_subscribe');d.append('email',v);d.append('page',location.pathname);d.append('title',document.title);d.append('lang',L);d.append('t',String(Date.now()-T0));d.append('js','ok');
  var h=w.querySelector('.aa-sf-sub-trap');d.append('company_site',h?h.value:'');
  fetch(URL,{method:'POST',body:d,credentials:'same-origin'}).then(function(r){return r.json()}).then(function(j){
    if(j&&j.ok){w.innerHTML='';var p=document.createElement('p');p.className='aa-sf-sub-msg is-ok';p.setAttribute('role','status');p.textContent=OK;w.appendChild(p);
      try{(window.dataLayer=window.dataLayer||[]).push({event:'newsletter_subscribed',page_path:location.pathname})}catch(x){}}
    else{w.__aaBusy=0;if(b)b.disabled=false;note(w,j&&j.why==='email'?S[1]:S[2],1)}
  }).catch(function(){w.__aaBusy=0;if(b)b.disabled=false;note(w,S[2],1)});
}
function swap(f){if(f.__aaSwapped)return;f.__aaSwapped=1;
  var old=f.querySelector('input[type=email]'),ob=f.querySelector('button,[type=submit]'),w=document.createElement('div');
  w.className=f.className+' aa-sf-sub';w.setAttribute('role','group');w.setAttribute('aria-label','Newsletter sign-up');
  var e=document.createElement('input');e.type='email';e.autocomplete='email';e.inputMode='email';e.required=true;e.placeholder=old&&old.placeholder||'your@workemail.com';e.setAttribute('aria-label','Email address');if(old&&old.className)e.className=old.className;if(old&&old.value)e.value=old.value;
  var h=document.createElement('input');h.type='text';h.className='aa-sf-sub-trap';h.tabIndex=-1;h.autocomplete='off';h.setAttribute('aria-hidden','true');h.style.cssText='position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
  var b=document.createElement('button');b.type='button';b.textContent=ob?ob.textContent:'Subscribe →';if(ob&&ob.className)b.className=ob.className;
  w.appendChild(e);w.appendChild(h);w.appendChild(b);
  b.addEventListener('click',function(){send(w)});
  e.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();send(w)}});
  f.parentNode.replaceChild(w,f);
}
function all(){[].forEach.call(document.querySelectorAll('form'),function(f){if(isNews(f))swap(f)})}
all();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',all);
/* Belt and braces: if a form is still there (added later), never let it leave the page. */
document.addEventListener('submit',function(ev){var f=ev.target;if(!isNews(f))return;ev.preventDefault();ev.stopImmediatePropagation();swap(f)},true);
})();</script>
<style id="aa-sf-subscribe-css">.aa-sf-sub-msg{margin:6px 0 0;font-size:13.5px;line-height:1.45;color:#8FCFCF}.aa-sf-sub-msg.is-ok{font-size:15px;font-weight:600;color:#fff}.aa-sf-sub-msg.is-bad{color:#F2B66D}</style>
	<?php
}, 98 );

/* Tools → Newsletter sign-ups. */
add_action( 'admin_menu', function () {
	add_management_page( 'Newsletter sign-ups', 'Newsletter sign-ups', 'manage_options', 'aa-sf-subscribers', function () {
		$list = get_option( 'aa_sf_subscribers', array() ); $list = is_array( $list ) ? $list : array();
		echo '<div class="wrap"><h1>Newsletter sign-ups</h1><p>' . count( $list ) . ' address(es) from the footer Subscribe box, newest first. Each is also sent to HubSpot. '
		   . '<a class="button" href="' . esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=aa_sf_sub_csv' ), 'aa_sf_sub_csv' ) ) . '">Download CSV</a></p>'
		   . '<table class="widefat striped"><thead><tr><th>Email</th><th>When</th><th>Page</th><th>HubSpot</th></tr></thead><tbody>';
		foreach ( array_slice( $list, 0, 300, true ) as $email => $r ) {
			echo '<tr><td>' . esc_html( $email ) . '</td><td>' . esc_html( isset( $r['t'] ) ? $r['t'] : '' ) . '</td><td>' . esc_html( isset( $r['page'] ) ? $r['page'] : '' ) . '</td><td>' . esc_html( isset( $r['hs'] ) ? $r['hs'] : '' ) . '</td></tr>';
		}
		if ( ! $list ) { echo '<tr><td colspan="4">None yet.</td></tr>'; }
		echo '</tbody></table></div>';
	} );
} );
add_action( 'admin_post_aa_sf_sub_csv', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); }
	check_admin_referer( 'aa_sf_sub_csv' );
	$list = get_option( 'aa_sf_subscribers', array() ); $list = is_array( $list ) ? $list : array();
	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="newsletter-signups-' . gmdate( 'Y-m-d' ) . '.csv"' );
	$o = fopen( 'php://output', 'w' );
	fputcsv( $o, array( 'email', 'when', 'page', 'language', 'hubspot' ) );
	foreach ( $list as $email => $r ) {
		$safe = preg_match( '/^[=+\-@\t\r]/', $email ) ? "'" . $email : $email;   /* no spreadsheet formulas */
		fputcsv( $o, array( $safe, isset( $r['t'] ) ? $r['t'] : '', isset( $r['page'] ) ? $r['page'] : '', isset( $r['lang'] ) ? $r['lang'] : '', isset( $r['hs'] ) ? $r['hs'] : '' ) );
	}
	fclose( $o );
	exit;
} );

endif;
