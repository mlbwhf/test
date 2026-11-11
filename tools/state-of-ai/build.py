"""Build the State of AI series pages from content-ops/state-of-ai/data/<theme>.json.

python3 tools/state-of-ai/build.py <outdir> [published YYYY-MM-DD]
Writes one HTML file and one CSV per page plus pages.json (slug, title, excerpt, file).
"""
import csv, html, json, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
DATA = os.environ.get('SOA_DATA') or os.path.join(ROOT, 'content-ops', 'state-of-ai', 'data')
THEMES = ['usage', 'spending', 'finance', 'work', 'models', 'tokens', 'infrastructure', 'geography', 'industries', 'risk', 'regulation']
SLUG = {'usage': 'state-of-ai-usage', 'spending': 'state-of-ai-spending', 'finance': 'state-of-ai-finance',
        'work': 'state-of-ai-work', 'models': 'state-of-ai-models-prices', 'risk': 'state-of-ai-risk',
        'regulation': 'state-of-ai-regulation', 'tokens': 'state-of-ai-tokens',
        'infrastructure': 'state-of-ai-infrastructure-energy', 'geography': 'state-of-ai-geography',
        'industries': 'state-of-ai-industries'}
NAME = {'usage': 'Usage', 'spending': 'Spending', 'finance': 'Finance', 'work': 'Work',
        'models': 'Models & Prices', 'risk': 'Risk', 'regulation': 'Regulation',
        'tokens': 'Tokens', 'infrastructure': 'Infrastructure & Energy', 'geography': 'Geography', 'industries': 'Industries'}
NARR = os.environ.get('SOA_NARR') or os.path.join(ROOT, 'content-ops', 'state-of-ai', 'narrative')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import charts
BASE = 'https://report-ai.org/indexes/state-of-ai/'
UP = 'https://report-ai.org/wp-content/uploads/2026/11/'
YEARS = ['2024', '2025', '2026']

ON = ' class="on"'
NOBR = ' style="border-right:none;"'
def detail(link):
    return f' &middot; <a href="{html.escape(link, quote=True)}">detail</a>' if link else ''

E = lambda s: html.escape(str(s), quote=False)
A = lambda s: html.escape(str(s), quote=True)

EXTRA_CSS = r""".tai-glance{background:#111114;color:#fff;border-radius:8px;padding:26px 28px;max-width:920px;}
.tai-glance ul{margin:0;padding-left:20px;}
.tai-glance li{font-size:16px;line-height:1.55;margin-bottom:10px;color:#f2f2f5;}
.tai-glance .k{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#9fb0ff;margin-bottom:12px;font-weight:600;}
.tai-kicker{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#2545f5;margin-bottom:8px;}
.tai-ch h2{font-size:clamp(22px,3.2vw,28px);line-height:1.2;max-width:900px;}
.tai-side{background:#eef1fd;border-radius:6px;padding:18px 22px;margin:22px 0;max-width:880px;}
.tai-side .t{font-weight:800;font-size:15px;margin-bottom:6px;}
.tai-side p{font-size:14.5px;margin:0;}
.tai-toc{columns:2;column-gap:36px;font-size:14px;max-width:900px;padding-left:18px;}
.tai-toc li{margin-bottom:6px;break-inside:avoid;}
.tai-dl dt{font-weight:700;font-size:14.5px;margin-top:12px;}.tai-dl dd{margin:2px 0 0;font-size:14.5px;color:#55555e;max-width:860px;}
@media(max-width:900px){.tai-toc{columns:1;}}
"""

CSS = """<style>
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.tai-wrap{font-family:'Archivo',sans-serif;color:#111114;max-width:1100px;margin:0 auto;width:100%;line-height:1.5;}
.tai-wrap *{box-sizing:border-box;}
.tai-mono{font-family:'IBM Plex Mono',monospace;}
.tai-wrap a{color:#2545f5;}
.tai-padx{padding:40px 36px;border-bottom:1px solid #e6e6ea;}
.tai-wrap h2{font-weight:800;font-size:26px;letter-spacing:-0.02em;margin:0 0 14px;}
.tai-wrap h3{font-weight:800;font-size:18px;margin:26px 0 10px;}
.tai-wrap p{font-size:16px;line-height:1.65;color:#33333a;max-width:880px;}
.tai-stat{padding:24px;border-right:1px solid #e6e6ea;}
.tai-table{width:100%;border-collapse:collapse;font-size:13px;}
.tai-table th{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#6e6e76;text-align:left;padding:9px 10px;border-bottom:2px solid #111114;}
.tai-table td{padding:10px;border-bottom:1px solid #ececf0;vertical-align:top;color:#33333a;}
.tai-tablewrap{overflow-x:auto;}
.tai-c{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;letter-spacing:.05em;padding:1px 5px;border-radius:2px;white-space:nowrap;vertical-align:middle;}
.tai-c-HIGH{background:#e7f5ec;color:#177245;}.tai-c-MEDIUM{background:#fdf3e3;color:#9a6a00;}.tai-c-DERIVED{background:#eef1fd;color:#2545f5;}.tai-c-CONTESTED{background:#fde8e8;color:#b42318;}
.tai-five{counter-reset:five;list-style:none;padding:0;margin:0;max-width:900px;}
.tai-five li{counter-increment:five;position:relative;padding:14px 0 14px 46px;border-bottom:1px solid #e6e6ea;font-size:16.5px;line-height:1.55;color:#111114;}
.tai-five li:before{content:counter(five);position:absolute;left:0;top:12px;font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:15px;color:#fff;background:#2545f5;width:30px;height:30px;border-radius:50%;text-align:center;line-height:30px;}
.tai-cite{background:#fafafb;border:1px solid #e6e6ea;border-left:3px solid #2545f5;border-radius:6px;padding:14px 18px;font-size:14px;line-height:1.55;color:#33333a;margin:18px 0 0;max-width:900px;}
.tai-yr{display:flex;align-items:flex-end;gap:6px;height:120px;}
.tai-yr span{display:block;width:28px;border-radius:3px 3px 0 0;background:#c9cfe0;}
.tai-yr span.n{background:#2545f5;}
.tai-chart{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px;margin:18px 0 6px;}
.tai-chart .cap{font-size:13px;font-weight:700;margin-top:8px;line-height:1.3;}
.tai-chart .val{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#55555e;margin-top:4px;}
.tai-nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.tai-nav a{font-family:'IBM Plex Mono',monospace;font-size:11.5px;text-decoration:none;border:1px solid #d9dbe3;border-radius:999px;padding:5px 11px;color:#111114;}
.tai-nav a.on{background:#2545f5;border-color:#2545f5;color:#fff;}
.tai-up{color:#177245;}.tai-down{color:#b42318;}
%%EXTRA%%@media(max-width:900px){.tai-statgrid{grid-template-columns:1fr 1fr!important;}.tai-stat{border-bottom:1px solid #e6e6ea;}.tai-padx{padding:30px 20px!important;}}
</style>""".replace("%%EXTRA%%", EXTRA_CSS + charts.CSS)


