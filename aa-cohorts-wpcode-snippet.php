<?php
/**
 * Agile Agilist — Auto cohort schedule from the Events Calendar
 * --------------------------------------------------------------
 * Renders the KnowledgeHut-style FILTERABLE cohort table directly from your
 * Easy Events Calendar / WP Event Aggregator events. You update a date ONLY by
 * editing the event's date in wp-admin — the table (and, paired with a Fluent
 * Forms dynamic dropdown, the registration form) stay in sync automatically.
 *
 * INSTALL (one time):
 *   1. Install the free "WPCode" plugin (Code Snippets).
 *   2. WPCode → Add Snippet → "Add Your Custom Code" → type: PHP Snippet.
 *   3. Paste EVERYTHING below. Set "Insert Method" = Auto Insert → "Run Everywhere"
 *      (it only registers a shortcode, so it's safe). Activate.
 *   4. On the course page, replace the static schedule block with:  [aa_cohorts]
 *
 * SHORTCODE OPTIONS (all optional — auto-detected if omitted):
 *   [aa_cohorts category="sa" price="$850" limit="12"]
 *   [aa_cohorts post_type="wp_events" taxonomy="event_categories" date_meta="start_ts"]
 *   [aa_cohorts debug="1"]   ← run once as admin to SEE the detected names + meta keys
 */

