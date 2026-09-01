<?php
/**
 * Agile Agilist — CLAIMS CLEANUP
 * -----------------------------------------------------------------------------
 * Removes two claims from every page as it renders, in all four languages:
 *
 *   1. The aggregateRating node in the Course JSON-LD — a 4.9 from 2,500
 *      reviews, with no 2,500 reviews visible anywhere on the page. Google's
 *      structured-data policy requires the rating to be visible to the reader
 *      on the same page; a rating that is only in the markup is a manual-action
 *      risk, not an SEO win.
 *
 *   2. The pass guarantee — "money-back pass guarantee", "retake the next
 *      cohort free or a full refund". It contradicts the copy rule in your own
 *      design handoff ("the certification exam fee is included; a free retake
 *      is not") and it is a refund promise sitting on 24 English pages plus
 *      their Spanish, French and Arabic mirrors.
 *
 * -----------------------------------------------------------------------------
 * WHY THIS IS A SNIPPET AND NOT 70 PAGE EDITS
 *
 * The claim is on 24 published English pages and their mirrors. Rewriting each
 * page is 70-odd chances to corrupt a page for a change that has to be exactly
 * right on all of them. This does it once, at render, so:
 *
 *   - every language is covered, including Arabic wording nobody has to find;
 *   - deactivating this snippet puts every page back, unchanged;
 *   - nothing is written to the database, so no page revision is lost.
 *
 * It does mean the claim still sits in the stored page content. That is worth
 * cleaning up eventually, and [aa_claims_report] below lists exactly which
 * pages still hold it, so the cleanup can be done page by page without
 * guessing. Until then, nothing is published.
 *
 * -----------------------------------------------------------------------------
 * WHY EXACT PHRASES AND NOT "GUARANTEE"
 *
 * Every pattern below is anchored on the whole claim, never on the word
 * guarantee, because these pages legitimately use that word elsewhere:
 *
 *   "Son rangos orientativos, no garantías"        (a disclaimer — keep)
 *   "Ce sont des ordres de grandeur, pas des garanties"  (same — keep)
 *   "Le dispositif de réussite garantie a fait une énorme différence"
 *                                        (a customer quote — keep)
 *
 * A pattern that misses leaves the text alone rather than mangling it, and
 * [aa_claims_report] surfaces the miss.
 *
 * INSTALL: WPCode -> PHP Snippet, "AA - Claims", Auto Insert, Run Everywhere.
 * Independent of the calendar and registration snippets; install it on its own.
 */

if ( ! function_exists( 'aa_claims_rules' ) ) :

/**
 * Ordered claim rules, most specific first.
 *
 * Each is [pattern, replacement]. Order matters: the mid-sentence form has to
 * run before the trailing form, or the trailing rule eats the comma the
 * mid-sentence rule needs.
 */
