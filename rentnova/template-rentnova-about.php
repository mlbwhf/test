<?php
/**
 * Template Name: RentNova About
 *
 * Drop-in About-page template for any existing WordPress theme.
 * Self-contained: all CSS is scoped under `.rnbp` and printed inline,
 * so it does NOT depend on your active theme's styles.
 *
 * HOW TO USE
 * 1. Copy this file into your active theme (or child theme) folder.
 * 2. WordPress admin → Pages → Add New (title: "About", slug: "about").
 * 3. In Page Attributes → Template, choose "RentNova About".
 * 4. Publish.
 *
 * @package rentnova-dropin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">

<style>
/* ===== RentNova About — scoped drop-in styles ===== */
.rnbp{
  width:100vw; position:relative; left:50%; right:50%;
  margin-left:-50vw; margin-right:-50vw;
  --rn-ink:#16241b; --rn-ink2:#1a1a17; --rn-paper:#f1efe8; --rn-paper2:#e9e5da;
  --rn-terra:#c45e35; --rn-sand:#e0a583; --rn-muted:#5a574c; --rn-line:#d8d3c5;
  --rn-line-dk:#2f4537; --rn-mint:#8ba090; --rn-pad:56px; --rn-max:1320px;
  font-family:'Hanken Grotesk',system-ui,-apple-system,sans-serif;
  color:var(--rn-ink2); background:var(--rn-paper); line-height:1.5;
  -webkit-font-smoothing:antialiased; box-sizing:border-box; overflow:hidden;
}
.rnbp *,.rnbp *::before,.rnbp *::after{ box-sizing:border-box; }
.rnbp h1,.rnbp h2,.rnbp h3{ margin:0; }
.rnbp a{ color:inherit; text-decoration:none; }
.rnbp__sec{ max-width:var(--rn-max); margin:0 auto; padding:64px var(--rn-pad); }
.rnbp__eyebrow{ font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.16em; color:var(--rn-terra); text-transform:uppercase; }
.rnbp__btn{ display:inline-block; font-size:15px; font-weight:700; padding:14px 24px; border-radius:4px; cursor:pointer; border:none; transition:transform .15s ease,filter .15s ease; }
.rnbp__btn:hover{ transform:translateY(-1px); filter:brightness(1.05); }
.rnbp__btn--terra{ background:var(--rn-terra); color:#fff; }
.rnbp__btn--dark{ background:var(--rn-ink2); color:#fff; }
.rnbp__h2{ font-family:'Archivo',sans-serif; font-weight:800; letter-spacing:-.03em; }

/* hero */
.rnbp__hero{ background:var(--rn-ink); color:var(--rn-paper); padding:56px var(--rn-pad) 64px; }
.rnbp__hgrid{ display:grid; grid-template-columns:1.4fr 1fr; gap:52px; align-items:end; max-width:var(--rn-max); margin:0 auto; }
.rnbp__hero h1{ font-family:'Archivo',sans-serif; font-size:64px; font-weight:900; line-height:.95; letter-spacing:-.04em; margin:22px 0; max-width:680px; }
.rnbp__hero h1 em{ color:var(--rn-sand); font-style:normal; }
.rnbp__lead{ font-size:18px; line-height:1.55; color:#c8d2c8; margin:0 0 8px; max-width:560px; }

/* hero side card — "by the numbers" */
.rnbp__bynums{ border:1px solid #34493b; border-radius:6px; padding:24px; background:rgba(255,255,255,0.03); }
.rnbp__bynums-h{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.16em; color:var(--rn-sand); text-transform:uppercase; margin-bottom:16px; }
.rnbp__bynums dl{ display:grid; grid-template-columns:1fr 1fr; gap:18px 24px; margin:0; }
.rnbp__bynums dt{ font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--rn-mint); letter-spacing:.06em; text-transform:uppercase; margin-bottom:4px; }
.rnbp__bynums dd{ font-family:'Archivo',sans-serif; font-size:24px; font-weight:800; color:var(--rn-paper); margin:0; line-height:1.05; }

/* section heads */
.rnbp__head{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:36px; gap:24px; }
.rnbp__head .rnbp__h2{ font-size:46px; line-height:1; }
.rnbp__note{ font-size:15px; color:var(--rn-muted); max-width:280px; text-align:right; margin:0; }

/* narrative */
.rnbp__narr{ display:grid; grid-template-columns:1.4fr 1fr; gap:60px; align-items:start; }
.rnbp__narr-body{ font-size:17px; line-height:1.7; color:var(--rn-muted); max-width:640px; }
.rnbp__narr-body h2{ font-family:'Archivo',sans-serif; font-size:30px; font-weight:800; letter-spacing:-.02em; color:var(--rn-ink2); margin:36px 0 14px; line-height:1.1; }
.rnbp__narr-body h2:first-child{ margin-top:0; }
.rnbp__narr-body p{ margin:0 0 18px; }
.rnbp__narr-aside{ background:var(--rn-paper2); border:1px solid var(--rn-line); border-radius:8px; padding:28px; }
.rnbp__narr-aside dl{ margin:0; }
.rnbp__narr-aside dt{ font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--rn-terra); letter-spacing:.12em; text-transform:uppercase; margin-bottom:4px; }
.rnbp__narr-aside dd{ margin:0 0 18px; font-size:15px; color:var(--rn-ink2); font-weight:600; }
.rnbp__narr-aside dd:last-child{ margin-bottom:0; }

/* values (reuses tracks layout) */
.rnbp__tracks{ display:grid; grid-template-columns:repeat(3,1fr); border:1px solid var(--rn-line); }
.rnbp__track{ padding:32px; border-right:1px solid var(--rn-line); }
.rnbp__track:last-child{ border-right:none; }
.rnbp__track--alt{ background:var(--rn-paper2); }
.rnbp__track-no{ font-family:'Archivo',sans-serif; font-size:15px; font-weight:800; color:var(--rn-terra); margin-bottom:18px; }
.rnbp__track h3{ font-size:23px; font-weight:800; margin-bottom:12px; letter-spacing:-.01em; }
.rnbp__track p{ font-size:15px; line-height:1.55; color:var(--rn-muted); margin:0; }

/* revenue */
.rnbp__rev{ max-width:calc(var(--rn-max) - var(--rn-pad)*2); margin:0 auto; background:var(--rn-ink2); color:var(--rn-paper); border-radius:10px; padding:48px; display:grid; grid-template-columns:1.3fr 1fr; gap:40px; align-items:center; }
.rnbp__rev .rnbp__h2{ font-size:40px; line-height:1.02; }
.rnbp__rev .rnbp__h2 em{ color:var(--rn-sand); font-style:normal; }
.rnbp__rev p{ font-size:16px; line-height:1.6; color:#c7c3b6; margin:0; }

/* cta */
.rnbp__cta{ background:var(--rn-terra); color:#fff; padding:64px var(--rn-pad); text-align:center; }
.rnbp__cta .rnbp__h2{ font-size:48px; font-weight:900; letter-spacing:-.035em; line-height:.98; margin-bottom:14px; }
.rnbp__cta p{ font-size:17px; line-height:1.5; opacity:.92; max-width:560px; margin:0 auto 28px; }

@media (max-width:1100px){
  .rnbp__hgrid{ grid-template-columns:1fr; gap:36px; }
  .rnbp__hero h1{ font-size:60px; }
  .rnbp__narr{ grid-template-columns:1fr; gap:30px; }
}
@media (max-width:860px){
  .rnbp{ --rn-pad:28px; }
  .rnbp__hero h1{ font-size:44px; }
  .rnbp__bynums dl{ grid-template-columns:1fr; }
  .rnbp__tracks{ grid-template-columns:1fr; }
  .rnbp__track{ border-right:none; border-bottom:1px solid var(--rn-line); }
  .rnbp__rev{ grid-template-columns:1fr; gap:20px; padding:32px; }
  .rnbp__rev .rnbp__h2{ font-size:30px; }
  .rnbp__head{ flex-direction:column; align-items:flex-start; }
  .rnbp__note{ text-align:left; }
  .rnbp__head .rnbp__h2{ font-size:34px; }
  .rnbp__cta .rnbp__h2{ font-size:34px; }
}
</style>

<div class="rnbp">

	<!-- HERO -->
	<section class="rnbp__hero">
		<div class="rnbp__hgrid">
			<div>
				<div class="rnbp__eyebrow">About</div>
				<h1>A homeowner-led team turning lots into <em>income</em>.</h1>
				<p class="rnbp__lead">We design, build, furnish, list and run the small-multi-unit homes we wished existed when we were doing this ourselves. One team. One contract. Mississauga &amp; GTA West.</p>
			</div>
			<aside class="rnbp__bynums" aria-label="By the numbers">
				<div class="rnbp__bynums-h">By the numbers</div>
				<dl>
					<div><dt>Founded</dt><dd>2026</dd></div>
					<div><dt>Service area</dt><dd>GTA West</dd></div>
					<div><dt>Avg. units / lot</dt><dd>3</dd></div>
					<div><dt>Pricing</dt><dd>Rev-share</dd></div>
				</dl>
			</aside>
		</div>
	</section>

	<!-- NARRATIVE -->
	<section class="rnbp__sec">
		<div class="rnbp__narr">
			<div class="rnbp__narr-body">
				<h2>Why we started.</h2>
				<p>We bought a tired Mississauga semi, added a legal basement suite and a garden suite, furnished both, and rented all three units. Six months in we'd done it all twice over — once for ourselves, once on behalf of the friends and neighbours who'd seen the result and asked us to do theirs too.</p>
				<p>Every owner we worked with was solving the same five problems in series: zoning, design, build, furnish, run. Each step had its own vendor, its own invoice, and its own way of dropping the ball at the handoff. RentNova exists to collapse all of that into one team and one contract.</p>

				<h2>How we work.</h2>
				<p>Builders hand you keys; we keep going. The same crew that designs the suite furnishes it, lists it, and runs it. Statements arrive monthly. The revenue-share means we only earn when the unit does — so the incentive is the same on both sides of the contract.</p>

				<h2>Where we work.</h2>
				<p>Mississauga, Oakville, Burlington, Hamilton and Milton — the radius we can actually be on-site within an hour. We say no a lot. It's how we keep saying yes well.</p>
			</div>
			<aside class="rnbp__narr-aside">
				<dl>
					<dt>Founded</dt><dd>2026 · Mississauga</dd>
					<dt>Focus</dt><dd>Small multi-unit conversions</dd>
					<dt>Service area</dt><dd>GTA west · 1-hour radius</dd>
					<dt>Pricing</dt><dd>Revenue-share · no flat fees</dd>
					<dt>Statements</dt><dd>Monthly · plain language</dd>
				</dl>
			</aside>
		</div>
	</section>

	<!-- VALUES -->
	<section class="rnbp__sec" style="padding-top:0;">
		<div class="rnbp__head">
			<h2 class="rnbp__h2">What we stand for.</h2>
			<p class="rnbp__note">Three things we will not compromise on.</p>
		</div>
		<div class="rnbp__tracks">
			<div class="rnbp__track">
				<div class="rnbp__track-no">01 — LEGAL</div>
				<h3>Permits over speed</h3>
				<p>Every suite we build is a legal, inspected, fire-rated unit. No grey-zone basements, no neighbour complaints, no insurance surprises.</p>
			</div>
			<div class="rnbp__track rnbp__track--alt">
				<div class="rnbp__track-no">02 — HONEST</div>
				<h3>Real numbers up front</h3>
				<p>The feasibility call gives you what your lot allows, what it could generate, and what it would cost — concrete numbers, not ranges.</p>
			</div>
			<div class="rnbp__track">
				<div class="rnbp__track-no">03 — ALIGNED</div>
				<h3>Paid when you are</h3>
				<p>Revenue-share on management means we win when your unit performs. No flat management fee that's the same whether occupancy is 90% or 40%.</p>
			</div>
		</div>
	</section>

	<!-- REVENUE SHARE -->
	<section class="rnbp__rev">
		<h2 class="rnbp__h2">Ready to see what your<br>lot could become?<br><em>One call, no obligation.</em></h2>
		<p>Send us your address. Within a week you'll know what's legal on your lot, what it could earn, and what it would cost to get there.</p>
	</section>

	<!-- CTA -->
	<section class="rnbp__cta">
		<h2 class="rnbp__h2">Book the feasibility call →</h2>
		<p>Thirty minutes. No deck. We answer the questions, you decide what's next.</p>
		<a class="rnbp__btn rnbp__btn--dark" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact us →</a>
	</section>

</div>
<?php
get_footer();
