<?php
/**
 * Agile Agilist — Cohort SCHEDULE (KnowledgeHut-style) from the Events Calendar
 * -----------------------------------------------------------------------------
 * List + Month-Calendar views, filter bar, "Fast Filling" sidebar, optional coupon.
 * All classes are 9:00 AM–5:00 PM EASTERN → shows ET / MT / PT automatically (DST-aware).
 * Click a cohort (card / calendar day / Enroll) → the on-page form EXPANDS, pre-selected,
 * no page reload. Direct ?cohort=<id> links auto-open it too.
 *
 * USE:  [aa_cohorts]
 *       [aa_cohorts price="$850" financing="As low as $109/month"]
 *       [aa_cohorts compare_at="$1,395" discount="40% OFF" coupon="SAFE10" coupon_expires="30/06"]
 *       [aa_cohorts debug="1"]   (admin only)
 *
 * Pinned: post_type wp_events / taxonomy event_category / meta start_ts.
 * Optional per-event meta used if present: trainer, trainer_photo, seats_left.
 */

add_shortcode( 'aa_cohorts', function ( $atts ) {

	$a = shortcode_atts( array(
		'category'=>'sa', 'price'=>'$850', 'compare_at'=>'', 'discount'=>'', 'financing'=>'',
		'coupon'=>'', 'coupon_expires'=>'', 'limit'=>24,
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

	$tzET = new DateTimeZone('America/New_York');
	$rows = array();
	foreach ( $events as $ev ) {
		$ts = $dm ? aac_ts( get_post_meta($ev->ID,$dm,true) ) : 0;
		if ( ! $ts || $ts < strtotime('today') ) { continue; }
		$d_et   = (new DateTime('@'.$ts))->setTimezone($tzET);          // class date in Eastern
		$ymd    = $d_et->format('Y-m-d');
		$dow    = (int) $d_et->format('N');
		$rows[] = array(
			'id'=>$ev->ID, 'ts'=>$ts, 'ymd'=>$ymd,
			'month'=>$d_et->format('Y-m'), 'daytype'=>($dow>=6?'weekend':'weekday'),
			'trainer'=>get_post_meta($ev->ID,'trainer',true), 'trainer_photo'=>get_post_meta($ev->ID,'trainer_photo',true),
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

	$ic_clock = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
	$ic_globe = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></svg>';

	$price = esc_html($a['price']);
	$soonest = $rows[0];
	$map = array(); $caldata = array();

	ob_start(); ?>
<div class="aa-sch-wrap" id="cohorts">
  <div class="aa-sch-main">
    <div class="aa-sch-head"><h2>Schedules</h2><span class="aa-sch-count" id="aa-count"><?php echo count($rows); ?> Results</span>
      <span class="aa-viewtoggle"><button class="aa-vt active" data-view="list">▤ List</button><button class="aa-vt" data-view="cal">▦ Calendar</button></span>
    </div>
    <div class="aa-sch-filters" id="aa-filters">
      <button class="aa-pill" data-quick="this-month">This Month</button>
      <button class="aa-pill" data-quick="next-month">Next Month</button>
      <button class="aa-pill" data-quick="weekend">Weekend</button>
      <button class="aa-pill" data-quick="weekday">Weekday</button>
      <span class="aa-pill aa-pill-static">● Live Online · 9–5 ET</span>
      <select id="aa-f-month" class="aa-sel"><option value="all">▦ Month</option></select>
      <button class="aa-pill aa-pill-reset" data-quick="all">Reset</button>
    </div>

    <div id="aa-cards">
<?php foreach ( $rows as $r ) :
		$map[$r['id']] = aac_daterange($r['ts']);
		$caldata[] = array('id'=>$r['id'],'ymd'=>$r['ymd'],'label'=>aac_daterange($r['ts']),'daytype'=>$r['daytype']);
		$batch = ( $r['daytype']==='weekend' ? 'Weekend Batch' : 'Weekday Batch' );
		$zt = aac_zone_times($r['ymd']);
?>
      <div class="aa-card" data-month="<?php echo esc_attr($r['month']); ?>" data-daytype="<?php echo esc_attr($r['daytype']); ?>" data-date="<?php echo esc_attr($r['ymd']); ?>" data-cohort="<?php echo esc_attr($r['id']); ?>">
        <div class="aa-card-info">
          <span class="aa-badge">☀ Morning</span>
          <div class="aa-card-date"><?php echo esc_html(aac_daterange($r['ts'])); ?></div>
<?php foreach ( $zt as $i=>$z ) : ?>
          <div class="aa-card-time<?php echo $i?' aa-card-time2':''; ?>"><?php echo $i?'':$ic_clock; ?> <span class="aa-tz"><?php echo esc_html($z['lbl']); ?></span> <?php echo esc_html($z['time']); ?></div>
<?php endforeach; ?>
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
<?php $filling = ( $r['seats']!=='' && (int)$r['seats']>0 && (int)$r['seats']<=5 ); ?>
          <div class="aa-buy-row"><?php if ($filling) : ?><span class="aa-filling">⏳ Filling Fast</span><?php endif; ?><a class="aa-enroll" href="?cohort=<?php echo esc_attr($r['id']); ?>#enroll-form">Enroll Now</a></div>
        </div>
      </div>
<?php endforeach; ?>
    </div>

    <div id="aa-cal" style="display:none">
      <div class="aa-cal-head"><button type="button" id="aa-cal-prev" aria-label="previous month">‹</button><span id="aa-cal-title"></span><button type="button" id="aa-cal-next" aria-label="next month">›</button></div>
      <div class="aa-cal-dow"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
      <div class="aa-cal-grid" id="aa-cal-grid"></div>
      <div class="aa-cal-hint">Dates with a cohort are highlighted — click one to register.</div>
    </div>
  </div>

  <aside class="aa-sch-side">
    <div class="aa-side-card">
      <div class="aa-side-title">Fast Filling Schedule</div>
      <div class="aa-side-inner">
        <div class="aa-side-toprow"><span class="aa-badge">☀ Morning</span><?php if ($a['discount']) : ?><span class="aa-disc"><?php echo esc_html($a['discount']); ?></span><?php endif; ?></div>
        <div class="aa-card-date"><?php echo esc_html(aac_daterange($soonest['ts'])); ?></div>
<?php foreach ( aac_zone_times($soonest['ymd']) as $i=>$z ) : ?>
        <div class="aa-card-time<?php echo $i?' aa-card-time2':''; ?>"><?php echo $i?'':$ic_clock; ?> <span class="aa-tz"><?php echo esc_html($z['lbl']); ?></span> <?php echo esc_html($z['time']); ?></div>
<?php endforeach; ?>
        <div class="aa-card-meta"><?php echo $ic_globe; ?> Online Classroom · <?php echo esc_html($soonest['daytype']==='weekend'?'Weekend Batch':'Weekday Batch'); ?></div>
        <div class="aa-side-sep"></div>
        <div class="aa-price"><?php echo $price; ?><?php if ($a['compare_at']) : ?> <s><?php echo esc_html($a['compare_at']); ?></s><?php endif; ?></div>
        <a class="aa-enroll aa-enroll-block" href="?cohort=<?php echo esc_attr($soonest['id']); ?>#enroll-form">Enroll Now</a>
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
.aa-sch-head{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.aa-sch-head h2{margin:0;color:#0f172a;font-size:30px;font-weight:800}
.aa-sch-count{color:#64748b;font-size:14px}
.aa-viewtoggle{margin-left:auto;display:inline-flex;border:1px solid #e2e8f0;border-radius:30px;overflow:hidden}
.aa-vt{border:none;background:#fff;color:#475569;font-weight:700;font-size:13px;padding:8px 16px;cursor:pointer}
.aa-vt.active{background:#0b1320;color:#fff}
.aa-sch-filters{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-bottom:20px}
.aa-sch-filters .aa-pill{cursor:pointer;border:1px solid #e2e8f0;background:#fff;color:#0f172a;font-weight:600;font-size:13px;padding:9px 18px;border-radius:30px;transition:all .15s}
.aa-sch-filters .aa-pill:hover{border-color:#16a34a}
.aa-sch-filters .aa-pill.active{background:#0b1320;color:#fff;border-color:#0b1320}
.aa-sch-filters .aa-pill-static{cursor:default;color:#0e7490;border-color:#a5f3fc;background:#ecfeff}
.aa-sch-filters .aa-pill-reset{color:#64748b}
.aa-sch-filters .aa-sel{border:1px solid #e2e8f0;border-radius:30px;padding:9px 16px;font-size:13px;color:#0f172a;font-weight:600;background:#fff;cursor:pointer}
.aa-card{display:grid;grid-template-columns:1.5fr .7fr 1.05fr;border:1px solid #e6e9ee;border-radius:14px;padding:24px 26px;margin-bottom:18px;align-items:center;cursor:pointer;transition:box-shadow .15s,border-color .15s}
.aa-card:hover{border-color:#16a34a;box-shadow:0 6px 20px rgba(2,44,54,.08)}
.aa-card-info{display:flex;flex-direction:column;gap:5px;padding-right:24px}
.aa-card-qty{display:flex;justify-content:center;border-left:1px solid #eef2f6;border-right:1px solid #eef2f6;height:100%;align-items:center}
.aa-card-buy{padding-left:24px;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.aa-badge{align-self:flex-start;font-size:12px;font-weight:700;padding:4px 13px;border-radius:20px;background:#e7f6ec;color:#15803d;margin-bottom:4px}
.aa-card-date{font-size:21px;font-weight:800;color:#0f172a}
.aa-card-time{font-size:13px;color:#334155;display:flex;align-items:center;gap:6px}
.aa-card-time2{padding-left:20px;color:#64748b}
.aa-tz{display:inline-block;min-width:30px;font-weight:800;color:#0e7490}
.aa-card-meta{font-size:13px;color:#475569;display:flex;align-items:center;gap:6px;margin-top:3px}
.aa-trainer{display:flex;align-items:center;gap:10px;margin-top:10px;font-size:13px;color:#0f172a}
.aa-trainer img,.aa-trainer-ini{width:40px;height:40px;border-radius:50%;object-fit:cover;display:inline-flex;align-items:center;justify-content:center;background:#fda4af;color:#fff;font-weight:800;font-size:14px}
.aa-trainer-role{color:#64748b}
.aa-stepper{display:inline-flex;align-items:center;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.aa-stepper button{width:40px;height:42px;border:none;background:#fff;font-size:18px;cursor:pointer;color:#0f172a}
.aa-stepper button:hover{background:#f1f5f9}
.aa-stepper .aa-qval{width:44px;text-align:center;font-weight:700;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;line-height:42px}
.aa-sale{font-size:13px;color:#dc2626;font-weight:600}
.aa-disc{background:#fee2e2;color:#dc2626;font-weight:800;font-size:12px;padding:3px 9px;border-radius:6px}
.aa-price{font-size:25px;font-weight:800;color:#0f172a}
.aa-price s{font-size:15px;color:#94a3b8;font-weight:600}
.aa-price-sub,.aa-fin{font-size:12px;color:#64748b}
.aa-buy-row{display:flex;align-items:center;gap:12px;margin-top:8px}
.aa-filling{color:#b45309;font-weight:700;font-size:13px;white-space:nowrap}
.aa-enroll{display:inline-block;background:#0b1320;color:#fff;font-weight:800;padding:13px 30px;border-radius:8px;text-decoration:none;font-size:15px}
.aa-enroll:hover{background:#1e293b}
.aa-enroll-block{display:block;text-align:center;margin-top:12px}
.aa-cal-head{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:10px}
.aa-cal-head button{width:38px;height:38px;border:1px solid #e2e8f0;background:#fff;border-radius:50%;font-size:18px;cursor:pointer}
#aa-cal-title{font-weight:800;font-size:18px;color:#0f172a;min-width:180px;text-align:center}
.aa-cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px}
.aa-cal-dow span{text-align:center;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase}
.aa-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.aa-cal-cell{min-height:74px;border:1px solid #eef2f6;border-radius:10px;padding:8px;font-size:13px;color:#94a3b8}
.aa-cal-cell.aa-has{border-color:#16a34a;background:#f0fdf4;color:#0f172a;cursor:pointer}
.aa-cal-cell.aa-has:hover{background:#dcfce7}
.aa-cal-cell .aa-cal-day{font-weight:700}
.aa-cal-cell .aa-cal-tag{display:inline-block;margin-top:6px;font-size:11px;font-weight:700;color:#15803d;background:#dcfce7;border-radius:6px;padding:2px 7px}
.aa-cal-hint{margin-top:10px;font-size:13px;color:#64748b;text-align:center}
.aa-sch-side{position:sticky;top:20px;display:flex;flex-direction:column;gap:16px}
.aa-side-card{border-radius:14px;overflow:hidden;box-shadow:0 6px 20px rgba(2,44,54,.06)}
.aa-side-title{background:#fff7ed;color:#0f172a;font-weight:800;font-size:15px;padding:15px 18px}
.aa-side-inner{padding:18px;border:2px solid #16a34a;border-top:none;border-radius:0 0 14px 14px;display:flex;flex-direction:column;gap:5px}
.aa-side-toprow{display:flex;align-items:center;justify-content:space-between}
.aa-side-sep{height:1px;background:#e6e9ee;margin:12px 0}
.aa-side-all{color:#0e7490;font-weight:700;text-decoration:none;text-align:center;margin-top:12px;font-size:14px}
.aa-coupon{background:#e7f6ec;border-radius:14px;padding:18px 20px;position:relative}
.aa-coupon-amt{font-weight:800;color:#15803d;font-size:16px}
.aa-coupon-code{color:#0f172a;font-size:14px;margin-top:6px}
.aa-coupon-exp{color:#64748b;font-size:12px;margin-top:3px}
.aa-coupon-copy{position:absolute;right:16px;top:50%;transform:translateY(-50%);background:#16a34a;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer;font-size:13px}
.aa-form-hint{max-width:1080px;margin:10px auto;padding:16px 20px;border:1px dashed #16a34a;background:#f0fdf4;color:#15803d;border-radius:12px;font-weight:700;text-align:center}
@media(max-width:900px){.aa-sch-wrap{grid-template-columns:1fr}.aa-sch-side{position:static}.aa-card{grid-template-columns:1fr}.aa-card-info{padding-right:0}.aa-card-qty{border:none;justify-content:flex-start;margin:12px 0}.aa-card-buy{padding-left:0;text-align:left;align-items:flex-start}.aa-cal-cell{min-height:54px}}
</style>
<script>
window.AA_COHORTS=<?php echo wp_json_encode($map); ?>;
window.AA_CAL=<?php echo wp_json_encode($caldata); ?>;
(function(){
  var wrap=document.getElementById('aa-cards');if(!wrap)return;
  var cards=[].slice.call(wrap.querySelectorAll('.aa-card'));

  /* ---- expand-on-click: drive the on-page Fluent form, no reload ---- */
  var formWrap=document.querySelector('.fluentform_wrapper_3')||document.querySelector('.fluentform');
  if(formWrap){var hint=document.createElement('div');hint.id='aa-form-hint';hint.className='aa-form-hint';hint.textContent='👆 Select a cohort above to open registration';formWrap.parentNode.insertBefore(hint,formWrap);formWrap.style.display='none';}
  // Cohort is chosen by clicking the card → hide the now-redundant dropdown (its value still submits & records the date)
  var cohortSel=document.querySelector('select[name="dropdown"]');
  if(cohortSel){var cg=cohortSel.closest('.ff-el-group');if(cg)cg.style.display='none';}
  function selectCohort(id,qty){
    var sel=document.querySelector('select[name="dropdown"]');
    if(sel){sel.value=String(id);sel.dispatchEvent(new Event('change',{bubbles:true}));}
    if(qty){var qf=document.querySelector('input[name="numeric_field"]');if(qf){qf.value=qty;qf.dispatchEvent(new Event('input',{bubbles:true}));}}
    var h=document.getElementById('aa-form-hint');if(h)h.style.display='none';
    if(formWrap)formWrap.style.display='';
    var nm=document.getElementById('aa-cohort-name'),box=document.getElementById('aa-selected-cohort');
    if(nm&&box){nm.textContent=(window.AA_COHORTS[id]||id);box.style.display='block';}
    var t=document.getElementById('enroll-form')||formWrap;if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
  }
  window.aaSelectCohort=selectCohort;
  function cardClick(c,e){if(e&&e.target&&e.target.closest('.aa-stepper'))return;var id=c.getAttribute('data-cohort');var q=c.querySelector('.aa-qval');selectCohort(id,q?q.textContent:1);}
  cards.forEach(function(c){
    c.addEventListener('click',function(e){cardClick(c,e);});
    var en=c.querySelector('.aa-enroll');if(en)en.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();cardClick(c,null);});
    var q=c.querySelector('.aa-qval');
    c.querySelector('.aa-plus').addEventListener('click',function(e){e.stopPropagation();q.textContent=parseInt(q.textContent,10)+1;});
    c.querySelector('.aa-minus').addEventListener('click',function(e){e.stopPropagation();var n=parseInt(q.textContent,10)-1;if(n<1)n=1;q.textContent=n;});
  });
  // sidebar / direct enroll links
  [].slice.call(document.querySelectorAll('.aa-enroll-block')).forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var m=a.getAttribute('href').match(/cohort=(\d+)/);if(m)selectCohort(m[1],1);});});

  /* ---- filters ---- */
  var now=new Date();
  var thisM=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  var nx=new Date(now.getFullYear(),now.getMonth()+1,1);
  var nextM=nx.getFullYear()+'-'+String(nx.getMonth()+1).padStart(2,'0');
  var monthSel=document.getElementById('aa-f-month');
  var months=[];cards.forEach(function(c){var m=c.getAttribute('data-month');if(m&&months.indexOf(m)<0)months.push(m);});
  months.sort().forEach(function(m){var d=new Date(m+'-01T00:00:00');var o=document.createElement('option');o.value=m;o.textContent=d.toLocaleString('en',{month:'long',year:'numeric'});monthSel.appendChild(o);});
  var quick='all';
  function apply(){
    var month=monthSel.value,shown=0;
    cards.forEach(function(c){
      var ok=true,m=c.getAttribute('data-month');
      if(quick==='this-month'&&m!==thisM)ok=false;
      if(quick==='next-month'&&m!==nextM)ok=false;
      if(quick==='weekend'&&c.getAttribute('data-daytype')!=='weekend')ok=false;
      if(quick==='weekday'&&c.getAttribute('data-daytype')!=='weekday')ok=false;
      if(month!=='all'&&m!==month)ok=false;
      c.style.display=ok?'':'none';if(ok)shown++;
    });
    var cnt=document.getElementById('aa-count');if(cnt)cnt.textContent=shown+' Result'+(shown===1?'':'s');
  }
  document.querySelectorAll('#aa-filters .aa-pill[data-quick]').forEach(function(p){p.addEventListener('click',function(){
    if(p.getAttribute('data-quick')==='all'){monthSel.value='all';}
    document.querySelectorAll('#aa-filters .aa-pill[data-quick]').forEach(function(x){x.classList.remove('active');});
    p.classList.add('active');quick=p.getAttribute('data-quick');apply();});});
  monthSel.addEventListener('change',apply);

  /* ---- list/calendar toggle ---- */
  var calBox=document.getElementById('aa-cal'),listBox=document.getElementById('aa-cards'),filterBar=document.getElementById('aa-filters');
  document.querySelectorAll('.aa-vt').forEach(function(b){b.addEventListener('click',function(){
    document.querySelectorAll('.aa-vt').forEach(function(x){x.classList.remove('active');});b.classList.add('active');
    var cal=b.getAttribute('data-view')==='cal';
    calBox.style.display=cal?'':'none';listBox.style.display=cal?'none':'';filterBar.style.display=cal?'none':'';
    if(cal)renderCal();
  });});

  /* ---- month calendar ---- */
  var byDay={};(window.AA_CAL||[]).forEach(function(c){(byDay[c.ymd]=byDay[c.ymd]||[]).push(c);});
  var calY,calM;
  if(window.AA_CAL&&window.AA_CAL.length){var f=window.AA_CAL[0].ymd.split('-');calY=+f[0];calM=+f[1]-1;}else{calY=now.getFullYear();calM=now.getMonth();}
  function renderCal(){
    var grid=document.getElementById('aa-cal-grid');if(!grid)return;
    document.getElementById('aa-cal-title').textContent=new Date(calY,calM,1).toLocaleString('en',{month:'long',year:'numeric'});
    grid.innerHTML='';
    var first=new Date(calY,calM,1).getDay(),days=new Date(calY,calM+1,0).getDate();
    for(var b=0;b<first;b++){var pad=document.createElement('div');grid.appendChild(pad);}
    for(var d=1;d<=days;d++){
      var ymd=calY+'-'+String(calM+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      var cell=document.createElement('div');cell.className='aa-cal-cell';
      var html='<span class="aa-cal-day">'+d+'</span>';
      if(byDay[ymd]){cell.className+=' aa-has';var id=byDay[ymd][0].id;html+='<br><span class="aa-cal-tag">Cohort</span>';cell.addEventListener('click',(function(i){return function(){selectCohort(i,1);};})(id));}
      cell.innerHTML=html;grid.appendChild(cell);
    }
  }
  document.getElementById('aa-cal-prev').addEventListener('click',function(){calM--;if(calM<0){calM=11;calY--;}renderCal();});
  document.getElementById('aa-cal-next').addEventListener('click',function(){calM++;if(calM>11){calM=0;calY++;}renderCal();});

  /* ---- coupon copy ---- */
  var cp=document.querySelector('.aa-coupon-copy');
  if(cp){cp.addEventListener('click',function(){var t=cp.getAttribute('data-code');if(navigator.clipboard){navigator.clipboard.writeText(t);}cp.textContent='✓ Copied';setTimeout(function(){cp.textContent='⧉ Copy';},1500);});}

  /* ---- direct ?cohort= link auto-opens the form ---- */
  var pq=new URLSearchParams(location.search).get('cohort');if(pq&&window.AA_COHORTS[pq]){setTimeout(function(){selectCohort(pq,1);},300);}
  apply();
})();
</script>
<?php
	return ob_get_clean();
} );

/* ---- helpers ---- */
if ( ! function_exists('aac_dateish') ) { function aac_dateish($v){ if(is_numeric($v)&&(int)$v>100000000)return true; return $v&&strtotime($v)!==false; } }
if ( ! function_exists('aac_ts') ) { function aac_ts($v){ if(is_numeric($v)&&(int)$v>100000000)return (int)$v; $t=$v?strtotime($v):false; return $t?:0; } }
if ( ! function_exists('aac_daterange') ) { function aac_daterange($s){ $z=new DateTimeZone('America/New_York'); return (new DateTime('@'.$s))->setTimezone($z)->format('M j, Y'); } }
/* All classes 9:00 AM–5:00 PM Eastern → ET / MT / PT (DST handled automatically) */
if ( ! function_exists('aac_zone_times') ) { function aac_zone_times($ymd){
	$out=array(); $zones=array('ET'=>'America/New_York','MT'=>'America/Denver','PT'=>'America/Los_Angeles');
	$ny=new DateTimeZone('America/New_York');
	try{ $s=new DateTime($ymd.' 09:00:00',$ny); $e=new DateTime($ymd.' 17:00:00',$ny); }catch(Exception $x){ return array(); }
	foreach($zones as $lbl=>$tz){ $z=new DateTimeZone($tz); $ss=clone $s;$ss->setTimezone($z); $ee=clone $e;$ee->setTimezone($z);
		$out[]=array('lbl'=>$lbl,'time'=>$ss->format('h:i A').' - '.$ee->format('h:i A')); }
	return $out;
} }
if ( ! function_exists('aac_initials') ) { function aac_initials($n){ $p=preg_split('/\s+/',trim($n)); $i=strtoupper(substr($p[0],0,1)); if(count($p)>1)$i.=strtoupper(substr(end($p),0,1)); return $i?:'•'; } }
