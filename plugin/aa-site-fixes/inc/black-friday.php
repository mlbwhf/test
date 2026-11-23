<?php
/**
 * AA — Black Friday 2026: 15% off every class, 23–30 November (ET)
 *
 * The PRICE is not here. It lives in the registration snippet (WPCode "AA –
 * Register PHP", aa_reg_sale_config() / aa_reg_sale_apply()), at the one point
 * every price is resolved, so the cards, the hero, the calendar and the Stripe
 * amount all drop together and the checkout code is untouched.
 *
 * This file is the campaign around it:
 *   - a top banner on English pages: a teaser until the 23rd, then a countdown,
 *     gone after the 30th (the script re-checks the clock, so a cached page
 *     cannot advertise a sale that is over);
 *   - [aa_black_friday] for the /black-friday/ page: every priced class with
 *     the crossed-out list price, the sale price and the next dates;
 *   - two emails to the newsletter list (launch on the 23rd, last chance on
 *     the 30th, 10:00 ET), sent only after approval, with a preview to info@;
 *   - a LiteSpeed purge at the start and the end of the sale.
 *
 * SAFETY: nothing here claims a live discount unless aa_reg_sale_apply()
 * exists, i.e. the snippet carrying the sale price is the one running. If it
 * is not, the banner and the emails hold back and an admin notice says why.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_bf_cfg' ) ) :

function aa_sf_bf_cfg() {
	$d = array( 'name' => 'Black Friday', 'pct' => 15, 'from' => '2026-11-18 00:00:00', 'to' => '2026-11-30 23:59:59', 'tz' => 'America/New_York' );
	return function_exists( 'aa_reg_sale_config' ) ? array_merge( $d, (array) aa_reg_sale_config() ) : $d;
}
function aa_sf_bf_ready() { return function_exists( 'aa_reg_sale_apply' ) && function_exists( 'aa_reg_sale_pct' ); }
function aa_sf_bf_ts( $which ) { $c = aa_sf_bf_cfg(); return ( new DateTime( $c[ $which ], new DateTimeZone( $c['tz'] ) ) )->getTimestamp(); }
/** 'teaser' before the window, 'live' inside it, 'over' after. */
function aa_sf_bf_phase( $now = null ) {
	$t = $now === null ? time() : (int) $now;
	if ( $t < aa_sf_bf_ts( 'from' ) ) { return 'teaser'; }
	return $t <= aa_sf_bf_ts( 'to' ) ? 'live' : 'over';
}
function aa_sf_bf_amount( $list ) {
	$c = aa_sf_bf_cfg();
	return function_exists( 'aa_reg_sale_amount' ) ? aa_reg_sale_amount( $list, $c['pct'] ) : (int) floor( $list * ( 100 - $c['pct'] ) / 100 );
}
function aa_sf_bf_is_en() { return ! function_exists( 'aa_reg_lang' ) || aa_reg_lang() === 'en'; }

/** Every priced class with upcoming dates: list price, sale price, next dates. */
function aa_sf_bf_rows() {
	if ( ! function_exists( 'aa_reg_courses' ) || ! function_exists( 'aa_reg_course' ) || ! function_exists( 'aa_reg_upcoming' ) ) { return array(); }
	$rows = array();
	foreach ( array_keys( aa_reg_courses() ) as $slug ) {
		$c = aa_reg_course( $slug );
		if ( ! $c || empty( $c['price'] ) ) { continue; }
		$up = aa_reg_upcoming( $slug, $c );
		if ( ! $up ) { continue; }
		$list = (int) ( isset( $c['price_was'] ) ? $c['price_was'] : $c['price'] );
		$rows[] = array(
			'slug' => $slug, 'code' => isset( $c['code'] ) ? $c['code'] : '', 'name' => $c['name'],
			'days' => (int) $c['days'], 'track' => ! empty( $c['crumb'] ) ? $c['crumb'] : 'Training',
			'url' => home_url( $c['url'] ), 'cur' => isset( $c['currency'] ) ? $c['currency'] : 'usd',
			/* A class with its own lower price (Leading the AI-Native Organization,
			   1500 to 1250) shows what the checkout charges, not 15% off its list. */
			'list' => $list, 'sale' => min( aa_sf_bf_amount( $list ), (int) $c['price'] ), 'dates' => array_slice( $up, 0, 3 ),
		);
	}
	$order = array( 'AI-Native' => 0, 'Core SAFe Roles' => 1, 'SAFe by Role' => 1, 'Advanced SAFe' => 2 );
	usort( $rows, function ( $a, $b ) use ( $order ) {
		$x = isset( $order[ $a['track'] ] ) ? $order[ $a['track'] ] : 9; $y = isset( $order[ $b['track'] ] ) ? $order[ $b['track'] ] : 9;
		return $x === $y ? $a['list'] - $b['list'] : $x - $y;
	} );
	return $rows;
}
function aa_sf_bf_money( $n, $cur = 'usd' ) {
	if ( function_exists( 'aa_reg_money' ) ) { return aa_reg_money( $n, $cur ); }
	return '$' . number_format( (float) $n );
}
function aa_sf_bf_range( $c ) { return function_exists( 'aa_reg_range' ) ? aa_reg_range( $c['start'], $c['end'], true ) : $c['start']; }
function aa_sf_bf_window_label() {
	$c = aa_sf_bf_cfg(); $f = new DateTime( $c['from'] ); $t = new DateTime( $c['to'] );
	return $f->format( 'j' ) . '–' . $t->format( 'j F Y' );
}

