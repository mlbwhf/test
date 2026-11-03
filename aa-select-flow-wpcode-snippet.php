<?php
/**
 * Agile Agilist — CLASS SELECTION FLOW  [aa_class_flow]
 * ---------------------------------------------------------------------------
 * The "Course Selection Flow" design (design_handoff_mega_menu, html/
 * select-flow.html): pick classes -> pick a date for each -> register or
 * compare. Put [aa_class_flow] on a page at /training/select/.
 *
 * NOTHING ON THIS PAGE IS TYPED IN. The handoff ships placeholder prices,
 * dates and URLs in a JSON file. None of that is used. Every class, price,
 * date and course link comes from the register snippet (AA – Register PHP):
 *   aa_reg_course()    the same course record the course page and the Stripe
 *                      checkout use, so the price shown here is the price
 *                      charged. Never a price the server will not charge.
 *   aa_reg_upcoming()  the same generator the course page's calendar uses,
 *                      so every date here exists there with the same id, and
 *                      ?cohort=<id> on the course page selects it.
 * If the register snippet is off, the shortcode prints nothing rather than a
 * page of guesses.
 *
 * WHAT THE HANDOFF ASKED FOR THAT IS DONE DIFFERENTLY, AND WHY
 *   - No email field. The handoff says so itself: the course-page checkout
 *     collects it, so no personal data touches this page or any URL.
 *   - Checkout goes to <course page>?cohort=<id>&seats=<n>#enroll. #enroll is
 *     the anchor the site's own course cards already use; the handoff's
 *     #register does not exist on these pages.
 *   - The course page did not read a seat count from the URL. The small
 *     course-page script at the bottom of this file applies ?seats= to the
 *     page's own stepper once the date is selected, through the stepper's own
 *     buttons, so the number the buyer saw here is the number at checkout.
 *   - Seat stepper caps at aa_reg_max_seats() (12), the server's per-order
 *     ceiling, not the handoff's 20. A 20 would be refused at payment.
 *   - Prerequisites / Best for / Who rows are left out of the compare table.
 *     There is no confirmed source for them yet and they are not invented. The
 *     table shows price, length, format, exam, your date, upcoming dates and
 *     the course's own description. Add a 'prereq' value through the
 *     aa_fl_course filter and its row appears.
 *   - Several classes = one payment per class, in turn (handoff FLOW.md §6).
 *     The rest of the list waits in sessionStorage (class ids, cohort ids,
 *     seats, names -- never email). After paying for one, the confirmation
 *     page offers "Continue to <next class>".
 *
 * Page is noindex,follow: its state lives in the URL (?classes=&cohorts=, ids
 * only). Every fact on it is also on the course pages, which stay indexable.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Off switch, so this can be disabled without deleting the snippet. */
function aa_fl_enabled() { return true; }

/**
 * Which classes the flow offers, in this order. Slugs as the register snippet
 * knows them. The design's "Core" set plus RTE, which the design also gave
 * dates and a price.
 */
function aa_fl_class_slugs() {
	return apply_filters( 'aa_fl_classes', array( 'sa', 'scrum-master', 'popm', 'devops', 'team-practitioner', 'rte' ) );
}

/** How many upcoming dates each class shows. RTE alone has 80+. */
function aa_fl_dates_per_class() { return 8; }

/** "Mon–Wed" from the real span (which skips weekends where the course does). */
function aa_fl_days_label( $start, $end, $days ) {
	$span = function_exists( 'aa_reg_span_dates' ) ? (array) aa_reg_span_dates( $start, $days ) : array();
	$a    = $span ? reset( $span ) : $start;
	$b    = $span ? end( $span ) : $end;
	$fa   = gmdate( 'D', strtotime( $a ) );
	$fb   = gmdate( 'D', strtotime( $b ) );
	return $fa === $fb ? $fa : $fa . '–' . $fb;
}

/** One class, resolved from the live course record. Null if it cannot be sold. */
function aa_fl_course( $slug ) {
	if ( ! function_exists( 'aa_reg_course' ) || ! function_exists( 'aa_reg_upcoming' ) ) { return null; }
	$c = aa_reg_course( $slug );
	if ( ! is_array( $c ) || empty( $c['price'] ) || empty( $c['url'] ) ) { return null; }

	$days  = max( 1, (int) ( isset( $c['days'] ) ? $c['days'] : 1 ) );
	$cur   = isset( $c['currency'] ) ? $c['currency'] : 'usd';
	$price = function_exists( 'aa_reg_money' ) ? aa_reg_money( $c['price'], $cur ) : '$' . number_format( (float) $c['price'] );
	$proof = isset( $c['proof'] ) ? implode( ' ', (array) $c['proof'] ) : '';

	/* From tomorrow (Eastern, the timezone the schedule is written in). A class
	   that starts today is still on the course page for someone already
	   registered, but it is not something to send a new buyer to pay for. */
	$tomorrow = ( new DateTime( 'tomorrow', new DateTimeZone( 'America/New_York' ) ) )->format( 'Y-m-d' );

	$cohorts = array();
	foreach ( aa_reg_upcoming( $slug, $c ) as $h ) {
		if ( (string) $h['start'] < $tomorrow ) { continue; }
		if ( count( $cohorts ) >= aa_fl_dates_per_class() ) { break; }
		$slot = isset( $h['slot'] ) ? $h['slot'] : 'morning';
		$cohorts[] = array(
			'id'    => (string) $h['id'],
			'start' => (string) $h['start'],
			'end'   => (string) $h['end'],
			'label' => function_exists( 'aa_reg_range' ) ? aa_reg_range( $h['start'], $h['end'], true ) : $h['start'],
			'days'  => aa_fl_days_label( $h['start'], $h['end'], $days ),
			'time'  => function_exists( 'aa_reg_slot_hours' ) ? aa_reg_slot_hours( $slot ) : '',
		);
	}

	/* A CODE HAS TO LOOK LIKE A CODE TO BE SHOWN. The hand table carries real
	   credential codes (SA, SSM, RTE). A course derived from its page has its
	   code manufactured from the page title, which can come out as a sentence
	   in capitals; that is a title, not a chip, so the chip is left off. Same
	   rule the home-page track strip uses. */
	$code = isset( $c['code'] ) ? trim( (string) $c['code'] ) : '';
	if ( ! preg_match( '/^[A-Z0-9][A-Z0-9-]{1,7}$/', $code ) ) { $code = ''; }

	$out = array(
		'id'       => (string) $slug,
		'name'     => (string) $c['name'],
		'code'     => $code,
		'url'      => home_url( $c['url'] ),
		'price'    => $price,
		'length'   => $days === 1 ? __( '1 day', 'aa-fl' ) : sprintf( __( '%d days', 'aa-fl' ), $days ),
		'format'   => __( 'Live online', 'aa-fl' ),
		'exam'     => stripos( $proof, 'exam' ) !== false ? __( 'Included', 'aa-fl' ) : '',
		'about'    => function_exists( 'aa_reg_blurb' ) ? aa_reg_blurb( $c, 150 ) : '',
		'prereq'   => '',
		'cohorts'  => $cohorts,
	);
	return apply_filters( 'aa_fl_course', $out, $slug, $c );
}

