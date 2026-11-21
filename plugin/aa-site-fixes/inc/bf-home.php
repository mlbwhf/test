<?php
/**
 * AA — Black Friday on the home page
 *
 * The sale showed on the home page only as the thin bar at the very top, which
 * a visitor can close and most never read. This adds a section right under
 * the hero while the sale is live: the offer in one line, a countdown to the
 * end, four classes with the list price crossed out against the sale price and
 * the next date, and one button to every class on sale.
 *
 * Prices and dates come from the same course records the checkout reads
 * (aa_sf_bf_rows), so the figure here is the figure charged. The section
 * prints only while the sale is live and the sale code is running, on the
 * English home page; when the countdown reaches zero it removes itself, and
 * the cache purge already scheduled for the end of the sale clears it for
 * everyone. Nothing is stored in the page: the home page content is untouched.
 *
 * Edit aa_sf_bfh_featured() to change which four classes are shown.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_bfh_featured' ) ) :

function aa_sf_bfh_featured() {
	return apply_filters( 'aa_sf_bfh_featured', array( 'sa', 'launching-ai-native-arts', 'rte', 'spc' ) );
}

function aa_sf_bfh_short( $name ) {
	$name = preg_replace( '/\s+Certification$/u', '', (string) $name );
	$name = preg_replace( '/\s+with SPC$/u', '', $name );
	return trim( $name );
}

function aa_sf_bfh_html() {
	if ( ! function_exists( 'aa_sf_bf_phase' ) || aa_sf_bf_phase() !== 'live' || ! aa_sf_bf_ready() || ! aa_sf_bf_is_en() ) { return ''; }
	$all = aa_sf_bf_rows();
	if ( ! $all ) { return ''; }
	$by = array();
	foreach ( $all as $r ) { $by[ $r['slug'] ] = $r; }
	$rows = array();
	foreach ( aa_sf_bfh_featured() as $slug ) { if ( isset( $by[ $slug ] ) ) { $rows[] = $by[ $slug ]; } }
	foreach ( $all as $r ) { if ( count( $rows ) >= 4 ) { break; } if ( ! in_array( $r, $rows, true ) ) { $rows[] = $r; } }
	$rows = array_slice( $rows, 0, 4 );

	$c    = aa_sf_bf_cfg();
	$pct  = (int) $c['pct'];
	$to   = gmdate( 'c', aa_sf_bf_ts( 'to' ) );
	$end  = ( new DateTime( $c['to'], new DateTimeZone( $c['tz'] ) ) )->format( 'l j F' );
	$page = home_url( '/black-friday/' );

	$cards = '';
	foreach ( $rows as $r ) {
		$d      = $r['dates'] ? $r['dates'][0] : null;
		$cards .= '<li><a class="aa-bfh__card" href="' . esc_url( $r['url'] ) . '" data-bfh="' . esc_attr( $r['slug'] ) . '">'
		        . '<span class="aa-bfh__code">' . esc_html( $r['code'] !== '' ? $r['code'] : $r['track'] ) . ' · ' . esc_html( $r['days'] === 1 ? '1 day' : $r['days'] . ' days' ) . '</span>'
		        . '<span class="aa-bfh__name">' . esc_html( aa_sf_bfh_short( $r['name'] ) ) . '</span>'
		        . '<span class="aa-bfh__price"><s>' . esc_html( aa_sf_bf_money( $r['list'], $r['cur'] ) ) . '</s> <b>' . esc_html( aa_sf_bf_money( $r['sale'], $r['cur'] ) ) . '</b></span>'
		        . ( $d ? '<span class="aa-bfh__next">Next · <time datetime="' . esc_attr( $d['start'] ) . '">' . esc_html( aa_sf_bf_range( $d ) ) . '</time> <span aria-hidden="true">&#10230;</span></span>' : '' )
		        . '</a></li>';
	}

	return '<section class="aa-bfh" id="black-friday" aria-labelledby="aa-bfh-h" data-to="' . esc_attr( $to ) . '">'
	     . '<style>'
	     . '.aa-bfh{position:relative;overflow:hidden;margin:0;padding:clamp(34px,5vw,60px) clamp(16px,4vw,48px);background:#0B2E35;color:#E4F1F1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5}'
	     . '.aa-bfh *{box-sizing:border-box}'
	     . '.aa-bfh:before{content:"";position:absolute;right:-140px;top:-180px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(242,182,109,.20),transparent 62%);pointer-events:none}'
	     . '.aa-bfh__in{position:relative;max-width:1240px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(24px,4vw,56px);align-items:center}'
	     . '.aa-bfh__tag{display:inline-flex;align-items:center;gap:8px;margin:0;padding:5px 12px;border-radius:999px;background:#F2B66D;color:#0B2E35;font:700 12px/1.3 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase}'
	     . '.aa-bfh h2{margin:16px 0 0;font-family:"Newsreader",Georgia,"Times New Roman",serif;font-weight:400;font-size:clamp(38px,6vw,72px);line-height:.98;letter-spacing:-.03em;color:#fff}'
	     . '.aa-bfh h2 em{font-style:italic;color:#F2B66D}'
	     . '.aa-bfh__lede{margin:14px 0 0;max-width:520px;font-size:clamp(16px,1.6vw,18px);color:#B9DCDC}'
	     . '.aa-bfh__count{display:flex;gap:8px;margin:22px 0 0;padding:0;list-style:none}'
	     . '.aa-bfh__count li{min-width:68px;padding:10px 8px 8px;border:1px solid rgba(143,207,207,.35);border-radius:6px;background:rgba(255,255,255,.04);text-align:center}'
	     . '.aa-bfh__count b{display:block;font-family:"Newsreader",Georgia,serif;font-weight:400;font-size:32px;line-height:1;color:#fff;font-variant-numeric:tabular-nums}'
	     . '.aa-bfh__count span{display:block;margin-top:4px;font:600 10px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:#8FCFCF}'
	     . '.aa-bfh__ends{margin:10px 0 0;font-size:13px;color:#8FCFCF}'
	     . '.aa-bfh__ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}'
	     . '.aa-bfh__btn{display:inline-block;min-height:48px;padding:14px 22px;border-radius:2px;background:#F2B66D;color:#0B2E35!important;font-weight:700;font-size:15px;text-decoration:none!important}'
	     . '.aa-bfh__btn:hover{background:#fff}'
	     . '.aa-bfh__btn--ghost{background:transparent;color:#fff!important;border:1px solid rgba(255,255,255,.45)}'
	     . '.aa-bfh__btn--ghost:hover{background:rgba(255,255,255,.1)}'
	     . '.aa-bfh__cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0;padding:0;list-style:none}'
	     . '.aa-bfh__card{display:flex;flex-direction:column;gap:6px;height:100%;padding:18px;border-radius:10px;background:#fff;color:#0B2E35!important;text-decoration:none!important;border-top:4px solid #F2B66D;transition:transform .18s ease,box-shadow .18s ease}'
	     . '.aa-bfh__card:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(0,0,0,.28)}'
	     . '.aa-bfh__code{font:600 11px/1.3 ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:#0E8074}'
	     . '.aa-bfh__name{font-family:"Newsreader",Georgia,serif;font-size:21px;line-height:1.2;color:#0B2E35}'
	     . '.aa-bfh__price{margin-top:auto;padding-top:8px;font-size:15px;color:#5E7378}'
	     . '.aa-bfh__price b{font-size:24px;font-weight:700;color:#0B2E35}'
	     . '.aa-bfh__next{font-size:13.5px;font-weight:600;color:#0E8074}'
	     . '.aa-bfh__fine{position:relative;max-width:1240px;margin:20px auto 0;font-size:12.5px;color:#7CA3A3}'
	     . '@media (max-width:900px){.aa-bfh__in{grid-template-columns:1fr}}'
	     . '@media (max-width:520px){.aa-bfh__cards{grid-template-columns:1fr;gap:8px}.aa-bfh__card{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:14px;border-top:0;border-left:4px solid #F2B66D}.aa-bfh__code,.aa-bfh__name,.aa-bfh__next{grid-column:1}.aa-bfh__name{font-size:18px}.aa-bfh__price{grid-column:2;grid-row:1/4;align-self:center;margin:0;padding:0;text-align:right}.aa-bfh__price s{display:block;font-size:13px}.aa-bfh__price b{font-size:21px}.aa-bfh__count li{flex:1;min-width:0}.aa-bfh__btn{flex:1 1 100%;text-align:center}}'
	     . '@media (prefers-reduced-motion:reduce){.aa-bfh__card{transition:none}.aa-bfh__card:hover{transform:none}}'
	     . '</style>'
	     . '<div class="aa-bfh__in">'
	     . '<div>'
	     . '<p class="aa-bfh__tag">' . esc_html( $c['name'] ) . ' · ' . esc_html( aa_sf_bf_window_label() ) . '</p>'
	     . '<h2 id="aa-bfh-h">' . $pct . '% off <em>every class.</em></h2>'
	     . '<p class="aa-bfh__lede">Any upcoming date, including the holiday-week classes. The discount is already in the price at checkout. No code needed.</p>'
	     . '<ul class="aa-bfh__count" aria-label="Time left in the sale" hidden>'
	     . '<li><b data-u="d">0</b><span>days</span></li><li><b data-u="h">00</b><span>hours</span></li><li><b data-u="m">00</b><span>min</span></li><li><b data-u="s">00</b><span>sec</span></li></ul>'
	     . '<p class="aa-bfh__ends">Ends ' . esc_html( $end ) . ', midnight Eastern.</p>'
	     . '<div class="aa-bfh__ctas"><a class="aa-bfh__btn" href="' . esc_url( $page ) . '" data-bfh="all">See every class on sale &#10230;</a>'
	     . '<a class="aa-bfh__btn aa-bfh__btn--ghost" href="' . esc_url( home_url( '/team-training/' ) ) . '" data-bfh="team">Training a team?</a></div>'
	     . '</div>'
	     . '<ul class="aa-bfh__cards">' . $cards . '</ul>'
	     . '</div>'
	     . '<p class="aa-bfh__fine">' . $pct . '% off the listed price of public classes booked and paid online during the sale. Not combined with other discounts.</p>'
	     . '<script>(function(){var s=document.getElementById("black-friday");if(!s)return;var to=Date.parse(s.getAttribute("data-to")),c=s.querySelector(".aa-bfh__count");'
	     . 'function p(n){return(n<10?"0":"")+n}function t(){var x=Math.floor((to-Date.now())/1e3);if(x<=0){s.remove();return false}'
	     . 'c.querySelector("[data-u=d]").textContent=Math.floor(x/86400);c.querySelector("[data-u=h]").textContent=p(Math.floor(x%86400/3600));c.querySelector("[data-u=m]").textContent=p(Math.floor(x%3600/60));c.querySelector("[data-u=s]").textContent=p(x%60);return true}'
	     . 'if(t()){c.hidden=false;var i=setInterval(function(){if(!t())clearInterval(i)},1000)}'
	     . 's.addEventListener("click",function(e){var a=e.target&&e.target.closest?e.target.closest("a[data-bfh]"):null;if(!a)return;try{(window.dataLayer=window.dataLayer||[]).push({event:"bf_home_click",aa_target:a.getAttribute("data-bfh")})}catch(x){}})})();</script>'
	     . '</section>';
}

/* Under the hero, before the in-page menu. */
add_filter( 'the_content', function ( $html ) {
	if ( is_admin() || ! is_string( $html ) || ! is_front_page() || strpos( $html, 'class="aa-hero"' ) === false || strpos( $html, 'class="aa-bfh"' ) !== false ) { return $html; }
	$band = aa_sf_bfh_html();
	if ( $band === '' ) { return $html; }
	$out = preg_replace( '~(<section class="aa-hero".*?</section>)~s', '$1' . str_replace( array( '\\', '$' ), array( '\\\\', '\\$' ), $band ), $html, 1 );
	return is_string( $out ) ? $out : $html;
}, 20 );

endif;
