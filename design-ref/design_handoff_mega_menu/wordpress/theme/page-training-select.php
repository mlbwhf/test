<?php
/**
 * Template Name: Training — Select classes
 * Child theme file: page-training-select.php
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
add_filter( 'wp_robots', function ( $r ) { $r['noindex'] = true; $r['follow'] = true; return $r; } );
get_header();
?>
<main id="primary" class="site-main aa-fl-page">
  <?php echo do_shortcode( '[aa_class_flow]' ); ?>
</main>
<?php get_footer(); ?>
