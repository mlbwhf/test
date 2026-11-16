"""The review page: one self-contained HTML file listing matched jobs with their application packets."""
import json

PAGE = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Job Hunter</title>
<style>
:root { --bg:#f4f5f7; --card:#fff; --ink:#18212b; --muted:#5d6875; --line:#dde1e6; --accent:#1f5fa8; --accent-ink:#fff;
  --good:#1d7a4c; --good-bg:#e3f4ea; --warn:#8a5a00; --warn-bg:#fdf1d7; --chip:#eceff3; --new:#b3261e; }
@media (prefers-color-scheme: dark) { :root { --bg:#12161b; --card:#1b2129; --ink:#e8ecf1; --muted:#9aa5b1; --line:#2c343e;
  --accent:#6aa9ee; --accent-ink:#0d1620; --good:#7fd3a4; --good-bg:#17352a; --warn:#f0c674; --warn-bg:#3a2f14; --chip:#262e38; --new:#ff8a80; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 980px; margin: 0 auto; padding: 24px 16px 60px; }
h1 { font-size: 24px; margin: 0 0 2px; }
.sub { color: var(--muted); margin-bottom: 18px; }
.bar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:10px; }
.bar input[type=search] { flex:1 1 220px; padding:9px 12px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--ink); font:inherit; }
.chip { border:1px solid var(--line); background:var(--card); color:var(--ink); border-radius:999px; padding:5px 12px; cursor:pointer; font:inherit; font-size:13px; }
.chip[aria-pressed=true] { background:var(--accent); color:var(--accent-ink); border-color:var(--accent); }
.count { color:var(--muted); font-size:13px; margin: 6px 0 14px; }
.job { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px 18px; margin-bottom:12px; }
.job.done { opacity:.55; }
.top { display:flex; gap:12px; justify-content:space-between; align-items:flex-start; }
.job h2 { font-size:17px; margin:0; line-height:1.3; }
.meta { color:var(--muted); font-size:14px; margin-top:2px; }
.score { flex:none; font-weight:700; font-variant-numeric:tabular-nums; border-radius:8px; padding:4px 9px; background:var(--good-bg); color:var(--good); }
.tags { display:flex; flex-wrap:wrap; gap:6px; margin:10px 0 4px; }
.tag { background:var(--chip); border-radius:6px; padding:2px 8px; font-size:12px; }
.tag.new { background:transparent; border:1px solid var(--new); color:var(--new); font-weight:600; }
.kw { font-size:13px; margin-top:6px; overflow-wrap:anywhere; }
.kw b { font-weight:600; }
.kw.gap { color:var(--warn); }
details { margin-top:8px; font-size:14px; }
summary { cursor:pointer; color:var(--muted); }
pre { white-space:pre-wrap; font:13px/1.5 ui-monospace, Menlo, Consolas, monospace; background:var(--chip); padding:12px; border-radius:8px; margin:8px 0 0; overflow-wrap:anywhere; }
.actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
.btn { display:inline-block; text-decoration:none; border:1px solid var(--line); background:var(--card); color:var(--ink); border-radius:8px; padding:7px 12px; font:inherit; font-size:14px; cursor:pointer; }
.btn.primary { background:var(--accent); color:var(--accent-ink); border-color:var(--accent); font-weight:600; }
.btn:hover { filter:brightness(1.07); }
.empty { text-align:center; color:var(--muted); padding:40px 0; }
.note { background:var(--warn-bg); color:var(--warn); border-radius:8px; padding:10px 14px; margin-bottom:14px; font-size:14px; }
</style></head><body><main>
<h1>Job Hunter</h1>
<div class="sub" id="sub"></div>
<div id="note"></div>
<div class="bar"><input type="search" id="q" placeholder="Search title, company, location" aria-label="Search jobs"></div>
<div class="bar" id="tracks"></div>
<div class="bar" id="countries"></div>
<div class="bar" id="toggles"></div>
<div class="count" id="count"></div>
<div id="list"></div>
</main>
<script id="data" type="application/json">__DATA__</script>
<script>
const D = JSON.parse(document.getElementById('data').textContent);
const KEY = 'jobhunter-status';
let status = {};
try { status = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(status)); } catch (e) {} };
const f = { q:'', track:null, country:null, newOnly:false, hideDone:true };
const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'text') n.textContent = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); }
  kids.forEach(k => k && n.append(k)); return n; };

document.getElementById('sub').textContent = `Run ${D.run_date} · ${D.jobs.filter(j => j.is_new).length} new · ${D.jobs.length} open matches from the last ${D.retention_days} days`;
if (D.sample_resume) document.getElementById('note').append(el('div', {class:'note', text:'These packets were built from the sample resume. Add your own resume to get real ones (see README).'}));

