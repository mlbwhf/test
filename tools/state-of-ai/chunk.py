"""Split a built page into <=LIMIT-byte chunks for marker-based writes.
python3 tools/state-of-ai/chunk.py <page.html> <outdir> [limit]
chunk_NN.html: every chunk but the last ends with the marker <!--RAI-NEXT-->."""
import os, sys
M = '<!--RAI-NEXT-->'
src, out = sys.argv[1], sys.argv[2]; limit = int(sys.argv[3]) if len(sys.argv) > 3 else 15000
s = open(src).read(); assert M not in s
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    if f.startswith('chunk_'): os.remove(os.path.join(out, f))
pieces, cur = [], ''
for line in s.splitlines(keepends=True):
    while len(line.encode()) > limit:  # very long line: split at a tag boundary
        cut = line.rfind('><', 0, limit - 200) + 1 or limit - 200
        if cur: pieces.append(cur); cur = ''
        pieces.append(line[:cut]); line = line[cut:]
    if len((cur + line).encode()) > limit and cur:
        pieces.append(cur); cur = ''
    cur += line
if cur: pieces.append(cur)
for i, p in enumerate(pieces):
    open(os.path.join(out, f'chunk_{i + 1:02d}.html'), 'w').write(p + (M if i < len(pieces) - 1 else ''))
assert ''.join(pieces) == s
print(len(pieces), 'chunks', [len(p.encode()) for p in pieces])
