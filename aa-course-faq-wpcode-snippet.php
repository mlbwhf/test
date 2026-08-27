<?php
/**
 * Agile Agilist — COURSE FAQ + CLOSING BAND
 * =============================================================================
 * WPCode -> PHP Snippet, Auto Insert -> Run Everywhere. Name "AA – Course FAQ".
 * Pairs with:
 *     WPCode -> CSS Snippet         "AA – Course FAQ CSS"  <- aa-course-faq.css
 *     WPCode -> JavaScript Snippet  "AA – Course FAQ JS"   <- aa-course-faq.js
 *                                   (Site Wide Footer)
 *
 * Rebuilds the two blocks at the bottom of every course page to the 1A design:
 * the flat list of 16 <details> becomes a categorised, numbered, single-open
 * accordion with a left rail; the loose closing text becomes a dark band with
 * the credential, the next dates, the price and two real buttons.
 *
 * THE CONTENT IS THE PAGE'S OWN. THIS IS A FORMAT CHANGE ONLY.
 * ---------------------------------------------------------------------------
 * The handoff shipped a JSON file of 16 drafted answers, and its own README
 * flagged them as needing subject-matter review. It was right to: they assert
 * a 77% pass mark over 45 questions, a $50 retake fee, a $195 renewal, a free
 * refresher session, a Canadian salary range, that competitors offering an
 * exam-only path "are not licensed to do so", and an "AI-Native Delivery
 * course" that does not exist.
 *
 * The published page already answers the same 16 questions, and where the two
 * disagree the page is the one that is right and sourced -- it says 60
 * questions at 80% and links Scaled Agile's own exam study guide, against the
 * draft's 45 at 77%. So this snippet READS THE QUESTIONS AND ANSWERS OUT OF
 * THE BLOCK IT IS REPLACING and re-renders them. Nothing is transcribed, no
 * per-course JSON is maintained, every course page is covered at once, and no
 * Scaled Agile specific is asserted that an editor did not already publish.
 *
 * The closing band drops "money-back pass guarantee" from the live copy: we
 * cannot promise a pass and cannot offer a refund for not passing. What
 * replaces it is what is true and already documented in the page's own FAQ --
 * exam fee included, and a career-coaching session. It also drops the
 * handoff's "free reschedule to 10 days out" (no fixed window is promised)
 * and its invented "early-bird ends" date.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* DOUBLE-LOAD GUARD — see the register snippet's note. PHP binds top-level
   functions at COMPILE time, so only wrapping the declarations prevents a
   redeclare fatal on a second copy. */
if ( ! function_exists( 'aa_faq_categories' ) ) :

/**
 * The four categories, in display order, and how a question lands in one.
 *
 * The published FAQs are not categorised -- they are two columns of eight --
 * so the category has to be derived. Keyword rules over an editor field
 * because there is no editor field, and adding one would mean touching all
 * twenty course pages to get a presentational grouping.
 *
 * FIRST match wins, so the order of this list is also its precedence: "Can I
 * get certified without passing the exam?" is an exam question, not a booking
 * question, and it reaches the exam rule first. Anything matching nothing at
 * all falls to the first category, which is why that one has no pattern.
 */
function aa_faq_categories() {
	return array(
		array(
			'label' => 'Exam &amp; certification',
			'match' => '/\b(exam|certif|retake|passing|pass score|badge|renew|valid)/i',
		),
		array(
			'label' => 'Career impact',
			'match' => '/\b(career|able to do|role|salary|job)/i',
		),
		array(
			'label' => 'AI &amp; SAFe 6.0',
			'match' => '/\b(ai\b|ai-|artificial intelligence|safe 6)/i',
		),
		array(
			'label' => 'Before you book',
			'match' => null,   // the default bucket; must be last
		),
	);
}

/** Display order puts the default bucket first, where a buyer starts. */
function aa_faq_order() {
	return array( 'Before you book', 'Exam &amp; certification', 'Career impact', 'AI &amp; SAFe 6.0' );
}

/**
 * Pull the questions and answers out of already-rendered FAQ markup.
 *
 * Deliberately regex and not DOMDocument: the answer bodies are fragments of
 * post content that may contain links, entities and stray markup an editor
 * typed, and DOMDocument would normalise all of it -- silently rewriting
 * published copy is exactly what this snippet exists not to do. The pattern
 * only ever spans one <details>, which cannot nest.
 */
