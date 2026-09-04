<?php
/**
 * AA – TEMP: redirect confirmation emails
 * -----------------------------------------------------------------------------
 * ONE-RUN DIAGNOSTIC. DELETE THIS SNIPPET IMMEDIATELY AFTERWARDS.
 *
 * Purpose
 *   Doug Logan paid on 2 Sep (cs_live_a1JKWS…, spc-2026-10-19, USD 2,875.00).
 *   The webhook never fired, because the Stripe endpoint was subscribed only to
 *   charge.captured. He was sent his confirmation and invoice by hand on 3 Sep
 *   as order AA-260902-01.
 *
 *   Resending evt_1UBLdqGdQx9wDCeGCAL5g1Sv now backfills what the webhook
 *   should have done: the Registrations record and the seat decrement on
 *   spc-2026-10-19. But it would also mail him a SECOND confirmation, carrying
 *   a different order number -- aa_reg_order_no() pads the new post ID, so it
 *   would read AA-03xxxx. Two invoices, two numbers, one charge, at a Deloitte
 *   AP desk.
 *
 *   This redirects the send so the record and the seat count are created and
 *   nothing reaches the buyer.
 *
 * Why it redirects EVERY confirmation rather than matching Doug's address
 *   A conditional guard fails open: if the match misses for any reason -- a
 *   different address on the session, whitespace, a filter ahead of this one --
 *   the mail goes to the customer and there is no undo, because the handler's
 *   duplicate-event guard means the delivery cannot be replayed or retracted.
 *   Redirecting unconditionally fails the other way: the worst case is that a
 *   real buyer's confirmation lands in your inbox during the few minutes this
 *   is active, and you forward it. One failure mode is unrecoverable; the other
 *   is a forward. So: fail closed.
 *
 * Why it hooks aa_reg_confirmation and keys off $mail['to']
 *   The filter is applied in aa_reg_send_confirmation() over the finished
 *   message. $mail['to'] is the value that actually decides delivery, so that
 *   is what gets changed -- not $args['email'], which merely seeds it.
 *
 * Inert on the old build: if AA – Register PHP predates the confirmation
 * feature there is no send to intercept, and this does nothing.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

add_filter( 'aa_reg_confirmation', function ( $mail, $args ) {

	$intended = isset( $mail['to'] ) ? (string) $mail['to'] : '';

	$mail['to']      = 'mlbwhf@gmail.com';
	$mail['subject'] = '[REDIRECTED] ' . ( isset( $mail['subject'] ) ? $mail['subject'] : '' );

	/* Say who it was for, at the top of the message, so a redirected mail can
	   never be mistaken for one that actually reached its buyer. */
	$note = '<div style="font:13px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;'
	      . 'background:#FFF4E5;border:1px solid #E0B080;border-radius:8px;'
	      . 'padding:12px 14px;margin:0 0 22px;color:#6B4A18">'
	      . '<strong>Redirected — not delivered to the buyer.</strong><br>'
	      . 'Intended recipient: <strong>' . esc_html( $intended ) . '</strong><br>'
	      . 'Cohort: ' . esc_html( isset( $args['cohort'] ) ? $args['cohort'] : '?' )
	      . ' &middot; the temporary snippet "AA – TEMP: redirect confirmations" is active.'
	      . '</div>';

	$mail['body'] = $note . ( isset( $mail['body'] ) ? $mail['body'] : '' );

	return $mail;
}, 10, 2 );
