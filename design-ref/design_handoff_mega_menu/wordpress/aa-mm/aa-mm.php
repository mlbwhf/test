<?php
/**
 * Plugin Name: Agile Agilist Training Menu
 * Description: Category rail + class picker + shortlist. Shortcode [aa_training_menu mode="page|dropdown"]. Also serves /training-menu.txt and Course JSON-LD.
 * Version: 1.2.0
 * Text Domain: aa-mm
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
define( 'AA_MM_DIR', plugin_dir_path( __FILE__ ) );
define( 'AA_MM_URL', plugin_dir_url( __FILE__ ) );
require_once AA_MM_DIR . 'includes/flow.php';

/** Data: data/training-menu.json, overridable with the aa_mm_data filter (pull live cohort dates: set courses[id].next and .iso). */
function aa_mm_data() {
  $raw  = file_get_contents( AA_MM_DIR . 'data/training-menu.json' );
  $data = json_decode( $raw, true );
  return apply_filters( 'aa_mm_data', is_array( $data ) ? $data : [ 'categories' => [], 'courses' => [] ] );
}

function aa_mm_enqueue() {
  wp_enqueue_style( 'aa-mm-fonts', 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@500;600&display=swap', [], null );
  wp_enqueue_style( 'aa-mm', AA_MM_URL . 'assets/aa-mm.css', [ 'aa-mm-fonts' ], filemtime( AA_MM_DIR . 'assets/aa-mm.css' ) );
  wp_enqueue_script( 'aa-mm', AA_MM_URL . 'assets/aa-mm.js', [], filemtime( AA_MM_DIR . 'assets/aa-mm.js' ), true );
}

function aa_mm_card( $id, $c, $i ) {
  ob_start(); ?>
<li class="aa-mm__card" style="--i:<?php echo (int) $i; ?>" data-id="<?php echo esc_attr( $id ); ?>" data-name="<?php echo esc_attr( $c['name'] ); ?>" data-next="<?php echo esc_attr( $c['next'] ); ?>" data-url="<?php echo esc_url( home_url( $c['url'] ) ); ?>" data-search="<?php echo esc_attr( strtolower( $c['name'] . ' ' . $c['code'] ) ); ?>"><div class="aa-mm__row"><h3 class="aa-mm__h"><a class="aa-mm__name" href="<?php echo esc_url( home_url( $c['url'] ) ); ?>"><?php echo esc_html( $c['name'] ); ?></a></h3><button type="button" class="aa-mm__add" aria-pressed="false" data-id="<?php echo esc_attr( $id ); ?>" aria-label="<?php echo esc_attr( sprintf( __( 'Add %s to shortlist', 'aa-mm' ), $c['name'] ) ); ?>"><span aria-hidden="true">+</span></button></div><div class="aa-mm__meta"><span class="aa-mm__code"><?php echo esc_html( $c['code'] ); ?></span><span><?php echo esc_html( $c['duration'] ); ?></span><span aria-hidden="true">·</span><span><?php esc_html_e( 'Next', 'aa-mm' ); ?> <time datetime="<?php echo esc_attr( $c['iso'] ); ?>"><?php echo esc_html( $c['next'] ); ?></time></span></div></li>
<?php return ob_get_clean();
}

function aa_mm_jsonld( $courses ) {
  $items = []; $p = 0;
  foreach ( $courses as $c ) {
    $items[] = [ '@type' => 'ListItem', 'position' => ++$p, 'item' => [
      '@type' => 'Course', 'name' => $c['name'], 'courseCode' => $c['code'], 'url' => home_url( $c['url'] ),
      'provider' => [ '@type' => 'Organization', 'name' => 'Agile Agilist', 'url' => home_url( '/' ) ],
      'hasCourseInstance' => [ '@type' => 'CourseInstance', 'courseMode' => 'online', 'startDate' => $c['iso'] ],
    ] ];
  }
  return '<script type="application/ld+json">' . wp_json_encode( [ '@context' => 'https://schema.org', '@type' => 'ItemList', 'name' => 'Agile Agilist training classes', 'itemListElement' => $items ], JSON_UNESCAPED_SLASHES ) . '</script>';
}

function aa_mm_render( $atts ) {
  $atts = shortcode_atts( [ 'mode' => 'page' ], $atts, 'aa_training_menu' );
  aa_mm_enqueue();
  $d = aa_mm_data(); $cats = $d['categories']; $courses = $d['courses'];
  ob_start();
  if ( 'dropdown' === $atts['mode'] ) { echo '<div class="aa-mm-drop" id="aa-mm-drop">'; } ?>
<div class="aa-mm" data-aa-mm data-default="<?php echo esc_attr( $d['defaultCategory'] ?? '' ); ?>">
  <div class="aa-mm__top">
    <div><p class="aa-mm__eyebrow"><?php esc_html_e( 'Training · pick your classes', 'aa-mm' ); ?></p><p class="aa-mm__sub"><?php esc_html_e( 'Choose a category, tick the classes you want. They collect in your shortlist.', 'aa-mm' ); ?></p></div>
    <label class="aa-mm__search"><span aria-hidden="true">⌕</span><input type="search" placeholder="<?php esc_attr_e( 'Search all classes', 'aa-mm' ); ?>" aria-label="<?php esc_attr_e( 'Search all classes', 'aa-mm' ); ?>" autocomplete="off" enterkeyhint="search"></label>
  </div>
  <div class="aa-mm__body">
    <div class="aa-mm__rail" role="tablist" aria-label="<?php esc_attr_e( 'Categories', 'aa-mm' ); ?>"><span class="aa-mm__pill" aria-hidden="true"></span>
<?php foreach ( $cats as $c ) : ?>
      <button type="button" role="tab" class="aa-mm__tab" id="aa-mm-tab-<?php echo esc_attr( $c['id'] ); ?>" aria-controls="aa-mm-panel-<?php echo esc_attr( $c['id'] ); ?>" aria-selected="false" data-cat="<?php echo esc_attr( $c['id'] ); ?>" style="--c:<?php echo esc_attr( $c['color'] ); ?>"><i class="aa-mm__dot"></i><span class="aa-mm__tabtxt"><b><?php echo esc_html( $c['name'] ); ?><?php if ( ! empty( $c['isNew'] ) ) : ?> <u class="aa-mm__new"><?php esc_html_e( 'NEW', 'aa-mm' ); ?></u><?php endif; ?></b><small><?php echo esc_html( $c['blurb'] ); ?></small></span><em><?php echo count( $c['courses'] ); ?></em></button>
<?php endforeach; ?>
    </div>
    <div class="aa-mm__panels">
<?php foreach ( $cats as $c ) : ?>
      <section class="aa-mm__panel" role="tabpanel" id="aa-mm-panel-<?php echo esc_attr( $c['id'] ); ?>" aria-labelledby="aa-mm-tab-<?php echo esc_attr( $c['id'] ); ?>" data-cat="<?php echo esc_attr( $c['id'] ); ?>" data-name="<?php echo esc_attr( $c['name'] ); ?>" style="--c:<?php echo esc_attr( $c['color'] ); ?>">
        <header class="aa-mm__band" data-n="<?php echo esc_attr( str_pad( (string) count( $c['courses'] ), 2, '0', STR_PAD_LEFT ) ); ?>"><p class="aa-mm__eyebrow aa-mm__eyebrow--light"><?php echo esc_html( $c['eyebrow'] ); ?></p><h2><?php echo esc_html( $c['name'] ); ?></h2><p><?php echo esc_html( $c['desc'] ); ?></p></header>
        <ul class="aa-mm__grid"><?php foreach ( $c['courses'] as $i => $id ) { if ( isset( $courses[ $id ] ) ) { echo aa_mm_card( $id, $courses[ $id ], $i ); } } // phpcs:ignore WordPress.Security.EscapeOutput ?></ul>
      </section>
<?php endforeach; ?>
      <section class="aa-mm__panel aa-mm__results is-off" style="--c:#8FCFCF"><header class="aa-mm__band" data-n="··"><p class="aa-mm__eyebrow aa-mm__eyebrow--light"><?php esc_html_e( 'Search', 'aa-mm' ); ?></p><h2 data-aa-mm-rtitle></h2></header><p class="aa-mm__status" role="status" aria-live="polite"></p><ul class="aa-mm__grid"></ul></section>
    </div>
  </div>
  <div class="aa-mm__trayw" inert><div class="aa-mm__tray"><div class="aa-mm__trayin">
    <div class="aa-mm__sheet" id="aa-mm-sheet"><ul class="aa-mm__chips"></ul></div>
    <div class="aa-mm__bar">
      <button type="button" class="aa-mm__trayhead" aria-expanded="false" aria-controls="aa-mm-sheet"><span class="aa-mm__count" data-aa-mm-count>0</span><b><?php esc_html_e( 'Your shortlist', 'aa-mm' ); ?></b><i class="aa-mm__caret" aria-hidden="true"></i></button>
      <div class="aa-mm__actions"><a class="aa-mm__cta" href="#register" data-aa-mm-cta><?php esc_html_e( 'Pick a date', 'aa-mm' ); ?> <span class="aa-mm__arrow" aria-hidden="true">⟶</span></a><button type="button" class="aa-mm__clear"><?php esc_html_e( 'Clear', 'aa-mm' ); ?></button></div>
    </div>
  </div></div></div>
  <details class="aa-mm__index"><summary><?php esc_html_e( 'All classes as a plain list', 'aa-mm' ); ?></summary><div class="aa-mm__idxin">
<?php foreach ( $cats as $c ) : ?>
    <h3><?php echo esc_html( $c['name'] ); ?></h3><p><?php echo esc_html( $c['desc'] ); ?></p><ul><?php foreach ( $c['courses'] as $id ) { if ( ! isset( $courses[ $id ] ) ) { continue; } $k = $courses[ $id ]; ?><li><a href="<?php echo esc_url( home_url( $k['url'] ) ); ?>"><?php echo esc_html( $k['name'] ); ?></a> (<?php echo esc_html( $k['code'] ); ?>) · <?php echo esc_html( $k['duration'] ); ?> · <?php esc_html_e( 'next', 'aa-mm' ); ?> <time datetime="<?php echo esc_attr( $k['iso'] ); ?>"><?php echo esc_html( $k['next'] ); ?></time></li><?php } ?></ul>
<?php endforeach; ?>
  </div></details>
  <p class="aa-mm__sr" role="status" aria-live="polite"></p>
  <?php echo aa_mm_jsonld( $courses ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
</div>
<?php if ( 'dropdown' === $atts['mode'] ) { echo '</div>'; }
  return ob_get_clean();
}
add_shortcode( 'aa_training_menu', 'aa_mm_render' );

/** /training-menu.txt — plain-text index for AI crawlers. Flush permalinks after activating (Settings → Permalinks → Save). */
add_action( 'init', function () {
  add_rewrite_rule( '^training-menu\\.txt$', 'index.php?aa_mm_txt=1', 'top' );
  add_rewrite_tag( '%aa_mm_txt%', '1' );
} );
add_action( 'template_redirect', function () {
  if ( ! get_query_var( 'aa_mm_txt' ) ) { return; }
  $d = aa_mm_data(); status_header( 200 ); header( 'Content-Type: text/plain; charset=utf-8' );
  echo "# Agile Agilist — training classes (plain text index)\n\n";
  foreach ( $d['categories'] as $c ) {
    echo '## ' . $c['name'] . ' — ' . $c['desc'] . "\n";
    foreach ( $c['courses'] as $id ) { if ( isset( $d['courses'][ $id ] ) ) { $k = $d['courses'][ $id ]; echo '- ' . $k['name'] . ' (' . $k['code'] . ') | ' . $k['duration'] . ' | next class ' . $k['iso'] . ' | ' . home_url( $k['url'] ) . "\n"; } }
    echo "\n";
  }
  exit;
} );
