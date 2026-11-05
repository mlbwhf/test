<?php
/**
 * Template Name: Training — Compare classes
 * Child theme file: page-training-compare.php
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
get_header();
?>
<main id="primary" class="site-main aa-fl-page">
  <h1><?php esc_html_e( 'Compare Core training classes', 'aa-mm' ); ?></h1>
  <p style="max-width:62ch;color:#35555B;line-height:1.6"><?php esc_html_e( 'Price, length, prerequisites, who each class is for, and upcoming dates, side by side.', 'aa-mm' ); ?></p>
  <?php echo do_shortcode( '[aa_compare_table]' ); ?>
  <p><a href="<?php echo esc_url( home_url( '/training/select/' ) ); ?>"><?php esc_html_e( 'Ready to choose? Select your classes', 'aa-mm' ); ?> →</a></p>
</main>
<?php get_footer(); ?>