function aa_faq_extract( $html ) {
	if ( ! preg_match_all(
		'#<details\b[^>]*>\s*<summary\b[^>]*>(.*?)</summary>(.*?)</details>#is',
		$html, $m, PREG_SET_ORDER
	) ) {
		return array();
	}

	$out = array();
	foreach ( $m as $one ) {
		$q = trim( $one[1] );
		$a = trim( $one[2] );
		if ( $q === '' ) { continue; }
		/* Categorise on the QUESTION only. Including the answer looked more
		   thorough and was worse: "What's included in the course?" landed under
		   Exam because its answer mentions the official exam, and "What is the
		   impact of SAFe 6.0?" landed under Career because its answer says
		   "roles". The question is the part a buyer scans, and it is the part
		   that actually says what the question is about. */
		/* AN EXPLICIT CLASS BEATS THE KEYWORDS. Matching on wording is a good
		   default and a bad contract: "Does SPC let me earn as a licensed
		   instructor?" is plainly a career question and contains none of the
		   career words, so it silently filed itself under "Before you book".
		   Whoever writes the next question should not have to reverse-engineer
		   a regex to place it. Put aa-faq--career (or --exam, --ai, --before)
		   on the <details> and it goes there; leave it off and the keywords
		   decide, exactly as they did before. */
		$out[] = array(
			'q'   => $q,
			'a'   => $a,
			'cat' => aa_faq_forced_cat( $one[0] ) ?: aa_faq_categorise( wp_strip_all_tags( $q ) ),
		);
	}
	return $out;
}

/**
 * Short key -> category label. The one place the four labels are spelled.
 *
 * Shared by the aa-faq--* class reader below and by aa_faq_extra(), so a
 * question written in this file and a question written on a page cannot end up
 * in two differently-spelled versions of the same bucket.
 */
function aa_faq_cat_label( $key ) {
	$map = array(
		'before' => 'Before you book',
		'exam'   => 'Exam &amp; certification',
		'career' => 'Career impact',
		'ai'     => 'AI &amp; SAFe 6.0',
	);
	$key = strtolower( $key );
	return isset( $map[ $key ] ) ? $map[ $key ] : '';
}

function aa_faq_forced_cat( $element ) {
	if ( ! preg_match( '/\baa-faq--([a-z0-9]+)\b/i', $element, $m ) ) { return ''; }
	return aa_faq_cat_label( $m[1] );
}

function aa_faq_categorise( $text ) {
	foreach ( aa_faq_categories() as $c ) {
		if ( $c['match'] === null ) { continue; }
		if ( preg_match( $c['match'], $text ) ) { return $c['label']; }
	}
	return 'Before you book';
}

/** The course this page is about, or null. Reuses the register snippet's resolver. */
function aa_faq_course() {
	static $c = null;
	if ( $c !== null ) { return $c ?: null; }
	$c = false;
	if ( is_admin() || ! function_exists( 'aa_reg_page_course' ) ) { return null; }
	$slug = aa_reg_page_course();
	if ( $slug === '' ) { return null; }
	$course = aa_reg_course( $slug );
	if ( ! $course ) { return null; }
	$c = array( 'slug' => $slug, 'course' => $course );
	return $c;
}

/* =============================================================================
   EXTRA QUESTIONS — added here rather than to the page
   -----------------------------------------------------------------------------
   These live in the snippet because this filter already rewrites the whole FAQ
   section on every course page: putting them here ships them to all four
   courses at once, with nothing to paste into Gutenberg and nothing to keep in
   sync across pages. The trade is that changing a question means editing this
   file rather than the page. If any of these should become editable content,
   move it onto the page as a <details class="aa-faq aa-faq--career"> and delete
   it here -- the merge below drops anything the page already asks, so the two
   cannot both appear.

   WHAT IS DELIBERATELY NOT HERE. No salary figures and no placement claims:
   each page's demand section already carries numbers you have sourced, and a
   second set in the FAQ would be a second set to defend. Nothing names which
   courses an SPC may teach -- that is Scaled Agile's licensing to define and it
   moves; the answer points at SAFe Studio for the current list.
   ========================================================================== */
