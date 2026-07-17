<?php
/**
 * Front page — RentNova Blueprint homepage.
 *
 * @package rentnova
 */

get_header();
?>

<main id="content">

	<!-- ============================ HERO ============================ -->
	<section class="rn-hero" id="owners">
		<div class="rn-hero__inner">
			<div class="rn-hero__grid">
				<div>
					<div class="rn-eyebrow rn-hero__eyebrow"><?php esc_html_e( 'Turn your residence into income', 'rentnova' ); ?></div>
					<h1><?php echo wp_kses_post( __( 'Make your<br>home <em>pay.</em>', 'rentnova' ) ); ?></h1>
					<p class="rn-hero__lead"><?php esc_html_e( 'One home into two or three legal income units. We design, build, furnish, list and run them — one team, one contract, monthly statements.', 'rentnova' ); ?></p>
					<div class="rn-hero__actions">
						<a class="rn-btn rn-btn--terra" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Make your home pay →', 'rentnova' ); ?></a>
						<a class="rn-btn rn-btn--ghost" href="#stays"><?php esc_html_e( 'Browse stays', 'rentnova' ); ?></a>
					</div>
				</div>

				<?php get_template_part( 'template-parts/blueprint', 'figure' ); ?>
			</div>

			<!-- stats -->
			<div class="rn-stats">
				<div class="rn-stat"><div class="rn-stat__n"><?php esc_html_e( '3 units', 'rentnova' ); ?></div><div class="rn-stat__l"><?php esc_html_e( 'from one lot', 'rentnova' ); ?></div></div>
				<div class="rn-stat"><div class="rn-stat__n"><?php esc_html_e( '1 team', 'rentnova' ); ?></div><div class="rn-stat__l"><?php esc_html_e( 'design → manage', 'rentnova' ); ?></div></div>
				<div class="rn-stat"><div class="rn-stat__n"><?php esc_html_e( '$0', 'rentnova' ); ?></div><div class="rn-stat__l"><?php esc_html_e( 'feasibility call', 'rentnova' ); ?></div></div>
				<div class="rn-stat"><div class="rn-stat__n"><?php esc_html_e( 'Rev-share', 'rentnova' ); ?></div><div class="rn-stat__l"><?php esc_html_e( 'paid when you are', 'rentnova' ); ?></div></div>
			</div>
		</div>
	</section>

	<!-- ============================ THREE TRACKS ============================ -->
	<section class="rn-section" id="manage">
		<div class="rn-head">
			<h2 class="rn-h2"><?php echo wp_kses_post( __( 'Three tracks,<br>one address.', 'rentnova' ) ); ?></h2>
			<p class="rn-head__note"><?php esc_html_e( 'Build it. Run it. Or just come stay in it. Pick your starting line.', 'rentnova' ); ?></p>
		</div>
		<div class="rn-tracks">
			<div class="rn-track">
				<div class="rn-track__no"><?php esc_html_e( '01 — CONVERT', 'rentnova' ); ?></div>
				<h3><?php esc_html_e( 'Turn your home into units', 'rentnova' ); ?></h3>
				<p><?php esc_html_e( 'Add a legal basement suite, garden suite, or multiplex conversion. Feasibility, design, permits, construction.', 'rentnova' ); ?></p>
			</div>
			<div class="rn-track rn-track--alt">
				<div class="rn-track__no"><?php esc_html_e( '02 — MANAGE', 'rentnova' ); ?></div>
				<h3><?php esc_html_e( 'Furnish, list & run it', 'rentnova' ); ?></h3>
				<p><?php esc_html_e( 'Furniture, styling, the small touches, and full short-rental management — Airbnb & direct, on a revenue-share with monthly statements.', 'rentnova' ); ?></p>
			</div>
			<div class="rn-track">
				<div class="rn-track__no"><?php esc_html_e( '03 — STAY', 'rentnova' ); ?></div>
				<h3><?php esc_html_e( 'Book a stay, direct', 'rentnova' ); ?></h3>
				<p><?php esc_html_e( 'The same homes we design and run, bookable direct — skip the platform fees. Real hosts, real keys, coffee in the cupboard.', 'rentnova' ); ?></p>
			</div>
		</div>
	</section>

	<!-- ============================ PIPELINE ============================ -->
	<section class="rn-section">
		<div class="rn-pipe-head">
			<h2 class="rn-h2"><?php esc_html_e( 'One contract. Every step.', 'rentnova' ); ?></h2>
			<span><?php esc_html_e( 'Builders hand you keys. We keep going.', 'rentnova' ); ?></span>
		</div>
		<div class="rn-pipe">
			<?php
			$steps = array( 'Feasibility', 'Design', 'Build', 'Furnish', 'List', 'Manage' );
			foreach ( $steps as $i => $label ) :
				$n = $i + 1;
				?>
				<div class="rn-step rn-step--<?php echo (int) $n; ?>">
					<div class="rn-step__no"><?php echo esc_html( sprintf( '%02d', $n ) ); ?></div>
					<div class="rn-step__l"><?php echo esc_html( $label ); ?></div>
				</div>
			<?php endforeach; ?>
		</div>
	</section>

	<!-- ============================ REVENUE SHARE ============================ -->
	<section class="rn-rev">
		<h2 class="rn-h2"><?php echo wp_kses_post( __( 'You own the asset.<br>We run the income.<br><em>We split the upside.</em>', 'rentnova' ) ); ?></h2>
		<p><?php esc_html_e( "No flat invoice that ignores how the unit performs. We work on a revenue-share — paid when you're paid — and send a clean monthly statement either way.", 'rentnova' ); ?></p>
	</section>

	<!-- ============================ FEATURED STAYS ============================ -->
	<section class="rn-section" id="stays">
		<div class="rn-head">
			<h2 class="rn-h2" style="font-size:38px;max-width:560px;"><?php esc_html_e( 'The homes we built, available to book.', 'rentnova' ); ?></h2>
			<a class="rn-stays-link" href="<?php echo esc_url( get_post_type_archive_link( 'stay' ) ?: '#' ); ?>"><?php esc_html_e( 'View all stays →', 'rentnova' ); ?></a>
		</div>

		<div class="rn-stays">
			<?php
			$stays = new WP_Query(
				array(
					'post_type'      => 'stay',
					'posts_per_page' => 2,
					'no_found_rows'  => true,
				)
			);

			if ( $stays->have_posts() ) :
				while ( $stays->have_posts() ) :
					$stays->the_post();
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
				wp_reset_postdata();
			else :
				// Demo fallback so the homepage is never empty on a fresh install.
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

	<!-- ============================ CTA ============================ -->
	<section class="rn-cta" id="contact">
		<h2 class="rn-h2"><?php echo wp_kses_post( __( 'A free 30-minute<br>feasibility call.', 'rentnova' ) ); ?></h2>
		<p><?php esc_html_e( "Tell us your address and your goals. We'll tell you what your lot allows, what it could generate, and what it would cost — real numbers, not ranges.", 'rentnova' ); ?></p>
		<a class="rn-btn rn-btn--dark" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Contact us →', 'rentnova' ); ?></a>
	</section>

</main>

<?php
get_footer();
