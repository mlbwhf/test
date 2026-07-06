#!/usr/bin/env python3
"""Insert a sticky in-page section nav (course-bar) + header-offset script into Training (1699).
Operates on the current live content (.new.html) so bodies are untouched."""
SRC = "backups/1699-training-2026-07-06.new.html"
OUT = "backups/1699-training-2026-07-06.final.html"

text = open(SRC, encoding="utf-8").read()

COURSEBAR = '''<!-- wp:html -->
<div class="aa-bar aa-coursebar"><div class="aa-bar-in">
<div style="display:flex;align-items:center;gap:13px">
<div style="display:flex;flex-direction:column;line-height:1.15">
<span class="nr" style="font-style:italic;font-size:16px;color:#0E3A44">Training</span>
<span class="mono" style="font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#88A0A4">19 SAFe&reg; &amp; AI-Native certifications</span>
</div></div>
<div class="aa-bar-nav coh-hide">
<a href="#roles" class="lnk">Roles</a><a href="#jobs" class="lnk">Signals</a><a href="#coaching" class="lnk">Coaching</a><a href="#salary" class="lnk">Salary</a><a href="#paths" class="lnk">Paths</a><a href="#certifications" class="lnk">Certifications</a><a href="#cohorts" class="lnk">Cohorts</a>
</div>
<div class="aa-bar-cta">
<a href="#cohorts" class="btn-teal">Register &#10230;</a>
</div></div></div>
<!-- /wp:html -->

'''

SCRIPT = '''
<!-- wp:html -->
<script>
/* Keep the Training section-bar just below the theme's sticky header.
   Sets --aa-top on the .aa-rd element itself so .aa-rd .aa-bar{top:var(--aa-top)} resolves
   regardless of where the variable is otherwise declared. off=0 if no sticky header. */
(function(){
  var root=document.querySelector('.aa-rd');
  if(!root) return;
  var sels=['#ast-fixed-header','.ast-header-sticked','#masthead','.site-header','.ast-header-wrap','header[role="banner"]','header'];
  function setTop(){
    var off=0;
    for(var i=0;i<sels.length;i++){var el=document.querySelector(sels[i]);if(!el)continue;
      var cs=getComputedStyle(el),h=el.getBoundingClientRect().height;
      if((cs.position==='fixed'||cs.position==='sticky')&&h>0){off=Math.round(h);break;}}
    root.style.setProperty('--aa-top',off+'px');
  }
  var t=false;function tick(){if(!t){t=true;requestAnimationFrame(function(){setTop();t=false;});}}
  setTop();
  window.addEventListener('scroll',tick,{passive:true});
  window.addEventListener('resize',setTop);
  window.addEventListener('load',setTop);
})();
</script>
<!-- /wp:html -->
'''

# Insert coursebar right after the wrapper opens
OPEN = '<div class="wp-block-group aa-rd" id="top">\n\n'
assert text.count(OPEN) == 1, "wrapper-open anchor not unique"
text = text.replace(OPEN, OPEN + COURSEBAR, 1)

# Insert offset script just before the wrapper closes
CLOSE = '\n</div>\n<!-- /wp:group -->'
assert text.rstrip().endswith('</div>\n<!-- /wp:group -->'), "unexpected tail"
idx = text.rindex(CLOSE)
text = text[:idx] + '\n' + SCRIPT + text[idx:]

open(OUT, "w", encoding="utf-8").write(text)
print("coursebar inserted:", text.count('aa-coursebar') == 1)
print("nav links:", text.count('class="lnk"'))
print("offset script:", text.count('setProperty(\'--aa-top\'') == 1)
print("bytes:", len(text), "-> wrote", OUT)