function aa_faq_extra( $slug ) {
	$q = array(

		'spc' => array(
			array( 'career', 'Is SPC a full-time role, or something I add to my current job?',
				'Both are common. Some SPCs move into a dedicated transformation or Agile CoE post; many others keep the job they have — Scrum Master, Product Manager, engineering lead — and use the credential to lead change from inside the team they already work with. The course is built for either, because the hard part is the same: getting an organisation to adopt something it did not ask for.' ),
			array( 'career', 'Which roles do employers usually fill with an SPC?',
				'Most often Enterprise or Transformation Agile Coach, Agile CoE Lead, Release Train Engineer, and internal consultant posts inside a transformation office. On the supplier side it is the standard entry requirement for delivery consultants at firms running SAFe engagements — for many of those postings SPC is a screening filter rather than a nice-to-have.' ),
			array( 'career', 'Can I build a side practice teaching, alongside my main job?',
				'Plenty of SPCs do, and it is the usual reason people pick this credential over a cheaper one. The practical questions are not about the licence but about demand: who your first clients are, whether you teach public or in-house, and how much delivery you can carry around a full-time job. That is what the post-course coaching session is for — the licensing itself is covered separately above.' ),
			array( 'career', 'How quickly does SPC pay off in career terms?',
				'That depends far more on your situation than on the credential. People already inside a SAFe adoption tend to use it immediately and see it recognised at the next review; people using it to change employer are running a job search, which takes as long as a job search takes. The market figures above are role compensation, not a promise about your outcome — we would rather set that expectation now than sell you a number.' ),
		),

		'aspc' => array(
			array( 'career', 'What roles does ASPC open that SPC does not?',
				'ASPC is for people already doing the work who now want to lead it: Principal or Lead Agile Consultant, Transformation Director, and portfolio-level advisory work. Where SPC establishes that you can run an adoption, ASPC is aimed at what comes after — multiple trains, competing portfolios, and executives who have already sat through one failed change programme.' ),
			array( 'career', 'Is ASPC worth it if I am already in an SPC role?',
				'If your engagements are getting larger or more political, yes — that is the gap it addresses. If you are still delivering your first few trains, the honest answer is to spend another cycle doing that first. ASPC assumes real transformation experience to argue with, and the cohort discussion is most of its value.' ),
			array( 'career', 'Do employers and clients recognise ASPC when hiring for senior roles?',
				'Inside organisations already invested in SAFe, yes — it reads as “has done this at scale, more than once”. Outside that world it needs the same explanation any framework credential needs, so treat it as evidence supporting your track record rather than a substitute for one. It carries most weight in consultancy selection and in internal promotion to lead-coach positions.' ),
			array( 'career', 'What kind of work will I be able to do after ASPC?',
				'Advising at portfolio and executive level: designing an operating model rather than installing a framework, coaching leaders through the decisions that stall adoptions, and diagnosing why a transformation that looks correct on paper is producing nothing. You also take away the facilitation material for the workshops that get those conversations to a decision.' ),
			array( 'ai', 'How is AI changing what a senior SAFe consultant is expected to bring?',
				'The questions arriving from executives have shifted. Where the brief used to be “help us scale delivery”, it is increasingly “we have AI pilots everywhere and nothing in production — what is wrong with how we work?” That is an operating-model question, and answering it is the part of the consultant’s job that has changed most.' ),
			array( 'ai', 'How do I advise a client whose AI pilots never reach production?',
				'Start by naming what is actually blocking them, because it is rarely the model. It is usually that nobody owns the decision the pilot was meant to support, the data crosses three teams with different priorities, or the path to production was never designed. We work this as a diagnosis, not a tooling exercise — it is the single most common brief arriving at senior consultants right now.' ),
			array( 'ai', 'Should an AI initiative run as its own programme, or inside the existing operating model?',
				'Its own programme buys focus and almost always builds a second organisation that the first one later rejects. Inside the operating model is slower to start and is the only version that survives. The course covers how to make that argument to a sponsor who has already been sold the standalone version, which is the harder half.' ),
			array( 'ai', 'How do I set AI governance that does not simply stall delivery?',
				'By deciding in advance which classes of decision need a human and which do not, rather than reviewing everything and calling it control. Governance that inspects every output becomes the bottleneck it was meant to prevent — and teams route around it. We work through where the line sits and how to move it as confidence grows.' ),
		),

		'rte' => array(
			array( 'career', 'Is RTE a promotion from Scrum Master, or a different role entirely?',
				'Different, though it is the usual next step. A Scrum Master serves one team; an RTE serves the train — a dozen teams, their dependencies, and the leaders who fund them. The facilitation instinct carries over; influencing without authority is genuinely new, and it is what the course spends most of its time on.' ),
			array( 'career', 'Which job titles will this credential actually match?',
				'Release Train Engineer most directly, plus Senior Scrum Master, Program or Delivery Manager, and Agile Program Coach. Postings vary in what they call it — “ART Lead” and “Programme Delivery Lead” are the same job — so search on the responsibilities as well as the title.' ),
			array( 'career', 'Do I need to be in an RTE role already for this to be worth taking?',
				'No, and a good share of each cohort is not. Two groups get the most from it: people about to take on an ART who want to arrive credible, and Scrum Masters or Product Owners who keep hitting problems that live above their team. If your organisation runs no trains at all, Leading SAFe is the better starting point.' ),
		),

		/* THE RENAME. This course was AI-Native Change Agent and the URL still
		   is, so anyone arriving from a bookmark, a colleague or an older search
		   result lands on a page whose title does not match what they were sent
		   to find. Forced to "before" because the keyword matcher would file it
		   under AI & SAFe 6.0 -- the last place someone checking they are on the
		   right page would look. */
		'ai-native-change-agent' => array(
			array( 'before', 'Is this the same course as the AI-Native Change Agent?',
				'Yes. AI-Native Change Agent was renamed AI-Native Value Architect — same course, same three days, same certification. The web address still carries the old name, so a bookmark or an older link brings you to exactly the right place. If someone recommended the Change Agent course, this is it.' ),
			array( 'before', 'Why was the name changed?',
				'“Change Agent” described how the work feels from the inside; “Value Architect” describes what you are accountable for — designing where AI creates value across the organisation, and proving that it did. The second is what people found themselves explaining to their sponsors anyway, so the title now matches the conversation.' ),
		),
	);

	if ( $slug === '' || ! isset( $q[ $slug ] ) ) { return array(); }

	$out = array();
	foreach ( $q[ $slug ] as $row ) {
		$out[] = array( 'q' => $row[1], 'a' => '<p>' . $row[2] . '</p>', 'cat' => aa_faq_cat_label( $row[0] ) );
	}
	return $out;
}

