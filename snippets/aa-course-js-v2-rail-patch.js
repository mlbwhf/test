/* ==============================================================
   AA - Course JS · v2 HERO RAIL add-on  (for SA course page)
   --------------------------------------------------------------
   This is an ADD-ON to your existing "AA – Course JS" snippet.
   It does NOT replace anything and does NOT touch checkout.
   It renders the v2 horizontal cohort rail + in-place register
   panel, reusing your existing getItems()/selectCohort()/openReg().
   It no-ops on any page that has no #aa-rail element, so it is
   safe on every other course page.

   HOW TO INSTALL (2 edits inside the existing snippet):
   1) Paste the buildRail() function below INSIDE the IIFE, right
      above the line:   // ==================== INIT ====================
   2) In init(), add this line right after the buildCohorts line:
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
		var EB_ORG   = rail.getAttribute('data-eb') || '';   // Eventbrite URL (optional), from data-eb on #aa-rail
		var TIME     = '09:00–17:00 ET';
		var sel = [];
		rail.innerHTML = '';

		for(var i=0; items.length > i; i++){
			var it  = items[i];
			var dow = it.dow != null ? it.dow : 6;
			var mf  = MONF[MON.indexOf(it.mon)] || it.mon;
			var wdShort = WD[dow] ? WD[dow].slice(0,3) : '';
			var full = (WD[dow] ? WD[dow] + ', ' : '') + it.day + ' ' + mf;
			var kind = i === 0 ? 'hot' : (i === 3 ? 'low' : 'none');
			var badgeTxt = i === 0 ? 'FAST FILLING' : (i === 3 ? 'FEW SEATS' : '');
			sel.push({
				ff:   it.mon + ' ' + it.day + (it.when ? (' — ' + it.when) : ''), // exact label selectCohort()/fillCohorts() use
				full: full,
				badge: badgeTxt,
				kind: kind
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

		// scroll-more arrow
		var arrow = document.createElement('button');
		arrow.type = 'button';
		arrow.className = 'ls-arrow';
		arrow.setAttribute('aria-label','See more dates');
		arrow.textContent = '→';
		arrow.addEventListener('click', function(){ rail.scrollBy({ left: 330, behavior: 'smooth' }); });
		rail.appendChild(arrow);

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
			selectCohort(s.ff);                 // pre-fill FluentForm 21 behind the scenes
		}

		// "Pay by card" -> open the SAME FluentForm 21 (Stripe) with the date pre-selected
		if(stripeBtn){
			stripeBtn.addEventListener('click', function(e){
				e.preventDefault();
				selectCohort(sel[current].ff);
				openReg();
			});
		}

		// "Reserve on Eventbrite" -> Eventbrite URL (new tab) if provided, else open the form
		if(ebBtn){
			if(EB_ORG){
				ebBtn.setAttribute('href', EB_ORG);
				ebBtn.setAttribute('target','_blank');
				ebBtn.setAttribute('rel','noopener');
			} else {
				ebBtn.addEventListener('click', function(e){ e.preventDefault(); openReg(); });
			}
		}

		if(items.length) pick(0);
	}
