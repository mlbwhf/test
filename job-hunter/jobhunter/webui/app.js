'use strict';
const $ = id => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') n.textContent = v; else if (k === 'style') n.style.cssText = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(k => k && n.append(k));
  return n;
};
let S = { jobs: [], status: {}, run: {}, track_labels: {} };
const F = { q: '', show: 'review', track: null, country: null, newOnly: false };
let wasRunning = false, poll = null;

async function api(path, body) {
  const res = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.status === 401) { location.href = '/login'; throw new Error('signed out'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200); }
const st = j => (S.status[j.id] || {}).status || '';

async function load() {
  S = await api('/api/state');
  if (wasRunning && !S.run.running) toast(S.run.error ? 'The run failed. See Activity.' : 'Done. Jobs are up to date.');
  wasRunning = S.run.running;
  clearTimeout(poll);
  if (S.run.running) poll = setTimeout(load, 4000);
  draw();
}

function draw() { drawBanner(); drawTiles(); drawFilters(); drawList(); drawActivity(); drawPush(); }

function drawBanner() {
  const box = $('banner'); box.textContent = '';
  const add = (cls, text) => box.append(el('div', { class: 'bar' }, el('div', { class: 'notice ' + cls, text })));
  if (S.run.running) add('busy', S.run.kind === 'rebuild' ? 'Rebuilding resumes for your open jobs…' : 'Searching for new jobs. This takes a few minutes; you can keep working.');
  else if (S.run.error) add('error', 'The last run failed: ' + S.run.error);
  if (S.sample_resume) add('', 'You are seeing the sample resume. Add your own under Resume before applying to anything.');
  $('run').disabled = !!S.run.running;
  $('run').textContent = S.run.running ? 'Working…' : 'Find new jobs';
}

function drawTiles() {
  const open = S.jobs.filter(j => !st(j));
  const tiles = [
    [open.filter(j => j.is_new).length, 'New since last search', 'hot'],
    [open.length, 'To review', ''],
    [S.jobs.filter(j => st(j) === 'applied').length, 'Applied', ''],
    [S.run.finished ? S.run.finished.replace(' UTC', '') : 'Not yet', 'Last search (UTC)', 'small'],
  ];
  const box = $('tiles'); box.textContent = '';
  tiles.forEach(([n, l, c]) => box.append(el('div', { class: 'tile ' + (c === 'hot' && n ? 'hot' : '') }, el('div', { class: 'n ' + (c === 'small' ? 'small' : ''), text: String(n) }), el('div', { class: 'l', text: l }))));
}

function drawFilters() {
  const seg = $('seg'); seg.textContent = '';
  [['review', 'To review'], ['applied', 'Applied'], ['skipped', 'Skipped'], ['all', 'All']].forEach(([k, label]) =>
    seg.append(el('button', { role: 'tab', 'aria-selected': String(F.show === k), text: label, onclick: () => { F.show = k; draw(); } })));
  const chips = $('chips'); chips.textContent = '';
  const chip = (label, on, fn) => chips.append(el('button', { class: 'chip', 'aria-pressed': String(on), text: label, onclick: () => { fn(); draw(); } }));
  chip('New only', F.newOnly, () => { F.newOnly = !F.newOnly; });
  chips.append(el('span', { class: 'chip-sep' }));
  Object.entries(S.track_labels).forEach(([k, label]) => chip(label, F.track === k, () => { F.track = F.track === k ? null : k; }));
  chips.append(el('span', { class: 'chip-sep' }));
  [...new Set(S.jobs.map(j => j.country))].sort().forEach(c => chip(c, F.country === c, () => { F.country = F.country === c ? null : c; }));
}

function visible() {
  const q = F.q.toLowerCase();
  return S.jobs.filter(j => (!q || (j.title + ' ' + j.company + ' ' + j.location).toLowerCase().includes(q))
    && (!F.track || j.track === F.track) && (!F.country || j.country === F.country) && (!F.newOnly || j.is_new)
    && (F.show === 'all' || (F.show === 'review' ? !st(j) : st(j) === F.show)));
}

