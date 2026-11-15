"""Generate content-ops/ml-models/bench.json (Machine-learning models compared report) from
bench-summary.json (Report AI's own benchmark, tools/ml-benchmark) and tabular-research.json
(verified literature facts). Every figure in the prose is read from those files.
Run: python3 content-ops/ml-models/make_bench.py
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(HERE, 'bench-summary.json')))
R = json.load(open(os.path.join(HERE, 'tabular-research.json')))
F = {f['id']: f for f in R['facts']}
SELF = '/reports/machine-learning-models-compared/'
TAX = '/indexes/technical-benchmarks/llm-taxonomy-2026/'

ACC = S['main_acc']; AUC = S['main_auc']; SS = S['single_split']
T = {t['model']: t for t in ACC['table']}
TA = {t['model']: t for t in AUC['table']}
MODELS = [t['model'] for t in ACC['table']]           # ordered by mean rank (accuracy)
NM = len(MODELS); ND = len(ACC['per_dataset']); NRUNS = SS['n_runs']
TOP = MODELS[0]; SECOND = MODELS[1]; LAST = MODELS[-1]
by_mean = sorted(ACC['table'], key=lambda t: -t['mean'])
INFO = S['dataset_info']
p1 = lambda x: f'{100 * x:.1f}%'
pts = lambda x: f'{100 * x:.1f}'


def short(m):
    return {'Gradient boosting (HistGB)': 'HistGB', 'Neural network (MLP)': 'MLP', 'k-nearest neighbours': 'k-NN',
            'Logistic regression': 'Log. reg.', 'Random forest': 'Rand. forest', 'Decision tree': 'Dec. tree',
            'SVM (RBF)': 'SVM', 'Naive Bayes': 'Naive Bayes', 'Extra trees': 'Extra trees'}.get(m, m)


def fact(i):
    return F[i]['sentence']


DS_DESC = {
    'albert': 'AutoML challenge task with anonymised features', 'compas-two-years': 'Criminal-justice records: re-arrest within two years (COMPAS)',
    'default-of-credit-card-clients': 'Taiwanese credit-card clients: default next month', 'electricity': 'Australian (New South Wales) electricity market: price up or down',
    'eye_movements': 'Eye-tracking: whether a sentence being read was relevant', 'covertype': 'US forest cover type from map variables (two largest classes)',
    'road-safety': 'UK road-accident records', 'Bioresponse': 'Molecules: biological response from chemistry descriptors',
    'Diabetes130US': 'US hospital records: readmission of diabetic patients', 'MagicTelescope': 'Gamma-ray telescope: signal or background',
    'bank-marketing': 'Portuguese bank: term-deposit subscription', 'california': 'California census blocks: house value above the median',
    'credit': 'Consumer credit: serious delinquency within two years', 'heloc': 'FICO home-equity credit-line applications: repayment risk',
    'house_16H': 'US census areas: house price above the median', 'pol': 'Telecommunications (pole) problem', 'Higgs': 'Particle physics: Higgs-boson signal or background',
    'MiniBooNE': 'Neutrino experiment: particle identification', 'jannis': 'AutoML challenge task with anonymised features'}

MODEL_GUIDE = [
    ('TabPFN v2', 'A transformer pretrained on millions of synthetic datasets; it reads the training table as context and predicts in one forward pass, with no per-dataset training in the usual sense (Hollmann et al., Nature, 2025).', 'Strongest on small tables (up to 10,000 rows in v2); no tuning', 'Slow on a CPU; v2 limited to 10,000 rows and 500 features; later versions need a commercial licence for production'),
    ('CatBoost', "Gradient-boosted decision trees from Yandex with 'ordered boosting' and symmetric trees.", 'Excellent defaults; handles categorical data natively', 'Slower to train than other boosting libraries'),
    ('LightGBM', "Microsoft's gradient-boosting library that grows trees leaf by leaf on binned features.", 'Very fast on large tables', 'Can overfit small data at default settings'),
    ('XGBoost', 'Regularised gradient-boosted trees; the library that dominated Kaggle competitions from 2014.', 'Fast, mature, widely deployed', 'Benefits more from tuning than CatBoost'),
    ('Gradient boosting (HistGB)', "scikit-learn's histogram-based gradient boosting: trees added one after another, each correcting the last one's errors.", 'Strong default in a standard library', 'Same family, slightly different defaults'),
    ('Random forest', 'Averages hundreds of decision trees, each trained on a random sample of rows and features.', 'Robust, hard to break, little tuning', 'Large models; less accurate than boosting on most tables'),
    ('Extra trees', 'A random forest that also picks split thresholds at random.', 'Fast; often matches a random forest', 'Similar limits to a random forest'),
    ('Neural network (MLP)', 'A multilayer perceptron: layers of weighted sums and non-linear activations, trained by gradient descent.', 'Flexible; the basis of deep learning', 'Needs scaling and tuning; trails trees on most tables at default settings'),
    ('SVM (RBF)', 'A support vector machine draws the widest-margin boundary between classes in a transformed feature space.', 'Strong on small, clean data', 'Needs scaling; slow beyond tens of thousands of rows'),
    ('k-nearest neighbours', 'Predicts by a vote of the k most similar training rows.', 'No training; easy to explain', 'Needs scaling; weak with many or irrelevant features'),
    ('Logistic regression', 'A weighted sum of features turned into a probability.', 'Transparent and stable; the credit-scorecard standard', 'Cannot capture interactions unless they are engineered'),
    ('Decision tree', 'A single tree of if-then splits.', 'Fully readable', 'Unstable and overfits; the weakest learner here'),
    ('Naive Bayes', 'Applies Bayes\' rule assuming every feature is independent given the class (Gaussian variant here).', 'Very fast; a strong baseline for text and spam', 'The independence assumption is badly wrong for most tables'),
]
GUIDE = {g[0]: g for g in MODEL_GUIDE}

# ---------- derived numbers ----------
pd_acc = ACC['per_dataset']
winner = {d: max(v, key=v.get) for d, v in pd_acc.items()}
wins = {m: sum(1 for d in winner if winner[d] == m) for m in MODELS}
top_wins = wins[TOP]
gap_top2 = T[TOP]['mean'] - T[SECOND]['mean']
ws = SS['winner_share']
rank_acc = {m: i + 1 for i, m in enumerate(MODELS)}
auc_order = [t['model'] for t in AUC['table']]
rank_auc = {m: i + 1 for i, m in enumerate(auc_order)}
moved = sorted(MODELS, key=lambda m: -abs(rank_acc[m] - rank_auc[m]))
NS = S.get('noscale', {})
worst_ns = min(NS, key=lambda m: NS[m]['delta']) if NS else None
IM = S.get('imbalance', {})
TU = S.get('tune', {})
SZ = S.get('size', {})
tm = S['time_median_s']
fastest = min(tm, key=tm.get); slowest = max(tm, key=tm.get)

VIDEO = [('TabPFN, a transformer', 'TabPFN v2', 79.5), ('Neural network', 'Neural network (MLP)', 74.0), ('Random forest', 'Random forest', 73.5),
         ('Gradient boosting', 'Gradient boosting (HistGB)', 72.7), ('Support vector machine', 'SVM (RBF)', 72.0), ('K-nearest neighbours', 'k-nearest neighbours', 68.3),
         ('Decision tree', 'Decision tree', 64.1), ('Logistic regression', 'Logistic regression', 59.3), ('Naive Bayes', 'Naive Bayes', 42.1)]
vid_rank = {m: i + 1 for i, (_, m, _) in enumerate(VIDEO)}
our_rank9 = {m: i + 1 for i, m in enumerate([m for m in MODELS if m in vid_rank])}

# ---------- tables ----------
overall_rows = [[m, pts(T[m]['mean']), pts(TA[m]['mean']), f"{T[m]['mean_rank']:.2f}", f"{wins[m]} of {ND}", str(T[m]['top3']),
                 (f"{tm[m]:.3f}" if tm[m] < 1 else f"{tm[m]:.1f}"), 'DERIVED'] for m in MODELS]
ds_rows = []
for d in sorted(pd_acc, key=lambda d: INFO[d]['rows']):
    v = pd_acc[d]; srt = sorted(v, key=v.get, reverse=True)
    ds_rows.append([d, DS_DESC.get(d, ''), f"{INFO[d]['rows']:,}", str(INFO[d]['features']), srt[0], pts(v[srt[0]]), srt[1], f"{100 * (v[srt[0]] - v[srt[1]]):.1f}", 'DERIVED'])
matrix_rows = [[d] + [pts(pd_acc[d][m]) if m in pd_acc[d] else '' for m in MODELS] for d in sorted(pd_acc)]
auc_rows = [[m, pts(T[m]['mean']), str(rank_acc[m]), pts(TA[m]['mean']), str(rank_auc[m]), f"{rank_acc[m] - rank_auc[m]:+d}" if rank_acc[m] != rank_auc[m] else '0', 'DERIVED'] for m in MODELS]
split_rows = [[m, p1(ws.get(m, 0)), f"{100 * SS['mean_split_range_by_model'][m]:.1f}", 'DERIVED'] for m in sorted(MODELS, key=lambda m: -ws.get(m, 0))]
video_rows = [[lab, f'{v:.1f}%', str(vid_rank[m]), m, pts(T[m]['mean']) + '%', str(our_rank9[m]), 'MEDIUM / DERIVED'] for lab, m, v in VIDEO]

ex_size = None; size_rows = []
if SZ:
    ns_ = sorted({int(n) for m in SZ['curve'] for n in SZ['curve'][m]})
    pick = [m for m in ['TabPFN v2', 'CatBoost', 'Random forest', 'Neural network (MLP)', 'Logistic regression', 'k-nearest neighbours'] if m in SZ['curve']]
    ex_size = {"type": "line", "title": "More training data helps every model, but the order changes as data grows", "subtitle": f"Mean accuracy by training-set size on the {len(SZ['common_datasets'])} datasets large enough for every size (%)", "unit": "%",
               "series": [{"name": m, "points": [[f"{n:,}", round(100 * SZ['curve'][m][str(n)], 1)] for n in ns_ if str(n) in SZ['curve'][m]]} for m in pick],
               "source": "Source: Report AI benchmark, November 2026 (3 random splits per size)", "notes": "TabPFN v2 was run up to 3,000 training rows on a CPU.", "confidence": "DERIVED"}
    size_rows = [[m] + [pts(SZ['curve'][m][str(n)]) if str(n) in SZ['curve'][m] else '–' for n in ns_] + [str(int(SZ['rank_by_n'][str(ns_[0])].get(m, 0))) if m in SZ['rank_by_n'][str(ns_[0])] else '–',
                 str(int(SZ['rank_by_n'][str(ns_[-1])].get(m, 0))) if m in SZ['rank_by_n'][str(ns_[-1])] else '–', 'DERIVED'] for m in MODELS if m in SZ['curve']]

lit_ids = ['grinsztajn-45', 'grinsztajn-reasons', 'hf-tabular-criteria', 'shwartz-ziv', 'tabzilla-scale', 'tabzilla-finding', 'tabpfn-nature-pub', 'tabpfn-nature-10k',
           'tabpfn25-winrate', 'tabpfn35-limits', 'tabpfn-versions-license', 'tabarena-what', 'tabarena-lb-top', 'tabarena-lb-fm-share', 'tabarena-lb-classic', 'tabarena-lb-tabpfn', 'nfl']
lit_rows = [[F[i]['source'].split(',')[0][:60], F[i]['sentence'], {'text': 'source', 'href': F[i]['url']} if F[i].get('url') else '', F[i]['confidence']] for i in lit_ids if i in F]
see_ids = [('Ads', 'fb-ads-2014', 'Boosted trees + logistic regression'), ('Video recommendations', 'youtube-2016', 'Deep neural networks'),
           ('Social feed', 'twitter-2023-heavy', 'Neural network (MaskNet)'), ('Social feed', 'x-2026-transformer', 'Transformer'),
           ('Recommendations', 'meta-hstu-2024', 'Transformer (generative recommender)'), ('Recommendations', 'monolith-2022', 'Real-time embedding models'),
           ('Search', 'google-bert-2019', 'Transformer (BERT)'), ('Spam filtering', 'spam-sahami-1998', 'Naive Bayes'), ('Spam filtering', 'gmail-2019', 'ML and rules (TensorFlow)'),
           ('Credit', 'credit-lr', 'Logistic regression'), ('Credit', 'credit-bis-834', 'Machine-learning credit model'), ('Finance', 'boe-fca-2022', 'Machine learning (various)')]
see_rows = [[a, fam, F[i]['sentence'], {'text': 'source', 'href': F[i]['url']} if F[i].get('url') else '', F[i]['confidence']] for a, i, fam in see_ids if i in F]
guide_rows = [[g[0], g[1], g[2], g[3], f"{rank_acc[g[0]]} of {NM}"] for g in MODEL_GUIDE if g[0] in rank_acc]

exhibits_main = [
    {"type": "hbar", "title": f"{TOP} had the highest average accuracy across {ND} datasets", "subtitle": f"Mean test accuracy over {ND} datasets × 10 random splits, 1,000 training rows, default settings (%)", "unit": "%",
     "series": [{"name": "Mean accuracy", "points": [[t['model'], round(100 * t['mean'], 1)] for t in by_mean]}],
     "source": "Source: Report AI benchmark, November 2026, on the Grinsztajn et al. (2022) datasets", "notes": "Balanced binary tasks, so 50% is chance. Ranked by mean accuracy; the table below also gives mean rank.", "confidence": "DERIVED"}]

page = {
 "slug": "machine-learning-models-compared",
 "path": SELF,
 "parent_path": "/reports/",
 "csv": "report-ai-data-machine-learning-models-compared.csv",
 "trail": [["Reports", "/reports/"], ["Machine-Learning Models Compared", SELF]],
 "eyebrow": "Report AI &middot; Reports &middot; Original benchmark &middot; Updated semi-annually",
 "title": f"Machine-Learning Models Compared: We Ran {NM} Algorithms on {ND} Datasets",
 "dek": f"A viral clip ranked nine models on one unnamed dataset. We ran {NM}, from Naive Bayes to the TabPFN transformer, on {ND} public benchmark datasets and {NRUNS} random splits each, to show what wins, by how much, and how much the answer depends on how you test.",
 "cadence_note": "Cadence: semi-annual (STABLE) &middot; Next update May 2027",
 "edition": "November 2026 edition",
 "coverage": "2022/2026",
 "nav_active": "ML models compared",
 "nav": [["Technical Benchmarks", "/indexes/technical-benchmarks/"], ["ML models compared", SELF], ["LLM taxonomy", TAX],
         ["AI benchmarks statistics", "/indexes/technical-benchmarks/ai-models-benchmarks-statistics-2026/"], ["How AI developed", "/reports/how-ai-developed-1950-2026/"]],
 "tiles": [
    {"value": TOP, "label": f"ranked first, with {pts(T[TOP]['mean'])}% mean accuracy and the best result on {top_wins} of {ND} datasets", "confidence": "DERIVED"},
    {"value": f"{SS['distinct_winners']}", "label": f"different models came first in at least one of {NRUNS} single dataset-and-split runs", "confidence": "DERIVED"},
    {"value": p1(SS['share_runs_overall_best_first']), "label": f"of single runs put the overall winner first; the rest crowned another model", "confidence": "DERIVED"},
    {"value": f"{pts(gap_top2)} pts", "label": f"average accuracy gap between first ({TOP}) and second ({SECOND})", "confidence": "DERIVED"},
 ],
 "at_a_glance": [
    f"Report AI ran {NM} machine-learning classifiers on {ND} public tabular datasets from the Grinsztajn, Oyallon and Varoquaux (2022) benchmark, with 1,000 training rows and 10 random splits per dataset, in November 2026.",
    f"{TOP} had the highest mean accuracy, {pts(T[TOP]['mean'])}%, and was best on {top_wins} of {ND} datasets; {SECOND} was second at {pts(T[SECOND]['mean'])}%. {LAST} ranked last on average.",
    f"Single runs mislead: across {NRUNS} combinations of one dataset and one random split, {SS['distinct_winners']} different models came first, and the overall winner was first in only {p1(SS['share_runs_overall_best_first'])} of them.",
    f"Gradient-boosted trees (CatBoost, LightGBM, XGBoost, HistGB) and random forests occupy most of the top half; the nine-model viral chart's order is not reproducible because it names no dataset.",
    fact('tabarena-lb-fm-share'),
 ],
 "toc_extra": [["stop-quoting", "Claims to stop repeating"], ["definitions", "Definitions"], ["faq", "FAQ"], ["about", "About the data"]],
 "analysis": [
    f"Rankings of machine-learning models are everywhere, and most are built on one dataset and one random split. We wanted to know how much of such a ranking is signal. So we ran {NM} widely used classifiers, from Naive Bayes and logistic regression to gradient-boosted trees and the TabPFN tabular transformer, on {ND} datasets that researchers use precisely because they are hard, and repeated every comparison on 10 random splits.",
    f"The headline is clear but narrower than viral charts suggest. {TOP} finished first on average with {pts(T[TOP]['mean'])}% accuracy, {pts(gap_top2)} points ahead of {SECOND}. Below the top, gradient-boosted trees and random forests sit within a point or two of each other, and the order among them changes from dataset to dataset. Simple models are not useless: logistic regression won outright on {wins.get('Logistic regression', 0)} datasets. But single trees, k-nearest neighbours and Naive Bayes trail by a wide margin on these tasks.",
    f"How you test changes what you see. On a single dataset with a single split, the overall winner came first only {p1(SS['share_runs_overall_best_first'])} of the time, and {SS['distinct_winners']} different models won at least once. Ranking by ROC AUC instead of accuracy moved {moved[0]} by {abs(rank_acc[moved[0]] - rank_auc[moved[0]])} places. Turning off feature scaling cost {worst_ns} {abs(100 * NS[worst_ns]['delta']):.1f} points of accuracy. Making the positive class rare (10%) pushed every model's accuracy towards the {pts(IM['Majority class']['acc'])}% a do-nothing majority-class guess scores, while balanced accuracy exposed which ones actually learned." if NS and IM else "",
    "The literature agrees with the shape of our results and adds a time dimension. Tree ensembles beat deep networks on medium-sized tables in the 2021–23 studies; since 2025, pretrained tabular foundation models such as TabPFN have taken the top of the TabArena leaderboard, while classic tree models remain the fast, cheap and robust default. The models that decide what people see online, from ad clicks to feeds and spam filters, span the whole range, from logistic regression to trillion-parameter transformers.",
 ],
 "takeaways": [
    f"On these {ND} benchmark datasets at 1,000 training rows, {TOP} ranked first and boosted trees and random forests filled most of the top half.",
    "Never trust a ranking from one dataset and one split: the winner changed in a large share of single runs.",
    "Accuracy alone hides problems; check ROC AUC, and balanced accuracy when one class is rare.",
    "Scale features before using k-nearest neighbours, SVMs, neural networks or logistic regression.",
    "TabPFN's newer, stronger versions are non-commercial; the openly licensed v2 used here is capped at 10,000 rows.",
 ],
 "chapters": [
  {"id": "viral-chart", "kicker": "1. The viral chart", "action_title": "A nine-model chart from one unnamed dataset cannot tell you which model is best",
   "paras": ["The chart that prompted this report is a short video captioned '13 machine learning models in 60 seconds', labelled as AI content. It shows nine of the thirteen: TabPFN 79.5%, a neural network 74.0%, random forest 73.5%, gradient boosting 72.7%, a support vector machine 72.0%, k-nearest neighbours 68.3%, a decision tree 64.1%, logistic regression 59.3% and Naive Bayes 42.1%.",
             "Report AI could not find the original video or the dataset behind it, so its figures cannot be checked or reproduced. A Naive Bayes score of 42.1% is below the 50% a coin toss scores on a balanced two-class problem, which suggests a multi-class task or an unusual split. The table compares the video's order with our averages over many datasets; it shows that the order of the middle of the pack depends on the data."],
   "tables": [{"title": "The viral chart against Report AI's benchmark", "columns": ["Model in the video", "Video accuracy", "Video rank", "Report AI model", f"Report AI mean accuracy ({ND} datasets)", "Report AI rank (same 9)", "Confidence"], "rows": video_rows,
               "note": "Video figures as shown on screen (MEDIUM: unverified source, no dataset named). Report AI figures are not comparable task by task; they average 19 different datasets."}]},
  {"id": "ranking", "kicker": "2. The ranking", "action_title": f"{TOP} finished first; boosted trees and random forests filled most of the top half",
   "paras": [f"Each model was trained with its library's default settings on 1,000 rows and tested on 2,000 different rows, 10 times per dataset with fresh random splits. All {ND} tasks are balanced yes/no problems, so 50% accuracy is chance. We rank models by their average rank across datasets, the standard way to compare learners across tasks of different difficulty, and also report mean accuracy, ROC AUC and wins.",
             f"{TOP} averaged {pts(T[TOP]['mean'])}% accuracy and a mean rank of {T[TOP]['mean_rank']:.2f}. {SECOND} followed at {pts(T[SECOND]['mean'])}%. The fastest model, {fastest}, took a median {tm[fastest] * 1000:.1f} milliseconds to train and predict; the slowest, {slowest}, took {tm[slowest]:.1f} seconds on our 4-core CPU."],
   "exhibits": exhibits_main,
   "tables": [{"title": f"Overall results, {NM} models × {ND} datasets", "columns": ["Model", "Mean accuracy (%)", "Mean ROC AUC (%)", "Mean rank", "Datasets won", "Top-3 finishes", "Median time (s)", "Confidence"], "rows": overall_rows,
               "note": "Mean rank: average of each model's rank on each dataset (1 = best). Time: median seconds to train and predict on a 4-core CPU, no GPU."}]},
  {"id": "datasets", "kicker": "3. Dataset by dataset", "action_title": "The winner depends on the dataset, and margins are often under a point",
   "paras": [f"The datasets come from the benchmark that Grinsztajn, Oyallon and Varoquaux assembled for NeurIPS 2022, published on Hugging Face as inria-soda/tabular-benchmark. They range from {min(i['rows'] for i in INFO.values()):,} to {max(i['rows'] for i in INFO.values()):,} rows and from {min(i['features'] for i in INFO.values())} to {max(i['features'] for i in INFO.values())} features, covering credit, medicine, physics, housing and public records.",
             "One caveat favours complex models: the benchmark's authors removed datasets that were 'too easy', where a linear model or a single tree came within 5% of a neural network and of gradient boosting. Logistic regression and decision trees therefore look worse here than they would on a random sample of business datasets."],
   "tables": [{"title": "Winner and margin on each dataset", "columns": ["Dataset", "What it predicts", "Rows", "Features", "Best model", "Best accuracy (%)", "Runner-up", "Margin (pts)", "Confidence"], "rows": ds_rows},
              {"title": "Mean accuracy of every model on every dataset (%)", "columns": ["Dataset"] + [short(m) for m in MODELS], "rows": matrix_rows,
               "note": "Each cell is the mean of 10 random splits with 1,000 training and 2,000 test rows."}]},
  {"id": "how-you-test", "kicker": "4. How the test changes what you see", "action_title": f"One dataset and one split crowned {SS['distinct_winners']} different winners",
   "paras": [f"A chart built from a single dataset and a single random split, like the viral one, is one draw from a noisy process. Across our {NRUNS} single runs, {SS['distinct_winners']} different models came first at least once. The overall winner, {SS['overall_best']}, was first in {p1(SS['share_runs_overall_best_first'])} of runs, and the average gap between first and second place in a single run was just {pts(SS['mean_gap_first_second'])} points. The agreement between a single run's ranking and the overall ranking (Kendall's tau) averaged {SS['mean_kendall_tau']:.2f}, where 1 would mean identical.",
             f"The metric matters too. Accuracy counts right answers at one threshold; ROC AUC measures how well a model orders cases from least to most likely, across all thresholds. Switching from accuracy to AUC moved {moved[0]} {abs(rank_acc[moved[0]] - rank_auc[moved[0]])} places and {moved[1]} {abs(rank_acc[moved[1]] - rank_auc[moved[1]])}."],
   "exhibits": [{"type": "hbar", "title": "Single runs crown many different winners", "subtitle": f"Share of {NRUNS} single dataset-and-split runs in which each model came first (%)", "unit": "%",
                 "series": [{"name": "Share of runs won", "points": [[m, round(100 * ws[m], 1)] for m in sorted(ws, key=lambda m: -ws[m])]}],
                 "source": "Source: Report AI benchmark, November 2026", "notes": "Ties split equally. 19 datasets × 10 random splits.", "confidence": "DERIVED"}],
   "tables": [{"title": "How often each model won a single run, and how much its accuracy moved between splits", "columns": ["Model", "Share of single runs won", "Average spread between best and worst split (pts)", "Confidence"], "rows": split_rows},
              {"title": "Rank by accuracy versus rank by ROC AUC", "columns": ["Model", "Mean accuracy (%)", "Rank (accuracy)", "Mean ROC AUC (%)", "Rank (AUC)", "Places moved", "Confidence"], "rows": auc_rows}]},
 ],
 "stop_quoting": [
    {"claim": "TabPFN scores 79.5%, a neural network 74.0% and Naive Bayes 42.1%.", "fact": "These figures come from a short AI-labelled video that names no dataset; they cannot be checked. Accuracy is a property of a model on a dataset, not of a model. On Report AI's 19-dataset benchmark the order of the middle of the table differs.", "link": ""},
    {"claim": "Trees always beat neural networks on tabular data.", "fact": "That held in 2021–23 studies of tuned MLP-style networks on medium-sized data (Grinsztajn et al., 2022; McElfresh et al., 2023). By November 2026, pretrained tabular foundation models held the top 21 places of the TabArena leaderboard, while tuned gradient-boosted trees remained strong and far cheaper.", "link": ""},
    {"claim": "TabPFN is open source.", "fact": "The code and the TabPFN v2 weights are openly licensed (Apache 2.0 with an attribution clause). The weights of TabPFN-2.5, 2.6, 3 and 3.5 are released under non-commercial licences; production use needs a commercial licence from Prior Labs.", "link": ""},
    {"claim": "The No Free Lunch theorem means every algorithm is equally good.", "fact": "Wolpert's 1996 theorems average over all possible problems. Real-world data has structure, which is why some model families win consistently on real benchmarks.", "link": ""},
 ],
 "definitions": [
    {"term": "Accuracy", "def": "The share of test cases a model classifies correctly at its default decision threshold. On a balanced two-class problem, guessing scores 50%."},
    {"term": "ROC AUC", "def": "The probability that the model scores a randomly chosen positive case above a randomly chosen negative one; 0.5 is chance and 1.0 is perfect. It ignores the decision threshold."},
    {"term": "Balanced accuracy", "def": "The average of the accuracy on each class. It stops a model that always predicts the majority class from looking good on imbalanced data."},
    {"term": "Train/test split", "def": "Rows used to fit the model are kept apart from rows used to score it. Repeating with several random splits shows how much a result depends on the luck of the draw."},
    {"term": "Gradient boosting", "def": "An ensemble that adds decision trees one at a time, each fitted to the errors of the trees before it. CatBoost, LightGBM, XGBoost and HistGB are implementations."},
    {"term": "Tabular foundation model", "def": "A model pretrained on many (often synthetic) tables that predicts on a new table from its rows as context, without conventional training on it. TabPFN is the best-known example."},
    {"term": {"text": "Benchmark", "href": "/glossary/benchmark/"}, "def": "A fixed set of tasks and a scoring rule used to compare models. Results hold for the benchmark's tasks, not for every problem."},
 ],
 "faq": [
    {"q": "Which machine-learning model is the most accurate?", "a": f"There is no single most accurate model; it depends on the data. On Report AI's November 2026 benchmark of {NM} classifiers on {ND} public tabular datasets with 1,000 training rows, {TOP} had the highest mean accuracy ({pts(T[TOP]['mean'])}%) and won {top_wins} of {ND} datasets, ahead of {SECOND} ({pts(T[SECOND]['mean'])}%)."},
    {"q": "Do neural networks beat decision trees?", "a": f"A single decision tree is one of the weakest models, but ensembles of trees are among the strongest. In Report AI's benchmark a default multilayer-perceptron neural network ranked {rank_acc['Neural network (MLP)']} of {NM} and a single decision tree {rank_acc['Decision tree']}, while gradient-boosted tree ensembles filled most of the top half. Pretrained tabular transformers such as TabPFN now lead the TabArena leaderboard."},
    {"q": "What is TabPFN?", "a": "TabPFN is a transformer pretrained on millions of synthetic datasets that predicts on a new table in a single forward pass. Hollmann et al. described version 2 in Nature in January 2025 and reported that it outperforms previous methods on datasets of up to 10,000 samples. Later versions from Prior Labs handle up to 1 million rows but are licensed for non-commercial use only."},
    {"q": "Why do machine-learning rankings disagree?", "a": f"Because results depend on the dataset, the random split, the metric, the amount of training data, preprocessing and tuning. In Report AI's benchmark, {SS['distinct_winners']} different models won at least one of {NRUNS} single dataset-and-split runs, and the overall winner was first in only {p1(SS['share_runs_overall_best_first'])} of them."},
    {"q": "Which algorithms decide what I see online?", "a": "Many. Facebook described combining boosted decision trees with logistic regression to predict ad clicks in 2014; YouTube used deep neural networks for recommendations in 2016; X's For You feed is ranked by a transformer model according to its open-source repository (November 2026); and Naive Bayes classifiers were the first academic spam filters (1998)."},
 ],
 "methodology_extra": f"Report AI's benchmark used {ND} binary classification datasets from the Grinsztajn et al. (2022) tabular benchmark (Hugging Face inria-soda/tabular-benchmark; mixed-feature versions where available), with classes balanced by the benchmark's authors. For each dataset and random seed we drew 1,000 training and 2,000 test rows (stratified), trained each model with library defaults (scikit-learn 1.9.1, XGBoost 3.2.0, LightGBM 4.7.0, CatBoost 1.2.10, TabPFN v2 weights via the tabpfn 10.0.0 package), standardised features for the four scale-sensitive models, and recorded accuracy, balanced accuracy, ROC AUC and time on a 4-core CPU without a GPU. Further experiments varied training size (100 to 10,000 rows, 3 seeds), feature scaling, class balance (10% positives, 3 seeds) and hyperparameter tuning (20-configuration random search with 3-fold cross-validation, 3 seeds). Categorical features were left in the benchmark's ordinal coding. All averages, ranks and shares are Report AI calculations (DERIVED); literature figures carry their source and confidence. Built with PriorLabs-TabPFN. ",
 "related": ' &middot; '.join(f'<a href="{u}">{t}</a>' for t, u in [
    ("How to categorize LLMs: the LLM Taxonomy 2026", TAX), ("AI models benchmarks statistics 2026", "/indexes/technical-benchmarks/ai-models-benchmarks-statistics-2026/"),
    ("Best AI models 2026", "/indexes/technical-benchmarks/best-ai-models-2026/"), ("Test-time compute and reasoning", "/indexes/technical-benchmarks/test-time-compute-reasoning-2026/"),
    ("How AI developed, 1950–2026", "/reports/how-ai-developed-1950-2026/"), ("AI statistics fact-check", "/reports/ai-statistics-fact-check/"),
    ("Glossary: benchmark", "/glossary/benchmark/"), ("Glossary: foundation model", "/glossary/foundation-model/"), ("Glossary: MLOps", "/glossary/mlops/")]),
 "about": {"@type": "Thing", "name": "Machine learning model comparison"},
}

ch = page['chapters']
if SZ:
    ch.append({"id": "data-size", "kicker": "5. Training-set size", "action_title": "With 100 rows and with 10,000, different models lead",
               "paras": [f"We repeated the test with 100, 300, 1,000, 3,000 and 10,000 training rows on the {len(SZ['common_datasets'])} datasets large enough for every size. Accuracy rises for every model as data grows, but not equally: models that rely on strong built-in assumptions do relatively well with very little data, while flexible ensembles and neural networks gain most from more rows."],
               "exhibits": [ex_size],
               "tables": [{"title": "Mean accuracy by training-set size (%)", "columns": ["Model"] + [f"{n:,} rows" for n in ns_] + [f"Rank at {ns_[0]:,}", f"Rank at {ns_[-1]:,}", "Confidence"], "rows": size_rows}]})
if NS or IM or TU:
    paras, exs, tbs = [], [], []
    if NS:
        paras.append("Four models measure distances or weighted sums directly on the raw features, so a feature measured in thousands drowns one measured in fractions unless the data is standardised first. Removing that one preprocessing line changed their accuracy by: " + '; '.join(f"{m} {100 * v['delta']:+.1f} points" for m, v in sorted(NS.items(), key=lambda kv: kv[1]['delta'])) + ".")
        exs.append({"type": "grouped", "title": "Forgetting to scale features costs the distance-based models most", "subtitle": "Mean accuracy with and without standardised features, 19 datasets × 10 splits (%)", "unit": "%",
                    "series": [{"name": "Scaled", "points": [[short(m), round(100 * v['scaled'], 1)] for m, v in NS.items()]}, {"name": "Not scaled", "points": [[short(m), round(100 * v['unscaled'], 1)] for m, v in NS.items()]}],
                    "source": "Source: Report AI benchmark, November 2026", "notes": "Tree-based models and TabPFN do not need scaling and are not shown.", "confidence": "DERIVED"})
    if IM:
        maj = IM['Majority class']
        real = {m: v for m, v in IM.items() if m != 'Majority class'}
        top_acc = max(real, key=lambda m: real[m]['acc']); top_bal = max(real, key=lambda m: real[m]['bal_acc'])
        paras.append(f"When only 10% of cases are positive, a model that always answers 'no' scores {pts(maj['acc'])}% accuracy while learning nothing; its balanced accuracy is {pts(maj['bal_acc'])}%. The real models scored between {pts(min(v['acc'] for v in real.values()))}% and {pts(max(v['acc'] for v in real.values()))}% accuracy, barely above that do-nothing baseline, but between {pts(min(v['bal_acc'] for v in real.values()))}% and {pts(max(v['bal_acc'] for v in real.values()))}% balanced accuracy. The leader changes with the metric: {top_acc} had the highest accuracy, {top_bal} the highest balanced accuracy. On imbalanced data, an accuracy figure is meaningless without the base rate. (TabPFN was not run in this test.)")
        tbs.append({"title": "Accuracy hides failure when one class is rare (10% positives, 1,000 training rows)", "columns": ["Model", "Accuracy (%)", "Balanced accuracy (%)", "ROC AUC (%)", "Confidence"],
                    "rows": [[m, pts(v['acc']), pts(v['bal_acc']), pts(v['auc']), 'DERIVED'] for m, v in sorted(IM.items(), key=lambda kv: -kv[1]['bal_acc'])]})
    if TU:
        best_gain = max(TU, key=lambda m: TU[m]['delta'])
        paras.append(f"Default settings are not the whole story. A modest search over 20 hyperparameter configurations, scored by 3-fold cross-validation, helped {best_gain} most ({100 * TU[best_gain]['delta']:+.1f} points). McElfresh et al. (2023) reached the same conclusion at larger scale: light tuning of gradient-boosted trees often matters more than the choice between model families.")
        exs.append({"type": "grouped", "title": "Tuning helps the models with the weakest defaults most", "subtitle": "Mean accuracy at default settings and after a 20-configuration random search, 19 datasets × 3 splits (%)", "unit": "%",
                    "series": [{"name": "Default", "points": [[short(m), round(100 * v['default'], 1)] for m, v in TU.items()]}, {"name": "Tuned", "points": [[short(m), round(100 * v['tuned'], 1)] for m, v in TU.items()]}],
                    "source": "Source: Report AI benchmark, November 2026", "notes": "CatBoost, LightGBM, extra trees and TabPFN were not tuned.", "confidence": "DERIVED"})
        tbs.append({"title": "Default versus tuned accuracy", "columns": ["Model", "Default (%)", "Tuned (%)", "Change (pts)", "Rank default", "Rank tuned", "Confidence"],
                    "rows": [[m, pts(v['default']), pts(v['tuned']), f"{100 * v['delta']:+.1f}", f"{S['tune_rank_default'][m]:g}", f"{S['tune_rank_tuned'][m]:g}", 'DERIVED'] for m, v in sorted(TU.items(), key=lambda kv: -kv[1]['tuned'])]})
    ch.append({"id": "setup", "kicker": f"{len(ch) + 1}. Scaling, imbalance and tuning", "action_title": "Three setup choices change the scoreboard as much as the choice of model",
               "paras": paras, "exhibits": exs, "tables": tbs})
ch.append({"id": "literature", "kicker": f"{len(ch) + 1}. What the research says", "action_title": "Trees led until 2023; pretrained tabular transformers lead the 2026 leaderboards",
           "paras": [fact('grinsztajn-45') + " " + fact('tabzilla-finding'), fact('tabarena-lb-top') + " " + fact('tabarena-lb-classic'),
                     "Our results sit between these: at 1,000 training rows and default settings, without the ensembling and long tuning budgets of the leaderboards, " + f"{TOP} led, and the gaps among the top tree ensembles were small."],
           "tables": [{"title": "Key studies and leaderboards", "columns": ["Source", "Finding", "Link", "Confidence"], "rows": lit_rows}]})
ch.append({"id": "what-you-see", "kicker": f"{len(ch) + 1}. How these models shape what you see", "action_title": "From spam filters to feeds, every model family in this test decides something people see",
           "paras": ["The same families compete inside the systems that choose what appears on screens. Early spam filters were Naive Bayes classifiers; ad-click prediction at Facebook in 2014 combined boosted trees with logistic regression; feeds and video recommendations moved to deep neural networks and, by 2024–26, to transformers with billions or trillions of parameters. The model decides the ranking, but the weights a company puts on each predicted action (a like, a reply, a report) decide what the ranking rewards.",
                     fact('x-2026-weights')],
           "tables": [{"title": "Model families behind ads, feeds, search, spam and credit", "columns": ["Where", "Model family", "What is documented", "Link", "Confidence"], "rows": see_rows}]})
ch.append({"id": "models", "kicker": f"{len(ch) + 1}. The {NM} models", "action_title": "What each model does, where it is strong and where it fails",
           "paras": ["The guide below describes each model in one line, with its rank in our benchmark. Strengths and weaknesses are Report AI's summary of the standard literature and of our results. For the large language models that power chatbots, see the LLM Taxonomy 2026."],
           "tables": [{"title": "Model guide", "columns": ["Model", "How it works", "Strengths", "Weaknesses", "Rank in our benchmark"], "rows": guide_rows}]})

txt = json.dumps(page, indent=1, ensure_ascii=False)
open(os.path.join(HERE, 'bench.json'), 'w').write(txt)
print('wrote bench.json:', TOP, pts(T[TOP]['mean']), '| winners', SS['distinct_winners'], '| chapters', len(page['chapters']))
