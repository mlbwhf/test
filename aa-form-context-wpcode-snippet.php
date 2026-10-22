<?php
/**
 * Agile Agilist — FORM CONTEXT  [no shortcode; runs site-wide]
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 *
 * Four enquiries in ten days arrived as an email address and nothing else:
 *
 *   jamada81@gmail.com    the calendar panel, RTE        cohort recovered from the URL
 *   ninjd99@yahoo.com     the calendar panel, RTE        cohort recovered from the URL
 *   naomipozzi@gmail.com  the inline form, home page     not recoverable
 *   h.melotto@...         the contact form               not recoverable
 *
 * Each one had to be chased by hand to ask what the person had been looking
 * at, which is a poor first impression and loses the ones who do not reply.
 *
 * The two registration forms were fixed individually -- they now carry cohort,
 * course and dates as named fields. That is not enough on its own, because the
 * NEXT one will arrive through a form nobody has touched. h.melotto came
 * through the contact form and was logged as "Unidentified Form": not a
 * registration surface at all, and not something a per-form fix would ever
 * have reached.
 *
 * So this attaches context to EVERY form on the page instead of to named ones.
 *
 * HOW IT WORKS
 *
 * Anything that captures a form by reading its inputs -- the CRM among them --
 * sees only fields with a name attribute. A data attribute is invisible to it.
 * This adds four hidden inputs to each form, so whatever is collecting the
 * submission records where it came from:
 *
 *   aa_page     the page title
 *   aa_path     the path, query string stripped
 *   aa_cohort   the cohort id, if the page knows one
 *   aa_course   the course name, if the page knows one
 *
 * THE QUERY STRING IS DELIBERATELY NOT RECORDED. It carries utm_*, gclid,
 * msclkid and an email address on at least one of our own URLs, none of which
 * belongs in a form submission. The path alone answers "which page".
 *
 * WHERE THE COHORT COMES FROM, in order:
 *   1. a cohort= query parameter -- how the calendar and ad links arrive
 *   2. the nearest element carrying data-cohort, which is how the inline form
 *      and the cohort cards already identify themselves to our own JavaScript
 * If neither is present the field is written empty rather than guessed.
 *
 * DELIBERATELY SKIPPED
 *   search, login, register, lost-password and comment forms  -- no sale behind
 *     them, and the comment form in particular rejects unexpected fields
 *   anything inside the admin bar
 *   forms that already carry a cohort field -- the two registration forms do,
 *     and theirs is authoritative because it is rendered server-side
 *   forms with no submit control, which are usually filters rather than forms
 *
 * This only labels submissions. It does not send anything anywhere, and it
 * changes no behaviour a visitor can see.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Off switch, so this can be disabled without deleting the snippet. */
function aa_fctx_enabled() { return true; }

add_action( 'wp_footer', 'aa_fctx_print', 99 );

function aa_fctx_print() {
	if ( ! aa_fctx_enabled() || is_admin() ) { return; }

	/* The cohort and course the SERVER knows, where it knows them. A course
	   page resolves both; every other page resolves neither and the script
	   falls back to what it can find in the DOM. */
	$cohort = '';
	$course = '';
	if ( function_exists( 'aa_reg_page_course' ) && function_exists( 'aa_reg_course' ) ) {
		$slug = aa_reg_page_course();
		if ( $slug ) {
			$c = aa_reg_course( $slug );
			if ( is_array( $c ) && ! empty( $c['name'] ) ) { $course = $c['name']; }
		}
	}

	$cfg = wp_json_encode( array(
		'cohort' => $cohort,
		'course' => $course,
	) );

	$js = <<<'JS'
(function(){
  var CFG = __CFG__;
  var SKIP = /(^|[\s_-])(search|login|register|lostpassword|comment|commentform)([\s_-]|$)/i;

  function qsCohort(){
    try{
      var m = location.search.match(/[?&]cohort=([^&#]+)/);
      return m ? decodeURIComponent(m[1]) : '';
    }catch(e){ return ''; }
  }

  function nearestCohort(form){
    var n = form;
    while(n && n !== document){
      if(n.getAttribute && n.getAttribute('data-cohort')) return n.getAttribute('data-cohort');
      n = n.parentNode;
    }
    var el = document.querySelector('[data-cohort]');
    return el ? el.getAttribute('data-cohort') : '';
  }

  function skip(form){
    if(form.closest && form.closest('#wpadminbar')) return true;
    if(form.querySelector('input[name="cohort"]')) return true;      // already labelled, server-side
    if(!form.querySelector('[type=submit],button:not([type=button])')) return true;
    var id = (form.getAttribute('id')||'') + ' ' + (form.getAttribute('class')||'')
           + ' ' + (form.getAttribute('role')||'');
    if(SKIP.test(id)) return true;
    if(form.querySelector('input[type=password]')) return true;      // sign-in of some kind
    return false;
  }

  function add(form, name, value){
    if(form.querySelector('input[name="'+name+'"]')) return;
    var i = document.createElement('input');
    i.type = 'hidden'; i.name = name; i.value = value == null ? '' : String(value);
    form.appendChild(i);
  }

  function label(form){
    if(!form || form.__aaFctx) return;
    if(skip(form)) { form.__aaFctx = 1; return; }
    form.__aaFctx = 1;
    add(form, 'aa_page',   document.title || '');
    add(form, 'aa_path',   location.pathname || '');
    add(form, 'aa_cohort', qsCohort() || nearestCohort(form) || CFG.cohort || '');
    add(form, 'aa_course', CFG.course || '');
  }

  function sweep(){
    var f = document.getElementsByTagName('form');
    for(var i=0;i<f.length;i++) label(f[i]);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', sweep);
  } else { sweep(); }

  /* Forms that arrive later -- a modal, a plugin that renders on demand, the
     booking panel switching steps. Cheap: it only looks at added nodes. */
  try{
    new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var a = muts[i].addedNodes;
        for(var j=0;j<a.length;j++){
          var n = a[j];
          if(n.nodeType !== 1) continue;
          if(n.tagName === 'FORM') label(n);
          else if(n.querySelectorAll){
            var inner = n.querySelectorAll('form');
            for(var k=0;k<inner.length;k++) label(inner[k]);
          }
        }
      }
    }).observe(document.documentElement, {childList:true, subtree:true});
  }catch(e){}
})();
JS;

	$js = str_replace( '__CFG__', $cfg, $js );
	echo '<script id="aa-form-context">' . $js . '</script>';
}
