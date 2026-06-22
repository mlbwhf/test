<?php
/**
 * Fallback template (blog / search / archives).
 *
 * @package rentnova
 */

get_header();
?>
<main id="content">
	<section class="rn-section">
		<?php if ( have_posts() ) : ?>
			<div class="rn-head">
				<h2 class="rn-h2" style="font-size:38px;">
					<?php
					if ( is_home() && ! is_front_page() ) {
						single_post_title();
					} elseif ( is_archive() ) {
						the_archive_title();
					} elseif ( is_search() ) {
						/* translators: %s: search query. */
						printf( esc_html__( 'Results for “%s”', 'rentnova' ), esc_html( get_search_query() ) );
					} else {
						esc_html_e( 'Latest', 'rentnova' );
					}
					?>
				</h2>
			</div>

			<div class="rn-stays">
				<?php
				while ( have_posts() ) :
					the_post();
					?>
					<a class="rn-stay" href="<?php the_permalink(); ?>">
						<?php if ( has_post_thumbnail() ) : ?>
							<?php the_post_thumbnail( 'large', array( 'class' => 'rn-stay__img' ) ); ?>
						<?php endif; ?>
						<div class="rn-stay__body">
							<div>
								<div class="rn-stay__name"><?php the_title(); ?></div>
								<div class="rn-stay__meta"><?php echo esc_html( get_the_date() ); ?></div>
							</div>
						</div>
					</a>
					<?php
				endwhile;
				?>
			</div>

			<div style="margin-top:40px;"><?php the_posts_pagination(); ?></div>

		<?php else : ?>
			<div class="rn-head"><h2 class="rn-h2" style="font-size:32px;"><?php esc_html_e( 'Nothing here yet.', 'rentnova' ); ?></h2></div>
		<?php endif; ?>
	</section>
</main>
<?php
get_footer();
