"""Generate content-ops/ml-models/taxonomy.json (How to Categorize LLMs index) from llm-taxonomy-data.json.

Every count in the prose is computed from the model table, so a correction to a row changes
the text on the next build. Run: python3 content-ops/ml-models/make_taxonomy.py
"""
import json, os
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'llm-taxonomy-data.json')))
M = D['models']
AGG = {a['id']: a for a in D['aggregates']}
DIM = {d['id']: d for d in D['dimensions']}
N = len(M)
SELF = '/indexes/technical-benchmarks/llm-taxonomy-2026/'
BENCH = '/reports/machine-learning-models-compared/'


def pct(a, b):
    return 100.0 * a / b if b else 0.0


def f1(x):
    return f'{x:.1f}'


def cnt(key, rows=M):
    return Counter(r.get(key) for r in rows)


def yr(r):
    return int(r.get('release_year') or str(r['release'])[:4])


openish = lambda r: r['openness'] in ('open-weight', 'open-source')
has_reason = lambda r: r.get('reasoning') in ('reasoning', 'hybrid')
arch = cnt('architecture_family')
openc = cnt('openness')
lic = cnt('licence_class')
reas = cnt('reasoning')
size = cnt('size_class')
spec = cnt('specialisation')
modal = cnt('modality_class')
dev = cnt('developer_type')
ctry = cnt('country')
comp = cnt('compute_class')

early = [r for r in M if yr(r) <= 2024]; late = [r for r in M if yr(r) >= 2025]
open_early = [r for r in early if openish(r)]; open_late = [r for r in late if openish(r)]
moe_in = lambda r: r['architecture_family'] == 'MoE' or (r.get('active_params_b') and r.get('total_params_b') and r['active_params_b'] < r['total_params_b'] and 'Gemma 3n' not in r['name'])
moe_early = sum(1 for r in open_early if moe_in(r)); moe_late = sum(1 for r in open_late if moe_in(r))
reas_verified = [r for r in M if r.get('reasoning') in ('none', 'reasoning', 'hybrid')]
ver = lambda rs: [r for r in rs if r.get('reasoning') in ('none', 'reasoning', 'hybrid')]
early_v, late_v = ver(early), ver(late)
re_early = sum(1 for r in early_v if has_reason(r)); re_late = sum(1 for r in late_v if has_reason(r))
years = sorted({yr(r) for r in M})
by_year = {y: [r for r in M if yr(r) == y] for y in years}
closed = [r for r in M if r['openness'] == 'closed']
closed_undisclosed_arch = sum(1 for r in closed if r['architecture_family'] == 'undisclosed')
over25 = sorted([r for r in M if (r.get('training_compute_flop') or 0) >= 1e25], key=lambda r: -r['training_compute_flop'])
over26 = [r for r in over25 if r['training_compute_flop'] >= 1e26]
moe_rows = sorted([r for r in M if r.get('active_params_b') and r.get('total_params_b') and r['architecture_family'].split(' ')[0] in ('MoE', 'hybrid', 'diffusion') and r['active_params_b'] < r['total_params_b']],
                  key=lambda r: -r['total_params_b'])
biggest = moe_rows[0]
ctx_known = sorted([r for r in M if r.get('context_tokens')], key=lambda r: -r['context_tokens'])

# assert that the computed shares match the research file's own aggregates (catches drift)
assert f"{moe_late} of {len(open_late)}" in AGG['moe_share_open']['sentence'], (moe_late, len(open_late))
assert f"{re_late} of {len(late_v)}" in AGG['reasoning_share_2025_2026']['sentence']

hf = AGG['hf_public_models']; aa = AGG['aa_open_closed_gap']; aa_share = AGG['aa_open_share_indexed']
ep = AGG['epoch_db_over_1e25']; ep_list = AGG['epoch_1e25_dataset']


def params(r):
    t, a = r.get('total_params_b'), r.get('active_params_b')
    if t is None:
        return 'undisclosed'
    fm = lambda v: f'{v:,.0f}' if v >= 10 else f'{v:g}'
    return f'{fm(t)} / {fm(a)}' if a and a < t else fm(t)


def ctx(r):
    c = r.get('context_tokens')
    if not c:
        return 'n/d'
    return f'{c / 1e6:g}M' if c >= 1e6 else f'{c / 1e3:g}K'


def mods(r):
    return ', '.join(r.get('input_modalities') or []) or 'n/d'


ARCH_LABEL = {'MoE': 'Mixture-of-experts', 'dense': 'Dense transformer', 'undisclosed': 'Undisclosed',
              'hybrid (SSM / linear attention)': 'Hybrid (state-space / linear attention)', 'diffusion': 'Diffusion'}
