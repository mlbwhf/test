<?php
/**
 * Agile Agilist — Auto cohort SCHEDULE (KnowledgeHut-style cards) from the Events Calendar
 * ----------------------------------------------------------------------------------------
 * Renders a filter bar + one rich card per upcoming "sa" event + a "Fast Filling" sidebar.
 * Each card's "Enroll Now" carries ?cohort=<post-id> into the on-page form (#enroll-form),
 * which your live form snippet + {get.cohort} pre-selects.
 *
 * USE:  [aa_cohorts]
 *       [aa_cohorts price="$850" enroll="https://agile-agilist.com/training/safe/sa/#enroll-form"]
 *       [aa_cohorts compare_at="$1,395" discount="40% OFF" coupon="SAFE10" coupon_expires="30/06"]
 *       [aa_cohorts debug="1"]   (admin only)
 *
 * Pinned for agile-agilist.com: post_type wp_events / taxonomy event_category / meta start_ts.
 * Optional per-event meta it will use if present: trainer (name), trainer_photo (image URL),
 *   end_ts/event_end_date (end), seats_left (number → "Filling Fast" when low).
 */

add_shortcode( 'aa_cohorts', function ( $atts ) {

	$a = shortcode_atts( array(
		'category'    => 'sa',
		'price'       => '$850',
		'compare_at'  => '',          // e.g. "$1,395" → shows strikethrough (leave blank = no fake discount)
		'discount'    => '',          // e.g. "40% OFF" badge (only if you really run the sale)
		'enroll'      => '',          // enroll link base; default = same page #enroll-form
		'coupon'      => '',          // e.g. "SAFE10"
		'coupon_expires' => '',       // e.g. "30/06"
		'limit'       => 12,
		'post_type'   => 'wp_events',
		'taxonomy'    => 'event_category',
		'date_meta'   => 'start_ts',
		'debug'       => '',
	), $atts, 'aa_cohorts' );

	$is_admin_user = current_user_can( 'manage_options' );
	$debug_lines   = array();

	/* taxonomy / term */
	$taxonomy = $a['taxonomy']; $term = false;
	$cands = array_filter( array( $a['taxonomy'], 'event_category', 'event_categories', 'wp_events_categories', 'eec_event_category', 'eec_event_categories', 'events_categories', 'event-categories' ) );
	foreach ( $cands as $tx ) { if ( $tx && taxonomy_exists( $tx ) ) { $m = get_term_by( 'slug', $a['category'], $tx ); if ( $m && ! is_wp_error( $m ) ) { $term = $m; $taxonomy = $tx; break; } } }
	$debug_lines[] = 'Taxonomy: ' . ( $taxonomy ?: 'NOT FOUND' ) . ' | term "' . $a['category'] . '": ' . ( $term ? ( 'id ' . $term->term_id ) : 'NOT FOUND' );

	/* post types */
	$pts = array();
	if ( $a['post_type'] ) { $pts = array( $a['post_type'] ); }
	elseif ( $taxonomy && taxonomy_exists( $taxonomy ) ) { $to = get_taxonomy( $taxonomy ); $pts = is_array( $to->object_type ) ? $to->object_type : array(); }
	if ( empty( $pts ) ) { foreach ( array( 'wp_events','eec_events','events','event' ) as $p ) { if ( post_type_exists( $p ) ) { $pts[] = $p; } } }
	$debug_lines[] = 'Post type(s): ' . ( $pts ? implode( ', ', $pts ) : 'NOT FOUND' );

	/* query */
	$args = array( 'post_type' => $pts ?: 'any', 'post_status' => 'publish', 'posts_per_page' => 60, 'no_found_rows' => true );
	if ( $term ) { $args['tax_query'] = array( array( 'taxonomy' => $taxonomy, 'field' => 'term_id', 'terms' => $term->term_id ) ); }
	$events = get_posts( $args );
	$debug_lines[] = 'Events found: ' . count( $events );

	/* detect date meta */
	$dm = $a['date_meta'];
	if ( ! $dm && ! empty( $events ) ) {
		$meta = get_post_meta( $events[0]->ID );
		foreach ( array( 'start_ts','event_start_ts','event_start_date','start_date','_start_ts' ) as $k ) { if ( isset( $meta[ $k ] ) && aac_dateish( $meta[ $k ][0] ) ) { $dm = $k; break; } }
		if ( ! $dm ) { foreach ( $meta as $k => $v ) { if ( stripos( $k, 'start' ) !== false && aac_dateish( $v[0] ) ) { $dm = $k; break; } } }
		if ( $is_admin_user ) { $debug_lines[] = 'Meta keys: ' . implode( ', ', array_keys( $meta ) ); }
	}
	$debug_lines[] = 'Start-date meta key: ' . ( $dm ?: 'NOT DETECTED' );

	if ( $a['debug'] && $is_admin_user ) {
		return '<pre style="background:#0f172a;color:#7dd3fc;padding:16px;border-radius:8px;overflow:auto;font-size:13px">' . esc_html( "AA_COHORTS DIAGNOSTIC\n" . implode( "\n", $debug_lines ) ) . '</pre>';
	}

	/* build rows */
	$rows = array();
	foreach ( $events as $ev ) {
		$ts = $dm ? aac_ts( get_post_meta( $ev->ID, $dm, true ) ) : 0;
		if ( ! $ts || $ts < strtotime( 'today' ) ) { continue; }
		// end (optional)
		$end_ts = 0;
		foreach ( array( 'end_ts','event_end_ts','event_end_date','end_date' ) as $ek ) { $v = get_post_meta( $ev->ID, $ek, true ); if ( $v ) { $end_ts = aac_ts( $v ); break; } }
		$dow  = (int) wp_date( 'N', $ts );
		$hour = (int) ( new DateTime( '@'.$ts ) )->setTimezone( wp_timezone() )->format( 'G' );
		$slot = $hour < 12 ? 'morning' : ( $hour < 17 ? 'afternoon' : 'evening' );
		$rows[] = array(
			'id'=>$ev->ID, 'ts'=>$ts, 'end_ts'=>$end_ts,
			'month'=>wp_date('Y-m',$ts), 'daytype'=>($dow>=6?'weekend':'weekday'), 'slot'=>$slot,
			'trainer'=>get_post_meta($ev->ID,'trainer',true), 'trainer_photo'=>get_post_meta($ev->ID,'trainer_photo',true),
			'seats'=>get_post_meta($ev->ID,'seats_left',true),
		);
	}
	usort( $rows, function($x,$y){ return $x['ts']-$y['ts']; } );
	$rows = array_slice( $rows, 0, (int) $a['limit'] );

	if ( empty( $rows ) ) {
		return $is_admin_user
			? '<div style="border:1px dashed #f59e0b;background:#fffbeb;color:#92400e;padding:14px 18px;border-radius:10px;max-width:1180px;margin:24px auto;font-size:14px"><strong>No cohorts rendered.</strong> '.esc_html( implode(' | ',$debug_lines) ).'</div>'
			: '<p style="text-align:center;color:#64748b;max-width:1180px;margin:24px auto">New cohort dates are being scheduled — <a href="https://meetings.hubspot.com/john2795">request a date</a>.</p>';
	}

	$enroll_base = $a['enroll'] ?: '';   // '' → relative ?cohort=..#enroll-form on same page
	$price = esc_html( $a['price'] );
	$soonest = $rows[0];
	$map = array();

	ob_start(); ?>
<div class="aa-sch-wrap" id="cohorts">
  <div class="aa-sch-main">
    <div class="aa-sch-head"><h2>Schedules</h2><span class="aa-sch-count" id="aa-count"><?php echo count($rows); ?> results</span></div>
    <div class="aa-sch-filters" id="aa-filters">
      <button class="aa-pill active" data-quick="all">All</button>
      <button class="aa-pill" data-quick="this-month">This Month</button>
      <button class="aa-pill" data-quick="next-month">Next Month</button>
      <button class="aa-pill" data-quick="weekend">Weekend</button>
      <button class="aa-pill" data-quick="weekday">Weekday</button>
      <select id="aa-f-slot"><option value="all">Time Slot</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select>
      <span class="aa-pill aa-pill-static">● Live Online Classroom</span>
      <select id="aa-f-month"><option value="all">Month</option></select>
    </div>
    <div id="aa-cards">
<?php foreach ( $rows as $i => $r ) :
		$map[ $r['id'] ] = aac_daterange( $r['ts'], $r['end_ts'] );
		$href = ( $enroll_base ? $enroll_base : '?cohort='.$r['id'].'#enroll-form' );
		$batch = ( $r['daytype']==='weekend' ? 'Weekend Batch' : 'Weekday Batch' );
		$slotlbl = ucfirst( $r['slot'] );
		$filling = ( $r['seats']!=='' && (int)$r['seats'] > 0 && (int)$r['seats'] <= 5 );
?>
      <div class="aa-card" data-month="<?php echo esc_attr($r['month']); ?>" data-daytype="<?php echo esc_attr($r['daytype']); ?>" data-slot="<?php echo esc_attr($r['slot']); ?>" data-cohort="<?php echo esc_attr($r['id']); ?>">
        <div class="aa-card-info">
          <span class="aa-badge aa-badge-<?php echo esc_attr($r['slot']); ?>"><?php echo ( $r['slot']==='evening'?'☾':'☀' ); ?> <?php echo esc_html($slotlbl); ?></span>
          <div class="aa-card-date"><?php echo esc_html( aac_daterange( $r['ts'], $r['end_ts'] ) ); ?></div>
          <div class="aa-card-time"><span class="aa-tz">ET</span> <?php echo esc_html( aac_time( $r['ts'], $r['end_ts'], 'America/New_York' ) ); ?></div>
          <div class="aa-card-time"><span class="aa-tz">PT</span> <?php echo esc_html( aac_time( $r['ts'], $r['end_ts'], 'America/Los_Angeles' ) ); ?></div>
          <div class="aa-card-meta">🌐 Online Classroom · <?php echo esc_html($batch); ?></div>
<?php if ( $r['trainer'] ) : ?>
          <div class="aa-trainer"><?php if ( $r['trainer_photo'] ) : ?><img src="<?php echo esc_url($r['trainer_photo']); ?>" alt=""><?php else : ?><span class="aa-trainer-ini"><?php echo esc_html( aac_initials($r['trainer']) ); ?></span><?php endif; ?><span><strong><?php echo esc_html($r['trainer']); ?></strong><br><span class="aa-trainer-role">Trainer</span></span></div>
<?php endif; ?>
        </div>
        <div class="aa-card-qty">
          <div class="aa-stepper"><button type="button" class="aa-minus" aria-label="decrease">−</button><span class="aa-qval">1</span><button type="button" class="aa-plus" aria-label="increase">+</button></div>
        </div>
        <div class="aa-card-buy">
<?php if ( $a['discount'] ) : ?><span class="aa-disc"><?php echo esc_html($a['discount']); ?></span><?php endif; ?>
          <div class="aa-price"><?php echo $price; ?><?php if ( $a['compare_at'] ) : ?> <s><?php echo esc_html($a['compare_at']); ?></s><?php endif; ?></div>
          <div class="aa-price-sub">per seat · USD</div>
<?php if ( $filling ) : ?><div class="aa-filling">⏳ Filling Fast</div><?php endif; ?>
          <a class="aa-enroll" href="<?php echo esc_attr($href); ?>" data-base="<?php echo esc_attr($href); ?>">Enroll Now</a>
        </div>
      </div>
<?php endforeach; ?>
    </div>
  </div>
  <aside class="aa-sch-side">
    <div class="aa-side-card">
      <div class="aa-side-title">Fast Filling Schedule</div>
      <div class="aa-side-inner">
        <span class="aa-badge aa-badge-<?php echo esc_attr($soonest['slot']); ?>"><?php echo ( $soonest['slot']==='evening'?'☾':'☀' ); ?> <?php echo esc_html(ucfirst($soonest['slot'])); ?></span>
        <div class="aa-card-date"><?php echo esc_html( aac_daterange( $soonest['ts'], $soonest['end_ts'] ) ); ?></div>
        <div class="aa-card-time"><span class="aa-tz">ET</span> <?php echo esc_html( aac_time( $soonest['ts'], $soonest['end_ts'], 'America/New_York' ) ); ?></div>
        <div class="aa-card-time"><span class="aa-tz">PT</span> <?php echo esc_html( aac_time( $soonest['ts'], $soonest['end_ts'], 'America/Los_Angeles' ) ); ?></div>
        <div class="aa-card-meta">🌐 Online Classroom · <?php echo esc_html( $soonest['daytype']==='weekend'?'Weekend Batch':'Weekday Batch' ); ?></div>
        <div class="aa-price" style="margin-top:10px"><?php echo $price; ?><?php if ( $a['compare_at'] ) : ?> <s><?php echo esc_html($a['compare_at']); ?></s><?php endif; ?></div>
        <a class="aa-enroll aa-enroll-block" href="<?php echo esc_attr( $enroll_base ?: '?cohort='.$soonest['id'].'#enroll-form' ); ?>">Enroll Now</a>
        <a class="aa-side-all" href="#cohorts">View all schedules ›</a>
      </div>
    </div>
<?php if ( $a['coupon'] ) : ?>
    <div class="aa-coupon">
      <div class="aa-coupon-amt">🏷️ Coupon</div>
      <div class="aa-coupon-code">Code <strong><?php echo esc_html($a['coupon']); ?></strong></div>
<?php if ( $a['coupon_expires'] ) : ?><div class="aa-coupon-exp">Expires <?php echo esc_html($a['coupon_expires']); ?></div><?php endif; ?>
    </div>
<?php endif; ?>
  </aside>
</div>
<style>
.aa-sch-wrap{max-width:1180px;margin:30px auto;display:grid;grid-template-columns:1fr 320px;gap:24px;align-items:start}
.aa-sch-head{display:flex;align-items:baseline;gap:12px;margin-bottom:14px}
.aa-sch-head h2{margin:0;color:#0f172a;font-size:28px;font-weight:800}
.aa-sch-count{color:#64748b;font-size:14px}
.aa-sch-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:18px}
.aa-sch-filters .aa-pill{cursor:pointer;border:1px solid #e2e8f0;background:#fff;color:#0f172a;font-weight:600;font-size:13px;padding:9px 16px;border-radius:30px;transition:all .15s}
.aa-sch-filters .aa-pill:hover{border-color:#0e7490}
.aa-sch-filters .aa-pill.active{background:#0f172a;color:#fff;border-color:#0f172a}
.aa-sch-filters .aa-pill-static{cursor:default;color:#0e7490;border-color:#a5f3fc;background:#ecfeff}
.aa-sch-filters select{border:1px solid #e2e8f0;border-radius:30px;padding:9px 14px;font-size:13px;color:#0f172a;font-weight:600;background:#fff}
.aa-card{display:grid;grid-template-columns:1.4fr .7fr 1fr;gap:10px;border:1px solid #e2e8f0;border-radius:14px;padding:22px 24px;margin-bottom:16px;align-items:center}
.aa-card-info{display:flex;flex-direction:column;gap:5px}
.aa-badge{align-self:flex-start;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;background:#ecfdf5;color:#047857;margin-bottom:4px}
.aa-badge-evening{background:#eef2ff;color:#4f46e5}
.aa-badge-afternoon{background:#fffbeb;color:#b45309}
.aa-card-date{font-size:20px;font-weight:800;color:#0f172a}
.aa-card-time{font-size:13px;color:#334155}
.aa-card-time .aa-tz{display:inline-block;min-width:22px;font-weight:800;color:#0e7490}
.aa-card-meta{font-size:13px;color:#475569;margin-top:3px}
.aa-trainer{display:flex;align-items:center;gap:10px;margin-top:8px;font-size:13px;color:#0f172a}
.aa-trainer img,.aa-trainer-ini{width:38px;height:38px;border-radius:50%;object-fit:cover;display:inline-flex;align-items:center;justify-content:center;background:#fda4af;color:#fff;font-weight:800;font-size:13px}
.aa-trainer-role{color:#64748b}
.aa-card-qty{display:flex;justify-content:center}
.aa-stepper{display:inline-flex;align-items:center;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.aa-stepper button{width:38px;height:40px;border:none;background:#f8fafc;font-size:18px;cursor:pointer;color:#0f172a}
.aa-stepper .aa-qval{width:42px;text-align:center;font-weight:700}
.aa-card-buy{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.aa-disc{background:#fee2e2;color:#b91c1c;font-weight:800;font-size:12px;padding:3px 10px;border-radius:6px}
.aa-price{font-size:24px;font-weight:800;color:#0f172a}
.aa-price s{font-size:15px;color:#94a3b8;font-weight:600}
.aa-price-sub{font-size:12px;color:#64748b}
.aa-filling{color:#b45309;font-weight:700;font-size:13px;margin:4px 0}
.aa-enroll{display:inline-block;background:#0f172a;color:#fff;font-weight:800;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;margin-top:8px}
.aa-enroll:hover{background:#1e293b}
.aa-enroll-block{display:block;text-align:center;margin-top:12px}
.aa-sch-side{position:sticky;top:20px;display:flex;flex-direction:column;gap:16px}
.aa-side-card{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}
.aa-side-title{background:#fff7ed;color:#0f172a;font-weight:800;font-size:15px;padding:14px 18px;border-bottom:1px solid #fed7aa}
.aa-side-inner{padding:18px;border:2px solid #047857;border-radius:0 0 14px 14px;display:flex;flex-direction:column;gap:5px}
.aa-side-all{color:#0e7490;font-weight:700;text-decoration:none;text-align:center;margin-top:10px;font-size:14px}
.aa-coupon{background:#ecfdf5;border:1px dashed #6ee7b7;border-radius:14px;padding:18px 20px}
.aa-coupon-amt{font-weight:800;color:#047857}
.aa-coupon-code{color:#0f172a;font-size:14px;margin-top:4px}
.aa-coupon-exp{color:#64748b;font-size:12px;margin-top:2px}
.aa-empty-msg{padding:30px;text-align:center;color:#64748b}
@media(max-width:900px){.aa-sch-wrap{grid-template-columns:1fr}.aa-sch-side{position:static;flex-direction:row;flex-wrap:wrap}.aa-card{grid-template-columns:1fr;text-align:left}.aa-card-qty,.aa-card-buy{justify-content:flex-start;align-items:flex-start;text-align:left}}
</style>
<script>
window.AA_COHORTS=<?php echo wp_json_encode($map); ?>;
(function(){
  var wrap=document.getElementById('aa-cards');if(!wrap)return;
  var cards=[].slice.call(wrap.querySelectorAll('.aa-card'));
  var now=new Date();
  var thisM=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  var nx=new Date(now.getFullYear(),now.getMonth()+1,1);
  var nextM=nx.getFullYear()+'-'+String(nx.getMonth()+1).padStart(2,'0');
  var monthSel=document.getElementById('aa-f-month');
  var months=[];cards.forEach(function(c){var m=c.getAttribute('data-month');if(m&&months.indexOf(m)<0)months.push(m);});
  months.sort().forEach(function(m){var d=new Date(m+'-01T00:00:00');var o=document.createElement('option');o.value=m;o.textContent=d.toLocaleString('en',{month:'long',year:'numeric'});monthSel.appendChild(o);});
  var quick='all';
  function apply(){
    var slot=document.getElementById('aa-f-slot').value,month=monthSel.value,shown=0;
    cards.forEach(function(c){
      var ok=true,m=c.getAttribute('data-month');
      if(quick==='this-month'&&m!==thisM)ok=false;
      if(quick==='next-month'&&m!==nextM)ok=false;
      if(quick==='weekend'&&c.getAttribute('data-daytype')!=='weekend')ok=false;
      if(quick==='weekday'&&c.getAttribute('data-daytype')!=='weekday')ok=false;
      if(slot!=='all'&&c.getAttribute('data-slot')!==slot)ok=false;
      if(month!=='all'&&m!==month)ok=false;
      c.style.display=ok?'':'none';if(ok)shown++;
    });
    var cnt=document.getElementById('aa-count');if(cnt)cnt.textContent=shown+' result'+(shown===1?'':'s');
  }
  document.querySelectorAll('#aa-filters .aa-pill[data-quick]').forEach(function(p){p.addEventListener('click',function(){
    document.querySelectorAll('#aa-filters .aa-pill[data-quick]').forEach(function(x){x.classList.remove('active');});
    p.classList.add('active');quick=p.getAttribute('data-quick');apply();});});
  document.getElementById('aa-f-slot').addEventListener('change',apply);
  monthSel.addEventListener('change',apply);
  // qty steppers → carry &qty into the enroll link
  cards.forEach(function(c){
    var q=c.querySelector('.aa-qval'),a=c.querySelector('.aa-enroll'),base=a?a.getAttribute('data-base'):'';
    function setq(n){q.textContent=n;if(a){a.setAttribute('href',base+(base.indexOf('?')>-1?'&':'?')+'qty='+n);}}
    c.querySelector('.aa-plus').addEventListener('click',function(){setq(parseInt(q.textContent,10)+1);});
    c.querySelector('.aa-minus').addEventListener('click',function(){var n=parseInt(q.textContent,10)-1;if(n<1)n=1;setq(n);});
  });
  apply();
})();
</script>
<?php
	return ob_get_clean();
} );

/* ---- helpers ---- */
if ( ! function_exists('aac_dateish') ) { function aac_dateish($v){ if(is_numeric($v)&&(int)$v>100000000)return true; return $v&&strtotime($v)!==false; } }
if ( ! function_exists('aac_ts') ) { function aac_ts($v){ if(is_numeric($v)&&(int)$v>100000000)return (int)$v; $t=$v?strtotime($v):false; return $t?:0; } }
if ( ! function_exists('aac_daterange') ) { function aac_daterange($s,$e){ $a=wp_date('M j',$s); if($e&&wp_date('Y-m-d',$e)!==wp_date('Y-m-d',$s)){return $a.' – '.wp_date('M j, Y',$e);} return $a.', '.wp_date('Y',$s); } }
if ( ! function_exists('aac_time') ) { function aac_time($s,$e,$tz){ try{ $z=new DateTimeZone($tz); $ds=(new DateTime('@'.$s))->setTimezone($z); $out=$ds->format('g:i A'); if($e){ $de=(new DateTime('@'.$e))->setTimezone($z); $out.=' – '.$de->format('g:i A'); } $out.=' '.$ds->format('T'); return $out; }catch(Exception $x){ return wp_date('g:i A',$s); } } }
if ( ! function_exists('aac_initials') ) { function aac_initials($n){ $p=preg_split('/\s+/',trim($n)); $i=strtoupper(substr($p[0],0,1)); if(count($p)>1)$i.=strtoupper(substr(end($p),0,1)); return $i?:'•'; } }
