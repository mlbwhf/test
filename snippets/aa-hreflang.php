<?php
/**
 * Agile Agilist — hreflang alternates for standalone translations
 * -----------------------------------------------------------------
 * INSTALL (once): wp-admin → WPCode → Add Snippet → Custom Code →
 *   type: PHP Snippet → paste all of this → Auto Insert →
 *   location "Site Wide Header" (runs on wp_head) → Save & Activate.
 *   Name "AA – hreflang".
 *
 * WHAT IT DOES
 *   Outputs <link rel="alternate" hreflang="…"> tags on the pages that have
 *   translations, so Google/LLMs know the language versions are equivalents
 *   (not duplicate content) and serve the right one.
 *   - English lives at the ROOT url (ads-safe) and is also the x-default.
 *   - Only emits tags for a group when the current URL is one of its members.
 *
 * IMPORTANT: keep AA_HREFLANG_GROUPS in sync with what is actually PUBLISHED.
 *   hreflang pointing at a draft/404 is an error in Search Console — add a
 *   language to a row only after that page is live.
 */

if ( ! function_exists( 'aa_hreflang_groups' ) ) {
	function aa_hreflang_groups() {
		// Each group: language code => site-relative path (with leading+trailing slash).
		// 'en' is required in every group and is reused as x-default.
		return array(
			array( 'en' => '/training/safe/sa/',           'es' => '/es/liderando-safe-sa/', 'fr' => '/fr/leading-safe-sa/', 'ar' => '/ar/leading-safe-sa/' ),
			array( 'en' => '/training/',                    'es' => '/es/formacion/',         'fr' => '/fr/formation/',       'ar' => '/ar/formation/' ),
			array( 'en' => '/training/adv-safe/spc/',       'es' => '/es/spc/',               'fr' => '/fr/spc/',             'ar' => '/ar/spc/' ),
			array( 'en' => '/training/adv-safe/aspc/',      'es' => '/es/aspc/',              'fr' => '/fr/aspc/',            'ar' => '/ar/aspc/' ),
			array( 'en' => '/training/adv-safe/rte/',       'es' => '/es/rte/',               'fr' => '/fr/rte/',             'ar' => '/ar/rte/' ),
			array( 'en' => '/training/safe/scrum-master/',  'es' => '/es/scrum-master/',      'fr' => '/fr/scrum-master/',    'ar' => '/ar/scrum-master/' ),
			array( 'en' => '/training/safe/popm/',          'es' => '/es/popm/',              'fr' => '/fr/popm/',            'ar' => '/ar/popm/' ),
		);
	}
}

if ( ! function_exists( 'aa_hreflang_output' ) ) {
	function aa_hreflang_output() {
		if ( is_admin() ) {
			return;
		}
		$req  = strtok( $_SERVER['REQUEST_URI'], '?' );        // strip query string
		$path = '/' . trim( $req, '/' ) . '/';                 // normalise: leading + trailing slash
		if ( '//' === $path ) {
			$path = '/';
		}

		$home = untrailingslashit( home_url() );               // e.g. https://agile-agilist.com

		foreach ( aa_hreflang_groups() as $group ) {
			// Is the current URL one of this group's members?
			$match = false;
			foreach ( $group as $code => $p ) {
				if ( $p === $path ) {
					$match = true;
					break;
				}
			}
			if ( ! $match ) {
				continue;
			}

			// Emit an alternate for each language in the group…
			foreach ( $group as $code => $p ) {
				printf(
					'<link rel="alternate" hreflang="%s" href="%s" />' . "\n",
					esc_attr( $code ),
					esc_url( $home . $p )
				);
			}
			// …plus x-default → English root.
			if ( ! empty( $group['en'] ) ) {
				printf(
					'<link rel="alternate" hreflang="x-default" href="%s" />' . "\n",
					esc_url( $home . $group['en'] )
				);
			}
			break; // a URL belongs to at most one group
		}
	}
}

add_action( 'wp_head', 'aa_hreflang_output', 1 );