def load():
    out = {}
    for t in THEMES:
        p = os.path.join(DATA, t + '.json')
        if os.path.exists(p):
            out[t] = json.load(open(p))
    return out


def chip(conf):
    conf = (conf or '').upper()
    return f'<span class="tai-c tai-c-{conf}">{conf}</span>' if conf in ('HIGH', 'MEDIUM', 'DERIVED', 'CONTESTED') else ''


def cell(v, with_meta=True):
    if not v or v.get('value') in (None, '', 'null'):
        return '<span style="color:#9a9aa2;">&mdash;</span>'
    s = f"<strong>{E(v['value'])}</strong>"
    if with_meta:
        meta = ', '.join(x for x in [v.get('as_of'), v.get('source')] if x)
        if meta:
            s += f'<br><span style="font-size:11.5px;color:#77777f;">{E(meta)}</span>'
        s += ' ' + chip(v.get('confidence'))
    return s


def change(a, b):
    try:
        x, y = float(a['num']), float(b['num'])
        if x == 0:
            return ''
        pct = (y - x) / x * 100
        cls = 'tai-up' if pct >= 0 else 'tai-down'
        return f'<span class="{cls}">{"+" if pct >= 0 else ""}{pct:,.0f}%</span>'
    except Exception:
        return ''


def nav(active):
    links = [('Overview', BASE)] + [(NAME[t], BASE + SLUG[t] + '/') for t in THEMES] + \
            [('2024', BASE + 'state-of-ai-2024/'), ('2025', BASE + 'state-of-ai-2025/'),
             ('Year over year', BASE + 'state-of-ai-year-over-year/')]
    return '<div class="tai-nav">' + ''.join(
        f'<a href="{u.replace("https://report-ai.org", "")}"{ON if n == active else ""}>{E(n)}</a>' for n, u in links) + '</div>'


def header(crumb, eyebrow, h1, dek, byline, active):
    return f'''<div class="tai-padx" style="padding:48px 36px 30px;">
<div class="tai-mono" style="font-size:11px;color:#9a9aa2;margin-bottom:16px;"><a href="/" style="color:#9a9aa2;text-decoration:none;">Home</a> <span style="color:#d3d3da;">/</span> <a href="/indexes/" style="color:#9a9aa2;text-decoration:none;">Indexes</a> <span style="color:#d3d3da;">/</span> <a href="/indexes/state-of-ai/" style="color:#9a9aa2;text-decoration:none;">State of AI</a> <span style="color:#d3d3da;">/</span> <span style="color:#111114;">{E(crumb)}</span></div>
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#2545f5;margin-bottom:12px;">{eyebrow}</div>
<h1 style="font-weight:900;font-size:clamp(34px,6vw,52px);line-height:1.0;letter-spacing:-0.03em;margin:0 0 16px;">{E(h1)}</h1>
<p style="font-size:18px;color:#55555e;margin:0 0 14px;">{dek}</p>
<div class="tai-mono" style="font-size:12px;color:#9a9aa2;">{byline}</div>
{nav(active)}
</div>'''


def cite_box(title, edition, url, published_h, csv_name, n_metrics):
    return f'''<div class="tai-cite"><div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#2545f5;font-weight:600;margin-bottom:4px;">Cite this report</div>
Report AI, <em>{E(title)}</em>{(", " + E(edition)) if edition else ""}, published {E(published_h)}. {E(url)}<br>
<span id="download-data"><a href="/wp-content/uploads/2026/11/{csv_name}" download style="font-weight:600;">Download the data (CSV)</a> &middot; {n_metrics} metrics with source, date and confidence for every value. Free to quote with attribution and a link.</span></div>'''


def five(items):
    return '<ol class="tai-five">' + ''.join(f'<li>{E(s)}</li>' for s in items) + '</ol>'


