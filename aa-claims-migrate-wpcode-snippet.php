/**
 * Agile Agilist — CLAIMS MIGRATION (run once, then delete)
 * -----------------------------------------------------------------------------
 * Writes the claims cleanup into the stored page content, so the claim is gone
 * from the database rather than merely hidden as the page renders.
 *
 * This is the cleanup that snippet 32392 ("CLAIMS CLEANUP") says is worth doing
 * eventually and lists with [aa_claims_report]. 32392 STAYS INSTALLED AND
 * ENABLED afterwards. It is not replaced by this and must not be disabled:
 *
 *   - it also strips aggregateRating, renames the book canon (Six Practices,
 *     Failure Harvest) and carries dozens of per-page factual fixes, none of
 *     which this migration touches;
 *   - once the source is clean its guarantee rules simply stop matching, which
 *     costs nothing and leaves a second line of defence in place.
 *
 * Right now 32392 is the ONLY thing between "money-back pass guarantee" and
 * the public on ~70 posts. One disabled snippet, one failed code-cache rebuild,
 * and a refund promise we cannot honour is live in four languages. That is the
 * reason to clean the source.
 *
 * -----------------------------------------------------------------------------
 * IT TAKES ITS RULES FROM 32392. IT DOES NOT COPY THEM.
 *
 * Every pattern comes from aa_claims_rules() and aa_claims_heading_swaps() in
 * 32392 at run time. No pattern is duplicated here, on purpose: 32392's own
 * notes record that a copied Arabic pattern which drifted from the original is
 * why the /ar/ home page published the guarantee for as long as it did. One
 * definition, one place.
 *
 * If 32392 is not loaded this snippet refuses to do anything at all.
 *
 * -----------------------------------------------------------------------------
 * USAGE — dry run first, always
 *
 *   1. WPCode -> PHP Snippet, "AA - Claims migrate", Auto Insert, Run Everywhere.
 *   2. Put [aa_claims_migrate] on any page you can see as an admin.
 *      It reports and writes NOTHING.
 *   3. Read it. Check the rule list it selected and the per-post preview.
 *   4. [aa_claims_migrate apply="yes"] to write.
 *   5. Delete this snippet. It has no business staying on a live site.
 *
 * Admin-only at every entry point, and apply="yes" additionally requires the
 * one-click confirm link, so a shortcode left on a page by accident cannot
 * rewrite the site on a visitor's pageview.
 *
 * -----------------------------------------------------------------------------
 * SAFETY
 *
 *   - wp_update_post, so every change leaves a REVISION and is revertible from
 *     the editor, page by page.
 *   - the tag-balance guard from 32392 is applied per post. A post whose
 *     rewrite changes the div/section/p balance is SKIPPED and named in the
 *     report. 32392's header records what an unbalanced rewrite did to the
 *     course pages once: a surplus </div> closed .aa-rd early and every
 *     `.aa-rd .x` rule on the site stopped applying, invisibly, because the
 *     block editor renders each block in its own subtree and looked fine.
 *   - no general whitespace or punctuation tidy pass. Same reason as 32392:
 *     page content holds inline <style>, and ".aa-rd .aa-faqwrap" becoming
 *     ".aa-rd.aa-faqwrap" silently breaks a descendant selector.
 *   - aggregateRating is left alone unless you ask for it (rating="yes"). It is
 *     a different decision from the guarantee and 32392 handles it at render.
 */

if ( ! function_exists( 'aa_claims_migrate_rules' ) ) :

/**
 * The guarantee rules only, selected out of 32392's full ordered list.
 *
 * 32392's aa_claims_rules() mixes two unrelated jobs in one array: the book
 * canon renames (5 pillars -> Six Practices, Failure Forum -> Failure Harvest)
 * and the pass-guarantee replacements. Only the guarantee is in scope here —
 * the canon renames are a live editorial decision that belongs at render until
 * someone decides otherwise.
 *
 * Selected by signature rather than by array index, because an index would
 * silently select the wrong rule the first time 32392's list is reordered —
 * and that list is explicitly order-dependent, so it will be reordered.
 *
 * THE DRY RUN PRINTS EVERY SELECTED PATTERN so the selection is auditable
 * before anything is written. If a rule you expect is missing, or one you do
 * not expect is present, that is visible before the write, not after.
 */