/** All flow classes that resolve and have at least one future date. */
function aa_fl_courses() {
	static $memo = null;
	if ( $memo !== null ) { return $memo; }
	$memo = array();
	foreach ( aa_fl_class_slugs() as $slug ) {
		$c = aa_fl_course( $slug );
		if ( $c && $c['cohorts'] ) { $memo[ $c['id'] ] = $c; }
	}
	return $memo;
}

/** Does the page being served carry the flow? Cheap, and memoised per request. */
function aa_fl_page_has_flow() {
	static $has = null;
	if ( $has !== null ) { return $has; }
	$has = false;
	if ( is_singular() ) {
		$p = get_post();
		/* strpos first: has_shortcode() runs the full shortcode regex over the
		   content, and this is asked on every page view. */
		$has = $p && strpos( (string) $p->post_content, '[aa_class_flow' ) !== false
		    && has_shortcode( (string) $p->post_content, 'aa_class_flow' );
	}
	return $has;
}

/**
 * TWO FONT FAMILIES, NOT THREE. The design names Instrument Sans, Instrument
 * Serif and IBM Plex Mono. The mono face is used for four short uppercase
 * labels at 10.5px, where ui-monospace is indistinguishable -- so it is not
 * fetched, and the stack falls through to the system mono. One fewer font
 * file on a page whose whole job is to get someone to checkout.
 */