function aa_claims_rules() {
	return array(
		/* ---- English ---- */
		// "Exam included, money-back pass guarantee, and a career-coaching session."
		array( '/,\s*money[-\s]?back pass guarantee,\s*and\s+/iu', ' and ' ),
		// "<em>Exam included</em> and a money-back pass guarantee."
		array( '/\s+and\s+a\s+money[-\s]?back pass guarantee/iu', '' ),
		array( '/,\s*(?:and\s+a\s+)?money[-\s]?back pass guarantee/iu', '' ),
		array( '/\s*money[-\s]?back pass guarantee/iu', '' ),
		// the card body, whichever way it is punctuated
		array( '/Don(?:\'|&#8217;|\x{2019})t pass on your first attempt\?\s*Retake the next cohort free\s*(?:&mdash;|\x{2014}|-)?\s*or get a full refund\.\s*No questions\.?/iu', '' ),

		/* ---- French ---- */
		array( '/,\s*garantie de r\x{00E9}ussite ou remboursement\s+et\s+/iu', ' et ' ),
		array( '/\s+et\s+(?:une\s+)?garantie de r\x{00E9}ussite ou remboursement/iu', '' ),
		array( '/,\s*garantie de r\x{00E9}ussite ou remboursement/iu', '' ),
		array( '/Vous ne r\x{00E9}ussissez pas du premier coup\s*\?\s*Refaites la cohorte suivante gratuitement ou recevez un remboursement int\x{00E9}gral\.\s*Sans condition\.?/iu', '' ),

		/* ---- Spanish ---- */
		array( '/,\s*garant\x{00ED}a de aprobaci\x{00F3}n o reembolso\s+y\s+/iu', ' y ' ),
		array( '/\s+y\s+(?:una\s+)?garant\x{00ED}a de aprobaci\x{00F3}n o reembolso/iu', '' ),
		array( '/,\s*garant\x{00ED}a de aprobaci\x{00F3}n o reembolso/iu', '' ),
		array( '/\x{00BF}No apruebas al primer intento\?\s*Repite la siguiente cohorte gratis o recibe un reembolso completo\.\s*Sin preguntas\.?/iu', '' ),

		/* ---- Arabic ---- */
		// The replacement is a literal Arabic comma (U+060C in UTF-8 bytes), not
		// an \x{} escape — those are pattern syntax and would be emitted verbatim.
		array( '/\x{060C}\s*\x{0648}\x{0636}\x{0645}\x{0627}\x{0646} \x{0627}\x{0644}\x{0646}\x{062C}\x{0627}\x{062D} \x{0623}\x{0648} \x{0627}\x{0633}\x{062A}\x{0631}\x{062F}\x{0627}\x{062F} \x{0627}\x{0644}\x{0623}\x{0645}\x{0648}\x{0627}\x{0644}\x{060C}\s*/u', "\xD8\x8C " ),
		array( '/\s*\x{0648}\x{0636}\x{0645}\x{0627}\x{0646} \x{0627}\x{0644}\x{0646}\x{062C}\x{0627}\x{062D} \x{0623}\x{0648} \x{0627}\x{0633}\x{062A}\x{0631}\x{062F}\x{0627}\x{062F} \x{0627}\x{0644}\x{0623}\x{0645}\x{0648}\x{0627}\x{0644}/u', '' ),
	);
}

/** The guarantee card heading, per language — used to remove the whole card. */
function aa_claims_card_headings() {
	return array(
		'Money-back pass guarantee',
		'Garantie de r' . "\xC3\xA9" . 'ussite ou remboursement',
		'Garant' . "\xC3\xAD" . 'a de aprobaci' . "\xC3\xB3" . 'n o reembolso',
		"\xD8\xB6\xD9\x85\xD8\xA7\xD9\x86 \xD8\xA7\xD9\x84\xD9\x86\xD8\xAC\xD8\xA7\xD8\xAD \xD8\xA3\xD9\x88 \xD8\xA7\xD8\xB3\xD8\xAA\xD8\xB1\xD8\xAF\xD8\xA7\xD8\xAF \xD8\xA7\xD9\x84\xD8\xA3\xD9\x85\xD9\x88\xD8\xA7\xD9\x84",
	);
}

/**
 * Drop the whole guarantee half of the "what's included" card.
 *
 * The card is one heading div followed by one paragraph, identical in every
 * language:
 *   <div ...><span ...>&#10038;</span>HEADING</div><p ...>BODY</p>
 * The other half of that card — "Instant confirmation" — is a different pair
 * and is left alone, so the card keeps its shape instead of emptying out.
 *
 * THE INNER DIV, AND ONLY THE INNER DIV. The guard between the opening tag and
 * the heading is `(?!</?div\b)` — it forbids an opening <div as well as a
 * closing one. With only `(?!</div>)` the leftmost match started one level too
 * high, on the enclosing <div class="aa-enr-card soft">, because nothing
 * between that tag and the heading text is a </div>. The replacement then ate
 * two opening tags and one closing tag, and the card's own </div> was left
 * orphaned immediately after the "Instant confirmation" paragraph.
 *
 * That single surplus </div> closed the .aa-rd wrapper early. Every rule in
 * the course template is scoped `.aa-rd .x`, so the FAQ, the calendar and the
 * closing band stopped matching any rule at all and rendered as bare HTML —
 * on every course page, in every language, while the block editor kept showing
 * them correctly because it renders each block in its own isolated subtree.
 * Balance the tags you delete.
 */