/* ------------------------------------------------------------------ banner */

add_action( 'wp_body_open', function () {
	if ( is_admin() || ! aa_sf_bf_is_en() ) { return; }
	$ph = aa_sf_bf_phase();
	if ( $ph === 'over' || ( $ph === 'live' && ! aa_sf_bf_ready() ) ) { return; }
	$c    = aa_sf_bf_cfg();
	$page = home_url( '/black-friday/' );
	$from = gmdate( 'c', aa_sf_bf_ts( 'from' ) ); $to = gmdate( 'c', aa_sf_bf_ts( 'to' ) );
	echo '<div class="aa-bf-bar" data-bf-from="' . esc_attr( $from ) . '" data-bf-to="' . esc_attr( $to ) . '" data-phase="' . esc_attr( $ph ) . '" role="region" aria-label="Black Friday offer">'
	   . '<div class="aa-bf-bar__in">'
	   . '<span class="aa-bf-bar__tag">' . esc_html( $c['name'] ) . '</span>'
	   . '<span class="aa-bf-bar__msg aa-bf-t">' . esc_html( (int) $c['pct'] . '% off every class, ' . aa_sf_bf_window_label() . '. Starts soon.' ) . '</span>'
	   . '<span class="aa-bf-bar__msg aa-bf-l">' . esc_html( (int) $c['pct'] . '% off every class, applied automatically' ) . ' <span class="aa-bf-bar__left">· ends in <b data-bf-count></b></span></span>'
	   . '<a class="aa-bf-bar__cta" href="' . esc_url( $page ) . '"><span class="aa-bf-t">See the offer</span><span class="aa-bf-l">Shop the sale</span> <span aria-hidden="true">&#10230;</span></a>'
	   . '<button type="button" class="aa-bf-bar__x" aria-label="Close">&times;</button></div></div>'
	   . '<style id="aa-bf-css">.aa-bf-bar{background:#0B2E35;color:#fff;font:600 14px/1.4 Arial,Helvetica,sans-serif;position:relative;z-index:99}'
	   . '.aa-bf-bar__in{max-width:1200px;margin:0 auto;padding:9px 48px 9px 16px;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:center;text-align:center}'
	   . '.aa-bf-bar__tag{background:#F2B66D;color:#0B2E35;border-radius:100px;padding:2px 10px;font-size:12px;letter-spacing:.06em;text-transform:uppercase}'
	   . '.aa-bf-bar__left b{color:#F2B66D;font-variant-numeric:tabular-nums}'
	   . '.aa-bf-bar__cta{color:#8FCFCF;text-decoration:none;white-space:nowrap}.aa-bf-bar__cta:hover{color:#fff;text-decoration:underline}'
	   . '.aa-bf-bar__x{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;color:#B9DCDC;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px}'
	   . '.aa-bf-bar[data-phase="teaser"] .aa-bf-l,.aa-bf-bar[data-phase="live"] .aa-bf-t{display:none}'
	   . '@media (max-width:600px){.aa-bf-bar{font-size:13px}.aa-bf-bar__in{padding:8px 40px 8px 12px}}</style>'
	   . '<script>(function(){var b=document.querySelector(".aa-bf-bar");if(!b)return;'
	   . 'try{if(sessionStorage.getItem("aaBfX"))return b.remove();}catch(e){}'
	   . 'var f=Date.parse(b.dataset.bfFrom),t=Date.parse(b.dataset.bfTo),o=b.querySelector("[data-bf-count]");'
	   . 'function tick(){var n=Date.now();if(n>t){b.remove();return;}b.dataset.phase=n>=f?"live":"teaser";'
	   . 'if(n>=f&&o){var s=Math.floor((t-n)/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);o.textContent=(d?d+"d ":"")+h+"h "+m+"m";}}'
	   . 'tick();setInterval(tick,30000);b.querySelector(".aa-bf-bar__x").addEventListener("click",function(){try{sessionStorage.setItem("aaBfX",1);}catch(e){}b.remove();});})();</script>';
}, 5 );

