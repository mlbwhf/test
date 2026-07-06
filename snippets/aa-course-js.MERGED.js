/* ==============================================================
   AA - Course JS · Clean rebuild
   Snippet type: JavaScript Snippet
   Insert location: Site Wide Footer (or Everywhere Frontend)
   ============================================================== */
(function(){
	'use strict';
	if(!document.querySelector('.aa-rd')) return;

	// ==================== CONFIG ====================
	// EB_URL removed — course-page Eventbrite buttons now scroll to #cohorts on same page
	var CFG = document.getElementById('aa-cohorts') || { dataset: {} };
	var D = CFG.dataset || {};
	var TITLE = D.title || 'SAFe Live Virtual Class';
	var PRICE_HTML = D.strike ? ('<s>$'+D.strike+'</s> $'+(D.price||'')) : ('$'+(D.price||''));
	var CLASS_DAYS = D.days ? D.days.split(',').map(Number) : [1,2,4];
	var LEN = parseInt(D.length || '2', 10);
	if(!LEN || LEN < 1) LEN = 2;
	var TRIGGERS = ['eb-trigger','eb-trigger-2','eb-trigger-3'];
	var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var MONF = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	var WD = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

	// ==================== HELPERS ====================
	function $(id){ return document.getElementById(id); }
	function esc(s){ var x = document.createElement('div'); x.textContent = s || ''; return x.innerHTML; }

	// ==================== COHORT COMPUTATION ====================
	function computed(n){
		var out = [];
		var base = new Date();
		base.setHours(0,0,0,0);
		var s = 1;
		while(160 > s && n > out.length){
			var d = new Date(base.getTime() + s * 86400000);
			if(CLASS_DAYS.indexOf(d.getDay()) >= 0){
				out.push({
					mon: MON[d.getMonth()],
					day: String(d.getDate()),
					dow: d.getDay(),
					title: TITLE,
					when: WD[d.getDay()] + ', ' + d.getDate() + ' ' + MONF[d.getMonth()] + ', 09:00 ET',
					href: '#enroll'
				});
			}
			s++;
		}
		return out;
	}

	function scraped(){
		var rows = document.querySelectorAll('.wpea_frontend_archive .archive-event');
		var out = [], seen = {};
		var today = new Date(); today.setHours(0,0,0,0);
		var i = 0;
		while(rows.length > i){
			var ev = rows[i];
			var mEl = ev.querySelector('.event_date .month');
			var dEl = ev.querySelector('.event_date .date');
			if(mEl && dEl){
				var tEl = ev.querySelector('.event_title');
				var aEl = ev.querySelector('a.wpea-text-deco');
				var wEl = ev.querySelector('.widget_event_sdate');
				var mTxt = (mEl.textContent||'').trim().slice(0,3).toLowerCase();
				var mi = -1;
				for(var k=0; MON.length > k; k++){
					if(MON[k].toLowerCase() === mTxt){ mi = k; break; }
				}
				var dayN = parseInt((dEl.textContent||'').replace(/[^0-9]/g,''),10);
				if(mi >= 0 && dayN){
					var dt = new Date(today.getFullYear(), mi, dayN);
					if(today > dt){
						var nx = new Date(today.getFullYear()+1, mi, dayN);
						if(75 >= (nx - today) / 86400000){ dt = nx; }
						else { dt = null; }
					}
					if(dt){
						var key = mi + '-' + dayN;
						if(!seen[key]){
							seen[key] = 1;
							var ww = (wEl ? wEl.textContent : '').trim().split(/[,\s]+/)[0];
							var dw = WD.indexOf(ww);
							out.push({
								_dt: dt,
								dow: dw >= 0 ? dw : dt.getDay(),
								mon: MON[mi],
								day: String(dayN),
								title: tEl ? (tEl.textContent||'').trim() : TITLE,
								when: wEl ? (wEl.textContent||'').replace(/\s+/g,' ').replace(/^\s*[^0-9A-Za-z]+\s*/,'').trim() : '',
								href: aEl ? aEl.getAttribute('href') : '#enroll'
							});
						}
					}
				}
			}
			i++;
		}
		out.sort(function(a,b){ return a._dt - b._dt; });
		return out;
	}

	function getItems(){
		var x = scraped();
		if(!x.length) x = computed(6);
		return x;
	}

	// ==================== HEADER OFFSET ====================
	function setHeaderOffset(){
		var sels = ['#ast-fixed-header','.ast-header-sticked','#masthead','header#masthead','.site-header','.ast-header-wrap','.site-header-wrap','#header','header[role="banner"]','header'];
		var off = 0, hz = null;
		for(var i=0; sels.length > i; i++){
			var el = document.querySelector(sels[i]);
			if(!el) continue;
			var cs = getComputedStyle(el);
			var h = el.getBoundingClientRect().height;
			var isFixed = cs.position === 'fixed' || cs.position === 'sticky';
			if(isFixed && h > 0){
				off = Math.round(h);
				var z = parseInt(cs.zIndex, 10);
				if(!isNaN(z)) hz = z;
				break;
			}
		}
		document.documentElement.style.setProperty('--aa-top', off + 'px');
		var bar = document.querySelector('.aa-rd .aa-coursebar');
		if(bar && hz !== null){ bar.style.zIndex = String(Math.max(1, hz - 1)); }
	}

	var _offTick = false;
	function onScrollOffset(){
		if(!_offTick){
			_offTick = true;
			requestAnimationFrame(function(){ setHeaderOffset(); _offTick = false; });
		}
	}

	// ==================== HERO UPCOMING ====================
	function heroUpcoming(items){
		if(!items.length) return;
		var nx = $('aa-next');
		if(nx) nx.textContent = items[0].mon + ' ' + items[0].day;
		var host = $('aa-upcoming');
		if(!host) return;
		var top = items.slice(0, 4);
		var html = '<div class="aa-up-h">Upcoming classes</div>';
		var k = 0;
		while(top.length > k){
			var it = top[k];
			var ext = it.href ? it.href.charAt(0) !== '#' : false;
			var o = it.href ? ('<a href="'+esc(it.href)+'"'+(ext?' target="_blank" rel="noopener"':'')+' ') : '<div ';
			var c = it.href ? '</a>' : '</div>';
			html += o + 'class="aa-up-row">' +
				'<span class="aa-up-chip"><span class="aa-up-mon">'+esc(it.mon)+'</span><span class="aa-up-day">'+esc(it.day)+'</span></span>' +
				'<span class="aa-up-meta"><span class="aa-up-title">'+esc(it.title)+'</span><span class="aa-up-when">'+esc(it.when)+'</span></span>' + c;
			k++;
		}
		host.innerHTML = html;
		host.style.display = 'block';
	}

	// ==================== COHORT SELECT AUTO-FILL ====================
	function cohortSelects(){
		var q = '.fluentform select, .frm-fluent-form select, form[data-form_id] select, .fluentform input[type=text], .frm-fluent-form input[type=text], form[data-form_id] input[type=text]';
		var sels = document.querySelectorAll(q);
		var out = [];
		for(var i=0; sels.length > i; i++){ out.push(sels[i]); }
		return out;
	}

	function fieldLabel(el){
		var lbl = '';
		if(el.id){
			var lab = document.querySelector('label[for="'+el.id+'"]');
			if(lab) lbl = lab.textContent || '';
		}
		if(!lbl){
			var p = el.closest && el.closest('.ff-el-input--label,.ff-el-form-control,.ff-el-input,div[class*="input"]');
			if(p){ var l2 = p.querySelector('label'); if(l2) lbl = l2.textContent || ''; }
		}
		return lbl;
	}

	function isCohortSelect(sel){
		var meta = (sel.name||'') + ' ' + (sel.id||'') + ' ' + (sel.getAttribute('placeholder')||'') + ' ' + (sel.getAttribute('aria-label')||'') + ' ' + fieldLabel(sel);
		if(/location|venue|city|address|where/i.test(meta)) return false;
		if(/cohort|date|class|session|batch|when/i.test(meta)) return true;
		if(sel.tagName === 'SELECT'){
			var opts = Array.prototype.slice.call(sel.options||[]);
			var hit = opts.some(function(o){ return /cohort|—|safe|live|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\s/i.test((o.textContent||'')); });
			if(hit) return true;
		}
		return false;
	}

	function fillCohorts(items){
		if(!items.length) return;
		var labels = items.map(function(it){ return it.mon + ' ' + it.day + (it.when ? (' — ' + it.when) : ''); });
		Array.prototype.forEach.call(cohortSelects(), function(sel){
			if(!isCohortSelect(sel)) return;
			if(sel.tagName !== 'SELECT') return;
			var opts = Array.prototype.slice.call(sel.options||[]);
			var ph = (opts[0] && (opts[0].value === '' || /select|choose/i.test(opts[0].textContent||''))) ? opts[0].cloneNode(true) : null;
			sel.innerHTML = '';
			if(ph) sel.appendChild(ph);
			labels.forEach(function(l){
				var o = document.createElement('option');
				o.value = l; o.textContent = l;
				sel.appendChild(o);
			});
		});
		var radios = document.querySelectorAll('.fluentform input[type=radio], .frm-fluent-form input[type=radio]');
		var idx = 0;
		Array.prototype.forEach.call(radios, function(r){
			var lab = (r.closest && r.closest('label')) || (r.id ? document.querySelector('label[for="'+r.id+'"]') : null);
			var txt = lab ? (lab.textContent||'').trim() : (r.value||'');
			if(!/cohort/i.test(txt)) return;
			var wrap = (r.closest && (r.closest('.ff-el-form-check') || r.closest('label'))) || r.parentNode;
			if(idx >= labels.length){ if(wrap) wrap.style.display = 'none'; return; }
			r.value = labels[idx];
			if(lab){
				var span = lab.querySelector('span');
				if(span){ span.textContent = ' ' + labels[idx]; }
				else {
					for(var n=0; lab.childNodes.length > n; n++){
						var cn = lab.childNodes[n];
						if(cn.nodeType === 3 && cn.textContent.trim()){ cn.textContent = ' ' + labels[idx]; break; }
					}
				}
			}
			idx++;
		});
	}

	function selectCohort(label){
		Array.prototype.forEach.call(cohortSelects(), function(sel){
			if(!isCohortSelect(sel)) return;
			if(sel.tagName === 'SELECT'){
				var found = false;
				for(var i=0; sel.options.length > i; i++){
					if(sel.options[i].textContent.trim() === label){
						sel.selectedIndex = i; found = true; break;
					}
				}
				if(!found){
					var o = document.createElement('option');
					o.value = label; o.textContent = label;
					sel.appendChild(o); sel.value = label;
				}
			} else {
				sel.value = label;
			}
			try {
				sel.dispatchEvent(new Event('change', {bubbles:true}));
				sel.dispatchEvent(new Event('input', {bubbles:true}));
			} catch(e){}
		});
		var radios = document.querySelectorAll('.fluentform input[type=radio], .frm-fluent-form input[type=radio]');
		Array.prototype.forEach.call(radios, function(r){
			var lab = (r.closest && r.closest('label')) || (r.id ? document.querySelector('label[for="'+r.id+'"]') : null);
			var txt = lab ? (lab.textContent||'').trim() : '';
			if(txt === label){
				r.checked = true;
				try { r.dispatchEvent(new Event('change', {bubbles:true})); } catch(e){}
			}
		});
	}

	// ==================== REGISTRATION ====================
	function openReg(){
		var reg = $('aa-reg');
		if(!reg) return;
		reg.classList.add('is-open');
		try { window.dispatchEvent(new Event('resize')); } catch(e){}
		setTimeout(function(){
			try { window.dispatchEvent(new Event('resize')); } catch(e){}
			reg.scrollIntoView({behavior:'smooth', block:'start'});
		}, 120);
	}

	function batchLabel(dow){
		var i, days = [];
		for(i=0; LEN > i; i++) days.push((dow + i) % 7);
		var hasWe = days.indexOf(0) >= 0 || days.indexOf(6) >= 0;
		var hasWd = false;
		for(i=0; days.length > i; i++){ if(days[i] >= 1 && 5 >= days[i]){ hasWd = true; break; } }
		var suffix = (hasWe && hasWd) ? '' : (hasWe ? ' · Weekend Batch' : ' · Weekday Batch');
		if(1 >= LEN) return WD[dow] + suffix;
		var end = (dow + LEN - 1) % 7;
		return WD[dow] + '–' + WD[end] + suffix;
	}

	function buildPick(items){
		var host = $('aa-pick');
		if(!host) return;
		if(!items.length){
			host.style.display = 'none';
			var r0 = $('aa-reg');
			if(r0) r0.classList.add('is-open');
			return;
		}
		var html = '<div class="aa-pick-h">Select your class to register</div><div class="aa-pick-list">';
		for(var k=0; items.length > k; k++){
			var it = items[k];
			var dow = it.dow != null ? it.dow : 6;
			var status = k === 0 ? '<span class="aa-pick-tag hot">FAST FILLING</span>' : '<span class="aa-pick-tag">SEATS OPEN</span>';
			html += '<button type="button" class="aa-pick-row" data-label="'+esc(it.mon+' '+it.day+(it.when?(' — '+it.when):''))+'">' +
				'<span class="aa-pick-date"><span class="aa-pick-mon">'+esc(it.mon)+'</span><span class="aa-pick-day">'+esc(it.day)+'</span></span>' +
				'<span class="aa-pick-info"><span class="aa-pick-batch">'+esc(batchLabel(dow))+'</span><span class="aa-pick-fmt">ONLINE CLASSROOM · ENGLISH</span></span>' +
				status +
				'<span class="aa-pick-price">' + PRICE_HTML + '</span>' +
				'<span class="aa-pick-cta">Enroll &#10230;</span>' +
				'</button>';
		}
		html += '</div><p class="aa-pick-note">Can’t find a date that works? <a href="mailto:info@agile-agilist.com?subject=Talk%20to%20an%20Advisor">Book a call &#10230;</a></p>';
		host.innerHTML = html;
		var rows = host.querySelectorAll('.aa-pick-row');
		Array.prototype.forEach.call(rows, function(r){
			r.addEventListener('click', function(){
				Array.prototype.forEach.call(rows, function(x){ x.classList.remove('is-sel'); });
				r.classList.add('is-sel');
				var lab = r.getAttribute('data-label');
				selectCohort(lab);
				var reg = $('aa-reg');
				if(reg && r.parentNode){ r.parentNode.insertBefore(reg, r.nextSibling); }
				openReg();
				setTimeout(function(){ fillCohorts(getItems()); selectCohort(lab); }, 350);
				setTimeout(function(){ fillCohorts(getItems()); selectCohort(lab); }, 900);
			});
		});
	}

	function buildCohorts(items){
		var host = $('aa-cohorts');
		if(!host) return;
		items = items.slice(0, 5);
		var html = '';
		for(var i=0; items.length > i; i++){
			var it = items[i];
			var mf = MONF[MON.indexOf(it.mon)] || it.mon;
			var dw = it.dow != null ? WD[it.dow] : '';
			var lbl = it.mon + ' ' + it.day + (it.when ? (' — ' + it.when) : '');
			var shrt = it.mon + ' ' + it.day;
			var tag = i === 0 ? '<span class="aa-co-tag hot">FAST FILLING</span>' : (i === 3 ? '<span class="aa-co-tag">FEW SEATS</span>' : '');
			html += '<label class="aa-co-row'+(i===0?' is-sel':'')+'" data-label="'+esc(lbl)+'" data-short="'+esc(shrt)+'">' +
				'<input type="radio" name="aa-co"'+(i===0?' checked':'')+'>' +
				'<span class="aa-co-main"><span class="aa-co-date">'+esc((dw?dw+', ':'')+it.day+' '+mf)+'</span><span class="aa-co-time">09:00–17:00 ET</span></span>' +
				tag + '</label>';
		}
		host.innerHTML = html;
		var rows = host.querySelectorAll('.aa-co-row');
		function choose(row){
			Array.prototype.forEach.call(rows, function(x){
				x.classList.remove('is-sel');
				var ip = x.querySelector('input');
				if(ip) ip.checked = false;
			});
			row.classList.add('is-sel');
			var ip = row.querySelector('input');
			if(ip) ip.checked = true;
			var reg = $('aa-register');
			if(reg) reg.innerHTML = 'Register for ' + esc(row.getAttribute('data-short')) + ' &#10230;';
			selectCohort(row.getAttribute('data-label'));
		}
		Array.prototype.forEach.call(rows, function(row){
			row.addEventListener('click', function(){ choose(row); });
		});
		if(rows[0]) choose(rows[0]);
		var reg = $('aa-register');
		if(reg){ reg.addEventListener('click', function(e){ e.preventDefault(); openReg(); }); }
	}

	// ==================== EVENTBRITE ====================
	function wireEB(){
		TRIGGERS.forEach(function(id){
			var el = $(id);
			if(!el) return;
			el.addEventListener('click', function(e){
				e.preventDefault();
				e.stopPropagation();
				var target = document.getElementById('cohorts');
				if(target && target.scrollIntoView){ target.scrollIntoView({behavior:'smooth', block:'start'}); }
			});
		});
	}

	// Also catch any dynamic eb-trigger button via delegation — scroll to #cohorts on same page
	document.addEventListener('click', function(e){
		var t = e.target && e.target.closest ? e.target.closest('#eb-trigger, #eb-trigger-2, #eb-trigger-3, [id^="eb-trigger"]') : null;
		if(!t) return;
		e.preventDefault();
		e.stopPropagation();
		var target = document.getElementById('cohorts');
		if(target && target.scrollIntoView){ target.scrollIntoView({behavior:'smooth', block:'start'}); }
	}, true);

	// ==================== BACK TO TOP ====================
	function backToTop(){
		if(document.getElementById('aa-totop')) return;
		var b = document.createElement('a');
		b.id = 'aa-totop';
		b.href = '#top';
		b.setAttribute('aria-label','Back to top');
		b.innerHTML = '↑';
		b.style.cssText = 'position:fixed;bottom:24px;left:24px;width:46px;height:46px;border-radius:50%;background:#0B2E35;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;text-decoration:none;z-index:2147483000;opacity:0;pointer-events:none;transition:opacity .25s;box-shadow:0 8px 20px -6px rgba(8,37,43,.55)';
		b.addEventListener('click', function(e){
			e.preventDefault();
			var t = document.getElementById('top');
			if(t) t.scrollIntoView({behavior:'smooth', block:'start'});
			window.scrollTo({top:0, behavior:'smooth'});
		});
		document.body.appendChild(b);
		function tog(){
			var on = 300 < window.pageYOffset;
			b.style.opacity = on ? '1' : '0';
			b.style.pointerEvents = on ? 'auto' : 'none';
		}
		window.addEventListener('scroll', tog, {passive:true});
		tog();
	}

	// ==================== CURRENCY LOCALIZATION ====================
	var CURRENCY = {
		GB:{sym:'£',rate:0.79,code:'GBP'},
		EU:{sym:'€',rate:0.93,code:'EUR'},
		AE:{sym:'AED ',rate:3.67,code:'AED'},
		SA:{sym:'SAR ',rate:3.75,code:'SAR'},
		ZA:{sym:'R',rate:18.5,code:'ZAR'},
		CA:{sym:'C$',rate:1.36,code:'CAD'},
		AU:{sym:'A$',rate:1.52,code:'AUD'},
		NZ:{sym:'NZ$',rate:1.65,code:'NZD'},
		SG:{sym:'S$',rate:1.34,code:'SGD'},
		CH:{sym:'CHF ',rate:0.88,code:'CHF'},
		JP:{sym:'¥',rate:155,code:'JPY'},
		IN:{sym:'₹',rate:83,code:'INR'},
		BR:{sym:'R$',rate:5.0,code:'BRL'},
		MX:{sym:'MX$',rate:17.0,code:'MXN'}
	};
	var ME_COUNTRIES = ['AE','SA','KW','QA','BH','OM','JO','LB','EG'];
	var EU_COUNTRIES = ['DE','FR','IT','ES','NL','BE','AT','DK','SE','FI','IE','PT','GR','LU','PL','CZ','HU','RO','SK','SI','HR','BG','EE','LV','LT','MT','CY'];

	function walkReplace(node, find, replace){
		if(!node || !find) return;
		if(node.nodeType === 3){
			if(node.nodeValue.indexOf(find) >= 0){
				node.nodeValue = node.nodeValue.split(find).join(replace);
			}
		} else if(node.nodeType === 1 && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE'){
			for(var c = node.firstChild; c; c = c.nextSibling){ walkReplace(c, find, replace); }
		}
	}

	function localizePrices(){
		var card = document.getElementById('aa-cohorts');
		if(!card) return;
		var basePrice = (card.dataset.price||'').replace(/,/g,'');
		var baseStrike = (card.dataset.strike||'').replace(/,/g,'');
		if(!basePrice) return;
		var cached = null;
		try { cached = sessionStorage.getItem('aa-country'); } catch(e){}
		var apply = function(cc){
			var region = EU_COUNTRIES.indexOf(cc) >= 0 ? 'EU' : (ME_COUNTRIES.indexOf(cc) >= 0 ? 'ME' : cc);
			var basePriceLocal = basePrice;
			var baseStrikeLocal = baseStrike;
			if(region === 'ME' && card.dataset.priceMe){ basePriceLocal = card.dataset.priceMe.replace(/,/g,''); }
			if(region === 'ME' && card.dataset.strikeMe){ baseStrikeLocal = card.dataset.strikeMe.replace(/,/g,''); }
			if(region === 'EU' && card.dataset.priceEu){ basePriceLocal = card.dataset.priceEu.replace(/,/g,''); }
			var cur = CURRENCY[region];
			if(!cur && basePriceLocal === basePrice) return;
			var usdP = parseInt(basePriceLocal, 10);
			var usdS = baseStrikeLocal ? parseInt(baseStrikeLocal, 10) : null;
			var pageUsdP = parseInt(basePrice, 10);
			var pageUsdS = baseStrike ? parseInt(baseStrike, 10) : null;
			var rate = cur ? cur.rate : 1;
			var locP = Math.round(usdP * rate);
			var locS = usdS ? Math.round(usdS * rate) : null;
			var sym = cur ? cur.sym : '$';
			var code = cur ? cur.code : 'USD';
			var fmt = function(n){ return sym + n.toLocaleString('en-US'); };
			var usdPstr = '$' + pageUsdP.toLocaleString('en-US');
			var usdSstr = pageUsdS ? '$' + pageUsdS.toLocaleString('en-US') : null;
			var roots = document.querySelectorAll('.aa-rd');
			for(var i=0; roots.length > i; i++){
				if(usdSstr) walkReplace(roots[i], usdSstr, fmt(locS));
				walkReplace(roots[i], usdPstr, fmt(locP));
				walkReplace(roots[i], 'USD', code);
			}
			var t = document.createElement('div');
			t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:rgba(11,46,53,.92);color:#fff;padding:8px 14px;border-radius:20px;font-size:11px;letter-spacing:.04em;text-transform:uppercase;z-index:9999;opacity:0;transition:opacity .4s';
			t.textContent = 'Pricing in ' + code;
			document.body.appendChild(t);
			setTimeout(function(){ t.style.opacity = '1'; }, 10);
			setTimeout(function(){ t.style.opacity = '0'; setTimeout(function(){ t.remove(); }, 500); }, 3500);
		};
		if(cached){ apply(cached); return; }
		try {
			fetch('https://ipapi.co/json/').then(function(r){ return r.json(); }).then(function(d){
				if(d && d.country_code){
					try { sessionStorage.setItem('aa-country', d.country_code); } catch(e){}
					apply(d.country_code);
				}
			}).catch(function(){});
		} catch(e){}
	}

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
		var oldM = wrap.querySelector('.ls-more'); if(oldM) oldM.parentNode.removeChild(oldM);
		var oldP = wrap.querySelector('.ls-prev'); if(oldP) oldP.parentNode.removeChild(oldP);
		function page(){ return Math.max(220, rail.clientWidth - 40); }   // advance a full visible page of dates
		var prev = document.createElement('button');
		prev.type = 'button';
		prev.className = 'ls-prev';
		prev.setAttribute('aria-label','Earlier dates');
		prev.innerHTML = '<span aria-hidden="true">←</span>';
		prev.addEventListener('click', function(){ rail.scrollBy({ left: -page(), behavior: 'smooth' }); });
		var more = document.createElement('button');
		more.type = 'button';
		more.className = 'ls-more';
		more.setAttribute('aria-label','See more dates');
		more.innerHTML = 'More dates <span aria-hidden="true">→</span>';
		more.addEventListener('click', function(){ rail.scrollBy({ left: page(), behavior: 'smooth' }); });
		wrap.appendChild(prev);
		wrap.appendChild(more);
		function syncArrows(){
			var maxScroll = rail.scrollWidth - rail.clientWidth;
			more.style.display = (maxScroll > 8 && rail.scrollLeft < maxScroll - 4) ? '' : 'none';
			prev.style.display = (rail.scrollLeft > 4) ? '' : 'none';
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

	// ==================== INIT ====================
	function init(){
		var ITEMS = getItems();
		function T(f){ try { f(); } catch(e){} }
		T(setHeaderOffset);
		T(function(){ heroUpcoming(ITEMS); });
		T(function(){ fillCohorts(ITEMS); });
		T(function(){ buildCohorts(ITEMS); });
		T(function(){ buildPick(ITEMS); });
		T(function(){ buildRail(ITEMS); });
		T(wireEB);
		T(backToTop);
		T(localizePrices);
		window.addEventListener('resize', setHeaderOffset);
		window.addEventListener('load', function(){
			setHeaderOffset();
			fillCohorts(getItems());
		});
		var ft = 0;
		var fi = setInterval(function(){
			fillCohorts(getItems());
			ft++;
			if(ft >= 8) clearInterval(fi);
		}, 700);
		window.addEventListener('scroll', onScrollOffset, {passive:true});
	}

	if(document.readyState !== 'loading'){ init(); }
	else { document.addEventListener('DOMContentLoaded', init); }
})();