function aa_claims_drop_card( $html ) {
	foreach ( aa_claims_card_headings() as $heading ) {
		$pat = '#<div\b[^>]*>(?:(?!</?div\b).)*?' . preg_quote( $heading, '#' )
		     . '\s*</div>\s*<p\b[^>]*>(?:(?!</p>).)*?</p>#isu';
		$out = preg_replace( $pat, '', $html );
		if ( $out !== null ) { $html = $out; }
	}
	return $html;
}

/**
 * Remove aggregateRating from every JSON-LD block on the page.
 *
 * Decoded and re-encoded rather than pattern-matched: the node has nested
 * braces, and a regex that counts braces in JSON is a bug waiting to happen.
 * A block that will not decode is returned exactly as it came in.
 */
function aa_claims_strip_rating( $html ) {
	if ( strpos( $html, 'aggregateRating' ) === false ) { return $html; }

	return preg_replace_callback(
		'#(<script[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)#is',
		function ( $m ) {
			$data = json_decode( $m[2], true );
			if ( ! is_array( $data ) ) { return $m[0]; }   // leave anything odd alone
			$data = aa_claims_unset_rating( $data );
			$json = wp_json_encode( $data );
			if ( ! is_string( $json ) ) { return $m[0]; }
			return $m[1] . $json . $m[3];
		},
		$html
	);
}

/** Walk any depth of the graph and drop every aggregateRating it holds. */
function aa_claims_unset_rating( $node ) {
	if ( ! is_array( $node ) ) { return $node; }
	unset( $node['aggregateRating'] );
	foreach ( $node as $k => $v ) {
		if ( is_array( $v ) ) { $node[ $k ] = aa_claims_unset_rating( $v ); }
	}
	return $node;
}

/* THERE IS NO GENERAL TIDY PASS, and there must not be one.
 *
 * An earlier version closed up whitespace before a full stop or comma across
 * the whole content, to clean up after a removal. It broke every course page
 * on the site, because page content contains inline <style> blocks and CSS
 * puts a space before a dot for a reason:
 *
 *     #curriculum .aa-modgrid  ->  #curriculum.aa-modgrid
 *     .aa-rd .aa-faqwrap       ->  .aa-rd.aa-faqwrap
 *
 * A descendant selector became a compound one, matched nothing, and the
 * two-column FAQ and the module grid silently lost their rules. Nothing looked
 * wrong in the snippet; the damage was three files away, in markup this filter
 * had no business touching.
 *
 * So every rule in this file is anchored on a specific phrase and replaces it
 * with finished text. If a removal would leave "  ." or ", and", the fix goes
 * in that rule, not in a sweep over the whole document. A filter on
 * the_content sees stylesheets, scripts and JSON as well as prose, and a
 * pattern general enough to be useful on prose is general enough to corrupt
 * the rest. */

/* ============================================================================
   PER-PAGE FIXES
   ----------------------------------------------------------------------------
   Everything above applies site-wide. This applies to one named page only,
   which is what makes it safe to touch things like "3 days" — a string that is
   correct on the RTE page and wrong on this one.

   AI-NATIVE CHANGE AGENT -> AI-NATIVE VALUE ARCHITECT. The URL deliberately
   stays /training/ai-native/ai-native-change-agent/; only the name changes.
   When you do want the slug renamed, say so and it goes with a 301 from the
   old address in the same change — never without one.

   The page also contradicted itself on two facts and carried three lines
   copy-pasted from the SPC page. Both are fixed here:

     - It said three days in four places (the chip, the curriculum heading, the
       FAQ, courseWorkload P3D) and "two days" in the lede. The course is two
       days, so all five now say two.
     - It said "Live-virtual" in the lede and "In-person" in the chip. It is
       in person, in Mississauga, Dubai and Riyadh.
     - "Pass to earn the globally recognised SAFe Practice Consultant digital
       badge", "Train to teach SAFe, launch Agile Release Trains", and "SPC is
       the change-agent credential" all belong to the SPC page.

   THE BADGE GLYPH STILL READS AINCA, deliberately. AINCA abbreviates the old
   name, so it is wrong on a page called Value Architect — but a credential
   code is Scaled Agile's to set, not mine to guess, and scaledagile.com is
   unreachable from here. Tell me the official code and it is one line.
   ========================================================================== */

