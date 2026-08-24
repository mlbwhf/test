<?php
/**
 * Agile Agilist — MINI CALENDAR  [aa_mini_calendar]
 * -----------------------------------------------------------------------------
 * Replaces [easy_event_calendar_mini]. Same footprint — a compact month grid
 * with prev/next — but driven by the site's OWN schedule and registration:
 *
 *     post type  wp_events  ·  taxonomy event_category  ·  meta start_ts/end_ts
 *
 * and each class is drawn as a STRIPE spanning its days (a 4-day SPC covers
 * four cells as one continuous band), instead of the old plugin's single-day
 * Eventbrite dots. Clicking a stripe goes to the site's own registration —
 * #enroll on the page it sits on by default, or the course page when the
 * calendar is embedded elsewhere.
 *
 * USE — drop-in for the old shortcode, same attribute name:
 *     [aa_mini_calendar category="aspc"]          one course (course pages)
 *     [aa_mini_calendar]                          every course (training page)
 *     [aa_mini_calendar category="aspc,spc"]      a chosen set
 *     [aa_mini_calendar link="course"]            stripes link to course pages
 *     [aa_mini_calendar lang="es"]                Spanish chrome (also: fr)
 *     [aa_mini_calendar months="6"]               lookahead window (default 6)
 *
 * INSTALL: WPCode -> PHP Snippet -> Auto Insert, Run Everywhere. Then swap
 * [easy_event_calendar_mini ...] for [aa_mini_calendar ...] wherever it
 * appears. The Xylus plugin can be deactivated once no page still uses it.
 *
 * The events query is cached the same way as [aa_home_cohorts]: per-request
 * memo + 10-minute transient keyed by the Eastern day.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Course palette + destinations. Falls back to the term slug uppercased. */
function aa_mcal_catalog() {
	return array(
		'aspc' => array( 'code' => 'ASPC', 'color' => '#0B2E35', 'url' => '/training/adv-safe/aspc/' ),
		'spc'  => array( 'code' => 'SPC',  'color' => '#127E88', 'url' => '/training/adv-safe/spc/' ),
		'rte'  => array( 'code' => 'RTE',  'color' => '#3E7CB1', 'url' => '/training/adv-safe/rte/' ),
		'lpm'  => array( 'code' => 'LPM',  'color' => '#D9A93E', 'url' => '/training/adv-safe/lpm/' ),
		'apm'  => array( 'code' => 'APM',  'color' => '#8E5BA6', 'url' => '/training/adv-safe/apm/' ),
		'popm' => array( 'code' => 'POPM', 'color' => '#C2571B', 'url' => '/training/safe/popm/' ),
		'ssm'  => array( 'code' => 'SSM',  'color' => '#4E8F5B', 'url' => '/training/safe/scrum-master/' ),
		'sa'   => array( 'code' => 'SA',   'color' => '#B04A5A', 'url' => '/training/safe/sa/' ),
		'asm'  => array( 'code' => 'SASM', 'color' => '#5A6ACF', 'url' => '/training/safe/asm/' ),
		'sdp'  => array( 'code' => 'SDP',  'color' => '#3B8EA5', 'url' => '/training/safe/devops/' ),
		'arch' => array( 'code' => 'ARCH', 'color' => '#7A6C5D', 'url' => '/training/safe-industry/arch/' ),
		'ase'  => array( 'code' => 'ASE',  'color' => '#2F6B4F', 'url' => '/training/safe-industry/ase/' ),
	);
}

/** Chrome strings — month/day names never go through the server locale. */
function aa_mcal_strings( $lang ) {
	$all = array(
		'en' => array(
			'months' => array( 'January','February','March','April','May','June','July','August','September','October','November','December' ),
			'dow'    => array( 'S','M','T','W','T','F','S' ),
			'empty'  => 'No classes this month',
			'prev'   => 'Previous month', 'next' => 'Next month',
			'reg'    => 'Register',
		),
		'es' => array(
			'months' => array( 'Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre' ),
			'dow'    => array( 'D','L','M','X','J','V','S' ),
			'empty'  => 'Sin clases este mes',
			'prev'   => 'Mes anterior', 'next' => 'Mes siguiente',
			'reg'    => 'Inscríbete',
		),
		'fr' => array(
			'months' => array( 'Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre' ),
			'dow'    => array( 'D','L','M','M','J','V','S' ),
			'empty'  => 'Pas de classe ce mois-ci',
			'prev'   => 'Mois précédent', 'next' => 'Mois suivant',
			'reg'    => 'S\'inscrire',
		),
	);
	return isset( $all[ $lang ] ) ? $all[ $lang ] : $all['en'];
}

