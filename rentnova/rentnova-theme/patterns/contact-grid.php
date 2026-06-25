<?php
/**
 * Title: RentNova: Contact info + form
 * Slug: rentnova/contact-grid
 * Categories: rentnova
 * Description: Two-column layout: contact info rows on the left, a feasibility-call form on the right.
 * Keywords: contact, form, info
 * Block Types: core/post-content
 */
?>
<!-- wp:group {"tagName":"section","className":"rn-section","layout":{"type":"default"}} -->
<section class="wp-block-group rn-section">
	<!-- wp:html -->
	<div class="rn-contact">

		<div class="rn-contact__info">
			<div class="rn-contact__row">
				<div class="rn-contact__label">Email</div>
				<div class="rn-contact__val"><a href="mailto:hello@rent-nova.com">hello@rent-nova.com</a></div>
			</div>
			<div class="rn-contact__row">
				<div class="rn-contact__label">Phone</div>
				<div class="rn-contact__val"><a href="tel:+19055550143">+1 (905) 555-0143</a></div>
			</div>
			<div class="rn-contact__row">
				<div class="rn-contact__label">Where</div>
				<div class="rn-contact__val">Mississauga · GTA west</div>
			</div>
			<div class="rn-contact__row">
				<div class="rn-contact__label">Hours</div>
				<div class="rn-contact__val">Mon–Fri · 9am–6pm ET</div>
			</div>
			<div class="rn-contact__row">
				<div class="rn-contact__label">Response</div>
				<div class="rn-contact__val">Within one business day</div>
			</div>
		</div>

		<form class="rn-form" method="post" action="#">
			<div class="rn-form__cols">
				<div class="rn-form__row">
					<label for="rn-name">Your name</label>
					<input type="text" id="rn-name" name="rn_name" required autocomplete="name">
				</div>
				<div class="rn-form__row">
					<label for="rn-email">Email</label>
					<input type="email" id="rn-email" name="rn_email" required autocomplete="email">
				</div>
			</div>
			<div class="rn-form__cols">
				<div class="rn-form__row">
					<label for="rn-phone">Phone (optional)</label>
					<input type="tel" id="rn-phone" name="rn_phone" autocomplete="tel">
				</div>
				<div class="rn-form__row">
					<label for="rn-goal">What you're after</label>
					<select id="rn-goal" name="rn_goal">
						<option value="convert">Convert my home</option>
						<option value="manage">Manage an existing unit</option>
						<option value="stay">Book a stay</option>
						<option value="other">Something else</option>
					</select>
				</div>
			</div>
			<div class="rn-form__row">
				<label for="rn-address">Property address (optional)</label>
				<input type="text" id="rn-address" name="rn_address" autocomplete="street-address" placeholder="Street, City, ON">
			</div>
			<div class="rn-form__row">
				<label for="rn-msg">Anything we should know</label>
				<textarea id="rn-msg" name="rn_msg" rows="4" placeholder="Lot size, basement situation, timeline…"></textarea>
			</div>
			<button type="submit" class="rn-btn rn-btn--terra">Send → book the call</button>
		</form>

	</div>
	<!-- /wp:html -->
</section>
<!-- /wp:group -->