def yoy_charts(metrics, n=3):
    pick = [m for m in metrics if m.get('yoy') and all((m['values'].get(y) or {}).get('num') not in (None, '') for y in YEARS)][:n]
    if not pick:
        return ''
    blocks = []
    for m in pick:
        nums = [float(m['values'][y]['num']) for y in YEARS]
        mx = max(nums) or 1
        bars = ''.join(f'<span class="{"n" if y == "2026" else ""}" style="height:{max(4, v / mx * 100):.0f}%;" title="{y}: {A(m["values"][y]["value"])}"></span>' for y, v in zip(YEARS, nums))
        vals = ' &middot; '.join(f'{y}: {E(m["values"][y]["value"])}' for y in YEARS)
        blocks.append(f'<div><div class="tai-yr">{bars}</div><div class="cap">{E(m["label"])}</div><div class="val">{vals}</div></div>')
    return '<div class="tai-chart">' + ''.join(blocks) + '</div><p class="tai-mono" style="font-size:11px;color:#77777f;margin:6px 0 0;">Bars: 2024, 2025, 2026 (to date, blue). Each scaled to its own maximum.</p>'


def metric_table(metrics, years=YEARS, with_change=True):
    groups = {}
    for m in metrics:
        groups.setdefault(m.get('group') or 'Other', []).append(m)
    out = ''
    for g, ms in groups.items():
        out += f'<h3>{E(g)}</h3><div class="tai-tablewrap"><table class="tai-table"><tr><th>Measure</th>' + \
               ''.join(f'<th>{y}{" (to date)" if y == "2026" else ""}</th>' for y in years) + \
               ('<th>Change</th>' if with_change and len(years) > 1 else '') + '</tr>'
        for m in ms:
            v = m['values']
            out += f'<tr><td><strong>{E(m["label"])}</strong><br><span style="font-size:11.5px;color:#77777f;">{E(m.get("unit", ""))}</span></td>' + \
                   ''.join(f'<td>{cell(v.get(y))}</td>' for y in years)
            if with_change and len(years) > 1:
                out += f'<td>{change(v.get(years[-2]) or {}, v.get(years[-1]) or {})}</td>'
            out += '</tr>'
        out += '</table></div>'
    return out


def faq_html(faqs):
    return ''.join(f'<p style="font-size:15px;margin:0 0 6px;"><strong>{E(f["q"])}</strong></p><p style="font-size:14.5px;color:#55555e;margin:0 0 18px;">{E(f["a"])}</p>' for f in faqs)


