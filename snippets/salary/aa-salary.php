<?php
/**
 * AA — SALARY INSIGHTS                                   [aa_salary_insights]
 * ============================================================================
 * WPCode -> PHP Snippet, Run Everywhere.
 *
 * Section 04 of the training design, as a shortcode that can stand on any page:
 * a band chart of what each credential's roles pay, and a column of career
 * paths. Picking a path redraws the chart as that ladder, in order, with the
 * step-by-step lift between credentials.
 *
 * WHY A SHORTCODE AND NOT PART OF aa_training_category().
 * The category shortcode is not changing -- that was the instruction, and it is
 * the right one: it sells courses and it works. This is a separate block that
 * goes wherever it is wanted, including on pages that have no course list at
 * all. One implementation, five parent pages, the hub, nothing rewritten.
 *
 * WHERE THE NUMBERS LIVE.
 * Not in the page, and not in this file beyond a fallback. They are in the
 * option `aa_salary_data`, so the figures can be revised without touching code
 * and -- this is the part that matters here -- without anyone having to open
 * WPCode and press Update to make the change take effect. Salary figures get
 * revised yearly by a human; course code does not.
 *
 * The defaults below are what /training/ has been publishing. They are carried
 * over deliberately rather than corrected, because that was the call. The
 * sources line is a required part of the block, not decoration -- a figure with
 * no attribution is the thing we are trying not to publish.
 */

/**
 * The dataset. Option first, fallback second, so the block renders on a site
 * where the option was never written.
 *
 * medians and ranges are thousands of USD. `extra` carries codes that appear in
 * a path ladder but have no band of their own -- without it a path step would
 * render with an empty figure, which looks like a bug rather than a gap.
 */
function aa_salary_data() {
	$stored = get_option( 'aa_salary_data' );
	if ( is_array( $stored ) && ! empty( $stored['bands'] ) ) {
		return $stored;
	}

	return array(
		'bands' => array(
			array( 'code' => 'SPC',  'median' => 195, 'lo' => 165, 'hi' => 240 ),
			array( 'code' => 'ARCH', 'median' => 185, 'lo' => 160, 'hi' => 240 ),
			array( 'code' => 'RTE',  'median' => 172, 'lo' => 135, 'hi' => 260 ),
			array( 'code' => 'APM',  'median' => 170, 'lo' => 140, 'hi' => 220 ),
			array( 'code' => 'LPM',  'median' => 165, 'lo' => 145, 'hi' => 210 ),
			array( 'code' => 'SDP',  'median' => 140, 'lo' => 115, 'hi' => 175 ),
			array( 'code' => 'POPM', 'median' => 135, 'lo' => 110, 'hi' => 170 ),
			array( 'code' => 'SSM',  'median' => 110, 'lo' =>  92, 'hi' => 135 ),
		),
		/* Codes used by a path ladder that have no band row of their own. */
		'extra' => array(
			'SASM'   => 130,
			'AINF'   => 140,
			'AINCA'  => 180,
			'AINORG' => 280,
		),
		'paths' => array(
			array(
				'kicker' => 'Team & delivery track',
				'title'  => 'From Scrum Master to',
				'accent' => 'portfolio leader.',
				'blurb'  => 'Start on the team, grow into ART leadership, then move into enterprise portfolio management.',
				'steps'  => array( 'SSM', 'SASM', 'RTE', 'LPM', 'SPC' ),
			),
			array(
				'kicker' => 'Product track',
				'title'  => 'From PO to',
				'accent' => 'product leadership.',
				'blurb'  => 'Move from Product Owner to Agile Product Manager, then into portfolio-level product strategy.',
				'steps'  => array( 'POPM', 'APM', 'LPM' ),
			),
			array(
				'kicker' => 'AI-Native track · New 2026',
				'title'  => 'From AI-curious to',
				'accent' => 'AI-Native executive.',
				'blurb'  => 'Foundational AI literacy through to leading an AI-Native enterprise. No coding required.',
				'steps'  => array( 'AINF', 'AINCA', 'AINORG' ),
			),
		),
		'sources' => 'Sources: Scaled Agile, LinkedIn Salary, Payscale · 2026.',
	);
}

/**
 * Seven colours, assigned by position. A track with a different number of
 * credentials needs no CSS change -- which is the only reason the palette is
 * here in PHP rather than as eight hand-written classes.
 */
function aa_salary_palette() {
	return array( '#0E8074', '#D34B2A', '#B3702A', '#3D6B8E', '#7A5A96', '#2F8F5B', '#9A4B5E' );
}

/**
 * The full name behind a code, taken from the course table so this block and
 * the course pages can never disagree about what "APM" stands for. Falls back
 * to the code, because a path may legitimately reference a credential that has
 * no course row yet.
 */
