<?php
/**
 * Report AI — nav panel height fix (SMALL, ADD AS A SECOND WPCODE SNIPPET).
 *
 * Name it: "Report AI — nav height fix"
 * Type: PHP Snippet · Auto Insert · Run Everywhere · Save.
 *
 * WHY: the panel's height is set by the LEFT RAIL. Indexes has 8 section rows
 * (~420px) so its right pane has room. Reports has only 3 collection rows
 * (~170px), so the pane — pinned top:0/bottom:0 to the panel — was clipped and
 * The Dark Side's 18 reports were cut off after two rows.
 *
 * FIX: give each panel a floor height so the pane has room, and let a long list
 * scroll inside the pane instead of overflowing the panel.
 *
 * Prints at priority 1000, i.e. after the main nav snippet (999), so it wins.
 */
add_action( 'wp_head', function () {
	?>
	<style id="tai-nav-height-fix">
	@media(min-width:769px){
		/* Floor height so the right pane always has room to render */
		.main-navigation .menu-indexes > .sub-menu{ min-height:420px!important; }
		.main-navigation .menu-reports > .sub-menu{ min-height:380px!important; }

		/* Long lists scroll inside the pane rather than spilling out of the panel */
		.main-navigation .menu-indexes > .sub-menu > li > .sub-menu,
		.main-navigation .menu-reports  > .sub-menu > li > .sub-menu{
			max-height:min(70vh,520px)!important;
			overflow-y:auto!important;
			overscroll-behavior:contain;
		}

		/* Keep the pane header and the hub link pinned while the list scrolls */
		.main-navigation .sub-menu .tai-pane-head{
			position:sticky; top:0; background:#fff; z-index:2; padding-top:2px;
		}
		.main-navigation .sub-menu .tai-pane-hub{
			position:sticky; bottom:0; background:#fff; z-index:2;
			border-top:1px solid #f0f0f2; margin-top:auto;
		}

		/* Left rail: footer row sits at the bottom of the taller panel */
		.main-navigation .menu-indexes > .sub-menu,
		.main-navigation .menu-reports > .sub-menu{ display:flex!important; flex-direction:column!important; }
		.main-navigation .menu-indexes > .sub-menu > li.nav-all,
		.main-navigation .menu-indexes > .sub-menu > li.nav-tool,
		.main-navigation .menu-reports > .sub-menu > li.nav-all,
		.main-navigation .menu-reports > .sub-menu > li.nav-tool{ margin-top:auto; }
		.main-navigation .menu-indexes > .sub-menu > li.nav-tool ~ li.nav-all,
		.main-navigation .menu-reports > .sub-menu > li.nav-tool ~ li.nav-all{ margin-top:0; }
	}
	</style>
	<?php
}, 1000 );
