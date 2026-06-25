<?php
/**
 * Title: RentNova: Owners hero
 * Slug: rentnova/hero-owners
 * Categories: rentnova
 * Description: Dark green hero for the Owners page — eyebrow, headline, lead, two buttons, four-cell stat strip.
 * Keywords: hero, owners, dark
 * Block Types: core/post-content
 */
?>
<!-- wp:group {"tagName":"section","className":"rn-hero","style":{"spacing":{"padding":{"bottom":"48px"}}},"layout":{"type":"default"}} -->
<section class="wp-block-group rn-hero" style="padding-bottom:48px">
	<!-- wp:group {"className":"rn-hero__inner","layout":{"type":"default"}} -->
	<div class="wp-block-group rn-hero__inner">
		<!-- wp:paragraph {"className":"rn-eyebrow"} -->
		<p class="rn-eyebrow">Owners</p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":1,"style":{"typography":{"fontSize":"64px"}}} -->
		<h1 class="wp-block-heading" style="font-size:64px">One home. Two or three <em>legal income</em> units.</h1>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"className":"rn-hero__lead"} -->
		<p class="rn-hero__lead">You own the lot. We turn it into a multi-unit asset — designed, built, furnished, listed and run by one team on a revenue-share. Statements monthly, no flat fees.</p>
		<!-- /wp:paragraph -->

		<!-- wp:html -->
		<div class="rn-hero__actions">
			<a class="rn-btn rn-btn--terra" href="/contact/">Free feasibility →</a>
			<a class="rn-btn rn-btn--ghost" href="/stays/">See finished homes</a>
		</div>
		<!-- /wp:html -->

		<!-- wp:html -->
		<div class="rn-stats">
			<div class="rn-stat"><div class="rn-stat__n">3 units</div><div class="rn-stat__l">from one lot</div></div>
			<div class="rn-stat"><div class="rn-stat__n">1 team</div><div class="rn-stat__l">design → manage</div></div>
			<div class="rn-stat"><div class="rn-stat__n">$0</div><div class="rn-stat__l">feasibility call</div></div>
			<div class="rn-stat"><div class="rn-stat__n">Rev-share</div><div class="rn-stat__l">paid when you are</div></div>
		</div>
		<!-- /wp:html -->
	</div>
	<!-- /wp:group -->
</section>
<!-- /wp:group -->
