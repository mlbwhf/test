<?php
/**
 * Template Name: About
 *
 * About RentNova. Same hero + rn-section pattern as the Stays archive,
 * so the marketing pages share a single visual rhythm.
 *
 * Activates automatically for a page with slug "about", and is also
 * selectable on any page via Page Attributes -> Template -> About.
 *
 * @package rentnova
 */

get_header();
?>
<main id="content">

	<section class="rn-hero" style="padding-bottom:48px;">
		<div class="rn-hero__inner">
			<div class="rn-eyebrow" style="margin-bottom:22px;"><?php esc_html_e( 'About', 'rentnova' ); ?></div>
			<h1 style="font-size:64px;max-width:820px;"><?php
				echo wp_kses_post( __( 'A homeowner-led team turning lots into <em>income</em>.', 'rentnova' ) );
			?></h1>
			<p class="rn-hero__lead" style="max-width:600px;"><?php esc_html_e( 'We design, build, furnish, list and run the small-multi-unit homes we wished existed when we were doing this ourselves. One team. One contract. Mississauga & the GTA.', 'rentnova' ); ?></p>
		</div>
	</section>

	<section class="rn-section">
		<div class="rn-narrative">
			<div class="rn-narrative__body">
				<h2><?php esc_html_e( 'Why we started.', 'rentnova' ); ?></h2>
				<p><?php esc_html_e( "We bought a tired Mississauga semi, added a legal basement suite and a garden suite, furnished both, and rented all three units. Six months in we'd done it all twice over — once for ourselves, once on behalf of the friends and neighbours who'd seen the result and asked us to do theirs too.", 'rentnova' ); ?></p>
				<p><?php esc_html_e( "Every owner we worked with was solving the same five problems in series: zoning, design, build, furnish, run. Each step had its own vendor, its own invoice, and its own way of dropping the ball at the handoff. RentNova exists to collapse all of that into one team and one contract.", 'rentnova' ); ?></p>

				<h2><?php esc_html_e( 'How we work.', 'rentnova' ); ?></h2>
				<p><?php esc_html_e( "Builders hand you keys; we keep going. The same crew that designs the suite furnishes it, lists it, and runs it. Statements arrive monthly. The revenue-share means we only earn when the unit does — so the incentive is the same on both sides of the contract.", 'rentnova' ); ?></p>

				<h2><?php esc_html_e( 'Where we work.', 'rentnova' ); ?></h2>
				<p><?php esc_html_e( "Mississauga, Oakville, Burlington and the western GTA — the radius we can actually be on-site within an hour. We say no a lot. It's how we keep saying yes well.", 'rentnova' ); ?></p>
			</div>

			<aside class="rn-narrative__aside">
				<dl>
					<dt><?php esc_html_e( 'Founded', 'rentnova' ); ?></dt>
					<dd><?php esc_html_e( '2026 · Mississauga', 'rentnova' ); ?></dd>
					<dt><?php esc_html_e( 'Focus', 'rentnova' ); ?></dt>
					<dd><?php esc_html_e( 'Small multi-unit conversions', 'rentnova' ); ?></dd>
					<dt><?php esc_html_e( 'Service area', 'rentnova' ); ?></dt>
					<dd><?php esc_html_e( 'GTA west · 1-hour radius', 'rentnova' ); ?></dd>
					<dt><?php esc_html_e( 'Pricing', 'rentnova' ); ?></dt>
					<dd><?php esc_html_e( 'Revenue-share · no flat fees', 'rentnova' ); ?></dd>
					<dt><?php esc_html_e( 'Statements', 'rentnova' ); ?></dt>
					<dd><?php esc_html_e( 'Monthly · plain language', 'rentnova' ); ?></dd>
				</dl>
			</aside>
		</div>
	</section>

	<section class="rn-section" style="padding-top:0;">
		<div class="rn-head">
			<h2 class="rn-h2"><?php esc_html_e( 'What we stand for.', 'rentnova' ); ?></h2>
			<p class="rn-head__note"><?php esc_html_e( 'Three things we will not compromise on.', 'rentnova' ); ?></p>
		</div>
		<div class="rn-tracks">
			<div class="rn-track">
				<div class="rn-track__no">01 — LEGAL</div>
				<h3><?php esc_html_e( 'Permits over speed', 'rentnova' ); ?></h3>
				<p><?php esc_html_e( "Every suite we build is a legal, inspected, fire-rated unit. No grey-zone basements, no neighbour complaints, no insurance surprises.", 'rentnova' ); ?></p>
			</div>
			<div class="rn-track rn-track--alt">
				<div class="rn-track__no">02 — HONEST</div>
				<h3><?php esc_html_e( 'Real numbers up front', 'rentnova' ); ?></h3>
				<p><?php esc_html_e( "The feasibility call gives you what your lot allows, what it could generate, and what it would cost — concrete numbers, not ranges.", 'rentnova' ); ?></p>
			</div>
			<div class="rn-track">
				<div class="rn-track__no">03 — ALIGNED</div>
				<h3><?php esc_html_e( 'Paid when you are', 'rentnova' ); ?></h3>
				<p><?php esc_html_e( "Revenue-share on management means we win when your unit performs. No flat management fee that's the same whether occupancy is 90% or 40%.", 'rentnova' ); ?></p>
			</div>
		</div>
	</section>

	<div class="rn-rev">
		<h2 class="rn-h2"><?php
			echo wp_kses_post( __( 'Ready to see what your<br>lot could become?<br><em>One call, no obligation.</em>', 'rentnova' ) );
		?></h2>
		<p><?php esc_html_e( "Send us your address. Within a week you'll know what's legal on your lot, what it could earn, and what it would cost to get there.", 'rentnova' ); ?></p>
	</div>

	<section class="rn-cta">
		<h2 class="rn-h2"><?php esc_html_e( 'Book the feasibility call →', 'rentnova' ); ?></h2>
		<p><?php esc_html_e( "Thirty minutes. No deck. We answer the questions, you decide what's next.", 'rentnova' ); ?></p>
		<a class="rn-btn rn-btn--dark" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php esc_html_e( 'Contact us →', 'rentnova' ); ?></a>
	</section>

</main>
<?php
get_footer();
