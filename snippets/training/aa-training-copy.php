<?php
/**
 * AA – Training category pages: EDITORIAL COPY
 * -----------------------------------------------------------------------------
 * The five track landing pages, in the design from the training-category
 * handoff. Copy layer only -- courses, prices, durations and cohorts come from
 * aa_reg_course(), so nothing here can contradict what the checkout charges.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS COPY IS SHAPED THE WAY IT IS
 *
 * The hero sits directly beside the registration card, which makes it the most
 * expensive text on the site: it is read by a person deciding whether to spend
 * $2,875, by a search engine deciding what the page is about, and by an
 * assistant deciding what to quote. Those three want different things, and the
 * first draft of this file served only the first.
 *
 * 1. SEARCH. "The credentials that move you into the senior seat." is a good
 *    line containing no term anyone searches. People type "Advanced SAFe
 *    certification", "SPC certification", "RTE course". The keyword now sits
 *    in the h1 -- which is the h1 for the page -- and the benefit moved into
 *    'accent', the italic tail, where it still lands emotionally.
 *
 * 2. ASSISTANTS AND ANSWER ENGINES quote sentences, not fragments, and they
 *    cannot quote a number whose caveat is elsewhere on the page. So 'sub' is
 *    two complete sentences carrying the entities that identify this page --
 *    course names, duration, format, what is included -- and every figure is
 *    stated with its qualifier attached. Nothing here needs the rest of the
 *    page to be true.
 *
 * 3. MOBILE. The h1 renders up to 52px. At 390px a nine-word headline is four
 *    or five lines and pushes the register card below the fold, on the one
 *    page where the card is the point. Headlines are held to six words or
 *    fewer, with 'accent' able to wrap onto its own line without stranding a
 *    single word.
 *
 * 'points' is new: three short factual chips beside the CTA. They repeat the
 * facts a buyer scans for -- duration, what is included, what happens if the
 * date stops working -- in a form that survives being read on a phone at a
 * glance, and that an answer engine can lift as a list.
 *
 * ---------------------------------------------------------------------------
 * COPY RULES BAKED IN, all previously ruled on:
 *   - exam prep and support; never a pass guarantee, never money back on a
 *     failed exam
 *   - rescheduling is free and carries no notice window
 *   - no star ratings, no aggregate review claims
 *   - salary is role context and never a course outcome, and the caveat is a
 *     sentence rather than a footnote so it travels with the number
 *   - nothing asserted about Scaled Agile credentials that our own pages do
 *     not already say
 *
 * 'accent' is the italic serif tail and carries its own full stop.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

function aa_training_copy() {
	return array(

		/* ---------------------------------------------------------------
		   ADVANCED SAFe -- SPC, ASPC, RTE, APM, LPM, ARCH, Large Solution
		   Audience is already certified and already working in SAFe. They
		   are buying seniority, so the keyword carries the benefit.
		   --------------------------------------------------------------- */
		'adv-safe' => array(
			'label'   => 'Advanced SAFe',
			'kicker'  => 'Senior roles',
			'title'   => 'Advanced SAFe certification',
			'accent'  => 'for the senior seat.',
			'sub'     => 'SPC, ASPC, RTE, LPM, APM, SAFe Architect and Implementing Large Solution SAFe, '
			           . 'taught live online by a Gold SPCT with the exam fee included. These are the '
			           . 'credentials enterprises screen for when they are hiring someone to lead a '
			           . 'transformation rather than take part in one.',
			'comp'    => 'Live online · exam fee included · reschedule at no fee.',
			'points'  => array( '2–4 days', 'Exam fee included', 'Reschedule at no fee' ),
		),

		/* ---------------------------------------------------------------
		   CORE SAFe ROLES
		   First certification for most buyers. The decision is "will this
		   get me screened in", and the objection is how long it takes.
		   --------------------------------------------------------------- */
		'safe-roles' => array(
			'label'   => 'Core SAFe Roles',
			'kicker'  => 'Start here',
			'title'   => 'SAFe certification',
			'accent'  => 'by role.',
			'sub'     => 'Leading SAFe, SAFe Scrum Master, Product Owner / Product Manager, Advanced '
			           . 'Scrum Master, DevOps, SAFe for Teams and Business Owner. Most run two days '
			           . 'live online with the exam fee included, so you can sit the exam and be '
			           . 'certified inside the same week.',
			'comp'    => 'Two days · exam fee included · reschedule at no fee.',
			'points'  => array( 'Two days', 'Exam fee included', 'Certified this week' ),
		),

		/* ---------------------------------------------------------------
		   AI-NATIVE
		   Newest track. Leads on the roles rather than the technology, and
		   answers the objection this audience actually raises out loud.
		   --------------------------------------------------------------- */
		'ai-native' => array(
			'label'   => 'AI-Native',
			'kicker'  => 'New for 2026',
			'title'   => 'AI-Native certification',
			'accent'  => 'for the roles being hired now.',
			'sub'     => 'AI-Native Foundations, AI-Native Value Architect and Leading the AI-Native '
			           . 'Organization — three certifications for roles that did not exist two years '
			           . 'ago and are on job boards today. Built for the people who lead the work, so '
			           . 'no coding is required.',
			'comp'    => 'In person and live online · exam fee included.',
			'points'  => array( '1–2 days', 'No coding required', 'In person or live online' ),
		),

		/* ---------------------------------------------------------------
		   MICRO-CREDENTIALS
		   Not a career change, a top-up. Sells the low cost of taking one,
		   which is the actual reason someone books.
		   --------------------------------------------------------------- */
		'safe-found' => array(
			'label'   => 'Micro-credentials',
			'kicker'  => 'One day, one skill',
			'title'   => 'SAFe micro-credentials',
			'accent'  => 'in a single day.',
			'sub'     => 'One-day credentials that sit between the full certifications, each going '
			           . 'deep on one skill and carrying a digital badge issued by Scaled Agile. '
			           . 'Book one, add the specialisation, and be back at your desk tomorrow.',
			'comp'    => 'One day · digital badge issued by Scaled Agile.',
			'points'  => array( 'One day', 'Digital badge', 'No exam to revise for' ),
		),

		/* ---------------------------------------------------------------
		   SAFe BY INDUSTRY
		   Same certifications, different constraints. This buyer has been
		   told generic agile does not survive their contract or regulator,
		   so the opening answers that before anything else.
		   --------------------------------------------------------------- */
		'safe-industry' => array(
			'label'   => 'SAFe by Industry',
			'kicker'  => 'Your sector',
			'title'   => 'SAFe training',
			'accent'  => 'for your industry.',
			'sub'     => 'Government, defence, hardware and regulated delivery — the same SAFe '
			           . 'certifications, taught against the contracts, compliance and approval gates '
			           . 'your sector works under. Delivered by instructors who have run these '
			           . 'programmes inside them.',
			'comp'    => 'Live online and in person · exam fee included.',
			'points'  => array( 'Sector-specific', 'Exam fee included', 'In person available' ),
		),
	);
}

/**
 * The salary caveat, one sentence, on every page.
 *
 * Prose and not a footnote on purpose: this is the sentence that has to travel
 * if a search engine or an assistant quotes the band, and a figure quoted
 * without it reads as a promise about what the course pays.
 */
function aa_training_salary_note() {
	return 'Figures are median total compensation for the role, from Scaled Agile, LinkedIn '
	     . 'Salary and Payscale. Compensation reflects the role and the market, not the '
	     . 'certification on its own, and course fees are separate.';
}
