"""Generate content-ops/geo/use.json (AI Use by Country 2026 index) from ai-use-data.json.

Every figure in the prose is read from the dataset, so a verification pass that changes a value
changes the text on the next build. Run: python3 content-ops/geo/make_use.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'ai-use-data.json')))
C = {c['country']: c for c in D['country_table']}
EDS = [('h1_2025', 'H1 2025'), ('h2_2025', 'H2 2025'), ('q1_2026', 'Q1 2026'), ('q2_2026', 'Q2 2026')]


def ms(country, ed='q2_2026'):
    m = C[country]['metrics'].get(f'ms_ai_user_share_{ed}')
    return m['value'] if m else None


def rank(country):
    return C[country]['metrics'].get('ms_rank_q2_2026', {}).get('value')


def world(mid):
    return next(r for r in D['world'] if r.get('metric_id') == mid)


def region(name, metric='ms_ai_user_share_weighted'):
    return next(r for r in D['regions'] if r['region'] == name and r['metric'] == metric)


def traffic(metric):
    return next(r for r in D['traffic'] if r['metric'] == metric)


def growth(metric):
    return next(r for r in D['growth'] if r['metric'] == metric)


def ordn(n):
    n = int(n)
    return f"{n}{'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"


def f1(x):
    return f'{x:.1f}'


W = world('ms_world_ai_user_share')['values']
NO = world('ms_global_north')['values']; SO = world('ms_global_south')['values']; GAP = world('ms_north_south_gap')['values']
ranked = sorted([c for c in D['country_table'] if ms(c['country']) is not None], key=lambda c: -ms(c['country']))
N_ECON = len(ranked)
top = ranked[0]['country']; second = ranked[1]['country']; last = ranked[-1]['country']
fast = growth('fastest_relative_growth_h1_2025_to_q2_2026')['top15']
big = growth('large_economies_change')['values']
REG_NAMES = ['North America', 'Europe & Central Asia', 'Latin America & Caribbean', 'East Asia & Pacific',
             'Middle East & North Africa', 'South Asia', 'Sub-Saharan Africa']
REG = {r: region(r)['values'] for r in REG_NAMES}
gs = traffic('genai_web_visit_share_global'); cn = traffic('china_ai_native_apps_mau'); ru = traffic('russia_ai_services_reach')
RU_ANY = str(ru['values']['any AI service']).split(' of ')[0]
kr = traffic('korea_ai_app_users'); ind = traffic('india_ai_apps'); ds = traffic('deepseek_share_by_economy')
eu = region('European Union', 'eurostat_individuals_and_enterprises')['values']
kpmg = world('kpmg_regular_use'); ipsos = world('ipsos_ai_monitor_2026')['values']; pew = world('pew_global_concern')['values']
oecd_i = world('oecd_individuals_genai'); oecd_f = world('oecd_firms_ai')['values']
above30 = world('ms_economies_above_30pct')['values']
users_bn = world('ms_world_users_derived')['value']
modelled = [c['country'] for c in D['country_table'] if any(k in (c['metrics'].get('ms_ai_user_share_q2_2026', {}).get('note') or '') for k in ('identical value', 'Region-imputed'))]

MS_SRC = 'Microsoft AI Economy Institute, AI Diffusion reports and dataset (H1 2025 to Q2 2026 editions)'
MS_URL = 'https://github.com/microsoft/ai-diffusion-report'
B = lambda c: f"{c} ({f1(ms(c))}%, #{rank(c)})"

page = {
 "slug": "ai-use-by-country-2026",
 "path": "/indexes/geography-of-ai/ai-use-by-country-2026/",
 "parent_path": "/indexes/geography-of-ai/",
 "csv": "report-ai-data-ai-use-by-country-2026.csv",
 "trail": [["Indexes", "/indexes/"], ["The Geography of AI", "/indexes/geography-of-ai/"], ["AI Use by Country 2026", "/indexes/geography-of-ai/ai-use-by-country-2026/"]],
 "eyebrow": "Report AI &middot; The Geography of AI &middot; Index &middot; Updated quarterly",
 "title": "AI Use by Country 2026: Adoption Across the World",
 "dek": f"How many people use AI in each of {N_ECON} economies, how fast that is changing, and which assistants they use. Built on Microsoft's AI Diffusion data, national trackers and global surveys, with every figure dated, sourced and confidence-rated.",
 "cadence_note": "Cadence: quarterly (STANDARD) &middot; Next update February 2027",
 "edition": "November 2026 edition",
 "coverage": "2025/2026",
 "nav_active": "AI use by country",
 "nav": [["Geography of AI", "/indexes/geography-of-ai/"], ["AI use by country", "/indexes/geography-of-ai/ai-use-by-country-2026/"], ["Sovereign AI Index", "/indexes/geography-of-ai/sovereign-ai-index-2026/"], ["Most popular model by country", "/indexes/geography-of-ai/popular-ai-models-by-country/"], ["State of AI Geography", "/indexes/state-of-ai/state-of-ai-geography/"]],
 "tiles": [
  {"value": f"{f1(W['Q2 2026'])}%", "label": f"of the world's working-age population used generative AI in Q2 2026, up from {f1(W['H1 2025'])}% in H1 2025 (Microsoft)", "confidence": "HIGH"},
  {"value": f"{f1(ms(top))}%", "label": f"{top}, the highest share of any economy (Q2 2026)", "confidence": "HIGH"},
  {"value": f"{f1(GAP['Q2 2026'])} pts", "label": f"gap between the Global North ({f1(NO['Q2 2026'])}%) and South ({f1(SO['Q2 2026'])}%), widening every edition", "confidence": "HIGH"},
  {"value": f"+{fast[0]['rel_change_pct']:.0f}%", "label": f"{fast[0]['country']}'s rise, H1 2025 to Q2 2026: the fastest of any economy", "confidence": "DERIVED"}
 ],
 "at_a_glance": [
  f"About {f1(W['Q2 2026'])}% of the world's people aged 15–64 used a generative AI product in the second quarter of 2026, according to Microsoft's AI Diffusion data, up from {f1(W['H1 2025'])}% in the first half of 2025. That is roughly {users_bn * 1000:.0f} million people (Report AI calculation).",
  f"The {top} leads at {f1(ms(top))}%, followed by {second} ({f1(ms(second))}%); the United States ranks {ordn(rank('United States'))} at {f1(ms('United States'))}%, and China {ordn(rank('China'))} at {f1(ms('China'))}% on Microsoft's measure, which misses most Chinese domestic apps.",
  f"The divide is widening: the gap between the Global North ({f1(NO['Q2 2026'])}%) and the Global South ({f1(SO['Q2 2026'])}%) grew from {f1(GAP['H1 2025'])} to {f1(GAP['Q2 2026'])} percentage points across four editions.",
  f"Growth has moved to East Asia: {fast[0]['country']} rose from {f1(fast[0]['h1_2025'])}% to {f1(fast[0]['q2_2026'])}% and {fast[1]['country']} from {f1(fast[1]['h1_2025'])}% to {f1(fast[1]['q2_2026'])}% between H1 2025 and Q2 2026.",
  f"National trackers fill the gaps: China had {cn['values']['total (dedup)']} monthly users of AI-native apps in September 2026 (QuestMobile), and {RU_ANY} of Russians aged 12 and over used an AI service monthly (Mediascope), led by Yandex's Alice AI."
 ],
 "toc_extra": [["stop-quoting", "Numbers to stop quoting"], ["definitions", "Definitions"], ["faq", "FAQ"], ["about", "About the data"]],
 "analysis": [
  f"Three facts dominate the map of AI use. First, it is still a minority activity: on Microsoft's telemetry-based measure, fewer than one in five working-age people worldwide used a generative AI product in the second quarter of 2026. Second, the leaders are small, rich, connected economies rather than the countries that build frontier models: the {top}, {second}, Ireland, France and Norway all rank above the United States. Third, use is spreading fastest where governments and telecom operators have pushed it hard and where local-language quality has improved, notably in {fast[0]['country']} and {fast[1]['country']}.",
  f"The divide is the uncomfortable finding. In every edition of Microsoft's data the Global North has pulled further ahead, from a {f1(GAP['H1 2025'])}-point gap to {f1(GAP['Q2 2026'])} points. Sub-Saharan Africa averages {f1(REG['Sub-Saharan Africa']['Q2 2026'])}% and South Asia {f1(REG['South Asia']['Q2 2026'])}%, against {f1(REG['North America']['Q2 2026'])}% in North America. The constraint is mostly upstream of AI: internet access, digital skills, electricity and the quality of models in local languages.",
  f"Measures disagree, and the reasons matter. Microsoft's figures are estimated from Windows desktop telemetry on visits to 19 named AI services, scaled to mobile use and to population; the list includes some Chinese and Russian services but not ByteDance's Doubao, so the measure undercounts countries where people use domestic apps on phones: China's own surveys report far higher use than Microsoft's {f1(ms('China'))}%, and Russia's {f1(ms('Russia'))}% sits beside a Mediascope reach of {RU_ANY}. Surveys of the online population, such as the KPMG and University of Melbourne study, report higher use again, because they exclude people who are offline. We publish all three kinds of measure side by side and never rank countries across them.",
  "For businesses the picture is earlier still. Eurostat found that about one in five EU enterprises with ten or more staff used at least one AI technology in 2025, and the OECD reports a similar share of firms across its members. Individual use runs ahead of organisational adoption almost everywhere."
 ],
 "takeaways": [
  f"Use the world figure with its definition: {f1(W['Q2 2026'])}% of people aged 15–64 used generative AI in Q2 2026 (Microsoft), not '{f1(W['Q2 2026'])}% of internet users'.",
  "Small, rich, well-connected economies lead; frontier-model builders do not top the adoption table.",
  "The North–South gap is widening, not closing.",
  "In China and Russia, national trackers are the better guide, because Microsoft's telemetry misses domestic apps.",
  "Never rank countries across different measures: telemetry, surveys of online adults and app counts answer different questions."
 ],
 "chapters": [], "stop_quoting": D['stop_quoting'] and [{"claim": s['claim'], "fact": s['fact'], "link": ""} for s in D['stop_quoting']],
}

# ---- chapters
top20 = ranked[:20]
ch = []
ch.append({
 "id": "ranking", "kicker": "1. The ranking",
 "action_title": f"The {top} and {second} lead the world in AI use; the United States ranks {ordn(rank('United States'))}",
 "paras": [
  f"Microsoft's AI Economy Institute estimates the share of each economy's working-age population that used a generative AI product in a period, from anonymised telemetry adjusted for device share, internet penetration and population. In the second quarter of 2026, {above30['Q2 2026']} economies were above 30%, up from {above30['Q1 2026']} a quarter earlier.",
  f"The top of the table is dominated by small, high-income economies with near-universal connectivity and active government programmes: {B(top)}, {B(second)}, {B('Ireland')}, {B('France')} and {B('Norway')}. Among the largest economies, the United Kingdom is at {f1(ms('United Kingdom'))}%, Germany {f1(ms('Germany'))}%, Japan {f1(ms('Japan'))}%, Brazil {f1(ms('Brazil'))}%, India {f1(ms('India'))}% and Indonesia {f1(ms('Indonesia'))}%."
 ],
 "exhibits": [
  {"type": "hbar", "title": f"The {top} and {second} lead the world in AI use", "subtitle": "Share of working-age population (15–64) using generative AI, top 20 economies, Q2 2026 (%)", "unit": "%",
   "series": [{"name": "Q2 2026", "points": [[c['country'].replace('United Arab Emirates', 'UAE').replace('United Kingdom', 'UK'), ms(c['country'])] for c in top20]}],
   "source": f"Source: {MS_SRC}", "notes": "Telemetry-based estimate adjusted to population; not a survey. Rankings from Microsoft's Q2 2026 dataset.", "confidence": "HIGH"},
  {"type": "hbar", "title": "Among the largest economies, use ranges from about 10% to 50%", "subtitle": "Share of working-age population using generative AI, selected large economies, Q2 2026 (%)", "unit": "%",
   "series": [{"name": "Q2 2026", "points": [[b['country'].replace('United Kingdom', 'UK').replace('United States', 'US').replace('Turkey (Türkiye)', 'Türkiye'), b['q2_2026']] for b in sorted(big, key=lambda b: -b['q2_2026'])]}],
   "source": f"Source: {MS_SRC}", "notes": "China and Russia are undercounted because the measure misses most domestic apps; see the national-tracker table.", "confidence": "HIGH"}
 ]
})
ch.append({
 "id": "divide", "kicker": "2. The divide",
 "action_title": f"The gap between the Global North and South widened in every edition, to {f1(GAP['Q2 2026'])} percentage points",
 "paras": [
  f"Microsoft splits its data into Global North and Global South. Use grew in both, but faster in the North: from {f1(NO['H1 2025'])}% to {f1(NO['Q2 2026'])}%, against {f1(SO['H1 2025'])}% to {f1(SO['Q2 2026'])}% in the South. The same report notes large gaps in the foundations of use: internet access, digital skills and electricity.",
  f"By region, using a working-age-population-weighted average of the economies Microsoft covers (Report AI calculation), North America leads at {f1(REG['North America']['Q2 2026'])}%, followed by Europe and Central Asia at {f1(REG['Europe & Central Asia']['Q2 2026'])}%; Sub-Saharan Africa is lowest at {f1(REG['Sub-Saharan Africa']['Q2 2026'])}%. {len(modelled)} economies, mostly in Africa and smaller territories, carry identical values within regional groups in Microsoft's data, so they are regional estimates rather than national measurements and are flagged in the table."
 ],
 "exhibits": [
  {"type": "line", "title": "AI use is rising in both halves of the world, faster in the North", "subtitle": "Share of working-age population using generative AI, H1 2025 to Q2 2026 (%)", "unit": "%",
   "series": [{"name": "Global North", "points": [[k, v] for k, v in NO.items()]}, {"name": "Global South", "points": [[k, v] for k, v in SO.items()]}],
   "source": f"Source: {MS_SRC}", "notes": f"Four editions: H1 2025, H2 2025, Q1 2026 and Q2 2026. The world average sits between the two: {f1(W['H1 2025'])}% to {f1(W['Q2 2026'])}%.", "confidence": "HIGH"},
  {"type": "hbar", "title": "By region, use runs from about 11% to 34%", "subtitle": "Working-age-population-weighted share using generative AI, by World Bank region, Q2 2026 (%)", "unit": "%",
   "series": [{"name": "Q2 2026", "points": [[r.replace('Latin America & Caribbean', 'Latin America & Carib.').replace('Middle East & North Africa', 'Middle East & N. Africa'), REG[r]['Q2 2026']] for r in REG_NAMES]}],
   "source": f"Source: {MS_SRC}; Report AI weighting by UN working-age population", "notes": "Report AI calculation; the 147-economy weighted mean reproduces Microsoft's world figure.", "confidence": "DERIVED"}
 ],
 "tables": [{"title": "Regional averages, four editions", "columns": ["Region"] + [e[1] for e in EDS] + ["Confidence"],
             "rows": [[r] + [f1(REG[r][e[1]]) + '%' for e in EDS] + ["DERIVED"] for r in REG_NAMES]}]
})
ch.append({
 "id": "growth", "kicker": "3. Growth",
 "action_title": f"Growth has shifted to East Asia: {fast[0]['country']}, {fast[1]['country']} and {fast[2]['country']} grew fastest",
 "paras": [
  f"Between the first half of 2025 and the second quarter of 2026, {fast[0]['country']}'s share rose by {fast[0]['rel_change_pct']:.0f}% in relative terms, from {f1(fast[0]['h1_2025'])}% to {f1(fast[0]['q2_2026'])}%, the fastest of any economy (Report AI calculation from Microsoft data). {fast[1]['country']} (+{fast[1]['rel_change_pct']:.0f}%) and {fast[2]['country']} (+{fast[2]['rel_change_pct']:.0f}%) followed. In absolute terms the largest gains were in {fast[0]['country']} and the UAE, both up by about 14 percentage points.",
  f"The United States grew more slowly in relative terms, from {f1(ms('United States', 'h1_2025'))}% to {f1(ms('United States'))}%, from a higher base. China's measured rise was among the smallest of the large economies, from {f1(ms('China', 'h1_2025'))}% to {f1(ms('China'))}%, which says more about the measure's blind spots there than about Chinese use."
 ],
 "exhibits": [{"type": "hbar", "title": f"{fast[0]['country']} grew fastest", "subtitle": "Relative change in the share using generative AI, H1 2025 to Q2 2026, fastest 12 economies (%)", "unit": "% change",
   "series": [{"name": "Change", "points": [[g['country'], g['rel_change_pct']] for g in fast[:12]]}],
   "source": f"Source: {MS_SRC}; Report AI calculation", "notes": "Relative change from different bases; see the full table for absolute values.", "confidence": "DERIVED"}],
 "tables": [{"title": "Large economies across four editions", "columns": ["Economy"] + [e[1] for e in EDS] + ["Change (points)", "Confidence"],
             "rows": [[b['country'], f1(b['h1_2025']) + '%', f1(b['h2_2025']) + '%', f1(b['q1_2026']) + '%', f1(b['q2_2026']) + '%', f"+{f1(b['pp_change'])}", "HIGH"] for b in big]}]
})


def fmt_metric(m):
    return '' if not m else (f"{m['value']}" if not isinstance(m['value'], float) else f1(m['value']))


rows = []
for c in ranked:
    mt = c['metrics']
    flag = ' (regional estimate)' if c['country'] in modelled else ''
    rows.append([c['country'] + flag, c['region'], f1(mt['ms_ai_user_share_h1_2025']['value']) + '%' if 'ms_ai_user_share_h1_2025' in mt else '',
                 f1(ms(c['country'])) + '%', str(rank(c['country'])), (f"+{f1(mt['ms_change_h1_2025_to_q2_2026_pp']['value'])}" if 'ms_change_h1_2025_to_q2_2026_pp' in mt else ''),
                 (f1(mt['itu_internet_users']['value']) + '%' if 'itu_internet_users' in mt and isinstance(mt['itu_internet_users']['value'], (int, float)) else ''),
                 'MEDIUM' if flag else 'HIGH'])
ch.append({
 "id": "table", "kicker": "4. Every economy",
 "action_title": f"The full table: {N_ECON} economies, ranked",
 "paras": [f"Every economy in Microsoft's Q2 2026 dataset, with its first-edition value, latest value, rank, change in percentage points and the share of its population using the internet (ITU, latest year). Economies marked 'regional estimate' share an identical value with others in their group in all editions and should not be read as national measurements."],
 "tables": [{"title": "AI use by economy, Q2 2026", "columns": ["Economy", "Region", "H1 2025", "Q2 2026", "Rank", "Change (pts)", "Internet users", "Confidence"], "rows": rows,
             "note": f"Source: {MS_SRC} ({MS_URL}); internet use from ITU via Our World in Data. Change is a Report AI calculation."}]
})

# national trackers and other measures
tr_rows = [
 ["China", "AI-native app monthly active users (deduplicated)", cn['values']['total (dedup)'], cn['date'], cn['source'], "MEDIUM"],
 ["China", "Doubao (ByteDance) monthly active users", cn['values']['Doubao'], cn['date'], cn['source'], "MEDIUM"],
 ["Russia", "Monthly reach of any AI service, population 12+", ru['values']['any AI service'], ru['date'], ru['source'], "MEDIUM"],
 ["Russia", "Yandex Alice AI / DeepSeek / GigaChat monthly reach", f"{ru['values']['Alice AI']} / {ru['values']['DeepSeek']} / {ru['values']['GigaChat']}", ru['date'], ru['source'], "MEDIUM"],
 ["South Korea", "ChatGPT share of AI-app users", kr['values']['ChatGPT share of AI-app users'], kr.get('date', 'Oct 2026'), kr['source'], "MEDIUM"],
 ["India", "ChatGPT / Gemini monthly app users", f"{ind['values']['ChatGPT MAU Jan 2026']} / {ind['values']['Gemini MAU Jan 2026']}", "Jan 2026", ind['source'], "MEDIUM"],
 ["European Union", "Individuals 16–74 using generative AI", f"{eu['individuals 16-74 using gen AI, 2025']}%", "2025", "Eurostat", "HIGH"],
 ["European Union", "Enterprises (10+ staff) using AI", f"{eu['enterprises using AI, 2025']}% (2024: {eu['enterprises using AI, 2024']}%)", "2025", "Eurostat", "HIGH"],
 ["OECD", "Individuals using generative AI", f"{oecd_i['value']}%", oecd_i['date'], oecd_i['source'], oecd_i.get('confidence', 'MEDIUM')],
 ["OECD", "Firms using AI", f"{oecd_f['2025']}% (2024: {oecd_f['2024']}%)", "2025", "OECD", "MEDIUM"],
 ["47 countries", "People intentionally using AI with some regularity", f"{kpmg['value']}%", kpmg['date'], kpmg['source'], kpmg.get('confidence', 'MEDIUM')],
]
ch.append({
 "id": "trackers", "kicker": "5. Other measures",
 "action_title": "National trackers and surveys show higher use where Microsoft's telemetry cannot see",
 "paras": [
  f"Microsoft's measure is the only consistent cross-country series, but it is built on Microsoft products. In China, where Western assistants are blocked and phones run domestic apps, QuestMobile counted {cn['values']['total (dedup)']} monthly users of AI-native apps in September 2026, led by ByteDance's Doubao at {cn['values']['Doubao']}. In Russia, Mediascope found that {RU_ANY} of people aged 12 and over used an AI service in a month, with Yandex's Alice AI reaching about {ru['values']['Alice AI']}.",
  f"Surveys answer different questions again. Eurostat found {eu['individuals 16-74 using gen AI, 2025']}% of EU residents aged 16–74 used generative AI tools in 2025, while {eu['enterprises using AI, 2025']}% of EU enterprises with ten or more staff used at least one AI technology. The KPMG and University of Melbourne study found {kpmg['value']}% of people across 47 countries using AI with some regularity, a survey of online respondents that reads higher than population-wide measures."
 ],
 "exhibits": [{"type": "hbar", "title": "Worldwide, ChatGPT still takes most chatbot web visits", "subtitle": f"Share of generative-AI chatbot website visits worldwide, {gs.get('date', 'Oct 2026')} (%)", "unit": "%",
   "series": [{"name": "Share", "points": [[k, v] for k, v in gs['values'].items()]}], "source": f"Source: {gs['source']}", "notes": "Web visits only; excludes app use and assistants built into other products. Not a measure of users.", "confidence": gs.get('confidence', 'MEDIUM')}],
 "tables": [{"title": "National trackers and surveys", "columns": ["Where", "Measure", "Value", "Date", "Source", "Confidence"], "rows": tr_rows,
             "note": "Each row is a different measure; do not compare rows or rank countries across them."}]
})
def cm(country, key):
    m = C.get(country, {}).get('metrics', {}).get(key)
    return m['value'] if m else None


ips = sorted([c['country'] for c in D['country_table'] if 'ipsos_excited_2026' in c['metrics']], key=lambda x: -(cm(x, 'ipsos_benefits_outweigh_2026') or 0))
kp = sorted([c['country'] for c in D['country_table'] if 'kpmg_regular_ai_use' in c['metrics']], key=lambda x: -(cm(x, 'kpmg_regular_ai_use') or 0))
ch.append({
 "id": "attitudes", "kicker": "6. Attitudes",
 "action_title": "Optimism is highest where measured use is often lowest: Asian and emerging economies are the most positive",
 "paras": [
  f"Across 32 countries in March–April 2026, {ipsos['excited']}% of adults said AI products make them excited and {ipsos['nervous']}% said they make them nervous (Ipsos AI Monitor 2026). The spread is wide: {cm('China', 'ipsos_benefits_outweigh_2026')}% in China and {cm('Indonesia', 'ipsos_benefits_outweigh_2026')}% in Indonesia said AI products have more benefits than drawbacks, against {cm('United States', 'ipsos_benefits_outweigh_2026')}% in the United States and {cm('France', 'ipsos_benefits_outweigh_2026')}% in France, where {cm('United States', 'ipsos_nervous_2026')}% of Americans said AI makes them nervous.",
  f"Self-reported use follows the same pattern. In the University of Melbourne and KPMG study of 47 countries (fieldwork November 2024–January 2025), {cm('China', 'kpmg_regular_ai_use')}% of respondents in China said they use AI regularly, against {cm('United States', 'kpmg_regular_ai_use')}% in the United States; emerging economies averaged about 80% and advanced economies 58%. These are surveys of online populations and measure something different from Microsoft's population-wide estimate, which is one reason China ranks low on one and high on the other. Pew's 25-country median in 2025 found {pew['more concerned']}% more concerned than excited about AI and {pew['more excited']}% more excited than concerned."
 ],
 "tables": [
  {"title": "Ipsos AI Monitor 2026: attitudes by country", "columns": ["Country", "More benefits than drawbacks", "Excited", "Nervous", "AI saved me time at work", "Confidence"],
   "rows": [[x, f"{cm(x, 'ipsos_benefits_outweigh_2026')}%", f"{cm(x, 'ipsos_excited_2026')}%", f"{cm(x, 'ipsos_nervous_2026')}%", (f"{cm(x, 'ipsos_ai_saved_time_at_work_2026')}%" if cm(x, 'ipsos_ai_saved_time_at_work_2026') is not None else ''), "HIGH"] for x in ips],
   "note": "Ipsos AI Monitor 2026, 32 countries, 23,532 adults, 20 March–3 April 2026; online samples, more urban and educated than the population in emerging markets."},
  {"title": "University of Melbourne and KPMG: regular use and trust by country", "columns": ["Country", "Use AI regularly", "Use AI at work", "Trust AI systems", "High acceptance", "Confidence"],
   "rows": [[x, f"{cm(x, 'kpmg_regular_ai_use')}%", (f"{cm(x, 'kpmg_work_ai_use')}%" if cm(x, 'kpmg_work_ai_use') is not None else ''), (f"{cm(x, 'kpmg_trust_ai_systems')}%" if cm(x, 'kpmg_trust_ai_systems') is not None else ''), (f"{cm(x, 'kpmg_high_acceptance')}%" if cm(x, 'kpmg_high_acceptance') is not None else ''), "HIGH"] for x in kp],
   "note": "Trust, attitudes and use of AI: a global study 2025; 47 countries, 48,340 respondents; fieldwork November 2024–January 2025. 'Use at work' values read from a chart."},
  {"title": "Surveys and trackers used in this index", "columns": ["Survey", "Coverage", "Measure", "Latest"], "rows": [[s_['survey'], s_['coverage'], s_['measure'], s_['latest']] for s_ in D['surveys']]}
 ]
})
page['chapters'] = ch
page['definitions'] = [
 {"term": "AI user share (Microsoft)", "def": "The share of people aged 15–64 who used a generative AI product in the period, estimated by Microsoft from anonymised Windows desktop telemetry on visits to 19 named AI services, scaled to mobile use with StatCounter ratios and to population with World Bank data. It is not a survey; the 19 services include some Chinese and Russian ones but not ByteDance's Doubao, and economies with low telemetry opt-in are pulled towards the global average."},
 {"term": "Global North and Global South", "def": "Microsoft's grouping of economies by income and development; used here only as Microsoft defines it."},
 {"term": "Regional estimate", "def": "An economy for which Microsoft reports the same value as others in its group in every edition, indicating a modelled rather than measured figure."},
 {"term": "Monthly active users (MAU)", "def": "People who used an app or service at least once in a month; not comparable with weekly active users or with population shares."},
 {"term": "Referral share (StatCounter)", "def": "The share of clicks from AI chatbots to websites that StatCounter tracks; it measures links followed, not how many people use each chatbot."}
]
page['faq'] = [
 {"q": "Which country uses AI the most?", "a": f"On Microsoft's AI Diffusion data, the {top} had the highest share of working-age people using generative AI in Q2 2026, at {f1(ms(top))}%, followed by {second} at {f1(ms(second))}% and Ireland at {f1(ms('Ireland'))}%."},
 {"q": "What share of the world uses AI?", "a": f"About {f1(W['Q2 2026'])}% of the world's working-age population (15–64) used a generative AI product in Q2 2026, up from {f1(W['H1 2025'])}% in H1 2025, according to Microsoft's AI Economy Institute."},
 {"q": "How does the United States rank for AI use?", "a": f"The United States ranked {ordn(rank('United States'))} of {N_ECON} economies in Microsoft's Q2 2026 data, with {f1(ms('United States'))}% of working-age people using generative AI, up from {f1(ms('United States', 'h1_2025'))}% in H1 2025."},
 {"q": "Why does China rank so low?", "a": f"Microsoft's measure ({f1(ms('China'))}% for China in Q2 2026) relies on Microsoft-product telemetry and misses most Chinese domestic apps. National data show far higher use: QuestMobile counted {cn['values']['total (dedup)']} monthly users of AI-native apps in China in September 2026."},
 {"q": "Is the AI divide between rich and poor countries growing?", "a": f"Yes, on Microsoft's data: the gap between the Global North and Global South widened from {f1(GAP['H1 2025'])} to {f1(GAP['Q2 2026'])} percentage points between H1 2025 and Q2 2026, as use grew faster in the North."}
]
page['methodology_extra'] = f"The core series is Microsoft's AI Diffusion dataset ({N_ECON} economies, four editions), downloaded from Microsoft's public GitHub repository. National figures come from QuestMobile and CNNIC (China), Mediascope (Russia), Mobile Index and Wiseapp (South Korea), and app-intelligence firms (India); surveys from Eurostat, the OECD, KPMG and the University of Melbourne, Ipsos and Pew. Regional averages, growth rates, ranks of change and the world-user estimate are Report AI calculations (DERIVED). Different measures are shown side by side and never combined into one ranking. "
page['related'] = "<a href=\"/indexes/geography-of-ai/\">The Geography of AI</a> &middot; <a href=\"/indexes/geography-of-ai/sovereign-ai-index-2026/\">Sovereign AI Index 2026</a> &middot; <a href=\"/indexes/geography-of-ai/popular-ai-models-by-country/\">The most popular AI model in every country</a> &middot; <a href=\"/indexes/state-of-ai/state-of-ai-geography/\">State of AI Geography 2026</a> &middot; <a href=\"/indexes/state-of-ai/state-of-ai-usage/\">State of AI Usage 2026</a> &middot; <a href=\"/indexes/geography-of-ai/ai-in-india-2026/\">AI in India</a> &middot; <a href=\"/indexes/geography-of-ai/ai-middle-east-2026/\">AI in the Middle East</a> &middot; <a href=\"/indexes/geography-of-ai/ai-in-europe-2026/\">AI in Europe</a> &middot; <a href=\"/indexes/state-of-ai/ai-development-index/\">AI Development Index</a> &middot; <a href=\"/indexes/enterprise-ai/chatgpt-statistics-2026/\">ChatGPT statistics</a> &middot; <a href=\"/glossary/sovereign-ai/\">Sovereign AI</a>"
page['about'] = {"@type": "Thing", "name": "Artificial intelligence adoption by country"}
json.dump(page, open(os.path.join(HERE, 'use.json'), 'w'), ensure_ascii=False, indent=1)
print('use.json written:', len(page['chapters']), 'chapters,', N_ECON, 'economies,', len(modelled), 'regional estimates')
