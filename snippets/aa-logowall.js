/* ==============================================================
   AA - Logo Wall · universal client-logo wall (one source)
   Snippet type: JavaScript Snippet · Insert: Site Wide Footer
   --------------------------------------------------------------
   - Auto-converts each course/hub "Graduates work at" strip
     (.aa-trust) into the logo wall.
   - Fills any placeholder you drop in:  <div class="aa-logowall" data-auto></div>
   Styling lives in Additional CSS (.aa-logowall). Edit LOGOS below to manage the wall.
   ============================================================== */
(function(){
	'use strict';
	var LOGOS = [
		{u:'https://agile-agilist.com/wp-content/uploads/2026/05/mckinsey.svg', a:'McKinsey & Company'},
		{u:'https://agile-agilist.com/wp-content/uploads/2026/05/bcg.jpg', a:'Boston Consulting Group'},
		{u:'https://agile-agilist.com/wp-content/uploads/2026/05/deloitte.svg', a:'Deloitte'},
		{u:'https://agile-agilist.com/wp-content/uploads/2026/05/kpmg.svg', a:'KPMG'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/PricewaterhouseCoopers_Logo.svg.png', a:'PwC'},
		{u:'https://agile-agilist.com/wp-content/uploads/2026/05/EY.png', a:'EY'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/Accenture-Emblem-scaled.png', a:'Accenture'},
		{u:'https://agile-agilist.com/wp-content/uploads/2026/05/IBM.png', a:'IBM'},
		{u:'https://agile-agilist.com/wp-content/uploads/2026/05/TD.png', a:'TD Bank'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/Manulife-Insurance-Company.png', a:'Manulife'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/Sun-Life-Financial-Logo-2000-scaled.png', a:'Sun Life'},
		{u:'https://agile-agilist.com/wp-content/uploads/2026/05/New_Logo.jpg', a:'State Street'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/John_Hancock_Insurance_Logo.png', a:'John Hancock'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/Allstate-Logo-1999-scaled.png', a:'Allstate'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/ia_financialgroup-h-rgb.png', a:'iA Financial Group'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/interac-logo-9CFFE7DC19-seeklogo.com_.png', a:'Interac'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/International_Finance_Corporation_logo.svg.png', a:'IFC'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/Bell_logo.svg_.png', a:'Bell'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/Canadian_Tire_Petco.jpg', a:'Canadian Tire'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/https___s3.amazonaws.com_socast-superdesk_media_20201002181020_b84f0e36a4037bb90fcbc642d725f9f47549612d08ca6a3846da8e45f2616d44.png', a:'Suncor'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/cat-logo.jpg', a:'Caterpillar'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/asco-logo-header-desktop-580.png', a:'ASCO'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/images.png', a:'World Vision'},
		{u:'https://agile-agilist.com/wp-content/uploads/2025/09/images.jpg', a:'U.S. Air Force'}
	];

	function esc(s){ var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

	function tiles(){
		var s = '';
		for(var i=0; LOGOS.length > i; i++){
			s += '<span class="aa-logo"><img src="' + LOGOS[i].u + '" alt="' + esc(LOGOS[i].a) + '" loading="lazy"></span>';
		}
		return s;
	}

	function render(){
		// 1) explicit placeholders (homepage, anywhere): <div class="aa-logowall" data-auto></div>
		var html = tiles();
		var ph = document.querySelectorAll('.aa-logowall[data-auto]');
		for(var i=0; ph.length > i; i++){
			if(ph[i].getAttribute('data-done')) continue;
			ph[i].setAttribute('data-done','1');
			ph[i].innerHTML = html;
		}
		// 2) testimonials: show each reviewer's company logo next to their name (auto-matched)
		decorateReviews();
	}

	function decorateReviews(){
		var cards = document.querySelectorAll('.aa-qcard');
		if(!cards.length) return;
		// match longest company names first so "TD Bank"/"Manulife" beat short tokens
		var byLen = LOGOS.slice().sort(function(a,b){ return b.a.length - a.a.length; });
		for(var i=0; cards.length > i; i++){
			var card = cards[i];
			if(card.getAttribute('data-logo')) continue;
			var who = card.querySelector('.aa-qwho');
			var nameEl = card.querySelector('.aa-qname');
			if(!who || !nameEl) continue;
			var txt = nameEl.textContent || '';
			var m = null;
			for(var j=0; byLen.length > j; j++){ if(byLen[j].a.length > 2 && txt.indexOf(byLen[j].a) >= 0){ m = byLen[j]; break; } }
			if(!m) continue;
			card.setAttribute('data-logo','1');
			var img = document.createElement('img');
			img.className = 'aa-qlogo'; img.src = m.u; img.alt = m.a; img.loading = 'lazy';
			var av = who.querySelector('.aa-qav');
			if(av){ who.replaceChild(img, av); }   // replace the gradient avatar with the company logo
			else { who.insertBefore(img, who.firstChild); }
		}
	}

	if(document.readyState !== 'loading'){ render(); }
	else { document.addEventListener('DOMContentLoaded', render); }
})();