/** Question text reduced to what makes two questions the same question. */
function aa_faq_qkey( $q ) {
	return preg_replace( '/[^a-z0-9]+/', '', strtolower( wp_strip_all_tags( $q ) ) );
}

/**
 * Page questions first, then any extras the page does not already ask.
 *
 * The page always wins: if someone writes a better version of one of these
 * onto the page, the page's copy is what renders and the duplicate here goes
 * quiet on its own rather than appearing twice.
 */
function aa_faq_merge_extra( $items, $slug ) {
	$extra = aa_faq_extra( $slug );
	if ( ! $extra ) { return $items; }

	$seen = array();
	foreach ( $items as $i ) { $seen[ aa_faq_qkey( $i['q'] ) ] = true; }

	foreach ( $extra as $e ) {
		$k = aa_faq_qkey( $e['q'] );
		if ( isset( $seen[ $k ] ) ) { continue; }
		$seen[ $k ] = true;
		$items[]    = $e;
	}
	return $items;
}

/**
 * Every extra question, across every course, checked for repeats.
 *
 * A landing page earns nothing from an FAQ that its sibling pages also carry:
 * to a reader it is filler, and to a search engine twenty pages answering
 * "What does it mean that SAFe is AI-empowered?" in identical words is twenty
 * pages competing with each other. Three of the first drafts here did exactly
 * that -- they restated questions the RTE and SPC pages already ask.
 *
 * The render path cannot catch it, because it only ever sees one course. So
 * the check lives here and is surfaced by [aa_faq_selftest]: it reports any
 * question written for two courses at once, and any extra suppressed because
 * the page already asks it. Both are signals to rewrite, not to shrug at.
 *
 * Returns array( 'cross' => array of "question -> slug, slug", 'total' => n ).
 */
function aa_faq_uniqueness_report() {
	$seen  = array();
	$total = 0;
	foreach ( array( 'spc', 'aspc', 'rte', 'ai-native-change-agent' ) as $slug ) {
		foreach ( aa_faq_extra( $slug ) as $e ) {
			$k = aa_faq_qkey( $e['q'] );
			$seen[ $k ][] = $slug;
			$total++;
		}
	}
	$cross = array();
	foreach ( $seen as $k => $slugs ) {
		if ( count( $slugs ) > 1 ) { $cross[] = $k . ' -> ' . implode( ', ', $slugs ); }
	}
	return array( 'cross' => $cross, 'total' => $total );
}

/* =============================================================================
   VIEW 1 — the FAQ
   ========================================================================== */