function aa_claims_migrate_rules() {
	if ( ! function_exists( 'aa_claims_rules' ) ) { return array(); }

	/* Signatures of the guarantee claim in all four languages, plus the card
	   body sentences. Matched against the PATTERN TEXT, not against page
	   content. AA_CLAIMS_AR_GUARANTEE is 32392's own Arabic fragment, so the
	   Arabic rules are selected by the same constant that defines them. */
	$signatures = array(
		'pass guarantee',                       // EN
		'Retake the next cohort free',          // EN card body
		'remboursement',                        // FR
		'Refaites la cohorte suivante',         // FR card body
		'reembolso',                            // ES
		'Repite la siguiente cohorte',          // ES card body
	);
	if ( defined( 'AA_CLAIMS_AR_GUARANTEE' ) ) {
		$signatures[] = AA_CLAIMS_AR_GUARANTEE;   // AR sentence forms
	}
	/* The Arabic card body is a preg_quote'd literal, so it carries none of the
	   signatures above. Anchored on the escaped form of "لم تنجح" instead. */
	$signatures[] = '\\x{0644}\\x{0645}';
	$signatures[] = "\xD9\x84\xD9\x85\x20\xD8\xAA\xD9\x86\xD8\xAC\xD8\xAD";

	$out = array();
	foreach ( aa_claims_rules() as $rule ) {
		foreach ( $signatures as $sig ) {
			if ( $sig !== '' && strpos( $rule[0], $sig ) !== false ) {
				$out[] = $rule;
				break;
			}
		}
	}
	return $out;
}

/** Rewrite one post's content. Returns the new string, or null if unchanged. */
function aa_claims_migrate_content( $html, $do_rating ) {
	$before = $html;

	/* Headings first — they are Title case and the sentence rules below match
	   the same words in lower case. 32392 orders them this way for that
	   reason; the order is part of the rules, so it is preserved here. */
	if ( function_exists( 'aa_claims_swap_headings' ) ) {
		$html = aa_claims_swap_headings( $html );
	}

	foreach ( aa_claims_migrate_rules() as $rule ) {
		$out = preg_replace( $rule[0], $rule[1], $html );
		if ( $out !== null ) { $html = $out; }   // a failed pattern changes nothing
	}

	if ( $do_rating && function_exists( 'aa_claims_strip_rating' ) ) {
		$html = aa_claims_strip_rating( $html );
	}

	return $html === $before ? null : $html;
}

/**
 * Posts whose STORED content still holds a guarantee claim.
 *
 * The needles mirror [aa_claims_report]'s, minus aggregateRating — that is
 * reported separately so a page that only has a rating is not listed as
 * holding a guarantee.
 */
function aa_claims_migrate_targets() {
	global $wpdb;

	$needles = array(
		'pass guarantee',
		'garantie de r' . "\xC3\xA9" . 'ussite ou remboursement',
		'garant' . "\xC3\xAD" . 'a de aprobaci' . "\xC3\xB3" . 'n o reembolso',
		"\xD8\xB6\xD9\x85\xD8\xA7\xD9\x86 \xD8\xA7\xD9\x84\xD9\x86\xD8\xAC\xD8\xA7\xD8\xAD",
	);

	$ids = array();
	foreach ( $needles as $needle ) {
		$found = $wpdb->get_col( $wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts}
			  WHERE post_status IN ( 'publish', 'draft', 'private' )
			    AND post_type NOT IN ( 'revision', 'wpcode' )
			    AND post_content LIKE %s",
			'%' . $wpdb->esc_like( $needle ) . '%'
		) );
		foreach ( $found as $id ) { $ids[ (int) $id ] = true; }
	}
	return array_keys( $ids );
}

