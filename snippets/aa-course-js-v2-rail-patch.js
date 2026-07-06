/* ==============================================================
   AA - Course JS · v2 HERO RAIL add-on  (for SA course page)
   --------------------------------------------------------------
   ADD-ON to the existing "AA – Course JS" snippet. Does NOT touch
   checkout. Renders the v2 scrollable cohort rail + in-place
   register panel, reusing getItems()/selectCohort()/openReg().
   No-ops on any page without #aa-rail.

   INSTALL (2 edits inside the existing snippet):
   1) Paste buildRail() below INSIDE the IIFE, right above:
          // ==================== INIT ====================
   2) In init(), right after the buildPick line, add:
          T(function(){ buildRail(ITEMS); });
   ============================================================== */

	// ==================== V2 HERO RAIL (scrollable chips + in-place panel) ====================
	function buildRail(items){
		var rail = $('aa-rail');
		if(!rail) return;                       // no v2 hero on this page -> do nothing
		items = items.slice(0, 12);
		var dateEl   = $('aa-rail-date');
		var timeEl   = $('aa-rail-time');
		var badgeEl  = $('aa-rail-badge');
		var stripeBtn= $('aa-rail-stripe');
		var ebBtn    = $('aa-rail-eb');
		var EB_ORG   = rail.getAttribute('data-eb') || '';   // fallback Eventbrite URL if a date has no specific link
		var EB_LOGO  = 'https://agile-agilist.com/wp-content/uploads/2026/06/evetbrite.webp';
		var STRIPE_LOGO = 'https://agile-agilist.com/wp-content/uploads/2026/06/Untitled-1.webp';
		var TIME     = '09:00–17:00 ET';
		var sel = [];
		rail.innerHTML = '';
		var headSub = document.querySelector('.ls-cohorts-head .sub');
		if(headSub){ headSub.textContent = 'Click on the date and complete the registration process.'; }

		for(var i=0; items.length > i; i++){
			var it  = items[i];
			var dow = it.dow != null ? it.dow : 6;
			var mf  = MONF[MON.indexOf(it.mon)] || it.mon;
			var wdShort = WD[dow] ? WD[dow].slice(0,3) : '';
			var full = (WD[dow] ? WD[dow] + ', ' : '') + it.day + ' ' + mf;
			var kind = i === 0 ? 'hot' : (i === 3 ? 'low' : 'none');
			var badgeTxt = i === 0 ? 'FAST FILLING' : (i === 3 ? 'FEW SEATS' : '');
			// specific-event Eventbrite link from the feed; fall back to the org URL only if none
			var ebHref = (it.href && it.href.charAt(0) !== '#') ? it.href : EB_ORG;
			sel.push({
				ff:   it.mon + ' ' + it.day + (it.when ? (' — ' + it.when) : ''),
				full: full, badge: badgeTxt, kind: kind, eb: ebHref
			});
			var b = document.createElement('button');
			b.type = 'button';
			b.className = 'ls-chip';
			b.innerHTML =
				'<span class="ls-chip-top"><span class="ls-chip-wd">' + esc(wdShort) + '</span>' +
				'<span class="ls-chip-dot ' + kind + '"></span></span>' +
				'<span class="ls-chip-date">' + esc(it.mon + ' ' + it.day) + '</span>' +
				'<span class="ls-chip-time">' + TIME + '</span>';
			(function(idx){ b.addEventListener('click', function(){ pick(idx); }); })(i);
			rail.appendChild(b);
		}

		// Wrap the rail so a "More dates" control can FLOAT at its right edge (always visible,
		// not lost inside the horizontal scroll). Scrolls the rail in place — stays in the hero.
		var wrap;
		if(rail.parentNode && rail.parentNode.classList.contains('ls-rail-wrap')){
			wrap = rail.parentNode;
		} else {
			wrap = document.createElement('div');
			wrap.className = 'ls-rail-wrap';
			rail.parentNode.insertBefore(wrap, rail);
			wrap.appendChild(rail);
		}
		var oldNav = wrap.querySelectorAll('.ls-nav');
		for(var q=0; oldNav.length > q; q++){ oldNav[q].parentNode.removeChild(oldNav[q]); }
		function page(){ return 320; }   // scroll ~2 chips in place (slide, not a full-page swap)
		var prev = document.createElement('button');
		prev.type = 'button';
		prev.className = 'ls-nav ls-nav-prev';
		prev.setAttribute('aria-label','Earlier dates');
		prev.innerHTML = '&#8249;';   // ‹
		prev.addEventListener('click', function(){ rail.scrollBy({ left: -page(), behavior: 'smooth' }); });
		var next = document.createElement('button');
		next.type = 'button';
		next.className = 'ls-nav ls-nav-next';
		next.setAttribute('aria-label','More dates');
		next.innerHTML = '&#8250;';    // ›
		next.addEventListener('click', function(){ rail.scrollBy({ left: page(), behavior: 'smooth' }); });
		wrap.insertBefore(prev, rail);   // ‹ before the rail
		wrap.appendChild(next);          // › after the rail
		function syncArrows(){
			var maxScroll = rail.scrollWidth - rail.clientWidth;
			var noScroll = maxScroll <= 8;
			prev.style.display = noScroll ? 'none' : '';
			next.style.display = noScroll ? 'none' : '';
			prev.disabled = rail.scrollLeft <= 4;
			next.disabled = rail.scrollLeft >= maxScroll - 4;
		}
		rail.addEventListener('scroll', syncArrows, {passive:true});
		window.addEventListener('resize', syncArrows);
		setTimeout(syncArrows, 60);

		// Buttons: "Register [Stripe]" / "Register [Eventbrite]" (logos). EB href set per date in pick()
		if(stripeBtn){
			stripeBtn.innerHTML = 'Register <img src="' + STRIPE_LOGO + '" alt="Stripe" style="height:14px;width:auto;vertical-align:middle;display:inline-block;filter:brightness(0) invert(1);margin-left:5px">';
		}
		if(ebBtn){
			ebBtn.innerHTML = 'Register <img src="' + EB_LOGO + '" alt="Eventbrite" style="height:14px;width:auto;vertical-align:middle;display:inline-block;margin-left:5px">';
			ebBtn.setAttribute('target','_blank');
			ebBtn.setAttribute('rel','noopener');
		}

		var current = 0;
		function pick(i){
			current = i;
			var chips = rail.querySelectorAll('.ls-chip');
			for(var n=0; chips.length > n; n++){ chips[n].classList.toggle('is-active', n === i); }
			if(chips[i]) chips[i].scrollIntoView({ inline:'nearest', block:'nearest', behavior:'smooth' });
			var s = sel[i];
			if(dateEl) dateEl.textContent = s.full;
			if(timeEl) timeEl.textContent = TIME;
			if(badgeEl){
				badgeEl.textContent = s.badge || '';
				badgeEl.className = 'badge ' + (s.badge ? s.kind : '');
				badgeEl.style.display = s.badge ? '' : 'none';
			}
			if(ebBtn && s.eb){ ebBtn.setAttribute('href', s.eb); }   // specific-event Eventbrite link
			selectCohort(s.ff);                                       // pre-fill FluentForm 21
		}

		// "Register [Stripe]" -> open the SAME FluentForm 21 (Stripe) with the date pre-selected
		if(stripeBtn){
			stripeBtn.addEventListener('click', function(e){
				e.preventDefault();
				selectCohort(sel[current].ff);
				openReg();
			});
		}

		if(items.length) pick(0);
	}