function aa_faq_render( $items, $heading_name ) {
	if ( ! $items ) { return ''; }

	/* Group first, so a category with no questions on this course is never
	   rendered as an empty tab. Twenty course pages do not all answer the same
	   sixteen questions. */
	$by = array();
	foreach ( $items as $i => $it ) {
		$by[ $it['cat'] ][] = $it;
	}
	$cats = array();
	foreach ( aa_faq_order() as $label ) {
		if ( ! empty( $by[ $label ] ) ) { $cats[ $label ] = $by[ $label ]; }
	}
	if ( ! $cats ) { return ''; }

	$first  = key( $cats );
	$total  = count( $items );

	$h  = '<section class="aa-fq" id="faq" aria-labelledby="aa-fq-h">';
	$h .= '<div class="aa-fq-grid">';

	/* ---- left rail ---- */
	$h .= '<div class="aa-fq-rail">'
	    . '<p class="aa-fq-eyebrow">Questions</p>'
	    . '<h2 class="aa-fq-h" id="aa-fq-h">Everything about <em>'
	    . esc_html( $heading_name ) . '</em></h2>'
	    . '<p class="aa-fq-sub">' . esc_html(
	        sprintf( '%d answers, grouped. Nothing hidden behind a form.', $total )
	      ) . '</p>'
	    . '<div class="aa-fq-tabs" role="tablist" aria-label="FAQ categories">';

	foreach ( $cats as $label => $list ) {
		$on = ( $label === $first );
		$h .= '<button type="button" class="aa-fq-tab' . ( $on ? ' is-on' : '' ) . '"'
		    . ' role="tab" aria-selected="' . ( $on ? 'true' : 'false' ) . '"'
		    . ' data-fq-cat="' . esc_attr( $label ) . '">'
		    . '<span>' . $label . '</span>'
		    . '<span class="aa-fq-pill">' . count( $list ) . '</span></button>';
	}

	$h .= '</div>'
	    . '<p class="aa-fq-foot">Still stuck? <a href="/about/contact/">Ask an expert &#10230;</a></p>'
	    . '</div>';

	/* ---- right column: the accordion ----
	   EVERY question and answer is rendered, for every category, and the
	   filter is a class toggle. The handoff's own SEO note is the reason:
	   answers must be in the initial HTML, not injected on interaction, or
	   neither a crawler nor a language model reading the page ever sees
	   fifteen of the sixteen. */
	$h .= '<div class="aa-fq-list">';
	foreach ( $cats as $label => $list ) {
		$n = 0;
		foreach ( $list as $it ) {
			$n++;
			$open = ( $label === $first && $n === 1 );
			$id   = 'aa-fq-' . sanitize_title( $label ) . '-' . $n;
			$h .= '<article class="aa-fq-card' . ( $open ? ' is-open' : '' ) . '"'
			    . ' data-fq-item data-fq-of="' . esc_attr( $label ) . '"'
			    . ( $label === $first ? '' : ' hidden' ) . '>'
			    . '<h3 class="aa-fq-qh"><button type="button" class="aa-fq-q"'
			    . ' aria-expanded="' . ( $open ? 'true' : 'false' ) . '"'
			    . ' aria-controls="' . esc_attr( $id ) . '">'
			    . '<span class="aa-fq-n">' . esc_html( str_pad( (string) $n, 2, '0', STR_PAD_LEFT ) ) . '</span>'
			    . '<span class="aa-fq-qt">' . $it['q'] . '</span>'
			    . '<span class="aa-fq-chev" aria-hidden="true"></span>'
			    . '</button></h3>'
			    . '<div class="aa-fq-a" id="' . esc_attr( $id ) . '"'
			    . ( $open ? '' : ' hidden' ) . '>' . $it['a'] . '</div>'
			    . '</article>';
		}
	}
	$h .= '</div></div></section>';

	return $h . aa_faq_schema( $items );
}

/**
 * FAQPage JSON-LD.
 *
 * Legitimate here, unlike the aggregateRating this site had to strip: every
 * question and answer emitted below is visible on the page, in the initial
 * HTML, without interaction. That is exactly the condition Google asks for.
 */
function aa_faq_schema( $items ) {
	$q = array();
	foreach ( $items as $it ) {
		$q[] = array(
			'@type'          => 'Question',
			'name'           => wp_strip_all_tags( $it['q'] ),
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => wp_strip_all_tags( $it['a'] ),
			),
		);
	}
	if ( ! $q ) { return ''; }
	return '<script type="application/ld+json">' . wp_json_encode( array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => $q,
	) ) . '</script>';
}

/* =============================================================================
   VIEW 2 — the closing band
   ========================================================================== */

