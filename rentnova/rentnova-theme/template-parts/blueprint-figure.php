<?php
/**
 * Blueprint figure — animated architectural section drawing.
 * Reused by the hero and by the [rentnova_blueprint] shortcode/block.
 *
 * @package rentnova
 */
?>
<div class="rn-bp">
	<span class="rn-bp__corner rn-bp__corner--tl"></span>
	<span class="rn-bp__corner rn-bp__corner--tr"></span>
	<span class="rn-bp__corner rn-bp__corner--bl"></span>
	<span class="rn-bp__corner rn-bp__corner--br"></span>

	<svg viewBox="0 0 1200 730" preserveAspectRatio="xMidYMid meet" role="img" aria-label="<?php esc_attr_e( 'Architectural section showing one lot converted into three legal units: basement suite, main residence, and detached garden suite.', 'rentnova' ); ?>">
		<defs>
			<marker id="rnArr" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto"><path d="M1,1 L8,4.5 L1,8" fill="none" stroke="#cdd6cc" stroke-width="1"/></marker>
			<pattern id="rnHb" width="9" height="9" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="9" stroke="#eae5d6" stroke-width="1" stroke-opacity="0.30"/></pattern>
			<pattern id="rnHm" width="11" height="11" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="11" stroke="#eae5d6" stroke-width="1" stroke-opacity="0.16"/></pattern>
			<pattern id="rnHg" width="8" height="8" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="8" stroke="#e0a583" stroke-width="1" stroke-opacity="0.28"/></pattern>
			<pattern id="rnEarth" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0,22 L22,0 M-4,4 L4,-4 M18,26 L26,18" stroke="#eae5d6" stroke-width="0.8" stroke-opacity="0.10"/></pattern>
		</defs>

		<!-- earth below grade -->
		<rect x="180" y="520" width="760" height="150" fill="url(#rnEarth)" style="opacity:0; animation:rnFadeIn 1s ease forwards 1.1s;"/>

		<!-- hatch fills per unit -->
		<rect x="260" y="520" width="360" height="120" fill="url(#rnHb)" style="opacity:0; animation:rnFadeIn .8s ease forwards 1.15s;"/>
		<rect x="260" y="270" width="360" height="250" fill="url(#rnHm)" style="opacity:0; animation:rnFadeIn .8s ease forwards 1.3s;"/>
		<path d="M690,520 L690,410 L775,360 L860,410 L860,520 Z" fill="url(#rnHg)" style="opacity:0; animation:rnFadeIn .8s ease forwards 1.45s;"/>

		<!-- structure (draws in) -->
		<g stroke="#eae5d6" fill="none" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
			<path d="M260,640 L260,270 L250,270 L440,150 L630,270 L620,270 L620,640 Z" style="stroke-dasharray:1500; stroke-dashoffset:1500; animation:rnDrawIn 1.7s ease forwards .05s;"/>
			<path d="M260,520 L620,520" style="stroke-dasharray:380; stroke-dashoffset:380; animation:rnDrawIn .7s ease forwards .9s;"/>
			<path d="M260,395 L620,395" style="stroke-dasharray:380; stroke-dashoffset:380; animation:rnDrawIn .7s ease forwards 1.0s;"/>
			<path d="M260,270 L620,270" style="stroke-dasharray:380; stroke-dashoffset:380; animation:rnDrawIn .7s ease forwards 1.1s;"/>
			<path d="M560,235 L560,200 L585,200 L585,250" style="stroke-dasharray:120; stroke-dashoffset:120; animation:rnDrawIn .6s ease forwards 1.5s;"/>
			<path d="M300,520 L300,460 L340,460 L340,520" stroke-width="1.6" style="stroke-dasharray:200; stroke-dashoffset:200; animation:rnDrawIn .6s ease forwards 1.7s;"/>
			<path d="M690,520 L690,410 L685,410 L775,360 L865,410 L860,410 L860,520 Z" style="stroke-dasharray:560; stroke-dashoffset:560; animation:rnDrawIn 1.1s ease forwards 1.2s;"/>
			<path d="M70,520 L1130,520" stroke-width="1.4" style="stroke-dasharray:1060; stroke-dashoffset:1060; animation:rnDrawIn 1.6s ease forwards .2s;"/>
		</g>

		<!-- furniture + scale figures -->
		<g stroke="#cdd6cc" fill="none" stroke-width="1.3" stroke-linejoin="round">
			<g style="opacity:0; animation:rnFadeUp .5s ease forwards 1.7s;"><rect x="292" y="592" width="80" height="34" rx="2"/><line x1="292" y1="604" x2="372" y2="604"/><rect x="540" y="566" width="62" height="22" rx="2"/></g>
			<g style="opacity:0; animation:rnFadeUp .5s ease forwards 1.85s;"><rect x="298" y="474" width="92" height="30" rx="3"/><line x1="298" y1="486" x2="390" y2="486"/><rect x="518" y="480" width="92" height="14" rx="2"/><circle cx="460" cy="490" r="13"/></g>
			<g style="opacity:0; animation:rnFadeUp .5s ease forwards 2.0s;"><rect x="298" y="350" width="74" height="34" rx="2"/><line x1="298" y1="362" x2="372" y2="362"/><rect x="510" y="350" width="74" height="34" rx="2"/><line x1="510" y1="362" x2="584" y2="362"/></g>
			<g style="opacity:0; animation:rnFadeUp .5s ease forwards 2.1s;"><rect x="706" y="478" width="58" height="28" rx="2"/><line x1="706" y1="489" x2="764" y2="489"/><circle cx="818" cy="490" r="10"/></g>
			<g style="opacity:0; animation:rnFadeUp .5s ease forwards 2.2s;"><circle cx="440" cy="476" r="7"/><path d="M440,483 L440,512 M440,512 L432,520 M440,512 L448,520 M440,492 L431,503 M440,492 L449,503"/></g>
		</g>

		<!-- landscaping trees -->
		<g stroke="#7f9384" fill="none" stroke-width="1.2" style="opacity:0; animation:rnFadeIn 1s ease forwards 2.0s;">
			<line x1="150" y1="520" x2="150" y2="476"/><circle cx="150" cy="460" r="26" stroke-dasharray="4 4"/>
			<line x1="1015" y1="520" x2="1015" y2="482"/><circle cx="1015" cy="466" r="23" stroke-dasharray="4 4"/>
		</g>

		<!-- dimensions -->
		<g stroke="#cdd6cc" fill="none" stroke-width="1" style="opacity:0; animation:rnFadeUp .6s ease forwards 2.3s;">
			<line x1="206" y1="150" x2="206" y2="640" marker-start="url(#rnArr)" marker-end="url(#rnArr)"/>
			<line x1="206" y1="150" x2="250" y2="150" stroke-dasharray="3 3" stroke-opacity="0.5"/>
			<line x1="206" y1="640" x2="260" y2="640" stroke-dasharray="3 3" stroke-opacity="0.5"/>
			<line x1="260" y1="688" x2="620" y2="688" marker-start="url(#rnArr)" marker-end="url(#rnArr)"/>
			<line x1="260" y1="640" x2="260" y2="694" stroke-dasharray="3 3" stroke-opacity="0.5"/>
			<line x1="620" y1="640" x2="620" y2="694" stroke-dasharray="3 3" stroke-opacity="0.5"/>
			<line x1="690" y1="556" x2="860" y2="556" marker-start="url(#rnArr)" marker-end="url(#rnArr)" stroke-opacity="0.75"/>
		</g>
		<g fill="#cdd6cc" font-family="IBM Plex Mono, monospace" style="opacity:0; animation:rnFadeUp .6s ease forwards 2.45s;">
			<text x="196" y="400" font-size="15" text-anchor="middle" transform="rotate(-90 196 400)">9.0 m</text>
			<text x="440" y="709" font-size="15" text-anchor="middle">12.6 m</text>
			<text x="775" y="548" font-size="12" text-anchor="middle" fill="#e0a583">6.4 m</text>
		</g>

		<!-- annotations / leaders -->
		<g stroke="#e0a583" fill="none" stroke-width="1.2" style="opacity:0; animation:rnFadeUp .6s ease forwards 2.55s;">
			<path d="M520,455 L880,455"/><circle cx="520" cy="455" r="3.5" fill="#e0a583" stroke="none"/>
			<path d="M540,585 L760,585 L880,610"/><circle cx="540" cy="585" r="3.5" fill="#e0a583" stroke="none"/>
			<path d="M820,440 L820,300 L880,300"/><circle cx="820" cy="440" r="3.5" fill="#e0a583" stroke="none"/>
		</g>
		<g font-family="IBM Plex Mono, monospace" style="opacity:0; animation:rnFadeUp .6s ease forwards 2.7s;">
			<text x="892" y="450" font-size="20" font-weight="500" fill="#e0a583">02</text>
			<text x="924" y="445" font-size="14" fill="#f1efe8" letter-spacing="0.06em">MAIN RESIDENCE</text>
			<text x="924" y="463" font-size="11.5" fill="#9fb0a3">4 BR · owner-occupied or leased</text>
			<text x="892" y="606" font-size="20" font-weight="500" fill="#e0a583">01</text>
			<text x="924" y="601" font-size="14" fill="#f1efe8" letter-spacing="0.06em">LEGAL BASEMENT SUITE</text>
			<text x="924" y="619" font-size="11.5" fill="#9fb0a3">1 BR · separate entrance</text>
			<text x="892" y="296" font-size="20" font-weight="500" fill="#e0a583">03</text>
			<text x="924" y="291" font-size="14" fill="#f1efe8" letter-spacing="0.06em">GARDEN SUITE</text>
			<text x="924" y="309" font-size="11.5" fill="#9fb0a3">1 BR · detached · short-stay</text>
		</g>

		<!-- north arrow -->
		<g style="opacity:0; animation:rnFadeIn .8s ease forwards 1.0s;">
			<circle cx="1095" cy="120" r="26" fill="none" stroke="#6f8475" stroke-width="1"/>
			<path d="M1095,100 L1101,122 L1095,116 L1089,122 Z" fill="#e0a583" stroke="none"/>
			<text x="1095" y="150" font-size="11" fill="#9fb0a3" text-anchor="middle" font-family="IBM Plex Mono, monospace">N</text>
		</g>

		<!-- title block -->
		<g style="opacity:0; animation:rnFadeIn .8s ease forwards 2.8s;" font-family="IBM Plex Mono, monospace">
			<rect x="906" y="630" width="270" height="74" fill="none" stroke="#4a5e4f" stroke-width="1"/>
			<line x1="906" y1="654" x2="1176" y2="654" stroke="#4a5e4f" stroke-width="1"/>
			<line x1="1041" y1="654" x2="1041" y2="704" stroke="#4a5e4f" stroke-width="1"/>
			<text x="918" y="648" font-size="13" fill="#f1efe8" font-weight="500" letter-spacing="0.08em">RENTNOVA — SECTION A–A</text>
			<text x="918" y="674" font-size="10.5" fill="#9fb0a3">PROJECT</text>
			<text x="918" y="692" font-size="12" fill="#e0a583">RN·MISS·01</text>
			<text x="1053" y="674" font-size="10.5" fill="#9fb0a3">SCALE</text>
			<text x="1053" y="692" font-size="12" fill="#f1efe8">1 : 100</text>
		</g>

		<!-- scan line -->
		<g style="animation:rnScanY 5s ease-in-out infinite 2.6s;">
			<line x1="240" y1="150" x2="900" y2="150" stroke="#e0a583" stroke-width="1.5" stroke-opacity="0.6"/>
		</g>
	</svg>

	<div class="rn-bp__tag">● 3 units · 1 lot</div>
</div>
