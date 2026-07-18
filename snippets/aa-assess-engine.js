/* ============================================================
   Agile Agilist — Assessment Engine (shared, language-agnostic)
   ------------------------------------------------------------
   INSTALL (once): wp-admin → WPCode → Add Snippet → Custom Code →
   type: JavaScript Snippet → paste all of this → Auto Insert →
   "Site Wide Footer" → Save & Activate. Name "AA – Assessment Engine".

   HOW PAGES USE IT
   A translated assessment page contains ONLY data (no executable JS), e.g.:
     <div class="aa-mat" id="aa-mat">
       … translated hero markup …
       <div class="aa-assess"></div>
       <script type="application/json" class="aa-assess-cfg">{ …config… }<\/script>
     </div>
   The engine reads the JSON config and renders the interactive quiz. Because
   the page holds only JSON data (no executable JS patterns at all),
   it pushes through the content API cleanly — no block-editor paste needed.

   Supported config.type: "dimensions" (N dimensions × M levels → radar + score).
   Add more types (recommender, scored-linear) here as new assessments need them.
   ============================================================ */
(function () {
  /* ---------- styles (injected once) ---------- */
  var CSS =
  '.aa-mat{--t:#127E88;--td:#0B2E35;--nv:#0E3A44;--tl:#8FCFCF;--bd:#DCEAEA;--bds:#C7DEDE;--bg:#F5FAFA;--mu:#5E7378;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--nv);width:100%;max-width:1280px;margin-left:auto;margin-right:auto;overflow-x:clip}'+
  '.aa-mat em{font-style:italic}.aa-mat-eb{display:inline-block;font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--tl)}'+
  '.aa-mat-hero{position:relative;overflow:hidden;background:radial-gradient(120% 130% at 15% 0%,#123f47 0%,var(--td) 55%,#08222860 100%),var(--td);padding:82px 24px 66px;text-align:center;color:#fff}'+
  '.aa-mat-hero-in{max-width:780px;margin:0 auto;position:relative;z-index:2}.aa-mat-hero .aa-mat-eb{padding:6px 15px;border:1px solid rgba(143,207,207,.35);border-radius:30px;margin-bottom:18px}'+
  '.aa-mat-hero h1{font-family:"Newsreader",Georgia,serif;font-weight:500;font-size:46px;line-height:1.1;letter-spacing:-.02em;margin:0 auto 16px;color:#fff}.aa-mat-hero h1 em{color:var(--tl)}'+
  '.aa-mat-hero p{font-size:18px;line-height:1.6;color:#D6E7E7;margin:0 auto 16px;max-width:600px}.aa-mat-hero .note{font-size:12.5px;color:#9fc4c4;letter-spacing:.02em}'+
  '.aa-mat-scale{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:22px}.aa-mat-scale span{font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.04em;color:#D6E7E7;background:rgba(255,255,255,.05);border:1px solid rgba(143,207,207,.22);border-radius:100px;padding:5px 12px}.aa-mat-scale span b{color:var(--tl);font-weight:600}'+
  '@media(max-width:780px){.aa-mat-hero h1{font-size:33px}}'+
  '.aa-mat-app{background:var(--bg);padding:56px 24px 72px}.aa-mat-in{max-width:860px;margin:0 auto}.aa-mat-intro{text-align:center;font-size:15.5px;color:var(--mu);line-height:1.6;margin:0 auto 34px;max-width:620px}'+
  '.aa-mat-dim{background:#fff;border:1px solid var(--bd);border-radius:16px;padding:26px 26px 22px;margin-bottom:18px}.aa-mat-dim-h{display:flex;align-items:baseline;gap:10px;margin-bottom:4px}.aa-mat-dim-n{font-family:ui-monospace,Menlo,monospace;font-size:12px;font-weight:700;color:var(--t)}'+
  '.aa-mat-dim-h h3{font-family:"Newsreader",Georgia,serif;font-weight:500;font-size:23px;color:var(--nv);margin:0;letter-spacing:-.01em}.aa-mat-dim-sub{font-size:13px;color:var(--mu);margin:0 0 16px}'+
  '.aa-mat-opts{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}@media(max-width:720px){.aa-mat-opts{grid-template-columns:1fr}}'+
  '.aa-mat-opt{border:1.5px solid var(--bd);border-radius:11px;padding:12px 12px 13px;cursor:pointer;background:#fff;transition:border-color .15s,background .15s,box-shadow .15s;display:flex;flex-direction:column;gap:7px;position:relative}'+
  '.aa-mat-opt:hover{border-color:var(--tl);background:#FBFDFD}.aa-mat-opt.sel{border-color:var(--t);background:#EAF6F7;box-shadow:0 8px 22px -14px rgba(18,126,136,.5)}'+
  '.aa-mat-opt-lv{display:flex;align-items:center;gap:6px;font-family:ui-monospace,Menlo,monospace;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--mu)}.aa-mat-opt.sel .aa-mat-opt-lv{color:var(--t)}'+
  '.aa-mat-opt-dot{width:16px;height:16px;border-radius:50%;border:2px solid var(--bds);flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center}.aa-mat-opt.sel .aa-mat-opt-dot{border-color:var(--t);background:var(--t)}.aa-mat-opt.sel .aa-mat-opt-dot::after{content:"";width:6px;height:6px;border-radius:50%;background:#fff}'+
  '.aa-mat-opt ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}.aa-mat-opt li{font-size:12px;line-height:1.4;color:var(--nv);padding-left:12px;position:relative}.aa-mat-opt li::before{content:"";position:absolute;left:0;top:7px;width:4px;height:4px;border-radius:50%;background:var(--tl)}'+
  '.aa-mat-submit-row{text-align:center;margin-top:28px}.aa-mat-btn{display:inline-flex;align-items:center;gap:8px;padding:15px 34px;border-radius:100px;font-size:15px;font-weight:600;text-decoration:none;border:none;cursor:pointer;transition:all .18s;font-family:inherit}'+
  '.aa-mat-btn.p{background:var(--t);color:#fff;box-shadow:0 6px 18px -6px rgba(18,126,136,.6)}.aa-mat-btn.p:hover{background:var(--td);transform:translateY(-2px)}.aa-mat-btn.p:disabled{background:var(--bds);color:#fff;cursor:not-allowed;box-shadow:none;transform:none}'+
  '.aa-mat-btn.g{background:#fff;color:var(--nv);border:1.5px solid var(--bd)}.aa-mat-btn.g:hover{border-color:var(--t);color:var(--t)}.aa-mat-hint{font-size:12.5px;color:var(--mu);margin-top:12px}'+
  '.aa-mat-res{margin-top:8px;scroll-margin-top:100px}.aa-mat-res-card{background:linear-gradient(160deg,#123f47,var(--td));color:#fff;border-radius:20px;padding:38px 32px;text-align:center;position:relative;overflow:hidden}'+
  '.aa-mat-res-card .lab{font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--tl);margin-bottom:10px}.aa-mat-res-stage{font-family:"Newsreader",Georgia,serif;font-weight:500;font-size:52px;line-height:1;color:#fff;margin:0 0 6px;letter-spacing:-.02em}'+
  '.aa-mat-res-score{font-size:14px;color:#D6E7E7}.aa-mat-res-score b{color:#fff}.aa-mat-res-desc{font-size:15px;color:#E4F1F1;line-height:1.6;max-width:560px;margin:14px auto 0}'+
  '.aa-mat-dash{display:grid;grid-template-columns:320px 1fr;gap:18px;margin-top:18px}@media(max-width:720px){.aa-mat-dash{grid-template-columns:1fr}}.aa-mat-panel{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:22px 22px 20px}'+
  '.aa-mat-panel .cap{font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);margin-bottom:12px}.aa-mat-radar{display:block;width:100%;max-width:300px;margin:0 auto}.aa-mat-radar text{font-family:Inter,system-ui,sans-serif;font-size:9.5px;font-weight:600;fill:var(--nv)}'+
  '.aa-mat-kpis{display:grid;grid-template-columns:1fr 1fr;gap:12px}.aa-mat-kpi{background:var(--bg);border:1px solid var(--bd);border-radius:12px;padding:14px 16px}.aa-mat-kpi .k{font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:var(--mu)}.aa-mat-kpi .v{font-family:"Newsreader",Georgia,serif;font-weight:500;font-size:26px;color:var(--t);line-height:1.1;margin-top:5px}.aa-mat-kpi .s{font-size:11.5px;color:var(--mu);margin-top:3px}'+
  '.aa-mat-track{margin-top:18px}.aa-mat-track-bar{display:flex;gap:4px}.aa-mat-track-seg{flex:1;height:10px;border-radius:5px;background:var(--bd)}.aa-mat-track-seg.on{background:var(--t)}.aa-mat-track-labels{display:flex;justify-content:space-between;margin-top:8px;font-family:ui-monospace,Menlo,monospace;font-size:9.5px;color:var(--mu)}.aa-mat-track-labels span.cur{color:var(--t);font-weight:700}'+
  '.aa-mat-profile{margin-top:22px;background:#fff;border:1px solid var(--bd);border-radius:18px;padding:28px 28px 24px}.aa-mat-profile h4{font-family:"Newsreader",Georgia,serif;font-weight:500;font-size:22px;color:var(--nv);margin:0 0 18px}'+
  '.aa-mat-row{padding:16px 0;border-top:1px solid var(--bd)}.aa-mat-row:first-of-type{border-top:0;padding-top:0}.aa-mat-row-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:9px}.aa-mat-row-name{font-size:14.5px;font-weight:600;color:var(--nv)}.aa-mat-row-lv{font-family:ui-monospace,Menlo,monospace;font-size:12px;font-weight:700;color:var(--t);white-space:nowrap}'+
  '.aa-mat-meter{display:flex;gap:5px}.aa-mat-seg{flex:1;height:8px;border-radius:6px;background:var(--bd)}.aa-mat-seg.on{background:var(--t)}.aa-mat-row-next{font-size:12.5px;color:var(--mu);line-height:1.5;margin:9px 0 0}.aa-mat-row-next b{color:var(--nv);font-weight:600}'+
  '.aa-mat-focus{margin-top:22px;background:#EAF6F7;border:1px solid var(--bds);border-radius:16px;padding:24px 26px}.aa-mat-focus .aa-mat-eb{color:var(--t);margin-bottom:8px}.aa-mat-focus h4{font-family:"Newsreader",Georgia,serif;font-weight:500;font-size:21px;color:var(--nv);margin:0 0 8px}.aa-mat-focus p{font-size:14px;color:var(--mu);line-height:1.6;margin:0}.aa-mat-focus strong{color:var(--nv);font-weight:600}'+
  '.aa-mat-cta{margin-top:26px;text-align:center}.aa-mat-cta p{font-size:15px;color:var(--mu);margin:0 auto 16px;max-width:460px;line-height:1.6}.aa-mat-cta .aa-mat-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}'+
  '.aa-mat[dir="rtl"] .aa-mat-opt li{padding-left:0;padding-right:12px}.aa-mat[dir="rtl"] .aa-mat-opt li::before{left:auto;right:0}';

  function injectCSS() {
    if (document.getElementById('aa-assess-css')) return;
    var s = document.createElement('style'); s.id = 'aa-assess-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(x){ return x; } // config strings are trusted author content (may contain <em> etc.)

  /* ---------- type: dimensions ---------- */
  function renderDimensions(mount, cfg) {
    var LEVELS = cfg.levels, SHORT = cfg.short, DIMS = cfg.dims, STAGE_DESC = cfg.stageDesc,
        UI = cfg.ui || {}, CTA = cfg.cta || {}, N = DIMS.length, NL = LEVELS.length;
    var app = document.createElement('section'); app.className = 'aa-mat-app';
    app.innerHTML =
      '<div class="aa-mat-in">'+
        '<p class="aa-mat-intro">'+(UI.intro||'')+'</p>'+
        '<div class="aa-mat-quiz"></div>'+
        '<div class="aa-mat-submit-row">'+
          '<button class="aa-mat-btn p" type="button" data-sub disabled>'+(UI.submit||'See results')+' &rarr;</button>'+
          '<div class="aa-mat-hint" data-hint>'+(UI.hint||'')+'</div>'+
        '</div>'+
        '<div class="aa-mat-res" data-res hidden></div>'+
      '</div>';
    mount.appendChild(app);
    var quiz = app.querySelector('.aa-mat-quiz'), submit = app.querySelector('[data-sub]'),
        hint = app.querySelector('[data-hint]'), res = app.querySelector('[data-res]');
    var picks = DIMS.map(function(){return null;});

    DIMS.forEach(function(d, di){
      var opts = '';
      d.o.forEach(function(items, li){
        var lis = items.map(function(x){return '<li>'+x+'</li>';}).join('');
        opts += '<div class="aa-mat-opt" data-d="'+di+'" data-l="'+li+'" role="button" tabindex="0">'+
          '<div class="aa-mat-opt-lv"><span class="aa-mat-opt-dot"></span>'+(li+1)+' &middot; '+LEVELS[li]+'</div><ul>'+lis+'</ul></div>';
      });
      var dim = document.createElement('div'); dim.className = 'aa-mat-dim';
      dim.innerHTML = '<div class="aa-mat-dim-h"><span class="aa-mat-dim-n">( 0'+(di+1)+' )</span><h3>'+d.n+'</h3></div>'+
        '<p class="aa-mat-dim-sub">'+d.s+'</p><div class="aa-mat-opts">'+opts+'</div>';
      quiz.appendChild(dim);
    });

    function choose(el){
      var di=+el.getAttribute('data-d'), li=+el.getAttribute('data-l');
      picks[di]=li;
      el.parentNode.querySelectorAll('.aa-mat-opt').forEach(function(s){s.classList.remove('sel');});
      el.classList.add('sel');
      var done = picks.every(function(p){return p!==null;});
      submit.disabled = !done;
      if (done) hint.textContent = UI.ready || '';
    }
    quiz.addEventListener('click', function(e){var o=e.target.closest('.aa-mat-opt'); if(o) choose(o);});
    quiz.addEventListener('keydown', function(e){ if(e.key===' '||e.key==='Enter'){var o=e.target.closest('.aa-mat-opt'); if(o){e.preventDefault();choose(o);}}});

    function stageFor(score){ var i=Math.round(score)-1; if(i<0)i=0; if(i>NL-1)i=NL-1; return LEVELS[i]; }

    function radarSVG(vals){
      var size=300,c=size/2,R=c-62,n=vals.length;
      function ang(i){return Math.PI*2*i/n - Math.PI/2;}
      function pt(i,r){return [c+Math.cos(ang(i))*r, c+Math.sin(ang(i))*r];}
      var g='';
      for(var lv=1;lv<=NL;lv++){var rr=R*lv/NL,ps=[];for(var i=0;i<n;i++){var p=pt(i,rr);ps.push(p[0].toFixed(1)+','+p[1].toFixed(1));}g+='<polygon points="'+ps.join(' ')+'" fill="none" stroke="#DCEAEA" stroke-width="1"/>';}
      for(var i=0;i<n;i++){var p=pt(i,R);g+='<line x1="'+c+'" y1="'+c+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="#DCEAEA" stroke-width="1"/>';}
      var dp=[],dots='';
      for(var i=0;i<n;i++){var p=pt(i,R*vals[i]/NL);dp.push(p[0].toFixed(1)+','+p[1].toFixed(1));dots+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4.5" fill="#127E88"/>';}
      var labs='',dys=[-8,4,16,4];
      for(var i=0;i<n;i++){var p=pt(i,R+16);labs+='<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+(dys[i%4])).toFixed(1)+'" text-anchor="middle">'+SHORT[i]+'</text>';}
      return '<svg class="aa-mat-radar" viewBox="0 0 '+size+' '+size+'" role="img">'+g+'<polygon points="'+dp.join(' ')+'" fill="rgba(18,126,136,.16)" stroke="#127E88" stroke-width="2" stroke-linejoin="round"/>'+dots+labs+'</svg>';
    }

    submit.addEventListener('click', function(){
      if (picks.some(function(p){return p===null;})) return;
      var scores = picks.map(function(p){return p+1;});
      var avg = scores.reduce(function(a,b){return a+b;},0)/scores.length;
      var stage = stageFor(avg), stageIdx = LEVELS.indexOf(stage);
      var maxv=Math.max.apply(null,scores), minv=Math.min.apply(null,scores);
      var strongIdx=scores.indexOf(maxv), weakIdx=scores.indexOf(minv);
      var tsegs='',tlabs='';
      for(var t=0;t<NL;t++){tsegs+='<div class="aa-mat-track-seg'+(t<=stageIdx?' on':'')+'"></div>';tlabs+='<span'+(t===stageIdx?' class="cur"':'')+'>'+LEVELS[t]+'</span>';}
      var kpis=
        '<div class="aa-mat-kpi"><div class="k">'+UI.kOverall+'</div><div class="v">'+stage+'</div><div class="s">'+UI.stageOfPre+' '+(stageIdx+1)+' '+UI.of+' '+NL+'</div></div>'+
        '<div class="aa-mat-kpi"><div class="k">'+UI.kScore+'</div><div class="v">'+avg.toFixed(1)+'</div><div class="s">'+UI.outOf+'</div></div>'+
        '<div class="aa-mat-kpi"><div class="k">'+UI.kStrong+'</div><div class="v" style="font-size:17px">'+SHORT[strongIdx]+'</div><div class="s">'+LEVELS[maxv-1]+'</div></div>'+
        '<div class="aa-mat-kpi"><div class="k">'+UI.kFocus+'</div><div class="v" style="font-size:17px">'+SHORT[weakIdx]+'</div><div class="s">'+LEVELS[minv-1]+'</div></div>';
      var dash='<div class="aa-mat-dash"><div class="aa-mat-panel"><div class="cap">'+UI.radarCap+'</div>'+radarSVG(scores)+'</div>'+
        '<div class="aa-mat-panel"><div class="cap">'+UI.glanceCap+'</div><div class="aa-mat-kpis">'+kpis+'</div>'+
        '<div class="aa-mat-track"><div class="aa-mat-track-bar">'+tsegs+'</div><div class="aa-mat-track-labels">'+tlabs+'</div></div></div></div>';
      var rows='';
      DIMS.forEach(function(d,di){
        var lv=picks[di],segs='';
        for(var i=0;i<NL;i++){segs+='<span class="aa-mat-seg'+(i<=lv?' on':'')+'"></span>';}
        var next;
        if(lv<NL-1){var ni=d.o[lv+1].join(' &middot; ');next='<p class="aa-mat-row-next"><b>'+UI.nextPre+LEVELS[lv+1]+UI.nextSuf+'</b> '+ni+'</p>';}
        else{next='<p class="aa-mat-row-next">'+UI.top+'</p>';}
        rows+='<div class="aa-mat-row"><div class="aa-mat-row-top"><span class="aa-mat-row-name">'+d.n+'</span><span class="aa-mat-row-lv">'+(lv+1)+' &middot; '+LEVELS[lv]+'</span></div><div class="aa-mat-meter">'+segs+'</div>'+next+'</div>';
      });
      var min=Math.min.apply(null,picks);
      var lowNames=DIMS.filter(function(d,di){return picks[di]===min;}).map(function(d){return d.n;});
      var multi=lowNames.length>1;
      var focusHtml='<span class="aa-mat-eb">'+UI.focusEb+'</span><h4>'+UI.focusStart+' '+lowNames.join(' & ')+'.</h4>'+
        '<p>'+UI.focusMid+' '+(multi?UI.focusAre:UI.focusIs)+' <strong>'+lowNames.join(' & ')+'</strong> '+UI.focusAt+' <strong>'+LEVELS[min]+'</strong>. '+UI.focusTail+'</p>';
      var ctaBtns='<a class="aa-mat-btn p" href="'+CTA.primary.href+'">'+CTA.primary.label+' &rarr;</a>'+
        (CTA.secondary?'<a class="aa-mat-btn g" href="'+CTA.secondary.href+'">'+CTA.secondary.label+'</a>':'')+
        '<button class="aa-mat-btn g" type="button" data-print>'+UI.print+'</button>'+
        '<button class="aa-mat-btn g" type="button" data-retake>'+UI.retake+'</button>';
      res.innerHTML=
        '<div class="aa-mat-res-card"><div class="lab">'+UI.resultLab+'</div><div class="aa-mat-res-stage">'+stage+'</div>'+
        '<div class="aa-mat-res-score">'+UI.scorePre+' <b>'+avg.toFixed(1)+' / '+NL+'.0</b> &middot; '+UI.stageWord+' '+(stageIdx+1)+' '+UI.of+' '+NL+'</div>'+
        '<p class="aa-mat-res-desc">'+STAGE_DESC[stage]+'</p></div>'+dash+
        '<div class="aa-mat-profile"><h4>'+UI.profileH+'</h4>'+rows+'</div>'+
        '<div class="aa-mat-focus">'+focusHtml+'</div>'+
        '<div class="aa-mat-cta"><p>'+CTA.text+'</p><div class="aa-mat-btns">'+ctaBtns+'</div></div>';
      res.hidden=false; res.scrollIntoView({behavior:'smooth',block:'start'});
      var pr=res.querySelector('[data-print]'); if(pr) pr.addEventListener('click',function(){window.print();});
      var rt=res.querySelector('[data-retake]'); if(rt) rt.addEventListener('click',function(){
        picks=DIMS.map(function(){return null;});
        quiz.querySelectorAll('.aa-mat-opt').forEach(function(s){s.classList.remove('sel');});
        submit.disabled=true; hint.textContent=UI.hint||''; res.hidden=true; res.innerHTML='';
        mount.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
  }

  var RENDERERS = { dimensions: renderDimensions };

  function boot(){
    injectCSS();
    var mounts = document.querySelectorAll('.aa-assess');
    for (var i=0;i<mounts.length;i++){
      var mount = mounts[i];
      if (mount.getAttribute('data-aa-done')) continue;
      var cfgEl = mount.parentNode.querySelector('.aa-assess-cfg') || document.querySelector('.aa-assess-cfg');
      if (!cfgEl) continue;
      var cfg; try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { continue; }
      var fn = RENDERERS[cfg.type]; if (!fn) continue;
      mount.setAttribute('data-aa-done','1');
      fn(mount, cfg);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
