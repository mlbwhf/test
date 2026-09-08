<?php
/**
 * AA – Training category pages: EDITORIAL COPY
 * -----------------------------------------------------------------------------
 * The five track landing pages, in the design from the training-category
 * handoff. This file is the copy layer only -- courses, prices, durations and
 * cohorts all come from aa_reg_course(), so nothing here can disagree with what
 * the checkout charges.
 *
 * WHAT CHANGED AND WHY. The handoff's hero copy describes the catalogue:
 * "The senior SAFe credentials: RTE, LPM, APM, SPC, ASPC. For change agents
 * driving enterprise-scale transformations." That is accurate and it is also
 * an answer to a question nobody asked. Someone landing here is deciding
 * whether this changes their job and their pay, so the opening says that
 * first and names the credentials second.
 *
 * COPY RULES BAKED IN HERE, all previously ruled on:
 *   - no pass guarantee and no money-back-if-you-fail; we say exam prep and
 *     support, which is what we actually do
 *   - rescheduling is free and not tied to a notice window
 *   - no star ratings or aggregate review claims
 *   - salary figures are role context, never a course outcome -- salaryNote
 *     states that in prose on every page, because that is the sentence a
 *     retrieval system will quote back
 *
 * 'accent' is the italic serif tail of the headline and carries its own full
 * stop. 'sub' is the opening paragraph. 'comp' is the quiet line under the
 * buttons.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

function aa_training_copy() {
	return array(

		/* ---------------------------------------------------------------
		   ADVANCED SAFe -- SPC, ASPC, RTE, APM, LPM, ARCH
		   The audience is already certified and already working in SAFe.
		   What they are buying is seniority, so the opening is about the
		   seat they move into, not the syllabus.
		   --------------------------------------------------------------- */
		'adv-safe' => array(
			'label'   => 'Advanced SAFe',
			'kicker'  => 'Senior roles',
			'title'   => 'The credentials that move you',
			'accent'  => 'into the senior seat.',
			'sub'     => 'These are the certifications enterprises screen for when they are hiring '
			           . 'someone to lead a transformation rather than take part in one — SPC, ASPC, '
			           . 'RTE, LPM, APM and Architect. Taught live by a Gold SPCT, exam fee included, '
			           . 'with exam prep and support throughout.',
			'comp'    => 'Live online · exam fee included · reschedule at no fee.',
		),

		/* ---------------------------------------------------------------
		   CORE SAFe ROLES
		   First certification for most buyers. The decision is "will this
		   get me screened in", so that is the promise -- and the barrier
		   worth removing is how long it takes.
		   --------------------------------------------------------------- */
		'safe-roles' => array(
			'label'   => 'Core SAFe Roles',
			'kicker'  => 'Start here',
			'title'   => 'Your first SAFe certification',
			'accent'  => 'and the role it opens.',
			'sub'     => 'Leading SAFe, Scrum Master, Product Owner and DevOps — the credentials that '
			           . 'get a CV past the first screen for agile roles. Most are two days, live '
			           . 'online, exam fee included, so you can be certified by the end of the week.',
			'comp'    => 'Two days · exam fee included · reschedule at no fee.',
		),

		/* ---------------------------------------------------------------
		   AI-NATIVE
		   Newest track and the one with the widest pay gap, so the opening
		   leads on the roles rather than the technology. "No coding
		   required" is the objection this audience actually raises.
		   --------------------------------------------------------------- */
		'ai-native' => array(
			'label'   => 'AI-Native',
			'kicker'  => 'New for 2026',
			'title'   => 'The AI skills employers are',
			'accent'  => 'hiring for right now.',
			'sub'     => 'From personal AI fluency to leading an AI-Native organisation. Three '
			           . 'certifications built for roles that did not exist two years ago and are on '
			           . 'job boards today — designed for the people who lead the work, so no coding '
			           . 'is required.',
			'comp'    => 'In person and live online · exam fee included.',
		),

		/* ---------------------------------------------------------------
		   MICRO-CREDENTIALS
		   Not a career change -- a top-up between certifications. The
		   opening sells the low cost of taking one, which is the actual
		   reason someone books.
		   --------------------------------------------------------------- */
		'safe-found' => array(
			'label'   => 'Micro-credentials',
			'kicker'  => 'One day, one skill',
			'title'   => 'Add a specialisation without',
			'accent'  => 'pausing your career.',
			'sub'     => 'One-day credentials that sit between the full certifications — go deep on a '
			           . 'single skill, earn a digital badge issued by Scaled Agile, and be back at '
			           . 'your desk tomorrow.',
			'comp'    => 'One day · digital badge issued by Scaled Agile.',
		),

		/* ---------------------------------------------------------------
		   SAFe BY INDUSTRY
		   Same certifications, different constraints. The buyer here has
		   already been told generic agile does not survive their contract
		   or their regulator, so the opening answers that objection.
		   --------------------------------------------------------------- */
		'safe-industry' => array(
			'label'   => 'SAFe by Industry',
			'kicker'  => 'Your sector',
			'title'   => 'SAFe taught in the language',
			'accent'  => 'of your industry.',
			'sub'     => 'Government, defence, hardware and regulated delivery — the same '
			           . 'certifications, taught against the contracts, compliance and approval '
			           . 'gates your sector actually works under, by instructors who have delivered '
			           . 'inside them.',
			'comp'    => 'Live online and in person · exam fee included.',
		),
	);
}

/**
 * The salary caveat, one sentence, on every page.
 *
 * Deliberately prose and not a footnote: it is the sentence that has to travel
 * if a search engine or an assistant quotes the salary band, and a number
 * quoted without it reads as a promise about what this course pays.
 */
function aa_training_salary_note() {
	return 'Figures are median total compensation for the role, from Scaled Agile, LinkedIn '
	     . 'Salary and Payscale. Compensation reflects the role and the market, not the '
	     . 'certification on its own, and course fees are separate.';
}
