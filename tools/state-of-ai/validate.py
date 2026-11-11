"""Validate theme data + narrative files against BRIEF.md / BRIEF-NARRATIVE.md."""
import json, os, sys, re
D = os.path.join(os.path.dirname(__file__), '..', '..', 'content-ops', 'state-of-ai')
CONF = {'HIGH', 'MEDIUM', 'DERIVED', 'CONTESTED'}
for t in sys.argv[1:]:
    d = json.load(open(f'{D}/data/{t}.json')); probs = []
    ms = d['metrics']; full = [m for m in ms if all((m['values'].get(y) or {}).get('value') for y in ('2024', '2025', '2026'))]
    for m in ms:
        for y, v in m['values'].items():
            if v and v.get('value') not in (None, '') and (v.get('confidence') or '').upper() not in CONF:
                probs.append(f'{m["id"]} {y} confidence={v.get("confidence")}')
            if v and v.get('num') not in (None, '') and not isinstance(v.get('num'), (int, float)):
                probs.append(f'{m["id"]} {y} num not numeric: {v.get("num")!r}')
    for y in ('2024', '2025', '2026'):
        if len(d['headlines'].get(y, [])) < 5: probs.append(f'headlines {y} < 5')
    n_ex = 0; words = 0
    np_ = f'{D}/narrative/{t}.json'
    if os.path.exists(np_):
        n = json.load(open(np_))
        blocks = n['chapters'] + [n.get('comparison', {})]
        for c in blocks:
            for e in c.get('exhibits', []):
                n_ex += 1
                if e.get('type') not in ('line', 'bar', 'hbar', 'grouped', 'gantt', 'table'): probs.append(f'exhibit type {e.get("type")}')
                for s in e.get('series') or []:
                    for p in s.get('points', []):
                        if not (isinstance(p, list) and len(p) == 2 and isinstance(p[1], (int, float))): probs.append(f'bad point in "{e.get("title","")[:40]}": {p!r}')
        txt = json.dumps(n, ensure_ascii=False)
        words = len(re.findall(r'\w+', ' '.join(p for c in blocks for p in c.get('paras', []))))
    print(f'{t}: metrics {len(ms)} (3-year {len(full)}), narrative exhibits {n_ex}, chapter words {words}, problems {len(probs)}')
    for p in probs[:12]: print('   ', p)