function aa_fl_fonts() {
	wp_enqueue_style( 'aa-fl-fonts', 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap', array(), null );
}

/* Preconnect to the font hosts from <head>, so the DNS and TLS handshakes are
   done by the time the stylesheet printed in the footer asks for the files.
   Only on the page that carries the flow. */
add_filter( 'wp_resource_hints', 'aa_fl_resource_hints', 10, 2 );
function aa_fl_resource_hints( $urls, $relation ) {
	if ( $relation === 'preconnect' && aa_fl_enabled() && aa_fl_page_has_flow() ) {
		$urls[] = array( 'href' => 'https://fonts.googleapis.com' );
		$urls[] = array( 'href' => 'https://fonts.gstatic.com', 'crossorigin' => 'anonymous' );
	}
	return $urls;
}

/** Compare table: a real <table>, readable with JS off. */
function aa_fl_table( $courses ) {
	$rows = array(
		'price'  => __( 'Price per seat', 'aa-fl' ),
		'length' => __( 'Length', 'aa-fl' ),
		'format' => __( 'Format', 'aa-fl' ),
		'exam'   => __( 'Exam', 'aa-fl' ),
		'prereq' => __( 'Prerequisites', 'aa-fl' ),
		'about'  => __( 'About', 'aa-fl' ),
	);
	$h  = '<div class="aa-fl__scroll"><table class="aa-fl__table"><caption style="position:absolute;left:-9999px">'
	    . esc_html__( 'Classes compared', 'aa-fl' ) . '</caption><thead><tr><td></td>';
	foreach ( $courses as $id => $c ) {
		$h .= '<th scope="col" data-col="' . esc_attr( $id ) . '"><a href="' . esc_url( $c['url'] ) . '">'
		    . esc_html( $c['name'] ) . '</a><button type="button" class="aa-fl__regone" data-reg="' . esc_attr( $id ) . '">'
		    . esc_html__( 'Register this one', 'aa-fl' ) . '</button></th>';
	}
	$h .= '</tr></thead><tbody>';
	$h .= '<tr data-js data-keep hidden><th scope="row">' . esc_html__( 'Your date', 'aa-fl' ) . '</th>';
	foreach ( $courses as $id => $c ) { $h .= '<td data-col="' . esc_attr( $id ) . '" data-yourdate></td>'; }
	$h .= '</tr>';
	foreach ( $rows as $key => $label ) {
		$any = false;
		foreach ( $courses as $c ) { if ( (string) $c[ $key ] !== '' ) { $any = true; break; } }
		if ( ! $any ) { continue; }   // a row with nothing confirmed in it is not shown
		$h .= '<tr><th scope="row">' . esc_html( $label ) . '</th>';
		foreach ( $courses as $id => $c ) {
			$v  = (string) $c[ $key ];
			$h .= '<td data-col="' . esc_attr( $id ) . '">' . ( $key === 'price' ? '<bdi>' . esc_html( $v ) . '</bdi>' : esc_html( $v ) ) . '</td>';
		}
		$h .= '</tr>';
	}
	$h .= '<tr data-keep><th scope="row">' . esc_html__( 'Upcoming dates', 'aa-fl' ) . '</th>';
	foreach ( $courses as $id => $c ) {
		$h .= '<td data-col="' . esc_attr( $id ) . '">';
		foreach ( array_slice( $c['cohorts'], 0, 4 ) as $k ) {
			$h .= '<time datetime="' . esc_attr( $k['start'] ) . '">' . esc_html( $k['label'] ) . '</time> ('
			    . esc_html( $k['days'] ) . ')<br>';
		}
		$h .= '</td>';
	}
	$h .= '</tr></tbody></table></div>';
	return $h;
}

add_shortcode( 'aa_class_flow', 'aa_fl_shortcode' );

function aa_fl_shortcode( $atts ) {
	if ( ! aa_fl_enabled() ) { return ''; }
	$courses = aa_fl_courses();
	if ( ! $courses ) { return ''; }
	aa_fl_fonts();
	$max = function_exists( 'aa_reg_max_seats' ) ? (int) aa_reg_max_seats() : 12;

	$h  = aa_fl_assets();
	/* lang on the root, because the copy in this block is English whatever the
	   page around it is -- the flow is English-only until its strings are
	   translated. A screen reader and a translator both read this attribute. */
	$h .= '<div class="aa-fl" lang="en" data-aa-fl data-max-seats="' . (int) $max . '">';

	/* Progress */
	$steps = array(
		1 => array( __( 'Classes', 'aa-fl' ), __( 'None yet', 'aa-fl' ) ),
		2 => array( __( 'Dates', 'aa-fl' ), __( 'Per class', 'aa-fl' ) ),
		3 => array( __( 'Register or compare', 'aa-fl' ), __( 'Register', 'aa-fl' ) ),
	);
	$h .= '<nav class="aa-fl__steps" aria-label="' . esc_attr__( 'Progress', 'aa-fl' ) . '"><ol>';
	foreach ( $steps as $n => $s ) {
		$h .= '<li><button type="button" class="aa-fl__stepbtn" data-go="' . (int) $n . '" aria-current="' . ( $n === 1 ? 'step' : 'false' ) . '">'
		    . '<span class="aa-fl__num">' . (int) $n . '</span><span class="aa-fl__stt"><b>' . esc_html( $s[0] ) . '</b>'
		    . '<small data-sub="' . (int) $n . '">' . esc_html( $s[1] ) . '</small></span></button></li>';
	}
	$h .= '</ol></nav>';

	/* Step 1: classes */
	$h .= '<section class="aa-fl__step" data-step="1" aria-labelledby="aa-fl-h1">'
	    . '<p class="aa-fl__eyebrow">' . esc_html__( 'Step 1 · Classes', 'aa-fl' ) . '</p>'
	    . '<h2 id="aa-fl-h1" tabindex="-1">' . esc_html__( 'Which classes do you need?', 'aa-fl' ) . '</h2>'
	    . '<p class="aa-fl__lede">' . esc_html__( 'Pick one or several. Next you choose a date for each. You can compare before you pay.', 'aa-fl' ) . '</p>'
	    . '<ul class="aa-fl__cards">';
	$i = 0;
	foreach ( $courses as $id => $c ) {
		$next = $c['cohorts'][0];
		$h .= '<li class="aa-fl__card" style="--i:' . (int) $i++ . '">'
		    . '<input class="aa-fl__chk" type="checkbox" id="aa-fl-c-' . esc_attr( $id ) . '" value="' . esc_attr( $id ) . '"'
		    . ' data-name="' . esc_attr( $c['name'] ) . '" data-url="' . esc_url( $c['url'] ) . '" data-price="' . esc_attr( $c['price'] ) . '">'
		    . '<h3><label for="aa-fl-c-' . esc_attr( $id ) . '">' . esc_html( $c['name'] ) . '</label></h3>'
		    . ( $c['about'] !== '' ? '<p class="aa-fl__who">' . esc_html( $c['about'] ) . '</p>' : '' )
		    . '<div class="aa-fl__meta">' . ( $c['code'] !== '' ? '<span class="aa-fl__code">' . esc_html( $c['code'] ) . '</span>' : '' ) . '<span>' . esc_html( $c['length'] ) . '</span>'
		    . '<span aria-hidden="true">·</span><span>' . esc_html__( 'Next', 'aa-fl' ) . ' <time datetime="' . esc_attr( $next['start'] ) . '">' . esc_html( $next['label'] ) . '</time></span>'
		    . '<bdi class="aa-fl__price">' . esc_html( $c['price'] ) . '</bdi></div>'
		    . '<span class="aa-fl__box" aria-hidden="true"></span></li>';
	}
	$h .= '</ul></section>';

	/* Step 2: dates */
	$h .= '<section class="aa-fl__step is-off" data-step="2" aria-labelledby="aa-fl-h2">'
	    . '<p class="aa-fl__eyebrow">' . esc_html__( 'Step 2 · Dates', 'aa-fl' ) . '</p>'
	    . '<h2 id="aa-fl-h2" tabindex="-1">' . esc_html__( 'Choose a date for each class.', 'aa-fl' ) . '</h2>'
	    . '<p class="aa-fl__lede">' . esc_html__( 'We’ve picked the soonest date. Change any of them. Dates that overlap are flagged.', 'aa-fl' ) . '</p>';
	foreach ( $courses as $id => $c ) {
		$h .= '<fieldset class="aa-fl__cls" data-id="' . esc_attr( $id ) . '"><legend><strong>' . esc_html( $c['name'] ) . '</strong>'
		    . ( $c['code'] !== '' ? '<span class="aa-fl__code">' . esc_html( $c['code'] ) . '</span>' : '' )
		    . '<button type="button" class="aa-fl__rm aa-fl__js" data-rm="' . esc_attr( $id ) . '">' . esc_html__( 'Remove', 'aa-fl' ) . '</button></legend>'
		    . '<div class="aa-fl__dates" role="radiogroup" aria-label="' . esc_attr( $c['name'] ) . '">';
		foreach ( $c['cohorts'] as $k ) {
			$h .= '<label class="aa-fl__date" data-state="open"><input class="aa-fl__rad" type="radio" name="aa-fl-d-' . esc_attr( $id ) . '"'
			    . ' value="' . esc_attr( $k['id'] ) . '" data-start="' . esc_attr( $k['start'] ) . '" data-end="' . esc_attr( $k['end'] ) . '"'
			    . ' data-label="' . esc_attr( $k['label'] ) . '" data-days="' . esc_attr( $k['days'] ) . '">'
			    . '<span class="aa-fl__range"><time datetime="' . esc_attr( $k['start'] ) . '">' . esc_html( $k['label'] ) . '</time></span>'
			    . '<span class="aa-fl__dk">' . esc_html( $k['days'] . ( $k['time'] !== '' ? ' · ' . $k['time'] : '' ) ) . '</span>'
			    . '<span class="aa-fl__seats">' . esc_html__( 'Seats available', 'aa-fl' ) . '</span>'
			    . '<span class="aa-fl__tick" aria-hidden="true"></span></label>';
		}
		$h .= '</div><p class="aa-fl__alert" role="alert"></p>'
		    . '<p class="aa-fl__help" style="margin-top:8px"><a href="' . esc_url( $c['url'] . '#enroll' ) . '" style="color:var(--teal);font-weight:600;text-decoration:underline">'
		    . esc_html__( 'More dates on the course page', 'aa-fl' ) . '</a></p></fieldset>';
	}
	$h .= '</section>';

	/* Step 3: register or compare */
	$h .= '<section class="aa-fl__step is-off" data-step="3" aria-labelledby="aa-fl-h3">'
	    . '<p class="aa-fl__eyebrow">' . esc_html__( 'Step 3 · Decide', 'aa-fl' ) . '</p>'
	    . '<h2 id="aa-fl-h3" tabindex="-1">' . esc_html__( 'Register now, or compare first.', 'aa-fl' ) . '</h2>'
	    . '<div class="aa-fl__tabs" role="tablist" aria-label="' . esc_attr__( 'Next action', 'aa-fl' ) . '">'
	    . '<button type="button" role="tab" class="aa-fl__tab" data-mode="register" aria-selected="true">' . esc_html__( 'Register', 'aa-fl' ) . '</button>'
	    . '<button type="button" role="tab" class="aa-fl__tab" data-mode="compare" aria-selected="false">' . esc_html__( 'Compare', 'aa-fl' ) . ' (<span data-n>0</span>)</button></div>'
	    . '<div class="aa-fl__panel" data-panel="register"><div class="aa-fl__reg"><div><ul class="aa-fl__rows"></ul>'
	    . '<div class="aa-fl__seatrow"><span>' . esc_html__( 'Seats per class', 'aa-fl' ) . '</span><span class="aa-fl__stepper">'
	    . '<button type="button" data-seat="-1" aria-label="' . esc_attr__( 'Fewer seats', 'aa-fl' ) . '">−</button><output aria-live="polite">1</output>'
	    . '<button type="button" data-seat="1" aria-label="' . esc_attr__( 'More seats', 'aa-fl' ) . '">+</button></span></div></div>'
	    . '<div class="aa-fl__side"><p class="aa-fl__eyebrow" style="margin:0">' . esc_html__( 'Next', 'aa-fl' ) . '</p>'
	    . '<p class="aa-fl__help" data-multi hidden></p>'
	    . '<div class="aa-fl__alert aa-fl__ralert" role="alert"></div>'
	    . '<button type="button" class="aa-fl__go">' . esc_html__( 'Continue to payment', 'aa-fl' ) . ' <span class="aa-fl__arrow" aria-hidden="true">⟶</span></button>'
	    . '<p class="aa-fl__help">' . esc_html__( 'Secure payment opens in this tab. You enter your email there, and your total is confirmed there. Not ready?', 'aa-fl' )
	    . ' <button type="button" data-gocmp>' . esc_html__( 'Compare classes', 'aa-fl' ) . '</button> ' . esc_html__( 'first.', 'aa-fl' ) . '</p></div>'
	    . '</div></div>'
	    . '<div class="aa-fl__panel is-off" data-panel="compare">'
	    . '<label class="aa-fl__diff aa-fl__js"><input type="checkbox"> ' . esc_html__( 'Show differences only', 'aa-fl' ) . '</label>'
	    . aa_fl_table( $courses )
	    . '<p class="aa-fl__help aa-fl__cmpnote" hidden style="margin-top:10px">' . esc_html__( 'These classes match on every row. Switch off “differences only” to see the details.', 'aa-fl' ) . '</p>'
	    . '</div></section>';

	/* Sticky bar */
	$h .= '<div class="aa-fl__bar"><button type="button" class="aa-fl__back" hidden>' . esc_html__( 'Back', 'aa-fl' ) . '</button>'
	    . '<p class="aa-fl__msg" role="status" aria-live="polite">' . esc_html__( 'Select at least one class', 'aa-fl' ) . '</p>'
	    . '<button type="button" class="aa-fl__next" disabled>' . esc_html__( 'Choose dates', 'aa-fl' ) . ' (0) <span class="aa-fl__arrow" aria-hidden="true">⟶</span></button></div>';

	$h .= '</div>';
	return $h;
}

/* noindex,follow on the page that carries the flow: its state is in the URL. */
add_filter( 'wp_robots', 'aa_fl_robots' );
function aa_fl_robots( $robots ) {
	if ( aa_fl_page_has_flow() ) {
		$robots['noindex'] = true;
		$robots['follow']  = true;
		unset( $robots['index'] );
	}
	return $robots;
}

/* ---------------------------------------------------------------------------
   COURSE PAGE + CONFIRMATION PAGE HELPERS
   1. Course page, arriving with ?cohort=<id>&seats=<n>: once the page's own
      picker has selected that date, press its "+" n-1 times, so the seat
      count at checkout is the one chosen in the flow. Uses the page's own
      buttons, so its own caps and price display stay in charge.
   2. Confirmation page: if more classes are queued from the flow, offer the
      next one. Nothing personal is stored -- class, date id, seats, name.
   --------------------------------------------------------------------------- */
add_action( 'wp_footer', 'aa_fl_footer_helpers', 30 );
function aa_fl_footer_helpers() {
	if ( ! aa_fl_enabled() || ! is_singular() ) { return; }
	$p = get_post();
	if ( ! $p ) { return; }
	$content = (string) $p->post_content;
	$confirm = $p->post_name === apply_filters( 'aa_reg_confirm_page_slug', 'registration-confirmed' );
	/* THE COURSE-PAGE HELPER IS PRINTED ONLY WHEN THE URL CARRIES A SEAT COUNT.
	   It has one job -- apply ?seats= from the flow -- and a course page reached
	   any other way has nothing for it to do, so it should not cost those
	   visitors a kilobyte of script. Gating on the query string is safe here
	   because a URL with a query string is served fresh, not from the full-page
	   cache, so the gate is answered per request. */
	$course  = ! $confirm
	        && isset( $_GET['cohort'], $_GET['seats'] ) && (int) $_GET['seats'] > 1
	        && strpos( $content, 'id="aa-cohorts"' ) !== false;
	if ( ! $course && ! $confirm ) { return; }
	?>
<script>
(function(){
  var P;try{P=new URLSearchParams(location.search)}catch(e){return}
  <?php if ( $course ) : ?>
  var want=P.get('cohort'),n=parseInt(P.get('seats'),10);
  if(want&&n>1){
    n=Math.min(n,<?php echo (int) ( function_exists( 'aa_reg_max_seats' ) ? aa_reg_max_seats() : 12 ); ?>);
    var tries=0,done={};
    var t=setInterval(function(){
      tries++;
      var cal=document.getElementById('aacal');
      if(cal&&!done.cal){
        var card=cal.querySelector('.aacal-card.is-on');
        if(card&&card.getAttribute('data-cohort')===want){
          var plus=cal.querySelector('[data-seats="1"]');
          if(plus){for(var i=1;i<n;i++)plus.click()}
          done.cal=1;
        }
      }
      [].forEach.call(document.querySelectorAll('[data-aa-inline]'),function(f,ix){
        if(done['f'+ix]||f.getAttribute('data-cohort')!==want)return;
        var p=f.querySelector('[data-inline-seats="1"]');
        if(p){for(var i=1;i<n;i++)p.click()}
        done['f'+ix]=1;
      });
      if(tries>40||(done.cal&&Object.keys(done).length>1))clearInterval(t);
    },250);
  }
  <?php endif; ?>
  <?php if ( $confirm ) : ?>
  if(!P.get('order'))return;
  var q;try{q=JSON.parse(sessionStorage.getItem('aa_fl_queue')||'[]')}catch(e){q=[]}
  if(!q||!q.length)return;
  var nx=q[0];if(!nx||!nx.url||!nx.cohort)return;
  var href=nx.url+(nx.url.indexOf('?')>-1?'&':'?')+'cohort='+encodeURIComponent(nx.cohort)+'&seats='+(parseInt(nx.seats,10)||1)+'#enroll';
  var box=document.createElement('div');
  box.setAttribute('role','region');box.setAttribute('aria-label','<?php echo esc_js( __( 'Your next class', 'aa-fl' ) ); ?>');
  box.style.cssText='position:sticky;bottom:0;z-index:50;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:center;padding:14px 16px calc(14px + env(safe-area-inset-bottom));background:#0B2E35;color:#fff;font-size:15px';
  var t=document.createElement('span');t.textContent='<?php echo esc_js( __( 'Next on your list:', 'aa-fl' ) ); ?> '+(nx.name||'')+(nx.label?' · '+nx.label:'');
  var a=document.createElement('a');a.href=href;a.textContent='<?php echo esc_js( __( 'Continue to this class', 'aa-fl' ) ); ?> ⟶';
  a.style.cssText='display:inline-flex;align-items:center;min-height:48px;padding:0 22px;border-radius:100px;background:#8FCFCF;color:#0B2E35;font-weight:700;text-decoration:none';
  a.addEventListener('click',function(){try{sessionStorage.setItem('aa_fl_queue',JSON.stringify(q.slice(1)))}catch(e){}});
  var x=document.createElement('button');x.type='button';x.textContent='<?php echo esc_js( __( 'Not now', 'aa-fl' ) ); ?>';
  x.style.cssText='min-height:44px;padding:0 14px;border:1px solid rgba(143,207,207,.5);border-radius:100px;background:transparent;color:#fff;font:inherit;cursor:pointer';
  x.addEventListener('click',function(){try{sessionStorage.removeItem('aa_fl_queue')}catch(e){}box.remove()});
  box.appendChild(t);box.appendChild(a);box.appendChild(x);document.body.appendChild(box);
  <?php endif; ?>
})();
</script>
	<?php
}

/** CSS + JS, printed once with the first flow on the page. */
function aa_fl_assets() {
	static $done = false;
	if ( $done ) { return ''; }
	$done = true;
	ob_start();
	?>
<style id="aa-fl-css">
.aa-fl{--ink:#0B2E35;--teal:#0E8074;--mint:#8FCFCF;--mist:#B9DCDC;--line:#DCEAE8;--soft:#F6FAF9;--mute:#5C7479;--warn:#B3541E;position:relative;font-family:"Instrument Sans",system-ui,sans-serif;color:var(--ink);background:#fff;border:1px solid #CFE3E1;border-radius:20px;overflow:clip;box-shadow:0 30px 70px rgba(11,46,53,.14);-webkit-font-smoothing:antialiased;max-width:1100px;margin:0 auto}
.aa-fl *{box-sizing:border-box}
.aa-fl button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.aa-fl a{color:inherit;text-decoration:none}
.aa-fl :focus-visible{outline:2px solid var(--teal);outline-offset:2px}
.aa-fl [hidden]{display:none!important}
.aa-fl__eyebrow{margin:0 0 8px;font:600 10.5px/1.2 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--teal)}
.aa-fl__steps{background:var(--soft);border-bottom:1px solid #E6EFEE;overflow-x:auto;scrollbar-width:none}
.aa-fl__steps::-webkit-scrollbar{display:none}
.aa-fl__steps ol{list-style:none;margin:0;padding:14px clamp(10px,2vw,20px);display:flex;gap:6px}
.aa-fl__steps li{margin:0}
.aa-fl__stepbtn{display:flex;align-items:center;gap:10px;min-height:52px;padding:0 16px 0 10px;border:0;border-radius:100px;background:transparent;color:var(--ink);text-align:start;white-space:nowrap;transition:background .3s,color .3s}
.aa-fl__stepbtn[aria-current=step]{background:var(--ink);color:#fff}
.aa-fl__stepbtn:disabled{opacity:.45;cursor:not-allowed}
.aa-fl__num{flex:none;width:28px;height:28px;border-radius:50%;background:#DCEAE8;color:#35555B;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;transition:background .3s}
.aa-fl__stepbtn[aria-current=step] .aa-fl__num{background:var(--mint);color:var(--ink)}
.aa-fl__stepbtn.is-done .aa-fl__num{background:var(--teal);color:#fff;font-size:0}
.aa-fl__stepbtn.is-done .aa-fl__num::before{content:"✓";font-size:13px}
.aa-fl__stt{display:flex;flex-direction:column;gap:1px}.aa-fl__stt b{font-size:14.5px;font-weight:600}.aa-fl__stt small{font-size:12px;opacity:.75}
.aa-fl__step{padding:clamp(16px,3vw,28px) clamp(14px,3vw,28px) 24px}
.aa-fl__step.is-off{display:none}
.aa-fl.is-ready .aa-fl__step:not(.is-off){animation:aaflIn .4s cubic-bezier(.2,.7,.2,1) backwards}
.aa-fl__step h2{margin:0 0 6px;font:400 clamp(28px,4.4vw,40px)/1.05 "Instrument Serif",Georgia,serif;letter-spacing:-.01em;outline:0;color:var(--ink)}
.aa-fl__lede{margin:0 0 20px;font-size:15px;line-height:1.55;color:#35555B;max-width:60ch}
.aa-fl__cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:10px}
.aa-fl__card{position:relative;display:flex;flex-direction:column;gap:12px;padding:16px;margin:0;border:1px solid var(--line);border-radius:14px;background:#fff;transition:border-color .25s,background .25s,transform .25s,box-shadow .25s}
.aa-fl.is-ready .aa-fl__card{animation:aaflCard .45s cubic-bezier(.2,.7,.2,1) backwards;animation-delay:calc(var(--i,0)*45ms)}
.aa-fl__card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(11,46,53,.08)}
.aa-fl__card.is-on{border-color:var(--teal);background:#F2FAF9}
.aa-fl__chk,.aa-fl__rad{position:absolute;opacity:0;width:1px;height:1px;margin:0;pointer-events:none}
.aa-fl__card h3{margin:0;padding-inline-end:36px;font-size:16px;font-weight:600;line-height:1.25;color:var(--ink)}
.aa-fl__card h3 label{cursor:pointer}
.aa-fl__card h3 label::after{content:"";position:absolute;inset:0;border-radius:14px}
.aa-fl__chk:focus-visible~h3 label::after,.aa-fl__rad:focus-visible~.aa-fl__range{outline:2px solid var(--teal);outline-offset:2px}
.aa-fl__who{margin:0;font-size:13px;line-height:1.45;color:var(--mute)}
.aa-fl__meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:12.5px;color:#35555B}
.aa-fl__code{font:600 10.5px "IBM Plex Mono",monospace;padding:2px 7px;border-radius:6px;background:#EEF7F6}
.aa-fl__price{margin-inline-start:auto;font-weight:600;color:var(--ink)}
.aa-fl__box{position:absolute;top:16px;inset-inline-end:16px;width:26px;height:26px;border-radius:8px;border:1.5px solid #BFD9D5;background:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;transition:background .2s,border-color .2s}
.aa-fl__card.is-on .aa-fl__box{background:var(--teal);border-color:var(--teal)}
.aa-fl__card.is-on .aa-fl__box::before{content:"✓"}
.aa-fl__cls{margin:0 0 14px;padding:16px;border:1px solid var(--line);border-radius:16px;background:#fff;min-width:0}
.aa-fl__cls.is-off{display:none}
.aa-fl__cls legend{display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap;width:100%;padding:0;margin:0 0 12px;float:left}
.aa-fl__cls legend+*{clear:both}
.aa-fl__cls legend strong{font-size:17px;font-weight:600;letter-spacing:-.01em}
.aa-fl__rm{margin-inline-start:auto;min-height:44px;padding:0 8px;border:0;background:transparent;color:var(--mute);font-size:13px;font-weight:600;text-decoration:underline;text-underline-offset:3px}
.aa-fl__dates{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 6px;scroll-snap-type:x proximity;scrollbar-width:none;clear:both}
.aa-fl__dates::-webkit-scrollbar{display:none}
.aa-fl:not(.is-ready) .aa-fl__dates{flex-wrap:wrap}
.aa-fl__date{position:relative;flex:0 0 min(78%,200px);scroll-snap-align:start;display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-height:92px;padding:13px 14px;margin:0;border:1px solid var(--line);border-radius:13px;background:#fff;cursor:pointer;transition:border-color .2s,background .2s,box-shadow .2s}
.aa-fl__date.is-on{border:2px solid var(--teal);padding:12px 13px;background:#F2FAF9;box-shadow:0 0 0 4px rgba(14,128,116,.1)}
.aa-fl__date[data-state=full]{opacity:.6;background:#F7F9F9;cursor:not-allowed}
.aa-fl__range{font-size:16px;font-weight:700}
.aa-fl__dk{font-size:12.5px;color:var(--mute)}
.aa-fl__seats{font-size:12px;font-weight:600;color:var(--teal)}
.aa-fl__date[data-state=low] .aa-fl__seats{color:var(--warn)}.aa-fl__date[data-state=full] .aa-fl__seats{color:#8A9A9D}
.aa-fl__tick{position:absolute;top:12px;inset-inline-end:12px;width:22px;height:22px;border-radius:50%;background:#F0F4F3;border:1px solid #D5E2E0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}
.aa-fl__date.is-on .aa-fl__tick{background:var(--teal);border-color:var(--teal)}.aa-fl__date.is-on .aa-fl__tick::before{content:"✓"}
.aa-fl__alert{margin:0}
.aa-fl__alert:not(:empty){margin-top:10px;display:flex;gap:9px;align-items:flex-start;padding:11px 12px;border-radius:10px;background:#FFF3EE;border:1px solid #F0CDBF;color:#7A2E14;font-size:13.5px;font-weight:600;line-height:1.4}
.aa-fl__alert:not(:empty)::before{content:"!";flex:none;width:18px;height:18px;border-radius:50%;background:#C2502A;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center}
.aa-fl__tabs{display:inline-flex;gap:4px;padding:4px;border-radius:100px;background:#EEF3F2;margin:0 0 20px;max-width:100%}
.aa-fl__tab{min-height:46px;padding:0 22px;border:0;border-radius:100px;background:transparent;color:#35555B;font-size:14.5px;font-weight:600;transition:background .25s,color .25s}
.aa-fl__tab[aria-selected=true]{background:var(--ink);color:#fff}
.aa-fl__panel.is-off{display:none}
.aa-fl.is-ready .aa-fl__panel:not(.is-off){animation:aaflIn .35s cubic-bezier(.2,.7,.2,1) backwards}
.aa-fl__reg{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:18px;align-items:start}
.aa-fl__rows{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.aa-fl__row{display:flex;align-items:center;gap:12px;padding:14px 16px;margin:0;border-bottom:1px solid #EEF3F2}
.aa-fl__row div{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.aa-fl__row strong{font-size:15px;font-weight:600}.aa-fl__row span{font-size:13px;color:#35555B}
.aa-fl__row bdi{font-size:15px;font-weight:600;white-space:nowrap}
.aa-fl__seatrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:var(--soft)}
.aa-fl__stepper{display:inline-flex;align-items:center;border:1px solid #CFE3E1;border-radius:100px;background:#fff}
.aa-fl__stepper button{width:46px;height:44px;border:0;background:transparent;font-size:20px;color:var(--teal)}
.aa-fl__stepper output{min-width:28px;text-align:center;font-weight:700}
.aa-fl__side{border:1px solid var(--line);border-radius:16px;padding:18px;background:var(--soft);display:flex;flex-direction:column;gap:12px}
.aa-fl__go{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;border:0;border-radius:100px;background:var(--teal);color:#fff;font-weight:600;font-size:15.5px;transition:background .2s,transform .15s}
.aa-fl__go:hover{background:var(--ink)}.aa-fl__go:active{transform:scale(.98)}
.aa-fl__go[aria-busy=true]{background:var(--ink);pointer-events:none}
.aa-fl__go[aria-busy=true]::before{content:"";width:15px;height:15px;border-radius:50%;border:2px solid rgba(143,207,207,.3);border-top-color:var(--mint);animation:aaflSpin .8s linear infinite}
.aa-fl__help{margin:0;font-size:12.5px;line-height:1.5;color:var(--mute)}
.aa-fl__help button{padding:0;border:0;background:none;color:var(--teal);font-weight:600;text-decoration:underline;text-underline-offset:3px;min-height:44px}
.aa-fl__diff{display:inline-flex;align-items:center;gap:10px;font-size:14px;font-weight:600;min-height:44px;margin-bottom:12px}
.aa-fl__diff input{width:20px;height:20px;accent-color:var(--teal)}
.aa-fl__scroll{overflow-x:auto;border:1px solid var(--line);border-radius:16px;background:#fff;scroll-snap-type:x proximity}
.aa-fl__table{border-collapse:collapse;width:100%;min-width:calc(116px + var(--cols,3)*190px);font-size:14px;line-height:1.45;margin:0}
.aa-fl__table th,.aa-fl__table td{padding:12px 14px;text-align:start;vertical-align:top;border:0;border-bottom:1px solid #EEF3F2}
.aa-fl__table thead th{font-size:16px;font-weight:600;background:#fff;scroll-snap-align:start}
.aa-fl__table thead th a{display:block;margin-bottom:10px}
.aa-fl__table tbody th{position:sticky;inset-inline-start:0;z-index:2;background:var(--soft);width:116px;min-width:116px;font:600 10.5px/1.3 "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}
.aa-fl__table tbody td{color:var(--mute);scroll-snap-align:start}
.aa-fl__table tr.is-diff td{color:var(--ink);font-weight:600}
.aa-fl__regone{min-height:44px;padding:0 16px;border-radius:100px;border:0;background:var(--teal);color:#fff;font-weight:600;font-size:14px}
.aa-fl:not(.is-ready) .aa-fl__regone,.aa-fl:not(.is-ready) .aa-fl__js{display:none}
.aa-fl__bar{position:sticky;bottom:0;z-index:5;display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;padding:12px clamp(12px,2vw,20px) calc(12px + env(safe-area-inset-bottom));background:var(--ink);color:#fff}
.aa-fl__msg{flex:1 1 140px;min-width:0;margin:0;font-size:13.5px;color:var(--mist)}
.aa-fl__back{min-height:48px;padding:0 20px;border-radius:100px;background:transparent;border:1px solid rgba(143,207,207,.5);color:#fff;font-weight:600;font-size:14.5px}
.aa-fl__back[hidden]{display:inline-block!important;visibility:hidden}
.aa-fl__next{min-height:48px;padding:0 24px;border-radius:100px;border:0;background:var(--mint);color:var(--ink);font-weight:700;font-size:15px;transition:opacity .2s,background .2s}
.aa-fl__next:hover:not(:disabled){background:#fff}.aa-fl__next:disabled{opacity:.45;cursor:not-allowed}
.aa-fl:not(.is-ready) .aa-fl__steps,.aa-fl:not(.is-ready) .aa-fl__bar,.aa-fl:not(.is-ready) .aa-fl__tabs,.aa-fl:not(.is-ready) .aa-fl__reg{display:none}
.aa-fl:not(.is-ready) .aa-fl__step{display:block;border-bottom:1px solid #E6EFEE}
.aa-fl:not(.is-ready) .aa-fl__cls.is-off{display:block}
.aa-fl:not(.is-ready) .aa-fl__panel.is-off{display:block}
[dir=rtl] .aa-fl__arrow{display:inline-block;transform:scaleX(-1)}
@keyframes aaflIn{from{opacity:0;transform:translateY(12px)}}
@keyframes aaflCard{from{opacity:0;transform:translateY(14px) scale(.98)}}
@keyframes aaflSpin{to{transform:rotate(360deg)}}
@media (max-width:760px){.aa-fl{border-radius:16px}.aa-fl__cards{grid-template-columns:1fr}.aa-fl__reg{grid-template-columns:1fr}.aa-fl__price{margin-inline-start:0}.aa-fl__bar .aa-fl__msg{order:3;flex-basis:100%}.aa-fl__bar{padding-top:10px}.aa-fl__next{flex:1}.aa-fl__tabs{display:flex;width:100%}.aa-fl__tab{flex:1;padding:0 10px}}
@media (prefers-reduced-motion:reduce){.aa-fl *{animation:none!important;transition:none!important}}
</style>
<script id="aa-fl-js">
/* Agile Agilist class-selection flow. Enhances the server-rendered markup. */
(function(){
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return [].slice.call((r||document).querySelectorAll(s))}
  function init(root){
    var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    var MAX=parseInt(root.getAttribute('data-max-seats'),10)||12;
    var chks=qa('.aa-fl__chk',root),by={};
    chks.forEach(function(c){by[c.value]={chk:c,card:c.closest('.aa-fl__card'),name:c.getAttribute('data-name'),url:c.getAttribute('data-url'),price:c.getAttribute('data-price'),fs:q('.aa-fl__cls[data-id="'+c.value+'"]',root)}});
    var steps=qa('.aa-fl__step',root),sbtn=qa('.aa-fl__stepbtn',root),back=q('.aa-fl__back',root),next=q('.aa-fl__next',root),msg=q('.aa-fl__msg',root),
        tabs=qa('.aa-fl__tab',root),panels=qa('.aa-fl__panel',root),rows=q('.aa-fl__rows',root),seatsOut=q('.aa-fl__seatrow output',root),
        go=q('.aa-fl__go',root),ralert=q('.aa-fl__ralert',root),multi=q('[data-multi]',root),table=q('.aa-fl__table',root),diffBox=q('.aa-fl__diff input',root),cmpNote=q('.aa-fl__cmpnote',root),
        st={step:1,mode:'register',seats:1,diff:false};

    function ids(){return chks.filter(function(c){return c.checked}).map(function(c){return c.value})}
    function dateOf(id){return q('.aa-fl__rad:checked',by[id].fs)}
    function ensure(){ids().forEach(function(id){if(!dateOf(id)){var r=q('.aa-fl__rad:not(:disabled)',by[id].fs);if(r)r.checked=true}})}
    function clash(id){var a=dateOf(id);if(!a)return'';var l=ids(),me=l.indexOf(id);for(var i=0;i<me;i++){var b=dateOf(l[i]);if(b&&a.getAttribute('data-start')<=b.getAttribute('data-end')&&b.getAttribute('data-start')<=a.getAttribute('data-end'))return'This overlaps '+by[l[i]].name+'. Pick a different date for one of them.'}return''}
    function anyClash(){return ids().some(function(id){return clash(id)})}
    function writeUrl(){try{var u=new URL(location.href),l=ids();if(l.length){u.searchParams.set('classes',l.join(','));u.searchParams.set('cohorts',l.map(function(id){var r=dateOf(id);return r?r.value:''}).join(','))}else{u.searchParams.delete('classes');u.searchParams.delete('cohorts')}history.replaceState(null,'',u)}catch(e){}}
    function readUrl(){
      var p=new URLSearchParams(location.search),c=(p.get('classes')||'').split(',').filter(function(x){return by[x]}),d=(p.get('cohorts')||'').split(',');
      c.forEach(function(id,i){by[id].chk.checked=true;var r=q('.aa-fl__rad[value="'+(d[i]||'').replace(/[^a-z0-9_-]/gi,'')+'"]:not(:disabled)',by[id].fs);if(r)r.checked=true});
      return c.length;
    }
    function names(n){return n+(n===1?' class':' classes')}

    function render(){
      var l=ids(),n=l.length,cl=anyClash();
      chks.forEach(function(c){by[c.value].card.classList.toggle('is-on',c.checked)});
      qa('.aa-fl__date',root).forEach(function(d){d.classList.toggle('is-on',q('input',d).checked)});
      sbtn.forEach(function(b,i){var k=i+1;b.setAttribute('aria-current',st.step===k?'step':'false');b.classList.toggle('is-done',st.step>k);b.disabled=k>1&&!n});
      q('[data-sub="1"]',root).textContent=n?n+' selected':'None yet';
      q('[data-sub="2"]',root).textContent=st.step>1&&n?'Set for '+n:'Per class';
      q('[data-sub="3"]',root).textContent=st.mode==='register'?'Register':'Compare';
      steps.forEach(function(s){s.classList.toggle('is-off',+s.getAttribute('data-step')!==st.step)});
      Object.keys(by).forEach(function(id){var on=by[id].chk.checked;by[id].fs.classList.toggle('is-off',!on);q('.aa-fl__alert',by[id].fs).textContent=on?clash(id):''});
      back.hidden=st.step===1;next.hidden=st.step===3;
      next.disabled=!n||(st.step===2&&cl);
      next.firstChild.textContent=(st.step===1?'Choose dates ('+n+')':'Review & decide')+' ';
      msg.textContent=st.step===1?(n?names(n)+' selected':'Select at least one class'):st.step===2?(cl?'Some dates overlap':'Dates set for '+names(n)):(st.mode==='register'?'Seats: '+st.seats+' per class':'Comparing '+n);
      tabs.forEach(function(t){t.setAttribute('aria-selected',t.getAttribute('data-mode')===st.mode?'true':'false')});
      panels.forEach(function(p){p.classList.toggle('is-off',p.getAttribute('data-panel')!==st.mode)});
      q('[data-n]',root).textContent=n;
      seatsOut.textContent=st.seats;
      rows.innerHTML='';
      l.forEach(function(id){var r=dateOf(id),li=document.createElement('li');li.className='aa-fl__row';
        li.innerHTML='<div><strong></strong><span></span></div><bdi></bdi>';
        li.querySelector('strong').textContent=by[id].name;li.querySelector('span').textContent=r?r.getAttribute('data-label')+', '+r.getAttribute('data-days'):'';
        li.querySelector('bdi').textContent=by[id].price+' / seat';rows.appendChild(li)});
      if(n>1){multi.hidden=false;multi.textContent='One payment per class. You pay for '+by[l[0]].name+' first; after that we offer the next class on your list.'}else{multi.hidden=true;multi.textContent=''}
      table.style.setProperty('--cols',Math.max(1,n));
      qa('[data-col]',table).forEach(function(c){c.hidden=l.indexOf(c.getAttribute('data-col'))<0});
      qa('td[data-yourdate]',table).forEach(function(td){var id=td.getAttribute('data-col'),r=l.indexOf(id)>-1&&dateOf(id);td.textContent=r?r.getAttribute('data-label')+' · '+r.getAttribute('data-days'):''});
      var diffRows=0;
      qa('tbody tr',table).forEach(function(tr){
        if(tr.hasAttribute('data-js')){tr.hidden=!l.length;if(!l.length)return}
        var vals=qa('td',tr).filter(function(c){return !c.hidden}).map(function(c){return c.textContent.trim()}),same=vals.every(function(v){return v===vals[0]});
        tr.classList.toggle('is-diff',!same&&n>1);if(!same)diffRows++;
        if(!tr.hasAttribute('data-js'))tr.hidden=st.diff&&same&&!tr.hasAttribute('data-keep');
      });
      cmpNote.hidden=!(st.diff&&n>1&&diffRows===0);
      writeUrl();
    }
    function goStep(n){
      if(n>1&&!ids().length)return;if(n>=2)ensure();st.step=n;render();
      var h=q('.aa-fl__step[data-step="'+n+'"] h2',root);if(h)h.focus({preventScroll:true});
      var top=root.getBoundingClientRect().top;if(top<0)window.scrollTo({top:window.pageYOffset+top-12,behavior:RM?'auto':'smooth'});
    }
    function busy(b){go.setAttribute('aria-busy',b?'true':'false');go.firstChild.textContent=b?'Opening checkout… ':'Continue to payment '}
    function checkout(){
      var l=ids();ralert.textContent='';
      if(!l.length)return;
      if(anyClash()){ralert.textContent='Two classes overlap. Go back and change a date.';return}
      busy(true);
      var first=l[0],r=dateOf(first);
      try{sessionStorage.setItem('aa_fl_queue',JSON.stringify(l.slice(1).map(function(id){var d=dateOf(id);return{id:id,name:by[id].name,url:by[id].url,cohort:d.value,label:d.getAttribute('data-label'),seats:st.seats}})))}catch(e){}
      location.assign(by[first].url+(by[first].url.indexOf('?')>-1?'&':'?')+'cohort='+encodeURIComponent(r.value)+'&seats='+st.seats+'#enroll');
    }
    root.addEventListener('change',function(e){
      if(e.target.classList.contains('aa-fl__chk')||e.target.classList.contains('aa-fl__rad')){if(e.target.classList.contains('aa-fl__chk')&&e.target.checked)ensure();render()}
      if(e.target===diffBox){st.diff=diffBox.checked;render()}
    });
    root.addEventListener('click',function(e){
      var t=e.target.closest('button');if(!t||!root.contains(t))return;
      if(t.classList.contains('aa-fl__stepbtn'))goStep(+t.getAttribute('data-go'));
      else if(t.classList.contains('aa-fl__back'))goStep(st.step-1);
      else if(t.classList.contains('aa-fl__next'))goStep(st.step+1);
      else if(t.classList.contains('aa-fl__tab')){st.mode=t.getAttribute('data-mode');render()}
      else if(t.hasAttribute('data-gocmp')){st.mode='compare';render()}
      else if(t.classList.contains('aa-fl__rm')){by[t.getAttribute('data-rm')].chk.checked=false;if(!ids().length){st.step=1}render()}
      else if(t.classList.contains('aa-fl__regone')){var id=t.getAttribute('data-reg');chks.forEach(function(c){c.checked=c.value===id});st.mode='register';render()}
      else if(t.hasAttribute('data-seat')){st.seats=Math.max(1,Math.min(MAX,st.seats+(+t.getAttribute('data-seat'))));render()}
      else if(t===go)checkout();
    });
    root.addEventListener('keydown',function(e){if(e.key==='Escape'&&go.getAttribute('aria-busy')==='true')busy(false)});
    var pre=readUrl();root.classList.add('is-ready');st.step=pre?2:1;if(pre)ensure();render();
    window.addEventListener('pageshow',function(e){if(e.persisted)busy(false)});
  }
  function boot(){[].forEach.call(document.querySelectorAll('[data-aa-fl]'),init)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
</script>
	<?php
	return ob_get_clean();
}