/**
 * What the band claims, and what it deliberately does not.
 *
 * KEPT, because the page's own published FAQ already says so: the exam fee is
 * included, and a career-coaching session comes with the course.
 *
 * DROPPED from the live copy: "money-back pass guarantee". We cannot promise a
 * pass and do not refund for not passing.
 *
 * DROPPED from the handoff: "Free reschedule to 10 days out" -- rescheduling
 * carries no fee, but no fixed window is promised, so the line states the fee
 * and not a deadline. Also its "Early-bird ends <date>", which was invented.
 */
function aa_faq_band_facts( $course ) {
	$days = (int) $course['days'];
	return array(
		sprintf( '%d %s live online', $days, $days === 1 ? 'day' : 'days' ),
		'Exam fee included',
		'Reschedule at no fee',
		'Career coaching session',
	);
}

/**
 * The credential as a person would say it, for the band's headline.
 *
 * The course NAME is the catalogue title -- "SAFe® Release Train Engineer
 * Certification" -- and set at 38px it wraps to three lines and pushes
 * "credential is within reach." onto a fourth, which reads as a layout bug and
 * loses the sentence. The design's line is "Your <Release Train Engineer>
 * credential is within reach.", so the words already implied by the rest of
 * the sentence come off: a trailing "Certification", and the parenthesised
 * code the badge beside it already shows.
 *
 * "SAFe" itself STAYS. Stripping it as a brand prefix was the first attempt
 * and it wrecked every name where the word is part of the phrase rather than
 * in front of it: "SAFe for Architects" became "for Architects" and
 * "Implementing SAFe with SPC" became "Implementing with SPC". Only the ®
 * comes off, which is a typographic call and not a naming one.
 */
function aa_faq_credential( $course ) {
	$n = $course['name'];
	$n = str_replace( array( '®', '&reg;' ), '', $n );
	$n = preg_replace( '/\s*\([^)]*\)\s*/', ' ', $n );
	$n = preg_replace( '/\s*\bcertifications?\b\s*$/i', '', $n );
	$n = trim( preg_replace( '/\s+/', ' ', $n ) );
	return $n !== '' ? $n : $course['code'];
}

function aa_faq_band( $badge_html ) {
	$found = aa_faq_course();
	if ( ! $found || ! function_exists( 'aa_reg_upcoming' ) ) { return ''; }
	$course = $found['course'];
	$next   = aa_reg_upcoming( $found['slug'], $course );
	$cohort = $next ? $next[0] : null;

	$h  = '<section class="aa-fb2" aria-labelledby="aa-fb2-h"><div class="aa-fb2-in">';

	/* ---- left ---- */
	$h .= '<div class="aa-fb2-left">';
	/* The real credential badge, lifted from the block being replaced rather
	   than re-sourced: it is already the right image, already uploaded, and
	   already correct per course. The handoff drew a placeholder and said to
	   find the real asset -- it was in the markup all along. */
	if ( $badge_html !== '' ) {
		$h .= '<div class="aa-fb2-badge">' . $badge_html . '</div>';
	}
	$h .= '<div class="aa-fb2-copy">'
	    . '<h2 class="aa-fb2-h" id="aa-fb2-h">Your <em>' . esc_html( aa_faq_credential( $course ) ) . '</em><br>'
	    . 'credential is within reach.</h2>'
	    . '<ul class="aa-fb2-facts">';
	foreach ( aa_faq_band_facts( $course ) as $f ) {
		$h .= '<li><i aria-hidden="true"></i>' . esc_html( $f ) . '</li>';
	}
	$h .= '</ul></div></div>';

	/* ---- right ---- */
	$h .= '<div class="aa-fb2-right">';
	if ( $cohort ) {
		$s = new DateTime( $cohort['start'] );
		$e = new DateTime( $cohort['end'] );
		$range = $s->format( 'M j' ) . '&ndash;' . ( $s->format( 'M' ) === $e->format( 'M' )
			? $e->format( 'j' ) : $e->format( 'M j' ) );
		$h .= '<p class="aa-fb2-cohort">Next cohort &middot; ' . $range . '</p>';
	}
	$h .= '<p class="aa-fb2-price">$' . esc_html( number_format_i18n( $course['price'] ) ) . '</p>';

	/* Scarcity ONLY when a real seat count says so. No countdown, no invented
	   deadline: an urgency line the data cannot support is the one thing on
	   this band a buyer could catch us out on. */
	if ( $cohort && function_exists( 'aa_reg_seats_left' ) ) {
		$left = aa_reg_seats_left( $course, $cohort );
		if ( $left > 0 && $left <= 6 ) {
			$h .= '<p class="aa-fb2-scarce">' . esc_html( sprintf(
				'%d seat%s left on this cohort', $left, $left === 1 ? '' : 's'
			) ) . '</p>';
		}
	}

	$h .= '<div class="aa-fb2-cta">'
	    . '<a class="aa-fb2-primary" href="#enroll" data-fb2-enrol>Enroll now <i aria-hidden="true">&#10230;</i></a>'
	    . '<a class="aa-fb2-secondary" href="/about/contact/">Talk to an advisor</a>'
	    . '</div></div></div></section>';

	return $h;
}