def ld(headline, desc, url, published, faqs, csv_name, dataset_name, years_cov):
    g = [{"@type": "Article", "headline": headline, "description": desc, "url": url, "mainEntityOfPage": url,
          "datePublished": published, "dateModified": published,
          "author": {"@type": "Organization", "name": "Report AI", "url": "https://report-ai.org"},
          "publisher": {"@id": "https://report-ai.org/#organization"}, "isPartOf": {"@type": "CreativeWorkSeries", "name": "State of AI — Report AI", "url": BASE}}]
    if faqs:
        g.append({"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in faqs]})
    g.append({"@type": "Dataset", "name": dataset_name, "description": desc, "url": url,
              "creator": {"@type": "Organization", "name": "Report AI", "url": "https://report-ai.org"},
              "publisher": {"@id": "https://report-ai.org/#organization"}, "isAccessibleForFree": True,
              "dateModified": published, "temporalCoverage": years_cov,
              "distribution": [{"@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": UP + csv_name}]})
    s = json.dumps({"@context": "https://schema.org", "@graph": g}, ensure_ascii=False, separators=(',', ':'))
    return '\n<!-- wp:html -->\n<script type="application/ld+json">' + s + '</script>\n<!-- /wp:html -->'


def write_csv(path, url, published, rows):
    with open(path, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['page_url', 'page_updated', 'theme', 'metric_id', 'metric', 'unit', 'year', 'value', 'value_numeric', 'as_of', 'source', 'source_url', 'confidence', 'note'])
        for t, m, y, v in rows:
            w.writerow([url, published, t, m['id'], m['label'], m.get('unit', ''), y, v.get('value', ''), v.get('num', ''), v.get('as_of', ''), v.get('source', ''), v.get('url', ''), v.get('confidence', ''), v.get('note', '')])


def methodology(extra=''):
    return f'''<div class="tai-padx" style="padding:28px 36px;">
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9a9aa2;margin-bottom:10px;">Methodology &amp; sources</div>
<p style="font-size:13.5px;line-height:1.6;color:#6e6e76;">Figures are compiled from company disclosures, regulators, research firms and reputable reporting, and cross-checked against Report AI's own index pages. Each value carries its as-of date, source and a confidence rating: <strong>HIGH</strong> where the primary source was read, <strong>MEDIUM</strong> where it rests on consistent reputable secondary reporting (most figures, because many primary pages cannot be opened from our research environment), <strong>DERIVED</strong> where it is our own arithmetic, and <strong>CONTESTED</strong> where credible sources disagree. A year means the calendar year the figure describes; 2026 values are the latest available and marked &ldquo;to date&rdquo;. Weekly and monthly user counts, and forecasts and outcomes, are never compared as if they were the same measure. {extra}These reports compile and verify secondary data with original analysis; they are not original surveys. See our <a href="/about/editorial-standards/">editorial standards</a>, <a href="/about/corrections/">corrections log</a> and <a href="/reports/ai-statistics-fact-check/">fact-check register</a>.</p>
</div>'''


def related(pages_html):
    return f'''<div class="tai-padx" style="padding:28px 36px;border-bottom:none;">
<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9a9aa2;margin-bottom:10px;">Related on Report AI</div>
<p style="font-size:14px;margin:0;">{pages_html}</p></div>'''


SERIES_LINKS = ' &middot; '.join(f'<a href="/indexes/state-of-ai/{SLUG[t]}/">State of AI {NAME[t]}</a>' for t in THEMES) + \
    ' &middot; <a href="/indexes/state-of-ai/state-of-ai-year-over-year/">Year over year</a> &middot; <a href="/reports/ai-market-pulse/">AI Market Pulse</a> &middot; <a href="/reports/ai-statistics-fact-check/">AI statistics that are wrong</a>'


def theme_report(t, d, published, published_h, outdir):
    slug = SLUG[t]; url = BASE + slug + '/'; title = f'State of AI {NAME[t]} 2026'
    csv_name = f'report-ai-data-{slug}-2026.csv'
    ms = d['metrics']
    tiles = [m for m in ms if (m['values'].get('2026') or {}).get('value')][:4]
    tile_html = ''.join(f'<div class="tai-stat"{NOBR if i == len(tiles) - 1 else ""}><div style="font-weight:900;font-size:30px;letter-spacing:-0.03em;color:#2545f5;">{E(m["values"]["2026"]["value"])}</div><div style="font-size:12px;line-height:1.35;color:#6e6e76;margin-top:8px;">{E(m["label"])}, {E(m["values"]["2026"].get("as_of", ""))} {chip(m["values"]["2026"].get("confidence"))}</div></div>' for i, m in enumerate(tiles))
    yoy = [m for m in ms if m.get('yoy')]
    changed_rows = ''.join(f'<tr><td>{E(m["label"])}</td><td>{cell(m["values"].get("2025"), False)}</td><td>{cell(m["values"].get("2026"), False)}</td><td>{change(m["values"].get("2025") or {}, m["values"].get("2026") or {})}</td></tr>' for m in yoy)
    stop = d.get('stop_quoting') or []
    stop_html = ''.join(f'<tr><td>&ldquo;{E(s["claim"])}&rdquo;</td><td>{E(s["fact"])}{detail(s.get("link"))}</td></tr>' for s in stop)
    body = CSS + '\n<div class="tai-wrap">\n' + header(
        f'{NAME[t]}', f'Report AI &middot; State of AI series &middot; Q4 2026 edition &middot; Quarterly', title,
        E(d.get('dek_2026', '')),
        f'By the Report AI editorial team &middot; Published <time datetime="{published}">{published_h}</time> &middot; Next edition: Q1 2027', NAME[t]) + \
        f'\n<div class="tai-statgrid" style="display:grid;grid-template-columns:repeat({len(tiles)},1fr);border-bottom:1px solid #e6e6ea;">{tile_html}</div>' + \
        f'\n<div class="tai-padx"><div class="tai-mono" style="font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#2545f5;margin-bottom:14px;">The five numbers</div>{five(d["headlines"]["2026"])}' + \
        cite_box(title, 'Q4 2026 edition', url, published_h, csv_name, len(ms)) + '</div>' + \
        '\n<div class="tai-padx" style="background:#f5f5f7;"><div class="tai-mono" style="font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#2545f5;margin-bottom:14px;">Analysis</div>' + \
        ''.join(f'<p>{E(p)}</p>' for p in d['analysis']['2026']) + \
        '<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#77777f;margin:26px 0 10px;">Key takeaways</div><ul style="font-size:15.5px;line-height:1.6;color:#33333a;max-width:880px;padding-left:20px;margin:0;">' + \
        ''.join(f'<li style="margin-bottom:8px;">{E(x)}</li>' for x in d.get('takeaways_2026', [])) + '</ul></div>' + \
        f'\n<div class="tai-padx"><h2>Three years in three charts</h2>{yoy_charts(ms)}</div>' + \
        f'\n<div class="tai-padx"><h2>The numbers, 2024 to 2026</h2><p>Every measure in this report with its value for each year, as-of date, source and confidence. Change compares 2025 with 2026 to date where both are numeric.</p>{metric_table(ms)}</div>' + \
        (f'\n<div class="tai-padx"><h2>What changed since 2025</h2><div class="tai-tablewrap"><table class="tai-table"><tr><th>Measure</th><th>2025</th><th>2026 (to date)</th><th>Change</th></tr>{changed_rows}</table></div><ul style="font-size:15px;line-height:1.6;color:#33333a;max-width:880px;padding-left:20px;margin:16px 0 0;">' + ''.join(f'<li style="margin-bottom:6px;">{E(x)}</li>' for x in d.get('yoy_takeaways', [])) + '</ul></div>' if yoy else '') + \
        (f'\n<div class="tai-padx"><h2>Numbers to stop quoting</h2><div class="tai-tablewrap"><table class="tai-table"><tr><th>Widely repeated</th><th>What the evidence supports</th></tr>{stop_html}</table></div></div>' if stop else '') + \
        f'\n<div class="tai-padx"><h2>Frequently asked</h2>{faq_html(d.get("faq_2026", []))}</div>' + \
        methodology() + related(SERIES_LINKS) + '\n</div>\n<!-- /wp:html -->'
    body = '<!-- wp:html -->\n' + body + ld(title, d.get('dek_2026', ''), url, published, d.get('faq_2026', []), csv_name, f'{title} (data)', '2024/2026')
    rows = [(t, m, y, m['values'][y]) for m in ms for y in YEARS if m['values'].get(y)]
    write_csv(os.path.join(outdir, csv_name), url, published, rows)
    excerpt = (d.get('dek_2026', '') + ' ' + d['headlines']['2026'][0])[:300]
    return dict(slug=slug, title=f'{title} — Report AI', excerpt=excerpt, html=body, csv=csv_name, url=url)


def annual(year, ds, published, published_h, outdir, intro, status_note=''):
    slug = f'state-of-ai-{year}'; url = BASE + slug + '/'; title = f'State of AI in Numbers {year}'
    csv_name = f'report-ai-data-{slug}-in-numbers.csv'
    prev = str(int(year) - 1)
    yrs = [prev, year] if prev in YEARS else [year]
    secs = ''; rows = []; allfaq = []
    toc = ' &middot; '.join(f'<a href="#{t}">{NAME[t]}</a>' for t in THEMES if t in ds)
    for t in THEMES:
        if t not in ds:
            continue
        d = ds[t]
        ms = [m for m in d['metrics'] if (m['values'].get(year) or {}).get('value')]
        rows += [(t, m, y, m['values'][y]) for m in ms for y in yrs if m['values'].get(y)]
        secs += f'\n<div class="tai-padx" id="{t}"><div class="tai-mono" style="font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#2545f5;margin-bottom:8px;">{NAME[t]}</div><h2>{E(d["headlines"][year][0])}</h2>' + \
            five(d['headlines'][year][1:5]) + ''.join(f'<p>{E(p)}</p>' for p in d['analysis'][year]) + \
            metric_table(ms, yrs, with_change=len(yrs) > 1) + \
            (f'<p style="font-size:14px;margin-top:14px;">Latest edition: <a href="/indexes/state-of-ai/{SLUG[t]}/">State of AI {NAME[t]} 2026</a></p>' if year != '2026' else f'<p style="font-size:14px;margin-top:14px;">Full detail: <a href="/indexes/state-of-ai/{SLUG[t]}/">State of AI {NAME[t]} 2026 (quarterly)</a></p>') + '</div>'
    lead = [ds[t]['headlines'][year][0] for t in THEMES if t in ds]
    body = CSS + '\n<div class="tai-wrap">\n' + header(
        str(year), f'Report AI &middot; State of AI in Numbers &middot; Annual edition {year}{" (retrospective)" if year != "2026" else ""}', title,
        intro['dek'],
        f'By the Report AI editorial team &middot; Published <time datetime="{published}">{published_h}</time>{status_note}', str(year)) + \
        f'\n<div class="tai-padx"><div class="tai-mono" style="font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#2545f5;margin-bottom:14px;">{year} in seven numbers</div>{five(lead)}' + \
        cite_box(title, f'{year} edition', url, published_h, csv_name, len(rows)) + '</div>' + \
        '\n<div class="tai-padx" style="background:#f5f5f7;"><div class="tai-mono" style="font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#2545f5;margin-bottom:14px;">The year in one page</div>' + \
        ''.join(f'<p>{E(p)}</p>' for p in intro['analysis']) + f'<p class="tai-mono" style="font-size:12px;color:#77777f;margin-top:18px;">In this report: {toc}</p></div>' + \
        secs + f'\n<div class="tai-padx"><h2>Frequently asked</h2>{faq_html(intro["faq"])}</div>' + methodology() + \
        related(SERIES_LINKS) + '\n</div>\n<!-- /wp:html -->'
    body = '<!-- wp:html -->\n' + body + ld(title, intro['dek_plain'], url, published, intro['faq'], csv_name, f'{title} (data)', f'{yrs[0]}/{year}')
    write_csv(os.path.join(outdir, csv_name), url, published, rows)
    return dict(slug=slug, title=f'{title} — Report AI', excerpt=intro['dek_plain'][:300], html=body, csv=csv_name, url=url)


def yoy_page(ds, published, published_h, outdir, intro):
    slug = 'state-of-ai-year-over-year'; url = BASE + slug + '/'; title = 'State of AI, Year over Year: 2024 vs 2025 vs 2026'
    csv_name = 'report-ai-data-state-of-ai-year-over-year.csv'
    secs = ''; rows = []
    for t in THEMES:
        if t not in ds:
            continue
        d = ds[t]; ms = [m for m in d['metrics'] if m.get('yoy')]
        rows += [(t, m, y, m['values'][y]) for m in ms for y in YEARS if m['values'].get(y)]
        tr = ''.join(f'<tr><td><strong>{E(m["label"])}</strong></td>' + ''.join(f'<td>{cell(m["values"].get(y), False)}</td>' for y in YEARS) +
                     f'<td>{change(m["values"].get("2024") or {}, m["values"].get("2025") or {})}</td><td>{change(m["values"].get("2025") or {}, m["values"].get("2026") or {})}</td></tr>' for m in ms)
        secs += f'\n<div class="tai-padx" id="{t}"><h2>{NAME[t]}</h2><ul style="font-size:15px;line-height:1.6;color:#33333a;max-width:880px;padding-left:20px;margin:0 0 16px;">' + \
            ''.join(f'<li style="margin-bottom:6px;">{E(x)}</li>' for x in d.get('yoy_takeaways', [])) + '</ul>' + yoy_charts(ms) + \
            f'<div class="tai-tablewrap" style="margin-top:16px;"><table class="tai-table"><tr><th>Measure</th><th>2024</th><th>2025</th><th>2026 (to date)</th><th>2024&rarr;25</th><th>2025&rarr;26</th></tr>{tr}</table></div>' + \
            f'<p style="font-size:14px;margin-top:12px;">Sources, dates and confidence for each value: <a href="/indexes/state-of-ai/{SLUG[t]}/">State of AI {NAME[t]} 2026</a>.</p></div>'
    body = CSS + '\n<div class="tai-wrap">\n' + header(
        'Year over year', 'Report AI &middot; State of AI series &middot; Comparison', title, intro['dek'],
        f'By the Report AI editorial team &middot; Published <time datetime="{published}">{published_h}</time> &middot; Updated with each quarterly edition', 'Year over year') + \
        f'\n<div class="tai-padx" style="background:#f5f5f7;"><div class="tai-mono" style="font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#2545f5;margin-bottom:14px;">What changed in three years</div>' + \
        ''.join(f'<p>{E(p)}</p>' for p in intro['analysis']) + cite_box(title, None, url, published_h, csv_name, len(rows)) + '</div>' + \
        secs + f'\n<div class="tai-padx"><h2>Frequently asked</h2>{faq_html(intro["faq"])}</div>' + \
        methodology('Percentage changes are Report AI arithmetic (DERIVED) and are shown only where both years have a comparable numeric value; 2026 values are to date, so changes into 2026 compare a part-year or latest reading with a full year where noted. ') + \
        related(SERIES_LINKS) + '\n</div>\n<!-- /wp:html -->'
    body = '<!-- wp:html -->\n' + body + ld(title, intro['dek_plain'], url, published, intro['faq'], csv_name, f'{title} (data)', '2024/2026')
    write_csv(os.path.join(outdir, csv_name), url, published, rows)
    return dict(slug=slug, title=f'{title} — Report AI', excerpt=intro['dek_plain'][:300], html=body, csv=csv_name, url=url)


def load_narr():
    out = {}
    for t in THEMES:
        p = os.path.join(NARR, t + '.json')
        if os.path.exists(p):
            out[t] = json.load(open(p))
    return out


def paras(ps):
    return ''.join(f'<p>{E(x)}</p>' for x in ps or [])


class Counter:
    def __init__(self):
        self.n = 0

    def ex(self, e):
        html_ = charts.exhibit(self.n + 1, e)
        if html_:
            self.n += 1
        return html_


def sidebar(sb):
    if not sb or not sb.get('body'):
        return ''
    return f'<div class="tai-side"><div class="t">{E(sb.get("title", ""))}</div><p>{E(sb["body"])}</p></div>'


def theme_report_long(t, d, n, published, published_h, outdir):
    """McKinsey-style long-form theme report (data + narrative)."""
    slug = SLUG[t]; url = BASE + slug + '/'; title = f'State of AI {NAME[t]} 2026'
    csv_name = f'report-ai-data-{slug}-2026.csv'
    ms = d['metrics']; C = Counter()
    tiles = [m for m in ms if (m['values'].get('2026') or {}).get('value')][:4]
    tile_html = ''.join(f'<div class="tai-stat"{NOBR if i == len(tiles) - 1 else ""}><div style="font-weight:900;font-size:30px;letter-spacing:-0.03em;color:#2545f5;">{E(m["values"]["2026"]["value"])}</div><div style="font-size:12px;line-height:1.35;color:#6e6e76;margin-top:8px;">{E(m["label"])}, {E(m["values"]["2026"].get("as_of", ""))} {chip(m["values"]["2026"].get("confidence"))}</div></div>' for i, m in enumerate(tiles))
    chs = n.get('chapters', [])
    toc = ''.join(f'<li><a href="#ch-{i + 1}">{E(c.get("kicker", ""))}</a> &mdash; {E(c.get("action_title", ""))}</li>' for i, c in enumerate(chs))
    toc += '<li><a href="#comparison">Comparison</a></li><li><a href="#numbers">The numbers, 2024&ndash;2026</a></li><li><a href="#outlook">Outlook: what to watch in 2027</a></li><li><a href="#faq">FAQ</a> &middot; <a href="#about">About the research</a></li>'
    body = header(NAME[t], 'Report AI &middot; State of AI series &middot; Q4 2026 edition &middot; Quarterly', title,
                  E(n.get('subtitle') or d.get('dek_2026', '')),
                  f'By the Report AI editorial team &middot; Published <time datetime="{published}">{published_h}</time> &middot; Next edition: Q1 2027', NAME[t])
    body += f'\n<div class="tai-statgrid" style="display:grid;grid-template-columns:repeat({len(tiles)},1fr);border-bottom:1px solid #e6e6ea;">{tile_html}</div>'
    body += ('\n<div class="tai-padx"><div class="tai-glance"><div class="k">At a glance</div><ul>' +
             ''.join(f'<li>{E(x)}</li>' for x in n.get('at_a_glance') or d['headlines']['2026']) + '</ul></div>' +
             cite_box(title, 'Q4 2026 edition', url, published_h, csv_name, len(ms)) +
             f'<div class="tai-mono" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#77777f;margin:30px 0 10px;">In this report</div><ol class="tai-toc">{toc}</ol></div>')
    for i, c in enumerate(chs):
        body += (f'\n<div class="tai-padx tai-ch" id="ch-{i + 1}"><div class="tai-kicker">{E(c.get("kicker", ""))}</div>'
                 f'<h2>{E(c.get("action_title", ""))}</h2>')
        ps = c.get('paras', []); exs = c.get('exhibits', [])
        # interleave: first half of paragraphs, exhibits, rest
        k = max(1, (len(ps) + 1) // 2)
        body += paras(ps[:k]) + ''.join(C.ex(e) for e in exs[:1]) + paras(ps[k:]) + ''.join(C.ex(e) for e in exs[1:]) + sidebar(c.get('sidebar')) + '</div>'
    cmp_ = n.get('comparison') or {}
    yoy = [m for m in ms if m.get('yoy')]
    changed_rows = ''.join(f'<tr><td>{E(m["label"])}</td><td>{cell(m["values"].get("2024"), False)}</td><td>{cell(m["values"].get("2025"), False)}</td><td>{cell(m["values"].get("2026"), False)}</td><td>{change(m["values"].get("2025") or {}, m["values"].get("2026") or {})}</td></tr>' for m in yoy)
    body += (f'\n<div class="tai-padx tai-ch" id="comparison"><div class="tai-kicker">Comparison</div><h2>{E(cmp_.get("action_title", "How 2026 compares with 2024 and 2025"))}</h2>' +
             paras(cmp_.get('paras')) + ''.join(C.ex(e) for e in cmp_.get('exhibits', [])) +
             (f'<h3>Year over year, every comparable measure</h3><div class="tai-tablewrap"><table class="tai-table"><tr><th>Measure</th><th>2024</th><th>2025</th><th>2026 (to date)</th><th>2025&rarr;26</th></tr>{changed_rows}</table></div>' if yoy else '') +
             '<ul style="font-size:15px;line-height:1.6;color:#33333a;max-width:880px;padding-left:20px;margin:16px 0 0;">' + ''.join(f'<li style="margin-bottom:6px;">{E(x)}</li>' for x in d.get('yoy_takeaways', [])) + '</ul>' +
             f'<p style="font-size:14px;margin-top:14px;">All eleven themes side by side: <a href="/indexes/state-of-ai/state-of-ai-year-over-year/">State of AI, year over year</a>.</p></div>')
    body += f'\n<div class="tai-padx" id="numbers"><div class="tai-kicker">Data appendix</div><h2>The numbers, 2024 to 2026</h2><p>Every measure in this report with its value for each year, as-of date, source and confidence. Change compares 2025 with 2026 to date where both are numeric.</p>{metric_table(ms)}</div>'
    stop = d.get('stop_quoting') or []
    if stop:
        stop_html = ''.join(f'<tr><td>&ldquo;{E(x["claim"])}&rdquo;</td><td>{E(x["fact"])}{detail(x.get("link"))}</td></tr>' for x in stop)
        body += f'\n<div class="tai-padx"><div class="tai-kicker">Fact check</div><h2>Numbers to stop quoting</h2><div class="tai-tablewrap"><table class="tai-table"><tr><th>Widely repeated</th><th>What the evidence supports</th></tr>{stop_html}</table></div></div>'
    ol = n.get('outlook') or {}
    watch = ''.join(f'<tr><td><strong>{E(w.get("indicator", ""))}</strong></td><td>{E(w.get("now", ""))}</td><td>{E(w.get("signal", ""))}</td></tr>' for w in ol.get('watch', []))
    body += (f'\n<div class="tai-padx tai-ch" id="outlook" style="background:#f5f5f7;"><div class="tai-kicker">Outlook</div><h2>{E(ol.get("action_title", "What to watch in 2027"))}</h2>' + paras(ol.get('paras')) +
             (f'<h3>What to watch in 2027</h3><div class="tai-tablewrap"><table class="tai-table"><tr><th>Indicator</th><th>Where it stands</th><th>What would change the picture</th></tr>{watch}</table></div>' if watch else '') + '</div>')
    if n.get('definitions'):
        body += '\n<div class="tai-padx"><div class="tai-kicker">Definitions</div><dl class="tai-dl">' + ''.join(f'<dt>{E(x["term"])}</dt><dd>{E(x["def"])}</dd>' for x in n['definitions']) + '</dl></div>'
    body += f'\n<div class="tai-padx" id="faq"><h2>Frequently asked</h2>{faq_html(d.get("faq_2026", []))}</div>'
    gaps = d.get('gaps') or []
    gap_txt = ('Known gaps in this edition: ' + '; '.join(gaps) + '. ') if gaps else ''
    body += '<div id="about"></div>' + methodology(f'Exhibits plot only dated, sourced readings; lines are not interpolated between them, and values with different definitions are never placed on one axis. {gap_txt}') + related(SERIES_LINKS)
    full = '<!-- wp:html -->\n' + CSS + '\n<div class="tai-wrap">\n' + body + '\n</div>\n<!-- /wp:html -->'
    full += ld(title, d.get('dek_2026', ''), url, published, d.get('faq_2026', []), csv_name, f'{title} (data)', '2024/2026')
    rows = [(t, m, y, m['values'][y]) for m in ms for y in YEARS if m['values'].get(y)]
    write_csv(os.path.join(outdir, csv_name), url, published, rows)
    excerpt = (d.get('dek_2026', '') + ' ' + (n.get('at_a_glance') or d['headlines']['2026'])[0])[:300]
    return dict(slug=slug, title=f'{title} — Report AI', excerpt=excerpt, html=full, csv=csv_name, url=url, exhibits=C.n)


def landing(ds, published, published_h, intro):
    cards = ''.join(f'<a href="/indexes/state-of-ai/{SLUG[t]}/" style="display:block;text-decoration:none;border:1px solid #e6e6ea;border-radius:8px;padding:18px 18px 16px;color:#111114;"><div class="tai-mono" style="font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#2545f5;">Q4 2026 edition</div><div style="font-weight:800;font-size:18px;margin:6px 0 6px;">State of AI {E(NAME[t])}</div><div style="font-size:13.5px;line-height:1.45;color:#55555e;">{E(ds[t].get("dek_2026", ""))}</div></a>' for t in THEMES if t in ds)
    years = [('2022', '/indexes/state-of-ai/state-of-ai-2022/', 'The year ChatGPT arrived'), ('2023', '/indexes/state-of-ai/state-of-ai-2023/', 'Generative AI&rsquo;s breakout year'),
             ('2024', '/indexes/state-of-ai/state-of-ai-2024/', 'State of AI in Numbers 2024'), ('2025', '/indexes/state-of-ai/state-of-ai-2025/', 'State of AI in Numbers 2025')]
    yr = ''.join(f'<tr><td><strong>{y}</strong></td><td><a href="{u}">{t_}</a></td></tr>' for y, u, t_ in years) + '<tr><td><strong>2026</strong></td><td>State of AI in Numbers 2026 &mdash; publishes mid-December 2026</td></tr>'
    body = header('Overview', 'Report AI &middot; State of AI series', 'State of AI: The Report AI Series', intro['dek'],
                  f'By the Report AI editorial team &middot; Updated <time datetime="{published}">{published_h}</time>', 'Overview')
    body += '\n<div class="tai-padx" style="background:#f5f5f7;"><div class="tai-kicker">Analysis</div>' + paras(intro['analysis']) + '</div>'
    body += f'\n<div class="tai-padx"><h2>The quarterly reports</h2><p>Eleven reports, one per theme, each with an executive summary, numbered exhibits, three years of data with sources and confidence ratings, a comparison chapter, an outlook and a CSV download.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:16px;">{cards}</div></div>'
    body += f'\n<div class="tai-padx"><h2>The annual editions: State of AI in Numbers</h2><div class="tai-tablewrap"><table class="tai-table"><tr><th>Year</th><th>Edition</th></tr>{yr}</table></div><p style="margin-top:14px;">Compare the years directly: <a href="/indexes/state-of-ai/state-of-ai-year-over-year/">State of AI, year over year (2024 vs 2025 vs 2026)</a> &middot; <a href="/indexes/state-of-ai/state-of-ai-2022-2026/">Timeline 2022&ndash;2026</a>.</p></div>'
    body += f'\n<div class="tai-padx"><h2>Frequently asked</h2>{faq_html(intro["faq"])}</div>' + methodology() + related(SERIES_LINKS)
    full = '<!-- wp:html -->\n' + CSS + '\n<div class="tai-wrap">\n' + body + '\n</div>\n<!-- /wp:html -->'
    g = [{"@type": "CollectionPage", "name": "State of AI: The Report AI Series", "url": BASE, "description": intro['dek_plain'], "dateModified": published,
          "publisher": {"@id": "https://report-ai.org/#organization"},
          "hasPart": [{"@type": "Article", "name": f"State of AI {NAME[t]} 2026", "url": BASE + SLUG[t] + '/'} for t in THEMES if t in ds]},
         {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in intro['faq']]}]
    full += '\n<!-- wp:html -->\n<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": g}, ensure_ascii=False, separators=(',', ':')) + '</script>\n<!-- /wp:html -->'
    return dict(slug='state-of-ai', title='State of AI: The Report AI Series', excerpt=intro['dek_plain'][:300], html=full, csv=None, url=BASE)


if __name__ == '__main__':
    outdir = sys.argv[1]; published = sys.argv[2] if len(sys.argv) > 2 else '2026-11-11'
    import datetime
    published_h = datetime.date.fromisoformat(published).strftime('%-d %B %Y')
    os.makedirs(outdir, exist_ok=True)
    ds = load()
    intros = json.load(open(os.path.join(DATA, 'intros.json'))) if os.path.exists(os.path.join(DATA, 'intros.json')) else {}
    pages = []
    ns = load_narr()
    for t in THEMES:
        if t not in ds:
            continue
        if t in ns:
            pages.append(theme_report_long(t, ds[t], ns[t], published, published_h, outdir))
        else:
            pages.append(theme_report(t, ds[t], published, published_h, outdir))
    if 'landing' in intros:
        pages.append(landing(ds, published, published_h, intros['landing']))
    for y in ('2024', '2025', '2026'):
        if y in intros:
            pages.append(annual(y, ds, published, published_h, outdir, intros[y],
                                ' &middot; Draft: publishes mid-December 2026' if y == '2026' else ''))
    if 'yoy' in intros:
        pages.append(yoy_page(ds, published, published_h, outdir, intros['yoy']))
    for p in pages:
        fn = p['slug'] + '.html'
        open(os.path.join(outdir, fn), 'w').write(p['html'])
        p['file'] = fn; del p['html']
        p.setdefault('exhibits', 0)
        for s in re.findall(r'<script type="application/ld\+json">(.*?)</script>', open(os.path.join(outdir, fn)).read(), flags=re.S):
            json.loads(s)
    json.dump(pages, open(os.path.join(outdir, 'pages.json'), 'w'), ensure_ascii=False, indent=1)
    for p in pages:
        txt = re.sub(r'<script.*?</script>|<style.*?</style>|<svg.*?</svg>', ' ', open(os.path.join(outdir, p['file'])).read(), flags=re.S)
        words = len(html.unescape(re.sub(r'<[^>]+>', ' ', txt)).split())
        print(p['slug'], os.path.getsize(os.path.join(outdir, p['file'])), 'words', words, 'exhibits', p['exhibits'], p['csv'])
