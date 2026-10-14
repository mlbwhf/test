/* Two Chasms — assessment engine (tc-engine).
   One engine, many assessments. An assessment is DATA: dimensions, questions, a scale, bands and
   a reader name. Every string the visitor can see is looked up by KEY in a strings table, so a
   translated page swaps the table and nothing else.

   Mount (per page):
     <div data-tc-mount data-tc-assessment="maturity"></div>
     <script type="application/json" class="tc-config">{ ...assessment config... }<\/script>
     <script type="application/json" class="tc-strings">{ "ui.start": "Start the assessment →", ... }<\/script>
   Several .tc-strings blocks merge in order (base English first, then a translation).
   A missing key renders as [key] so untranslated strings are visible, never silent.

   Readers (result logic):
     "placement" — the five-state placement: holding-through / operating-at / stuck-in-chasm,
                   plus an optional reverse-scored "red" group (the Seven Stagnation Signals).
     "levels"    — maturity: each dimension scored 0–100 and banded into levels; overall = mean.

   Lead capture: HubSpot Forms API, fire-and-forget. email + firstname only; the reading rides
   in context.pageName. Portal/form ids are public browser-facing values, not secrets. */
(function () {
  'use strict';
  var mount = document.querySelector('[data-tc-mount]');
  if (!mount) return;

  /* ------------------------------------------------------------ config + strings */
  function readJSON(sel) {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (s) {
      /* plain JSON, or base64 (data-enc="base64") for a payload that must survive a CMS paste */
      var txt = s.textContent.trim();
      if (s.getAttribute('data-enc') === 'base64') { try { txt = new TextDecoder().decode(Uint8Array.from(atob(txt), function (c) { return c.charCodeAt(0); })); } catch (e) { txt = '{}'; } }
      try { out.push(JSON.parse(txt)); } catch (e) { out.push({}); }
    });
    return out;
  }
  var CFG = readJSON('script.tc-config')[0];
  if (!CFG) return;
  var STR = {};
  readJSON('script.tc-strings').forEach(function (tbl) { for (var k in tbl) STR[k] = tbl[k]; });

  function t(key, vars) {
    var s = Object.prototype.hasOwnProperty.call(STR, key) ? STR[key] : '[' + key + ']';
    if (vars) for (var v in vars) s = s.split('{' + v + '}').join(vars[v]);
    return s;
  }

  var A = CFG.id;                              /* assessment id, used in string keys */
  var DIMS = CFG.dimensions;                   /* [{id, amber?, ws:[labelKey, href]}] */
  var Q = [];                                  /* flat question list: {d, id, group} */
  DIMS.forEach(function (d, di) { d.questions.forEach(function (q) { Q.push({ d: di, id: q, group: 'main' }); }); });
  var RED = CFG.red || null;                   /* optional reverse-scored group */
  if (RED) RED.questions.forEach(function (q) { Q.push({ d: -1, id: q, group: 'red' }); });
  var TOTAL = Q.length;
  var SCALES = CFG.scales;                     /* {main:[[value,labelKey]...], red:[...]} values null = N/A */
  var PERSP = CFG.perspectives || ['self', 'team', 'unit', 'org'];

  /* ------------------------------------------------------------ DOM */
  function h(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'hidden') e.hidden = !!attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function em2(key) {   /* "First clause. {em}" -> text + <em> */
    var a = t(key), b = t(key + '.em');
    return [a + ' ', h('em', { text: b })];
  }

  mount.classList.add('as', 'wrap');
  mount.hidden = true;
  var stages = {};
  function stage(name, kids) { var s = h('div', { 'class': 'as__stage', 'data-stage': name }, kids); stages[name] = s; mount.appendChild(s); return s; }

  /* perspective */
  var perspBox = h('div', { 'class': 'as__opts' });
  stage('perspective', [
    h('span', { 'class': 'kicker', text: t('ui.persp.kicker') }),
    h('h2', null, em2('ui.persp.title')),
    h('p', { 'class': 'lead lead--wide', text: t('ui.persp.lead') }),
    perspBox
  ]);
  /* quiz */
  var qState = h('div', { 'class': 'as__state' }), qDef = h('p'), qNum = h('div', { 'class': 'label' }),
      qText = h('p', { 'class': 'as__q' }), qProbe = h('p', { 'class': 'as__probe' }), qOpts = h('div', { 'class': 'as__scale' }),
      qProg = h('i'), qBack = h('button', { type: 'button', 'class': 'link-mono as__back', text: t('ui.back') }),
      qHead = h('div', { 'class': 'as__head' }, [qState, qDef]);
  stage('quiz', [qHead, qNum, qText, qProbe, qOpts, h('div', { 'class': 'as__prog' }, [qProg]), h('div', { 'class': 'actions as__nav' }, [qBack])]);
  /* gate */
  var gName = h('input', { 'class': 'as__field', type: 'text', placeholder: t('ui.gate.name'), autocomplete: 'given-name' }),
      gMail = h('input', { 'class': 'as__field', type: 'email', placeholder: t('ui.gate.email'), autocomplete: 'email' }),
      gGo = h('button', { 'class': 'btn btn--ink', type: 'button', text: t('ui.gate.go') });
  stage('gate', [h('div', { 'class': 'as__gate' }, [
    h('span', { 'class': 'kicker', text: t('ui.gate.kicker') }),
    h('h2', null, em2('ui.gate.title')),
    h('p', { text: t('ui.gate.body') }), gName, gMail, gGo,
    h('p', { 'class': 'as__fine', text: t('ui.gate.fine') })
  ])]);
  /* result */
  var rHead = h('h2'), rRead = h('p', { 'class': 'lead lead--wide' }), rBars = h('div', { 'class': 'as__bars' }), rExtra = h('div', { 'class': 'as__red' }),
      rWs = h('a', { 'class': 'btn btn--amber', href: '#' }), rNext = h('a', { 'class': 'link-mono', href: '#' }),
      rRedo = h('button', { type: 'button', 'class': 'as__redo', text: t('ui.result.retake') }),
      rCard = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      rShare = h('a', { 'class': 'link-mono', target: '_blank', rel: 'noopener', href: '#', text: t('ui.result.share') });
  rCard.setAttribute('class', 'share'); rCard.setAttribute('viewBox', '0 0 1080 1080'); rCard.setAttribute('role', 'img');
  var cardFig = h('figure', { 'class': 'as__card' }); cardFig.appendChild(rCard); cardFig.appendChild(h('figcaption', null, [rShare]));
  stage('result', [h('div', { 'class': 'as__result' }, [
    h('div', { 'class': 'stack' }, [
      h('span', { 'class': 'kicker', text: t('ui.result.kicker') }), rHead, rRead, rBars, rExtra,
      h('div', { 'class': 'actions' }, [rWs, rNext]),
      h('p', { 'class': 'as__fine' }, [t('ui.result.fine') + ' ', rRedo])
    ]), cardFig])]);

  function show(name) {
    for (var k in stages) stages[k].classList.toggle('is-on', k === name);
    mount.hidden = false;
    Array.prototype.forEach.call(document.querySelectorAll('[data-tc-intro]'), function (el) { el.hidden = true; });
    mount.scrollIntoView({ block: 'start' });
  }

  /* ------------------------------------------------------------ flow */
  var idx = 0, ans = [], persp = '';
  function opt(label, tick, onClick) {
    var b = h('button', { type: 'button', 'class': 'as__opt' }, [tick !== undefined ? h('span', { 'class': 'as__tick', text: tick }) : null, h('span', { text: label })]);
    b.addEventListener('click', onClick);
    return b;
  }
  function renderPersp() {
    perspBox.innerHTML = '';
    PERSP.forEach(function (p) { perspBox.appendChild(opt(t('ui.persp.' + p), undefined, function () { persp = p; idx = 0; show('quiz'); render(); })); });
  }
  function render() {
    var q = Q[idx], red = q.group === 'red';
    qHead.classList.toggle('is-red', red);
    if (!red) {
      var d = DIMS[q.d];
      qState.textContent = t('ui.q.dim', { n: String(q.d + 1).replace(/^(\d)$/, '0$1'), name: t('dim.' + d.id + '.name'), sub: t('dim.' + d.id + '.sub') });
      qState.classList.toggle('is-amber', !!d.amber);
      qDef.textContent = t('dim.' + d.id + '.def');
      qProbe.textContent = t('p.' + A + '.' + q.id);
    } else {
      var k = idx - (TOTAL - RED.questions.length);
      qState.textContent = t('ui.q.red', { n: k + 1, total: RED.questions.length, name: t('red.' + A + '.' + q.id + '.name') });
      qState.classList.add('is-amber');
      qDef.textContent = t('red.' + A + '.def');
      qProbe.textContent = t('red.' + A + '.probe');
    }
    qText.textContent = t('q.' + A + '.' + q.id);
    qNum.textContent = t('ui.q.counter', { n: idx + 1, total: TOTAL });
    qOpts.innerHTML = '';
    SCALES[red ? 'red' : 'main'].forEach(function (sc) {
      var val = sc[0], b = opt(t(sc[1]), val === null ? '–' : String(val), function () {
        ans[idx] = val; idx++;
        if (idx < TOTAL) render(); else show('gate');
      });
      if (ans[idx] !== undefined && ans[idx] === val) b.classList.add('is-picked');
      qOpts.appendChild(b);
    });
    qBack.hidden = idx === 0;
    qProg.style.width = (idx / TOTAL * 100) + '%';
  }

  /* dimension score = mean of answered items / max, as a percentage; N/A excluded */
  function dimScores() {
    var max = CFG.scaleMax, sum = DIMS.map(function () { return 0; }), n = DIMS.map(function () { return 0; });
    Q.forEach(function (q, i) { if (q.group === 'main' && ans[i] !== null && ans[i] !== undefined) { sum[q.d] += ans[i]; n[q.d]++; } });
    return sum.map(function (v, i) { return n[i] ? Math.round(v / (n[i] * max) * 100) : 0; });
  }
  function redScore() {
    if (!RED) return null;
    var max = RED.scaleMax, sum = 0, n = 0, lit = [];
    Q.forEach(function (q, i) {
      if (q.group !== 'red' || ans[i] === null || ans[i] === undefined) return;
      sum += ans[i]; n++;
      if (ans[i] >= RED.litAt) lit.push(t('red.' + A + '.' + q.id + '.name'));
    });
    if (!n) return null;
    var total = Math.round(sum / n * RED.questions.length), outOf = RED.questions.length * max, band = RED.bands[RED.bands.length - 1][1];
    for (var i = 0; i < RED.bands.length; i++) { if (total <= RED.bands[i][0]) { band = RED.bands[i][1]; break; } }
    return { total: total, outOf: outOf, band: t('red.' + A + '.band.' + band), lit: lit };
  }
  function bandOf(bands, v) {           /* bands: [[upper, id], ...] ascending */
    for (var i = 0; i < bands.length; i++) if (v <= bands[i][0]) return bands[i][1];
    return bands[bands.length - 1][1];
  }
  function dname(i) { return t('dim.' + DIMS[i].id + '.name'); }

  /* ------------------------------------------------------------ readers */
  var READERS = {
    placement: function (ls) {
      var P = CFG.reader, wave = 0, i;
      for (i = 0; i < ls.length; i++) { if (ls[i] >= P.holdAt) wave = i + 1; else break; }
      var hi = 0; ls.forEach(function (v, i) { if (v >= P.triedAt) hi = i + 1; });
      var weak = wave < ls.length ? wave : -1, at = Math.max(hi, wave, 1) - 1;
      var r = { ls: ls, wave: wave, weak: weak, at: at, bars: [], pos: at, red: redScore() };
      var k = 'read.' + A + '.', v = { at: at >= 0 ? dname(at) : '', weak: weak >= 0 ? dname(weak) : '', weakSub: weak >= 0 ? t('dim.' + DIMS[weak].id + '.sub') : '',
                                      holding: ls.slice(0, wave).map(function (_, j) { return dname(j); }).join(', ') };
      var stuck = null;
      if (wave === ls.length) { r.head = [t(k + 'all.head'), t(k + 'all.head.em')]; r.read = t(k + 'all.body'); r.card = [t(k + 'all.card'), t(k + 'all.card.em')]; r.pos = ls.length - 1; r.landed = true; }
      else if (wave === 0) { r.head = [t(k + 'floor.head'), t(k + 'floor.head.em')]; r.read = t(k + 'floor.body', v); r.card = [t(k + 'floor.card'), t(k + 'floor.card.em', v)]; r.pos = 0; }
      else if (hi > wave + 1) {
        stuck = DIMS[weak].chasm || null;            /* "one" | "two" when the weak state is a crossing */
        r.head = [t(k + 'gap.head', v), t(k + 'gap.head.em', v)];
        r.read = t(k + 'gap.body', v) + ' ' + (stuck ? t(k + 'gap.stuck', { chasm: t('ui.chasm.' + stuck) }) : '') + ' ' + t(k + 'gap.tail');
        r.card = stuck ? [t(k + 'gap.card.stuck', { chasm: t('ui.chasm.' + stuck) }), t(k + 'gap.card.em', v)] : [t(k + 'gap.card', v), t(k + 'gap.card2.em')];
        r.stuck = stuck;
      } else {
        r.head = [t(k + 'next.head', { at: dname(wave - 1) }), t(k + 'next.head.em', v)];
        r.read = t(k + 'next.body', v); r.pos = wave - 1;
        var down = wave >= 4 ? 'two' : wave >= 2 ? 'one' : 'edge';
        r.card = [t(k + 'next.card.' + down), t(k + 'next.card.em', v)];
      }
      r.bars = ls.map(function (s, i) { return { label: dname(i), sub: t('dim.' + DIMS[i].id + '.sub'), value: s, cls: (i === weak ? ' is-weak' : '') + (i < wave ? ' is-hold' : '') }; });
      var target = wave === ls.length ? DIMS[ls.length - 1] : DIMS[weak];
      if (r.red && r.red.total >= P.redReflexAt && wave >= 1) { r.read += ' ' + t(k + 'red.reflex'); target = DIMS[0]; }
      r.ws = target.ws;
      r.next = wave >= P.deepDiveAt ? ['ui.result.next.mrx', CFG.links.mrx] : ['ui.result.next.workshops', CFG.links.workshops];
      r.label = r.head.join(' ') + ' | ' + ls.map(function (s, i) { return dname(i) + ' ' + s; }).join(' · ') + (r.red ? ' | red ' + r.red.total + '/' + r.red.outOf + ' ' + r.red.band : '');
      return r;
    },
    levels: function (ls) {
      var P = CFG.reader, k = 'read.' + A + '.';
      var levels = ls.map(function (v) { return bandOf(P.bands, v); });
      var overall = Math.round(ls.reduce(function (a, b) { return a + b; }, 0) / ls.length), oLevel = bandOf(P.bands, overall);
      var weak = ls.indexOf(Math.min.apply(null, ls)), strong = ls.indexOf(Math.max.apply(null, ls));
      if (ls[weak] === ls[strong]) weak = ls.length - 1;   /* all equal: nothing is weakest; point at Mutation (keep crossing) */
      var v = { overall: overall, level: t('level.' + A + '.' + oLevel + '.name'), weak: dname(weak), weakLevel: t('level.' + A + '.' + levels[weak] + '.name'), strong: dname(strong) };
      var r = { ls: ls, weak: weak, bars: [], pos: null };
      r.head = [t(k + 'head', v), t(k + 'head.em', v)];
      r.read = t('level.' + A + '.' + oLevel + '.body') + ' ' + t(k + 'weak', v);
      r.card = [t(k + 'card', v), t(k + 'card.em', v)];
      r.bars = ls.map(function (s, i) { return { label: dname(i), sub: t('dim.' + DIMS[i].id + '.sub'), value: s, tag: t('level.' + A + '.' + levels[i] + '.name'), cls: i === weak ? ' is-weak' : (levels[i] === P.bands[P.bands.length - 1][1] ? ' is-hold' : '') }; });
      r.ws = DIMS[weak].ws;
      r.next = [overall >= P.deepDiveAt ? 'ui.result.next.mrx' : 'ui.result.next.placement', overall >= P.deepDiveAt ? CFG.links.mrx : CFG.links.placement];
      r.pos = Math.max(0, Math.min(4, Math.round(overall / 25)));   /* ball on the strip by overall score */
      r.label = r.head.join(' ') + ' | ' + ls.map(function (s, i) { return dname(i) + ' ' + s + ' ' + levels[i]; }).join(' · ');
      return r;
    }
  };

  /* ------------------------------------------------------------ share card (brand kit 6C) */
  function card(r) {
    var NS = 'http://www.w3.org/2000/svg';
    while (rCard.firstChild) rCard.removeChild(rCard.firstChild);
    function el(tag, a, txt) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (txt) e.textContent = txt; rCard.appendChild(e); return e; }
    el('rect', { width: 1080, height: 1080, fill: '#101418' });
    el('text', { 'class': 'm', x: 88, y: 130, 'font-size': 24, fill: '#9AA6B2', 'letter-spacing': 3.8 }, t('ui.card.top'));
    el('text', { 'class': 'm', x: 992, y: 130, 'font-size': 24, fill: '#9AA6B2', 'text-anchor': 'end', 'letter-spacing': 3.8 }, t('ui.card.handle'));
    el('text', { 'class': 'a', x: 84, y: 380, 'font-size': 76, 'font-weight': 900, fill: '#fff', 'letter-spacing': -2.6 }, r.card[0]);
    el('text', { 'class': 'a', x: 84, y: 470, 'font-size': 76, 'font-weight': 900, fill: '#F0A93C', 'letter-spacing': -2.6 }, r.card[1]);
    var gx = 88, gy = 860;
    [[0, 240], [342, 220], [664, 240]].forEach(function (s, i) { el('rect', { x: gx + s[0], y: gy, width: s[1], height: 24, fill: (r.landed && i === 2) ? '#F0A93C' : '#FFFFFF' }); });
    if (r.pos !== null && r.pos !== undefined) {
      var X = [gx + 130, gx + 291, gx + 452, gx + 613, gx + 774], Y = [834, 720, 834, 720, 834];
      var bx = X[r.pos], by = Y[r.pos], fill = r.landed ? '#F0A93C' : '#FFFFFF';
      if (r.stuck) { bx = r.stuck === 'one' ? gx + 291 : gx + 613; by = 905; fill = '#8C97A3'; }
      for (var tt = 0; tt < r.pos; tt += 0.125) {
        var hop = Math.floor(tt), u = tt - hop;
        el('circle', { cx: (X[hop] + (X[hop + 1] - X[hop]) * u).toFixed(1), cy: (Y[hop] + (Y[hop + 1] - Y[hop]) * u - 60 * Math.sin(Math.PI * u)).toFixed(1), r: 7.8, fill: '#FFFFFF', opacity: '.22' });
      }
      el('circle', { cx: bx, cy: by, r: 26, fill: fill });
    }
    el('text', { 'class': 'm', x: 88, y: 990, 'font-size': 22, 'font-weight': 600, fill: '#fff', 'letter-spacing': 3 }, t('ui.card.foot'));
    el('text', { 'class': 'm', x: 992, y: 990, 'font-size': 22, 'font-weight': 600, fill: '#F0A93C', 'text-anchor': 'end', 'letter-spacing': 3 }, t('ui.card.url'));
    rCard.setAttribute('aria-label', r.card.join(' '));
  }

  /* ------------------------------------------------------------ lead + result */
  function sendLead(name, email, r) {
    if (!CFG.hubspot) return;
    var fields = [{ name: 'email', value: email }];
    if (name) fields.push({ name: 'firstname', value: name });
    try {
      fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + CFG.hubspot.portal + '/' + CFG.hubspot.form, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ fields: fields, context: { pageUri: location.href, pageName: 'Two Chasms ' + A + ' - ' + r.label + ' | perspective ' + persp } })
      }).catch(function () {});
    } catch (e) {}
  }
  function result(r) {
    rHead.innerHTML = ''; rHead.appendChild(document.createTextNode(r.head[0] + ' ')); rHead.appendChild(h('em', { text: r.head[1] }));
    rRead.textContent = r.read;
    rBars.innerHTML = '';
    r.bars.forEach(function (b, i) {
      rBars.appendChild(h('div', { 'class': 'as__bar' + b.cls }, [
        h('div', { 'class': 'as__barlab' }, [
          h('span', null, [h('b', { text: '0' + (i + 1) }), ' ' + b.label + ' ', h('i', { text: b.sub })]),
          h('span', null, [b.tag ? h('span', { 'class': 'as__lvl', text: b.tag }) : null, String(b.value)])
        ]),
        h('div', { 'class': 'as__track' }, [h('i', { style: 'width:' + b.value + '%' })])
      ]));
    });
    rExtra.innerHTML = '';
    if (r.red) {
      rExtra.appendChild(h('div', { 'class': 'as__barlab' }, [h('span', null, [h('b', { text: t('red.' + A + '.title') }), ' ', h('i', { text: t('red.' + A + '.sub') })]), h('span', { text: r.red.total + ' / ' + r.red.outOf })]));
      rExtra.appendChild(h('div', { 'class': 'as__track' }, [h('i', { style: 'width:' + Math.round(r.red.total / r.red.outOf * 100) + '%' })]));
      rExtra.appendChild(h('p', { 'class': 'as__redband', text: r.red.band }));
      if (r.red.lit.length) rExtra.appendChild(h('div', { 'class': 'as__lit' }, r.red.lit.map(function (n) { return h('span', { text: n }); })));
    }
    rWs.textContent = t(r.ws[0]) + ' →'; rWs.href = r.ws[1];
    rNext.textContent = t(r.next[0]); rNext.href = r.next[1];
    card(r);
    rShare.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(location.origin + location.pathname);
    show('result');
  }
  function gate() {
    var email = gMail.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { gMail.classList.add('is-bad'); gMail.value = ''; gMail.placeholder = t('ui.gate.invalid'); gMail.focus(); return; }
    gMail.classList.remove('is-bad');
    var r = READERS[CFG.reader.type](dimScores());
    sendLead(gName.value.trim(), email, r);   /* fire-and-forget: the reading never waits on the network */
    result(r);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-tc-start]'), function (b) {
    b.textContent = t('ui.start');
    b.addEventListener('click', function () { ans = []; renderPersp(); show('perspective'); });
  });
  qBack.addEventListener('click', function () { if (idx > 0) { idx--; render(); } });
  gGo.addEventListener('click', gate);
  gMail.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); gate(); } });
  rRedo.addEventListener('click', function () { ans = []; idx = 0; renderPersp(); show('perspective'); });
})();
