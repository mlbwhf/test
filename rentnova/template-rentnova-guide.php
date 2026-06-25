<?php
/**
 * Template Name: RentNova Guide
 *
 * Drop-in long-form "how it works" guide page for any existing
 * WordPress theme. Walks an owner through the six-step delivery
 * pipeline (Feasibility → Design → Build → Furnish → List → Manage),
 * then answers common questions. Self-contained: all CSS scoped under
 * `.rnbp` and printed inline, so it does NOT depend on the active
 * theme's styles.
 *
 * HOW TO USE
 * 1. Copy this file into your active theme (or child theme) folder.
 * 2. WordPress admin → Pages → Add New (title: "Guide", slug: "guide").
 * 3. In Page Attributes → Template, choose "RentNova Guide".
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
/* ===== RentNova Guide — scoped drop-in styles ===== */
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
.rnbp__eyebrow{ font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.16em; color:var(--rn-terra); text-transform:uppercase; }
.rnbp__btn{ display:inline-block; font-size:15px; font-weight:700; padding:14px 24px; border-radius:4px; cursor:pointer; border:none; transition:transform .15s ease,filter .15s ease; }
.rnbp__btn:hover{ transform:translateY(-1px); filter:brightness(1.05); }
.rnbp__btn--terra{ background:var(--rn-terra); color:#fff; }
.rnbp__btn--dark{ background:var(--rn-ink2); color:#fff; }
.rnbp__h2{ font-family:'Archivo',sans-serif; font-weight:800; letter-spacing:-.03em; }

/* hero */
.rnbp__hero{ background:var(--rn-ink); color:var(--rn-paper); padding:56px var(--rn-pad) 64px; }
.rnbp__hero-in{ max-width:var(--rn-max); margin:0 auto; }
.rnbp__hero h1{ font-family:'Archivo',sans-serif; font-size:64px; font-weight:900; line-height:.95; letter-spacing:-.04em; margin:22px 0; max-width:880px; }
.rnbp__hero h1 em{ color:var(--rn-sand); font-style:normal; }
.rnbp__lead{ font-size:18px; line-height:1.55; color:#c8d2c8; margin:0; max-width:600px; }

/* in-page nav (table of contents) */
.rnbp__toc{ background:var(--rn-paper2); border-bottom:1px solid var(--rn-line); position:sticky; top:0; z-index:5; }
.rnbp__toc-in{ max-width:var(--rn-max); margin:0 auto; padding:0 var(--rn-pad); display:flex; align-items:stretch; flex-wrap:wrap; }
.rnbp__toc a{ padding:18px 22px; display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; color:var(--rn-ink2); border-right:1px solid var(--rn-line); transition:background .15s ease; }
.rnbp__toc a:last-child{ border-right:none; }
.rnbp__toc a:hover{ background:#fff; }
.rnbp__toc i{ font-family:'IBM Plex Mono',monospace; font-style:normal; font-size:11px; color:var(--rn-terra); letter-spacing:.08em; }
.rnbp__toc-end{ margin-left:auto; color:var(--rn-terra)!important; }

/* step block */
.rnbp__step-block{ max-width:var(--rn-max); margin:0 auto; padding:80px var(--rn-pad); border-bottom:1px solid var(--rn-line); }
.rnbp__step-block:last-of-type{ border-bottom:none; }
.rnbp__step-in{ max-width:1040px; margin:0 auto; }
.rnbp__step-head{ display:grid; grid-template-columns:140px 1fr; gap:32px; align-items:center; margin-bottom:32px; }
.rnbp__step-badge{ width:120px; height:120px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-family:'Archivo',sans-serif; font-size:52px; font-weight:900; color:var(--rn-paper); letter-spacing:-.04em; }
.rnbp__step-badge--1{ background:#16241b; }
.rnbp__step-badge--2{ background:#1f3326; }
.rnbp__step-badge--3{ background:#284230; }
.rnbp__step-badge--4{ background:#31503b; }
.rnbp__step-badge--5{ background:#3a5e45; }
.rnbp__step-badge--6{ background:var(--rn-terra); }
.rnbp__step-label{ font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.16em; color:var(--rn-terra); text-transform:uppercase; margin-bottom:8px; }
.rnbp__step-title{ font-family:'Archivo',sans-serif; font-size:34px; font-weight:800; letter-spacing:-.02em; line-height:1.05; }

.rnbp__step-meta{ display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--rn-line); border-bottom:1px solid var(--rn-line); margin-bottom:32px; }
.rnbp__step-meta > div{ padding:16px 20px; border-right:1px solid var(--rn-line); }
.rnbp__step-meta > div:last-child{ border-right:none; }
.rnbp__step-meta span{ font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.16em; color:var(--rn-mint); text-transform:uppercase; display:block; margin-bottom:4px; }
.rnbp__step-meta b{ font-family:'Archivo',sans-serif; font-size:20px; font-weight:800; letter-spacing:-.01em; color:var(--rn-ink2); }

.rnbp__step-body{ display:grid; grid-template-columns:1fr 1fr; gap:48px; }
.rnbp__step-col h3{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.16em; color:var(--rn-terra); text-transform:uppercase; margin-bottom:14px; font-weight:500; }
.rnbp__step-col p{ font-size:16px; line-height:1.65; color:var(--rn-muted); margin:0 0 14px; }
.rnbp__step-col p:last-child{ margin-bottom:0; }
.rnbp__step-col ul{ list-style:none; margin:0; padding:0; }
.rnbp__step-col li{ font-size:15px; line-height:1.5; color:var(--rn-ink2); padding:12px 0; border-bottom:1px dashed var(--rn-line); }
.rnbp__step-col li:last-child{ border-bottom:none; }
.rnbp__step-col li::before{ content:"·"; color:var(--rn-terra); font-weight:700; padding-right:10px; }

/* FAQ */
.rnbp__faq-section{ background:var(--rn-paper2); padding:80px var(--rn-pad); }
.rnbp__faq-in{ max-width:var(--rn-max); margin:0 auto; }
.rnbp__head{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:36px; gap:24px; }
.rnbp__head .rnbp__h2{ font-size:46px; line-height:1; }
.rnbp__note{ font-size:15px; color:var(--rn-muted); max-width:280px; text-align:right; margin:0; }
.rnbp__faq{ border-top:1px solid var(--rn-line); max-width:920px; margin:0 auto; }
.rnbp__faq-item{ border-bottom:1px solid var(--rn-line); }
.rnbp__faq-item > summary{ list-style:none; cursor:pointer; padding:24px 0; display:flex; justify-content:space-between; align-items:center; gap:24px; font-family:'Archivo',sans-serif; font-size:20px; font-weight:700; letter-spacing:-.01em; color:var(--rn-ink2); }
.rnbp__faq-item > summary::-webkit-details-marker{ display:none; }
.rnbp__faq-item > summary::after{ content:"+"; font-family:'IBM Plex Mono',monospace; font-size:24px; font-weight:400; color:var(--rn-terra); flex:none; transition:transform .15s ease; }
.rnbp__faq-item[open] > summary::after{ content:"−"; }
.rnbp__faq-item > p{ padding:0 0 24px; margin:0; font-size:16px; line-height:1.65; color:var(--rn-muted); max-width:760px; }

/* cta */
.rnbp__cta{ background:var(--rn-terra); color:#fff; padding:64px var(--rn-pad); text-align:center; }
.rnbp__cta .rnbp__h2{ font-size:48px; font-weight:900; letter-spacing:-.035em; line-height:.98; margin-bottom:14px; }
.rnbp__cta .rnbp__h2 em{ color:var(--rn-ink2); font-style:normal; }
.rnbp__cta p{ font-size:17px; line-height:1.5; opacity:.92; max-width:560px; margin:0 auto 28px; }

@media (max-width:1100px){
  .rnbp__hero h1{ font-size:54px; }
  .rnbp__step-title{ font-size:30px; }
}
@media (max-width:860px){
  .rnbp{ --rn-pad:28px; }
  .rnbp__hero h1{ font-size:40px; }
  .rnbp__toc{ position:static; overflow-x:auto; }
  .rnbp__toc-in{ flex-wrap:nowrap; padding:0; }
  .rnbp__toc a{ padding:14px 16px; font-size:13px; white-space:nowrap; flex:none; }
  .rnbp__toc-end{ margin-left:0; }
  .rnbp__step-block{ padding:48px var(--rn-pad); }
  .rnbp__step-head{ grid-template-columns:1fr; gap:20px; }
  .rnbp__step-badge{ width:80px; height:80px; font-size:34px; }
  .rnbp__step-title{ font-size:26px; }
  .rnbp__step-meta{ grid-template-columns:1fr; }
  .rnbp__step-meta > div{ border-right:none; border-bottom:1px solid var(--rn-line); }
  .rnbp__step-meta > div:last-child{ border-bottom:none; }
  .rnbp__step-body{ grid-template-columns:1fr; gap:28px; }
  .rnbp__faq-section{ padding:56px var(--rn-pad); }
  .rnbp__head{ flex-direction:column; align-items:flex-start; }
  .rnbp__note{ text-align:left; }
  .rnbp__head .rnbp__h2{ font-size:34px; }
  .rnbp__faq-item > summary{ font-size:17px; padding:20px 0; }
  .rnbp__cta .rnbp__h2{ font-size:34px; }
}
</style>

<div class="rnbp">

	<!-- HERO -->
	<section class="rnbp__hero">
		<div class="rnbp__hero-in">
			<div class="rnbp__eyebrow">Guide</div>
			<h1>From one home<br>to <em>three working units</em>.<br>Here's how.</h1>
			<p class="rnbp__lead">A full walk-through of the six steps we run for every owner — what happens, what it costs, what we need from you. Read it end-to-end or jump to a step.</p>
		</div>
	</section>

	<!-- IN-PAGE TOC -->
	<nav class="rnbp__toc" aria-label="Guide sections">
		<div class="rnbp__toc-in">
			<a href="#step-01"><i>01</i>Feasibility</a>
			<a href="#step-02"><i>02</i>Design</a>
			<a href="#step-03"><i>03</i>Build</a>
			<a href="#step-04"><i>04</i>Furnish</a>
			<a href="#step-05"><i>05</i>List</a>
			<a href="#step-06"><i>06</i>Manage</a>
			<a class="rnbp__toc-end" href="#faq">FAQ →</a>
		</div>
	</nav>

	<!-- STEP 01 — FEASIBILITY -->
	<section class="rnbp__step-block" id="step-01">
		<div class="rnbp__step-in">
			<header class="rnbp__step-head">
				<div class="rnbp__step-badge rnbp__step-badge--1">01</div>
				<div>
					<div class="rnbp__step-label">Feasibility</div>
					<h2 class="rnbp__step-title">Figure out what your lot allows.</h2>
				</div>
			</header>
			<div class="rnbp__step-meta">
				<div><span>Time</span><b>1–2 weeks</b></div>
				<div><span>Cost</span><b>$0 to you</b></div>
				<div><span>Deliverable</span><b>1-page memo</b></div>
			</div>
			<div class="rnbp__step-body">
				<div class="rnbp__step-col">
					<h3>What happens</h3>
					<p>We pull your lot's zoning, bylaw setbacks, parking minimums and floor-area ratios. Then we walk the lot, mark what's physically buildable, and put dollar ranges to each scenario that fits — main-only refresh, plus a basement suite, plus a garden suite, full triplex conversion.</p>
					<p>You leave Step 01 with concrete numbers for your specific address, not generic ranges off a calculator.</p>
				</div>
				<div class="rnbp__step-col">
					<h3>What you give us</h3>
					<ul>
						<li>Your address</li>
						<li>A few photos of the lot, or a 30-min window to walk it</li>
						<li>Your goals: live in one unit, rent them all, mix</li>
						<li>Any survey or floor plan you already have</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- STEP 02 — DESIGN -->
	<section class="rnbp__step-block" id="step-02">
		<div class="rnbp__step-in">
			<header class="rnbp__step-head">
				<div class="rnbp__step-badge rnbp__step-badge--2">02</div>
				<div>
					<div class="rnbp__step-label">Design</div>
					<h2 class="rnbp__step-title">Architectural drawings, ready for permit.</h2>
				</div>
			</header>
			<div class="rnbp__step-meta">
				<div><span>Time</span><b>4–8 weeks</b></div>
				<div><span>Cost</span><b>Fixed at sign-off</b></div>
				<div><span>Deliverable</span><b>Permit-ready set</b></div>
			</div>
			<div class="rnbp__step-body">
				<div class="rnbp__step-col">
					<h3>What happens</h3>
					<p>A 3-D massing study first — one or two cheap, fast options before any drafting time goes in. Once you pick a direction we lock the scope and produce the permit package: site plan, floor plans, elevations, sections, schedules, energy and structural notes.</p>
					<p>We hand the package to the city. You don't have to learn how building department portals work.</p>
				</div>
				<div class="rnbp__step-col">
					<h3>What you give us</h3>
					<ul>
						<li>Feedback on the massing options (1–2 rounds)</li>
						<li>Sign-off on the final layout</li>
						<li>Decisions on the half-dozen finishes the design needs to lock</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- STEP 03 — BUILD -->
	<section class="rnbp__step-block" id="step-03">
		<div class="rnbp__step-in">
			<header class="rnbp__step-head">
				<div class="rnbp__step-badge rnbp__step-badge--3">03</div>
				<div>
					<div class="rnbp__step-label">Build</div>
					<h2 class="rnbp__step-title">Permits, demo, build, inspections.</h2>
				</div>
			</header>
			<div class="rnbp__step-meta">
				<div><span>Time</span><b>3–6 months</b></div>
				<div><span>Cost</span><b>Per fixed scope</b></div>
				<div><span>Deliverable</span><b>Inspected, habitable units</b></div>
			</div>
			<div class="rnbp__step-body">
				<div class="rnbp__step-col">
					<h3>What happens</h3>
					<p>Vetted GCs we run jobs with weekly — not a one-off subcontractor we found for your project. The scope is locked at design sign-off, so the build doesn't drift; change orders are explicit, signed, and itemised.</p>
					<p>You get a private dashboard with weekly site photos, the change-order log, and the run-rate against your budget.</p>
				</div>
				<div class="rnbp__step-col">
					<h3>What you give us</h3>
					<ul>
						<li>Visit the site whenever you want (just text first)</li>
						<li>Respond to spec questions within 48 hours</li>
						<li>Sign off on rough-in inspections when they pass</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- STEP 04 — FURNISH -->
	<section class="rnbp__step-block" id="step-04">
		<div class="rnbp__step-in">
			<header class="rnbp__step-head">
				<div class="rnbp__step-badge rnbp__step-badge--4">04</div>
				<div>
					<div class="rnbp__step-label">Furnish</div>
					<h2 class="rnbp__step-title">Turn-key fit and finish.</h2>
				</div>
			</header>
			<div class="rnbp__step-meta">
				<div><span>Time</span><b>2–3 weeks</b></div>
				<div><span>Cost</span><b>$8k–$25k / unit</b></div>
				<div><span>Deliverable</span><b>Guest-ready unit</b></div>
			</div>
			<div class="rnbp__step-body">
				<div class="rnbp__step-col">
					<h3>What happens</h3>
					<p>Furniture, mattresses, linens, kitchen, art, signage. Each unit gets a documented spec sheet — so when something breaks a year from now the replacement matches what was there.</p>
					<p>We bias to durable mid-tier pieces that read better on camera than they cost. Guests notice; you don't pay for it twice.</p>
				</div>
				<div class="rnbp__step-col">
					<h3>What you give us</h3>
					<ul>
						<li>A few style nudges if you have strong preferences</li>
						<li>Otherwise — we choose. You'll see the spec before we order.</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- STEP 05 — LIST -->
	<section class="rnbp__step-block" id="step-05">
		<div class="rnbp__step-in">
			<header class="rnbp__step-head">
				<div class="rnbp__step-badge rnbp__step-badge--5">05</div>
				<div>
					<div class="rnbp__step-label">List</div>
					<h2 class="rnbp__step-title">Photograph, write, price, publish.</h2>
				</div>
			</header>
			<div class="rnbp__step-meta">
				<div><span>Time</span><b>1 week</b></div>
				<div><span>Cost</span><b>Included</b></div>
				<div><span>Deliverable</span><b>Live listings + direct site</b></div>
			</div>
			<div class="rnbp__step-body">
				<div class="rnbp__step-col">
					<h3>What happens</h3>
					<p>Professional photo shoot. Listing copy written by someone who's read enough comps to know what converts. Dynamic pricing wired up on Airbnb, Booking.com, and a direct-book page on your own subdomain.</p>
					<p>Your unit goes live across every channel at the same time, with a co-ordinated launch promo to seed early reviews.</p>
				</div>
				<div class="rnbp__step-col">
					<h3>What you give us</h3>
					<ul>
						<li>Sign the management agreement</li>
						<li>That's it</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- STEP 06 — MANAGE -->
	<section class="rnbp__step-block" id="step-06">
		<div class="rnbp__step-in">
			<header class="rnbp__step-head">
				<div class="rnbp__step-badge rnbp__step-badge--6">06</div>
				<div>
					<div class="rnbp__step-label">Manage</div>
					<h2 class="rnbp__step-title">Run it. Forever.</h2>
				</div>
			</header>
			<div class="rnbp__step-meta">
				<div><span>Time</span><b>Ongoing</b></div>
				<div><span>Cost</span><b>Revenue-share</b></div>
				<div><span>Deliverable</span><b>Monthly statement</b></div>
			</div>
			<div class="rnbp__step-body">
				<div class="rnbp__step-col">
					<h3>What happens</h3>
					<p>24/7 guest comms, turnovers, restocking, maintenance triage. We send a monthly statement with revenue, fees, occupancy, ADR and a year-end summary you can hand to your accountant without re-typing anything.</p>
					<p>The revenue-share means we win when your unit performs — there's no flat fee that ignores whether occupancy is 90% or 40%.</p>
				</div>
				<div class="rnbp__step-col">
					<h3>What you give us</h3>
					<ul>
						<li>A credit card on file for guest damage holds</li>
						<li>Otherwise — nothing</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section class="rnbp__faq-section" id="faq">
		<div class="rnbp__faq-in">
			<div class="rnbp__head">
				<h2 class="rnbp__h2">Common questions.</h2>
				<p class="rnbp__note">If yours isn't here, send it over — we'll answer in the feasibility call.</p>
			</div>
			<div class="rnbp__faq">
				<details class="rnbp__faq-item">
					<summary>How much does the whole thing usually cost?</summary>
					<p>Lot-dependent. A basement suite alone runs $80k–$140k all-in, including design and furnishing. Adding a garden suite typically lands $300k–$500k. The Step 01 feasibility memo gives you the numbers for your specific lot — that's the whole point of starting there.</p>
				</details>
				<details class="rnbp__faq-item">
					<summary>What's the revenue-share percentage?</summary>
					<p>Depends on scope. Pure management is in the 18–24% range. Build-plus-manage gets a different split because we have more skin in the game. Both are spelled out in your engagement letter — no surprises mid-stream.</p>
				</details>
				<details class="rnbp__faq-item">
					<summary>Do I need to move out during construction?</summary>
					<p>For a basement-only build, no — the work happens below grade and the main floor stays habitable. Garden-suite builds happen entirely outside your home. Full multi-unit conversions usually need a 4–8 week stretch where you're either travelling or in a furnished short-stay; we'll help arrange one.</p>
				</details>
				<details class="rnbp__faq-item">
					<summary>What if I want to use one of the units myself?</summary>
					<p>Common. We design and run the rest, and you keep the keys to "yours." The revenue-share only applies to the units we actually manage. Owners who keep the main residence and short-stay the basement + garden suite are our most common setup.</p>
				</details>
				<details class="rnbp__faq-item">
					<summary>What if it doesn't pencil out?</summary>
					<p>The feasibility memo will say so. We'd rather tell you "your lot doesn't justify the build" in week two than two years in. About 1 in 5 lots we look at don't move past Step 01 — and that's a useful answer too.</p>
				</details>
				<details class="rnbp__faq-item">
					<summary>Can you do this on a property I don't own yet?</summary>
					<p>Yes — sometimes we run the feasibility before close so you know what you're buying. Useful when the listing photos hide whether the basement can legally become a suite.</p>
				</details>
				<details class="rnbp__faq-item">
					<summary>Who owns the listings?</summary>
					<p>You. The direct-book URL, the Airbnb and Booking.com accounts, the reviews — all in your name. If you ever leave us, it stays with the property.</p>
				</details>
				<details class="rnbp__faq-item">
					<summary>What's the minimum timeline from "yes" to "first guest"?</summary>
					<p>Basement suite: ~4 months. Garden suite: ~7 months. Full multiplex conversion: 12–18 months depending on city processing. Permit timelines vary more than build timelines.</p>
				</details>
				<details class="rnbp__faq-item">
					<summary>Do you work outside the GTA?</summary>
					<p>No. We stay inside a 1-hour radius from Mississauga so we can actually be on-site when something breaks. Saying no a lot is how we keep saying yes well.</p>
				</details>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="rnbp__cta">
		<h2 class="rnbp__h2">Ready to start with<br><em>Step 01?</em></h2>
		<p>The feasibility memo is free. Send your address and a couple of photos — we'll put numbers to your lot within two weeks.</p>
		<a class="rnbp__btn rnbp__btn--dark" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Book the call →</a>
	</section>

</div>
<?php
get_footer();