/**
 * Upcoming events for the requested categories, as plain rows:
 * {s:"Y-m-d", e:"Y-m-d", c:"slug", id:int}. Cached like aa_home_cohort_rows.
 */
function aa_mcal_events( $cats, $months, &$dbg ) {
	static $memo = array();
	$tz    = new DateTimeZone( 'America/New_York' );
	$from  = new DateTime( 'first day of this month', $tz );
	$from->setTime( 0, 0, 0 );
	$to    = ( clone $from )->modify( '+' . max( 1, (int) $months ) . ' months' );
	$key   = 'aa_mcal_' . md5( implode( ',', $cats ) . '|' . $months . '|' . $from->format( 'Ymd' ) );
	if ( isset( $memo[ $key ] ) ) { return $memo[ $key ]; }
	$cached = get_transient( $key );
	if ( is_array( $cached ) ) { $dbg[] = '(transient cache)'; return $memo[ $key ] = $cached; }

	$tax = array( 'taxonomy' => 'event_category', 'field' => 'slug', 'terms' => null );
	$q   = array(
		'post_type'      => 'wp_events',
		'post_status'    => 'publish',
		'posts_per_page' => 200,
		'no_found_rows'  => true,
		'meta_key'       => 'start_ts',
		'orderby'        => 'meta_value_num',
		'order'          => 'ASC',
		'meta_query'     => array( array(
			'key' => 'start_ts', 'compare' => 'BETWEEN', 'type' => 'NUMERIC',
			'value' => array( $from->getTimestamp(), $to->getTimestamp() ),
		) ),
	);
	if ( $cats ) {
		$tax['terms']   = $cats;
		$q['tax_query'] = array( $tax );
	}

	$rows = array();
	foreach ( get_posts( $q ) as $p ) {
		$start = (int) get_post_meta( $p->ID, 'start_ts', true );
		$end   = (int) get_post_meta( $p->ID, 'end_ts', true );
		if ( ! $start ) { continue; }
		$terms = get_the_terms( $p->ID, 'event_category' );
		$slug  = ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->slug : '';
		if ( $cats && ! in_array( $slug, $cats, true ) ) {
			// first term wasn't the requested one — find the one that is
			foreach ( (array) $terms as $t ) {
				if ( in_array( $t->slug, $cats, true ) ) { $slug = $t->slug; break; }
			}
		}
		$s = ( new DateTime( '@' . $start ) )->setTimezone( $tz );
		$e = $end ? ( new DateTime( '@' . $end ) )->setTimezone( $tz ) : $s;
		if ( $e < $s ) { $e = $s; }
		$rows[] = array( 's' => $s->format( 'Y-m-d' ), 'e' => $e->format( 'Y-m-d' ),
		                 'c' => $slug, 'id' => $p->ID );
		$dbg[]  = $slug . ' ' . $s->format( 'Y-m-d' ) . '..' . $e->format( 'Y-m-d' );
	}
	set_transient( $key, $rows, 10 * MINUTE_IN_SECONDS );
	return $memo[ $key ] = $rows;
}

