<?php
/**
 * AA — Pay stays off until there is an email
 *
 * Every in-place registration form on the site (course hero, schedule, the
 * calendar panel; all carry [data-aa-inline]) has an email box and a Pay
 * button. The button used to be live with the box empty: a tap then showed a
 * small "Please enter a valid email address" line, which on a phone reads as
 * "nothing happened", and the checkout monitor reported it as a failure.
 *
 * Now the button is greyed out (the register's own :disabled style) and a
 * short hint sits under it until the box holds something that looks like an
 * address. It switches on as the visitor types, and also catches browser
 * autofill, which does not always fire an input event, with a light check
 * for the first two minutes. A tap on the greyed button puts the cursor in
 * the email box.
 *
 * Only a disable this script made is ever undone, so the register's own
 * states are untouched: Pay switched off on the server (payment not live),
 * and "Taking you to Stripe…" while a checkout is starting. The two-step
 * register form is not touched: its Next button already waits for the email
 * and its Pay button for the agreement box.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp_footer', function () {
	if ( is_admin() ) { return; }
	?>
<script id="aa-sf-paygate">(function(){
var RX=/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/,uid=0;
function prep(f){
  if(f.__aaPay!==undefined)return f.__aaPay;
  var b=f.querySelector('[data-inline-pay]'),e=f.querySelector('input[type=email],input[name=email]');
  if(!b||!e||b.disabled){f.__aaPay=null;return null}          /* no box, or Pay off on the server: leave it */
  var h=document.createElement('p');h.className='aa-sf-payhint';h.id='aa-sf-payhint-'+(++uid);h.textContent='Enter your email to continue';
  b.insertAdjacentElement('afterend',h);
  f.__aaPay={b:b,e:e,h:h,ours:false};return f.__aaPay;
}
function sync(f){
  var s=prep(f);if(!s)return;
  var ok=RX.test(String(s.e.value||'').trim());
  if(!ok&&!s.b.disabled){s.b.disabled=true;s.ours=true;s.b.setAttribute('data-aa-gated','1');s.b.setAttribute('aria-describedby',s.h.id)}
  else if(ok&&s.ours){s.b.disabled=false;s.ours=false;s.b.removeAttribute('data-aa-gated')}
  s.h.hidden=ok;
}
function all(){[].forEach.call(document.querySelectorAll('[data-aa-inline]'),sync)}
['input','change','keyup','blur'].forEach(function(t){document.addEventListener(t,function(ev){var f=ev.target&&ev.target.closest&&ev.target.closest('[data-aa-inline]');if(f)sync(f)},true)});
/* The greyed button lets taps through to the form (pointer-events:none), so a
   tap on it can put the cursor in the email box and nudge the hint. */
document.addEventListener('click',function(ev){var f=ev.target&&ev.target.closest&&ev.target.closest('[data-aa-inline]');if(!f)return;var s=f.__aaPay;if(!s||!s.ours)return;
  var r=s.b.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)return;
  try{s.e.focus()}catch(x){}s.h.classList.remove('aa-sf-nudge');void s.h.offsetWidth;s.h.classList.add('aa-sf-nudge')},true);
document.addEventListener('aa:cohort-select',function(){setTimeout(all,0)});
document.addEventListener('focusin',all);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',all);else all();
var n=0,t=setInterval(function(){all();if(++n>150)clearInterval(t)},800);
})();</script>
<style id="aa-sf-paygate-css">.aa-sf-payhint{margin:6px 0 0;font-size:12.5px;line-height:1.4;color:#5E7378;text-align:center}.aa-sf-payhint[hidden]{display:none}[data-aa-gated]{pointer-events:none}.aa-sf-nudge{animation:aaSfNudge .5s ease-out;color:#0E8074;font-weight:600}@keyframes aaSfNudge{0%,100%{transform:none}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}@media (prefers-reduced-motion:reduce){.aa-sf-nudge{animation:none}}</style>
	<?php
}, 97 );