/* LiteSpeed: purge everything when the sale starts and when it ends, so no
   cached page shows a price the checkout will not charge. */
add_action( 'init', function () {
	foreach ( array( 'from' => 5, 'to' => 1 ) as $w => $pad ) {
		$ts = aa_sf_bf_ts( $w ) + $pad;
		if ( $ts > time() && ! wp_next_scheduled( 'aa_sf_bf_purge', array( $w ) ) ) { wp_schedule_single_event( $ts, 'aa_sf_bf_purge', array( $w ) ); }
	}
	if ( ! wp_next_scheduled( 'aa_sf_bf_tick' ) ) { wp_schedule_event( time() + 120, 'hourly', 'aa_sf_bf_tick' ); }
} );
add_action( 'aa_sf_bf_purge', function () { do_action( 'litespeed_purge_all' ); } );

/* -------------------------------------------------------------- offer page */

function aa_sf_bf_shortcode() {
	$c  = aa_sf_bf_cfg();
	$ph = aa_sf_bf_phase();
	$pct = (int) $c['pct'];
	$css = '<style id="aa-bf-page">.aabf{--ink:#0B2E35;--teal:#0E8074;--mint:#8FCFCF;--warm:#F2B66D;color:var(--ink);font-family:inherit}'
	     . '.aabf-hero{background:var(--ink);color:#fff;border-radius:22px;padding:clamp(24px,5vw,56px);margin:0 0 28px}'
	     . '.aabf-k{display:inline-block;background:var(--warm);color:var(--ink);border-radius:100px;padding:3px 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 14px}'
	     . '.aabf-hero h1{color:#fff;font-size:clamp(34px,6vw,64px);line-height:1.02;margin:0 0 14px}.aabf-hero h1 em{color:var(--warm);font-style:italic}'
	     . '.aabf-hero p{color:#D6ECEB;font-size:17px;line-height:1.6;max-width:720px;margin:0 0 10px}.aabf-when{color:var(--mint)!important;font-weight:700}'
	     . '.aabf-track{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--teal);margin:28px 0 12px}'
	     . '.aabf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}'
	     . '.aabf-card{border:1.5px solid #DCEAE8;border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:8px;background:#fff}'
	     . '.aabf-code{align-self:flex-start;background:#EAF5F3;border-radius:100px;padding:2px 9px;font-size:11px;font-weight:700;letter-spacing:.06em}'
	     . '.aabf-card h3{font-size:17px;line-height:1.3;margin:0}.aabf-card h3 a{color:inherit;text-decoration:none}'
	     . '.aabf-price{font-size:26px;font-weight:700;margin:2px 0 0}.aabf-price s{font-size:16px;font-weight:400;color:#6B8286;margin-right:6px}'
	     . '.aabf-off{display:inline-block;margin-left:6px;font-size:12px;background:var(--warm);border-radius:100px;padding:2px 8px;vertical-align:middle}'
	     . '.aabf-meta{font-size:13.5px;color:#5C7479;margin:0}.aabf-dates{font-size:13.5px;margin:0}'
	     . '.aabf-btn{margin-top:auto;display:block;text-align:center;border-radius:100px;padding:11px 16px;background:var(--ink);color:#fff!important;text-decoration:none;font-weight:700}.aabf-btn:hover{background:var(--teal)}'
	     . '.aabf-note{font-size:13px;color:#5C7479;margin:26px 0 0;line-height:1.6}</style>';

	if ( $ph === 'over' ) {
		return $css . '<div class="aabf"><div class="aabf-hero"><span class="aabf-k">' . esc_html( $c['name'] ) . '</span><h1>The sale has ended.</h1>'
		     . '<p>Thank you to everyone who booked. Every class is back at its regular price — see the <a style="color:#8FCFCF" href="' . esc_url( home_url( '/training/' ) ) . '">full calendar</a>.</p></div></div>';
	}
	$rows = aa_sf_bf_rows();
	$h  = $css . '<div class="aabf"><div class="aabf-hero"><span class="aabf-k">' . esc_html( $c['name'] . ' · ' . aa_sf_bf_window_label() ) . '</span>'
	    . '<h1>' . $pct . '% off <em>every class.</em></h1>'
	    . '<p>Every public class on the calendar, any upcoming date — including the holiday-week classes between Christmas and New Year. Live online, instructor-led, exam fee included.</p>'
	    . '<p>' . esc_html( $ph === 'live' ? 'The discount is already in the prices below and is applied automatically at checkout. No code needed.' : 'Prices drop automatically when the sale starts. No code needed.' ) . '</p>'
	    . '<p class="aabf-when">' . esc_html( $ph === 'live' ? 'Ends Monday 30 November, 11:59 pm ET.' : 'Runs until Monday 30 November, 11:59 pm ET.' ) . '</p></div>';

	$track = '';
	foreach ( $rows as $r ) {
		if ( $r['track'] !== $track ) {
			$h .= ( $track !== '' ? '</div>' : '' ) . '<h2 class="aabf-track">' . esc_html( $r['track'] ) . '</h2><div class="aabf-grid">';
			$track = $r['track'];
		}
		$dates = implode( ' · ', array_map( 'aa_sf_bf_range', $r['dates'] ) );
		$h .= '<article class="aabf-card">' . ( $r['code'] !== '' ? '<span class="aabf-code">' . esc_html( $r['code'] ) . '</span>' : '' )
		    . '<h3><a href="' . esc_url( $r['url'] ) . '">' . esc_html( $r['name'] ) . '</a></h3>'
		    . '<p class="aabf-meta">' . (int) $r['days'] . ' ' . ( $r['days'] === 1 ? 'day' : 'days' ) . ' · live online · exam included</p>'
		    . '<p class="aabf-price"><s>' . esc_html( aa_sf_bf_money( $r['list'], $r['cur'] ) ) . '</s>' . esc_html( aa_sf_bf_money( $r['sale'], $r['cur'] ) ) . '<span class="aabf-off">−' . ( $r['list'] > 0 ? max( (int) $pct, (int) round( ( $r['list'] - $r['sale'] ) * 100 / $r['list'] ) ) : (int) $pct ) . '%</span></p>'
		    . '<p class="aabf-dates"><strong>Next:</strong> ' . esc_html( $dates ) . '</p>'
		    . '<a class="aabf-btn" href="' . esc_url( $r['url'] . '#enroll' ) . '">' . ( $ph === 'live' ? 'Book at ' . esc_html( aa_sf_bf_money( $r['sale'], $r['cur'] ) ) : 'See the dates' ) . ' &#10230;</a></article>';
	}
	if ( $track !== '' ) { $h .= '</div>'; }
	$h .= '<p class="aabf-note">' . esc_html( $pct . '% off the listed price of public classes booked and paid online between 18 November 2026, 12:00 am and 30 November 2026, 11:59 pm Eastern Time, for any upcoming class date. Not combined with other discounts: if you already have an agreed price, you pay whichever is lower. Team and private training is quoted separately.' ) . ' <a href="' . esc_url( home_url( '/team-training/' ) ) . '">Ask for a team quote</a>.</p></div>';
	return $h;
}
add_shortcode( 'aa_black_friday', 'aa_sf_bf_shortcode' );

