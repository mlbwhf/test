"""Compare a page's live raw content with the local file.
python3 tools/state-of-ai/compare.py <saved list_pages/get result (json or text)> <local.html>"""
import json, sys
raw = open(sys.argv[1]).read(); local = open(sys.argv[2]).read()
try:
    d = json.loads(raw)
    if isinstance(d, dict) and 'content' not in d:
        d = d.get('posts') or d.get('pages') or d.get('result') or d
    if isinstance(d, list): d = d[0]
    c = d['content']
    live = c['raw'] if isinstance(c, dict) else c
except Exception as e:
    sys.exit(f'could not parse saved result: {e}')
if live == local:
    print('IDENTICAL', len(local.encode()), 'bytes'); sys.exit(0)
i = next((k for k in range(min(len(live), len(local))) if live[k] != local[k]), min(len(live), len(local)))
print('DIFFER at char', i, 'live len', len(live), 'local len', len(local))
print('local:', repr(local[max(0, i - 120):i + 200]))
print('live :', repr(live[max(0, i - 120):i + 200]))
sys.exit(1)