/** Page slug => ordered list of exact [find, replace] pairs. */
function aa_claims_page_rules() {
	return array(
		/* ------------------------------------------------------------------
		   /services/operating-model/ — three of the five layer buttons pointed
		   away from the operating model. 01 and 02 go to their service pages;
		   03 sent a reader of the operating model into the training catalogue,
		   and 05 opened the Mutation Readiness ASSESSMENT rather than the
		   Mutation service page. Both destinations exist and are published
		   (28869 and 28870), and both describe themselves as "Service ·
		   Operating Model · Layer".

		   Done here rather than on the page because that page is a single
		   core/html block: any write replaces all 34KB of it, and this is two
		   attributes. The page edit is still the permanent fix and these rules
		   should be deleted when it happens -- a no-op either way, since
		   str_replace on an absent string changes nothing.

		   Scoped by the button class so they cannot touch any other link to
		   the same URLs elsewhere on the page.

		   Layer 04 is deliberately absent: there is no /services/ai-automation/
		   page, so its link to digital-transformation is the closest thing that
		   exists rather than a mistake. That one needs a decision, not a patch.
		   ------------------------------------------------------------------ */
		'operating-model' => array(
			array( 'class="op-btn-c" href="/assessments/mutation-readiness/"',
			       'class="op-btn-c" href="/services/mutation/"' ),
			array( '>Mutation Readiness &#10230;</a>', '>Mutation &#10230;</a>' ),

			array( 'class="op-btn-c" href="/training/ai-native/"',
			       'class="op-btn-c" href="/services/ai-native-operating-model/"' ),
			array( '>AI-Native training &#10230;</a>', '>AI-Native Operating Model &#10230;</a>' ),

			/* The button WAS the assessment link, so repointing it would drop
			   that route entirely. The panel copy already names Mutation
			   Readiness, so the mention carries it instead. Runs after the
			   href swap above, so it is not caught by it. */
			array( 'The layer that makes change permanent. Mutation Readiness is the discipline',
			       'The layer that makes change permanent. <a href="/assessments/mutation-readiness/" style="color:#8FCFCF;text-decoration:underline">Mutation Readiness</a> is the discipline' ),
		),

		'ai-native-change-agent' => array(
			/* ---- facts the page got wrong about itself ---- */
			array( '"courseWorkload": "P3D"', '"courseWorkload": "P2D"' ),
			array( '"courseMode": "online"', '"courseMode": "onsite"' ),
			array( 'drive habits, govern risk. Live-virtual, exam included.',
			       'drive habits, govern risk. In person in Mississauga, Dubai and Riyadh, two days, exam included.' ),
			array( '3 days &middot; In-person', '2 days &middot; In-person' ),
			array( '3 days · In-person · North America · Exam included',
			       '2 days · In person · Mississauga, Dubai and Riyadh · Exam included' ),
			array( 'with an experienced AI-Native instructor. Live-virtual, two days, <em>exam included</em>',
			       'with an experienced AI-Native instructor. In person, two days, <em>exam included</em>' ),
			array( 'Three full days in a live virtual classroom with an authorised SAFe instructor (SPC/ASPC) — not a recording.',
			       'Two full days in a room with an experienced AI-Native instructor — not a recording.' ),
			array( '( 02 ) — Curriculum · 3 days', '( 02 ) — Curriculum · 2 days' ),
			array( '<span>Live 3-day course</span>', '<span>Live 2-day course</span>' ),
			array( 'Three days, live-virtual, instructor-led by an authorised AI-Native instructor.',
			       'Two days, in person, instructor-led by an authorised AI-Native instructor.' ),
			array( 'In-person · Mississauga · Chicago · Arlington, VA',
			       'In person · Mississauga · Dubai · Riyadh' ),

			/* ---- lines copy-pasted from the SPC page ---- */
			array( 'Pass to earn the globally recognised SAFe Practice Consultant digital badge.',
			       'Pass to earn the globally recognised AI-Native Value Architect digital badge.' ),
			array( 'Train to teach SAFe, launch Agile Release Trains, and lead an enterprise transformation end-to-end.',
			       'Diagnose AI readiness, build the roadmap, drive adoption, govern the risk, and prove the return.' ),
			array( 'SPC is the change-agent credential. Pair it with the core SAFe roles you will enable, or advance into portfolio and consulting credentials.',
			       'Value Architect is the enterprise AI adoption credential. Pair it with the SAFe roles you will be leading, or advance into consulting and portfolio credentials.' ),
			array( 'Your SAFe <em>career path.</em>', 'Your AI-Native <em>career path.</em>' ),
		),
	);
}

