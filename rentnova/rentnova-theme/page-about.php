<?php
/**
 * Template Name: About
 *
 * Thin wrapper around the block editor. The About page is composed
 * from the "RentNova" block patterns (About hero / Narrative + facts /
 * Values / Revenue-share / CTA) — see theme README for the suggested
 * assembly. This file deliberately holds no layout markup so content
 * stays editable in wp-admin.
 *
 * Auto-activates for a page with slug "about"; also selectable on any
 * page via Page Attributes → Template → About.
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