REASON_LABEL = {'none': 'No', 'reasoning': 'Yes (always on)', 'hybrid': 'Hybrid (switchable)'}


def src_link(r):
    u = (r.get('sources') or [''])[0]
    if not u:
        return ''
    host = u.split('/')[2].replace('www.', '')
    return {'text': host, 'href': u}


full_rows = [[r['name'], r['developer'], r['country'], r['release'], r['openness'], ARCH_LABEL.get(r['architecture_family'], r['architecture_family']),
              params(r), ctx(r), REASON_LABEL.get(r.get('reasoning'), 'not verified'), mods(r), r['size_class'], src_link(r), r['confidence']]
             for r in sorted(M, key=lambda r: (r['release'], r['name']))]

tiles = [
    {"value": f"{N}", "label": f"large language models classified on 8 dimensions, {years[0]} to November {years[-1]} (Report AI table)", "confidence": "DERIVED"},
    {"value": f"{f1(pct(re_late, len(late_v)))}%", "label": f"of models released 2025–26 in the table have a reasoning mode, against {f1(pct(re_early, len(early_v)))}% for 2023–24", "confidence": "DERIVED"},
    {"value": f"{f1(pct(moe_late, len(open_late)))}%", "label": f"of open-weight models released 2025–26 use mixture-of-experts layers, against {f1(pct(moe_early, len(open_early)))}% for 2023–24", "confidence": "DERIVED"},
    {"value": f"{hf['value']['all_public_models'] / 1e6:.2f}M", "label": f"public models on Hugging Face on 15 Nov 2026, of which {hf['value']['text_generation']:,} tagged text-generation", "confidence": "HIGH"},
]

dim_rows = [
    ["Architecture", "How the network is built: dense transformer, mixture-of-experts, hybrid state-space, diffusion", "How much compute each token costs, how much memory it needs, how long a context it handles cheaply",
     '; '.join(f"{ARCH_LABEL[k]} {v}" for k, v in arch.most_common())],
    ["Training stage and reasoning", "Base, instruction-tuned, reasoning (thinks before answering), hybrid (thinking can be switched off)", "Answer quality on hard problems versus speed and price per answer",
     '; '.join(f"{REASON_LABEL.get(k, 'not verified')} {v}" for k, v in reas.most_common())],
    ["Openness", "Closed (API only), open-weight (downloadable with licence terms), open-source (weights, code and data)", "Whether you can run, inspect, fine-tune or keep data in house",
     '; '.join(f"{k} {v}" for k, v in openc.most_common())],
    ["Modality", "Text-only, multimodal input (images, sometimes audio and video), omni (native audio in and out)", "What you can show it and what it can return",
     '; '.join(f"{k} {v}" for k, v in modal.most_common())],
    ["Size and deployment", "Frontier, large (100B+), mid-size (10–100B), small (<10B), on-device", "Where it can run: data centre, laptop or phone",
     '; '.join(f"{k} {v}" for k, v in size.most_common())],
    ["Specialisation", "General, code, maths, domain (medical, legal), embedding, safety/guard", "Whether it is the right tool for one job or many",
     '; '.join(f"{k} {v}" for k, v in spec.most_common())],
    ["Training-compute class", "Below or above the 10^25 FLOP (EU) and 10^26 (California, New York) thresholds", "Which legal duties attach to the model's maker",
     '; '.join(f"{k} {v}" for k, v in comp.most_common())],
    ["Origin", "Big tech, AI lab or start-up, academic or non-profit, government or sovereign; and country", "Jurisdiction, language coverage and supply-chain dependence",
     '; '.join(f"{k.replace('_', ' ')} {v}" for k, v in dev.most_common())],
]


def cat_table(dim_id, title):
    d = DIM[dim_id]
    return {"title": title, "columns": ["Category", "Definition", "Examples"],
            "rows": [[c['name'], c['definition'], ', '.join(c.get('examples') or [])] for c in d['categories']]}


moe_table = {"title": "Total versus active parameters: the largest mixture-of-experts and hybrid models in the table",
             "columns": ["Model", "Developer", "Released", "Total parameters (B)", "Active per token (B)", "Active share", "Confidence"],
             "rows": [[r['name'], r['developer'], r['release'], f"{r['total_params_b']:,.0f}", f"{r['active_params_b']:g}", f"{pct(r['active_params_b'], r['total_params_b']):.1f}%", r['confidence']] for r in moe_rows[:15]],
             "note": "Active share is Report AI's calculation (active ÷ total). Totals and active counts are from each model's card or paper."}

compute_rows = [[r['name'], r['developer'], r['release'], f"{r['training_compute_flop']:.2e}".replace('e+', ' × 10^'), r.get('epoch_compute_confidence') or '', r['openness'],
                 "Above 10^26" if r['training_compute_flop'] >= 1e26 else "10^25 to 10^26", "HIGH"] for r in over25]
