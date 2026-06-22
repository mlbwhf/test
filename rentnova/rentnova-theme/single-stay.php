<?php
/**
 * Single Stay listing.
 *
 * @package rentnova
 */

get_header();

while ( have_posts() ) :
	the_post();
	$price = get_post_meta( get_the_ID(), 'rn_price', true );
	$loc   = get_post_meta( get_the_ID(), 'rn_location', true );
	$book  = get_post_meta( get_the_ID(), 'rn_book_url', true );
	?>
	<main id="content">
		<section class="rn-hero" style="padding-bottom:48px;">
			<div class="rn-hero__inner">
				<?php if ( $loc ) : ?><div class="rn-eyebrow" style="margin-bottom:18px;"><?php echo esc_html( $loc ); ?></div><?php endif; ?>
				<h1 style="font-size:56px;"><?php the_title(); ?></h1>
				<p class="rn-hero__lead" style="max-width:620px;"><?php echo esc_html( rentnova_stay_meta_line( get_the_ID() ) ); ?></p>
				<?php if ( $price ) : ?>
					<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:24px;">
						<span style="font-family:var(--rn-font-display);font-size:40px;font-weight:800;">$<?php echo esc_html( $price ); ?></span>
						<span style="color:var(--rn-mint);"><?php esc_html_e( '/ night', 'rentnova' ); ?></span>
					</div>
				<?php endif; ?>
				<?php if ( $book ) : ?>
					<a class="rn-btn rn-btn--terra" href="<?php echo esc_url( $book ); ?>"><?php esc_html_e( 'Book this stay →', 'rentnova' ); ?></a>
				<?php endif; ?>
			</div>
		</section>

		<section class="rn-section">
			<?php if ( has_post_thumbnail() ) : ?>
				<div style="border-radius:10px;overflow:hidden;margin-bottom:40px;">
					<?php the_post_thumbnail( 'full', array( 'style' => 'width:100%;height:auto;object-fit:cover;' ) ); ?>
				</div>
			<?php endif; ?>
			<div style="max-width:720px;font-size:17px;line-height:1.7;color:var(--rn-muted);">
				<?php the_content(); ?>
			</div>
		</section>
	</main>
	<?php
endwhile;

get_footer();
