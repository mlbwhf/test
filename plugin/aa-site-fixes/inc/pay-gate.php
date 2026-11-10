<?php
/**
 * AA — Pay stays off until there is an email, and the button says so
 *
 * Every in-place registration form on the site (course hero, schedule, the
 * calendar panel; all carry [data-aa-inline]) has an email box and a Pay
 * button. The button used to be live with the box empty: a tap then showed a
 * small "Please enter a valid email address" line, which on a phone reads as
 * "nothing happened", and the checkout monitor reported it as a failure.
 *
 * ONE-STEP FORMS ([data-aa-inline]). Pay is greyed out until the box holds
 * something that looks like an address, and while it is greyed out the
 * BUTTON ITSELF reads "Enter your email". As soon as an address is typed (or
 * autofilled) it switches back to its own label, "Pay securely with Stripe".
 *
 * TWO-STEP "PICK A DATE" FORM (.aacal-panel[data-panel="1"]). The register
 * already greys its first button until there is an email, but labelled it
 * "Continue to review" with a hint under it asking for "Name and email",
 * though there is no name field. Now the greyed button reads "Enter your
 * email", then "Review & pay →" once there is one, and the hint is hidden
 * because the button says it. The second screen (booking-terms tick and
 * "Pay securely with Stripe") is unchanged.
 *
 * Labels are changed on English pages only; the Spanish, French and Arabic
 * mirrors keep their translated labels and the hint line.
 *
 * Only a disable this script made is ever undone, so the register's own
 * states are untouched: Pay switched off on the server (payment not live),
 * and "Taking you to Stripe…" while a checkout is starting. A tap on a
 * greyed button puts the cursor in the email box.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp_footer', function () {
	if ( is_admin() ) { return; }
	?>
<script id="aa-sf-paygate">(function(){
var RX=/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/,uid=0,EN=/^en/i.test(document.documentElement.lang||'en');
if(EN)document.documentElement.classList.add('aa-sf-en');
var L_EMPTY='Enter your email',L_NEXT='Review & pay ⟶';
function okEmail(e){return RX.test(String(e&&e.value||'').trim())}
function nudge(h){if(!h)return;h.classList.remove('aa-sf-nudge');void h.offsetWidth;h.classList.add('aa-sf-nudge')}

/* One-step forms: Pay gated by this script. */
function prep(f){
  if(f.__aaPay!==undefined)return f.__aaPay;
  var b=f.querySelector('[data-inline-pay]'),e=f.querySelector('input[type=email],input[name=email]');
  if(!b||!e||b.disabled){f.__aaPay=null;return null}          /* no box, or Pay off on the server: leave it */
  var h=document.createElement('p');h.className='aa-sf-payhint';h.id='aa-sf-payhint-'+(++uid);h.textContent='Enter your email to continue';
  b.insertAdjacentElement('afterend',h);
  f.__aaPay={b:b,e:e,h:h,ours:false,label:b.textContent};return f.__aaPay;
}
function sync(f){
  var s=prep(f);if(!s)return;
  var ok=okEmail(s.e);
  if(!ok&&!s.b.disabled){s.label=s.b.textContent;s.b.disabled=true;s.ours=true;s.b.setAttribute('data-aa-gated','1');s.b.setAttribute('aria-describedby',s.h.id);if(EN)s.b.textContent=L_EMPTY}
  else if(ok&&s.ours){s.b.disabled=false;s.ours=false;s.b.removeAttribute('data-aa-gated');if(EN)s.b.textContent=s.label}
  s.h.hidden=ok||EN;                                            /* English: the button says it */
}

/* Two-step panel: the register gates [data-next]; this only labels it. */
function syncNext(b){
  if(!EN||!b)return;
  if(!b.__aaNext){b.__aaNext=1;try{new MutationObserver(function(){syncNext(b)}).observe(b,{attributes:true,attributeFilter:['disabled']})}catch(x){}}
  var want=b.disabled?L_EMPTY:L_NEXT;
  if(b.textContent!==want)b.textContent=want;
  if(b.disabled)b.setAttribute('data-aa-gated','1');else b.removeAttribute('data-aa-gated');
}

function all(){
  [].forEach.call(document.querySelectorAll('[data-aa-inline]'),sync);
  [].forEach.call(document.querySelectorAll('.aacal-panel[data-panel="1"] [data-next]'),syncNext);
}
['input','change','keyup','blur'].forEach(function(t){document.addEventListener(t,function(ev){var f=ev.target&&ev.target.closest&&ev.target.closest('[data-aa-inline]');if(f)sync(f)},true)});

/* Greyed buttons let taps through (pointer-events:none), so a tap on one
   puts the cursor in the email box and nudges the hint. */
function inRect(b,ev){var r=b.getBoundingClientRect();return ev.clientX>=r.left&&ev.clientX<=r.right&&ev.clientY>=r.top&&ev.clientY<=r.bottom}
document.addEventListener('click',function(ev){
  var t=ev.target;if(!t||!t.closest)return;
  var f=t.closest('[data-aa-inline]');
  if(f){var s=f.__aaPay;if(s&&s.ours&&inRect(s.b,ev)){try{s.e.focus()}catch(x){}nudge(EN?s.b:s.h)}return}
  var p=t.closest('.aacal-panel[data-panel="1"]');
  if(p){var b=p.querySelector('[data-next]'),e=p.querySelector('input[name=email]');if(b&&b.disabled&&inRect(b,ev)){try{e&&e.focus()}catch(x){}nudge(b)}}
},true);
document.addEventListener('aa:cohort-select',function(){setTimeout(all,0)});
document.addEventListener('focusin',all);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',all);else all();
var n=0,t=setInterval(function(){all();if(++n>150)clearInterval(t)},800);
})();</script>
<style id="aa-sf-paygate-css">.aa-sf-payhint{margin:6px 0 0;font-size:12.5px;line-height:1.4;color:#5E7378;text-align:center}.aa-sf-payhint[hidden]{display:none}[data-aa-gated]{pointer-events:none}.aa-sf-en .aacal-panel[data-panel="1"] [data-hint]{display:none}.aa-sf-nudge{animation:aaSfNudge .5s ease-out}.aa-sf-payhint.aa-sf-nudge{color:#0E8074;font-weight:600}@keyframes aaSfNudge{0%,100%{transform:none}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}@media (prefers-reduced-motion:reduce){.aa-sf-nudge{animation:none}}</style>
	<?php
}, 97 );
