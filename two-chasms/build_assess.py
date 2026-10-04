"""Build /assess — "Where's your team?" — for the Two Chasms WordPress site.

Instrument: the 15 statements and the scoring of the five-layer placement assessment
(page 13, "Which wave are you in?") are kept unchanged, per HANDOVER §3.A.2. Layers are
relabelled as the five states (Framework_Map §1: the states ARE the five waves).

Flow and UI follow the agile-agilist.com QBank engine (WPCode snippet 30856): perspective step,
one statement per screen with a probe line, a 1–5 Never→Always scale plus N/A, an email gate
before results, fire-and-forget HubSpot capture to the same portal/form, per-dimension bars.
Scale mapping: engine 1..5 -> instrument 0..4; N/A answers are excluded from the state's mean.

Result logic (unchanged from page 13):
  state score     = mean answer / 4, as a percentage
  holding through = highest state >= 60 with every state below it also >= 60   (wave)
  operating at    = highest state scoring >= 40                                  (highest tried)
  The gap between the two is the point of the instrument. Do not collapse them.
Output: "You are in X; Y is not holding" → Y's flagship workshop. Mutation → live MRX deep dive.
"""
import re
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "out"
SRC_HTML = (HERE / "src" / "index.html").read_text()
SCENES = re.findall(r'<div class="state__icon">(<svg.*?</svg>)</div>', SRC_HTML, re.S)

