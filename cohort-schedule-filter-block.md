# Cohort Schedule — Filterable view (KnowledgeHut-style)

Replaces the static "Upcoming cohorts" table with a **filter bar** (All / This month / Next month / Weekend / Weekday + Time-slot dropdown + Month dropdown + "Live Online Classroom" tag). Pure HTML/CSS/JS — no plugin. Each row keeps `?cohort=<value>#enroll-form` so it still binds to form 3.

**Per cohort, the row needs these data attributes** (this is what the filters read):
- `data-date="2026-07-18"` — ISO start date
- `data-month="2026-07"` — YYYY-MM (drives "this/next month" + the Month dropdown)
- `data-daytype="weekend"` or `"weekday"`
- `data-slot="morning"` / `"afternoon"` / `"evening"`
- `data-cohort="cohort-1"` — must match the form's option value

> The 3 rows below use **example dates** so you can see the filters working. Replace the dates + attributes with your real cohorts (keep `data-cohort` = `cohort-1/2/3`). Anchor id is `cohorts` so the band's "See dates & enroll →" still lands here.

```html
<style>
.aa-sched{max-width:1080px;margin:34px auto}
.aa-sched h2{color:#053947;margin:0 0 14px}
.aa-sched-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}
.aa-sched-filters .aa-pill{cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#053947;font-weight:700;font-size:13px;padding:8px 16px;border-radius:30px;transition:all .15s}
.aa-sched-filters .aa-pill:hover{border-color:#0170B9}
.aa-sched-filters .aa-pill.active{background:#053947;color:#fff;border-color:#053947}
.aa-sched-filters select{border:1px solid #cbd5e1;border-radius:8px;padding:8px 12px;font-size:13px;color:#053947;font-weight:600;background:#fff}
.aa-sched-tag{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#0170B9;background:#eff6ff;padding:6px 12px;border-radius:20px}
.aa-sched table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0}
.aa-sched th{background:#053947;color:#fff;font-size:12px;text-transform:uppercase;text-align:left;padding:11px 14px}
.aa-sched td{padding:13px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;vertical-align:middle}
.aa-sched .aa-enroll{display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px}
.aa-sched .aa-empty{padding:26px;text-align:center;color:#64748b;font-size:14px;border:1px solid #e2e8f0;border-top:none}
.aa-sched-count{font-size:13px;color:#64748b;margin:0 0 8px}
@media(max-width:680px){.aa-sched .hide-sm{display:none}}
</style>
<div class="aa-sched" id="cohorts">
  <h2>Upcoming Leading SAFe® cohorts</h2>
  <div class="aa-sched-filters" id="aa-filters">
    <button class="aa-pill active" data-quick="all">All dates</button>
    <button class="aa-pill" data-quick="this-month">This month</button>
    <button class="aa-pill" data-quick="next-month">Next month</button>
    <button class="aa-pill" data-quick="weekend">Weekend</button>
    <button class="aa-pill" data-quick="weekday">Weekday</button>
    <select id="aa-f-slot" aria-label="Time slot"><option value="all">Any time slot</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select>
    <select id="aa-f-month" aria-label="Month"><option value="all">Any month</option></select>
    <span class="aa-sched-tag">● Live Online Classroom</span>
  </div>
  <p class="aa-sched-count" id="aa-count"></p>
  <table>
    <thead><tr><th>Dates</th><th class="hide-sm">Days</th><th class="hide-sm">Time slot</th><th>Format</th><th>Price (USD)</th><th></th></tr></thead>
    <tbody id="aa-sched-body">
      <tr data-date="2026-07-18" data-month="2026-07" data-daytype="weekend" data-slot="evening" data-cohort="cohort-1">
        <td><strong>Jul 18 – 19, 2026</strong></td><td class="hide-sm">Sat–Sun</td><td class="hide-sm">Evening</td><td>Live virtual</td><td>$850</td>
        <td><a class="aa-enroll" href="?cohort=cohort-1#enroll-form">Select &amp; enroll →</a></td>
      </tr>
      <tr data-date="2026-08-12" data-month="2026-08" data-daytype="weekday" data-slot="morning" data-cohort="cohort-2">
        <td><strong>Aug 12 – 14, 2026</strong></td><td class="hide-sm">Wed–Fri</td><td class="hide-sm">Morning</td><td>Live virtual</td><td>$850</td>
        <td><a class="aa-enroll" href="?cohort=cohort-2#enroll-form">Select &amp; enroll →</a></td>
      </tr>
      <tr data-date="2026-09-26" data-month="2026-09" data-daytype="weekend" data-slot="afternoon" data-cohort="cohort-3">
        <td><strong>Sep 26 – 27, 2026</strong></td><td class="hide-sm">Sat–Sun</td><td class="hide-sm">Afternoon</td><td>Live virtual</td><td>$850</td>
        <td><a class="aa-enroll" href="?cohort=cohort-3#enroll-form">Select &amp; enroll →</a></td>
      </tr>
    </tbody>
  </table>
  <div class="aa-empty" id="aa-empty" style="display:none">No cohorts match those filters. <a href="?cohort=cohort-1#enroll-form">Reset</a> or <a href="https://meetings.hubspot.com/john2795">request a private cohort</a>.</div>
</div>
<script>
(function(){
  var body=document.getElementById('aa-sched-body');if(!body)return;
  var rows=[].slice.call(body.querySelectorAll('tr'));
  var now=new Date();
  var thisM=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  var nx=new Date(now.getFullYear(),now.getMonth()+1,1);
  var nextM=nx.getFullYear()+'-'+String(nx.getMonth()+1).padStart(2,'0');
  var monthSel=document.getElementById('aa-f-month');
  var months=[];rows.forEach(function(r){var m=r.getAttribute('data-month');if(m&&months.indexOf(m)<0)months.push(m);});
  months.sort().forEach(function(m){var d=new Date(m+'-01T00:00:00');var o=document.createElement('option');o.value=m;o.textContent=d.toLocaleString('en',{month:'long',year:'numeric'});monthSel.appendChild(o);});
  var quick='all';
  function apply(){
    var slot=document.getElementById('aa-f-slot').value,month=monthSel.value,shown=0;
    rows.forEach(function(r){
      var ok=true,m=r.getAttribute('data-month');
      if(quick==='this-month'&&m!==thisM)ok=false;
      if(quick==='next-month'&&m!==nextM)ok=false;
      if(quick==='weekend'&&r.getAttribute('data-daytype')!=='weekend')ok=false;
      if(quick==='weekday'&&r.getAttribute('data-daytype')!=='weekday')ok=false;
      if(slot!=='all'&&r.getAttribute('data-slot')!==slot)ok=false;
      if(month!=='all'&&m!==month)ok=false;
      r.style.display=ok?'':'none';if(ok)shown++;
    });
    document.getElementById('aa-empty').style.display=shown?'none':'block';
    document.getElementById('aa-count').textContent=shown+' cohort'+(shown===1?'':'s')+' shown';
  }
  document.querySelectorAll('#aa-filters .aa-pill').forEach(function(p){p.addEventListener('click',function(){
    document.querySelectorAll('#aa-filters .aa-pill').forEach(function(x){x.classList.remove('active');});
    p.classList.add('active');quick=p.getAttribute('data-quick');apply();});});
  document.getElementById('aa-f-slot').addEventListener('change',apply);
  monthSel.addEventListener('change',apply);
  apply();
})();
</script>
```

## Notes
- **Filters combine (AND):** quick pill + time-slot + month all apply together; "this/next month" are computed live from today's date against `data-month`.
- **Single source vs. plugin:** this is a hand-maintained table. If you later auto-populate from the Easy Events Calendar CPT, give each event the same data attributes and the same JS filters them.
- **Form binding unchanged:** each "Select & enroll →" still passes `?cohort=` and the page's `#enroll-form` script + the Fluent Forms `{get.cohort}` default value pre-select the cohort.
