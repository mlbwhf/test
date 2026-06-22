<?php
/**
 * Stays archive.
 *
 * @package rentnova
 */

get_header();
?>
<main id="content">
	<section class="rn-hero" style="padding-bottom:40px;">
		<div class="rn-hero__inner">
			<div class="rn-eyebrow" style="margin-bottom:18px;"><?php esc_html_e( 'Stay with us', 'rentnova' ); ?></div>
			<h1 style="font-size:60px;"><?php esc_html_e( 'Book direct. Skip the fees.', 'rentnova' ); ?></h1>
			<p class="rn-hero__lead" style="max-width:560px;"><?php esc_html_e( 'The same homes we design, furnish and run — bookable straight from us. Real hosts, real keys.', 'rentnova' ); ?></p>
		</div>
	</section>

	<section class="rn-section">
		<div class="rn-stays">
			<?php
			if ( have_posts() ) :
				while ( have_posts() ) :
					the_post();
					$price = get_post_meta( get_the_ID(), 'rn_price', true );
					$loc   = get_post_meta( get_the_ID(), 'rn_location', true );
					$book  = get_post_meta( get_the_ID(), 'rn_book_url', true );
					$href  = $book ? $book : get_permalink();
					?>
					<a class="rn-stay" href="<?php echo esc_url( $href ); ?>">
						<?php if ( has_post_thumbnail() ) : ?>
							<?php the_post_thumbnail( 'large', array( 'class' => 'rn-stay__img' ) ); ?>
						<?php else : ?>
							<div class="rn-stay__img"></div>
						<?php endif; ?>
						<div class="rn-stay__body">
							<div>
								<?php if ( $loc ) : ?><div class="rn-stay__loc"><?php echo esc_html( $loc ); ?></div><?php endif; ?>
								<div class="rn-stay__name"><?php the_title(); ?></div>
								<div class="rn-stay__meta"><?php echo esc_html( rentnova_stay_meta_line( get_the_ID() ) ); ?></div>
							</div>
							<?php if ( $price ) : ?>
								<div class="rn-stay__price"><b>$<?php echo esc_html( $price ); ?></b><span><?php esc_html_e( '/ night', 'rentnova' ); ?></span></div>
							<?php endif; ?>
						</div>
					</a>
					<?php
				endwhile;
			else :
				foreach ( rentnova_demo_stays() as $s ) :
					?>
					<a class="rn-stay" href="<?php echo esc_url( $s['url'] ); ?>">
						<img class="rn-stay__img" src="<?php echo esc_url( $s['img'] ); ?>" alt="<?php echo esc_attr( $s['name'] ); ?>" />
						<div class="rn-stay__body">
							<div>
								<div class="rn-stay__loc"><?php echo esc_html( $s['loc'] ); ?></div>
								<div class="rn-stay__name"><?php echo esc_html( $s['name'] ); ?></div>
								<div class="rn-stay__meta"><?php echo esc_html( $s['meta'] ); ?></div>
							</div>
							<div class="rn-stay__price"><b>$<?php echo esc_html( $s['price'] ); ?></b><span><?php esc_html_e( '/ night', 'rentnova' ); ?></span></div>
						</div>
					</a>
					<?php
				endforeach;
			endif;
			?>
		</div>
	</section>
</main>
<?php
get_footer();
