"""Build the AI-history report and the AI Development Index from content-ops/ai-history/*.json.

python3 tools/ai-history/build.py <outdir> [published YYYY-MM-DD]
Reuses the State of AI house template (CSS, exhibits, stamp, cite box, methodology).
Writes <slug>.html, the long-format CSV per page (CLAUDE.md columns) and pages.json.
"""
import csv, datetime, html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
sys.path.insert(0, os.path.join(HERE, '..', 'state-of-ai'))
import build as B  # noqa: E402
import charts  # noqa: E402

SRC = os.environ.get('AIH_SRC') or os.path.join(ROOT, 'content-ops', 'ai-history')
E, A = B.E, B.A
UP = 'https://report-ai.org/wp-content/uploads/2026/11/'
KICK = 'font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#2545f5;margin-bottom:14px;'


H = {}
MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def xlabel(x, fmt=None):
    y = int(x)
    if fmt == 'year' or float(x) == y:
        return str(y)
    return f'{MON[min(11, int(round((float(x) - y) * 12)))]} {y}'


def rows_for(key, match=None, exclude=(), unit=None):
    out = []
    for r in H['series'][key]:
        if r.get('value') in (None, ''):
            continue
        if unit and r.get('unit') != unit:
            continue
        if match and not any(m.lower() in r['label'].lower() for m in ([match] if isinstance(match, str) else match)):
            continue
        if any(x.lower() in r['label'].lower() for x in exclude):
            continue
        out.append(r)
    return sorted(out, key=lambda r: float(r['x']))


def fmtv(v, unit):
    v = float(v); u = unit or ''
    if u == 'FLOP':
        return charts.sci(v) + ' FLOP'
    if u == 'USD':
        return '$' + (f'{v / 1e9:,.1f}B' if v >= 1e9 else f'{v / 1e6:,.1f}M' if v >= 1e6 else f'{v:,.0f}')
    if u == 'parameters':
        return (f'{v / 1e12:g}T' if v >= 1e12 else f'{v / 1e9:g}B' if v >= 1e9 else f'{v / 1e6:g}M' if v >= 1e6 else f'{v:,.0f}') + ' parameters'
    if 'users' in u and v >= 1e6:
        return f'{v / 1e6:,.0f}M {u}'
    if u.startswith('USD per'):
        return f'${v:,.3g} {u[4:]}'
    return f'{charts.fmt(v)} {u}'


