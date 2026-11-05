/* Agile Agilist training menu. No dependencies. Enhances server-rendered markup. */
(function(){
  var KEY='aa_mm_sel',RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function load(){try{return JSON.parse(sessionStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function save(a){try{sessionStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
  function init(root){
    var rail=root.querySelector('.aa-mm__rail'),pill=rail.querySelector('.aa-mm__pill'),
        tabs=[].slice.call(rail.querySelectorAll('.aa-mm__tab')),
        panels=[].slice.call(root.querySelectorAll('.aa-mm__panel[data-cat]')),
        host=root.querySelector('.aa-mm__panels'),results=root.querySelector('.aa-mm__results'),
        rgrid=results.querySelector('.aa-mm__grid'),rstatus=results.querySelector('.aa-mm__status'),rtitle=results.querySelector('[data-aa-mm-rtitle]'),
        input=root.querySelector('.aa-mm__search input'),trayw=root.querySelector('.aa-mm__trayw'),
        chips=root.querySelector('.aa-mm__chips'),count=root.querySelector('[data-aa-mm-count]'),
        cta=root.querySelector('[data-aa-mm-cta]'),head=root.querySelector('.aa-mm__trayhead'),
        clear=root.querySelector('.aa-mm__clear'),live=root.querySelector('.aa-mm__sr'),
        cards={},sel=load(),cur=root.getAttribute('data-default')||tabs[0].getAttribute('data-cat');
    panels.forEach(function(p){[].forEach.call(p.querySelectorAll('.aa-mm__card'),function(c){var id=c.getAttribute('data-id');(cards[id]=cards[id]||{el:c,cats:[]}).cats.push(p.getAttribute('data-name'))})});
    var ok=sel.filter(function(id){return cards[id]});if(ok.length!==sel.length){sel=ok;save(sel)}
    function say(t){live.textContent='';setTimeout(function(){live.textContent=t},30)}

    function movePill(){
      var t=tabs.filter(function(x){return x.getAttribute('aria-selected')==='true'})[0];
      if(!t){pill.style.opacity=0;return}
      pill.style.opacity=1;pill.style.setProperty('--c',t.style.getPropertyValue('--c'));
      pill.style.width=t.offsetWidth+'px';pill.style.height=t.offsetHeight+'px';
      pill.style.transform='translate('+t.offsetLeft+'px,'+t.offsetTop+'px)';
      if(rail.scrollWidth>rail.clientWidth+2)rail.scrollTo({left:t.offsetLeft-(rail.clientWidth-t.offsetWidth)/2,behavior:RM?'auto':'smooth'});
    }
    function show(cat,dir){
      cur=cat;root.style.setProperty('--dx',(dir||0)*28+'px');
      tabs.forEach(function(t){var on=t.getAttribute('data-cat')===cat;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1});
      panels.forEach(function(p){p.classList.toggle('is-off',p.getAttribute('data-cat')!==cat)});
      results.classList.add('is-off');movePill();
    }
    function go(step){var i=tabs.findIndex(function(t){return t.getAttribute('data-cat')===cur});var n=Math.max(0,Math.min(tabs.length-1,i+step));if(n!==i){input.value='';show(tabs[n].getAttribute('data-cat'),step)}}
    function bump(){count.classList.remove('bump');void count.offsetWidth;count.classList.add('bump')}
    function fly(btn){
      if(RM)return;requestAnimationFrame(function(){
        var a=btn.getBoundingClientRect(),b=count.getBoundingClientRect();if(!b.width)return;
        var d=document.createElement('span');d.className='aa-mm__fly';d.style.left=(a.left+a.width/2-9)+'px';d.style.top=(a.top+a.height/2-9)+'px';document.body.appendChild(d);
        var dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
        var an=d.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+dx*.55+'px,'+(dy*.55-70)+'px) scale(1.25)',opacity:1,offset:.5},{transform:'translate('+dx+'px,'+dy+'px) scale(.4)',opacity:.5}],{duration:650,easing:'cubic-bezier(.5,0,.3,1)'});
        an.onfinish=function(){d.remove();bump()};
      });
    }
    function sync(){
      root.querySelectorAll('.aa-mm__card').forEach(function(c){
        var on=sel.indexOf(c.getAttribute('data-id'))>-1,b=c.querySelector('.aa-mm__add');
        c.classList.toggle('is-on',on);b.setAttribute('aria-pressed',on);
        b.setAttribute('aria-label',(on?'Remove ':'Add ')+c.getAttribute('data-name')+(on?' from shortlist':' to shortlist'));
      });
      var has=sel.length>0;count.textContent=sel.length;chips.innerHTML='';
      trayw.classList.toggle('is-open',has);trayw.inert=!has;if(!has)trayw.classList.remove('is-sheet');
      sel.forEach(function(id){
        var c=cards[id].el,li=document.createElement('li');li.className='aa-mm__chip';
        li.innerHTML='<span></span> <small></small><button type="button">×</button>';
        li.children[0].textContent=c.getAttribute('data-name');li.children[1].textContent='· '+c.getAttribute('data-next');
        li.children[2].setAttribute('aria-label','Remove '+c.getAttribute('data-name'));
        li.children[2].addEventListener('click',function(){toggle(id)});chips.appendChild(li);
      });
      if(has){cta.firstChild.textContent=(sel.length>1?'Pick dates ('+sel.length+')':'Pick a date')+' ';cta.href=cards[sel[0]].el.getAttribute('data-url')+'#register'}
    }
    function toggle(id,btn){
      var i=sel.indexOf(id),name=cards[id].el.getAttribute('data-name');
      if(i>-1){sel.splice(i,1);say('Removed '+name+'. '+sel.length+' in shortlist.')}
      else{sel.push(id);say('Added '+name+'. '+sel.length+' in shortlist.');if(btn)fly(btn);else bump()}
      save(sel);sync();
    }
    root.addEventListener('click',function(e){
      var add=e.target.closest('.aa-mm__add');if(add){toggle(add.getAttribute('data-id'),add);return}
      var tab=e.target.closest('.aa-mm__tab');
      if(tab){var from=tabs.indexOf(rail.querySelector('[aria-selected=true]')),to=tabs.indexOf(tab);input.value='';show(tab.getAttribute('data-cat'),to>from?1:-1)}
    });
    head.addEventListener('click',function(){var o=trayw.classList.toggle('is-sheet');head.setAttribute('aria-expanded',o)});
    clear.addEventListener('click',function(){sel=[];save(sel);sync();say('Shortlist cleared.')});
    root.addEventListener('keydown',function(e){if(e.key==='Escape'&&trayw.classList.contains('is-sheet')){trayw.classList.remove('is-sheet');head.setAttribute('aria-expanded',false);head.focus()}});
    rail.addEventListener('keydown',function(e){
      var k=e.key,i=tabs.indexOf(document.activeElement);if(i<0)return;
      var n=k==='ArrowDown'||k==='ArrowRight'?i+1:k==='ArrowUp'||k==='ArrowLeft'?i-1:k==='Home'?0:k==='End'?tabs.length-1:-1;
      if(n<0)return;e.preventDefault();n=(n+tabs.length)%tabs.length;tabs[n].focus();input.value='';show(tabs[n].getAttribute('data-cat'),n>i?1:-1);
    });
    var sx=0,sy=0,st=0;
    host.addEventListener('touchstart',function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now()},{passive:true});
    host.addEventListener('touchend',function(e){
      var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
      if(Date.now()-st<600&&Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.6&&!input.value)go((dx<0?1:-1)*(getComputedStyle(root).direction==='rtl'?-1:1));
    },{passive:true});
    input.addEventListener('input',function(){
      var q=input.value.trim().toLowerCase();if(!q){show(cur,0);return}
      rgrid.innerHTML='';var n=0;
      Object.keys(cards).forEach(function(id){
        var c=cards[id].el;if(c.getAttribute('data-search').indexOf(q)<0)return;
        var k=c.cloneNode(true);k.style.setProperty('--i',n++);var s=document.createElement('span');s.className='aa-mm__incat';s.textContent='In '+cards[id].cats.join(', ');k.appendChild(s);rgrid.appendChild(k);
      });
      panels.forEach(function(p){p.classList.add('is-off')});tabs.forEach(function(t){t.setAttribute('aria-selected',false)});
      results.classList.remove('is-off');rtitle.textContent='Results for “'+input.value.trim()+'”';
      rstatus.textContent=n?n+(n===1?' match':' matches')+' across all categories':'No class matches. Try “SAFe” or “AI”.';
      pill.style.opacity=0;sync();
    });
    root.classList.add('is-ready');show(cur,0);sync();
    if(window.ResizeObserver)new ResizeObserver(movePill).observe(rail);else window.addEventListener('resize',movePill);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(movePill);
  }
  /* Optional header dropdown: give the menu item the CSS class aa-mm-trigger */
  function dropdown(){
    var drop=document.querySelector('.aa-mm-drop'),trig=document.querySelector('.aa-mm-trigger > a, a.aa-mm-trigger');if(!drop||!trig)return;
    function set(o){drop.classList.toggle('is-open',o);trig.setAttribute('aria-expanded',o)}
    trig.setAttribute('aria-haspopup','true');trig.setAttribute('aria-expanded','false');
    trig.addEventListener('click',function(e){e.preventDefault();set(!drop.classList.contains('is-open'))});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&drop.classList.contains('is-open')){set(false);trig.focus()}});
    document.addEventListener('click',function(e){if(!drop.contains(e.target)&&!trig.contains(e.target))set(false)});
  }
  function boot(){[].forEach.call(document.querySelectorAll('[data-aa-mm]'),init);dropdown()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