/** The slug of the page being rendered, or ''. Resolved once per request. */
function aa_claims_page_slug() {
	static $slug = null;
	if ( $slug !== null ) { return $slug; }
	$slug = '';
	if ( ! is_admin() ) {
		$obj = get_queried_object();
		if ( ! ( $obj instanceof WP_Post ) && isset( $GLOBALS['post'] ) ) { $obj = $GLOBALS['post']; }
		if ( $obj instanceof WP_Post ) { $slug = $obj->post_name; }
	}
	return $slug;
}

/**
 * Rename the credential everywhere on its own page.
 *
 * Done as a sweep rather than a list of sentences because the old name is in
 * places a list would miss: split across markup in the H1
 * (`AI-Native<br><em>Change Agent</em>`), bare as "AINCA" in six FAQ answers,
 * two review quotes and a career statistic, and parenthesised in the reviews
 * heading. A sweep catches all of them; the exceptions below are what keeps it
 * from catching things it should not.
 */
function aa_claims_rename_va( $html ) {
	// The badge glyphs are stylised marks, not prose. Park them, sweep, restore.
	$parked = array();
	$html = preg_replace_callback( '#<b\b[^>]*>AINCA</b>#i', function ( $m ) use ( &$parked ) {
		$token = '@@AA_BADGE_' . count( $parked ) . '@@';
		$parked[ $token ] = $m[0];
		return $token;
	}, $html );

	$html = str_replace(
		array( 'AI-Native Change Agent', 'Change Agent', 'change-agent', 'AINCA' ),
		array( 'AI-Native Value Architect', 'Value Architect', 'value-architect', 'Value Architect' ),
		$html
	);

	// "AI-Native Value Architect (Value Architect) Certification" and friends.
	$html = str_replace( ' (Value Architect)', '', $html );
	$html = str_replace( 'Value Architect Value Architect', 'Value Architect', $html );

	return $parked ? str_replace( array_keys( $parked ), array_values( $parked ), $html ) : $html;
}

function aa_claims_page_fixes( $html ) {
	$slug  = aa_claims_page_slug();
	$rules = aa_claims_page_rules();
	if ( $slug === '' || ! isset( $rules[ $slug ] ) ) { return $html; }

	foreach ( $rules[ $slug ] as $pair ) {
		$html = str_replace( $pair[0], $pair[1], $html );
	}
	if ( $slug === 'ai-native-change-agent' ) {
		$html = aa_claims_rename_va( $html );
	}
	return $html;
}

/**
 * Container tags opened minus container tags closed.
 *
 * Every rule in this file deletes markup, and deleting markup is how you lose a
 * closing tag without noticing: the page still renders, so nothing errors and
 * nothing looks wrong until a wrapper several screens further up closes early
 * and takes a whole design system's worth of scoped selectors with it. This
 * counts what went in and what came out, and any rule that changes the balance
 * is discarded rather than shipped. A rule that cannot delete cleanly should
 * delete nothing.
 */
function aa_claims_tag_balance( $html ) {
	$n = 0;
	foreach ( array( 'div', 'section', 'p' ) as $tag ) {
		$n += preg_match_all( '#<' . $tag . '\b#i', $html )
		    - preg_match_all( '#</' . $tag . '\s*>#i', $html );
	}
	return $n;
}