function aa_salary_label( $code ) {
	if ( ! function_exists( 'aa_reg_courses' ) ) {
		return $code;
	}
	foreach ( aa_reg_courses() as $course ) {
		if ( isset( $course['code'] ) && $course['code'] === $code ) {
			/* "SAFe® Release Train Engineer Certification" -> the useful middle.
			   The badge already says RTE; repeating it in the label is noise. */
			$name = isset( $course['name'] ) ? $course['name'] : $code;
			$name = preg_replace( '/^SAFe®?\s*/u', '', $name );
			$name = preg_replace( '/\s*Certification$/u', '', $name );
			return trim( $name );
		}
	}
	return $code;
}

/**
 * The course page for a code, so a band or a step chip is a way in rather than
 * a dead end. Empty when the credential has no page -- the markup drops the
 * link rather than pointing at a 404.
 */
function aa_salary_url( $code ) {
	if ( ! function_exists( 'aa_reg_courses' ) ) {
		return '';
	}
	foreach ( aa_reg_courses() as $course ) {
		if ( isset( $course['code'] ) && $course['code'] === $code && ! empty( $course['url'] ) ) {
			return $course['url'];
		}
	}
	return '';
}

/**
 * [aa_salary_insights]
 *
 *   paths="0"    chart only, no path column. For a narrow page.
 *   codes=""     restrict the bands to these codes, comma separated, so a
 *                track page can show only its own credentials.
 *   heading=""   override the H2. Empty renders the default.
 *
 * Everything is in the server's HTML: every band, every figure, every path.
 * The script only moves what is already there. With scripts off this is still
 * a complete, readable salary table -- which is the version a crawler and an
 * assistant see, and the reason the figures are worth publishing at all.
 */