def resolve(ex):
    """Fill an exhibit from content-ops/ai-history/history-data.json so verified upgrades flow through."""
    src = ex.get('from')
    if not src:
        return ex
    ex = dict(ex)
    if src == 'eras':
        ex['gantt'] = [{'label': re.sub(r'\s*\(.*?\)', '', e['name']), 'start': f"{e['start']}-01",
                        'end': f"{e['end'] or 2026}-{'11' if not e['end'] else '12'}",
                        'group': 'AI winter' if 'winter' in e['name'].lower() else 'Expansion'} for e in H['eras']]
        ex['type'] = 'gantt'
    elif src == 'series':
        groups = ex.get('groups') or [{'name': ex.get('name', ''), 'match': ex.get('match'), 'exclude': ex.get('exclude', []), 'unit': ex.get('unit_eq')}]
        sc = float(ex.get('scale', 1)); strip = ex.get('strip', '')
        series = []
        for g in groups:
            rs = rows_for(ex['key'], g.get('match'), g.get('exclude', ex.get('exclude', [])), g.get('unit', ex.get('unit_eq')))
            pts = []
            for r in rs:
                v = float(r['value']) / sc
                v = round(v, 4) if abs(v) < 1e6 else v
                lab = xlabel(r['x'], ex.get('xfmt'))
                p = [lab, v]
                if ex.get('annotate'):
                    p.append(r['label'].replace(strip, '').strip(' —'))
                pts.append(p)
            series.append({'name': g['name'], 'points': pts})
        ex['series'] = series
    elif src == 'eras_table':
        ex['table'] = {'columns': ['Era', 'Years', 'Opened with', 'Closed with', 'Marker', 'Confidence'],
                       'rows': [[e['name'], f"{e['start']}–{e['end'] or 'now'}", e.get('start_event', ''), e.get('end_event') or 'Still running', e.get('quant_marker') or '', e.get('confidence', '')] for e in H['eras']]}
        ex['type'] = 'table'
    elif src == 'series_table':
        rows = []
        for r in rows_for(ex['key'], ex.get('match'), ex.get('exclude', []), ex.get('unit_eq')):
            rows.append([r['date'], r['label'], fmtv(r['value'], r['unit']),
                         {'text': r['source'][:90], 'href': r['url']} if r.get('url') else r['source'][:90], r['confidence']])
        ex['table'] = {'columns': ['Date', 'Measure', 'Value', 'Source', 'Confidence'], 'rows': rows}
        ex['type'] = 'table'
    elif src == 'decade_table':
        rows = []
        comp = rows_for('a', unit='FLOP')
        prev = None
        for dec in range(1950, 2030, 10):
            cs = [r for r in comp if dec <= float(r['x']) < dec + 10]
            top = max(cs, key=lambda r: float(r['value'])) if cs else None
            ms = [m for m in H['milestones'] if dec <= int(m['year']) < dec + 10]
            eras = [e['name'] for e in H['eras'] if e['start'] < dec + 10 and (e['end'] or 2026) > dec]
            name = top['label'].split(': ', 1)[-1] if top else ''
            v = float(top['value']) if top else None
            if v and prev:
                r_ = v / prev
                chg = f'×{charts.sci(r_)}' if r_ >= 1 else f'lower (÷{charts.sci(1 / r_)})'
            else:
                chg = '—'
            prev = v or prev
            rows.append([f'{dec}s', ', '.join(re.sub(r'\s*\(.*?\)', '', x) for x in eras),
                         f"{charts.sci(v)} FLOP ({name}, {str(top['date'])[:4]})" if top else '—', chg,
                         '; '.join(m['title'] for m in ms[:4]) + (f' (+{len(ms) - 4} more)' if len(ms) > 4 else ''), 'DERIVED'])
        ex['table'] = {'columns': ['Decade', 'Era(s)', 'Largest estimated training run', 'Change on previous decade', 'Landmarks', 'Confidence'], 'rows': rows}
        ex['type'] = 'table'
    elif src == 'milestones':
        lo, hi = ex.get('from_year', 0), ex.get('to_year', 9999)
        rows = []
        for m in H['milestones']:
            if lo <= int(m['year']) <= hi:
                rows.append([m['date'], m['title'], m['significance'] + ((' ' + m['quant_hook']) if m.get('quant_hook') else ''),
                             {'text': m['source'][:80], 'href': m['url']} if m.get('url') else m['source'][:80], m['confidence']])
        ex['table'] = {'columns': ['Date', 'Milestone', 'What it showed', 'Source', 'Confidence'], 'rows': rows}
        ex['type'] = 'table'
    return ex


def crumbs(trail):
    sep = ' <span style="color:#d3d3da;">/</span> '
    parts = ['<a href="/" style="color:#9a9aa2;text-decoration:none;">Home</a>']
    for name, href in trail[:-1]:
        parts.append(f'<a href="{href}" style="color:#9a9aa2;text-decoration:none;">{E(name)}</a>')
    parts.append(f'<span style="color:#111114;">{E(trail[-1][0])}</span>')
    return f'<div class="tai-mono" style="font-size:11px;color:#9a9aa2;margin-bottom:16px;">{sep.join(parts)}</div>'


def header(trail, eyebrow, h1, dek, byline, nav_links):
    nav = '<div class="tai-nav">' + ''.join(f'<a href="{u}"{B.ON if on else ""}>{E(n)}</a>' for n, u, on in nav_links) + '</div>'
    return f'''<div class="tai-padx" style="padding:48px 36px 30px;">
{crumbs(trail)}
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#2545f5;margin-bottom:12px;">{eyebrow}</div>
<h1 style="font-weight:900;font-size:clamp(34px,6vw,52px);line-height:1.0;letter-spacing:-0.03em;margin:0 0 16px;">{E(h1)}</h1>
<p style="font-size:18px;color:#55555e;margin:0 0 14px;">{E(dek)}</p>
<div class="tai-mono" style="font-size:12px;color:#9a9aa2;">{byline}</div>
{nav}
</div>'''