/* ------------------------------------------------------------------ emails */

function aa_sf_bf_settings() {
	$s = get_option( 'aa_sf_bf', array() );
	return array_merge( array( 'approved' => 0, 'done' => array(), 'cancel' => 0 ), is_array( $s ) ? $s : array() );
}
function aa_sf_bf_set( $k, $v ) { $s = aa_sf_bf_settings(); $s[ $k ] = $v; update_option( 'aa_sf_bf', $s, false ); }
/** The two sends, site-independent: 10:00 ET on the first and last day. */
function aa_sf_bf_sends() {
	$c = aa_sf_bf_cfg(); $tz = new DateTimeZone( $c['tz'] );
	$f = new DateTime( $c['from'], $tz ); $t = new DateTime( $c['to'], $tz );
	return array(
		'launch' => ( clone $f )->setTime( 10, 0 )->getTimestamp(),
		'last'   => ( clone $t )->setTime( 10, 0 )->getTimestamp(),
	);
}

function aa_sf_bf_email( $kind, $email, $preview = false ) {
	$c    = aa_sf_bf_cfg(); $pct = (int) $c['pct'];
	$rows = aa_sf_bf_rows();
	if ( ! $rows ) { return null; }
	$F    = 'font-family:Arial,Helvetica,sans-serif;';
	$SER  = 'font-family:Georgia,\'Times New Roman\',serif;';
	$utm  = function ( $u ) use ( $kind ) { return add_query_arg( array( 'utm_source' => 'newsletter', 'utm_medium' => 'email', 'utm_campaign' => 'black-friday-2026-' . $kind ), $u ); };
	$page = $utm( home_url( '/black-friday/' ) );
	$btn  = function ( $url, $label, $bg, $fg ) use ( $F ) {
		return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;margin:0 8px 8px 0;"><tr><td bgcolor="' . $bg . '" style="background-color:' . $bg . ';border-radius:100px;">'
		     . '<a href="' . esc_url( $url ) . '" style="display:inline-block;' . $F . 'font-size:16px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:100px;background-color:' . $bg . ';color:' . $fg . ';">' . $label . '</a></td></tr></table>';
	};
	$last = $kind === 'last';
	$subj = $last ? 'Last day: ' . $pct . '% off every class ends tonight' : $c['name'] . ': ' . $pct . '% off every class, until 30 November';
	$pre  = $last ? 'The ' . $c['name'] . ' prices end at 11:59 pm ET tonight.' : 'Every public class, any upcoming date, ' . $pct . '% off. Applied automatically at checkout.';

	$b = '';
	if ( $preview ) {
		$b .= '<tr><td bgcolor="#FFF6E6" style="padding:14px 24px;background-color:#FFF6E6;border-bottom:1px solid #F2B66D;' . $F . 'font-size:14px;line-height:1.5;color:#0B2E35;"><strong>Preview.</strong> '
		    . esc_html( $last ? 'The last-chance email, as subscribers get it on Monday 30 November at 10:00 am ET.' : 'The launch email, as subscribers get it.' )
		    . ' It goes to ' . count( function_exists( 'aa_sf_nl_recipients' ) ? aa_sf_nl_recipients() : array() ) . ' newsletter subscriber(s) only after you approve it in Tools → Black Friday. Prices below are the sale prices.</td></tr>';
	}
	$b .= '<tr><td bgcolor="#0B2E35" style="padding:22px 28px 0;background-color:#0B2E35;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="' . $SER . 'font-size:22px;color:#FFFFFF;">Agile Agilist</td>'
	    . '<td align="right" style="' . $F . 'font-size:12px;color:#B9DCDC;">SAFe® Platinum Partner</td></tr></table></td></tr>';
	$b .= '<tr><td bgcolor="#0B2E35" style="padding:30px 28px 34px;background-color:#0B2E35;">'
	    . '<span style="display:inline-block;padding:3px 12px;border-radius:100px;background-color:#F2B66D;border:1px solid #F2B66D;' . $F . 'font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#0B2E35;">' . esc_html( $last ? 'Last day' : $c['name'] ) . '</span>'
	    . '<h1 style="margin:16px 0 12px;' . $SER . 'font-weight:400;font-size:46px;line-height:1.02;color:#FFFFFF;">' . $pct . '% off <em style="font-style:italic;color:#F2B66D;">every class.</em></h1>'
	    . '<p style="margin:0 0 10px;' . $F . 'font-size:16px;line-height:1.6;color:#D6ECEB;">' . esc_html( $last
	        ? 'Tonight at 11:59 pm Eastern the ' . $c['name'] . ' prices end. Any public class, any upcoming date, ' . $pct . '% off, applied automatically at checkout.'
	        : 'From today until Monday 30 November, every public class on our calendar is ' . $pct . '% off, for any upcoming date, including the holiday-week classes between Christmas and New Year. The discount is already in the price. No code needed.' ) . '</p>'
	    . '<p style="margin:0 0 20px;' . $F . 'font-size:14px;color:#8FCFCF;font-weight:700;">Live online · instructor-led · exam fee included</p>'
	    . $btn( $page, 'See every class on sale ⟶', '#F2B66D', '#0B2E35' ) . '</td></tr>';

	/* A short list: two per track, cheapest first, then the link to the rest. */
	$pick = array(); $per = array();
	foreach ( $rows as $r ) { if ( ! isset( $per[ $r['track'] ] ) ) { $per[ $r['track'] ] = 0; } if ( $per[ $r['track'] ] < 2 ) { $pick[] = $r; $per[ $r['track'] ]++; } }
	$list = '';
	foreach ( $pick as $r ) {
		$d = $r['dates'] ? aa_sf_bf_range( $r['dates'][0] ) : '';
		$list .= '<tr><td style="padding:14px 0;border-bottom:1px solid #DCEAE8;"><a href="' . esc_url( $utm( $r['url'] ) . '#enroll' ) . '" style="' . $F . 'font-size:15.5px;font-weight:700;color:#0B2E35;text-decoration:none;">' . esc_html( $r['name'] ) . ' ⟶</a>'
		       . '<div style="' . $F . 'font-size:13.5px;color:#5C7479;margin-top:3px;">' . esc_html( $r['track'] . ' · ' . $r['days'] . ( $r['days'] === 1 ? ' day' : ' days' ) . ( $d !== '' ? ' · next ' . $d : '' ) ) . '</div></td>'
		       . '<td align="right" style="padding:14px 0 14px 12px;border-bottom:1px solid #DCEAE8;white-space:nowrap;vertical-align:top;">'
		       . '<div style="' . $F . 'font-size:13px;color:#6B8286;text-decoration:line-through;">' . esc_html( aa_sf_bf_money( $r['list'], $r['cur'] ) ) . '</div>'
		       . '<div style="' . $F . 'font-size:18px;font-weight:700;color:#0E8074;">' . esc_html( aa_sf_bf_money( $r['sale'], $r['cur'] ) ) . '</div></td></tr>';
	}
	$b .= '<tr><td style="padding:26px 28px 6px;"><div style="margin:0 0 6px;' . $F . 'font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#0E8074;">A few of the classes on sale</div>'
	    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #DCEAE8;">' . $list . '</table>'
	    . '<p style="margin:12px 0 0;' . $F . 'font-size:14px;"><a href="' . esc_url( $page ) . '" style="color:#0E8074;font-weight:700;">All ' . count( $rows ) . ' classes with their sale prices ⟶</a></p></td></tr>';
	$b .= '<tr><td style="padding:18px 28px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFF6E6" style="background-color:#FFF6E6;border:1px solid #F2B66D;border-radius:10px;"><tr><td style="padding:14px 16px;' . $F . 'font-size:14px;line-height:1.5;color:#0B2E35;">'
	    . '<strong>Holiday week:</strong> two-day classes start every day from Dec 26 to Dec 30, and three-day classes on Dec 26, 28 and 29, so you can certify without taking leave. Book them now at the ' . esc_html( $c['name'] ) . ' price.</td></tr></table></td></tr>';
	$b .= '<tr><td style="padding:18px 28px 24px;"><p style="margin:0 0 6px;' . $F . 'font-size:14px;line-height:1.55;color:#35555B;">Training a team? Team and private classes are quoted separately. <a href="' . esc_url( $utm( home_url( '/team-training/' ) ) ) . '" style="color:#0E8074;font-weight:700;">Request a quote ⟶</a></p>'
	    . '<p style="margin:16px 0 0;' . $F . 'font-size:15px;color:#0B2E35;">John Scott, Agile Agilist<br><span style="font-size:13.5px;color:#5C7479;">Reply to this email and it reaches us at info@agile-agilist.com.</span></p></td></tr>';
	$unsub = function_exists( 'aa_sf_nl_unsub_link' ) ? aa_sf_nl_unsub_link( $email ) : home_url( '/' );
	$addr  = function_exists( 'aa_ag_address_line' ) ? aa_ag_address_line() : '55 Village Centre Place, Mississauga, ON L4Z 1V9, Canada';
	$b .= '<tr><td style="padding:16px 28px 22px;border-top:1px solid #DCEAE8;' . $F . 'font-size:12px;line-height:1.6;color:#6B8286;">' . esc_html( $pct . '% off the listed price of public classes booked and paid online 18–30 November 2026 (ET). Not combined with other discounts.' ) . '<br>'
	    . 'Agile Agilist · ' . esc_html( $addr ) . '<br>You are receiving this because you subscribed at agile-agilist.com. <a href="' . esc_url( $unsub ) . '" style="color:#6B8286;text-decoration:underline;">Unsubscribe</a>.</td></tr>';

	$html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . esc_html( $subj ) . '</title></head>'
	      . '<body style="margin:0;padding:0;background:#EEF4F3;"><div style="display:none;max-height:0;overflow:hidden;color:#EEF4F3;">' . esc_html( $pre ) . '</div>'
	      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF4F3;"><tr><td align="center" style="padding:20px 10px;">'
	      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;border-radius:14px;overflow:hidden;">' . $b . '</table></td></tr></table></body></html>';
	if ( function_exists( 'aa_sf_nl_harden' ) ) { $html = aa_sf_nl_harden( $html ); }
	return array( 'subject' => ( $preview ? '[Preview] ' : '' ) . $subj, 'html' => $html );
}