function drawList() {
  const list = $('list'); list.textContent = '';
  const rows = visible();
  if (!rows.length) {
    const none = !S.jobs.length;
    list.append(el('div', { class: 'empty' }, el('b', { text: none ? 'No jobs yet' : 'Nothing here' }),
      none ? 'Press "Find new jobs" to run the first search.' : 'No jobs match this view. Try another filter.'));
    return;
  }
  rows.forEach(j => list.append(card(j)));
}

function card(j) {
  const s = st(j);
  const tags = el('div', { class: 'tags' },
    j.is_new && el('span', { class: 'tag new', text: 'NEW' }),
    s && el('span', { class: 'tag done', text: s === 'applied' ? 'Applied ' + (S.status[j.id].on || '') : 'Skipped' }),
    [S.track_labels[j.track] || j.track, j.country, j.source, j.posted ? 'Posted ' + j.posted : 'Found ' + j.first_seen,
      j.resume_version && 'Resume: ' + j.resume_version].filter(Boolean).map(t => el('span', { class: 'tag', text: t })));
  const body = el('div', { class: 'job-body' });
  if (j.matched && j.matched.length) body.append(el('div', { class: 'kw' }, el('b', { text: 'Your resume matches: ' }), j.matched.join(', ')));
  if (j.missing && j.missing.length) body.append(el('div', { class: 'kw gap' }, el('b', { text: 'In the posting, not in your resume: ' }), j.missing.join(', ')));
  if (j.tweaks && j.tweaks.length) body.append(el('details', {}, el('summary', { text: 'How this resume was adjusted for the posting' }), el('ul', {}, j.tweaks.map(t => el('li', { text: t })))));
  if (j.cover) body.append(el('details', {}, el('summary', { text: 'Cover letter' }), el('pre', { text: j.cover })));
  if (j.snippet) body.append(el('details', {}, el('summary', { text: 'Posting excerpt' }), el('pre', { text: j.snippet })));
  const mark = async value => { try { S.status = (await api('/api/status', { id: j.id, status: value })).status; draw(); } catch (e) { toast(e.message); } };
  const actions = el('div', { class: 'job-actions' },
    el('a', { class: 'btn primary', href: j.url, target: '_blank', rel: 'noopener noreferrer', text: 'Open application' }),
    j.mailto && el('a', { class: 'btn', href: j.mailto, text: 'Email ' + j.apply_email }),
    Object.entries(j.files || {}).map(([label, path]) => el('a', { class: 'btn', href: '/files/' + path, target: '_blank', rel: 'noopener', text: label })),
    j.cover && el('button', { class: 'btn', text: 'Copy cover letter', onclick: async e => { try { await navigator.clipboard.writeText(j.cover); toast('Cover letter copied'); } catch (err) { toast('Open the cover letter and copy it by hand'); } } }),
    el('span', { class: 'split' }),
    el('button', { class: 'btn', text: s === 'applied' ? 'Undo applied' : 'Mark applied', onclick: () => mark(s === 'applied' ? null : 'applied') }),
    el('button', { class: 'btn quiet', text: s === 'skipped' ? 'Undo skip' : 'Skip', onclick: () => mark(s === 'skipped' ? null : 'skipped') }));
  const score = el('div', { class: 'score', title: 'Match score', style: '--v:' + j.score }, el('span', { text: String(j.score) }));
  return el('article', { class: 'job' + (s ? ' is-done' : '') },
    el('div', { class: 'job-head' }, score, el('div', {}, el('h3', { text: j.title }), el('div', { class: 'where', text: [j.company, j.location].filter(Boolean).join(' · ') }), tags)),
    body, actions);
}

// The run summary arrives as simple markdown; render it as headings, lists and one table.
function drawActivity() {
  $('schedule').textContent = `A search runs automatically every day at ${String(S.run_hour_utc).padStart(2, '0')}:00 UTC. You can also start one any time with "Find new jobs".`;
  $('run-meta').textContent = S.run.finished ? `Last run finished ${S.run.finished}${S.run.kind === 'rebuild' ? ' (resume rebuild)' : ''}` : 'No run has finished yet.';
  const box = $('run-summary'); box.textContent = '';
  let ul = null, table = null;
  (S.run.summary || '').split('\n').forEach(line => {
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^-+$/.test(c))) return;
      if (!table) { table = el('table'); box.append(table); table.append(el('tr', {}, cells.map(c => el('th', { text: c })))); return; }
      table.append(el('tr', {}, cells.map(c => el('td', { text: c })))); ul = null; return;
    }
    table = null;
    if (line.startsWith('- ')) { if (!ul) { ul = el('ul'); box.append(ul); } ul.append(el('li', { text: line.slice(2) })); return; }
    ul = null;
    if (line.startsWith('## ')) box.append(el('h3', { text: line.slice(3) }));
    else if (line.trim()) box.append(el('h3', { text: line.replace(/:$/, '') }));
  });
}