def tiles(ts):
    n = len(ts)
    return f'\n<div class="tai-statgrid" style="display:grid;grid-template-columns:repeat({n},1fr);border-bottom:1px solid #e6e6ea;">' + ''.join(
        f'<div class="tai-stat"{B.NOBR if i == n - 1 else ""}><div style="font-weight:900;font-size:30px;letter-spacing:-0.03em;color:#2545f5;">{E(t["value"])}</div>'
        f'<div style="font-size:12px;line-height:1.35;color:#6e6e76;margin-top:8px;">{E(t["label"])} {B.chip(t.get("confidence"))}</div></div>'
        for i, t in enumerate(ts)) + '</div>'


def link_cell(x):
    """Table cells are plain text unless given as {"text":..,"href":..} (internal links only)."""
    if isinstance(x, dict) and x.get('href'):
        ext = x['href'].startswith('http') and 'report-ai.org' not in x['href']
        attrs = ' target="_blank" rel="nofollow noopener"' if ext else ''
        return f'<a href="{A(x["href"])}"{attrs}>{E(x.get("text", ""))}</a>'
    if isinstance(x, dict):
        return E(x.get('text', ''))
    s = str(x)
    m = re.fullmatch(r'(HIGH|MEDIUM|DERIVED|CONTESTED)', s.strip())
    return B.chip(s.strip()) if m else E(s)


def table(t):
    cols, rows = t['columns'], t['rows']
    return ('<div class="tai-tablewrap"><table class="tai-table"><tr>' + ''.join(f'<th>{E(c)}</th>' for c in cols) + '</tr>' +
            ''.join('<tr>' + ''.join(f'<td>{"<strong>" + link_cell(x) + "</strong>" if j == 0 else link_cell(x)}</td>' for j, x in enumerate(r)) + '</tr>' for r in rows) +
            '</table></div>')


def plain(x):
    return x.get('text', '') if isinstance(x, dict) else str(x)


class Tables:
    """Collects every table and exhibit dataset for the long-format CSV."""
    def __init__(self):
        self.rows = []; self.n = 0

    def add(self, section, cols, rows):
        self.n += 1
        for r in rows:
            for j in range(1, len(cols)):
                if j < len(r) and plain(r[j]) != '':
                    self.rows.append([self.n, section, plain(r[0]), cols[j], plain(r[j])])

    def add_exhibit(self, ex):
        sec = ex.get('title', '')
        if ex.get('type') == 'gantt':
            self.add(sec, ['Event', 'Group', 'Start', 'End'], [[g['label'], g.get('group', ''), g['start'], '' if g.get('milestone') else g.get('end', '')] for g in ex['gantt']])
        elif ex.get('type') == 'table':
            self.add(sec, ex['table']['columns'], ex['table']['rows'])
        else:
            rows = []
            for s in ex.get('series', []):
                for p in s['points']:
                    rows.append([p[0], s['name'] + (f' — {p[2]}' if len(p) > 2 else ''), p[1]])
            self.add(sec, ['Date', 'Series', ex.get('unit', 'Value')], rows)


def write_csv(path, url, published, rows):
    with open(path, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['page_url', 'page_updated', 'table_no', 'table_section', 'row', 'column', 'value'])
        for r in rows:
            w.writerow([url, published] + r)