function aa_claims_migrate( $atts = array() ) {
	if ( ! current_user_can( 'manage_options' ) ) { return ''; }

	if ( ! function_exists( 'aa_claims_rules' ) ) {
		return '<p><strong>aa_claims_migrate:</strong> snippet 32392'
		     . ' (&ldquo;CLAIMS CLEANUP&rdquo;) is not loaded, so there are no rules to'
		     . ' apply. This migration deliberately has no patterns of its own.'
		     . ' Enable 32392 and reload.</p>';
	}

	$atts = shortcode_atts( array( 'apply' => 'no', 'rating' => 'no' ), $atts );
	$want_apply = ( strtolower( $atts['apply'] ) === 'yes' );
	$do_rating  = ( strtolower( $atts['rating'] ) === 'yes' );

	/* A shortcode left on a page must not be able to rewrite the site on
	   somebody's pageview, so the write needs a nonce from the confirm link
	   as well as apply="yes". */
	$confirmed = $want_apply
		&& isset( $_GET['aa_claims_go'] )
		&& wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['aa_claims_go'] ) ), 'aa_claims_migrate' );

	$rules   = aa_claims_migrate_rules();
	$targets = aa_claims_migrate_targets();

	$h  = '<div style="font:13px/1.6 system-ui;max-width:72em">';
	$h .= '<p><strong>aa_claims_migrate</strong> &mdash; '
	   . ( $confirmed ? '<span style="color:#b00">APPLYING</span>' : 'dry run, nothing written' )
	   . '. ' . count( $rules ) . ' guarantee rules selected from 32392, '
	   . count( $targets ) . ' posts still hold a claim in stored content.</p>';

	if ( ! $rules ) {
		return $h . '<p>No rules matched the guarantee signatures in 32392&rsquo;s rule list.'
		          . ' Nothing will be done. If 32392&rsquo;s wording has changed, the'
		          . ' signatures in aa_claims_migrate_rules() need updating.</p></div>';
	}

	/* The selected rules, so the selection can be checked before it is used. */
	$h .= '<p><strong>Rules selected</strong> (patterns, verbatim from 32392):</p><ol>';
	foreach ( $rules as $rule ) {
		$h .= '<li><code style="font-size:11px">' . esc_html( $rule[0] ) . '</code></li>';
	}
	$h .= '</ol>';

	if ( ! $targets ) {
		return $h . '<p><strong>Nothing stored.</strong> Every page is clean at source.'
		          . ' Leave 32392 enabled anyway &mdash; it does more than this.</p></div>';
	}

	$h .= '<table style="border-collapse:collapse">'
	   . '<tr><th style="text-align:left;padding:4px 14px 4px 0">ID</th>'
	   . '<th style="text-align:left;padding:4px 14px 4px 0">Post</th>'
	   . '<th style="text-align:left;padding:4px 14px 4px 0">Bytes</th>'
	   . '<th style="text-align:left;padding:4px 0">Result</th></tr>';

	$changed = 0;
	$skipped = 0;
	$clean   = 0;

	foreach ( $targets as $id ) {
		$post = get_post( $id );
		if ( ! $post ) { continue; }

		$new = aa_claims_migrate_content( $post->post_content, $do_rating );

		if ( $new === null ) {
			$clean++;
			$note  = 'no rule fired &mdash; wording differs, needs a look';
			$colour = '#a60';
			$delta = '&mdash;';
		} else {
			$delta = sprintf( '%+d', strlen( $new ) - strlen( $post->post_content ) );

			/* The guard that matters. 32392's header records what one surplus
			   </div> did to every course page on the site. */
			$bal_before = aa_claims_tag_balance( $post->post_content );
			$bal_after  = aa_claims_tag_balance( $new );

			if ( $bal_before !== $bal_after ) {
				$skipped++;
				$note   = 'SKIPPED &mdash; tag balance ' . $bal_before . ' &rarr; ' . $bal_after;
				$colour = '#b00';
			} elseif ( $confirmed ) {
				$res = wp_update_post( array( 'ID' => $id, 'post_content' => $new ), true );
				if ( is_wp_error( $res ) ) {
					$skipped++;
					$note   = 'SKIPPED &mdash; ' . esc_html( $res->get_error_message() );
					$colour = '#b00';
				} else {
					$changed++;
					$note   = 'written, revision saved';
					$colour = '#070';
				}
			} else {
				$changed++;
				$note   = 'would rewrite';
				$colour = '#070';
			}
		}

		$h .= '<tr><td style="padding:3px 14px 3px 0"><a href="'
		   . esc_url( (string) get_edit_post_link( $id ) ) . '">' . (int) $id . '</a></td>'
		   . '<td style="padding:3px 14px 3px 0">' . esc_html( get_the_title( $id ) ) . '</td>'
		   . '<td style="padding:3px 14px 3px 0;color:#666">' . $delta . '</td>'
		   . '<td style="padding:3px 0;color:' . $colour . '">' . $note . '</td></tr>';
	}

	$h .= '</table>';
	$h .= '<p style="margin-top:14px">' . $changed . ( $confirmed ? ' written' : ' would change' )
	   . ' &middot; ' . $skipped . ' skipped &middot; ' . $clean . ' matched a needle but no rule.</p>';

	if ( $clean ) {
		$h .= '<p style="color:#a60">A post counted under &ldquo;no rule fired&rdquo; holds the claim in'
		   . ' wording none of 32392&rsquo;s patterns match. That is also a page 32392 is NOT'
		   . ' cleaning at render, so the claim is live there now. Worth opening before anything else.</p>';
	}

	if ( ! $confirmed ) {
		$url = add_query_arg( 'aa_claims_go', wp_create_nonce( 'aa_claims_migrate' ) );
		$h .= '<p style="margin-top:18px"><strong>Nothing has been written.</strong> With'
		   . ' <code>apply="yes"</code> on the shortcode, <a href="' . esc_url( $url )
		   . '">this confirm link</a> performs the write. Every change saves a revision,'
		   . ' so any page can be reverted from its editor.</p>';
	} else {
		$h .= '<p style="margin-top:18px"><strong>Done.</strong> Leave 32392 enabled, re-run'
		   . ' <code>[aa_claims_report]</code> to confirm, then delete this snippet.</p>';
	}

	return $h . '</div>';
}
add_shortcode( 'aa_claims_migrate', 'aa_claims_migrate' );

endif;
