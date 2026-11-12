"""Generate content-ops/geo/sov.json: rebuilt Sovereign AI Index 2026 (page 934) from sovereign-data.json.
Run: python3 content-ops/geo/make_sovereign.py
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'sovereign-data.json')))
M = D['models']


def first(x):
    if isinstance(x, list):
        return x[0] if x else None
    return x


def comp(sub):
    return next(p for p in D['popularity'] if sub.lower() in p['comparison'].lower())


def short(s, n=70):
    s = re.sub(r'\s+', ' ', str(s or '')).strip()
    return s if len(s) <= n else s[:n].rsplit(' ', 1)[0] + '…'


def num(v):
    try:
        return float(v)
    except Exception:
        return None


def fmt_dl(v):
    v = num(v)
    if v is None:
        return ''
    return f'{v / 1e6:.2f}M' if v >= 1e6 else f'{v / 1e3:.0f}k' if v >= 1e3 else f'{v:.0f}'


hf = comp('30-day downloads by organisation')['rows']
HF = {r['org']: r for r in hf}
qwen = num(HF['Qwen']['value'])
CHINA_US_ORGS = {'Qwen', 'zai-org', 'meta-llama', 'MiniMaxAI', 'moonshotai', 'deepseek-ai', 'google', 'openai', 'microsoft', 'nvidia', 'tencent', 'baidu', 'ByteDance-Seed', 'XiaomiMiMo'}
national = [r for r in hf if r['org'] not in CHINA_US_ORGS and num(r['value']) and 'orgs above' not in r['org']]
nat_sum = sum(num(r['value']) for r in national)
aa_top = [r for r in comp('top-20 distinct models')['rows'] if 'rank' in r]
aa_best = [r for r in comp('best model by developer country')['rows'] if 'model' in r and num(r.get('value')) is not None]
orr = [r for r in comp('OpenRouter author share')['rows'] if 'author' in r]
n_countries = len({re.split(r' [(/]', m['country'])[0] for m in M})
scratch = sum(1 for m in M if (m.get('build_type') or '').lower().startswith('from scratch'))
adapted = sum(1 for m in M if 'adapt' in (m.get('build_type') or '').lower())
us_top20 = sum(1 for r in aa_top if r.get('country') == 'US')
cn_top20 = sum(1 for r in aa_top if r.get('country') == 'China')

# ---- catalogue rows
cat = []
for m in M:
    pop = m.get('popularity') or {}
    d30 = first(pop.get('hf_downloads_last_month'))
    dall = first(pop.get('hf_downloads_all_time'))
    users = first(pop.get('users'))
    lb = first(pop.get('leaderboard'))
    conf = 'HIGH' if (d30 and d30.get('confidence') == 'HIGH') else 'MEDIUM'
    cat.append([m['country'], short(m['model_family'], 48), short(m['developer'], 40),
                short(m.get('build_type') or 'not stated', 40),
                'Yes' if m.get('open_weights') is True else 'No' if m.get('open_weights') is False else short(m.get('open_weights'), 20),
                short(m.get('latest_version'), 60),
                fmt_dl(d30['value']) if d30 and num(d30.get('value')) else '',
                (fmt_dl(dall['value']) if dall and num(dall.get('value')) else short(dall.get('value'), 14) if dall else ''),
                short(f"{users['value']} {users.get('unit', '')}", 50) if users else '',
                conf])

page = {
 "slug": "sovereign-ai-index-2026",
 "path": "/indexes/geography-of-ai/sovereign-ai-index-2026/",
 "parent_path": "/indexes/geography-of-ai/",
 "csv": "report-ai-data-sovereign-ai-index-2026.csv",
 "trail": [["Indexes", "/indexes/"], ["The Geography of AI", "/indexes/geography-of-ai/"], ["Sovereign AI Index 2026", "/indexes/geography-of-ai/sovereign-ai-index-2026/"]],
 "eyebrow": "Report AI &middot; The Geography of AI &middot; Index &middot; Updated quarterly",
 "title": "Sovereign AI Index 2026: National Models, Compute and Who Uses Them",
 "dek": f"{len(M)} national and sovereign AI models across {n_countries} countries and regions, the compute programmes behind them, and the evidence on whether anyone uses them: downloads, users, leaderboard ranks and home-market share. Every figure dated, sourced and confidence-rated.",
 "cadence_note": "Cadence: quarterly (STANDARD) &middot; Next update February 2027",
 "edition": "November 2026 edition (rebuilt)",
 "coverage": "2023/2026",
 "nav_active": "Sovereign AI Index",
 "nav": [["Geography of AI", "/indexes/geography-of-ai/"], ["AI use by country", "/indexes/geography-of-ai/ai-use-by-country-2026/"], ["Sovereign AI Index", "/indexes/geography-of-ai/sovereign-ai-index-2026/"], ["Most popular model by country", "/indexes/geography-of-ai/popular-ai-models-by-country/"], ["State of AI Geography", "/indexes/state-of-ai/state-of-ai-geography/"]],
 "tiles": [
  {"value": f"{len(M)}", "label": f"national and sovereign models catalogued in {n_countries} countries and regions (Report AI, Nov 2026)", "confidence": "DERIVED"},
  {"value": f"{nat_sum / qwen * 100:.1f}%", "label": f"30-day Hugging Face downloads of {len(national)} national model makers combined, as a share of Alibaba's Qwen alone (Nov 2026)", "confidence": "DERIVED"},
  {"value": f"{us_top20} of 20", "label": f"top models on the Artificial Analysis Intelligence Index are American; {cn_top20} are Chinese; none from elsewhere (Nov 2026)", "confidence": "HIGH"},
  {"value": "0 MW", "label": "operating at Stargate UAE in November 2026; the first 200 MW is projected for December (Epoch AI)", "confidence": "HIGH"}
 ],
 "at_a_glance": [
  f"We catalogue {len(M)} sovereign or national AI model families across {n_countries} countries and regions. About {scratch} are described as trained from scratch and about {adapted} are adaptations of foreign open-weight models such as Meta's Llama, Google's Gemma, Alibaba's Qwen or Nvidia's Nemotron.",
  f"Measured by developer downloads, sovereign models are a niche: in the 30 days to 12 November 2026, {len(national)} national model makers together recorded about {nat_sum / 1e6:.1f} million Hugging Face downloads, about {nat_sum / qwen * 100:.1f}% of the {qwen / 1e6:.1f} million for Alibaba's Qwen alone (Report AI calculation from Hugging Face data). France's Mistral accounts for most of that national total.",
  f"Measured by capability, the frontier is American and Chinese: {us_top20} of the top 20 models on the Artificial Analysis Intelligence Index (v5.0.1, November 2026) come from US developers and {cn_top20} from Chinese ones. The best-scoring model from any other country is Mistral Large 4, at 26.1 against 64.6 for the leader.",
  "Measured by home-market use, local champions win only where foreign assistants are blocked or weak: in China, ByteDance's Doubao had 419 million monthly users in September 2026; in South Korea, ChatGPT had about 91% of AI-app users despite years of investment in local models.",
  "The money is mostly going into compute rather than models: national programmes in the UAE, Saudi Arabia, India, Japan, South Korea, Canada and the EU buy chips and data centres, then run a mix of imported and local models on them."
 ],
 "toc_extra": [["stop-quoting", "Numbers to stop quoting"], ["definitions", "Definitions"], ["faq", "FAQ"], ["about", "About the data"]],
 "analysis": [
  "Sovereign AI has become one of the most used phrases in AI policy and one of the least defined. For this index we separate four things that are often run together: sovereign infrastructure (domestic compute under national control), sovereign models (trained from scratch or adapted from foreign open weights), sovereign data (control over national training corpora) and sovereign deployment (foreign models run in-country under local rules). Most countries pursue all four in name and fund mainly the first.",
  "The popularity evidence is sobering for national models. On Hugging Face, the main distribution channel for open models, Chinese models took 41% of downloads between February 2025 and February 2026, ahead of US models, and Alibaba's Qwen alone outdraws every national model maker combined many times over. National models do find users where they serve a language or a regulated sector that global models serve poorly: Japanese government trials, Korean public services, Arabic-language deployments and Indian-language speech. But outside China and Russia, where policy or sanctions shape the market, no national assistant leads its home consumer market.",
  "That does not make sovereign programmes pointless. Their realistic product is resilience and bargaining power rather than market share: domestic compute that keeps running if access is cut off, models that can be audited and adapted for public services, and the skills to do both. The June 2026 suspension of two US frontier models under export controls, and China's October 2026 draft controls on model weights, showed why governments value that. The risk is the one visible in our data: adapted models built on Qwen, Llama or Gemma inherit their base model's licence and, potentially, its home country's export rules.",
  "The compute build-out is also slower than the headlines. Stargate UAE had no capacity operating in November 2026; Saudi Arabia's HUMAIN's '600,000 GPUs' is a three-year ceiling against signed deals for about 27,000; and India's common compute portal had onboarded about 38,000 GPUs by March 2026, roughly the figure it reported six months earlier."
 ],
 "takeaways": [
  "Separate the layers: infrastructure, models, data and deployment are different kinds of sovereignty.",
  "Most national models are adaptations of foreign open weights, chiefly Llama, Gemma, Qwen and Nemotron.",
  "Downloads, users and leaderboard ranks all show national models as niche outside China.",
  "Home-market leadership by a domestic assistant happens where foreign assistants are blocked or restricted.",
  "Announced compute (GW, GPU ceilings) runs well ahead of operating compute."
 ],
 "chapters": [],
 "stop_quoting": [{"claim": s['claim'], "fact": s['fact'], "link": ""} for s in D['stop_quoting']],
}

ch = []
ch.append({
 "id": "typology", "kicker": "1. What 'sovereign' means",
 "action_title": "Sovereign AI is four different things, and most programmes fund infrastructure first",
 "paras": ["The typology below is used throughout this index. It draws on definitions from Stanford HAI, CSET, CNAS, McKinsey and Counterpoint Research, simplified into categories that can be measured."],
 "tables": [{"title": "A typology of sovereign AI", "columns": ["Category", "Definition", "Examples"],
             "rows": [[t['term'], t['definition'], '; '.join(t.get('examples', [])[:4])] for t in D['typology']]}]
})
ch.append({
 "id": "catalogue", "kicker": "2. The catalogue",
 "action_title": f"{len(M)} national models in {n_countries} countries: about {scratch} trained from scratch, about {adapted} adapted from foreign open weights",
 "paras": [
  "Each row is a national or nationally backed model family, with its developer, how it was built, whether its weights are published, its latest version and its popularity on the measures available. Hugging Face figures are organisation-wide downloads in the 30 days to 12 November 2026 and all-time totals, from the Hugging Face API; they count developer downloads, including automated ones, not users.",
  "Counts of how many models are 'from scratch' depend on definitions: Counterpoint Research found 56% of sovereign models in H1 2026 were adapted from foreign bases, and CNAS's August 2026 index counted 184 projects in 67 countries, about 40% trained from scratch."
 ],
 "tables": [{"title": "Sovereign and national AI models, November 2026", "columns": ["Country", "Model family", "Developer", "How built", "Open weights", "Latest version", "HF downloads, 30 days", "HF downloads, all time", "Users (where reported)", "Confidence"], "rows": cat,
             "note": "Sources per row in the data download. Hugging Face organisation totals can include non-LLM repositories (embeddings, speech). Blank cells mean no reliable figure was found."}]
})
top_nat = sorted(national, key=lambda r: -num(r['value']))[:15]
ORGNAME = {'mistralai': 'Mistral (France)', 'pfnet': 'Preferred Networks (JP)', 'LGAI-EXAONE': 'LG EXAONE (Korea)', 'CohereLabs': 'Cohere (Canada)',
           'llm-jp': 'LLM-jp (Japan)', 'tiiuae': 'TII Falcon (UAE)', 'ai-sage': 'Sber GigaChat (Russia)', 'skt': 'SK Telecom (Korea)',
           'swiss-ai': 'Apertus (Switzerland)', 'typhoon-ai': 'Typhoon (Thailand)', 'IFM': 'MBZUAI IFM K2 (UAE)', 'upstage': 'Upstage Solar (Korea)',
           'Sahabat-AI': 'Sahabat-AI (Indonesia)', 'humain-ai': 'HUMAIN ALLaM (Saudi)', 'BSC-LT': 'BSC ALIA (Spain)', 'aisingapore': 'SEA-LION (Singapore)',
           'sarvamai': 'Sarvam (India)', 'taide': 'TAIDE (Taiwan)'}
ch.append({
 "id": "downloads", "kicker": "3. Popularity: downloads",
 "action_title": f"National model makers together draw about {nat_sum / qwen * 100:.0f}% of the downloads of Alibaba's Qwen alone",
 "paras": [
  f"Hugging Face downloads are the most complete public measure of open-model popularity, though they count developers and automated systems rather than end users. In the 30 days to 12 November 2026, the Qwen organisation recorded about {qwen / 1e6:.1f} million downloads. The {len(national)} national and sovereign model makers we track recorded about {nat_sum / 1e6:.1f} million between them, and France's Mistral alone accounted for about {num(HF['mistralai']['value']) / nat_sum * 100:.0f}% of that (Report AI calculation).",
  "Over longer windows the pattern is the same. The ATOM project's count of cumulative downloads put Qwen at about 942 million by March 2026, roughly twice Meta's Llama, and Hugging Face reported that Chinese models took 41% of all downloads between February 2025 and February 2026. Qwen is also the most popular base for national adaptations, which means part of the 'sovereign' ecosystem in Southeast Asia and elsewhere now runs on a Chinese foundation."
 ],
 "exhibits": [
  {"type": "bar", "title": "One Chinese model family outdraws every national model maker combined", "subtitle": "Hugging Face downloads in the 30 days to 12 Nov 2026, millions", "unit": "M downloads",
   "series": [{"name": "Downloads", "points": [["Qwen (Alibaba)", round(qwen / 1e6, 1)], ["Meta Llama", round(num(HF['meta-llama']['value']) / 1e6, 1)], ["Mistral", round(num(HF['mistralai']['value']) / 1e6, 1)], [f"{len(national) - 1} other national", round((nat_sum - num(HF['mistralai']['value'])) / 1e6, 1)]]}],
   "source": "Source: Hugging Face API, organisation download totals; Report AI calculation", "notes": "Organisation-wide totals of the 30-day download counter; include automated downloads and non-LLM repositories. 'Other national' sums the national and sovereign organisations listed in the catalogue, excluding Mistral.", "confidence": "DERIVED"},
  {"type": "hbar", "title": "Among national model makers, Mistral leads by a wide margin", "subtitle": "Hugging Face downloads in the 30 days to 12 Nov 2026, national and sovereign organisations (thousands)", "unit": "k downloads",
   "series": [{"name": "Downloads", "points": [[ORGNAME.get(r['org'], r['org']), round(num(r['value']) / 1e3)] for r in top_nat]}],
   "source": "Source: Hugging Face API", "notes": "Organisation-wide totals, including non-LLM repositories: Preferred Networks' most downloaded repo is an embedding model and Sber's a speech model. Community re-uploads are excluded.", "confidence": "HIGH"}
 ]
})
ch.append({
 "id": "capability", "kicker": "4. Popularity: capability and usage share",
 "action_title": f"On capability leaderboards and developer platforms, the US and China take almost every top spot",
 "paras": [
  f"On the Artificial Analysis Intelligence Index (v5.0.1, 12 November 2026), the top nine models are all from US developers, led by Claude Fable 5.2 at 64.6; the best Chinese model is Kimi K3.1 Pro at 46.5, the highest-ranked open-weight model. The best model from any third country is Mistral Large 4 from France at 26.1, followed by the UAE's K2 Horizon (17.8) and South Korea's Solar Pro 4 (14.2). No model from India, Japan, Russia or Germany appears on the index.",
  "On OpenRouter, a developer marketplace that routes requests to many models, Chinese developers took about 47% of requests in the week beginning 2 November 2026 and US developers about 39% (Report AI calculation by developer country); DeepSeek alone had about 32%. OpenRouter notes that its rankings measure traffic through its own platform, not users or spending. LMArena's crowd-sourced rankings could not be verified for this edition."
 ],
 "exhibits": [{"type": "hbar", "title": "Outside the US and China, the best national model scores well below the frontier", "subtitle": "Best model by developer country, Artificial Analysis Intelligence Index v5.0.1, 12 Nov 2026", "unit": "index score",
   "series": [{"name": "Score", "points": [[f"{r['country']}: {re.sub(r' [(].*', '', r['model'])}"[:26], r['value']] for r in sorted(aa_best, key=lambda r: -num(r['value'])) if r.get('country') not in (None, '', 'unknown')]}],
   "source": "Source: Artificial Analysis", "notes": "Best variant of each country's best model. Countries without any model on the index are omitted.", "confidence": "HIGH"}],
 "tables": [
  {"title": "Artificial Analysis Intelligence Index: top 20 distinct models", "columns": ["Rank", "Model", "Developer", "Country", "Score"], "rows": [[str(r['rank']), r['model'], r['developer'], r['country'], str(r['value'])] for r in aa_top]},
  {"title": "OpenRouter: share of requests by model developer, week beginning 2 Nov 2026", "columns": ["Developer", "Country", "Share of requests", "Confidence"], "rows": [[r['author'], r.get('country', ''), str(r.get('value')), r.get('confidence', '')] for r in orr], "note": "OpenRouter rankings measure requests routed through OpenRouter only, not users, tokens or spending."}
 ]
})
home = [p for p in D['popularity'] if p['comparison'].lower().startswith('home-market')]
hrows = []
for p in home:
    place = p['comparison'].split(':', 1)[1].strip()
    for r in p['rows']:
        hrows.append([short(place, 40), r.get('app') or r.get('model') or '', str(r.get('value')), short(r.get('unit'), 60), r.get('date', ''), short(r.get('source'), 50), r.get('confidence', '')])
ch.append({
 "id": "home", "kicker": "5. Popularity: home markets",
 "action_title": "Domestic assistants lead their home markets only where foreign ones are blocked or restricted",
 "paras": [
  "The consumer test of sovereignty is whether people at home choose the national assistant. In China, where Western assistants are blocked, domestic apps dominate: ByteDance's Doubao had about 419 million monthly users in September 2026, Alibaba's Qianwen about 158 million and DeepSeek about 123 million (QuestMobile). In Russia, Yandex's Alice AI reached about 48% of people aged 12 and over in September 2026, against 5% for Sber's GigaChat (Mediascope).",
  "Elsewhere, global assistants lead even in countries with strong national programmes. In South Korea, ChatGPT's app had 18.76 million monthly users in October 2026, about 91% of AI-app users, and Naver closed its standalone chatbot in April 2026 to focus on AI answers inside search. In France, ChatGPT dominates consumer use while Mistral's strength is in enterprise and government contracts. In India, OpenAI said in November 2026 that the country had become ChatGPT's largest market."
 ],
 "tables": [{"title": "Home-market use of national and global assistants", "columns": ["Market", "Assistant", "Value", "Measure", "Date", "Source", "Confidence"], "rows": hrows,
             "note": "Measures differ by row (app users, reach, referral share, web traffic); compare within a market only. StatCounter figures measure clicks from chatbots to websites, not usage."}]
})
crow = []
for p in D['compute_programmes']:
    figs = p.get('figures') or []
    crow.append([p['programme'], p['country'], short(p.get('type'), 50), '; '.join(short(f"{f['value']} ({f.get('unit', '')}, {f.get('date', '')})", 110) for f in figs[:3]),
                 'HIGH' if any(f.get('confidence') == 'HIGH' for f in figs) else 'MEDIUM'])
ch.append({
 "id": "compute", "kicker": "6. Compute and money",
 "action_title": "Announced sovereign compute runs well ahead of what is operating",
 "paras": [
  "Most sovereign money buys infrastructure. The table lists the main national programmes with their headline and, where available, delivered figures. Four kinds of money appear and should never be added together: budget appropriations, state equity funds, sovereign-wealth vehicles, and 'mobilisation' headlines that count expected private investment.",
  "Delivery lags announcement. Epoch AI's data-centre tracking shows Stargate UAE with no capacity operating in November 2026, against a first 200 MW projected for December. HUMAIN's 600,000-GPU figure is a three-year ceiling; its signed October 2026 deal covers about 27,000 GPUs and 84 MW through 2027. Nvidia, the clearest commercial proxy, reported more than $30 billion of sovereign AI revenue in its fiscal 2026 and has given only growth rates since."
 ],
 "tables": [{"title": "National compute programmes", "columns": ["Programme", "Country", "Type of money", "Key figures", "Confidence"], "rows": crow,
             "note": "Figures as announced or reported; see the data download for sources. Budget, equity, sovereign-wealth and mobilisation totals are different measures."}]
})
page['chapters'] = ch
page['definitions'] = [{"term": t['term'], "def": t['definition']} for t in D['typology'][:6]]
page['faq'] = [
 {"q": "What is sovereign AI?", "a": "Sovereign AI is a country's capacity to develop, run and govern AI on infrastructure, data and models it controls, rather than renting them from foreign providers. In practice it covers four layers: domestic compute, national models (from scratch or adapted), control of training data, and in-country deployment of foreign models under local rules."},
 {"q": "Which countries have built their own AI models?", "a": f"Report AI's November 2026 index catalogues {len(M)} national model families across {n_countries} countries and regions, including France (Mistral), the UAE (Falcon, Jais, K2), Saudi Arabia (ALLaM), India (Sarvam, BharatGen), Japan (PLaMo, LLM-jp, tsuzumi), South Korea (EXAONE, A.X, Solar), Switzerland (Apertus), Singapore (SEA-LION), Russia (GigaChat, Alice AI) and China (Qwen, DeepSeek, Doubao, Kimi, GLM)."},
 {"q": "Are sovereign AI models popular?", "a": f"Mostly not, outside China. In the 30 days to 12 November 2026, {len(national)} national model makers together had about {nat_sum / 1e6:.1f} million Hugging Face downloads, about {nat_sum / qwen * 100:.1f}% of Alibaba's Qwen alone, and no model from outside the US and China ranks in the top 20 of the Artificial Analysis Intelligence Index."},
 {"q": "What is the most popular sovereign AI model?", "a": "By home-market users, China's Doubao (ByteDance) with about 419 million monthly users in September 2026. Among models outside the US and China, France's Mistral leads on developer downloads and capability scores."},
 {"q": "How much are governments spending on sovereign AI?", "a": "Announced figures run to hundreds of billions, but they mix budgets, state funds, sovereign-wealth vehicles and private 'mobilisation' totals that cannot be added together. Delivered compute is much smaller: Stargate UAE had no capacity operating in November 2026, and India's common compute portal had about 38,000 GPUs onboarded by March 2026."}
]
page['methodology_extra'] = "The catalogue was compiled from developer announcements, model cards and national programme documents. Popularity measures come from the Hugging Face API (organisation download totals, read 12 November 2026), Artificial Analysis (Intelligence Index v5.0.1), OpenRouter's public rankings, StatCounter, and national app and audience trackers (QuestMobile, Mediascope, Mobile Index). Each measures something different; none is a count of users across all channels. Shares of downloads and requests by country, and counts of models by build type, are Report AI calculations (DERIVED). This edition replaces the July 2026 version of this page. "
page['related'] = "<a href=\"/indexes/geography-of-ai/\">The Geography of AI</a> &middot; <a href=\"/indexes/geography-of-ai/ai-use-by-country-2026/\">AI use by country 2026</a> &middot; <a href=\"/indexes/geography-of-ai/popular-ai-models-by-country/\">The most popular AI model in every country</a> &middot; <a href=\"/indexes/state-of-ai/state-of-ai-geography/\">State of AI Geography 2026</a> &middot; <a href=\"/indexes/geography-of-ai/ai-in-india-2026/\">AI in India</a> &middot; <a href=\"/indexes/geography-of-ai/ai-middle-east-2026/\">AI in the Middle East</a> &middot; <a href=\"/indexes/geography-of-ai/ai-in-europe-2026/\">AI in Europe</a> &middot; <a href=\"/indexes/ai-economics/ai-government-spending-2026/\">AI government spending</a> &middot; <a href=\"/indexes/technical-benchmarks/chinese-ai-models-2026/\">Chinese AI models, ranked</a> &middot; <a href=\"/indexes/technical-benchmarks/open-vs-closed-ai-models-2026/\">Open vs closed AI models</a> &middot; <a href=\"/glossary/sovereign-ai/\">Sovereign AI (glossary)</a>"
page['about'] = {"@type": "Thing", "name": "Sovereign artificial intelligence"}
json.dump(page, open(os.path.join(HERE, 'sov.json'), 'w'), ensure_ascii=False, indent=1)
print('sov.json:', len(M), 'models,', n_countries, 'countries; scratch', scratch, 'adapted', adapted, '; national orgs', len(national), f'{nat_sum/1e6:.2f}M vs Qwen {qwen/1e6:.1f}M', '; AA top20 US', us_top20, 'CN', cn_top20)
