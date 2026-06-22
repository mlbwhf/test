<?php
/**
 * Default page template.
 *
 * @package rentnova
 */

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<main id="content">
		<section class="rn-hero" style="padding-bottom:40px;">
			<div class="rn-hero__inner">
				<h1 style="font-size:56px;"><?php the_title(); ?></h1>
			</div>
		</section>
		<section class="rn-section">
			<div style="max-width:760px;font-size:17px;line-height:1.7;color:var(--rn-muted);">
				<?php
				the_content();
				wp_link_pages();
				?>
			</div>
		</section>
	</main>
	<?php
endwhile;

get_footer();