add_shortcode( 'aa_mini_calendar', function ( $atts ) {
	static $instance = 0, $assets_done = false;
	$instance++;

	$a = shortcode_atts( array(
		'category' => '',            // "" = all courses
		'months'   => 6,
		'link'     => 'enroll',      // enroll | course
		'lang'     => 'en',
		'debug'    => '',
	), $atts, 'aa_mini_calendar' );

	$lang = in_array( $a['lang'], array( 'es', 'fr' ), true ) ? $a['lang'] : 'en';
	$str  = aa_mcal_strings( $lang );
	$cats = array_filter( array_map( 'trim', explode( ',', strtolower( $a['category'] ) ) ) );
	$dbg  = array();
	$rows = aa_mcal_events( $cats, (int) $a['months'], $dbg );

	$catalog = aa_mcal_catalog();
	$meta    = array();   // slug => {code,color,url} for the JS
	foreach ( $rows as $r ) {
		$slug = $r['c'];
		if ( isset( $meta[ $slug ] ) ) { continue; }
		$meta[ $slug ] = isset( $catalog[ $slug ] )
			? $catalog[ $slug ]
			: array( 'code' => strtoupper( $slug ), 'color' => '#127E88', 'url' => '/training/' );
		if ( $a['link'] === 'enroll' ) { $meta[ $slug ]['url'] = '#enroll'; }
	}

	$payload = wp_json_encode( array(
		'events' => $rows, 'courses' => $meta, 'lang' => $lang,
		'months' => (int) $a['months'], 'str' => $str,
	) );

	$id   = 'aa-mcal-' . $instance;
	$html = '<div class="aa-mcal" id="' . esc_attr( $id ) . '">'
	      . '<script type="application/json">' . $payload . '</script>'
	      . '<noscript>';
	// crawlers and no-JS get a plain dated list — same data, real links
	foreach ( array_slice( $rows, 0, 8 ) as $r ) {
		$m    = $meta[ $r['c'] ];
		$html .= '<a href="' . esc_url( $m['url'] . ( $m['url'][0] !== '#' ? '?cohort=' . (int) $r['id'] : '' ) ) . '">'
		       . esc_html( $m['code'] . ' · ' . $r['s'] ) . '</a><br>';
	}
	$html .= '</noscript></div>';

	if ( $assets_done ) { return $html; }
	$assets_done = true;

	$html .= <<<'AA_MCAL_ASSETS'
<style>
.aa-mcal{max-width:340px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  border:1px solid #C7DEDE;border-radius:6px;background:#fff;overflow:hidden}
.aa-mcal *{box-sizing:border-box}
.aa-mcal-head{display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:10px 12px;border-bottom:1px solid #DCEAEA}
.aa-mcal-title{font-family:ui-monospace,Menlo,monospace;font-size:11px;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;color:#127E88}
.aa-mcal-nav{display:flex;gap:4px}
.aa-mcal-nav button{width:30px;height:30px;border:1px solid #C7DEDE;border-radius:3px;background:#fff;
  color:#127E88;font-size:15px;line-height:1;cursor:pointer}
.aa-mcal-nav button:hover{border-color:#127E88;background:#F1F8F8}
.aa-mcal-nav button:disabled{opacity:.3;cursor:default}
.aa-mcal-grid{display:grid;grid-template-columns:repeat(7,1fr);padding:8px 8px 4px;gap:0 2px}
.aa-mcal-dow{font-family:ui-monospace,Menlo,monospace;font-size:9.5px;letter-spacing:.06em;
  text-transform:uppercase;color:#88A0A4;text-align:center;padding:4px 0}
.aa-mcal-cell{min-height:44px;padding:3px 0 2px;text-align:center;position:relative}
.aa-mcal-day{font-size:12px;color:#3C565E;line-height:1.4}
.aa-mcal-cell.is-out .aa-mcal-day{color:#C7D5D5}
.aa-mcal-cell.is-today .aa-mcal-day{font-weight:700;color:#0B2E35;text-decoration:underline;text-underline-offset:3px}
.aa-mcal-lanes{display:flex;flex-direction:column;gap:2px;margin-top:2px}
.aa-mcal-band{display:block;height:7px;background:var(--c,#127E88);opacity:.92}
.aa-mcal-band:hover{opacity:1}
.aa-mcal-band.is-start{border-radius:99px 0 0 99px;margin-left:3px}
.aa-mcal-band.is-end{border-radius:0 99px 99px 0;margin-right:3px}
.aa-mcal-band.is-start.is-end{border-radius:99px;margin:0 3px}
.aa-mcal-band.is-pad{visibility:hidden}
.aa-mcal-empty{padding:18px 12px;text-align:center;font-size:12.5px;color:#88A0A4}
.aa-mcal-legend{display:flex;flex-wrap:wrap;gap:6px 12px;padding:8px 12px 10px;border-top:1px solid #EEF5F5}
.aa-mcal-key{display:inline-flex;align-items:center;gap:6px;font-family:ui-monospace,Menlo,monospace;
  font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#5E7378;text-decoration:none}
.aa-mcal-key:hover{color:#127E88}
.aa-mcal-key i{width:14px;height:7px;border-radius:99px;background:var(--c,#127E88)}
@media(prefers-reduced-motion:no-preference){.aa-mcal-band{transition:opacity .15s}}
</style>
<script>
(function(){
'use strict';
function build(root){
  var cfg; try{ cfg = JSON.parse(root.querySelector('script[type="application/json"]').textContent); }catch(e){ return; }
  var S = cfg.str, ev = cfg.events.map(function(r){
    return { s:parse(r.s), e:parse(r.e), c:r.c, id:r.id };
  });
  var now = new Date(); now.setHours(0,0,0,0);
  var view = new Date(now.getFullYear(), now.getMonth(), 1);
  var last = new Date(now.getFullYear(), now.getMonth()+cfg.months-1, 1);
  function parse(s){ var p=s.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
  function href(m, id){ return m.url + (m.url.charAt(0)==='#' ? '' : '?cohort='+id); }
  function render(){
    var y=view.getFullYear(), mo=view.getMonth();
    var first=new Date(y,mo,1), days=new Date(y,mo+1,0).getDate(), lead=first.getDay();
    var inMonth = ev.filter(function(v){ return v.s<=new Date(y,mo,days) && v.e>=first; });
    // lane assignment: first free lane whose events don't overlap this one
    var lanes=[]; inMonth.forEach(function(v){
      for(var L=0;;L++){ lanes[L]=lanes[L]||[];
        if(lanes[L].every(function(o){ return v.s>o.e || v.e<o.s; })){ lanes[L].push(v); v.lane=L; break; } }
    });
    var nLanes=Math.min(lanes.length,3);
    var h='<div class="aa-mcal-head"><div class="aa-mcal-title">'+S.months[mo]+' '+y+'</div>'
      +'<div class="aa-mcal-nav"><button type="button" data-nav="-1" aria-label="'+S.prev+'"'+(view<=now?' disabled':'')+'>&lsaquo;</button>'
      +'<button type="button" data-nav="1" aria-label="'+S.next+'"'+(view>=last?' disabled':'')+'>&rsaquo;</button></div></div>'
      +'<div class="aa-mcal-grid">';
    S.dow.forEach(function(d){ h+='<div class="aa-mcal-dow">'+d+'</div>'; });
    for(var i=0;i<lead;i++){ h+='<div class="aa-mcal-cell is-out"></div>'; }
    for(var d=1;d<=days;d++){
      var date=new Date(y,mo,d);
      h+='<div class="aa-mcal-cell'+(+date===+now?' is-today':'')+'"><span class="aa-mcal-day">'+d+'</span>';
      if(nLanes){ h+='<span class="aa-mcal-lanes">';
        for(var L=0;L<nLanes;L++){
          var v=(lanes[L]||[]).filter(function(o){ return date>=o.s && date<=o.e; })[0];
          if(!v){ h+='<span class="aa-mcal-band is-pad"></span>'; continue; }
          var m=cfg.courses[v.c]||{code:v.c,color:'#127E88',url:'#enroll'};
          var isS=+date===+v.s, isE=+date===+v.e;
          h+='<a class="aa-mcal-band'+(isS?' is-start':'')+(isE?' is-end':'')+'" style="--c:'+m.color+'"'
            +' href="'+href(m,v.id)+'"'
            +(isS?' aria-label="'+m.code+' · '+S.reg+'" title="'+m.code+'"':' aria-hidden="true" tabindex="-1"')+'></a>';
        }
        h+='</span>'; }
      h+='</div>';
    }
    h+='</div>';
    if(!inMonth.length){ h+='<div class="aa-mcal-empty">'+S.empty+'</div>'; }
    var seen={}; var legend='';
    inMonth.forEach(function(v){ if(seen[v.c])return; seen[v.c]=1;
      var m=cfg.courses[v.c]||{code:v.c,color:'#127E88',url:'#enroll'};
      legend+='<a class="aa-mcal-key" style="--c:'+m.color+'" href="'+href(m,v.id)+'"><i></i>'+m.code+'</a>'; });
    if(legend){ h+='<div class="aa-mcal-legend">'+legend+'</div>'; }
    root.querySelectorAll('.aa-mcal-head,.aa-mcal-grid,.aa-mcal-empty,.aa-mcal-legend').forEach(function(n){ n.remove(); });
    root.insertAdjacentHTML('beforeend', h);
  }
  root.addEventListener('click', function(e){
    var b=e.target.closest('[data-nav]'); if(!b||b.disabled)return;
    view=new Date(view.getFullYear(), view.getMonth()+ +b.getAttribute('data-nav'), 1); render();
  });
  render();
}
function init(){ document.querySelectorAll('.aa-mcal').forEach(build); }
if(document.readyState!=='loading'){ init(); } else { document.addEventListener('DOMContentLoaded', init); }
})();
</script>
AA_MCAL_ASSETS;

	if ( $a['debug'] && current_user_can( 'manage_options' ) ) {
		$html .= '<pre style="font-size:11px;white-space:pre-wrap">' . esc_html( "aa_mini_calendar\n" . implode( "\n", $dbg ) ) . '</pre>';
	}
	return $html;
} );
