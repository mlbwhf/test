"""Re-date the go-live pages still unpublished on 18 Nov 2026 (16 Nov -> 18 Nov), update plan.json,
and verify every plan entry reproduces its target from the PRE (pre-go-live) content.
Run: python3 content-ops/golive/redate_20261118.py"""
import json, subprocess, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PRE = 'b709e4a146623829fa04b8c69f44babe478e3046'
os.chdir(ROOT)
plan = json.load(open('content-ops/golive/plan.json'))
D16 = [('"2026-11-16"', '"2026-11-18"', 4), ('>16 November 2026<', '>18 November 2026<', 1),
       ('published 16 November 2026.', 'published 18 November 2026.', 1)]
SOA = {3756, 3757, 3851, 4007, 4009}

def pre(path):
    return subprocess.run(['git', 'show', f'{PRE}:{path}'], capture_output=True, text=True, check=True).stdout

def apply(s, edits):
    for e in edits:
        n = s.count(e['search'])
        assert n == e['count'], (e['search'][:60], n, e['count'])
        s = s.replace(e['search'], e['replace'])
    return s

for d in plan:
    if d['id'] in SOA:
        t = open(d['new_local']).read()
        for a, b, n in D16:
            assert t.count(a) == n, (d['id'], a, t.count(a))
            t = t.replace(a, b)
        open(d['new_local'], 'w').write(t)
        d['simple'] = [dict(e, replace=e['replace'].replace('16 November', '18 November').replace('2026-11-16', '2026-11-18')) for e in d['simple']]
    elif d['id'] == 3915:
        s = pre(d['old'])
        edits = [dict(e, replace=e['replace'].replace('16 November', '18 November').replace('2026-11-16', '2026-11-18').replace('rev20261116', 'rev20261118')) for e in d['simple']]
        edits += [{'search': '<td>None users</td>', 'replace': '<td></td>', 'count': s.count('<td>None users</td>')},
                  {'search': '<td>None monthly users</td>', 'replace': '<td></td>', 'count': s.count('<td>None monthly users</td>')}]
        i = s.find('<td>Sarvam Indus</td>'); a = s.rfind('<tr>', 0, i); b = s.find('</tr>', i) + 5
        edits.append({'search': s[a:b], 'replace': '', 'count': 1})
        d['simple'] = edits
    else:
        continue
    out = apply(pre(d['old']), d['simple'])
    assert out == open(d['new_local']).read(), f"{d['id']}: plan does not reproduce target"
    d['redated'] = '2026-11-18'
    print(d['id'], 'OK', [(e['count']) for e in d['simple']])
json.dump(plan, open('content-ops/golive/plan.json', 'w'), indent=1, ensure_ascii=False)