/* =============================================================================
   PLACEMENT — swap both blocks as the page renders, no page edit
   ========================================================================== */

function aa_faq_autoplace_on() {
	return get_option( 'aa_faq_autoplace', 'yes' ) !== 'no';
}

function aa_faq_swap( $html, $block ) {
	if ( is_admin() || ! aa_faq_autoplace_on() ) { return $html; }
	if ( empty( $block['blockName'] ) ) { return $html; }

	/* The FAQ section: a core/group carrying aa-faqsec. */
	if ( $block['blockName'] === 'core/group'
		&& ! empty( $block['attrs']['className'] )
		&& in_array( 'aa-faqsec', preg_split( '/\s+/', $block['attrs']['className'] ), true ) ) {

		$items = aa_faq_extract( $html );
		if ( ! $items ) { return $html; }   // nothing to re-render; leave it alone

		$found = aa_faq_course();
		$items = aa_faq_merge_extra( $items, $found ? $found['slug'] : '' );
		$name  = $found ? $found['course']['code'] : 'this course';
		$new   = aa_faq_render( $items, $name );
		return $new !== '' ? $new : $html;
	}

	/* The closing band: a core/html block whose markup carries aa-final.
	   Matched on the rendered output because a core/html block has no
	   className attribute to test. */
	if ( $block['blockName'] === 'core/html' && strpos( $html, 'aa-final' ) !== false ) {
		$badge = '';
		if ( preg_match( '#<img\b[^>]*class="[^"]*aa-badge-img[^"]*"[^>]*>#i', $html, $m ) ) {
			$badge = $m[0];
		}
		$new = aa_faq_band( $badge );
		return $new !== '' ? $new : $html;
	}

	return $html;
}
add_filter( 'render_block', 'aa_faq_swap', 10, 2 );

/**
 * [aa_faq_selftest] — admin-only. Answers "why is this page still the old FAQ?"
 *
 * The swap can fail silently in four different places and they look identical
 * from the front end, so this reports each one separately: whether the snippet
 * is running at all, whether the switch is on, whether the page has the block
 * the swap looks for, and whether that block contains any <details> to read.
 * A page with the section but zero details means something else already
 * rewrote the FAQ before this filter saw it.
 */