add_shortcode( 'aa_cohorts', function ( $atts ) {

	$a = shortcode_atts( array(
		'category'  => 'sa',
		'price'     => '$850',
		'limit'     => 12,
		'post_type' => '',   // auto-detect if blank
		'taxonomy'  => '',   // auto-detect if blank
		'date_meta' => '',   // auto-detect if blank
		'debug'     => '',
	), $atts, 'aa_cohorts' );

	$is_admin_user = current_user_can( 'manage_options' );
	$debug_lines   = array();

	/* ---- 1. Find the category taxonomy that actually holds the slug ---- */
	$taxonomy = $a['taxonomy'];
	$term     = false;
	$tax_candidates = array_filter( array(
		$a['taxonomy'], 'event_category', 'event_categories', 'wp_events_categories',
		'eec_event_category', 'eec_event_categories', 'events_categories',
		'event-categories', 'eec_events_categories', 'event_listing_category',
	) );
	foreach ( $tax_candidates as $tx ) {
		if ( $tx && taxonomy_exists( $tx ) ) {
			$maybe = get_term_by( 'slug', $a['category'], $tx );
			if ( $maybe && ! is_wp_error( $maybe ) ) { $term = $maybe; $taxonomy = $tx; break; }
		}
	}
	$debug_lines[] = 'Category taxonomy: ' . ( $taxonomy ?: 'NOT FOUND' )
		. ' | term "' . $a['category'] . '": ' . ( $term ? ( 'id ' . $term->term_id ) : 'NOT FOUND' );

	/* ---- 2. Resolve the event post type(s) from that taxonomy ---- */
	$post_types = array();
	if ( $a['post_type'] ) {
		$post_types = array( $a['post_type'] );
	} elseif ( $taxonomy && taxonomy_exists( $taxonomy ) ) {
		$tax_obj    = get_taxonomy( $taxonomy );
		$post_types = is_array( $tax_obj->object_type ) ? $tax_obj->object_type : array();
	}
	if ( empty( $post_types ) ) {
		foreach ( array( 'wp_events', 'eec_events', 'events', 'event' ) as $pt ) {
			if ( post_type_exists( $pt ) ) { $post_types[] = $pt; }
		}
	}
	$debug_lines[] = 'Post type(s): ' . ( $post_types ? implode( ', ', $post_types ) : 'NOT FOUND' );

	/* ---- 3. Query the events in that category ---- */
	$q_args = array(
		'post_type'      => $post_types ?: 'any',
		'post_status'    => 'publish',
		'posts_per_page' => 60,
		'no_found_rows'  => true,
	);
	if ( $term ) {
		$q_args['tax_query'] = array( array(
			'taxonomy' => $taxonomy, 'field' => 'term_id', 'terms' => $term->term_id,
		) );
	}
	$events = get_posts( $q_args );
	$debug_lines[] = 'Events found in category: ' . count( $events );

	/* ---- 4. Auto-detect the start-date meta key from the first event ---- */
	$date_meta = $a['date_meta'];
	if ( ! $date_meta && ! empty( $events ) ) {
		$meta = get_post_meta( $events[0]->ID );
		$pref = array( 'start_ts', 'event_start_ts', 'event_start_date', 'start_date',
			'_start_ts', 'eec_event_start_date', 'evcal_srow', 'start_date_time' );
		foreach ( $pref as $k ) {
			if ( isset( $meta[ $k ] ) && aa_is_dateish( $meta[ $k ][0] ) ) { $date_meta = $k; break; }
		}
		if ( ! $date_meta ) { // last resort: any meta key containing "start" with a date-ish value
			foreach ( $meta as $k => $v ) {
				if ( stripos( $k, 'start' ) !== false && aa_is_dateish( $v[0] ) ) { $date_meta = $k; break; }
			}
		}
		if ( $is_admin_user ) {
			$debug_lines[] = 'Meta keys on first event: ' . implode( ', ', array_keys( $meta ) );
		}
	}
	$debug_lines[] = 'Start-date meta key: ' . ( $date_meta ?: 'NOT DETECTED' );

	/* ---- DEBUG output (admins only) ---- */
	if ( $a['debug'] && $is_admin_user ) {
		return '<pre style="background:#0f172a;color:#7dd3fc;padding:16px;border-radius:8px;overflow:auto;font-size:13px">'
			. esc_html( "AA_COHORTS DIAGNOSTIC\n" . implode( "\n", $debug_lines ) ) . '</pre>';
	}

	/* ---- 5. Build rows ---- */
	$rows = array();
	foreach ( $events as $ev ) {
		$raw = $date_meta ? get_post_meta( $ev->ID, $date_meta, true ) : '';
		$ts  = aa_to_ts( $raw );
		if ( ! $ts ) { continue; }
		if ( $ts < strtotime( 'today' ) ) { continue; } // upcoming only
		$dow      = (int) wp_date( 'N', $ts );
		$hour     = (int) wp_date( 'G', $ts );
		$daytype  = ( $dow >= 6 ) ? 'weekend' : 'weekday';
		$slot     = $hour < 12 ? 'morning' : ( $hour < 17 ? 'afternoon' : 'evening' );
		$has_time = (bool) ( $hour || (int) wp_date( 'i', $ts ) );
		$rows[]   = array(
			'id'      => $ev->ID,
			'ts'      => $ts,
			'date'    => wp_date( 'Y-m-d', $ts ),
			'month'   => wp_date( 'Y-m', $ts ),
			'label'   => wp_date( 'M j, Y', $ts ),
			'days'    => wp_date( 'D', $ts ),
			'daytype' => $daytype,
			'slot'    => $has_time ? $slot : '',
			'slotlbl' => $has_time ? ucfirst( $slot ) : 'TBD',
		);
	}
	usort( $rows, function ( $x, $y ) { return $x['ts'] - $y['ts']; } );
	$rows = array_slice( $rows, 0, (int) $a['limit'] );

	/* ---- Fallback if nothing resolved ---- */
	if ( empty( $rows ) ) {
		$msg = $is_admin_user
			? '<div style="border:1px dashed #f59e0b;background:#fffbeb;color:#92400e;padding:14px 18px;border-radius:10px;max-width:1080px;margin:24px auto;font-size:14px">'
				. '<strong>No cohorts rendered.</strong> Run <code>[aa_cohorts debug="1"]</code> as admin to see what was detected, then pass the right <code>post_type</code>/<code>taxonomy</code>/<code>date_meta</code> in the shortcode.<br><br>'
				. esc_html( implode( ' | ', $debug_lines ) ) . '</div>'
			: '<p style="text-align:center;color:#64748b;max-width:1080px;margin:24px auto">New cohort dates are being scheduled — <a href="https://meetings.hubspot.com/john2795">request a date</a>.</p>';
		return $msg;
	}

	/* ---- 6. Render (same markup/styles/JS as the static block) ---- */
	$price = esc_html( $a['price'] );
	$map   = array();
	ob_start(); ?>
<style>
.aa-sched{max-width:1080px;margin:34px auto}
.aa-sched h2{color:#053947;margin:0 0 14px}
.aa-sched-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}
.aa-sched-filters .aa-pill{cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#053947;font-weight:700;font-size:13px;padding:8px 16px;border-radius:30px;transition:all .15s}
.aa-sched-filters .aa-pill:hover{border-color:#0170B9}
.aa-sched-filters .aa-pill.active{background:#053947;color:#fff;border-color:#053947}
.aa-sched-filters select{border:1px solid #cbd5e1;border-radius:8px;padding:8px 12px;font-size:13px;color:#053947;font-weight:600;background:#fff}
.aa-sched-tag{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#0170B9;background:#eff6ff;padding:6px 12px;border-radius:20px}
.aa-sched table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0}
.aa-sched th{background:#053947;color:#fff;font-size:12px;text-transform:uppercase;text-align:left;padding:11px 14px}
.aa-sched td{padding:13px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;vertical-align:middle}
.aa-sched .aa-enroll{display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px}
.aa-sched .aa-empty{padding:26px;text-align:center;color:#64748b;font-size:14px;border:1px solid #e2e8f0;border-top:none}
.aa-sched-count{font-size:13px;color:#64748b;margin:0 0 8px}
@media(max-width:680px){.aa-sched .hide-sm{display:none}}
</style>
<div class="aa-sched" id="cohorts">
  <h2>Upcoming Leading SAFe&reg; cohorts</h2>
  <div class="aa-sched-filters" id="aa-filters">
    <button class="aa-pill active" data-quick="all">All dates</button>
    <button class="aa-pill" data-quick="this-month">This month</button>
    <button class="aa-pill" data-quick="next-month">Next month</button>
    <button class="aa-pill" data-quick="weekend">Weekend</button>
    <button class="aa-pill" data-quick="weekday">Weekday</button>
    <select id="aa-f-slot" aria-label="Time slot"><option value="all">Any time slot</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select>
    <select id="aa-f-month" aria-label="Month"><option value="all">Any month</option></select>
    <span class="aa-sched-tag">&#9679; Live Online Classroom</span>
  </div>
  <p class="aa-sched-count" id="aa-count"></p>
  <table>
    <thead><tr><th>Dates</th><th class="hide-sm">Days</th><th class="hide-sm">Time slot</th><th>Format</th><th>Price (USD)</th><th></th></tr></thead>
    <tbody id="aa-sched-body">
<?php foreach ( $rows as $r ) :
		$map[ $r['id'] ] = $r['label']; ?>
      <tr data-date="<?php echo esc_attr( $r['date'] ); ?>" data-month="<?php echo esc_attr( $r['month'] ); ?>" data-daytype="<?php echo esc_attr( $r['daytype'] ); ?>" data-slot="<?php echo esc_attr( $r['slot'] ); ?>" data-cohort="<?php echo esc_attr( $r['id'] ); ?>">
        <td><strong><?php echo esc_html( $r['label'] ); ?></strong></td><td class="hide-sm"><?php echo esc_html( $r['days'] ); ?></td><td class="hide-sm"><?php echo esc_html( $r['slotlbl'] ); ?></td><td>Live virtual</td><td><?php echo $price; ?></td>
        <td><a class="aa-enroll" href="?cohort=<?php echo esc_attr( $r['id'] ); ?>#enroll-form">Select &amp; enroll &rarr;</a></td>
      </tr>
<?php endforeach; ?>
    </tbody>
  </table>
  <div class="aa-empty" id="aa-empty" style="display:none">No cohorts match those filters. <a href="#cohorts" onclick="document.querySelector('#aa-filters .aa-pill').click();return false;">Reset</a> or <a href="https://meetings.hubspot.com/john2795">request a private cohort</a>.</div>
</div>
<script>
window.AA_COHORTS = <?php echo wp_json_encode( $map ); ?>;
(function(){
  var body=document.getElementById('aa-sched-body');if(!body)return;
  var rows=[].slice.call(body.querySelectorAll('tr'));
  var now=new Date();
  var thisM=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  var nx=new Date(now.getFullYear(),now.getMonth()+1,1);
  var nextM=nx.getFullYear()+'-'+String(nx.getMonth()+1).padStart(2,'0');
  var monthSel=document.getElementById('aa-f-month');
  var months=[];rows.forEach(function(r){var m=r.getAttribute('data-month');if(m&&months.indexOf(m)<0)months.push(m);});
  months.sort().forEach(function(m){var d=new Date(m+'-01T00:00:00');var o=document.createElement('option');o.value=m;o.textContent=d.toLocaleString('en',{month:'long',year:'numeric'});monthSel.appendChild(o);});
  var quick='all';
  function apply(){
    var slot=document.getElementById('aa-f-slot').value,month=monthSel.value,shown=0;
    rows.forEach(function(r){
      var ok=true,m=r.getAttribute('data-month');
      if(quick==='this-month'&&m!==thisM)ok=false;
      if(quick==='next-month'&&m!==nextM)ok=false;
      if(quick==='weekend'&&r.getAttribute('data-daytype')!=='weekend')ok=false;
      if(quick==='weekday'&&r.getAttribute('data-daytype')!=='weekday')ok=false;
      if(slot!=='all'&&r.getAttribute('data-slot')!==slot)ok=false;
      if(month!=='all'&&m!==month)ok=false;
      r.style.display=ok?'':'none';if(ok)shown++;
    });
    document.getElementById('aa-empty').style.display=shown?'none':'block';
    document.getElementById('aa-count').textContent=shown+' cohort'+(shown===1?'':'s')+' shown';
  }
  document.querySelectorAll('#aa-filters .aa-pill').forEach(function(p){p.addEventListener('click',function(){
    document.querySelectorAll('#aa-filters .aa-pill').forEach(function(x){x.classList.remove('active');});
    p.classList.add('active');quick=p.getAttribute('data-quick');apply();});});
  document.getElementById('aa-f-slot').addEventListener('change',apply);
  monthSel.addEventListener('change',apply);
  apply();
})();
</script>
<?php
	return ob_get_clean();
} );

/* Helpers */
function aa_is_dateish( $v ) {
	if ( is_numeric( $v ) && (int) $v > 100000000 ) { return true; } // unix ts
	return $v && strtotime( $v ) !== false;
}
function aa_to_ts( $v ) {
	if ( is_numeric( $v ) && (int) $v > 100000000 ) { return (int) $v; }
	$t = $v ? strtotime( $v ) : false;
	return $t ?: 0;
}