/** Apply $fn, but keep the result only if it left the tag balance untouched. */
function aa_claims_safely( $html, $fn, $label ) {
	$before = aa_claims_tag_balance( $html );
	$out    = call_user_func( $fn, $html );
	if ( ! is_string( $out ) ) { return $html; }
	if ( aa_claims_tag_balance( $out ) !== $before ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'aa-claims: "' . $label . '" unbalanced the markup; skipped.' );
		}
		return $html;
	}
	return $out;
}

function aa_claims_filter( $html ) {
	if ( ! is_string( $html ) || $html === '' ) { return $html; }
	// Page fixes run FIRST: they match the stored JSON-LD text, which the
	// rating strip below re-encodes into a different shape.
	$html = aa_claims_page_fixes( $html );
	$html = aa_claims_strip_rating( $html );
	$html = aa_claims_safely( $html, 'aa_claims_drop_card', 'drop_card' );
	foreach ( aa_claims_rules() as $rule ) {
		$out = preg_replace( $rule[0], $rule[1], $html );
		if ( $out !== null ) { $html = $out; }   // a failed pattern changes nothing
	}
	return $html;
}
add_filter( 'the_content', 'aa_claims_filter', 20 );

/* ============================================================================
   [aa_claims_report]  —  what is still stored, for admins only
   Nothing above touches the database. This lists the pages whose stored
   content still holds a claim, so the source can be cleaned page by page.
   ========================================================================== */
function aa_claims_report() {
	if ( ! current_user_can( 'manage_options' ) ) { return ''; }
	global $wpdb;

	$needles = array(
		'aggregateRating'                    => 'rating',
		'pass guarantee'                     => 'guarantee (EN)',
		'garantie de r' . "\xC3\xA9" . 'ussite ou remboursement' => 'guarantee (FR)',
		'garant' . "\xC3\xAD" . 'a de aprobaci' . "\xC3\xB3" . 'n o reembolso' => 'guarantee (ES)',
		"\xD8\xB6\xD9\x85\xD8\xA7\xD9\x86 \xD8\xA7\xD9\x84\xD9\x86\xD8\xAC\xD8\xA7\xD8\xAD" => 'guarantee (AR)',
	);

	$rows = array();
	foreach ( $needles as $needle => $label ) {
		$found = $wpdb->get_results( $wpdb->prepare(
			"SELECT ID, post_title, post_type FROM {$wpdb->posts}
			 WHERE post_status = 'publish' AND post_content LIKE %s",
			'%' . $wpdb->esc_like( $needle ) . '%'
		) );
		foreach ( $found as $p ) {
			$rows[ $p->ID ]['title'] = $p->post_title;
			$rows[ $p->ID ]['type']  = $p->post_type;
			$rows[ $p->ID ]['hits'][] = $label;
		}
	}

	if ( ! $rows ) {
		return '<p><strong>aa_claims_report:</strong> nothing stored. Every page is clean at source.</p>';
	}

	$h = '<p><strong>aa_claims_report:</strong> ' . count( $rows )
	   . ' published items still hold a claim in their stored content. Nothing below is being'
	   . ' published — the snippet removes it as the page renders — but this is the cleanup list.</p>';
	$h .= '<table style="border-collapse:collapse;font:13px/1.5 system-ui"><tr>'
	    . '<th style="text-align:left;padding:4px 12px 4px 0">ID</th>'
	    . '<th style="text-align:left;padding:4px 12px 4px 0">Page</th>'
	    . '<th style="text-align:left;padding:4px 0">Still holds</th></tr>';
	foreach ( $rows as $id => $r ) {
		$h .= '<tr><td style="padding:3px 12px 3px 0"><a href="' . esc_url( get_edit_post_link( $id ) ) . '">' . (int) $id . '</a></td>'
		    . '<td style="padding:3px 12px 3px 0">' . esc_html( $r['title'] ) . '</td>'
		    . '<td style="padding:3px 0">' . esc_html( implode( ', ', array_unique( $r['hits'] ) ) ) . '</td></tr>';
	}
	return $h . '</table>';
}
add_shortcode( 'aa_claims_report', 'aa_claims_report' );

endif;
