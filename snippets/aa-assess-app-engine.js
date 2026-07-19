/* Agile Assessment — reusable ENGINE.
 * Reads ASSESSMENTS, SOON_CARDS and I18N from a page-provided config:
 *   <script type="application/json" class="aa-app-cfg"> { assessments, soon, i18n } </script>
 * Mounts into <div id="aa-app"></div>. All user-facing chrome comes from I18N.
 * Scoring, radar, routing and logic are identical to the original single-page app.
 */
(function(){
  if (window.__aaEngineInit) return;            // guard against double-init
  window.__aaEngineInit = true;

  var cfgEl = document.querySelector('.aa-app-cfg');
  if (!cfgEl) { console.error('[aa-engine] missing <script class="aa-app-cfg"> config'); return; }
  var CFG;
  try { CFG = JSON.parse(cfgEl.textContent); }
  catch (e) { console.error('[aa-engine] invalid config JSON', e); return; }
  var ASSESSMENTS = CFG.assessments, SOON_CARDS = CFG.soon, I18N = CFG.i18n;

  // Inject CSS once.
  (function(){
    if (document.getElementById('aa-engine-style')) return;
    var css = `#aa-app{--aa-bg:#F5FAFB;--aa-card:#FFFFFF;--aa-ink:#053947;--aa-ink-2:#475569;--aa-ink-3:#64748b;--aa-line:#e2e8f0;--aa-line-2:#f1f5f9;--aa-brand:#0170B9;--aa-brand-2:#053947;--aa-accent:#fbbf24;--aa-ok:#10b981;--aa-radius:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--aa-ink);line-height:1.55;background:var(--aa-bg);padding:0;margin:0 calc(50% - 50vw);width:100vw;box-sizing:border-box}
#aa-app *{box-sizing:border-box}
#aa-app .aa-inner{max-width:1180px;margin:0 auto;padding:0 24px}
#aa-app h1,#aa-app h2,#aa-app h3,#aa-app h4{margin:0;color:var(--aa-ink);line-height:1.2}
#aa-app p{margin:0;color:var(--aa-ink-2)}
#aa-app a{color:var(--aa-brand);text-decoration:none}
#aa-app .aa-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 26px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;border:0;transition:all .18s}
#aa-app .aa-btn-primary{background:var(--aa-brand);color:#fff;box-shadow:0 4px 14px rgba(1,112,185,.25)}
#aa-app .aa-btn-primary:hover{background:#015a96;transform:translateY(-1px)}
#aa-app .aa-btn-ghost{background:transparent;color:var(--aa-ink);border:2px solid var(--aa-ink)}
#aa-app .aa-btn-ghost:hover{background:var(--aa-ink);color:#fff}
#aa-app .aa-btn-accent{background:var(--aa-accent);color:#053947}
#aa-app .aa-btn-accent:hover{background:#f59e0b}
#aa-app .aa-eyebrow{display:inline-block;padding:5px 12px;background:#dbeafe;color:#1e40af;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase}
#aa-app .aa-hero{padding:80px 24px 50px;background:radial-gradient(ellipse at top,#fff,var(--aa-bg))}
#aa-app .aa-hero h1{font-size:46px;font-weight:800;text-align:center;margin:18px auto 14px;max-width:820px;letter-spacing:-0.01em}
#aa-app .aa-hero p.aa-sub{font-size:18px;text-align:center;max-width:680px;margin:0 auto 32px}
#aa-app .aa-hero-cta{text-align:center;margin-bottom:18px}
#aa-app .aa-trust-strip{display:flex;justify-content:center;gap:28px;flex-wrap:wrap;font-size:12px;color:var(--aa-ink-3);font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-top:12px}
#aa-app .aa-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:30px 24px 60px;max-width:1180px;margin:0 auto}
@media(max-width:1000px){#aa-app .aa-cards{grid-template-columns:repeat(2,1fr)}}
@media(max-width:660px){#aa-app .aa-hero h1{font-size:32px}#aa-app .aa-cards{grid-template-columns:1fr}}
#aa-app .aa-card{background:var(--aa-card);border:1px solid var(--aa-line);border-radius:var(--aa-radius);padding:24px;display:flex;flex-direction:column;gap:12px;transition:all .22s}
#aa-app .aa-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(15,23,42,.08);border-color:var(--aa-brand)}
#aa-app .aa-card.aa-soon{opacity:.75;background:linear-gradient(135deg,#f8fafc,#f1f5f9)}
#aa-app .aa-card-badge{display:flex;justify-content:space-between;align-items:center;gap:10px}
#aa-app .aa-pill{padding:4px 10px;background:#dbeafe;color:#1e40af;border-radius:5px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase}
#aa-app .aa-pill.aa-pill-soon{background:#f1f5f9;color:#64748b}
#aa-app .aa-card h3{font-size:18px;font-weight:800}
#aa-app .aa-card .aa-tag{font-size:14px;color:var(--aa-brand);font-weight:600;font-style:italic}
#aa-app .aa-card .aa-desc{font-size:13px;line-height:1.55;flex:1}
#aa-app .aa-card-meta{display:flex;gap:10px;font-size:11px;color:var(--aa-ink-3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;padding-top:8px;border-top:1px solid var(--aa-line-2)}
#aa-app .aa-runner{padding:50px 24px;min-height:70vh}
#aa-app .aa-runner-inner{max-width:780px;margin:0 auto}
#aa-app .aa-progress{height:6px;background:var(--aa-line-2);border-radius:3px;margin-bottom:26px;overflow:hidden}
#aa-app .aa-progress-bar{height:100%;background:linear-gradient(90deg,var(--aa-brand),var(--aa-ok));transition:width .4s cubic-bezier(.4,0,.2,1);border-radius:3px}
#aa-app .aa-step{background:var(--aa-card);border:1px solid var(--aa-line);border-radius:var(--aa-radius);padding:38px 32px;animation:aaFadeIn .35s ease}
@keyframes aaFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
#aa-app .aa-step-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:12px;color:var(--aa-ink-3);font-weight:700;text-transform:uppercase;letter-spacing:1px}
#aa-app .aa-dim-pill{padding:4px 10px;border-radius:5px;color:#fff;font-size:10px;letter-spacing:.8px}
#aa-app .aa-q-text{font-size:22px;font-weight:700;line-height:1.35;margin-bottom:10px}
#aa-app .aa-q-probe{font-size:14px;color:var(--aa-ink-3);font-style:italic;margin-bottom:20px;padding-left:14px;border-left:3px solid var(--aa-line)}
#aa-app .aa-input{width:100%;padding:14px 16px;border:1.5px solid var(--aa-line);border-radius:8px;font-size:15px;font-family:inherit;color:var(--aa-ink);background:#fff;resize:vertical;min-height:84px}
#aa-app .aa-input:focus{outline:0;border-color:var(--aa-brand);box-shadow:0 0 0 3px rgba(1,112,185,.12)}
#aa-app .aa-likert{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:14px}
#aa-app .aa-likert button{padding:10px 6px;border:1.5px solid var(--aa-line);background:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;color:var(--aa-ink-2);transition:all .15s;text-align:center}
#aa-app .aa-likert button:hover{border-color:var(--aa-brand);color:var(--aa-brand)}
#aa-app .aa-likert button.aa-sel{background:var(--aa-brand);color:#fff;border-color:var(--aa-brand)}
#aa-app .aa-likert button.aa-sel-na{background:var(--aa-ink-3);color:#fff;border-color:var(--aa-ink-3)}
#aa-app .aa-reflect{background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:10px;padding:14px 16px;margin-top:16px;font-size:14px;display:flex;gap:10px;align-items:flex-start;animation:aaFadeIn .3s}
#aa-app .aa-reflect strong{color:var(--aa-brand-2);font-weight:700}
#aa-app .aa-nav{display:flex;justify-content:space-between;gap:10px;margin-top:24px}
#aa-app .aa-nav .aa-spacer{flex:1}
#aa-app .aa-results{padding:50px 24px}
#aa-app .aa-results-inner{max-width:1100px;margin:0 auto}
#aa-app .aa-score-hero{background:linear-gradient(135deg,var(--aa-brand-2),var(--aa-brand));color:#fff;border-radius:18px;padding:42px 30px;text-align:center;margin-bottom:22px;position:relative;overflow:hidden}
#aa-app .aa-score-num{font-size:78px;font-weight:900;letter-spacing:-2px;line-height:1;margin-bottom:6px;color:#fff}
#aa-app .aa-score-out{font-size:16px;opacity:.7;font-weight:600;margin-bottom:14px}
#aa-app .aa-score-band{display:inline-block;padding:7px 18px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:30px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px}
#aa-app .aa-score-head{font-size:20px;font-weight:700;color:#fff;max-width:680px;margin:0 auto;line-height:1.4}
#aa-app .aa-grid-2{display:grid;grid-template-columns:1.2fr 1fr;gap:20px;margin-bottom:22px}
@media(max-width:820px){#aa-app .aa-grid-2{grid-template-columns:1fr}}
#aa-app .aa-panel{background:var(--aa-card);border:1px solid var(--aa-line);border-radius:var(--aa-radius);padding:26px}
#aa-app .aa-panel h3{font-size:17px;font-weight:700;margin-bottom:14px}
#aa-app .aa-dim-row{display:grid;grid-template-columns:160px 1fr 60px;gap:10px;align-items:center;margin-bottom:10px;font-size:13px}
#aa-app .aa-dim-bar{height:10px;background:var(--aa-line-2);border-radius:5px;overflow:hidden}
#aa-app .aa-dim-fill{height:100%;border-radius:5px;transition:width .8s cubic-bezier(.4,0,.2,1)}
#aa-app .aa-dim-score{text-align:right;font-weight:700}
#aa-app .aa-hint{padding:16px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border-left:4px solid var(--aa-accent);border-radius:8px;font-size:13px;color:#78350f;line-height:1.55;margin-top:14px}
#aa-app .aa-radar-wrap{display:flex;align-items:center;justify-content:center;padding:10px}
#aa-app .aa-radar{width:100%;max-width:320px;height:auto}
#aa-app .aa-gate{background:linear-gradient(135deg,#0a1929,var(--aa-brand-2));color:#fff;border-radius:18px;padding:38px 30px;margin:22px 0}
#aa-app .aa-gate-inner{display:grid;grid-template-columns:1.4fr 1fr;gap:28px;align-items:center}
@media(max-width:820px){#aa-app .aa-gate-inner{grid-template-columns:1fr}}
#aa-app .aa-gate h2{color:#fff;font-size:24px;font-weight:800;margin-bottom:10px}
#aa-app .aa-gate p{color:#cbd5e1;margin-bottom:16px;font-size:14px}
#aa-app .aa-pricing{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:20px;text-align:center}
#aa-app .aa-pricing .aa-amt{font-size:32px;font-weight:800;color:#fff;line-height:1}
#aa-app .aa-pricing .aa-per{font-size:11px;color:#cbd5e1;text-transform:uppercase;letter-spacing:1px;margin:2px 0 10px}
#aa-app .aa-pricing ul{list-style:none;padding:0;margin:0;text-align:left}
#aa-app .aa-pricing li{font-size:12px;color:#fff;padding:4px 0;display:flex;gap:6px}
#aa-app .aa-pricing li::before{content:'\\2713';color:var(--aa-ok);font-weight:800}
#aa-app .aa-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.7);display:none;align-items:center;justify-content:center;z-index:9999;padding:20px;animation:aaFadeIn .2s}
#aa-app .aa-modal-bg.aa-open{display:flex}
#aa-app .aa-modal{background:#fff;border-radius:18px;max-width:480px;width:100%;padding:32px;position:relative}
#aa-app .aa-modal-close{position:absolute;top:10px;right:14px;background:none;border:0;font-size:22px;color:var(--aa-ink-3);cursor:pointer;padding:4px 8px}
#aa-app .aa-form-field{margin-bottom:12px}
#aa-app .aa-form-field label{display:block;font-size:13px;font-weight:600;margin-bottom:6px}
#aa-app .aa-form-field input{width:100%;padding:11px 13px;border:1.5px solid var(--aa-line);border-radius:8px;font-size:14px;font-family:inherit}
#aa-app .aa-plan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:22px 0}
@media(max-width:820px){#aa-app .aa-plan-grid{grid-template-columns:1fr}}
#aa-app .aa-plan-card{background:var(--aa-card);border:1px solid var(--aa-line);border-radius:var(--aa-radius);padding:22px}
#aa-app .aa-plan-card h4{font-size:13px;color:var(--aa-brand);font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
#aa-app .aa-plan-action{padding:10px 0;border-bottom:1px solid var(--aa-line-2);font-size:13px}
#aa-app .aa-plan-action:last-child{border-bottom:0}
#aa-app .aa-plan-action strong{display:block;color:var(--aa-ink);margin-bottom:3px;font-weight:700}
#aa-app .aa-reading{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:12px}
@media(max-width:820px){#aa-app .aa-reading{grid-template-columns:1fr}}
#aa-app .aa-book{padding:12px;background:var(--aa-line-2);border-radius:8px;font-size:13px}
#aa-app .aa-book strong{display:block;color:var(--aa-ink)}`;
    var st = document.createElement('style');
    st.id = 'aa-engine-style';
    st.textContent = css;
    document.head.appendChild(st);
  })();

  // Ensure the mount structure exists (page provides <div id="aa-app"></div>).
  var app = document.getElementById('aa-app');
  if (app && !document.getElementById('aa-content')) {
    app.innerHTML = '<div id="aa-content"></div><div class="aa-modal-bg" id="aa-modal"><div class="aa-modal"><button class="aa-modal-close" onclick="AA.closeModal()">&times;</button><div id="aa-modal-content"></div></div></div>';
  }

const STATE = { currentId:null, perspective:null, answers:{}, stepIndex:0, userTier:'free', userEmail:null };
try { const u = JSON.parse(localStorage.getItem('aa_user') || 'null'); if(u){STATE.userTier=u.tier||'free';STATE.userEmail=u.email||null;}}catch(e){}

function inferScore(text){
  if(!text||!text.trim()) return {score:null,confidence:0,rationale:I18N.rNoAnswer};
  const t=text.trim().toLowerCase();
  if(/\b(n\/a|na|don'?t know|skip|not applicable)\b/.test(t)) return {score:'na',confidence:.9,rationale:I18N.rNA};
  if(/\b(never|none|absolutely not|not at all)\b/.test(t)) return {score:1,confidence:.85,rationale:I18N.rNever};
  if(/\b(always|every time|consistently|systematically)\b/.test(t)) return {score:5,confidence:.85,rationale:I18N.rAlways};
  if(/\b(rarely|seldom|hardly|occasionally)/.test(t)) return {score:2,confidence:.75,rationale:I18N.rRarely};
  if(/^no[\s,]+but/.test(t)) return {score:2,confidence:.7,rationale:I18N.rNoBut};
  if(/^no\b/.test(t)) return {score:1,confidence:.7,rationale:I18N.rNo};
  if(/^yes[\s,]+(sometimes|kind of|trying|partly|partially|mostly when)/.test(t)) return {score:3,confidence:.7,rationale:I18N.rYesBut};
  if(/^yes[\s,]+(some teams|in part)/.test(t)) return {score:3,confidence:.7,rationale:I18N.rYesScope};
  if(/^yes\b/.test(t)) return {score:4,confidence:.6,rationale:I18N.rYes};
  if(/\b(sometimes|maybe|in progress|working on)\b/.test(t)) return {score:3,confidence:.6,rationale:I18N.rHedged};
  return {score:3,confidence:.3,rationale:I18N.rDefault};
}

function getRoute(){
  const h=location.hash||'#/';
  const m=h.match(/^#\/(run|results)\/([^\/]+)/);
  if(m) return {view:m[1],id:m[2]};
  return {view:'landing'};
}
window.addEventListener('hashchange',render);

function bootRoute(){
  // Auto-route if data-aa-default-id is set on wrapper
  const wrap = document.getElementById('aa-app');
  const def = wrap && wrap.getAttribute('data-aa-default-id');
  if(def && ASSESSMENTS[def] && !location.hash.includes('/run/') && !location.hash.includes('/results/')) {
    location.hash = '#/run/' + def;
  } else { render(); }
}
if (document.readyState === 'complete') bootRoute();
else window.addEventListener('load', bootRoute);

function render(){
  const r=getRoute();
  const el=document.getElementById('aa-content');
  if(!el) return;
  if(r.view==='landing') el.innerHTML=renderLanding();
  else if(r.view==='run') startOrResume(r.id,el);
  else if(r.view==='results') el.innerHTML=renderResults(r.id);
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderLanding(){
  const liveCards = Object.values(ASSESSMENTS).map(a => `
<div class="aa-card">
  <div class="aa-card-badge"><span class="aa-pill">${I18N.freeLive}</span><span style="font-size:11px;color:#64748b;font-weight:600">${a.minutes} ${I18N.min}</span></div>
  <h3>${a.title}</h3>
  <p class="aa-tag">${a.tagline}</p>
  <p class="aa-desc">${a.description.substring(0,140)}…</p>
  <div class="aa-card-meta"><span>${a.dimensions.length} ${I18N.dimensions}</span><span>${a.questionCount} ${I18N.questions}</span></div>
  <div><a class="aa-btn aa-btn-primary" href="#/run/${a.id}">${I18N.start}</a></div>
</div>`).join('');
  const soonCards = SOON_CARDS.map(s => `
<div class="aa-card aa-soon">
  <div class="aa-card-badge"><span class="aa-pill aa-pill-soon">${s.tag}</span></div>
  <h3>${s.title}</h3>
  <p class="aa-desc">${s.desc}</p>
  <div><a class="aa-btn aa-btn-ghost" href="https://meetings.hubspot.com/john2795">${I18N.notifyMe}</a></div>
</div>`).join('');
  return `<div class="aa-hero"><div class="aa-inner">
<span class="aa-eyebrow" style="display:block;text-align:center;width:fit-content;margin:0 auto">${I18N.freeDiagnostics}</span>
<h1>${I18N.landingH1}</h1>
<p class="aa-sub">${I18N.landingSub.replace('{n}', Object.keys(ASSESSMENTS).length)}</p>
<div class="aa-hero-cta"><a class="aa-btn aa-btn-primary" href="#/run/${Object.keys(ASSESSMENTS)[0]||'innovation-framework'}">${I18N.startNow}</a></div>
<div class="aa-trust-strip"><span>${I18N.trustMinEach}</span><span>·</span><span>${I18N.trustNoLogin}</span><span>·</span><span>${I18N.trustRoadmap}</span></div>
</div></div>
<div class="aa-cards">${liveCards}${soonCards}</div>
<div style="background:linear-gradient(135deg,#053947,#0170B9);color:#fff;padding:50px 24px;text-align:center"><div style="max-width:680px;margin:0 auto">
<h2 style="font-size:26px;color:#fff;margin-bottom:10px">${I18N.landingCtaH2}</h2>
<p style="color:#cbd5e1;margin-bottom:22px">${I18N.landingCtaP}</p>
<button class="aa-btn aa-btn-accent" onclick="AA.signupTrial()">${I18N.landingCtaBtn}</button>
</div></div>`;
}

function startOrResume(id,el){
  if(!ASSESSMENTS[id]) { el.innerHTML=`<div style="padding:60px;text-align:center"><h2>${I18N.unknownAssessment}</h2><a href="#/" class="aa-btn aa-btn-primary">${I18N.backToAll}</a></div>`; return; }
  if(STATE.currentId!==id) { STATE.currentId=id; STATE.stepIndex=0; STATE.perspective=null; STATE.answers={}; }
  renderRunner(el);
}

function flatQuestions(a){const arr=[];a.dimensions.forEach(d=>d.questions.forEach(q=>arr.push({...q,dim:d})));return arr;}

function renderRunner(el){
  const a=ASSESSMENTS[STATE.currentId];
  const qs=flatQuestions(a);
  const totalSteps=qs.length+2;
  const progress=Math.round((STATE.stepIndex/totalSteps)*100);
  let inner=`<div class="aa-runner-inner"><div class="aa-progress"><div class="aa-progress-bar" style="width:${progress}%"></div></div>`;
  if(STATE.stepIndex===0){
    inner+=`<div class="aa-step"><div class="aa-step-meta"><span>${a.title}</span><span>~${a.minutes} ${I18N.min}</span></div>
<h2 style="font-size:28px;font-weight:800;margin-bottom:14px">${a.tagline}</h2>
<p style="margin-bottom:18px;font-size:15px">${a.description}</p>
<div style="display:flex;gap:14px;margin-bottom:18px;flex-wrap:wrap;font-size:13px;color:#64748b;font-weight:600">
<span>${a.dimensions.length} ${I18N.dimensions}</span><span>·</span><span>${a.questionCount} ${I18N.questions}</span><span>·</span><span>${I18N.resultBands}</span>
</div>
<div style="padding:16px;background:#f8fafc;border-radius:10px;font-size:13px;color:#475569;margin-bottom:20px">
<strong style="color:#053947">${I18N.howItWorksLabel}</strong> ${I18N.howItWorksText}
</div>
<div class="aa-nav"><a class="aa-btn aa-btn-ghost" href="#/">${I18N.allAssessments}</a><span class="aa-spacer"></span><button class="aa-btn aa-btn-primary" onclick="AA.next()">${I18N.begin}</button></div></div>`;
  } else if(STATE.stepIndex===1){
    const pq=a.perspectiveQuestion;
    inner+=`<div class="aa-step"><div class="aa-step-meta"><span>${I18N.calibration}</span><span>${I18N.stepOf.replace('{total}', totalSteps-1)}</span></div>
<h2 class="aa-q-text">${pq.prompt}</h2><p class="aa-q-probe">${pq.subtext}</p>
<div style="display:grid;gap:10px;margin-top:6px">
${pq.options.map(o=>`<button onclick="AA.pickPerspective('${o.id}')" style="text-align:left;padding:14px 16px;background:#fff;border:1.5px solid var(--aa-line);border-radius:8px;cursor:pointer;font-size:15px;color:var(--aa-ink)">${o.label}</button>`).join('')}
</div>
<div class="aa-nav"><button class="aa-btn aa-btn-ghost" onclick="AA.prev()">${I18N.back}</button><span class="aa-spacer"></span></div></div>`;
  } else {
    const qIdx=STATE.stepIndex-2;
    const q=qs[qIdx];
    if(!q){el.innerHTML=`<div style="padding:80px;text-align:center"><div style="font-size:50px">🎯</div><h2>${I18N.crunching}</h2></div>`;setTimeout(()=>submit(),700);return;}
    const ans=STATE.answers[q.id]||{text:'',score:null};
    const inf=inferScore(ans.text);
    const display=ans.score!==null?ans.score:inf.score;
    const showReflect=ans.text&&ans.text.trim().length>0;
    inner+=`<div class="aa-step"><div class="aa-step-meta">
<span class="aa-dim-pill" style="background:${q.dim.color}">${q.dim.name}</span><span>${I18N.questionOf.replace('{n}',qIdx+1).replace('{total}',qs.length)}</span></div>
<h2 class="aa-q-text">${q.text}</h2>${q.probe?`<p class="aa-q-probe">${q.probe}</p>`:''}
<textarea class="aa-input" id="aa-input" placeholder="${I18N.answerPlaceholder}" oninput="AA.onAnswerChange(this.value)">${ans.text||''}</textarea>
${showReflect?`<div class="aa-reflect"><span style="font-size:18px">💬</span><div>${inf.score==='na'?I18N.reflectNa:I18N.reflectScore.replace('{n}',inf.score)} — ${inf.rationale.replace(/—.*/,'')}${I18N.reflectSuffix}</div></div>`:''}
<div class="aa-likert">${[1,2,3,4,5].map(n=>`<button class="${display===n?'aa-sel':''}" onclick="AA.pickScore(${n})">${n}</button>`).join('')}<button class="${display==='na'?'aa-sel aa-sel-na':''}" onclick="AA.pickScore('na')">${I18N.na}</button></div>
<div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;margin-top:8px;text-transform:uppercase;letter-spacing:.6px"><span>${I18N.scaleNever}</span><span>${I18N.scaleAlways}</span></div>
<div class="aa-nav"><button class="aa-btn aa-btn-ghost" onclick="AA.prev()">${I18N.back}</button><span class="aa-spacer"></span><button class="aa-btn aa-btn-primary" ${display===null?'disabled':''} onclick="AA.next()">${qIdx===qs.length-1?I18N.submit:I18N.next} &rarr;</button></div></div>`;
  }
  inner+='</div>';
  el.innerHTML=`<div class="aa-runner">${inner}</div>`;
}

function submit(){
  const a=ASSESSMENTS[STATE.currentId];
  const dimScores={};
  a.dimensions.forEach(d=>{
    let sum=0,n=0;
    d.questions.forEach(q=>{const ans=STATE.answers[q.id];if(ans&&ans.score!=='na'&&ans.score!==null){sum+=+ans.score;n++;}});
    dimScores[d.id]=n>0?Math.round((sum/(n*5))*a.perDimMax):0;
  });
  let total=Object.values(dimScores).reduce((s,n)=>s+n,0);
  if(a.normalizeTo) total=Math.round(total*(a.normalizeTo/a.totalMax));
  const maxDisplay=a.normalizeTo||a.totalMax;
  const band=a.bands.find(b=>total>=b.min&&total<=b.max)||a.bands[0];
  const result={assessmentId:a.id,total,maxDisplay,dimScores,band,perspective:STATE.perspective,ts:Date.now()};
  try{sessionStorage.setItem('aa_result',JSON.stringify(result));}catch(e){}
  location.hash='#/results/'+a.id;
}

function renderResults(id){
  const a=ASSESSMENTS[id];
  if(!a) return `<div style="padding:60px;text-align:center">${I18N.noAssessment}</div>`;
  let result=null;try{result=JSON.parse(sessionStorage.getItem('aa_result')||'null');}catch(e){}
  if(!result||result.assessmentId!==id) return `<div style="padding:80px;text-align:center"><h2>${I18N.noResultsTitle}</h2><p style="margin:16px 0">${I18N.noResultsTake.replace('{title}',a.title)}</p><a class="aa-btn aa-btn-primary" href="#/run/${id}">${I18N.startAssessment}</a></div>`;
  if(!STATE.userEmail) return renderEmailGate(a,result);
  const isPaid=STATE.userTier==='trial'||STATE.userTier==='paid';
  const radarSvg=buildRadar(a,result);
  const dimsHtml=a.dimensions.map(d=>{const s=result.dimScores[d.id]||0;const pct=Math.round((s/a.perDimMax)*100);return `<div class="aa-dim-row"><div style="font-size:13px;font-weight:600">${d.name}</div><div class="aa-dim-bar"><div class="aa-dim-fill" style="width:${pct}%;background:${d.color}"></div></div><div class="aa-dim-score">${s}/${a.perDimMax}</div></div>`;}).join('');
  let html=`<div class="aa-results"><div class="aa-results-inner">
<div class="aa-score-hero"><div style="font-size:42px">🎉</div><div class="aa-score-num">${result.total}</div><div class="aa-score-out">${I18N.outOf.replace('{n}',result.maxDisplay)}</div>
<div class="aa-score-band">${result.band.name}</div><div class="aa-score-head">${result.band.headline}</div></div>
<div class="aa-grid-2">
<div class="aa-panel"><h3>${I18N.scoredByDimension}</h3>${dimsHtml}<div class="aa-hint"><strong>${I18N.diagnosticHint}</strong> ${result.band.hint||''}</div></div>
<div class="aa-panel"><h3>${I18N.shapeGlance}</h3><div class="aa-radar-wrap">${radarSvg}</div></div>
</div>
<div class="aa-panel" style="margin-bottom:22px"><h3>${I18N.scoreMeans}</h3><p style="font-size:15px;line-height:1.65">${result.band.summary}</p></div>`;
  if(isPaid){
    const plan=a.plans[result.band.id];
    html+=`<div class="aa-plan-grid">
<div class="aa-plan-card"><h4>${I18N.days30}</h4>${plan.d30.map(x=>`<div class="aa-plan-action"><strong>${x.t}</strong>${x.d}</div>`).join('')}</div>
<div class="aa-plan-card"><h4>${I18N.days60}</h4>${plan.d60.map(x=>`<div class="aa-plan-action"><strong>${x.t}</strong>${x.d}</div>`).join('')}</div>
<div class="aa-plan-card"><h4>${I18N.days90}</h4>${plan.d90.map(x=>`<div class="aa-plan-action"><strong>${x.t}</strong>${x.d}</div>`).join('')}</div></div>
<div class="aa-panel"><h3>${I18N.recommendedReading}</h3><div class="aa-reading">${plan.reading.map(b=>`<div class="aa-book"><strong>${b.t}</strong>${b.a} · ${b.y}</div>`).join('')}</div></div>
<div style="text-align:center;margin-top:28px"><button class="aa-btn aa-btn-primary" onclick="window.print()">${I18N.downloadPdf}</button> <a class="aa-btn aa-btn-ghost" href="#/">${I18N.allAssessments}</a></div>`;
  } else {
    html+=`<div class="aa-gate"><div class="aa-gate-inner">
<div><span class="aa-eyebrow" style="background:rgba(251,191,36,.2);color:#fbbf24">${I18N.gateEyebrow}</span>
<h2 style="margin-top:14px">${I18N.gateH2}</h2>
<p>${I18N.gateP}</p>
<button class="aa-btn aa-btn-accent" onclick="AA.signupTrial()">${I18N.gateBtn}</button> &nbsp; <a class="aa-btn aa-btn-ghost" style="color:#fff;border-color:#fff" href="https://meetings.hubspot.com/john2795">${I18N.talkToMark}</a>
</div>
<div class="aa-pricing"><div style="font-size:11px;color:#fbbf24;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">${I18N.afterTrial}</div>
<div class="aa-amt">${I18N.price}</div><div class="aa-per">${I18N.pricePer}</div>
<ul><li>${I18N.priceLi1}</li><li>${I18N.priceLi2}</li><li>${I18N.priceLi3}</li><li>${I18N.priceLi4}</li><li>${I18N.priceLi5}</li></ul></div>
</div></div>`;
  }
  // Cross-promote next assessment
  const otherIds=Object.keys(ASSESSMENTS).filter(x=>x!==id);
  if(otherIds.length){
    const next=ASSESSMENTS[otherIds[0]];
    html+=`<div style="text-align:center;margin-top:28px;padding:22px;background:#fff;border:1px dashed var(--aa-line);border-radius:12px">
<p style="font-size:13px;color:#64748b;margin-bottom:10px">${I18N.doneWithThis}</p>
<a class="aa-btn aa-btn-ghost" href="#/run/${next.id}">${I18N.tryNext.replace('{title}',next.title)}</a></div>`;
  }
  html+='</div></div>';
  return html;
}

function buildRadar(a,result){
  const dims=a.dimensions;const n=dims.length;const cx=160,cy=160,R=130;
  const angle=i=>-Math.PI/2+(i*2*Math.PI/n);
  const pt=(i,r)=>[cx+r*Math.cos(angle(i)),cy+r*Math.sin(angle(i))];
  let grid='';
  for(let g=0.25;g<=1;g+=0.25){const poly=dims.map((_,i)=>pt(i,R*g).join(',')).join(' ');grid+=`<polygon points="${poly}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;}
  let axes='',labels='';
  dims.forEach((d,i)=>{const[x,y]=pt(i,R);axes+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;const[lx,ly]=pt(i,R+18);const anchor=lx<cx-4?'end':lx>cx+4?'start':'middle';labels+=`<text x="${lx}" y="${ly+4}" font-size="10" font-weight="600" fill="#475569" text-anchor="${anchor}">${d.name.split(' ').slice(0,2).join(' ')}</text>`;});
  const dataPoly=dims.map((d,i)=>{const s=result.dimScores[d.id]||0;return pt(i,R*s/a.perDimMax).join(',');}).join(' ');
  const points=dims.map((d,i)=>{const s=result.dimScores[d.id]||0;const[x,y]=pt(i,R*s/a.perDimMax);return `<circle cx="${x}" cy="${y}" r="4" fill="${d.color}" stroke="#fff" stroke-width="2"/>`;}).join('');
  return `<svg class="aa-radar" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">${grid}${axes}<polygon points="${dataPoly}" fill="rgba(1,112,185,0.18)" stroke="#0170B9" stroke-width="2"/>${points}${labels}</svg>`;
}

function renderEmailGate(a,result){return `<div class="aa-results"><div class="aa-results-inner">
<div class="aa-score-hero" style="background:linear-gradient(135deg,#053947,#0170B9)">
<div style="font-size:42px">🎉</div>
<h2 style="color:#fff;font-size:30px;font-weight:800;margin:0 0 10px">${I18N.allDone}</h2>
<p style="color:#cbd5e1;font-size:16px;max-width:540px;margin:0 auto 22px">${I18N.gateIntro.replace('{title}',a.title)}</p>
<div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:22px;max-width:440px;margin:0 auto;text-align:left">
<div class="aa-form-field"><label style="color:#fff">${I18N.workEmailLabel}</label><input type="email" id="aa-gate-email" placeholder="${I18N.emailPlaceholder}" style="background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.3);color:#fff"/></div>
<div class="aa-form-field"><label style="color:#fff">${I18N.firstNameOptional}</label><input type="text" id="aa-gate-name" placeholder="${I18N.namePlaceholder}" style="background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.3);color:#fff"/></div>
<div id="aa-gate-err" style="font-size:13px;color:#fca5a5;margin-bottom:10px;display:none"></div>
<button class="aa-btn aa-btn-accent" style="width:100%" onclick="AA.unlockResults('${a.id}')">${I18N.seeResults}</button>
<p style="font-size:11px;color:#cbd5e1;text-align:center;margin-top:10px">${I18N.noSpam}</p>
</div></div></div></div>`;}

window.AA={
  next(){const a=ASSESSMENTS[STATE.currentId];const qs=flatQuestions(a);const ts=qs.length+2;if(STATE.stepIndex>=ts-1){submit();return;}STATE.stepIndex++;renderRunner(document.getElementById('aa-content'));window.scrollTo({top:0,behavior:'smooth'});},
  prev(){if(STATE.stepIndex===0){location.hash='#/';return;}STATE.stepIndex--;renderRunner(document.getElementById('aa-content'));window.scrollTo({top:0,behavior:'smooth'});},
  pickPerspective(id){STATE.perspective=id;AA.next();},
  onAnswerChange(text){const a=ASSESSMENTS[STATE.currentId];const qs=flatQuestions(a);const q=qs[STATE.stepIndex-2];if(!q)return;const inf=inferScore(text);const e=STATE.answers[q.id]||{};STATE.answers[q.id]={text,score:e.score!=null?e.score:inf.score};renderRunner(document.getElementById('aa-content'));setTimeout(()=>{const ta=document.getElementById('aa-input');if(ta){ta.focus();ta.setSelectionRange(text.length,text.length);}},0);},
  pickScore(n){const a=ASSESSMENTS[STATE.currentId];const qs=flatQuestions(a);const q=qs[STATE.stepIndex-2];if(!q)return;const e=STATE.answers[q.id]||{text:''};STATE.answers[q.id]={text:e.text,score:n};renderRunner(document.getElementById('aa-content'));},
  openModal(html){document.getElementById('aa-modal-content').innerHTML=html;document.getElementById('aa-modal').classList.add('aa-open');},
  closeModal(){document.getElementById('aa-modal').classList.remove('aa-open');},
  signupTrial(){AA.openModal(`<h3 style="font-size:22px;font-weight:800;margin-bottom:8px">${I18N.trialTitle}</h3>
<p style="margin-bottom:16px">${I18N.trialDesc}</p>
<div class="aa-form-field"><label>${I18N.workEmail}</label><input type="email" id="aa-trial-email" placeholder="${I18N.emailPlaceholder}"/></div>
<div class="aa-form-field"><label>${I18N.firstName}</label><input type="text" id="aa-trial-name" placeholder="${I18N.namePlaceholder}"/></div>
<div id="aa-trial-err" style="font-size:13px;color:#dc2626;margin-bottom:10px;display:none"></div>
<button class="aa-btn aa-btn-primary" style="width:100%" onclick="AA.activateTrial()">${I18N.activateTrial}</button>
<p style="font-size:11px;color:#64748b;text-align:center;margin-top:10px">${I18N.trialFinePrint}</p>`);},
  unlockResults(id){const e=document.getElementById('aa-gate-email').value.trim();const err=document.getElementById('aa-gate-err');if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){err.style.display='block';err.textContent=I18N.invalidEmail;return;}const n=document.getElementById('aa-gate-name').value.trim();STATE.userEmail=e;try{localStorage.setItem('aa_user',JSON.stringify({tier:'free',email:e,name:n,ts:Date.now()}));}catch(_){}render();},
  activateTrial(){const e=document.getElementById('aa-trial-email').value.trim();const err=document.getElementById('aa-trial-err');if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){err.style.display='block';err.textContent=I18N.invalidEmail;return;}const n=document.getElementById('aa-trial-name').value.trim();STATE.userTier='trial';STATE.userEmail=e;try{localStorage.setItem('aa_user',JSON.stringify({tier:'trial',email:e,name:n,ts:Date.now(),trialEnds:Date.now()+14*24*60*60*1000}));}catch(_){}AA.closeModal();render();}
};
})();