function drawPush() {
  const box = $('push-help'); box.textContent = '';
  if (!S.push_enabled) { box.append(el('p', { class: 'muted', text: 'Not set up. These sites can only be read from your own computer, where you are signed in. To let your computer send what it finds here, set JOBHUNTER_TOKEN on the server and restart it.' })); return; }
  box.append(el('p', { text: 'These sites are read on your own computer, where you are signed in, and sent here. On your computer, in the job-hunter folder:' }),
    el('ol', {}, el('li', {}, 'Sign in once: ', el('code', { text: 'python -m jobhunter login' })),
      el('li', {}, 'Each day, or on a schedule: ', el('code', { text: `python -m jobhunter push --url ${location.origin} --token YOUR_TOKEN` }))),
    el('p', { class: 'muted', text: 'YOUR_TOKEN is the JOBHUNTER_TOKEN value you set on the server. Postings arrive here and a search starts automatically.' }));
}

function editor(name, describe) {
  const text = $(name + '-text'), check = $(name + '-check');
  const validate = () => { try { const d = JSON.parse(text.value); check.className = 'check'; check.textContent = describe(d); return true; } catch (e) { check.className = 'check bad'; check.textContent = 'Not valid yet: ' + e.message; return false; } };
  text.addEventListener('input', validate);
  $(name + '-save').addEventListener('click', async () => {
    if (!validate()) return toast('Fix the highlighted problem first');
    try { await api('/api/' + name, { text: text.value }); toast(name === 'resume' ? 'Saved. Rebuilding your resumes…' : 'Settings saved'); if (name === 'resume') loadResume(); load(); }
    catch (e) { check.className = 'check bad'; check.textContent = e.message; }
  });
  return validate;
}
const checkResume = editor('resume', d => {
  const roles = d.experience || [];
  return `Looks valid: ${(d.contact || {}).name || 'no name'} · ${(d.skills || []).length} skills · ${roles.length} roles · ${roles.reduce((n, r) => n + (r.bullets || []).length, 0)} bullets · versions: ${Object.keys(d.versions || {}).join(', ') || 'none'}`;
});
const checkConfig = editor('config', d => `Looks valid: ${Object.keys(d.tracks || {}).length} role groups · ${Object.keys(d.locations || {}).length} countries · ${Object.values(d.sources || {}).filter(s => s.enabled !== false).length} sources on`);
async function loadResume() {
  const r = await api('/api/resume'); $('resume-text').value = r.text; checkResume();
  const note = $('resume-note'); note.textContent = '';
  if (r.sample) note.append(el('div', { class: 'notice', style: 'margin-bottom:14px', text: 'This is the sample resume. Replace it with yours (paste below or load a file), then save.' }));
}
async function loadConfig() { $('config-text').value = (await api('/api/config')).text; checkConfig(); }
$('resume-file').addEventListener('change', async e => { const f = e.target.files[0]; if (f) { $('resume-text').value = await f.text(); checkResume(); } e.target.value = ''; });

$('nav').addEventListener('click', e => {
  const view = e.target.dataset.view; if (!view) return;
  document.querySelectorAll('#nav button').forEach(b => b.dataset.view === view ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  document.querySelectorAll('main > section').forEach(s => { s.hidden = s.id !== 'view-' + view; });
  if (view === 'resume') loadResume();
  if (view === 'settings') loadConfig();
});
$('q').addEventListener('input', e => { F.q = e.target.value; drawList(); });
$('run').addEventListener('click', async () => { try { await api('/api/run', {}); toast('Search started'); load(); } catch (e) { toast(e.message); } });
load().catch(e => toast(e.message));
