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
 *     [aa_mini_calendar wide="1"]                 full-width — replaces the
 *                                                 big [easy_events_calendar]
 *                                                 on the training pages
 *
 * INSTALL: WPCode -> PHP Snippet -> Auto Insert, Run Everywhere. That is
 * ALL: this snippet also takes over the old [easy_events_calendar] and
 * [easy_event_calendar_mini] shortcodes (see the bottom of the file), so
 * every page that embeds them switches to this calendar with no page edits.
 * Deactivating the snippet hands them straight back to the Xylus plugin.
 *
 * The takeover keeps each page's own category= list, so the hub calendars
 * stay scoped to their track: /training/adv-safe/ shows only the five
 * advanced courses, /training/safe/ only the seven role courses. Two pages
 * carry no calendar at all — see aa_mcal_hidden_slugs() at the bottom.
 *
 * The events query is cached the same way as [aa_home_cohorts]: per-request
 * memo + 10-minute transient keyed by the Eastern day.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Course palette + destinations, keyed by event_category slug.
 *
 * The keys are the term slugs the pages actually pass to the calendar
 * shortcode, not the course-page slugs — those differ (event "sasm" lives at
 * /training/safe/asm/, event "sp" at /training/safe-industry/team-practitioner/).
 * "asm" is kept as an alias because older embeds pass that spelling.
 *
 * An unlisted slug still renders: it falls back to the slug uppercased, the
 * house teal, and /training/. The two SAFe-for-Hardware terms (shwa, shwp) are
 * deliberately absent — the term slugs do not map unambiguously onto the two
 * hardware course pages, and the page that used them no longer shows a
 * calendar. Add them here if that changes.
 */
