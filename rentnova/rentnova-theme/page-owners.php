<?php
/**
 * Template Name: Owners
 *
 * Thin wrapper around the block editor. The Owners page is composed
 * from the "RentNova" block patterns (Owners hero / Tracks / Pipeline /
 * What's-included grid / Revenue-share / CTA) — see theme README for
 * the suggested assembly. This file deliberately holds no layout
 * markup so content stays editable in wp-admin.
 *
 * Auto-activates for a page with slug "owners"; also selectable on any
 * page via Page Attributes → Template → Owners.
 *
 * @package rentnova
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<main id="content">
		<?php the_content(); ?>
	</main>
	<?php
endwhile;

get_footer();