function aa_salary_insights_shortcode( $atts ) {
	$a = shortcode_atts( array(
		'paths'   => '1',
		'codes'   => '',
		'heading' => '',
	), $atts, 'aa_salary_insights' );

	$data = aa_salary_data();
	if ( empty( $data['bands'] ) ) {
		return '';
	}

	$bands = $data['bands'];

	/* A track page wants its own credentials, in the dataset's order. */
	if ( $a['codes'] !== '' ) {
		$want  = array_map( 'trim', explode( ',', strtoupper( $a['codes'] ) ) );
		$bands = array_values( array_filter( $bands, function ( $b ) use ( $want ) {
			return in_array( $b['code'], $want, true );
		} ) );
		if ( ! $bands ) {
			return '';
		}
	}

	$pal   = aa_salary_palette();
	$extra = isset( $data['extra'] ) ? (array) $data['extra'] : array();
	$paths = ( $a['paths'] === '1' && ! empty( $data['paths'] ) ) ? $data['paths'] : array();

	/* The chart's scale. Rounded up to the next 25 so the axis is a round
	   number and the widest bar does not touch the right edge. */
	$hi = 0;
	foreach ( $bands as $b ) {
		$hi = max( $hi, (int) $b['hi'] );
	}
	foreach ( $extra as $v ) {
		$hi = max( $hi, (int) $v );
	}
	$scale = max( 25, (int) ( ceil( $hi / 25 ) * 25 ) );

	/* Colour per code, by position, for bands and step chips alike. */
	$colour = array();
	$i      = 0;
	foreach ( $bands as $b ) {
		$colour[ $b['code'] ] = $pal[ $i % count( $pal ) ];
		$i++;
	}
	foreach ( array_keys( $extra ) as $code ) {
		if ( ! isset( $colour[ $code ] ) ) {
			$colour[ $code ] = $pal[ $i % count( $pal ) ];
			$i++;
		}
	}

	$pct = function ( $v ) use ( $scale ) {
		return round( ( (float) $v / $scale ) * 100, 2 );
	};
	$money = function ( $k ) {
		return '$' . number_format( (int) $k ) . 'K';
	};

	$h  = '<section class="aas" data-aas>';
	$h .= '<div class="aas__head">';
	$h .= '<span class="aas__kicker">Salary insights</span>';
	$h .= '<h2 class="aas__h2">' . ( $a['heading'] !== ''
		? esc_html( $a['heading'] )
		: 'Pick a path. <em>Watch what it pays.</em>' ) . '</h2>';
	$h .= '<p class="aas__lede">Every credential&rsquo;s median and range. Choose a path and the chart '
	    . 'redraws as that ladder, in order, with the lift between each step.</p>';
	$h .= '</div>';

	$h .= '<div class="aas__grid">';

	/* ---- the chart ------------------------------------------------------ */
	$h .= '<div class="aas__chart">';
	$h .= '<div class="aas__bandhead" data-aas-head>'
	    . '<b data-aas-title>All credentials</b>'
	    . '<span data-aas-sub>' . count( $bands ) . ' roles &middot; median and range</span>'
	    . '<button type="button" class="aas__reset" data-aas-reset hidden>Show all</button>'
	    . '</div>';

	$h .= '<div class="aas__bands aas__bands--all" data-aas-bands>';
	foreach ( $bands as $n => $b ) {
		$c = $colour[ $b['code'] ];
		$h .= '<div class="aas__band" data-aas-band="' . esc_attr( $b['code'] ) . '"'
		    . ' data-median="' . esc_attr( $b['median'] ) . '"'
		    . ' data-lo="' . esc_attr( $b['lo'] ) . '"'
		    . ' data-hi="' . esc_attr( $b['hi'] ) . '">';
		$h .= '<span class="aas__step" data-aas-step>' . ( $n + 1 ) . '</span>';
		$h .= '<span class="aas__badge" style="background:' . esc_attr( $c ) . '1F;color:'
		    . esc_attr( $c ) . '">' . esc_html( $b['code'] ) . '</span>';
		$h .= '<span class="aas__track">'
		    . '<span class="aas__bar" data-aas-bar style="left:' . $pct( $b['lo'] ) . '%;width:'
		    . ( $pct( $b['hi'] ) - $pct( $b['lo'] ) ) . '%;background:' . esc_attr( $c ) . '"></span>'
		    . '<span class="aas__mark" data-aas-mark style="left:' . $pct( $b['median'] ) . '%"></span>'
		    . '</span>';
		$h .= '<span class="aas__fig">'
		    . '<b class="aas__median" data-aas-median>' . esc_html( $money( $b['median'] ) ) . '</b>'
		    . '<span class="aas__sub" data-aas-subfig>' . esc_html( $money( $b['lo'] ) . '–' . $money( $b['hi'] ) ) . '</span>'
		    . '</span>';
		$h .= '</div>';
	}
	$h .= '</div>';

	/* The disclaimer is not optional and not small print. A median is market
	   data about a role; it is not what this course pays you. */
	$h .= '<p class="aas__note">' . esc_html( isset( $data['sources'] ) ? $data['sources'] : '' )
	    . ' Median total compensation is role-based market data, not a guaranteed course outcome. '
	    . 'Course fees are separate.</p>';
	$h .= '</div>';

	/* ---- the paths ------------------------------------------------------ */
	if ( $paths ) {
		$h .= '<div class="aas__paths">';
		$h .= '<span class="aas__kicker">Pick a path &mdash; the chart follows</span>';

		foreach ( $paths as $p => $path ) {
			$steps = array();
			foreach ( (array) $path['steps'] as $code ) {
				$med = null;
				foreach ( $bands as $b ) {
					if ( $b['code'] === $code ) { $med = (int) $b['median']; break; }
				}
				if ( $med === null && isset( $extra[ $code ] ) ) { $med = (int) $extra[ $code ]; }
				if ( $med === null ) { continue; }
				$steps[] = array( 'code' => $code, 'median' => $med );
			}
			if ( count( $steps ) < 2 ) { continue; }

			$first = $steps[0]['median'];
			$last  = $steps[ count( $steps ) - 1 ]['median'];
			$lift  = $first > 0 ? (int) round( ( ( $last - $first ) / $first ) * 100 ) : 0;

			$h .= '<button type="button" class="aas__path" data-aas-path="' . esc_attr( $p ) . '"'
			    . ' aria-pressed="false">';
			$h .= '<span class="aas__path-top">'
			    . '<span class="aas__path-kicker">' . esc_html( $path['kicker'] ) . '</span>'
			    . '<span class="aas__path-pick">Select</span></span>';
			$h .= '<span class="aas__path-h">' . esc_html( $path['title'] )
			    . ' <em>' . esc_html( $path['accent'] ) . '</em></span>';
			$h .= '<span class="aas__path-p">' . esc_html( $path['blurb'] ) . '</span>';

			$h .= '<span class="aas__steps">';
			foreach ( $steps as $sn => $s ) {
				$c   = isset( $colour[ $s['code'] ] ) ? $colour[ $s['code'] ] : '#0E8074';
				$url = aa_salary_url( $s['code'] );
				$h  .= '<span class="aas__stepwrap">';
				$h  .= '<span class="aas__chip">'
				     . '<span class="aas__dot" style="background:' . esc_attr( $c ) . '"></span>'
				     . esc_html( $s['code'] )
				     . ' <em>' . esc_html( $money( $s['median'] ) ) . '</em></span>';
				$h  .= '<span class="aas__arrow" aria-hidden="true">&rarr;</span>';
				$h  .= '</span>';
			}
			$h .= '</span>';

			if ( $lift > 0 ) {
				$h .= '<span class="aas__lift">+' . $lift . '% from first step to last</span>';
			}
			$h .= '</button>';

			/* The ladder, for the script. Server-rendered so the chips above are
			   real content whether or not the script ever runs. */
			$h .= '<script type="application/json" data-aas-ladder="' . esc_attr( $p ) . '">'
			    . wp_json_encode( array(
					'label' => trim( $path['title'] . ' ' . $path['accent'] ),
					'steps' => $steps,
				) ) . '</script>';
		}
		$h .= '</div>';
	}

	$h .= '</div>';

	/* The scale, so the script can recompute a bar's geometry without having to
	   know the dataset. Two integers, not a copy of the content. */
	$h .= '<span hidden data-aas-scale="' . esc_attr( $scale ) . '"></span>';
	$h .= '</section>';

	return $h;
}
add_shortcode( 'aa_salary_insights', 'aa_salary_insights_shortcode' );