def ld(kind, headline, desc, url, published, faqs, csv_name, cover, about=None):
    g = [{"@type": kind, "headline": headline, "name": headline, "description": desc, "url": url, "mainEntityOfPage": url,
          "datePublished": published, "dateModified": published,
          "author": {"@type": "Organization", "name": "Report AI", "url": "https://report-ai.org"},
          "publisher": {"@id": "https://report-ai.org/#organization"}}]
    if about:
        g[0]["about"] = about
    if faqs:
        g.append({"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in faqs]})
    g.append({"@type": "Dataset", "name": f'{headline} (data)', "description": desc, "url": url,
              "creator": {"@type": "Organization", "name": "Report AI", "url": "https://report-ai.org"},
              "publisher": {"@id": "https://report-ai.org/#organization"}, "isAccessibleForFree": True,
              "license": "https://creativecommons.org/licenses/by/4.0/",
              "dateModified": published, "temporalCoverage": cover,
              "distribution": [{"@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": UP + csv_name}]})
    s = json.dumps({"@context": "https://schema.org", "@graph": g}, ensure_ascii=False, separators=(',', ':'))
    return '\n<!-- wp:html -->\n<script type="application/ld+json">' + s + '</script>\n<!-- /wp:html -->'


def stop_block(stop):
    if not stop:
        return ''
    rows = ''.join(f'<tr><td>&ldquo;{E(x["claim"])}&rdquo;</td><td>{E(x["fact"])}{B.detail(x.get("link"))}</td></tr>' for x in stop)
    return f'\n<div class="tai-padx" id="stop-quoting"><div class="tai-kicker">Fact check</div><h2>Numbers to stop quoting</h2><div class="tai-tablewrap"><table class="tai-table"><tr><th>Widely repeated</th><th>What the evidence supports</th></tr>{rows}</table></div></div>'


def page(d, kind, published, published_h, outdir):
    url = 'https://report-ai.org' + d['path']
    csv_name = d['csv']
    C = B.Counter(); T = Tables()
    chs = d.get('chapters', [])
    toc = ''.join(f'<li><a href="#{c.get("id") or "ch-" + str(i + 1)}">{E(c.get("kicker", ""))}</a> &mdash; {E(c.get("action_title", ""))}</li>' for i, c in enumerate(chs))
    toc += ''.join(f'<li><a href="#{a}">{E(t)}</a></li>' for a, t in d.get('toc_extra', []))
    body = header(d['trail'], d['eyebrow'], d['title'], d['dek'],
                  f'By the Report AI editorial team &middot; Published <time datetime="{published}">{published_h}</time> &middot; {d.get("cadence_note", "")}',
                  [(n, u, n == d.get('nav_active')) for n, u in d.get('nav', [])])
    if d.get('tiles'):
        body += tiles(d['tiles'])
    body += ('\n<div class="tai-padx"><div class="tai-glance"><div class="k">At a glance</div><ul>' +
             ''.join(f'<li>{E(x)}</li>' for x in d['at_a_glance']) + '</ul></div>' +
             B.cite_box(d['title'], d.get('edition'), url, published_h, csv_name, 0).replace(' &middot; 0 metrics with source, date and confidence for every value.', ' &middot; every table and exhibit on this page, with sources and confidence ratings.') +
             f'<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#77777f;margin:30px 0 10px;">In this {"index" if kind == "index" else "report"}</div><ol class="tai-toc">{toc}</ol></div>')
    if d.get('analysis'):
        body += (f'\n<div class="tai-padx" style="background:#f5f5f7;" id="analysis"><div class="tai-mono" style="{KICK}">Analysis</div>' + B.paras(d['analysis']) +
                 '<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#77777f;margin:26px 0 10px;">Key takeaways</div><ul style="font-size:15.5px;line-height:1.6;color:#33333a;max-width:880px;padding-left:20px;margin:0;">' +
                 ''.join(f'<li style="margin-bottom:8px;">{E(x)}</li>' for x in d.get('takeaways', [])) + '</ul></div>')
    for i, c in enumerate(chs):
        cid = c.get('id') or f'ch-{i + 1}'
        bg = ' style="background:#f5f5f7;"' if c.get('shade') else ''
        body += f'\n<div class="tai-padx tai-ch" id="{cid}"{bg}><div class="tai-kicker">{E(c.get("kicker", ""))}</div><h2>{E(c.get("action_title", ""))}</h2>'
        ps = c.get('paras', []); exs = [resolve(e) for e in c.get('exhibits', [])]
        k = max(1, (len(ps) + 1) // 2)
        for e in exs:
            T.add_exhibit(e)
        body += B.paras(ps[:k]) + ''.join(C.ex(e) for e in exs[:1]) + B.paras(ps[k:]) + ''.join(C.ex(e) for e in exs[1:])
        for tb in c.get('tables', []):
            if tb.get('from'):
                tb = dict(tb, **resolve(tb)['table'])
            T.add(tb.get('title') or c.get('kicker', ''), tb['columns'], tb['rows'])
            body += (f'<h3>{E(tb["title"])}</h3>' if tb.get('title') else '') + table(tb) + (f'<p class="tai-mono" style="font-size:11.5px;color:#77777f;margin-top:8px;">{E(tb["note"])}</p>' if tb.get('note') else '')
        if c.get('after'):
            body += B.paras(c['after'])
        body += B.sidebar(c.get('sidebar')) + '</div>'
    body += stop_block(d.get('stop_quoting'))
    ol = d.get('outlook')
    if ol:
        watch = ''.join(f'<tr><td><strong>{E(w["indicator"])}</strong></td><td>{E(w["now"])}</td><td>{E(w["signal"])}</td></tr>' for w in ol.get('watch', []))
        body += (f'\n<div class="tai-padx tai-ch" id="outlook" style="background:#f5f5f7;"><div class="tai-kicker">Outlook</div><h2>{E(ol["action_title"])}</h2>' + B.paras(ol.get('paras')) +
                 (f'<h3>What to watch</h3><div class="tai-tablewrap"><table class="tai-table"><tr><th>Indicator</th><th>Where it stands</th><th>What would change the picture</th></tr>{watch}</table></div>' if watch else '') + '</div>')
    if d.get('definitions'):
        body += '\n<div class="tai-padx" id="definitions"><div class="tai-kicker">Definitions</div><h2>Terms used in this ' + ('index' if kind == 'index' else 'report') + '</h2><dl class="tai-dl">' + \
            ''.join(f'<dt>{link_cell(x["term"]) if isinstance(x["term"], dict) else E(x["term"])}</dt><dd>{E(x["def"])}</dd>' for x in d['definitions']) + '</dl></div>'
    body += f'\n<div class="tai-padx" id="faq"><h2>Frequently asked</h2>{B.faq_html(d["faq"])}</div>'
    body += '<div id="about"></div>' + B.methodology(d.get('methodology_extra', '')) + B.related(d['related'])
    full = '<!-- wp:html -->\n' + B.CSS + '\n<div class="tai-wrap">\n' + charts.STAMP_SPRITE + body + '\n</div>\n<!-- /wp:html -->'
    full += ld('Article', d['title'], d['dek'], url, published, d['faq'], csv_name, d.get('coverage', '1950/2026'), d.get('about'))
    write_csv(os.path.join(outdir, csv_name), url, published, T.rows)
    return dict(slug=d['slug'], title=d['title'] + ' — Report AI', excerpt=B.clip(d['dek']), html=full, csv=csv_name, url=url,
                exhibits=C.n, tables=T.n, csv_rows=len(T.rows), parent_path=d.get('parent_path'))


if __name__ == '__main__':
    outdir = sys.argv[1]; published = sys.argv[2] if len(sys.argv) > 2 else datetime.date.today().isoformat()
    published_h = datetime.date.fromisoformat(published).strftime('%-d %B %Y')
    os.makedirs(outdir, exist_ok=True)
    # AIH_DATA: dataset file feeding `from` exhibits (default history-data.json);
    # AIH_PAGES: comma list of name:kind (default the three AI-history pages)
    dpath = os.path.join(SRC, os.environ.get('AIH_DATA', 'history-data.json'))
    if os.path.exists(dpath):
        H.update(json.load(open(dpath)))
    plist = os.environ.get('AIH_PAGES', 'report:report,perez:report,index:index')
    out = []
    for name, kind in (x.split(':') for x in plist.split(',')):
        p = os.path.join(SRC, name + '.json')
        if not os.path.exists(p):
            continue
        d = json.load(open(p))
        if d.get('stop_from_data'):
            d['stop_quoting'] = d.get('stop_quoting', []) + [dict(x, fact=x.get('fact') or '', link=x.get('link') or x.get('report_ai_link')) for x in H.get('stop_quoting', [])]
        r = page(d, kind, published, published_h, outdir)
        fn = r['slug'] + '.html'
        open(os.path.join(outdir, fn), 'w').write(r['html'])
        text = re.sub(r'<script.*?</script>|<style.*?</style>|<svg.*?</svg>', ' ', r['html'], flags=re.S)
        words = len(re.sub(r'<[^>]+>', ' ', text).split())
        for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', r['html'], re.S):
            json.loads(m.group(1))
        print(f"{fn}: {len(r['html']):,} bytes, ~{words:,} words, {r['exhibits']} exhibits, {r['tables']} tables, {r['csv_rows']} CSV rows")
        out.append({k: v for k, v in r.items() if k != 'html'} | {'file': fn})
    json.dump(out, open(os.path.join(outdir, 'pages.json'), 'w'), indent=1)