function chips(id, values, key) {
  const box = document.getElementById(id); box.textContent = '';
  values.forEach(v => box.append(el('button', {class:'chip', 'aria-pressed': String(f[key] === v), text: v,
    onclick: () => { f[key] = f[key] === v ? null : v; draw(); }})));
}
function toggles() {
  const box = document.getElementById('toggles'); box.textContent = '';
  [['newOnly', 'New this run only'], ['hideDone', 'Hide applied and skipped']].forEach(([k, label]) =>
    box.append(el('button', {class:'chip', 'aria-pressed': String(f[k]), text: label, onclick: () => { f[k] = !f[k]; draw(); }})));
}
function card(j) {
  const st = status[j.id];
  const n = el('article', {class: 'job' + (st ? ' done' : '')});
  n.append(el('div', {class:'top'},
    el('div', {}, el('h2', {text: j.title}), el('div', {class:'meta', text: [j.company, j.location].filter(Boolean).join(' · ')})),
    el('div', {class:'score', title:'Match score', text: String(j.score)})));
  const tags = el('div', {class:'tags'});
  if (j.is_new) tags.append(el('span', {class:'tag new', text:'NEW'}));
  [D.track_labels[j.track] || j.track, j.country, j.source, j.posted ? 'Posted ' + j.posted : 'Found ' + j.first_seen].forEach(t => tags.append(el('span', {class:'tag', text:t})));
  if (st) tags.append(el('span', {class:'tag', text: st === 'applied' ? 'Applied' : 'Skipped'}));
  n.append(tags);
  if (j.matched && j.matched.length) { const k = el('div', {class:'kw'}); k.append(el('b', {text:'Your resume matches: '}), j.matched.join(', ')); n.append(k); }
  if (j.missing && j.missing.length) { const k = el('div', {class:'kw gap'}); k.append(el('b', {text:'In the posting, not in your resume: '}), j.missing.join(', ')); n.append(k); }
  if (j.snippet) n.append(el('details', {}, el('summary', {text:'Posting excerpt'}), el('pre', {text: j.snippet})));
  if (j.cover) n.append(el('details', {}, el('summary', {text:'Cover letter'}), el('pre', {text: j.cover})));
  const a = el('div', {class:'actions'});
  a.append(el('a', {class:'btn primary', href: j.url, target:'_blank', rel:'noopener', text:'Open application'}));
  if (j.mailto) a.append(el('a', {class:'btn', href: j.mailto, text:'Email application to ' + j.apply_email}));
  Object.entries(j.files || {}).forEach(([label, path]) => a.append(el('a', {class:'btn', href: path, download:'', text: label})));
  if (j.cover) a.append(el('button', {class:'btn', text:'Copy cover letter', onclick: async e => {
    try { await navigator.clipboard.writeText(j.cover); e.target.textContent = 'Copied'; } catch (err) { e.target.textContent = 'Open the letter and copy it'; } }}));
  a.append(el('button', {class:'btn', text: st === 'applied' ? 'Undo applied' : 'Mark applied', onclick: () => { status[j.id] = st === 'applied' ? undefined : 'applied'; save(); draw(); }}));
  a.append(el('button', {class:'btn', text: st === 'skipped' ? 'Undo skip' : 'Skip', onclick: () => { status[j.id] = st === 'skipped' ? undefined : 'skipped'; save(); draw(); }}));
  n.append(a);
  return n;
}
function draw() {
  chips('tracks', Object.keys(D.track_labels).map(k => D.track_labels[k]), 'track');
  chips('countries', [...new Set(D.jobs.map(j => j.country))].sort(), 'country');
  toggles();
  const q = f.q.toLowerCase();
  const rows = D.jobs.filter(j => (!q || (j.title + ' ' + j.company + ' ' + j.location).toLowerCase().includes(q))
    && (!f.track || D.track_labels[j.track] === f.track) && (!f.country || j.country === f.country)
    && (!f.newOnly || j.is_new) && (!f.hideDone || !status[j.id]));
  document.getElementById('count').textContent = `Showing ${rows.length} of ${D.jobs.length}`;
  const list = document.getElementById('list'); list.textContent = '';
  if (!rows.length) list.append(el('div', {class:'empty', text: D.jobs.length ? 'No jobs match these filters.' : 'No matching jobs found yet. Check the run summary for which sources returned results.'}));
  rows.forEach(j => list.append(card(j)));
}
document.getElementById('q').addEventListener('input', e => { f.q = e.target.value; draw(); });
draw();
</script></body></html>
"""


def build(data):
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    return PAGE.replace("__DATA__", payload)