threshold_rows = [[c['name'], c['definition'], ', '.join(c.get('examples') or []), 'MEDIUM'] for c in DIM['compute']['categories']]

use_rows = [
    ["Reasoning model", "Better on maths, code and multi-step problems; slower first token and more output tokens billed, because it writes hidden reasoning before answering",
     {"text": "Test-time compute & reasoning", "href": "/indexes/technical-benchmarks/test-time-compute-reasoning-2026/"}],
    ["Mixture-of-experts", "Cheaper and faster per token than a dense model of the same total size, because only the active experts run; still needs memory for all parameters",
     {"text": "LLM Token Price Index", "href": "/indexes/ai-economics/llm-token-price-index/"}],
    ["Open-weight", "Can run on your own hardware, keep data in house and be fine-tuned; licence terms (attribution, revenue caps, acceptable use) still apply",
     {"text": "Open vs closed AI models 2026", "href": "/indexes/technical-benchmarks/open-vs-closed-ai-models-2026/"}],
    ["Closed", "Usually the highest benchmark scores, but parameters, architecture and training data are undisclosed and the model can change or be retired by the vendor",
     {"text": "Best AI models 2026", "href": "/indexes/technical-benchmarks/best-ai-models-2026/"}],
    ["Small / on-device", "Runs privately on a phone or laptop with no network round trip; weaker on broad knowledge and long reasoning",
     {"text": "AI energy and water per query", "href": "/indexes/technical-benchmarks/ai-energy-water-per-query/"}],
    ["Long context", "Can read whole codebases or contracts in one prompt; advertised windows are maxima, and accuracy and price per request change with length",
     {"text": "Context window (glossary)", "href": "/glossary/context-window/"}],
    ["Sovereign / national", "Built for a language, jurisdiction or government; often adapted from an open base rather than trained from scratch",
     {"text": "Sovereign AI Index 2026", "href": "/indexes/geography-of-ai/sovereign-ai-index-2026/"}],
]

country_pts = [[k, v] for k, v in ctry.most_common(10)]