body = r"""
<section class="wrap hero" id="as-intro">
  <span class="kicker">The assessment · 15 statements · about 12 minutes as a team</span>
  <h1>Where's your team? <em>Find the ball.</em></h1>
  <p class="lead">Answer as a team. Fifteen statements, three for each state. You get the state you're operating in, the one beneath you that isn't holding, and the workshop that gets you across.</p>
  <div class="actions"><button class="btn btn--amber" type="button" data-as-start>Start the assessment →</button><a class="link-mono" href="/workshops/">The workshops →</a></div>
</section>
<section class="wrap section section--tight" data-as-intro-states>
  <div class="states">__STATES__</div>
</section>

<section class="wrap as" data-as hidden>
  <div class="as__stage" data-stage="perspective">
    <span class="kicker">Before you start</span>
    <h2>Whose answers <em>are these?</em></h2>
    <p class="lead lead--wide">Answer for the unit you can actually see. The reading is only as honest as the vantage point.</p>
    <div class="as__opts" data-persp></div>
  </div>

  <div class="as__stage" data-stage="quiz">
    <div class="as__head"><div class="as__state" data-q-state></div><p data-q-def></p></div>
    <div class="label" data-q-num></div>
    <p class="as__q" data-q-text></p>
    <p class="as__probe" data-q-probe></p>
    <div class="as__scale" data-q-opts></div>
    <div class="as__prog"><i data-q-prog></i></div>
    <div class="actions as__nav"><button type="button" class="link-mono as__back" data-q-back>← Previous</button></div>
  </div>

  <div class="as__stage" data-stage="gate">
    <div class="as__gate">
      <span class="kicker">Your reading is ready</span>
      <h2>Fifteen answers in. <em>One email away.</em></h2>
      <p>Enter your work email to see the state you're in, the leap in front of you, and the workshop that gets you across. We'll also send the first chapter of <i>The Mutation Age</i> when it releases.</p>
      <input class="as__field" type="text" data-gate-name placeholder="First name" autocomplete="given-name">
      <input class="as__field" type="email" data-gate-email placeholder="Work email" autocomplete="email">
      <button class="btn btn--ink" type="button" data-gate-go>Show my reading →</button>
      <p class="as__fine">One email per launch update. Unsubscribe anytime. — Agile Agilist Inc.</p>
    </div>
  </div>

  <div class="as__stage" data-stage="result">
    <div class="as__result">
      <div class="stack">
        <span class="kicker" data-r-kicker>Your Two Chasms reading</span>
        <h2 data-r-head></h2>
        <p class="lead lead--wide" data-r-read></p>
        <div class="as__bars" data-r-bars></div>
        <div class="actions"><a class="btn btn--amber" data-r-ws href="/workshops/"></a><a class="link-mono" data-r-next href="/workshops/"></a></div>
        <p class="as__fine">A directional reading. A facilitated assessment scores each state against its measurable signals with your leadership team. <button type="button" class="as__redo" data-r-redo>Retake</button></p>
      </div>
      <figure class="as__card"><svg class="share" viewBox="0 0 1080 1080" role="img" data-r-card></svg>
        <figcaption><a class="link-mono" data-r-share target="_blank" rel="noopener" href="#">Share on LinkedIn →</a></figcaption></figure>
    </div>
  </div>
</section>

<section class="band band--wash">
  <div class="wrap stack">
    <span class="kicker kicker--mute">Go deeper · on agile-agilist.com</span>
    <h2>Placement first. <em>Then the full readiness read.</em></h2>
    <p class="lead lead--wide">If you land in Immune or Mutation, the Mutation Readiness Index is the deep dive: six dimensions, bands from Mutation-Blind to Mutation-Ready.</p>
    <div class="actions"><a class="btn btn--ink" href="https://agile-agilist.com/assessments/mutation-readiness/">Mutation Readiness Index ↗</a><a class="link-mono" href="https://agile-agilist.com/assessments/ai-assessment/">AI Maturity &amp; Readiness ↗</a></div>
  </div>
</section>

<script>
/* Two Chasms — placement assessment. Generated by two-chasms/build_assess.py; edit there.
   Flow modelled on the agile-agilist.com QBank engine; instrument and scoring carried over
   unchanged from "Which wave are you in?". One script, one failure domain: nothing here can
   break the masthead or other pages. */
(function () {
  'use strict';
  var root = document.querySelector('[data-as]');
  if (!root) return;

  /* HubSpot Forms API is browser-facing: portal + form GUID are public, not secrets.
     Same form as the agile-agilist.com assessments ("Mutation Readiness Assessment"):
     email + firstname only. The reading travels in context.pageName so it is visible on
     the submission without adding a field the form does not have (which HubSpot rejects). */
  var HS_PORTAL = '46316757', HS_FORM = 'c6f0d4c1-d233-4875-9b0c-4528cda02237';

  var STATES = [
    { key: 'reflex', name: 'Reflex', wave: 'Iterative delivery at scale', amber: false,
      def: 'Delivery works beyond a few teams: dependencies, alignment, a shared cadence. Without it, nothing above has a floor.',
      ws: ['S1 Signal Mapping — the exit from Reflex', '/workshops/#reflex'] },
    { key: 'playground', name: 'Playground', wave: 'Innovation in cadence', amber: true,
      def: 'Chasm one, control → trust. Innovation recurring and protected inside the existing rhythm — not run beside it.',
      ws: ['P6 The Innovation Matrix', '/workshops/#p6'] },
    { key: 'signal-sensing', name: 'Signal Sensing', wave: 'AI-Native', amber: false,
      def: 'Processes, roles and governance redesigned around AI — and leading signals read before the lagging metrics move.',
      ws: ['S1 Signal Mapping', '/workshops/#s1'] },
    { key: 'immune', name: 'Immune', wave: 'AI automation', amber: true,
      def: 'Chasm two, metrics → signals. Automate where it changes the economics of work; the human keeps the decision and the accountability.',
      ws: ['S6 IMMUNE / SignalNet', '/workshops/#s6'] },
    { key: 'mutation', name: 'Mutation', wave: 'Mutation', amber: true,
      def: 'The capacity to change the model itself, not just adapt inside the one you have.',
      ws: ['M2 Mutation Readiness, facilitated', '/workshops/#m2'] }
  ];

  var Q = [
    { s: 0, t: 'Work that spans more than three teams reaches customers on a predictable cadence, without heroics.', p: 'Think of the last release that needed several teams. Did it land when planned?' },
    { s: 0, t: 'Cross-team dependencies are visible and managed before they become escalations.', p: 'Could anyone list this quarter’s top five dependencies today, without a meeting?' },
    { s: 0, t: 'One planning rhythm governs all the teams that need to move together.', p: 'Same cadence, same planning event — or a calendar of local plans stitched together?' },
    { s: 1, t: 'A protected share of capacity goes to experiments every cycle — and survives quarterly pressure.', p: 'When the last quarter got tight, what happened to the experiment budget?' },
    { s: 1, t: 'Experiments have pre-agreed success criteria, and some are expected to fail.', p: 'Name the last experiment that was stopped on its own criteria rather than by a calendar.' },
    { s: 1, t: 'An idea from outside the leadership team shipped to customers in the last quarter.', p: 'Where did the last shipped idea actually come from?' },
    { s: 2, t: 'At least one core process has been redesigned around AI rather than having a copilot added to it.', p: 'Redesigned means the steps changed, not that a tool was added to the old steps.' },
    { s: 2, t: 'Roles have changed because of AI — what people are accountable for is different than eighteen months ago.', p: 'Has any job description been rewritten because of what AI now does?' },
    { s: 2, t: 'Governance treats AI systems as actors with identity and scoped permissions, not as tools.', p: 'Does every AI system that acts have its own identity, owner and permission scope?' },
    { s: 3, t: 'Where AI acts autonomously, a named human owns the decision and can explain it after the fact.', p: 'Pick one autonomous action from last week. Who owns it, by name?' },
    { s: 3, t: 'Automation was chosen where it changed the unit economics of the work — not where it was merely possible.', p: 'Could you show the before-and-after cost per unit for your largest automation?' },
    { s: 3, t: 'Every autonomous action leaves enough evidence to reconstruct what happened.', p: 'If a customer challenged an automated decision tomorrow, could you replay it?' },
    { s: 4, t: 'We have retired or fundamentally rebuilt a core part of our operating model in the last twelve months.', p: 'Retired or rebuilt — not renamed. The rebrand doesn’t count.' },
    { s: 4, t: 'We track leading signals — behaviour, language, workflow drift — not only lagging metrics.', p: 'For each metric on the dashboard, is there a signal that moves first, with a named listener?' },
    { s: 4, t: 'Someone was visibly rewarded in the last year for raising a signal that invalidated a plan.', p: 'Not tolerated — rewarded, and visibly.' }
  ];

  var SCALE = [[1, 'Never'], [2, 'Rarely'], [3, 'Sometimes'], [4, 'Often'], [5, 'Always'], [null, 'N/A']];
  var PERSP = [['self', 'Myself'], ['team', 'My team (under 30)'], ['unit', 'A business unit'], ['org', 'The whole organization']];

  var $ = function (sel) { return root.querySelector(sel); };
  var idx = 0, ans = [], persp = '';
  var intro = document.getElementById('as-intro'), introStates = document.querySelector('[data-as-intro-states]');

  function stage(name) {
    Array.prototype.forEach.call(root.querySelectorAll('.as__stage'), function (s) {
      s.classList.toggle('is-on', s.getAttribute('data-stage') === name);
    });
    root.hidden = false;
    if (intro) intro.hidden = true;
    if (introStates) introStates.hidden = true;
    root.scrollIntoView({ block: 'start' });
  }

  function opt(label, onClick, tick) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'as__opt';
    if (tick !== undefined) { var t = document.createElement('span'); t.className = 'as__tick'; t.textContent = tick; b.appendChild(t); }
    var s = document.createElement('span'); s.textContent = label; b.appendChild(s);
    b.addEventListener('click', onClick);
    return b;
  }

  function renderPersp() {
    var box = $('[data-persp]'); box.innerHTML = '';
    PERSP.forEach(function (p) { box.appendChild(opt(p[1], function () { persp = p[0]; idx = 0; stage('quiz'); render(); })); });
  }

  function render() {
    var q = Q[idx], S = STATES[q.s];
    var st = $('[data-q-state]');
    st.textContent = 'State 0' + (q.s + 1) + ' · ' + S.name + ' — ' + S.wave;
    st.classList.toggle('is-amber', S.amber);
    $('[data-q-def]').textContent = S.def;
    $('[data-q-num]').textContent = 'Statement ' + (idx + 1) + ' of ' + Q.length;
    $('[data-q-text]').textContent = q.t;
    $('[data-q-probe]').textContent = q.p;
    var box = $('[data-q-opts]'); box.innerHTML = '';
    SCALE.forEach(function (sc) {
      var b = opt(sc[1], function () {
        ans[idx] = sc[0] === null ? null : sc[0] - 1;   /* engine 1..5 -> instrument 0..4 */
        idx++;
        if (idx < Q.length) render(); else stage('gate');
      }, sc[0] === null ? '–' : String(sc[0]));
      if (ans[idx] !== undefined && ((ans[idx] === null && sc[0] === null) || ans[idx] === sc[0] - 1)) b.classList.add('is-picked');
      box.appendChild(b);
    });
    $('[data-q-back]').hidden = idx === 0;
    $('[data-q-prog]').style.width = (idx / Q.length * 100) + '%';
  }

  function scores() {
    var sum = [0, 0, 0, 0, 0], n = [0, 0, 0, 0, 0];
    Q.forEach(function (q, i) { if (ans[i] !== null && ans[i] !== undefined) { sum[q.s] += ans[i]; n[q.s]++; } });
    return sum.map(function (v, i) { return n[i] ? Math.round(v / (n[i] * 4) * 100) : 0; });
  }

  function reading(ls) {
    var wave = 0; for (var i = 0; i < 5; i++) { if (ls[i] >= 60) wave = i + 1; else break; }
    var hi = 0; ls.forEach(function (v, i) { if (v >= 40) hi = i + 1; });
    var weak = wave < 5 ? wave : -1;                    /* first state that is not holding */
    var at = Math.max(hi, wave, 1) - 1;                 /* state the team is operating in */
    var r = { wave: wave, hi: hi, weak: weak, at: at, ls: ls };
    if (wave === 5) {
      r.head = ['All five holding.', 'You’re in Mutation.'];
      r.read = 'Every state is holding. The risk now is success hardening — practices freezing into routines that stop being questioned. Re-score quarterly, and treat a falling Mutation score as the first signal, not a rounding error. Relapse to Reflex is one rebrand away.';
      r.card = ['Both chasms crossed.', 'Keep crossing.'];
    } else if (wave === 0) {
      r.head = ['You’re in Reflex.', 'The floor isn’t holding yet.'];
      r.read = 'Iterative delivery at scale is not yet holding, so nothing above it has a floor. That is not a criticism — it is the honest place to start, and the state with the fastest, most visible payoff. Start by making the dashboard tell the truth.';
      r.card = ['Standing in Reflex.', 'Next leap: Playground.'];
    } else if (hi > wave + 1) {
      var stuck = STATES[weak].key === 'playground' ? 'chasm one' : STATES[weak].key === 'immune' ? 'chasm two' : null;
      r.head = ['You’re in ' + STATES[at].name + '.', STATES[weak].name + ' is not holding.'];
      r.read = 'You are operating in ' + STATES[at].name + ' while ' + STATES[weak].name + ' (' + STATES[weak].wave + ') is not holding'
        + (stuck ? ' — part of the team is still in ' + stuck + '. ' : '. ')
        + 'This is the most common and most expensive pattern we see: the organization has climbed higher than its governance can support. The next move is not another state up. It is closing the gap beneath you.';
      r.card = stuck ? ['Stuck in ' + stuck + '.', 'Next leap: ' + STATES[weak].name + '.'] : ['Climbed past ' + STATES[weak].name + '.', 'Go back and close it.'];
      r.stuck = stuck;
    } else {
      r.head = ['You’re in ' + STATES[wave - 1].name + '.', 'Next leap: ' + STATES[weak].name + '.'];
      r.read = STATES.slice(0, wave).map(function (s) { return s.name; }).join(', ') + (wave > 1 ? ' are' : ' is') + ' holding. '
        + STATES[weak].name + ' (' + STATES[weak].wave + ') is the leap in front of you — and only if the market demands it. Climbing higher than the problem requires is an expensive way to be wrong.';
      var down = wave >= 4 ? 'Two chasms down.' : wave >= 2 ? 'One chasm down.' : 'Standing on the edge.';
      r.card = [down, 'Next leap: ' + STATES[weak].name + '.'];
      r.at = wave - 1;
    }
    return r;
  }

  /* Share card — the dark 1080 card from the design (brand kit 6C), drawn for this result.
     Ball sits on the state the team is in (or falls into the gap it is stuck in). */
  function card(r) {
    var NS = 'http://www.w3.org/2000/svg', svg = $('[data-r-card]');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    function el(tag, a, txt) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (txt) e.textContent = txt; svg.appendChild(e); return e; }
    el('rect', { width: 1080, height: 1080, fill: '#101418' });
    el('text', { 'class': 'm', x: 88, y: 130, 'font-size': 24, fill: '#9AA6B2', 'letter-spacing': 3.8 }, 'OUR TWO CHASMS RESULT');
    el('text', { 'class': 'm', x: 992, y: 130, 'font-size': 24, fill: '#9AA6B2', 'text-anchor': 'end', 'letter-spacing': 3.8 }, '@TWOCHASMS');
    el('text', { 'class': 'a', x: 84, y: 380, 'font-size': 76, 'font-weight': 900, fill: '#fff', 'letter-spacing': -2.6 }, r.card[0]);
    el('text', { 'class': 'a', x: 84, y: 470, 'font-size': 76, 'font-weight': 900, fill: '#F0A93C', 'letter-spacing': -2.6 }, r.card[1]);
    var gx = 88, gy = 860, seg = [[0, 240], [342, 220], [664, 240]];
    seg.forEach(function (s, i) { el('rect', { x: gx + s[0], y: gy, width: s[1], height: 24, fill: (r.wave === 5 && i === 2) ? '#F0A93C' : '#FFFFFF' }); });
    /* stand points on the three ground segments; crossings sit mid-leap above the gaps */
    var X = [gx + 130, gx + 291, gx + 452, gx + 613, gx + 774], Y = [834, 720, 834, 720, 834];
    var pos = r.at, bx = X[pos], by = Y[pos], fill = r.wave === 5 ? '#F0A93C' : '#FFFFFF';
    if (r.stuck) { bx = r.stuck === 'chasm one' ? gx + 291 : gx + 613; by = 905; fill = '#8C97A3'; }
    for (var t = 0; t < pos; t += 0.125) {               /* faint trail of the leaps already made */
      var hop = Math.floor(t), u = t - hop, x = X[hop] + (X[hop + 1] - X[hop]) * u;
      el('circle', { cx: x.toFixed(1), cy: (Y[hop] + (Y[hop + 1] - Y[hop]) * u - 60 * Math.sin(Math.PI * u)).toFixed(1), r: 7.8, fill: '#FFFFFF', opacity: '.22' });
    }
    el('circle', { cx: bx, cy: by, r: 26, fill: fill });
    el('text', { 'class': 'm', x: 88, y: 990, 'font-size': 22, 'font-weight': 600, fill: '#fff', 'letter-spacing': 3 }, 'WHERE’S YOUR TEAM?');
    el('text', { 'class': 'm', x: 992, y: 990, 'font-size': 22, 'font-weight': 600, fill: '#F0A93C', 'text-anchor': 'end', 'letter-spacing': 3 }, 'TWOCHASMS.COM/ASSESS →');
    svg.setAttribute('aria-label', 'Result card: ' + r.card.join(' '));
  }

  function sendLead(name, email, r) {
    var label = r.head.join(' ') + ' | ' + STATES.map(function (s, i) { return s.name + ' ' + r.ls[i]; }).join(' · ') + ' | perspective ' + persp;
    var fields = [{ name: 'email', value: email }];
    if (name) fields.push({ name: 'firstname', value: name });
    try {
      fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + HS_PORTAL + '/' + HS_FORM, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ fields: fields, context: { pageUri: location.href, pageName: 'Two Chasms assessment - ' + label } })
      }).catch(function () {});
    } catch (e) {}
  }

  function show(r) {
    $('[data-r-head]').innerHTML = '';
    $('[data-r-head]').appendChild(document.createTextNode(r.head[0] + ' '));
    var em = document.createElement('em'); em.textContent = r.head[1]; $('[data-r-head]').appendChild(em);
    $('[data-r-read]').textContent = r.read;
    $('[data-r-bars]').innerHTML = STATES.map(function (s, i) {
      var cls = 'as__bar' + (i === r.weak ? ' is-weak' : '') + (i < r.wave ? ' is-hold' : '');
      return '<div class="' + cls + '"><div class="as__barlab"><span><b>0' + (i + 1) + '</b> ' + s.name + ' <i>' + s.wave + '</i></span><span>' + r.ls[i] + '</span></div><div class="as__track"><i style="width:' + r.ls[i] + '%"></i></div></div>';
    }).join('');
    var target = r.wave === 5 ? STATES[4] : STATES[r.weak];
    var ws = $('[data-r-ws]'); ws.textContent = target.ws[0] + ' →'; ws.href = target.ws[1];
    var nx = $('[data-r-next]');
    if (r.wave >= 3) { nx.textContent = 'Deep dive: Mutation Readiness Index ↗'; nx.href = 'https://agile-agilist.com/assessments/mutation-readiness/'; }
    else { nx.textContent = 'All fourteen workshops →'; nx.href = '/workshops/'; }
    card(r);
    $('[data-r-share]').href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(location.origin + '/assess/');
    stage('result');
  }

  function gate() {
    var nameEl = $('[data-gate-name]'), mailEl = $('[data-gate-email]');
    var email = mailEl.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      mailEl.classList.add('is-bad'); mailEl.value = ''; mailEl.placeholder = 'A valid work email is needed'; mailEl.focus(); return;
    }
    mailEl.classList.remove('is-bad');
    var r = reading(scores());
    sendLead(nameEl.value.trim(), email, r);   /* fire-and-forget: the reading never waits on the network */
    show(r);
  }

  document.querySelector('[data-as-start]').addEventListener('click', function () { ans = []; renderPersp(); stage('perspective'); });
  $('[data-q-back]').addEventListener('click', function () { if (idx > 0) { idx--; render(); } });
  $('[data-gate-go]').addEventListener('click', gate);
  $('[data-gate-email]').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); gate(); } });
  $('[data-r-redo]').addEventListener('click', function () { ans = []; idx = 0; renderPersp(); stage('perspective'); });
})();
</script>
"""