function aa_sf_bf_tick() {
	$s = aa_sf_bf_settings();
	if ( ! $s['approved'] || $s['cancel'] || ! aa_sf_bf_ready() || ! function_exists( 'aa_sf_nl_recipients' ) ) { return; }
	$now = time();
	foreach ( aa_sf_bf_sends() as $kind => $at ) {
		if ( ! empty( $s['done'][ $kind ] ) || $now < $at || $now > aa_sf_bf_ts( 'to' ) ) { continue; }
		$list = get_option( 'aa_sf_subscribers', array() ); $list = is_array( $list ) ? $list : array();
		$sent = 0; $left = 0;
		foreach ( aa_sf_nl_recipients() as $email => $r ) {
			if ( ! empty( $r['bf'][ $kind ] ) ) { continue; }
			if ( $sent >= 40 ) { $left++; continue; }
			$mail = aa_sf_bf_email( $kind, $email );
			if ( ! $mail ) { return; }
			$list[ $email ]['bf'][ $kind ] = current_time( 'mysql' );          /* marked first: a crash cannot send twice */
			update_option( 'aa_sf_subscribers', $list, false );
			if ( aa_sf_nl_mail( $email, $mail, aa_sf_nl_unsub_link( $email ) ) ) { $sent++; }
		}
		if ( $left ) { if ( ! wp_next_scheduled( 'aa_sf_bf_tick_more' ) ) { wp_schedule_single_event( time() + 180, 'aa_sf_bf_tick_more' ); } return; }
		$done = $s['done']; $done[ $kind ] = current_time( 'mysql' ) . ' · ' . $sent . ' sent'; aa_sf_bf_set( 'done', $done );
		return;   /* one send per tick */
	}
}
add_action( 'aa_sf_bf_tick', 'aa_sf_bf_tick' );
add_action( 'aa_sf_bf_tick_more', 'aa_sf_bf_tick' );

