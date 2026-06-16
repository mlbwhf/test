<?php
/**
 * Agile Agilist — Auto cohort SCHEDULE (KnowledgeHut-style cards) from the Events Calendar
 * ----------------------------------------------------------------------------------------
 * Filter bar + one rich card per upcoming "sa" event + "Fast Filling" sidebar + optional coupon.
 * Each "Enroll Now" carries ?cohort=<post-id> (&qty=N) into the on-page form (#enroll-form).
 *
 * USE:  [aa_cohorts]
 *       [aa_cohorts price="$850" financing="As low as $109/month"]
 *       [aa_cohorts compare_at="$1,395" discount="40% OFF" coupon="SAFE10" coupon_expires="30/06"]
 *       [aa_cohorts debug="1"]   (admin only)
 *
 * Pinned: post_type wp_events / taxonomy event_category / meta start_ts.
 * Optional per-event meta used if present: trainer, trainer_photo, end_ts/event_end_date, seats_left.
 */

add_shortcode( 'aa_cohorts', function ( $atts ) {

	$a = shortcode_atts( array(
		'category'=>'sa', 'price'=>'$850', 'compare_at'=>'', 'discount'=>'', 'financing'=>'',
		'enroll'=>'', 'coupon'=>'', 'coupon_expires'=>'', 'limit'=>12,
		'post_type'=>'wp_events', 'taxonomy'=>'event_category', 'date_meta'=>'start_ts', 'debug'=>'',
	), $atts, 'aa_cohorts' );

	$is_admin_user = current_user_can( 'manage_options' );
	$debug_lines = array();

	$taxonomy = $a['taxonomy']; $term = false;
	$cands = array_filter( array( $a['taxonomy'], 'event_category', 'event_categories', 'wp_events_categories', 'eec_event_category', 'eec_event_categories', 'events_categories', 'event-categories' ) );
	foreach ( $cands as $tx ) { if ( $tx && taxonomy_exists( $tx ) ) { $m = get_term_by( 'slug', $a['category'], $tx ); if ( $m && ! is_wp_error( $m ) ) { $term = $m; $taxonomy = $tx; break; } } }
	$debug_lines[] = 'Taxonomy: ' . ( $taxonomy ?: 'NOT FOUND' ) . ' | term "' . $a['category'] . '": ' . ( $term ? ( 'id '.$term->term_id ) : 'NOT FOUND' );

	$pts = array();
	if ( $a['post_type'] ) { $pts = array( $a['post_type'] ); }
	elseif ( $taxonomy && taxonomy_exists( $taxonomy ) ) { $to = get_taxonomy( $taxonomy ); $pts = is_array( $to->object_type ) ? $to->object_type : array(); }
	if ( empty( $pts ) ) { foreach ( array('wp_events','eec_events','events','event') as $p ) { if ( post_type_exists($p) ) { $pts[]=$p; } } }
	$debug_lines[] = 'Post type(s): ' . ( $pts ? implode(', ',$pts) : 'NOT FOUND' );

	$args = array( 'post_type'=>$pts?:'any', 'post_status'=>'publish', 'posts_per_page'=>60, 'no_found_rows'=>true );
	if ( $term ) { $args['tax_query'] = array( array('taxonomy'=>$taxonomy,'field'=>'term_id','terms'=>$term->term_id) ); }
	$events = get_posts( $args );
	$debug_lines[] = 'Events found: ' . count( $events );

	$dm = $a['date_meta'];
	if ( ! $dm && ! empty($events) ) {
		$meta = get_post_meta( $events[0]->ID );
		foreach ( array('start_ts','event_start_ts','event_start_date','start_date','_start_ts') as $k ) { if ( isset($meta[$k]) && aac_dateish($meta[$k][0]) ) { $dm=$k; break; } }
		if ( ! $dm ) { foreach ( $meta as $k=>$v ) { if ( stripos($k,'start')!==false && aac_dateish($v[0]) ) { $dm=$k; break; } } }
		if ( $is_admin_user ) { $debug_lines[]='Meta keys: '.implode(', ',array_keys($meta)); }
	}
	$debug_lines[] = 'Start-date meta key: ' . ( $dm ?: 'NOT DETECTED' );

	if ( $a['debug'] && $is_admin_user ) {
		return '<pre style="background:#0f172a;color:#7dd3fc;padding:16px;border-radius:8px;overflow:auto;font-size:13px">'.esc_html("AA_COHORTS DIAGNOSTIC\n".implode("\n",$debug_lines)).'</pre>';
	}

	$rows = array();
	foreach ( $events as $ev ) {
		$ts = $dm ? aac_ts( get_post_meta($ev->ID,$dm,true) ) : 0;
		if ( ! $ts || $ts < strtotime('today') ) { continue; }
		$end_ts = 0;
		foreach ( array('end_ts','event_end_ts','event_end_date','end_date') as $ek ) { $v=get_post_meta($ev->ID,$ek,true); if ($v){ $end_ts=aac_ts($v); break; } }
		$dow = (int) wp_date('N',$ts);
		$hour = (int) ( new DateTime('@'.$ts) )->setTimezone( wp_timezone() )->format('G');
		$slot = $hour<12 ? 'morning' : ( $hour<17 ? 'afternoon' : 'evening' );
		$rows[] = array(
			'id'=>$ev->ID,'ts'=>$ts,'end_ts'=>$end_ts,
			'month'=>wp_date('Y-m',$ts),'daytype'=>($dow>=6?'weekend':'weekday'),'slot'=>$slot,
			'trainer'=>get_post_meta($ev->ID,'trainer',true),'trainer_photo'=>get_post_meta($ev->ID,'trainer_photo',true),
			'seats'=>get_post_meta($ev->ID,'seats_left',true),
		);
	}
	usort( $rows, function($x,$y){ return $x['ts']-$y['ts']; } );
	$rows = array_slice( $rows, 0, (int)$a['limit'] );

	if ( empty($rows) ) {
		return $is_admin_user
			? '<div style="border:1px dashed #f59e0b;background:#fffbeb;color:#92400e;padding:14px 18px;border-radius:10px;max-width:1180px;margin:24px auto;font-size:14px"><strong>No cohorts rendered.</strong> '.esc_html(implode(' | ',$debug_lines)).'</div>'
			: '<p style="text-align:center;color:#64748b;max-width:1180px;margin:24px auto">New cohort dates are being scheduled — <a href="https://meetings.hubspot.com/john2795">request a date</a>.</p>';
	}

	// thin green line-icons (KnowledgeHut style)
	$ic_clock = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
	$ic_globe = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></svg>';
	$ic_user  = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';

	$enroll_base = $a['enroll'] ?: '';
	$price = esc_html($a['price']);
	$soonest = $rows[0];
	$map = array();

	ob_start(); ?>
<div class="aa-sch-wrap" id="cohorts">
  <div class="aa-sch-main">
    <div class="aa-sch-head"><h2>Schedules</h2><span class="aa-sch-count" id="aa-count"><?php echo count($rows); ?> Results</span></div>
    <div class="aa-sch-filters" id="aa-filters">
      <button class="aa-pill" data-quick="this-month">This Month</button>
      <button class="aa-pill" data-quick="next-month">Next Month</button>
      <button class="aa-pill" data-quick="weekend">Weekend</button>
      <button class="aa-pill" data-quick="weekday">Weekday</button>
      <select id="aa-f-slot" class="aa-sel"><option value="all">◷ Time Slot</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select>
      <span class="aa-pill aa-pill-static">Live Online Classroom</span>
      <select id="aa-f-month" class="aa-sel"><option value="all">▦ Month</option></select>
      <button class="aa-pill aa-pill-reset" data-quick="all">Reset</button>
    </div>
    <div id="aa-cards">
<?php foreach ( $rows as $r ) :
		$map[$r['id']] = aac_daterange($r['ts'],$r['end_ts']);
		$href  = ( $enroll_base ? $enroll_base : '?cohort='.$r['id'].'#enroll-form' );
		$batch = ( $r['daytype']==='weekend' ? 'Weekend Batch' : 'Weekday Batch' );
		$slotlbl = ucfirst($r['slot']);
		$filling = ( $r['seats']!=='' && (int)$r['seats']>0 && (int)$r['seats']<=5 );
?>
      <div class="aa-card" data-month="<?php echo esc_attr($r['month']); ?>" data-daytype="<?php echo esc_attr($r['daytype']); ?>" data-slot="<?php echo esc_attr($r['slot']); ?>" data-cohort="<?php echo esc_attr($r['id']); ?>">
        <div class="aa-card-info">
          <span class="aa-badge aa-badge-<?php echo esc_attr($r['slot']); ?>"><?php echo ($r['slot']==='evening'?'☾':'☀'); ?> <?php echo esc_html($slotlbl); ?></span>
          <div class="aa-card-date"><?php echo esc_html(aac_daterange($r['ts'],$r['end_ts'])); ?></div>
          <div class="aa-card-time"><?php echo $ic_clock; ?> <?php echo esc_html(aac_time($r['ts'],$r['end_ts'],'America/New_York')); ?></div>
          <div class="aa-card-time aa-card-time2"><?php echo esc_html(aac_time($r['ts'],$r['end_ts'],'America/Los_Angeles')); ?></div>
          <div class="aa-card-meta"><?php echo $ic_globe; ?> Online Classroom · <?php echo esc_html($batch); ?></div>
<?php if ( $r['trainer'] ) : ?>
          <div class="aa-trainer"><?php if ($r['trainer_photo']) : ?><img src="<?php echo esc_url($r['trainer_photo']); ?>" alt=""><?php else : ?><span class="aa-trainer-ini"><?php echo esc_html(aac_initials($r['trainer'])); ?></span><?php endif; ?><span><strong><?php echo esc_html($r['trainer']); ?></strong><br><span class="aa-trainer-role">Trainer</span></span></div>
<?php endif; ?>
        </div>
        <div class="aa-card-qty">
          <div class="aa-stepper"><button type="button" class="aa-minus" aria-label="decrease">−</button><span class="aa-qval">1</span><button type="button" class="aa-plus" aria-label="increase">+</button></div>
        </div>
        <div class="aa-card-buy">
<?php if ( $a['discount'] ) : ?><div class="aa-sale"><em>Hurry, Sale ends soon!</em> <span class="aa-disc"><?php echo esc_html($a['discount']); ?></span></div><?php endif; ?>
          <div class="aa-price"><?php echo $price; ?><?php if ($a['compare_at']) : ?> <s><?php echo esc_html($a['compare_at']); ?></s><?php endif; ?></div>
<?php if ( $a['financing'] ) : ?><div class="aa-fin"><?php echo esc_html($a['financing']); ?> ⓘ</div><?php else : ?><div class="aa-price-sub">per seat · USD</div><?php endif; ?>
          <div class="aa-buy-row"><?php if ($filling) : ?><span class="aa-filling">⏳ Filling Fast</span><?php endif; ?><a class="aa-enroll" href="<?php echo esc_attr($href); ?>" data-base="<?php echo esc_attr($href); ?>">Enroll Now</a></div>
        </div>
      </div>
<?php endforeach; ?>
    </div>
  </div>
  <aside class="aa-sch-side">
    <div class="aa-side-card">
      <div class="aa-side-title">Fast Filling Schedule</div>
      <div class="aa-side-inner">
        <div class="aa-side-toprow"><span class="aa-badge aa-badge-<?php echo esc_attr($soonest['slot']); ?>"><?php echo ($soonest['slot']==='evening'?'☾':'☀'); ?> <?php echo esc_html(ucfirst($soonest['slot'])); ?></span><?php if ($a['discount']) : ?><span class="aa-disc"><?php echo esc_html($a['discount']); ?></span><?php endif; ?></div>
        <div class="aa-card-date"><?php echo esc_html(aac_daterange($soonest['ts'],$soonest['end_ts'])); ?></div>
        <div class="aa-card-time"><?php echo $ic_clock; ?> <?php echo esc_html(aac_time($soonest['ts'],$soonest['end_ts'],'America/New_York')); ?></div>
        <div class="aa-card-time aa-card-time2"><?php echo esc_html(aac_time($soonest['ts'],$soonest['end_ts'],'America/Los_Angeles')); ?></div>
        <div class="aa-card-meta"><?php echo $ic_globe; ?> Online Classroom · <?php echo esc_html($soonest['daytype']==='weekend'?'Weekend Batch':'Weekday Batch'); ?></div>
<?php if ($soonest['trainer']) : ?><div class="aa-trainer"><span class="aa-trainer-ini"><?php echo esc_html(aac_initials($soonest['trainer'])); ?></span><span><strong><?php echo esc_html($soonest['trainer']); ?></strong></span></div><?php endif; ?>
        <div class="aa-side-sep"></div>
        <div class="aa-price"><?php echo $price; ?><?php if ($a['compare_at']) : ?> <s><?php echo esc_html($a['compare_at']); ?></s><?php endif; ?></div>
<?php if ($a['financing']) : ?><div class="aa-fin"><?php echo esc_html($a['financing']); ?> ⓘ</div><?php endif; ?>
        <a class="aa-enroll aa-enroll-block" href="<?php echo esc_attr($enroll_base ?: '?cohort='.$soonest['id'].'#enroll-form'); ?>">Enroll Now</a>
        <a class="aa-side-all" href="#cohorts">View all Schedules ›</a>
      </div>
    </div>
<?php if ( $a['coupon'] ) : ?>
    <div class="aa-coupon">
      <div class="aa-coupon-amt">🏷️ <?php echo esc_html($a['discount']?:'Coupon'); ?></div>
      <div class="aa-coupon-code">Coupon Code <strong>"<?php echo esc_html($a['coupon']); ?>"</strong></div>
<?php if ($a['coupon_expires']) : ?><div class="aa-coupon-exp">Coupon Expires <?php echo esc_html($a['coupon_expires']); ?></div><?php endif; ?>
      <button type="button" class="aa-coupon-copy" data-code="<?php echo esc_attr($a['coupon']); ?>">⧉ Copy</button>
    </div>
<?php endif; ?>
  </aside>
</div>
<style>
.aa-sch-wrap{max-width:1180px;margin:30px auto;display:grid;grid-template-columns:1fr 330px;gap:26px;align-items:start;font-family:inherit}
.aa-sch-head{display:flex;align-items:baseline;gap:12px;margin-bottom:16px}
.aa-sch-head h2{margin:0;color:#0f172a;font-size:30px;font-weight:800}
.aa-sch-count{color:#64748b;font-size:14px}
.aa-sch-filters{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-bottom:20px}
.aa-sch-filters .aa-pill{cursor:pointer;border:1px solid #e2e8f0;background:#fff;color:#0f172a;font-weight:600;font-size:13px;padding:9px 18px;border-radius:30px;transition:all .15s}
.aa-sch-filters .aa-pill:hover{border-color:#16a34a}
.aa-sch-filters .aa-pill.active{background:#0b1320;color:#fff;border-color:#0b1320}
.aa-sch-filters .aa-pill-static{cursor:default;color:#0f172a}
.aa-sch-filters .aa-pill-reset{color:#64748b}
.aa-sch-filters .aa-sel{border:1px solid #e2e8f0;border-radius:30px;padding:9px 16px;font-size:13px;color:#0f172a;font-weight:600;background:#fff;cursor:pointer}
.aa-card{display:grid;grid-template-columns:1.5fr .7fr 1.05fr;border:1px solid #e6e9ee;border-radius:14px;padding:24px 26px;margin-bottom:18px;align-items:center}
.aa-card-info{display:flex;flex-direction:column;gap:6px;padding-right:24px}
.aa-card-qty{display:flex;justify-content:center;border-left:1px solid #eef2f6;border-right:1px solid #eef2f6;height:100%;align-items:center}
.aa-card-buy{padding-left:24px;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.aa-badge{align-self:flex-start;font-size:12px;font-weight:700;padding:4px 13px;border-radius:20px;background:#e7f6ec;color:#15803d;margin-bottom:5px}
.aa-badge-evening{background:#eef2ff;color:#4f46e5}
.aa-badge-afternoon{background:#fffbeb;color:#b45309}
.aa-card-date{font-size:21px;font-weight:800;color:#0f172a}
.aa-card-time{font-size:13px;color:#334155;display:flex;align-items:center;gap:6px}
.aa-card-time2{padding-left:20px;color:#64748b}
.aa-card-meta{font-size:13px;color:#475569;display:flex;align-items:center;gap:6px;margin-top:3px}
.aa-trainer{display:flex;align-items:center;gap:10px;margin-top:10px;font-size:13px;color:#0f172a}
.aa-trainer img,.aa-trainer-ini{width:40px;height:40px;border-radius:50%;object-fit:cover;display:inline-flex;align-items:center;justify-content:center;background:#fda4af;color:#fff;font-weight:800;font-size:14px}
.aa-trainer-role{color:#64748b}
.aa-stepper{display:inline-flex;align-items:center;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.aa-stepper button{width:40px;height:42px;border:none;background:#fff;font-size:18px;cursor:pointer;color:#0f172a}
.aa-stepper button:hover{background:#f1f5f9}
.aa-stepper .aa-qval{width:44px;text-align:center;font-weight:700;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;line-height:42px}
.aa-sale{font-size:13px;color:#dc2626;font-weight:600}
.aa-sale em{font-style:italic}
.aa-disc{background:#fee2e2;color:#dc2626;font-weight:800;font-size:12px;padding:3px 9px;border-radius:6px}
.aa-price{font-size:25px;font-weight:800;color:#0f172a}
.aa-price s{font-size:15px;color:#94a3b8;font-weight:600}
.aa-price-sub,.aa-fin{font-size:12px;color:#64748b}
.aa-buy-row{display:flex;align-items:center;gap:12px;margin-top:8px}
.aa-filling{color:#b45309;font-weight:700;font-size:13px;white-space:nowrap}
.aa-enroll{display:inline-block;background:#0b1320;color:#fff;font-weight:800;padding:13px 30px;border-radius:8px;text-decoration:none;font-size:15px}
.aa-enroll:hover{background:#1e293b}
.aa-enroll-block{display:block;text-align:center;margin-top:12px}
.aa-sch-side{position:sticky;top:20px;display:flex;flex-direction:column;gap:16px}
.aa-side-card{border-radius:14px;overflow:hidden;box-shadow:0 6px 20px rgba(2,44,54,.06)}
.aa-side-title{background:#fff7ed;color:#0f172a;font-weight:800;font-size:15px;padding:15px 18px}
.aa-side-inner{padding:18px;border:2px solid #16a34a;border-top:none;border-radius:0 0 14px 14px;display:flex;flex-direction:column;gap:6px}
.aa-side-toprow{display:flex;align-items:center;justify-content:space-between}
.aa-side-sep{height:1px;background:#e6e9ee;margin:12px 0}
.aa-side-all{color:#0e7490;font-weight:700;text-decoration:none;text-align:center;margin-top:12px;font-size:14px}
.aa-coupon{background:#e7f6ec;border-radius:14px;padding:18px 20px;position:relative}
.aa-coupon-amt{font-weight:800;color:#15803d;font-size:16px}
.aa-coupon-code{color:#0f172a;font-size:14px;margin-top:6px}
.aa-coupon-exp{color:#64748b;font-size:12px;margin-top:3px}
.aa-coupon-copy{position:absolute;right:16px;top:50%;transform:translateY(-50%);background:#16a34a;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer;font-size:13px}
@media(max-width:900px){.aa-sch-wrap{grid-template-columns:1fr}.aa-sch-side{position:static;flex-direction:column}.aa-card{grid-template-columns:1fr}.aa-card-info{padding-right:0}.aa-card-qty{border:none;justify-content:flex-start;margin:12px 0}.aa-card-buy{padding-left:0;text-align:left;align-items:flex-start}}
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
    var cnt=document.getElementById('aa-count');if(cnt)cnt.textContent=shown+' Result'+(shown===1?'':'s');
  }
  document.querySelectorAll('#aa-filters .aa-pill[data-quick]').forEach(function(p){p.addEventListener('click',function(){
    if(p.getAttribute('data-quick')==='all'){document.getElementById('aa-f-slot').value='all';monthSel.value='all';}
    document.querySelectorAll('#aa-filters .aa-pill[data-quick]').forEach(function(x){x.classList.remove('active');});
    p.classList.add('active');quick=p.getAttribute('data-quick');apply();});});
  document.getElementById('aa-f-slot').addEventListener('change',apply);
  monthSel.addEventListener('change',apply);
  cards.forEach(function(c){
    var q=c.querySelector('.aa-qval'),a=c.querySelector('.aa-enroll'),base=a?a.getAttribute('data-base'):'';
    function setq(n){q.textContent=n;if(a){a.setAttribute('href',base+(base.indexOf('?')>-1?'&':'?')+'qty='+n);}}
    c.querySelector('.aa-plus').addEventListener('click',function(){setq(parseInt(q.textContent,10)+1);});
    c.querySelector('.aa-minus').addEventListener('click',function(){var n=parseInt(q.textContent,10)-1;if(n<1)n=1;setq(n);});
  });
  var cp=document.querySelector('.aa-coupon-copy');
  if(cp){cp.addEventListener('click',function(){var t=cp.getAttribute('data-code');if(navigator.clipboard){navigator.clipboard.writeText(t);}cp.textContent='✓ Copied';setTimeout(function(){cp.textContent='⧉ Copy';},1500);});}
  apply();
})();
</script>
<?php
	return ob_get_clean();
} );

/* ---- helpers ---- */
if ( ! function_exists('aac_dateish') ) { function aac_dateish($v){ if(is_numeric($v)&&(int)$v>100000000)return true; return $v&&strtotime($v)!==false; } }
if ( ! function_exists('aac_ts') ) { function aac_ts($v){ if(is_numeric($v)&&(int)$v>100000000)return (int)$v; $t=$v?strtotime($v):false; return $t?:0; } }
if ( ! function_exists('aac_daterange') ) { function aac_daterange($s,$e){ if($e&&wp_date('Y-m-d',$e)!==wp_date('Y-m-d',$s)){return wp_date('M j',$s).' - '.wp_date('M j',$e);} return wp_date('M j, Y',$s); } }
if ( ! function_exists('aac_time') ) { function aac_time($s,$e,$tz){ try{ $z=new DateTimeZone($tz); $ds=(new DateTime('@'.$s))->setTimezone($z); $zone=$ds->format('T'); $out=$zone.' • '.$ds->format('h:i A'); if($e){ $de=(new DateTime('@'.$e))->setTimezone($z); $out.=' - '.$de->format('h:i A'); } return $out; }catch(Exception $x){ return wp_date('h:i A',$s); } } }
if ( ! function_exists('aac_initials') ) { function aac_initials($n){ $p=preg_split('/\s+/',trim($n)); $i=strtoupper(substr($p[0],0,1)); if(count($p)>1)$i.=strtoupper(substr(end($p),0,1)); return $i?:'•'; } }
