<?php
/**
 * Template Name: Contact
 *
 * Thin wrapper around the block editor. The Contact page is composed
 * from the "RentNova" block patterns (Contact hero / Contact info +
 * form / CTA) — see theme README for the suggested assembly. This
 * file deliberately holds no layout markup so content stays editable
 * in wp-admin.
 *
 * Auto-activates for a page with slug "contact"; also selectable on
 * any page via Page Attributes → Template → Contact.
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
