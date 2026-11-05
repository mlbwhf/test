<?php
/**
 * Class-selection flow + compare table + cohort list.
 * Shortcodes: [aa_class_flow], [aa_compare_table], [aa_cohort_list class="devops"].
 * Loaded from aa-mm.php. Uses aa_mm_data() so categories and classes stay in one JSON file.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Classes that have cohorts (the Core flow set), keyed by id. */
function aa_fl_courses() {
  $d = aa_mm_data();
  return array_filter( $d['courses'], function ( $c ) { return ! empty( $c['cohorts'] ); } );
}

function aa_fl_enqueue() {
  wp_enqueue_style( 'aa-mm-fonts', 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@500;600&display=swap', [], null );
  wp_enqueue_style( 'aa-fl', AA_MM_URL . 'assets/aa-fl.css', [ 'aa-mm-fonts' ], filemtime( AA_MM_DIR . 'assets/aa-fl.css' ) );
  wp_enqueue_script( 'aa-fl', AA_MM_URL . 'assets/aa-fl.js', [], filemtime( AA_MM_DIR . 'assets/aa-fl.js' ), true );
}

/** Real <table>: used on /training/compare/ (indexable) and inside the flow. */
function aa_fl_table( $courses ) {
  $rows = [
    __( 'Price per seat', 'aa-mm' ) => 'price', __( 'Length', 'aa-mm' ) => 'duration', __( 'Format', 'aa-mm' ) => 'format', __( 'Exam', 'aa-mm' ) => 'exam',
    __( 'Prerequisites', 'aa-mm' ) => 'prerequisites', __( 'Best for', 'aa-mm' ) => 'bestFor', __( 'Who it is for', 'aa-mm' ) => 'who',
  ];
  ob_start(); ?>
<div class="aa-fl__scroll"><table class="aa-fl__table"><caption style="position:absolute;left:-9999px"><?php esc_html_e( 'Core classes compared', 'aa-mm' ); ?></caption>
<thead><tr><td></td><?php foreach ( $courses as $id => $c ) : ?><th scope="col" data-col="<?php echo esc_attr( $id ); ?>"><a href="<?php echo esc_url( home_url( $c['url'] ) ); ?>"><?php echo esc_html( $c['name'] ); ?></a> (<?php echo esc_html( $c['code'] ); ?>)<button type="button" class="aa-fl__regone" data-reg="<?php echo esc_attr( $id ); ?>"><?php esc_html_e( 'Register this one', 'aa-mm' ); ?></button></th><?php endforeach; ?></tr></thead>
<tbody>
<tr data-js data-keep hidden><th scope="row"><?php esc_html_e( 'Your date', 'aa-mm' ); ?></th><?php foreach ( $courses as $id => $c ) : ?><td data-col="<?php echo esc_attr( $id ); ?>" data-yourdate></td><?php endforeach; ?></tr>
<?php foreach ( $rows as $label => $key ) : ?><tr><th scope="row"><?php echo esc_html( $label ); ?></th><?php foreach ( $courses as $id => $c ) : ?><td data-col="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $c[ $key ] ?? '' ); ?></td><?php endforeach; ?></tr>
<?php endforeach; ?>
<tr data-keep><th scope="row"><?php esc_html_e( 'Upcoming dates', 'aa-mm' ); ?></th><?php foreach ( $courses as $id => $c ) : ?><td data-col="<?php echo esc_attr( $id ); ?>"><?php foreach ( $c['cohorts'] as $h ) { if ( $h['end'] < gmdate( 'Y-m-d' ) ) { continue; } ?><time datetime="<?php echo esc_attr( $h['start'] ); ?>"><?php echo esc_html( $h['label'] ); ?></time> (<?php echo esc_html( $h['days'] . ', ' . $h['seatsLabel'] ); ?>)<br><?php } ?></td><?php endforeach; ?></tr>
</tbody></table></div>
<?php return ob_get_clean();
}

add_shortcode( 'aa_compare_table', function () {
  aa_fl_enqueue();
  return '<div class="aa-fl" style="box-shadow:none;border:0;background:transparent;overflow:visible">' . aa_fl_table( aa_fl_courses() ) . '</div>';
} );

add_shortcode( 'aa_class_flow', function ( $atts ) {
  $atts = shortcode_atts( [ 'check_url' => '' ], $atts, 'aa_class_flow' );
  aa_fl_enqueue();
  $courses = aa_fl_courses(); $today = gmdate( 'Y-m-d' );
  ob_start(); ?>
<div class="aa-fl" data-aa-fl data-check-url="<?php echo esc_url( $atts['check_url'] ); ?>">
  <nav class="aa-fl__steps" aria-label="<?php esc_attr_e( 'Progress', 'aa-mm' ); ?>"><ol>
<?php foreach ( [ 1 => [ 'Classes', 'None yet' ], 2 => [ 'Dates', 'Per class' ], 3 => [ 'Register or compare', 'Register' ] ] as $n => $s ) : ?>
    <li><button type="button" class="aa-fl__stepbtn" data-go="<?php echo (int) $n; ?>" aria-current="<?php echo 1 === $n ? 'step' : 'false'; ?>"><span class="aa-fl__num"><?php echo (int) $n; ?></span><span class="aa-fl__stt"><b><?php echo esc_html( $s[0] ); ?></b><small data-sub="<?php echo (int) $n; ?>"><?php echo esc_html( $s[1] ); ?></small></span></button></li>
<?php endforeach; ?>
  </ol></nav>

  <section class="aa-fl__step" data-step="1" aria-labelledby="aa-fl-h1">
    <p class="aa-fl__eyebrow"><?php esc_html_e( 'Step 1 · Core category', 'aa-mm' ); ?></p>
    <h2 id="aa-fl-h1" tabindex="-1"><?php esc_html_e( 'Which classes do you need?', 'aa-mm' ); ?></h2>
    <p class="aa-fl__lede"><?php esc_html_e( 'Pick one or several. Next you choose a date for each. You can compare before you pay.', 'aa-mm' ); ?></p>
    <ul class="aa-fl__cards">
<?php $i = 0; foreach ( $courses as $id => $c ) : $next = ''; foreach ( $c['cohorts'] as $h ) { if ( $h['end'] >= $today && 'full' !== $h['seats'] ) { $next = $h; break; } } ?>
      <li class="aa-fl__card" style="--i:<?php echo (int) $i++; ?>"><input class="aa-fl__chk" type="checkbox" id="aa-fl-c-<?php echo esc_attr( $id ); ?>" value="<?php echo esc_attr( $id ); ?>" data-name="<?php echo esc_attr( $c['name'] ); ?>" data-url="<?php echo esc_url( home_url( $c['url'] ) ); ?>" data-price="<?php echo esc_attr( $c['price'] ); ?>"><h3><label for="aa-fl-c-<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $c['name'] ); ?></label></h3><p class="aa-fl__who"><?php echo esc_html( $c['who'] ); ?></p><div class="aa-fl__meta"><span class="aa-fl__code"><?php echo esc_html( $c['code'] ); ?></span><span><?php echo esc_html( $c['duration'] ); ?></span><?php if ( $next ) : ?><span aria-hidden="true">·</span><span><?php esc_html_e( 'Next', 'aa-mm' ); ?> <time datetime="<?php echo esc_attr( $next['start'] ); ?>"><?php echo esc_html( $next['label'] ); ?></time></span><?php endif; ?><bdi class="aa-fl__price"><?php echo esc_html( $c['price'] ); ?></bdi></div><span class="aa-fl__box" aria-hidden="true"></span></li>
<?php endforeach; ?>
    </ul>
  </section>

  <section class="aa-fl__step is-off" data-step="2" aria-labelledby="aa-fl-h2">
    <p class="aa-fl__eyebrow"><?php esc_html_e( 'Step 2 · Dates', 'aa-mm' ); ?></p>
    <h2 id="aa-fl-h2" tabindex="-1"><?php esc_html_e( 'Choose a date for each class.', 'aa-mm' ); ?></h2>
    <p class="aa-fl__lede"><?php esc_html_e( 'We’ve picked the soonest open date. Change any of them. Dates that overlap are flagged.', 'aa-mm' ); ?></p>
<?php foreach ( $courses as $id => $c ) : ?>
    <fieldset class="aa-fl__cls" data-id="<?php echo esc_attr( $id ); ?>"><legend><strong><?php echo esc_html( $c['name'] ); ?></strong><span class="aa-fl__code"><?php echo esc_html( $c['code'] ); ?></span><button type="button" class="aa-fl__rm aa-fl__js" data-rm="<?php echo esc_attr( $id ); ?>"><?php esc_html_e( 'Remove', 'aa-mm' ); ?></button></legend>
      <div class="aa-fl__dates"><?php foreach ( $c['cohorts'] as $h ) { if ( $h['end'] < $today ) { continue; } ?><label class="aa-fl__date" data-state="<?php echo esc_attr( $h['seats'] ); ?>"><input class="aa-fl__rad" type="radio" name="aa-fl-d-<?php echo esc_attr( $id ); ?>" value="<?php echo esc_attr( $h['id'] ); ?>" data-start="<?php echo esc_attr( $h['start'] ); ?>" data-end="<?php echo esc_attr( $h['end'] ); ?>" data-label="<?php echo esc_attr( $h['label'] ); ?>" data-days="<?php echo esc_attr( $h['days'] ); ?>"<?php disabled( 'full', $h['seats'] ); ?>><span class="aa-fl__range"><time datetime="<?php echo esc_attr( $h['start'] ); ?>"><?php echo esc_html( $h['label'] ); ?></time></span><span class="aa-fl__dk"><?php echo esc_html( $h['days'] . ' · ' . $h['time'] ); ?></span><span class="aa-fl__seats"><?php echo esc_html( $h['seatsLabel'] ); ?></span><span class="aa-fl__tick" aria-hidden="true"></span></label><?php } ?></div>
      <p class="aa-fl__alert" role="alert"></p></fieldset>
<?php endforeach; ?>
  </section>

  <section class="aa-fl__step is-off" data-step="3" aria-labelledby="aa-fl-h3">
    <p class="aa-fl__eyebrow"><?php esc_html_e( 'Step 3 · Decide', 'aa-mm' ); ?></p>
    <h2 id="aa-fl-h3" tabindex="-1"><?php esc_html_e( 'Register now, or compare first.', 'aa-mm' ); ?></h2>
    <div class="aa-fl__tabs" role="tablist" aria-label="<?php esc_attr_e( 'Next action', 'aa-mm' ); ?>"><button type="button" role="tab" class="aa-fl__tab" data-mode="register" aria-selected="true"><?php esc_html_e( 'Register', 'aa-mm' ); ?></button><button type="button" role="tab" class="aa-fl__tab" data-mode="compare" aria-selected="false"><?php esc_html_e( 'Compare', 'aa-mm' ); ?> (<span data-n>0</span>)</button></div>
    <div class="aa-fl__panel" data-panel="register"><div class="aa-fl__reg">
      <div><ul class="aa-fl__rows"></ul><div class="aa-fl__seatrow"><span><?php esc_html_e( 'Seats per class', 'aa-mm' ); ?></span><span class="aa-fl__stepper"><button type="button" data-seat="-1" aria-label="<?php esc_attr_e( 'Fewer seats', 'aa-mm' ); ?>">−</button><output aria-live="polite">1</output><button type="button" data-seat="1" aria-label="<?php esc_attr_e( 'More seats', 'aa-mm' ); ?>">+</button></span></div></div>
      <div class="aa-fl__side"><p class="aa-fl__eyebrow" style="margin:0"><?php esc_html_e( 'Next', 'aa-mm' ); ?></p><div class="aa-fl__alert aa-fl__ralert" role="alert"></div>
        <button type="button" class="aa-fl__go"><?php esc_html_e( 'Continue to payment', 'aa-mm' ); ?> <span class="aa-fl__arrow" aria-hidden="true">⟶</span></button>
        <p class="aa-fl__help"><?php esc_html_e( 'Secure payment opens in this tab. You enter your email there, and your total is confirmed there. Not ready?', 'aa-mm' ); ?> <button type="button" data-gocmp><?php esc_html_e( 'Compare classes', 'aa-mm' ); ?></button> <?php esc_html_e( 'first.', 'aa-mm' ); ?></p></div>
    </div></div>
    <div class="aa-fl__panel is-off" data-panel="compare">
      <label class="aa-fl__diff aa-fl__js"><input type="checkbox"> <?php esc_html_e( 'Show differences only', 'aa-mm' ); ?></label>
      <?php echo aa_fl_table( $courses ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
      <p class="aa-fl__help aa-fl__cmpnote" hidden style="margin-top:10px"><?php esc_html_e( 'These classes match on every row. Switch off “differences only” to see the details.', 'aa-mm' ); ?></p>
    </div>
  </section>

  <div class="aa-fl__bar"><button type="button" class="aa-fl__back" hidden><?php esc_html_e( 'Back', 'aa-mm' ); ?></button><p class="aa-fl__msg" role="status" aria-live="polite"><?php esc_html_e( 'Select at least one class', 'aa-mm' ); ?></p><button type="button" class="aa-fl__next" disabled><?php esc_html_e( 'Choose dates', 'aa-mm' ); ?> (0) <span class="aa-fl__arrow" aria-hidden="true">⟶</span></button></div>
</div>
<?php return ob_get_clean();
} );

/** Course pages: plain-HTML cohort list + Course/CourseInstance JSON-LD. Use [aa_cohort_list class="devops"] above the registration section. */
add_shortcode( 'aa_cohort_list', function ( $atts ) {
  $atts = shortcode_atts( [ 'class' => '' ], $atts, 'aa_cohort_list' );
  $all = aa_fl_courses(); $id = sanitize_key( $atts['class'] );
  if ( ! isset( $all[ $id ] ) ) { return ''; }
  aa_fl_enqueue(); $c = $all[ $id ]; $today = gmdate( 'Y-m-d' ); $inst = [];
  ob_start(); ?>
<ul class="aa-fl-cohorts" aria-label="<?php echo esc_attr( sprintf( __( 'Upcoming dates for %s', 'aa-mm' ), $c['name'] ) ); ?>">
<?php foreach ( $c['cohorts'] as $h ) { if ( $h['end'] < $today ) { continue; }
  $inst[] = [ '@type' => 'CourseInstance', 'courseMode' => 'online', 'startDate' => $h['start'], 'endDate' => $h['end'], 'offers' => [ '@type' => 'Offer', 'price' => preg_replace( '/[^0-9.]/', '', $c['price'] ), 'priceCurrency' => 'USD', 'availability' => 'full' === $h['seats'] ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', 'url' => home_url( $c['url'] ) ] ]; ?>
  <li><strong><time datetime="<?php echo esc_attr( $h['start'] ); ?>"><?php echo esc_html( $h['label'] ); ?></time></strong><span><?php echo esc_html( $h['days'] . ' · ' . $h['time'] ); ?></span><span><?php echo esc_html( $h['seatsLabel'] ); ?></span><bdi><?php echo esc_html( $c['price'] ); ?></bdi></li>
<?php } ?>
</ul>
<script type="application/ld+json"><?php echo wp_json_encode( [ '@context' => 'https://schema.org', '@type' => 'Course', 'name' => $c['name'], 'courseCode' => $c['code'], 'url' => home_url( $c['url'] ), 'provider' => [ '@type' => 'Organization', 'name' => 'Agile Agilist', 'url' => home_url( '/' ) ], 'hasCourseInstance' => $inst ], JSON_UNESCAPED_SLASHES ); ?></script>
<?php return ob_get_clean();
} );