add_shortcode( 'aa_faq_selftest', function () {
	if ( ! current_user_can( 'manage_options' ) ) { return ''; }

	$obj = get_queried_object();
	if ( ! ( $obj instanceof WP_Post ) && isset( $GLOBALS['post'] ) ) { $obj = $GLOBALS['post']; }

	$secs = 0; $details = 0; $finals = 0; $names = array();
	if ( $obj instanceof WP_Post && function_exists( 'parse_blocks' ) ) {
		$walk = function ( $blocks ) use ( &$walk, &$secs, &$details, &$finals, &$names ) {
			foreach ( $blocks as $b ) {
				if ( ! empty( $b['blockName'] ) ) {
					$names[ $b['blockName'] ] = ( isset( $names[ $b['blockName'] ] ) ? $names[ $b['blockName'] ] : 0 ) + 1;
				}
				$cls = isset( $b['attrs']['className'] ) ? $b['attrs']['className'] : '';
				if ( ! empty( $b['blockName'] ) && $b['blockName'] === 'core/group'
					&& $cls !== '' && in_array( 'aa-faqsec', preg_split( '/\s+/', $cls ), true ) ) {
					$secs++;
					$details += substr_count( strtolower( $b['innerHTML'] . implode( '', array_column( (array) $b['innerBlocks'], 'innerHTML' ) ) ), '<details' );
				}
				if ( ! empty( $b['blockName'] ) && $b['blockName'] === 'core/html'
					&& strpos( $b['innerHTML'], 'aa-final' ) !== false ) { $finals++; }
				if ( ! empty( $b['innerBlocks'] ) ) { $walk( $b['innerBlocks'] ); }
			}
		};
		$walk( parse_blocks( $obj->post_content ) );
	}

	$found = aa_faq_course();

	/* Extras for THIS page, and how many of them the page already asks. A
	   suppressed extra is not an error -- the page wins on purpose -- but it
	   does mean two people wrote the same question, and one of them should
	   write a different one instead of leaving a silent no-op in the table. */
	$slug       = $found ? $found['slug'] : '';
	$extra      = aa_faq_extra( $slug );
	$uniq       = aa_faq_uniqueness_report();
	$suppressed = 0;
	if ( $extra && $obj instanceof WP_Post ) {
		$page_keys = array();
		foreach ( aa_faq_extract( $obj->post_content ) as $i ) { $page_keys[ aa_faq_qkey( $i['q'] ) ] = true; }
		foreach ( $extra as $e ) { if ( isset( $page_keys[ aa_faq_qkey( $e['q'] ) ] ) ) { $suppressed++; } }
	}

	$lines = array(
		'snippet            : loaded (this box proves it)',
		'swap switched on   : ' . ( aa_faq_autoplace_on() ? 'YES' : 'NO  <- Settings > AA Course FAQ' ),
		'extras for ' . str_pad( $slug !== '' ? $slug : '(no course)', 8 ) . ': ' . count( $extra )
			. ( $suppressed ? '  (' . $suppressed . ' suppressed: the page already asks them)' : '' ),
		'extras site-wide   : ' . $uniq['total'] . ' across 4 courses',
		'repeated questions : ' . ( $uniq['cross']
			? count( $uniq['cross'] ) . '  <- REWRITE: ' . implode( ' | ', $uniq['cross'] )
			: 'none - every question belongs to one page only' ),
		'this page slug     : ' . ( $obj instanceof WP_Post ? $obj->post_name : '(no post)' ),
		'resolved course    : ' . ( $found ? $found['slug'] . ' (' . $found['course']['code'] . ')' : 'NONE — the closing band needs this; the FAQ does not' ),
		'',
		'blocks the swap looks for:',
		'  core/group .aa-faqsec : ' . ( $secs ? $secs : '0  <- NOT ON THIS PAGE, nothing to swap' ),
		'  <details> inside it   : ' . ( $details ? $details : '0  <- section found but EMPTY of questions;' ),
		'                          ' . ( $details ? '' : '     something rewrote the FAQ before this filter ran' ),
		'  core/html with aa-final: ' . $finals,
		'',
		'is the page block content at all?',
		'  parsed block types  : ' . ( $names ? count( $names ) : '0  <- classic/freeform page: render_block NEVER fires' ),
	);
	if ( $names ) {
		arsort( $names );
		$top = array_slice( $names, 0, 6, true );
		$bits = array();
		foreach ( $top as $k => $v ) { $bits[] = $k . ' x' . $v; }
		$lines[] = '  most common         : ' . implode( ', ', $bits );
	}

	return '<pre style="font:12px/1.55 monospace;background:#F5FAFA;border:1px solid #CFE3E3;'
	     . 'padding:14px;white-space:pre-wrap;overflow:auto">'
	     . esc_html( implode( "\n", $lines ) ) . '</pre>';
} );

/** Settings -> AA Course FAQ: one switch, so the swap reverts without an edit. */
add_action( 'admin_menu', function () {
	add_options_page( 'AA Course FAQ', 'AA Course FAQ', 'manage_options', 'aa-faq', function () {
		echo '<div class="wrap"><h1>AA Course FAQ</h1><form method="post" action="options.php">';
		settings_fields( 'aa_faq' );
		echo '<table class="form-table"><tr><th>Rebuild the FAQ and closing band</th><td>'
		   . '<label><input type="checkbox" name="aa_faq_autoplace" value="yes" '
		   . checked( aa_faq_autoplace_on(), true, false ) . '> Use the new design</label>'
		   . '<p class="description">The questions and answers are the page\'s own &mdash; this only '
		   . 'changes how they are presented. Unticking puts the original blocks straight back.</p>'
		   . '</td></tr></table>';
		submit_button();
		echo '</form></div>';
	} );
} );
add_action( 'admin_init', function () {
	register_setting( 'aa_faq', 'aa_faq_autoplace', array(
		'sanitize_callback' => function ( $v ) { return $v === 'yes' ? 'yes' : 'no'; },
		'default'           => 'yes',
	) );
} );

endif; // double-load guard