function aa_mcal_catalog() {
	return array(
		// Advanced track — /training/adv-safe/
		'aspc' => array( 'code' => 'ASPC', 'color' => '#0B2E35', 'url' => '/training/adv-safe/aspc/' ),
		'spc'  => array( 'code' => 'SPC',  'color' => '#127E88', 'url' => '/training/adv-safe/spc/' ),
		'rte'  => array( 'code' => 'RTE',  'color' => '#3E7CB1', 'url' => '/training/adv-safe/rte/' ),
		'lpm'  => array( 'code' => 'LPM',  'color' => '#D9A93E', 'url' => '/training/adv-safe/lpm/' ),
		'apm'  => array( 'code' => 'APM',  'color' => '#8E5BA6', 'url' => '/training/adv-safe/apm/' ),
		// Role track — /training/safe/
		'sa'   => array( 'code' => 'SA',   'color' => '#B04A5A', 'url' => '/training/safe/sa/' ),
		'ssm'  => array( 'code' => 'SSM',  'color' => '#4E8F5B', 'url' => '/training/safe/scrum-master/' ),
		'popm' => array( 'code' => 'POPM', 'color' => '#C2571B', 'url' => '/training/safe/popm/' ),
		'sdp'  => array( 'code' => 'SDP',  'color' => '#3B8EA5', 'url' => '/training/safe/devops/' ),
		'sasm' => array( 'code' => 'SASM', 'color' => '#5A6ACF', 'url' => '/training/safe/asm/' ),
		'asm'  => array( 'code' => 'SASM', 'color' => '#5A6ACF', 'url' => '/training/safe/asm/' ),
		'bo'   => array( 'code' => 'BO',   'color' => '#9B7B2F', 'url' => '/training/safe/bo/' ),
		// Industry track — /training/safe-industry/
		'arch' => array( 'code' => 'ARCH', 'color' => '#7A6C5D', 'url' => '/training/safe-industry/arch/' ),
		'ase'  => array( 'code' => 'ASE',  'color' => '#2F6B4F', 'url' => '/training/safe-industry/ase/' ),
		'sp'   => array( 'code' => 'SP',   'color' => '#6F8F3E', 'url' => '/training/safe-industry/team-practitioner/' ),
		'sagov' => array( 'code' => 'SA-GOV', 'color' => '#8C4F2B', 'url' => '/training/safe-industry/sa-gov/' ),
		// Micro-credentials — /training/safe-found/
		'micro-conflict' => array( 'code' => 'CONFLICT', 'color' => '#5C6B7A', 'url' => '/training/safe-found/conflict-collaboration/' ),
		'micro-vsm'      => array( 'code' => 'VSM',      'color' => '#41746B', 'url' => '/training/safe-found/value-stream-mapping/' ),
		'micro-rai'      => array( 'code' => 'RAI',      'color' => '#7D5BA6', 'url' => '/training/safe-found/responsible-ai-safe/' ),
		'micro-gov'      => array( 'code' => 'GOV',      'color' => '#A0692E', 'url' => '/training/safe-found/agile-contracting-government/' ),
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

function aa_mcal_render( $atts ) {
	static $instance = 0, $assets_done = false;
	$instance++;

	$a = shortcode_atts( array(
		'category' => '',            // "" = all courses
		'months'   => 6,
		'link'     => 'enroll',      // enroll | course
		'lang'     => 'en',
		'wide'     => '',            // "1" = full-width training-page variant
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
	$html = '<div class="aa-mcal' . ( $a['wide'] ? ' aa-mcal--wide' : '' ) . '" id="' . esc_attr( $id ) . '">'
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
.aa-mcal-more{font-size:9px;line-height:1;color:#5E7B82;padding-left:3px;letter-spacing:.02em}
.aa-mcal-empty{padding:18px 12px;text-align:center;font-size:12.5px;color:#88A0A4}
.aa-mcal-legend{display:flex;flex-wrap:wrap;gap:6px 12px;padding:8px 12px 10px;border-top:1px solid #EEF5F5}
.aa-mcal-key{display:inline-flex;align-items:center;gap:6px;font-family:ui-monospace,Menlo,monospace;
  font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#5E7378;text-decoration:none}
.aa-mcal-key:hover{color:#127E88}
.aa-mcal-key i{width:14px;height:7px;border-radius:99px;background:var(--c,#127E88)}
@media(prefers-reduced-motion:no-preference){.aa-mcal-band{transition:opacity .15s}}
/* full-width variant for the training pages */
.aa-mcal--wide{max-width:none}
.aa-mcal--wide .aa-mcal-head{padding:14px 18px}
.aa-mcal--wide .aa-mcal-title{font-size:13px}
.aa-mcal--wide .aa-mcal-grid{padding:12px 14px 8px;gap:0 4px}
.aa-mcal--wide .aa-mcal-dow{font-size:11px;padding:6px 0}
.aa-mcal--wide .aa-mcal-cell{min-height:68px;padding:6px 0 4px}
.aa-mcal--wide .aa-mcal-day{font-size:14px}
.aa-mcal--wide .aa-mcal-band{height:9px}
.aa-mcal--wide .aa-mcal-legend{padding:12px 18px 14px;gap:8px 18px}
.aa-mcal--wide .aa-mcal-key{font-size:11px}
.aa-mcal--wide .aa-mcal-key i{width:18px;height:9px}
@media(max-width:600px){.aa-mcal--wide .aa-mcal-cell{min-height:52px}}
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
  function iso(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function href(m, id){ return m.url + (m.url.charAt(0)==='#' ? '' : '?cohort='+id); }
  /* Course-page hand-off: when the AA - Course JS engine is present, clicking
     a stripe also selects that cohort in the pick list and opens the Stripe
     form, exactly as the retired "AA - Class Calendar" snippet did. The item
     is matched by its start date against window.AA_COHORTS, and AA_PICK gets
     the same label shape that engine expects ("Aug 24 - when"). The anchor
     still navigates to #enroll either way, so a miss degrades to the plain
     jump instead of a dead click. */
  var MONA=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function pick(ds){
    if(typeof window.AA_PICK!=='function'||!window.AA_COHORTS||!window.AA_COHORTS.length) return;
    var p=ds.split('-'), mon=MONA[+p[1]-1], day=+p[2];
    for(var i=0;i<window.AA_COHORTS.length;i++){ var it=window.AA_COHORTS[i];
      if(it.mon===mon && parseInt(it.day,10)===day){
        window.AA_PICK(it.mon+' '+it.day+(it.when?(' — '+it.when):'')); return; } }
  }
  function render(){
    var y=view.getFullYear(), mo=view.getMonth();
    var first=new Date(y,mo,1), days=new Date(y,mo+1,0).getDate(), lead=first.getDay();
    var inMonth = ev.filter(function(v){ return v.s<=new Date(y,mo,days) && v.e>=first; });
    // lane assignment: first free lane whose events don't overlap this one
    var lanes=[]; inMonth.forEach(function(v){
      for(var L=0;;L++){ lanes[L]=lanes[L]||[];
        if(lanes[L].every(function(o){ return v.s>o.e || v.e<o.s; })){ lanes[L].push(v); v.lane=L; break; } }
    });
    // The compact mini sits beside a course pitch and has room for three
    // bands; the wide hub calendar carries a whole track (seven courses on
    // /training/safe/) and needs more before it starts hiding classes.
    var MAXL=root.classList.contains('aa-mcal--wide')?5:3;
    var nLanes=Math.min(lanes.length,MAXL);
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
            +' href="'+href(m,v.id)+'" data-s="'+iso(v.s)+'"'
            +(isS?' aria-label="'+m.code+' · '+S.reg+'" title="'+m.code+'"':' aria-hidden="true" tabindex="-1"')+'></a>';
        }
        // Anything past the last lane would otherwise vanish without trace —
        // and the legend below still lists its course, so the day would claim
        // a class the grid does not show. Count the overflow instead.
        var extra=0;
        for(var L=nLanes;L<lanes.length;L++){
          if((lanes[L]||[]).some(function(o){ return date>=o.s && date<=o.e; })){ extra++; }
        }
        if(extra){ h+='<span class="aa-mcal-more" title="+'+extra+'">+'+extra+'</span>'; }
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
    var a=e.target.closest('a[data-s]');
    if(a && a.getAttribute('href').charAt(0)==='#'){ pick(a.getAttribute('data-s')); return; }
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
}

add_shortcode( 'aa_mini_calendar', 'aa_mcal_render' );

/**
 * TAKEOVER of the old Xylus calendar shortcodes — zero page edits needed.
 *
 * WordPress hands a shortcode to whichever handler registered it LAST, so
 * re-registering these two at a late init priority replaces the Xylus
 * renderers site-wide the moment this snippet is active:
 *
 *   [easy_events_calendar]                the big training-page calendar ->
 *                                         full-width stripes, course links
 *   [easy_event_calendar_mini ...]        the per-course mini -> compact
 *                                         stripes, own registration
 *
 * Every page keeps its existing shortcode untouched; deactivating this
 * snippet hands both back to the Xylus plugin — that is the whole undo.
 */
add_action( 'init', function () {
	add_shortcode( 'easy_events_calendar', function ( $atts ) {
		$a = shortcode_atts( array( 'category' => '', 'lang' => 'en' ), $atts, 'easy_events_calendar' );
		return aa_mcal_render( array(
			'category' => $a['category'], 'lang' => $a['lang'],
			'link' => 'course', 'wide' => '1',
		) );
	} );
	add_shortcode( 'easy_event_calendar_mini', function ( $atts ) {
		$a = shortcode_atts( array( 'category' => '', 'lang' => 'en' ), $atts, 'easy_event_calendar_mini' );
		return aa_mcal_render( array( 'category' => $a['category'], 'lang' => $a['lang'] ) );
	} );
}, 99 );

/* ============================================================================
   PAGES THAT SHOULD CARRY NO CALENDAR AT ALL
   ----------------------------------------------------------------------------
   /training/safe-industry/ and /training/safe-found/ each hold a section built
   around [easy_events_calendar] — an eyebrow, an H2, a sub-line, the calendar,
   and a hidden [wp_events] feed that exists only to supply it. Suppressing the
   shortcode alone would leave the heading standing over nothing, so the whole
   section goes.

   This is done at render time rather than by editing the two pages: the page
   markup stays exactly as it is, the section is simply never emitted, and
   deactivating this snippet restores it. Because it is never emitted, it is
   also gone for crawlers and for anything reading the page as text — which a
   display:none rule would not achieve.

   To bring a calendar back on one of these pages, delete its slug from
   aa_mcal_hidden_slugs(). To retire the section for good, delete the block in
   the editor and this filter stops matching anything.
   ========================================================================== */

/** Page slugs whose cohorts section is dropped. Both are unique site-wide. */
function aa_mcal_hidden_slugs() {
	return array( 'safe-industry', 'safe-found' );
}

/** True when the page being viewed is one of those. Resolved once per request. */
function aa_mcal_hide_here() {
	static $hide = null;
	if ( $hide !== null ) { return $hide; }
	$hide = false;
	if ( ! is_admin() && is_page() ) {
		$obj = get_queried_object();
		if ( $obj instanceof WP_Post ) {
			$hide = in_array( $obj->post_name, aa_mcal_hidden_slugs(), true );
		}
	}
	return $hide;
}

/** Does this block, or anything nested inside it, embed the big calendar? */
function aa_mcal_holds_calendar( $block ) {
	if ( isset( $block['blockName'] ) && $block['blockName'] === 'core/shortcode'
		&& isset( $block['innerHTML'] ) && strpos( $block['innerHTML'], 'easy_events_calendar' ) !== false ) {
		return true;
	}
	if ( ! empty( $block['innerBlocks'] ) ) {
		foreach ( $block['innerBlocks'] as $child ) {
			if ( aa_mcal_holds_calendar( $child ) ) { return true; }
		}
	}
	return false;
}

add_filter( 'render_block', function ( $html, $block ) {
	// Cheapest test first — this filter runs for every block on every page.
	if ( empty( $block['blockName'] ) || $block['blockName'] !== 'core/group' ) { return $html; }
	if ( ! aa_mcal_hide_here() ) { return $html; }
	// Only the section wrapper, so the match fires once and not again for the
	// inner .aa-sechead / .aa-feed-src groups nested inside it.
	$cls = isset( $block['attrs']['className'] ) ? $block['attrs']['className'] : '';
	if ( strpos( $cls, 'aa-sec' ) === false ) { return $html; }
	return aa_mcal_holds_calendar( $block ) ? '' : $html;
}, 10, 2 );