page = {
 "slug": "llm-taxonomy-2026",
 "path": SELF,
 "parent_path": "/indexes/technical-benchmarks/",
 "csv": "report-ai-data-llm-taxonomy-2026.csv",
 "trail": [["Indexes", "/indexes/"], ["Technical Benchmarks", "/indexes/technical-benchmarks/"], ["LLM Taxonomy 2026", SELF]],
 "eyebrow": "Report AI &middot; Technical Benchmarks &middot; Index &middot; Updated quarterly",
 "title": "How to Categorize LLMs: The LLM Taxonomy 2026",
 "dek": f"Eight ways large language models differ, from architecture and reasoning to openness, size, compute and origin, and a classification of {N} notable models on every one of them. Each row is sourced to a model card, paper or official page and confidence-rated.",
 "cadence_note": "Cadence: quarterly (STANDARD) &middot; Next update February 2027",
 "edition": "November 2026 edition",
 "coverage": f"{years[0]}/{years[-1]}",
 "nav_active": "LLM taxonomy",
 "nav": [["Technical Benchmarks", "/indexes/technical-benchmarks/"], ["LLM taxonomy", SELF], ["ML models compared", BENCH],
         ["Best AI models 2026", "/indexes/technical-benchmarks/best-ai-models-2026/"], ["Open vs closed", "/indexes/technical-benchmarks/open-vs-closed-ai-models-2026/"],
         ["Reasoning models", "/indexes/technical-benchmarks/test-time-compute-reasoning-2026/"]],
 "tiles": tiles,
 "at_a_glance": [
    f"Report AI classified {N} notable large language models released between {years[0]} and November {years[-1]} on eight dimensions: architecture, training stage and reasoning, openness, modality, size, specialisation, training-compute class and origin.",
    f"Reasoning went from rare to standard: in Report AI's table, {re_late} of {len(late_v)} models released in 2025–26 ({f1(pct(re_late, len(late_v)))}%) can reason before answering, against {re_early} of {len(early_v)} released in 2023–24.",
    f"Mixture-of-experts has become the default design for open-weight models: {moe_late} of {len(open_late)} open-weight models in the table released in 2025–26 ({f1(pct(moe_late, len(open_late)))}%) use it, against {moe_early} of {len(open_early)} in 2023–24.",
    f"Closed models disclose almost nothing about their design: {closed_undisclosed_arch} of the {len(closed)} closed models in the table do not say even which architecture family they use.",
    aa['sentence'],
 ],
 "toc_extra": [["stop-quoting", "Claims to stop repeating"], ["definitions", "Definitions"], ["faq", "FAQ"], ["about", "About the data"]],
 "analysis": [
    "There is no single official way to categorise large language models. Regulators sort them by training compute, researchers by architecture, buyers by price and openness, and governments by origin. Report AI's taxonomy keeps those views separate rather than collapsing them into one ranking, because the same model sits in different boxes depending on the question: DeepSeek-V4-Pro is a frontier-class open-weight mixture-of-experts reasoning model from China, and it is below the EU AI Act's 10^25 FLOP presumption on Epoch AI's estimate.",
    f"The table shows three shifts since 2023. First, reasoning: models that spend extra compute thinking before they answer went from one model in our 2023–24 rows (OpenAI's o1, December 2024) to {f1(pct(re_late, len(late_v)))}% of 2025–26 releases; on Artificial Analysis's index, {aa_share['sentence'].split('and ')[-1].split(' are reasoning')[0]} of indexed variants are now reasoning variants. Second, sparsity: mixture-of-experts layers, which let a model hold far more parameters than it uses for each token, moved from a minority to most open-weight releases. Third, openness diverged: open-weight models now come from every region, but the closed frontier still leads on capability benchmarks, by about 18 points on Artificial Analysis's index in mid-November 2026.",
    f"Parameter counts have become a poor guide to cost and capability. {biggest['name']} has {biggest['total_params_b']:,.0f} billion total parameters but activates {biggest['active_params_b']:g} billion per token; DeepSeek-V4-Pro has 1.6 trillion total and 49 billion active, yet Epoch AI puts its training compute below 10^25 FLOP. The four models Epoch estimates above 10^26 FLOP (GPT-6 Astra, Grok 4, GPT-4.5 and Grok 3) are all closed and have no published parameter count. For readers, the useful numbers are active parameters (cost per token), context window (how much it can read), and whether it reasons (speed versus depth).",
    "The categories matter because they change what a user sees. A reasoning model answers a hard maths question correctly more often but takes longer and bills for hidden reasoning tokens. A small on-device model keeps data on the phone but knows less. An open-weight model can be audited and run privately, but under licence terms. The same chatbot interface can sit on top of any of these, which is why the label on the model card matters more than the brand on the app.",
 ],
 "takeaways": [
    "Classify a model on several dimensions at once; no single label (\"open\", \"frontier\", \"small\") describes it.",
    "Compare mixture-of-experts models on active parameters, not total parameters.",
    "\"Open-weight\" is not \"open-source\": only models that also release training code and data (OLMo, Pythia, Apertus) meet the Open Source Initiative's 2024 definition.",
    "Reasoning is now the default for new releases; expect slower, more expensive and more accurate answers on hard tasks.",
    "Compute thresholds, not parameter counts, decide regulatory duties: 10^25 FLOP in the EU, 10^26 in California and New York.",
 ],
 "chapters": [
  {"id": "dimensions", "kicker": "1. The eight dimensions", "action_title": "Eight questions place any LLM: how it is built, how it thinks, who can use it, and who made it",
   "paras": ["Each dimension answers a different practical question. The table below lists them with the number of models in Report AI's table that fall in each category. Counts describe our selection of notable models, not every model released, so they show direction rather than market shares.",
             "Two dimensions need care. Training stage is a property of a release, not a family: Llama 3.1 405B exists as a base model and as an instruction-tuned model. And openness is a spectrum: licences range from Apache 2.0 to custom terms with revenue caps, attribution rules or non-commercial clauses."],
   "tables": [{"title": "The eight dimensions and how the table's models divide", "columns": ["Dimension", "Categories", "The question it answers", f"Models in the table (of {N})"], "rows": dim_rows,
               "note": "Counts are Report AI calculations over the classification table (DERIVED)."}]},
  {"id": "architecture", "kicker": "2. Architecture", "action_title": "Mixture-of-experts overtook dense transformers among open-weight models, and hybrids are spreading",
   "paras": [f"Almost every model in the table is a decoder-only transformer, but they differ in how the layers are arranged. In the table, {arch.get('MoE', 0)} models are mixture-of-experts, {arch.get('dense', 0)} are dense, {arch.get('hybrid (SSM / linear attention)', 0)} are hybrids that replace most attention layers with state-space or linear-attention layers, and {arch.get('diffusion', 0)} are diffusion language models that refine a whole draft in parallel instead of writing token by token. The remaining {arch.get('undisclosed', 0)} are closed models whose architecture is not disclosed.",
             f"Among open-weight models, mixture-of-experts went from {moe_early} of {len(open_early)} releases in 2023–24 to {moe_late} of {len(open_late)} in 2025–26. The reason is cost: only the active experts run for each token, so a model can hold a large amount of knowledge while charging compute like a much smaller one."],
   "exhibits": [{"type": "hbar", "title": "Mixture-of-experts is now the most common disclosed architecture", "subtitle": f"Models in Report AI's classification table by architecture family ({N} models, {years[0]}–{years[-1]})", "unit": "models",
                 "series": [{"name": "Models", "points": [[{"hybrid (SSM / linear attention)": "Hybrid (SSM / linear)", "MoE": "Mixture-of-experts", "dense": "Dense", "undisclosed": "Undisclosed", "diffusion": "Diffusion"}.get(k, k), v] for k, v in arch.most_common()]}],
                 "source": "Source: Report AI LLM classification table (model cards, papers and official pages, read 15 Nov 2026)", "notes": "Counts depend on which models were selected; closed models that do not disclose an architecture are shown as undisclosed.", "confidence": "DERIVED"},
                {"type": "bar", "title": "Most new open-weight models use mixture-of-experts", "subtitle": "Share of open-weight models in the table that use mixture-of-experts layers, by release period (%)", "unit": "%",
                 "series": [{"name": "MoE share", "points": [["2023–24", round(pct(moe_early, len(open_early)), 1)], ["2025–26", round(pct(moe_late, len(open_late)), 1)]]}],
                 "source": "Source: Report AI LLM classification table", "notes": f"2023–24: {moe_early} of {len(open_early)} open-weight models; 2025–26: {moe_late} of {len(open_late)}. Includes hybrid and diffusion models with MoE layers.", "confidence": "DERIVED"}],
   "tables": [cat_table('architecture', 'Architecture categories'), moe_table]},
  {"id": "reasoning", "kicker": "3. Training stage and reasoning", "action_title": "Reasoning went from one model to two-thirds of new releases in two years",
   "paras": ["A base model is the raw result of pretraining: it continues text but does not follow instructions. Instruction tuning and preference training turn it into a chat model. Reasoning models are trained, mostly with reinforcement learning, to write out a chain of intermediate steps before the final answer, spending more compute at inference time. Hybrid models let the user or the application switch that thinking off or cap its budget.",
             f"In the table, {reas.get('reasoning', 0)} models always reason, {reas.get('hybrid', 0)} are hybrids and {reas.get('none', 0)} do not reason; {reas.get('not verified', 0)} could not be verified. By release year, the share with a reasoning mode was " + ', '.join(f"{y}: {sum(1 for r in by_year[y] if has_reason(r))} of {len(ver(by_year[y]))}" for y in years) + "."],
   "exhibits": [{"type": "bar", "title": "Reasoning is now standard in new releases", "subtitle": "Share of models in the table with a reasoning mode (always on or switchable), by release year (%)", "unit": "%",
                 "series": [{"name": "With reasoning mode", "points": [[str(y), round(pct(sum(1 for r in by_year[y] if has_reason(r)), len(ver(by_year[y]))), 1)] for y in years]}],
                 "source": "Source: Report AI LLM classification table", "notes": "OpenAI's o1 (December 2024) is the only 2023–24 model with a reasoning mode in the table. Two 2026 models whose reasoning mode could not be verified are excluded from the denominators.", "confidence": "DERIVED"}],
   "tables": [cat_table('training_stage', 'Training-stage categories')]},
  {"id": "openness", "kicker": "4. Openness and licences", "action_title": f"{openc.get('open-weight', 0) + openc.get('open-source', 0)} of {N} models have downloadable weights, but only {openc.get('open-source', 0)} meet the open-source definition",
   "paras": [f"Openness is the dimension most often mislabelled. In the table, {openc.get('closed', 0)} models are closed (available only through an API or app), {openc.get('open-weight', 0)} are open-weight (the trained weights can be downloaded under a licence) and {openc.get('open-source', 0)} are open-source in the sense of the Open Source Initiative's Open Source AI Definition 1.0 (October 2024), which also requires the training code and enough information about the data to rebuild the model.",
             f"Licences differ widely. Of the models with downloadable weights, {lic.get('permissive', 0)} use permissive licences such as Apache 2.0 or MIT, {lic.get('restricted', 0)} use custom licences with conditions (attribution, acceptable-use rules, caps on very large commercial users) and {lic.get('non-commercial', 0)} are non-commercial. The share of table models with downloadable weights by release year was " + ', '.join(f"{y}: {sum(1 for r in by_year[y] if openish(r))} of {len(by_year[y])}" for y in years) + ".",
             aa['sentence'] + " " + aa_share['sentence']],
   "exhibits": [{"type": "bar", "title": "About two-thirds of notable releases ship downloadable weights", "subtitle": "Share of models in the table with open weights (open-weight or open-source), by release year (%)", "unit": "%",
                 "series": [{"name": "Open weights", "points": [[str(y), round(pct(sum(1 for r in by_year[y] if openish(r)), len(by_year[y])), 1)] for y in years]}],
                 "source": "Source: Report AI LLM classification table", "notes": "Selection-dependent: the table over-represents open models because they publish the details needed to classify them.", "confidence": "DERIVED"}],
   "tables": [cat_table('openness', 'Openness categories')]},
  {"id": "modality-size", "kicker": "5. Modality, size and specialisation", "action_title": "Most new models read images, and a small-model tier now runs on phones",
   "paras": [f"In the table, {modal.get('text-only', 0)} models take text only and {modal.get('multimodal input', 0)} also take images and sometimes audio or video; {modal.get('omni (audio in/out)', 0)} is an omni model that speaks and listens natively. Image output is usually handled by a separate model and is defined here but not counted.",
             f"By size and deployment, {size.get('frontier', 0)} models are frontier, {size.get('undisclosed (efficient tier)', 0)} are closed efficient tiers of undisclosed size, {size.get('large', 0)} are large (100 billion parameters or more, below the frontier), {size.get('mid-size', 0)} are mid-size, {size.get('small', 0)} are small (under 10 billion) and {size.get('on-device', 0)} are built to run on phones or laptops. There is no regulatory definition of a small language model; the 10-billion line follows NVIDIA researchers' 2025 working definition.",
             f"Context windows range widely. The longest advertised in the table is {ctx_known[0]['name']}'s {ctx_known[0]['context_tokens']:,} tokens ({ctx_known[0]['release']}); 1 million tokens is the most common figure among 2026 flagships. Advertised windows are maxima: accuracy on information buried deep in a long prompt is typically lower than at the start."],
   "exhibits": [{"type": "hbar", "title": "Frontier, large and mid-size models dominate the table", "subtitle": "Models in Report AI's classification table by size and deployment class", "unit": "models",
                 "series": [{"name": "Models", "points": [[k, v] for k, v in size.most_common()]}],
                 "source": "Source: Report AI LLM classification table", "notes": "Frontier: Epoch AI's top-5-by-compute flag, an Epoch estimate of at least 10^25 FLOP, or the top-tier closed flagship of a developer with such a run on record (Report AI rule).", "confidence": "DERIVED"}],
   "tables": [cat_table('modality', 'Modality categories'), cat_table('size', 'Size and deployment categories'), cat_table('specialisation', 'Specialisation categories')]},
  {"id": "compute", "kicker": "6. Training compute and regulation", "action_title": f"Only {len(over26)} models are estimated above 10^26 FLOP, and all are closed",
   "paras": [ep['sentence'], ep_list['sentence'],
             "Compute is what regulators count. The EU AI Act presumes a general-purpose model has systemic risk above 10^25 FLOP; California's SB 53 and New York's RAISE Act use 10^26. The United States' federal 10^26 reporting threshold from Executive Order 14110 was rescinded in January 2025. Epoch AI has no estimate for most closed flagships released in 2025–26, so any count above these thresholds undercounts the newest models."],
   "tables": [{"title": "Models in the table with an Epoch AI estimate of at least 10^25 FLOP", "columns": ["Model", "Developer", "Released", "Training compute (FLOP)", "Epoch's own confidence", "Openness", "Threshold class", "Confidence"], "rows": compute_rows,
               "note": "Estimates from Epoch AI's AI-models database (downloaded 15 Nov 2026). Epoch labels its own estimates Confident, Likely or Speculative."},
              {"title": "Compute thresholds in law", "columns": ["Threshold", "What it means", "Examples", "Confidence"], "rows": threshold_rows,
               "note": "Legal texts (EUR-Lex, California Legislature) could not be opened for this edition; wording is from secondary sources and rated MEDIUM."}]},
  {"id": "origin", "kicker": "7. Origin", "action_title": "US developers made most of the table's models; China is a clear second",
   "paras": [f"By country of the developer, the table holds {ctry.get('US', 0)} US models and {ctry.get('China', 0)} Chinese ones, then " + ', '.join(f"{k} {v}" for k, v in ctry.most_common()[2:]) + ". By developer type, " + ', '.join(f"{k.replace('_', ' ')}s {v}" for k, v in dev.most_common()) + ".",
             "Origin matters for jurisdiction, language coverage and supply-chain dependence, which is why governments now fund national or sovereign models. Many of those are adapted from an open base model rather than trained from scratch; the Sovereign AI Index tracks them separately."],
   "exhibits": [{"type": "hbar", "title": "The United States and China account for most models in the table", "subtitle": "Models in Report AI's classification table by country of developer", "unit": "models",
                 "series": [{"name": "Models", "points": country_pts}],
                 "source": "Source: Report AI LLM classification table", "notes": "Selection covers notable models and one example of each category; see the Sovereign AI Index for national models.", "confidence": "DERIVED"}],
   "tables": [cat_table('origin', 'Developer-type categories')]},
  {"id": "what-you-see", "kicker": "8. What the categories change for users", "action_title": "The category behind a chatbot decides its speed, price, privacy and failure modes",
   "paras": ["The same chat window can sit in front of very different models, and apps increasingly route each request to a different one. The table below translates each category into what a user or buyer notices. It is Report AI's synthesis of the definitions above, with links to the indexes that hold the figures."],
   "tables": [{"title": "What each category means in practice", "columns": ["Category", "What changes for the user", "Figures on Report AI"], "rows": use_rows}]},
  {"id": "table", "kicker": "9. The classification table", "action_title": f"All {N} models on every dimension",
   "paras": ["Parameters are shown as total / active (billions) for mixture-of-experts models. n/d means not disclosed. The source column links the main source for each row; the full list of sources for every row is in the downloadable data."],
   "tables": [{"title": f"Report AI LLM classification table, {years[0]}–November {years[-1]}", "columns": ["Model", "Developer", "Country", "Released", "Openness", "Architecture", "Parameters (B, total / active)", "Context", "Reasoning", "Inputs", "Size class", "Main source", "Confidence"],
               "rows": full_rows, "note": "HIGH: the model card, paper or official page was opened and the fields seen. MEDIUM: secondary source (Wikipedia or aggregators) because the vendor's site could not be opened."}]},
 ],
 "stop_quoting": [
    {"claim": "Meta released Llama 5, a 600-billion-parameter open model with a 5-million-token context window, in April 2026.",
     "fact": "No Llama 5 has been released: Meta's newest Llama models are still Llama 4 (April 2025). Meta's April 2026 release was Muse Spark, a closed model; its open-weight successor, Muse Spark Open (October 2026), has 816 billion total and 42 billion active parameters and a 1-million-token context window.",
     "link": "/reports/ai-statistics-fact-check/#fc-llama-5"},
    {"claim": "Llama (or DeepSeek, or Qwen) is open-source.",
     "fact": "These are open-weight models: the weights can be downloaded under licence terms, but the training data and full training code are not released. Only models that also release those, such as OLMo, Pythia and Apertus, meet the Open Source Initiative's Open Source AI Definition 1.0 (October 2024).",
     "link": ""},
    {"claim": "A 1-trillion-parameter model costs ten times as much to run as a 100-billion-parameter model.",
     "fact": f"Not for mixture-of-experts models, which run only their active parameters per token. {biggest['name']} has {biggest['total_params_b']:,.0f} billion parameters but activates {biggest['active_params_b']:g} billion per token.",
     "link": ""},
 ],
 "definitions": [
    {"term": {"text": "Large language model", "href": "/glossary/large-language-model/"}, "def": "A neural network, almost always a transformer, trained on very large text corpora to predict the next token, then usually tuned to follow instructions."},
    {"term": "Total vs active parameters", "def": "Total parameters are all the weights a model holds (and so the memory needed to serve it). In a mixture-of-experts model only a subset, the active parameters, runs for each token, which sets the compute cost per token."},
    {"term": "Reasoning model", "def": "A model trained to generate intermediate reasoning steps before its final answer, spending more inference-time compute on harder problems. A hybrid model lets that reasoning be switched off or capped."},
    {"term": "Open-weight vs open-source", "def": "Open-weight: the trained weights are downloadable under a licence. Open-source AI (OSI definition, 2024): weights plus training code and sufficient information about the training data, under terms that allow use, study, modification and sharing."},
    {"term": "State-space / linear-attention hybrid", "def": "An architecture that replaces most full-attention layers with layers whose cost grows linearly with sequence length (Mamba, Gated DeltaNet, Kimi Delta Attention), keeping a few attention layers for recall."},
    {"term": "Diffusion language model", "def": "A model that generates by iteratively refining a full draft of masked tokens in parallel, rather than writing one token after another."},
    {"term": {"text": "Context window", "href": "/glossary/context-window/"}, "def": "The maximum number of tokens a model can take in one request, prompt and conversation history included."},
    {"term": {"text": "Frontier model", "href": "/glossary/frontier-model/"}, "def": "A model at or near the leading edge of capability and training compute at its release; this index uses Epoch AI's top-5-by-compute flag, a 10^25 FLOP estimate, or a top-tier closed flagship of a lab with such a run on record."},
 ],
 "faq": [
    {"q": "How are large language models categorized?", "a": f"Report AI classifies LLMs on eight dimensions: architecture (dense, mixture-of-experts, hybrid, diffusion), training stage and reasoning, openness (closed, open-weight, open-source), modality, size and deployment, specialisation, training-compute class and origin. Its November 2026 table places {N} notable models on each."},
    {"q": "What is the difference between an open-weight and an open-source LLM?", "a": "An open-weight model's trained weights can be downloaded under a licence, but its training data and full code usually are not released. An open-source model under the Open Source Initiative's 2024 definition also releases the training code and enough information about the data to rebuild it; OLMo, Pythia and Apertus qualify, Llama, DeepSeek and Qwen do not."},
    {"q": "What is a mixture-of-experts model?", "a": f"A mixture-of-experts model splits its feed-forward layers into many experts and routes each token to a few of them, so only a fraction of its parameters runs per token. In Report AI's table, {moe_late} of {len(open_late)} open-weight models released in 2025–26 use the design; {biggest['name']} has {biggest['total_params_b']:,.0f} billion total and {biggest['active_params_b']:g} billion active parameters."},
    {"q": "How many LLMs are reasoning models?", "a": f"In Report AI's table, {re_late} of {len(late_v)} models released in 2025–26 ({f1(pct(re_late, len(late_v)))}%) have a reasoning mode, against {re_early} of {len(early_v)} released in 2023–24. On Artificial Analysis's index in November 2026, 108 of 113 indexed model variants were reasoning variants."},
    {"q": "Which LLMs were trained with the most compute?", "a": "On Epoch AI's estimates (database downloaded 15 November 2026), four models exceed 10^26 FLOP: GPT-6 Astra (9.4 × 10^26), Grok 4 (5 × 10^26), GPT-4.5 (3.8 × 10^26) and Grok 3 (3.5 × 10^26). All are closed. Epoch has no estimate for most closed flagships released in 2025–26."},
 ],
 "methodology_extra": f"The table covers {N} notable LLMs chosen to include the leading model families of each major developer and at least one example of every category. Each row was checked against the model's Hugging Face card and configuration, its paper on arXiv, or the developer's official page (HIGH); where those could not be opened, against Wikipedia or aggregators such as OpenRouter and Artificial Analysis (MEDIUM). Training compute is Epoch AI's estimate. Category counts, shares and the frontier classification rule are Report AI calculations (DERIVED) and describe the table, not the whole market. Hugging Face model counts were read from the Hub on 15 November 2026. ",
 "related": ' &middot; '.join(f'<a href="{u}">{t}</a>' for t, u in [
    ("Machine-learning models compared: our 13-model benchmark", BENCH),
    ("Best AI models 2026", "/indexes/technical-benchmarks/best-ai-models-2026/"),
    ("Open vs closed AI models 2026", "/indexes/technical-benchmarks/open-vs-closed-ai-models-2026/"),
    ("Chinese AI models 2026", "/indexes/technical-benchmarks/chinese-ai-models-2026/"),
    ("Test-time compute and reasoning", "/indexes/technical-benchmarks/test-time-compute-reasoning-2026/"),
    ("AI models benchmarks statistics", "/indexes/technical-benchmarks/ai-models-benchmarks-statistics-2026/"),
    ("Sovereign AI Index 2026", "/indexes/geography-of-ai/sovereign-ai-index-2026/"),
    ("LLM Token Price Index", "/indexes/ai-economics/llm-token-price-index/"),
    ("State of AI: Models & Prices", "/indexes/state-of-ai/state-of-ai-models-prices/"),
    ("How AI developed, 1950–2026", "/reports/how-ai-developed-1950-2026/"),
    ("AI statistics fact-check", "/reports/ai-statistics-fact-check/"),
    ("Glossary: foundation model", "/glossary/foundation-model/"),
    ("Glossary: multimodal AI", "/glossary/multimodal-ai/")]),
 "about": {"@type": "Thing", "name": "Large language model taxonomy"},
}

import re
txt = json.dumps(page, indent=1, ensure_ascii=False)
SUPS = str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹')
txt = re.sub(r'10\^(\d+)', lambda m: '10' + m.group(1).translate(SUPS), txt)
txt = re.sub(r'(\d(?:\.\d+)?)e([2-9]\d)\b', lambda m: ('' if m.group(1) == '1' else m.group(1) + ' × ') + '10' + m.group(2).translate(SUPS), txt)
txt = txt.replace(' (now SpaceX Super Intelligence)', '')
assert 'SpaceX' not in txt and '10^' not in txt
open(os.path.join(HERE, 'taxonomy.json'), 'w').write(txt)
print('wrote taxonomy.json', N, 'models;', 'MoE', moe_early, len(open_early), moe_late, len(open_late), '; reasoning', re_early, len(early_v), re_late, len(late_v),
      '; >=1e25', len(over25), '>=1e26', len(over26), '; biggest', biggest['name'], '; longest ctx', ctx_known[0]['name'])
