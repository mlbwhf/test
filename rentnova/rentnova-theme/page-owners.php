<?php
/**
 * Template Name: Owners
 *
 * Owner-facing page: the pitch to homeowners considering a
 * convert / furnish / manage engagement. Mirrors the Stays archive
 * structure (hero -> rn-section blocks -> footer) for visual
 * consistency across the marketing pages.
 *
 * Activates automatically for a page with slug "owners", and is also
 * selectable on any page via Page Attributes -> Template -> Owners.
 *
 * @package rentnova
 */

get_header();
?>
<main id="content">

	<section class="rn-hero" style="padding-bottom:48px;">
		<div class="rn-hero__inner">
			<div class="rn-eyebrow" style="margin-bottom:22px;"><?php esc_html_e( 'For owners', 'rentnova' ); ?></div>
			<h1 style="font-size:64px;max-width:780px;"><?php
				/* translators: keep <em> for the terracotta accent. */
				echo wp_kses_post( __( 'One home. Two or three <em>legal income</em> units.', 'rentnova' ) );
			?></h1>
			<p class="rn-hero__lead" style="max-width:560px;"><?php esc_html_e( 'You own the lot. We turn it into a multi-unit asset — designed, built, furnished, listed and run by one team on a revenue-share. Statements monthly, no flat fees.', 'rentnova' ); ?></p>
			<div class="rn-hero__actions">
				<a class="rn-btn rn-btn--terra" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Free feasibility →', 'rentnova' ); ?></a>
				<a class="rn-btn rn-btn--ghost" href="<?php echo esc_url( home_url( '/stays/' ) ); ?>"><?php esc_html_e( 'See finished homes', 'rentnova' ); ?></a>
			</div>

			<div class="rn-stats">
				<div class="rn-stat"><div class="rn-stat__n">3 units</div><div class="rn-stat__l"><?php esc_html_e( 'from one lot', 'rentnova' ); ?></div></div>
				<div class="rn-stat"><div class="rn-stat__n">1 team</div><div class="rn-stat__l"><?php esc_html_e( 'design → manage', 'rentnova' ); ?></div></div>
				<div class="rn-stat"><div class="rn-stat__n">$0</div><div class="rn-stat__l"><?php esc_html_e( 'feasibility call', 'rentnova' ); ?></div></div>
				<div class="rn-stat"><div class="rn-stat__n">Rev-share</div><div class="rn-stat__l"><?php esc_html_e( 'paid when you are', 'rentnova' ); ?></div></div>
			</div>
		</div>
	</section>

	<section class="rn-section">
		<div class="rn-head">
			<h2 class="rn-h2"><?php
				echo wp_kses_post( __( 'Three tracks,<br>one address.', 'rentnova' ) );
			?></h2>
			<p class="rn-head__note"><?php esc_html_e( 'Build it. Run it. Or just come stay in it. Pick your starting line.', 'rentnova' ); ?></p>
		</div>
		<div class="rn-tracks">
			<div class="rn-track">
				<div class="rn-track__no">01 — CONVERT</div>
				<h3><?php esc_html_e( 'Turn your home into units', 'rentnova' ); ?></h3>
				<p><?php esc_html_e( 'Add a legal basement suite, garden suite, or multiplex conversion. Feasibility, design, permits, construction.', 'rentnova' ); ?></p>
			</div>
			<div class="rn-track rn-track--alt">
				<div class="rn-track__no">02 — MANAGE</div>
				<h3><?php esc_html_e( 'Furnish, list &amp; run it', 'rentnova' ); ?></h3>
				<p><?php esc_html_e( 'Furniture, styling, the small touches, and full short-rental management — Airbnb & direct, on a revenue-share with monthly statements.', 'rentnova' ); ?></p>
			</div>
			<div class="rn-track">
				<div class="rn-track__no">03 — STAY</div>
				<h3><?php esc_html_e( 'Book a stay, direct', 'rentnova' ); ?></h3>
				<p><?php esc_html_e( 'The same homes we design and run, bookable direct — skip the platform fees. Real hosts, real keys, coffee in the cupboard.', 'rentnova' ); ?></p>
			</div>
		</div>
	</section>

	<section class="rn-section" style="padding-top:0;">
		<div class="rn-pipe-head">
			<h2 class="rn-h2"><?php esc_html_e( 'One contract. Every step.', 'rentnova' ); ?></h2>
			<span><?php esc_html_e( 'Builders hand you keys. We keep going.', 'rentnova' ); ?></span>
		</div>
		<div class="rn-pipe">
			<div class="rn-step rn-step--1"><div class="rn-step__no">01</div><div class="rn-step__l"><?php esc_html_e( 'Feasibility', 'rentnova' ); ?></div></div>
			<div class="rn-step rn-step--2"><div class="rn-step__no">02</div><div class="rn-step__l"><?php esc_html_e( 'Design', 'rentnova' ); ?></div></div>
			<div class="rn-step rn-step--3"><div class="rn-step__no">03</div><div class="rn-step__l"><?php esc_html_e( 'Build', 'rentnova' ); ?></div></div>
			<div class="rn-step rn-step--4"><div class="rn-step__no">04</div><div class="rn-step__l"><?php esc_html_e( 'Furnish', 'rentnova' ); ?></div></div>
			<div class="rn-step rn-step--5"><div class="rn-step__no">05</div><div class="rn-step__l"><?php esc_html_e( 'List', 'rentnova' ); ?></div></div>
			<div class="rn-step rn-step--6"><div class="rn-step__no">06</div><div class="rn-step__l"><?php esc_html_e( 'Manage', 'rentnova' ); ?></div></div>
		</div>
	</section>

	<section class="rn-section" style="padding-top:0;">
		<div class="rn-head">
			<h2 class="rn-h2" style="font-size:38px;"><?php esc_html_e( "What's included.", 'rentnova' ); ?></h2>
			<p class="rn-head__note"><?php esc_html_e( 'One contract covers every line below.', 'rentnova' ); ?></p>
		</div>
		<div class="rn-feat">
			<div class="rn-feat__row">
				<div class="rn-feat__no">A1 — FEASIBILITY</div>
				<h3 class="rn-feat__t"><?php esc_html_e( 'Lot study &amp; zoning', 'rentnova' ); ?></h3>
				<p class="rn-feat__p"><?php esc_html_e( 'What your lot allows under current bylaws — basement suite, garden suite, multiplex — with cost and timeline ranges.', 'rentnova' ); ?></p>
			</div>
			<div class="rn-feat__row">
				<div class="rn-feat__no">A2 — PERMITS</div>
				<h3 class="rn-feat__t"><?php esc_html_e( 'Drawings &amp; approvals', 'rentnova' ); ?></h3>
				<p class="rn-feat__p"><?php esc_html_e( 'Architectural drawings, applications, inspections — handled. You stay informed without filing anything.', 'rentnova' ); ?></p>
			</div>
			<div class="rn-feat__row">
				<div class="rn-feat__no">B1 — BUILD</div>
				<h3 class="rn-feat__t"><?php esc_html_e( 'Construction', 'rentnova' ); ?></h3>
				<p class="rn-feat__p"><?php esc_html_e( 'Vetted GCs, fixed scope, weekly photo updates, a single point of contact for the whole build.', 'rentnova' ); ?></p>
			</div>
			<div class="rn-feat__row">
				<div class="rn-feat__no">B2 — FURNISH</div>
				<h3 class="rn-feat__t"><?php esc_html_e( 'Style &amp; turn-key fit', 'rentnova' ); ?></h3>
				<p class="rn-feat__p"><?php esc_html_e( 'Furniture, linens, kitchenware, art, signage — guests-ready on day one.', 'rentnova' ); ?></p>
			</div>
			<div class="rn-feat__row">
				<div class="rn-feat__no">C1 — LIST</div>
				<h3 class="rn-feat__t"><?php esc_html_e( 'Direct + platforms', 'rentnova' ); ?></h3>
				<p class="rn-feat__p"><?php esc_html_e( 'Direct-book site plus Airbnb / Booking.com listings, dynamic pricing, photography, listing copy.', 'rentnova' ); ?></p>
			</div>
			<div class="rn-feat__row">
				<div class="rn-feat__no">C2 — MANAGE</div>
				<h3 class="rn-feat__t"><?php esc_html_e( 'Run it', 'rentnova' ); ?></h3>
				<p class="rn-feat__p"><?php esc_html_e( 'Guest comms 24/7, turnovers, restocking, maintenance, monthly statements, year-end summary.', 'rentnova' ); ?></p>
			</div>
		</div>
	</section>

	<div class="rn-rev">
		<h2 class="rn-h2"><?php
			echo wp_kses_post( __( 'You own the asset.<br>We run the income.<br><em>We split the upside.</em>', 'rentnova' ) );
		?></h2>
		<p><?php esc_html_e( "No flat invoice that ignores how the unit performs. We work on a revenue-share — paid when you're paid — and send a clean monthly statement either way.", 'rentnova' ); ?></p>
	</div>

	<section class="rn-cta">
		<h2 class="rn-h2"><?php
			echo wp_kses_post( __( 'A free 30-minute<br>feasibility call.', 'rentnova' ) );
		?></h2>
		<p><?php esc_html_e( "Tell us your address and your goals. We'll tell you what your lot allows, what it could generate, and what it would cost — real numbers, not ranges.", 'rentnova' ); ?></p>
		<a class="rn-btn rn-btn--dark" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Book the call →', 'rentnova' ); ?></a>
	</section>

</main>
<?php
get_footer();