# intro: the five states as cards, reused from the homepage design
names = [("State", "01", "Reflex", "Iterative delivery at scale", False), ("Chasm one", "02", "Playground", "Innovation in cadence", True),
         ("State", "03", "Signal Sensing", "AI-Native", False), ("Chasm two", "04", "Immune", "AI automation", True),
         ("Arrived", "05", "Mutation", "Mutation", True)]
cards = "".join(
    f'<article class="state{" is-amber" if a else ""}"><div class="state__icon">{SCENES[i]}</div>'
    f'<div class="state__meta"><span class="state__kind">{k}</span><span>{n}</span></div><h3>{nm}</h3><p>Wave {n} · {w}. Three statements.</p></article>'
    for i, (k, n, nm, w, a) in enumerate(names))
body = body.replace("__STATES__", cards)
body = re.sub(r"\n\s*\n", "\n", body.strip())
(OUT / "assess.html").write_text("<!-- wp:html -->\n<div class=\"tc\">\n" + body + "\n</div>\n<!-- /wp:html -->\n")

CSS = """/* ----- /assess ----- */
.tc [hidden]{display:none!important}
.tc .as{padding-top:48px;padding-bottom:56px;scroll-margin-top:12px}
.tc .as__stage{display:none;max-width:760px}
.tc .as__stage.is-on{display:flex;flex-direction:column;gap:16px}
.tc .as__stage[data-stage="result"]{max-width:none}
.tc .as__opts,.tc .as__scale{display:grid;gap:8px}
.tc .as__opt{display:flex;align-items:center;gap:14px;width:100%;text-align:left;cursor:pointer;font-family:var(--sans);font-size:16px;color:var(--ink);background:#fff;border:1px solid var(--line);padding:14px 18px;transition:border-color .18s,background .18s}
.tc .as__opt:hover,.tc .as__opt.is-picked{border-color:var(--amber);background:var(--wash-2)}
.tc .as__tick{font-family:var(--mono);font-size:12px;font-weight:600;color:var(--mute);min-width:18px}
.tc .as__opt:hover .as__tick,.tc .as__opt.is-picked .as__tick{color:var(--amber)}
.tc .as__head{border-left:4px solid var(--slate);padding-left:16px}
.tc .as__state{font-family:var(--mono);font-size:11.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--slate)}
.tc .as__state.is-amber{color:var(--amber)}
.tc .as__head p{font-size:13.5px;line-height:1.6;color:var(--ink-2);margin-top:6px}
.tc .as__q{font-weight:900;font-size:clamp(21px,2.6vw,27px);line-height:1.2;letter-spacing:-.015em;color:var(--ink);max-width:40ch}
.tc .as__probe{font-family:var(--mono);font-size:12px;line-height:1.6;letter-spacing:.02em;color:var(--mute)}
.tc .as__prog{height:3px;background:var(--line);position:relative;margin-top:12px}
.tc .as__prog>i{position:absolute;inset:0 auto 0 0;background:var(--amber);transition:width .2s}
.tc .as__back{background:none;border:0;padding:0;cursor:pointer}
.tc .as__gate{border:1px solid var(--line);border-top:4px solid var(--amber);padding:28px;display:flex;flex-direction:column;gap:14px;max-width:560px}
.tc .as__gate p{font-size:14px;line-height:1.65;color:var(--ink-2)}
.tc .as__field{width:100%;font-family:var(--mono);font-size:14px;color:var(--ink);background:#fff;border:1px solid var(--line);padding:13px 15px}
.tc .as__field:focus{outline:2px solid var(--amber);outline-offset:-2px}
.tc .as__field.is-bad{border-color:var(--amber)}
.tc .as__gate .btn{align-self:flex-start}
.tc .as__fine{font-family:var(--mono);font-size:10.5px;line-height:1.7;color:var(--mute)}
.tc .as__redo{background:none;border:0;padding:0;font:inherit;color:var(--amber);cursor:pointer;text-decoration:underline}
.tc .as__result{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:40px;align-items:start}
.tc .as__bars{display:grid;gap:8px;margin:8px 0}
.tc .as__bar{background:var(--wash-2);border-left:4px solid var(--line-2);padding:10px 14px}
.tc .as__bar.is-hold{border-left-color:var(--slate)}
.tc .as__bar.is-weak{border-left-color:var(--amber)}
.tc .as__barlab{display:flex;justify-content:space-between;gap:12px;font-family:var(--mono);font-size:11.5px;letter-spacing:.06em;color:var(--ink-2);margin-bottom:6px}
.tc .as__barlab b{color:var(--ink);font-weight:600}.tc .as__barlab i{font-style:normal;color:var(--faint)}
.tc .as__track{height:8px;background:#E7ECF1;position:relative}
.tc .as__track>i{position:absolute;inset:0 auto 0 0;background:var(--slate)}
.tc .as__bar.is-weak .as__track>i{background:var(--amber)}
.tc .as__card{margin:0;display:flex;flex-direction:column;gap:10px;align-items:center}
.tc .as__card .share{max-width:360px}
@media (max-width:860px){.tc .as__result{grid-template-columns:1fr}}
"""
(OUT / "assess_css.css").write_text(CSS)
print("assess.html", (OUT / "assess.html").stat().st_size, "assess_css.css", len(CSS))
