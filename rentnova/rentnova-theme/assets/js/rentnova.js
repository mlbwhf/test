/**
 * RentNova Blueprint — front-end behaviour.
 * 1. Mobile menu toggle
 * 2. Replay the blueprint draw-in when it scrolls into view
 */
( function () {
	'use strict';

	// ---- Mobile menu ----
	var burger = document.querySelector( '.rn-burger' );
	var menu = document.getElementById( 'rn-primary-menu' );
	if ( burger && menu ) {
		burger.addEventListener( 'click', function () {
			var open = menu.classList.toggle( 'is-open' );
			burger.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );
	}

	// ---- Replay blueprint animation on scroll-in ----
	var bp = document.querySelector( '.rn-bp svg' );
	if ( bp && 'IntersectionObserver' in window && ! window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
		var replay = function ( el ) {
			el.querySelectorAll( '[style*="animation"]' ).forEach( function ( node ) {
				var anim = node.style.animation;
				node.style.animation = 'none';
				// force reflow, then restore so the keyframes run again
				void node.offsetWidth;
				node.style.animation = anim;
			} );
		};
		var io = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( entry.isIntersecting ) {
					replay( bp );
				}
			} );
		}, { threshold: 0.35 } );
		io.observe( bp );
	}
} )();
