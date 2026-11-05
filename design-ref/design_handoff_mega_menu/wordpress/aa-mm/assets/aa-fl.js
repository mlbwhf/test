/* Agile Agilist class-selection flow. No dependencies. Enhances server-rendered markup. */
(function(){
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return [].slice.call((r||document).querySelectorAll(s))}
  function init(root){
    var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    var checkUrl=root.getAttribute('data-check-url')||'';
    var chks=qa('.aa-fl__chk',root),by={};
    chks.forEach(function(c){by[c.value]={chk:c,card:c.closest('.aa-fl__card'),name:c.getAttribute('data-name'),url:c.getAttribute('data-url'),price:c.getAttribute('data-price'),fs:q('.aa-fl__cls[data-id="'+c.value+'"]',root)}});
    var steps=qa('.aa-fl__step',root),sbtn=qa('.aa-fl__stepbtn',root),bar=q('.aa-fl__bar',root),back=q('.aa-fl__back',root),next=q('.aa-fl__next',root),msg=q('.aa-fl__msg',root),
        tabs=qa('.aa-fl__tab',root),panels=qa('.aa-fl__panel',root),rows=q('.aa-fl__rows',root),seatsOut=q('.aa-fl__seatrow output',root),
        go=q('.aa-fl__go',root),ralert=q('.aa-fl__ralert',root),table=q('.aa-fl__table',root),diffBox=q('.aa-fl__diff input',root),cmpNote=q('.aa-fl__cmpnote',root),
        st={step:1,mode:'register',seats:1,diff:false};

    function ids(){return chks.filter(function(c){return c.checked}).map(function(c){return c.value})}
    function dateOf(id){return q('.aa-fl__rad:checked',by[id].fs)}
    function ensure(){ids().forEach(function(id){if(!dateOf(id)){var r=q('.aa-fl__rad:not(:disabled)',by[id].fs);if(r)r.checked=true}})}
    function clash(id){var a=dateOf(id);if(!a)return'';var l=ids();for(var i=0;i<l.length;i++){if(l[i]===id)continue;var b=dateOf(l[i]);if(b&&a.getAttribute('data-start')<=b.getAttribute('data-end')&&b.getAttribute('data-start')<=a.getAttribute('data-end'))return'This overlaps '+by[l[i]].name+'. Pick a different date for one of them.'}return''}
    function anyClash(){return ids().some(function(id){return clash(id)})}
    function writeUrl(){try{var u=new URL(location.href),l=ids();if(l.length){u.searchParams.set('classes',l.join(','));u.searchParams.set('cohorts',l.map(function(id){var r=dateOf(id);return r?r.value:''}).join(','))}else{u.searchParams.delete('classes');u.searchParams.delete('cohorts')}history.replaceState(null,'',u)}catch(e){}}
    function readUrl(){
      var p=new URLSearchParams(location.search),c=(p.get('classes')||'').split(',').filter(function(x){return by[x]}),d=(p.get('cohorts')||'').split(',');
      c.forEach(function(id,i){by[id].chk.checked=true;var r=q('.aa-fl__rad[value="'+(d[i]||'')+'"]:not(:disabled)',by[id].fs);if(r)r.checked=true});
      return c.length;
    }
    function names(n){return n+(n===1?' class':' classes')}

    function render(){
      var l=ids(),n=l.length,cl=anyClash();
      chks.forEach(function(c){by[c.value].card.classList.toggle('is-on',c.checked)});
      qa('.aa-fl__date',root).forEach(function(d){d.classList.toggle('is-on',q('input',d).checked)});
      sbtn.forEach(function(b,i){var k=i+1;b.setAttribute('aria-current',st.step===k?'step':'false');b.classList.toggle('is-done',st.step>k);b.disabled=k>1&&!n});
      q('[data-sub="1"]',root).textContent=n?n+' selected':'None yet';
      q('[data-sub="2"]',root).textContent=st.step>1&&n?'Set for '+n:'Per class';
      q('[data-sub="3"]',root).textContent=st.mode==='register'?'Register':'Compare';
      steps.forEach(function(s){s.classList.toggle('is-off',+s.getAttribute('data-step')!==st.step)});
      Object.keys(by).forEach(function(id){var on=by[id].chk.checked;by[id].fs.classList.toggle('is-off',!on);q('.aa-fl__alert',by[id].fs).textContent=on?clash(id):''});
      back.hidden=st.step===1;next.hidden=st.step===3;
      next.disabled=!n||(st.step===2&&cl);
      next.firstChild.textContent=(st.step===1?'Choose dates ('+n+')':'Review & decide')+' ';
      msg.textContent=st.step===1?(n?names(n)+' selected':'Select at least one class'):st.step===2?(cl?'Some dates overlap':'Dates set for '+names(n)):(st.mode==='register'?'Seats: '+st.seats+' per class':'Comparing '+n);
      tabs.forEach(function(t){t.setAttribute('aria-selected',t.getAttribute('data-mode')===st.mode)});
      panels.forEach(function(p){p.classList.toggle('is-off',p.getAttribute('data-panel')!==st.mode)});
      q('[data-n]',root).textContent=n;
      seatsOut.textContent=st.seats;
      rows.innerHTML='';
      l.forEach(function(id){var r=dateOf(id),li=document.createElement('li');li.className='aa-fl__row';
        li.innerHTML='<div><strong></strong><span></span></div><bdi></bdi>';
        li.querySelector('strong').textContent=by[id].name;li.querySelector('span').textContent=r?r.getAttribute('data-label')+', '+r.getAttribute('data-days'):'';
        li.querySelector('bdi').textContent=by[id].price+' / seat';rows.appendChild(li)});
      // compare table
      table.style.setProperty('--cols',Math.max(1,n));
      qa('[data-col]',table).forEach(function(c){c.hidden=l.indexOf(c.getAttribute('data-col'))<0});
      qa('td[data-yourdate]',table).forEach(function(td){var r=l.indexOf(td.getAttribute('data-col'))>-1&&dateOf(td.getAttribute('data-col'));td.textContent=r?r.getAttribute('data-label')+' · '+r.getAttribute('data-days'):''});
      var diffRows=0;
      qa('tbody tr',table).forEach(function(tr){
        if(tr.hasAttribute('data-js')&&!l.length){tr.hidden=true;return}
        var vals=qa('td',tr).filter(function(c){return !c.hidden}).map(function(c){return c.textContent.trim()}),same=vals.every(function(v){return v===vals[0]});
        tr.classList.toggle('is-diff',!same&&n>1);if(!same)diffRows++;
        tr.hidden=st.diff&&same&&!tr.hasAttribute('data-keep');
      });
      cmpNote.hidden=!(st.diff&&n>1&&diffRows===0);
      writeUrl();
    }
    function goStep(n){
      if(n>1&&!ids().length)return;if(n>=2)ensure();st.step=n;render();
      var h=q('.aa-fl__step[data-step="'+n+'"] h2',root);if(h)h.focus({preventScroll:true});
      var top=root.getBoundingClientRect().top;if(top<0)window.scrollTo({top:window.pageYOffset+top-12,behavior:RM?'auto':'smooth'});
    }
    function busy(b){go.setAttribute('aria-busy',b);go.disabled=false;go.firstChild.textContent=b?'Opening checkout… ':'Continue to payment '}
    function verify(l){
      if(!checkUrl)return Promise.resolve([]);
      var c=new AbortController(),t=setTimeout(function(){c.abort()},1500);
      return fetch(checkUrl+(checkUrl.indexOf('?')>-1?'&':'?')+'cohorts='+l.map(function(id){return dateOf(id).value}).join(','),{signal:c.signal,credentials:'same-origin'})
        .then(function(r){return r.json()}).then(function(j){clearTimeout(t);return j.full||[]}).catch(function(){clearTimeout(t);return[]});
    }
    function checkout(){
      var l=ids();ralert.textContent='';
      if(anyClash()){ralert.textContent='Two classes overlap. Go back and change a date.';return}
      busy(true);
      verify(l).then(function(full){
        if(full.length){
          busy(false);
          l.forEach(function(id){var r=dateOf(id);if(full.indexOf(r.value)>-1){r.disabled=true;r.checked=false;r.closest('.aa-fl__date').setAttribute('data-state','full');q('.aa-fl__seats',r.closest('.aa-fl__date')).textContent='Full';
            ralert.textContent=r.getAttribute('data-label')+' just filled up. Choose another date.'}});
          st.step=2;ensure();render();return;
        }
        var first=l[0],r=dateOf(first);
        try{sessionStorage.setItem('aa_fl_queue',JSON.stringify(l.slice(1).map(function(id){return{id:id,cohort:dateOf(id).value,seats:st.seats}})))}catch(e){}
        location.assign(by[first].url+'?cohort='+encodeURIComponent(r.value)+'&seats='+st.seats+'#register');
      });
    }
    root.addEventListener('change',function(e){
      if(e.target.classList.contains('aa-fl__chk')||e.target.classList.contains('aa-fl__rad')){if(e.target.classList.contains('aa-fl__chk')&&e.target.checked)ensure();render()}
      if(e.target===diffBox){st.diff=diffBox.checked;render()}
    });
    root.addEventListener('click',function(e){
      var t=e.target.closest('button');if(!t)return;
      if(t.classList.contains('aa-fl__stepbtn'))goStep(+t.getAttribute('data-go'));
      else if(t.classList.contains('aa-fl__back'))goStep(st.step-1);
      else if(t.classList.contains('aa-fl__next'))goStep(st.step+1);
      else if(t.classList.contains('aa-fl__tab')){st.mode=t.getAttribute('data-mode');render()}
      else if(t.hasAttribute('data-gocmp')){st.mode='compare';render()}
      else if(t.classList.contains('aa-fl__rm')){by[t.getAttribute('data-rm')].chk.checked=false;if(!ids().length){st.step=1}render()}
      else if(t.classList.contains('aa-fl__regone')){var id=t.getAttribute('data-reg');chks.forEach(function(c){c.checked=c.value===id});st.mode='register';render()}
      else if(t.hasAttribute('data-seat')){st.seats=Math.max(1,Math.min(20,st.seats+(+t.getAttribute('data-seat'))));render()}
      else if(t===go)checkout();
    });
    root.addEventListener('keydown',function(e){if(e.key==='Escape'&&go.getAttribute('aria-busy')==='true')busy(false)});
    var pre=readUrl();root.classList.add('is-ready');st.step=pre?2:1;if(pre)ensure();render();
    window.addEventListener('pageshow',function(e){if(e.persisted)busy(false)});
  }
  function boot(){[].forEach.call(document.querySelectorAll('[data-aa-fl]'),init)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