/* ------------------------------------------------- Tools → Black Friday */

add_action( 'admin_menu', function () {
	add_management_page( 'Black Friday', 'Black Friday', 'manage_options', 'aa-sf-bf', 'aa_sf_bf_admin' );
} );
add_action( 'admin_post_aa_sf_bf', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'aa_sf_bf' ) ) { wp_die( 'Not allowed.' ); }
	$do = isset( $_POST['do'] ) ? sanitize_key( $_POST['do'] ) : '';
	$msg = '';
	if ( $do === 'approve' ) { aa_sf_bf_set( 'approved', 1 ); aa_sf_bf_set( 'cancel', 0 ); $msg = 'approved'; }
	if ( $do === 'cancel' )  { aa_sf_bf_set( 'cancel', 1 ); $msg = 'cancelled'; }
	if ( $do === 'preview_launch' || $do === 'preview_last' ) {
		$m = aa_sf_bf_email( $do === 'preview_last' ? 'last' : 'launch', 'info@agile-agilist.com', true );
		$msg = ( $m && function_exists( 'aa_sf_nl_mail' ) && aa_sf_nl_mail( 'info@agile-agilist.com', $m ) ) ? 'preview' : 'preview_failed';
	}
	wp_safe_redirect( admin_url( 'tools.php?page=aa-sf-bf&m=' . $msg ) ); exit;
} );
function aa_sf_bf_admin() {
	$s = aa_sf_bf_settings(); $c = aa_sf_bf_cfg(); $n = function_exists( 'aa_sf_nl_recipients' ) ? count( aa_sf_nl_recipients() ) : 0;
	$tz = new DateTimeZone( $c['tz'] );
	$m  = isset( $_GET['m'] ) ? sanitize_key( $_GET['m'] ) : '';   // phpcs:ignore WordPress.Security.NonceVerification
	$form = function ( $do, $label, $primary = false ) {
		return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="display:inline-block;margin:0 8px 8px 0">' . wp_nonce_field( 'aa_sf_bf', '_wpnonce', true, false )
		     . '<input type="hidden" name="action" value="aa_sf_bf"><input type="hidden" name="do" value="' . esc_attr( $do ) . '"><button class="button' . ( $primary ? ' button-primary' : '' ) . '">' . esc_html( $label ) . '</button></form>';
	};
	echo '<div class="wrap"><h1>Black Friday</h1>';
	if ( $m ) { echo '<div class="notice notice-success"><p>' . esc_html( array( 'approved' => 'Approved. Both emails will go out at their times.', 'cancelled' => 'Cancelled. No Black Friday email will be sent.', 'preview' => 'Preview sent to info@agile-agilist.com.', 'preview_failed' => 'The preview could not be sent.' )[ $m ] ?? '' ) . '</p></div>'; }
	if ( ! aa_sf_bf_ready() ) { echo '<div class="notice notice-error"><p><strong>The sale price is not running yet.</strong> Open WPCode → "AA – Register PHP" and click Update. Until then the banner, the offer page prices and the emails hold back.</p></div>'; }
	echo '<p><strong>Sale:</strong> ' . (int) $c['pct'] . '% off every class, ' . esc_html( $c['from'] . ' to ' . $c['to'] . ' (' . $c['tz'] . ')' ) . '. Now: <strong>' . esc_html( aa_sf_bf_phase() ) . '</strong>.</p>';
	echo '<p><strong>Offer page:</strong> <a href="' . esc_url( home_url( '/black-friday/' ) ) . '">' . esc_html( home_url( '/black-friday/' ) ) . '</a> (shortcode <code>[aa_black_friday]</code>).</p>';
	echo '<p><strong>Emails</strong> to ' . (int) $n . ' newsletter subscriber(s):</p><ul style="list-style:disc;margin-left:20px">';
	foreach ( aa_sf_bf_sends() as $k => $at ) {
		$d = ( new DateTime( '@' . $at ) )->setTimezone( $tz )->format( 'D j M, g:i a T' );
		echo '<li>' . esc_html( ( $k === 'launch' ? 'Launch' : 'Last chance' ) . ' — ' . $d . ' — ' . ( ! empty( $s['done'][ $k ] ) ? 'sent ' . $s['done'][ $k ] : ( $s['cancel'] ? 'cancelled' : ( $s['approved'] ? 'scheduled' : 'waiting for approval' ) ) ) ) . '</li>';
	}
	echo '</ul>' . $form( 'preview_launch', 'Send launch preview to info@' ) . $form( 'preview_last', 'Send last-chance preview to info@' );
	echo '<br>' . ( $s['approved'] && ! $s['cancel'] ? $form( 'cancel', 'Cancel the emails' ) : $form( 'approve', 'Approve both emails', true ) ) . '</div>';
}

add_action( 'admin_notices', function () {
	if ( ! current_user_can( 'manage_options' ) || aa_sf_bf_ready() || aa_sf_bf_phase() === 'over' ) { return; }
	echo '<div class="notice notice-warning"><p><strong>Black Friday:</strong> the sale price is in WPCode → "AA – Register PHP". Click Update on that snippet so it runs, or prices will not drop on 23 November. <a href="' . esc_url( admin_url( 'tools.php?page=aa-sf-bf' ) ) . '">Black Friday settings</a></p></div>';
} );

endif;
