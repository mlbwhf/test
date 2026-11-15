# Tabular ML research notes: literature, leaderboards, real-world use, and the viral video

Compiled 15 Nov 2026 for the Report AI "13 models" report (parts b and c). This is research only: nothing was published or committed.
Machine-readable facts with sources and confidence ratings are in `tabular-research.json` in this folder (54 facts). **HIGH** means the primary source was opened and the figure seen. **MEDIUM** means the figure came from a secondary source or a search summary only.

**Network caveat.** Many primary hosts were blocked from this session. They include nature.com, PubMed/PMC, OpenReview, NeurIPS proceedings, research.google, blog.x.com, YouTube, Kaggle, bankofengland.co.uk, docs.priorlabs.ai, Crossref and Semantic Scholar. The sources that were reachable are arXiv, Hugging Face, GitHub (raw files and clones), Wikipedia and bis.org. Every MEDIUM item below can be upgraded once those hosts are allowed.

---

## 1. TabPFN

**Nature paper (v2).** Hollmann, Müller, Purucker et al. published "Accurate predictions on small data with a tabular foundation model" in *Nature* 637(8045):319–326 in January 2025 (DOI 10.1038/s41586-024-08328-6). HIGH for the citation, which was checked via the TabPFN-3 report's reference list and the GitHub README.
- The abstract says TabPFN beats all previous methods on datasets with **up to 10,000 samples**. HIGH: the abstract is quoted in arXiv 2505.20003, and the TabPFN-2.5 report repeats it.
- The recommended maximum is **10,000 rows and 500 features**, per Table 1 of the TabPFN-2.5 report. HIGH.
- **"In 2.8 s TabPFN outperforms an ensemble of the strongest baselines tuned for 4 h"** is a classification-setting claim. MEDIUM: I saw it only in a search summary of the PubMed abstract.
- The model was pretrained only on synthetic data from a **structural-causal-model prior**. HIGH: TabPFN-3 report, Sec. 2.5.
- **Number of synthetic datasets: unresolved.** Wikipedia, citing Nature, says about 130 million. A search summary of the Freiburg press release says 100 million. Do not publish either figure until the Nature Methods section has been checked.
- **Adoption, as reported by Prior Labs:** over 3.2M PyPI downloads and over 1,000 citations as of 8 May 2026 (TabPFN-3 report). In Nov 2025 the figures were about 400 citations and over 2M downloads.

**Later versions, verified on arXiv, the GitHub README and Hugging Face:**

| Version | First posted | Stated limits | Weights licence |
|---|---|---|---|
| v2 (Nature) | Jan 2025 | 10k rows / 500 features | Prior Labs License v1.1: Apache-2.0 plus Sec. 10, which requires the notice "Built with PriorLabs-TabPFN" (the exact string; "Built with TabPFN" is wrong). Derived distributed models must have names starting "TabPFN". |
| 2.5 | 11 Nov 2025 (arXiv 2511.08667) | 50k rows / 2,000 features | TABPFN-2.5 License v1.1 (rev. 9 Dec 2025): **non-commercial** |
| 2.6 | not checked | not checked | Non-commercial (per the README) |
| 3 | 13 May 2026 (arXiv 2605.13986) | Scales to 1M training rows; results reported up to 200 features | TabPFN-3 License v1.0: non-commercial |
| 3.5 (current default) | 15 Sep 2026 (arXiv 2609.17895) | Accepts up to 1M rows / 20k features (README) | TABPFN-3.5 License v1.0 (rev. 9 Sep 2026): non-commercial |

- **Your licence question.** Yes, v2 is Apache-2.0 with an attribution requirement. Note that the Hugging Face file is `LICENSE.txt`, not `LICENSE`. Yes, the 2.5 weights, and every later release, are non-commercial; production use needs a paid commercial licence. The code has been plain Apache-2.0 since package 9.0.0 (Wikipedia, MEDIUM).
- **Vendor claims for 2.5:** a win rate of 100% over **default** XGBoost on small and medium classification, 87% on larger data and 85% on regression. Prior Labs also says 2.5 matches AutoGluon 1.4 on TabArena. These are self-reported.
- **Vendor claims for 3:** it beats GBDTs tuned for 8 hours on data up to 1M rows and 200 features, and it is up to 20× faster than 2.5.

## 2. Grinsztajn, Oyallon and Varoquaux (NeurIPS 2022)

- The benchmark has **45 datasets** in the medium-sized regime of about **10k samples**; larger training sets were truncated to 10,000. A secondary large regime truncated at 50,000 and found that the gap between neural networks and trees narrows with more data. HIGH.
- **Main finding:** tree-based models (XGBoost, random forests) remain state-of-the-art on medium-sized data, even before counting their speed advantage. HIGH.
- **Three reasons, each a section heading:**
  1. Neural networks are biased towards overly smooth solutions.
  2. Uninformative features hurt MLP-like networks more.
  3. Tabular data are not rotation-invariant, so learners should not be either.

  HIGH.
- Each learner got 20,000 compute hours of hyperparameter search. HIGH.
- **Venue:** NeurIPS 2022, Datasets & Benchmarks track. MEDIUM, from the poster page and the proceedings file name; OpenReview was blocked.
- **Hugging Face `inria-soda/tabular-benchmark`** has **59 CSV task files**: clf_num 16, clf_cat 7, reg_num 19 and reg_cat 17. The card states no licence. HIGH.
  - **Caveat for our own benchmark:** the curation removed datasets that were "too easy", meaning a linear model or single tree came within 5% of a ResNet and of HistGradientBoosting. This depresses the scores of logistic regression and decision trees by design. Say so when we publish our results.

## 3. McElfresh et al., NeurIPS 2023 (TabZilla)

- The study compared **19 algorithms on 176 datasets**. HIGH.
- **The NN-versus-GBDT debate is overemphasised.** For many datasets the difference is negligible, or **light hyperparameter tuning of a GBDT matters more than the choice of model family**.
- GBDTs handle skewed or heavy-tailed features and other irregular data much better than neural networks.
- TabPFN (v1) was best on average even when trained on only 3,000 sampled rows.
- The released TabZilla suite contains the 36 hardest datasets. HIGH.

## 4. Shwartz-Ziv and Armon (2021/22)

- XGBoost beat the deep tabular models on the datasets tested, including the datasets those models' own papers used. It also needed far less tuning. An ensemble of the deep models plus XGBoost beat XGBoost alone. HIGH (arXiv abstract).
- The journal record is *Information Fusion* vol. 81, pp. 84–90 (2022). MEDIUM.

## 5. TabArena, TALENT and the 2026 foundation models

**TabArena** (Erickson et al., NeurIPS 2025 D&B spotlight) is a living benchmark. It has **51 datasets**, curated from 1,053 used in 14 earlier benchmarks, each with 500 to 250k training rows. Its Elo scale fixes RandomForest at its default settings to **1000**, and a 400-point gap means a 91% expected win rate. HIGH.

**Live leaderboard as of 11 Nov 2026.** This is the default view (single models, 51 datasets, missing runs imputed), downloaded directly from the Space's published CSV. HIGH.

| # | Model (setting) | Org | Elo (95% CI) | Weights commercial? |
|---|---|---|---|---|
| 1 | Kumo-Tabular (default) | NVIDIA | 1971 (+160/−99) | yes (OpenMDW-1.1) |
| 2 | LimiX-2 (default) ⚠ leakage flag | Stable AI & Tsinghua | 1959 (+130/−83) | no |
| 3 | Kumo-Tabular-Medium | NVIDIA | 1909 | yes |
| 4 | Seldon | Neuralk-AI | 1903 | no |
| 5 | TabPFN-3.5 | Prior Labs | 1868 | no |
| 8 | TabFM | Google Research | 1790 | no |
| 11 | Mitra-v2 | Amazon | 1769 | yes (Apache-2.0) |
| 22 | TabM-A (tuned + ensembled), the best non-foundation model | | 1517 | yes |
| 32 | LightGBM (tuned + ensembled), the best tree model | | 1411 | yes |
| 34 | CatBoost (tuned + ensembled) | | 1402 | yes |
| 43 | XGBoost (tuned + ensembled) | | 1360 | yes |
| 84 | RandomForest (tuned + ensembled) | | 1172 | yes |
| 101 | RandomForest (default) | | 1000 (anchor) | yes |
| 102 / 103 | KNN / Linear (tuned + ensembled) | | 993 / 990 | yes |
| 108 | KNN (default) | | 635 | yes |

- The **top 21 of 108 entries are all tabular foundation models.**
- The top-5 confidence intervals overlap, so the order within the top 5 is not settled.
- LimiX-2 carries the leaderboard's own **leakage warning**: test data are proven to have leaked into its training (blood-transfusion and diabetes datasets; tabarena issue #648).
- Naive Bayes, SVM and single decision trees are **not on TabArena**.
- **TabPFN by version:** v2 scores 1251, but 35% of its runs are imputed because it cannot run on large datasets. Version 2.6 scores 1583, 3 scores 1631 and 3.5 scores 1868.

**Other benchmarks and models:**
- **TALENT** (Ye et al., arXiv 2407.00956) covers 300+ datasets. It finds that GBDTs remain strong baselines while pretrained tabular models now match or beat them on many tasks. HIGH.
- **TabICL** (ICML 2025) handles up to 500k rows. On 53 datasets with more than 10k rows it beat both TabPFN v2 and CatBoost. HIGH.
- **Mitra-v2** (Sep 2026) has 77M parameters, is Apache-2.0, and its authors report it comparable to TabFM. HIGH for the claims; the claims themselves are self-reported.
- **LimiX-2** (Sep 2026) claims state-of-the-art results on TabArena, TALENT and BCCO. HIGH for the claim; note the leakage flag above.

## 6. No Free Lunch

Wolpert, *Neural Computation* 8 (1996), pp. 1341–1390. Averaged uniformly over all possible target functions, no learning algorithm has lower expected off-training-set error than any other. Any real-world advantage therefore comes from assumptions that fit the problem. MEDIUM: the citation was checked via Wikipedia, not the paper itself. Do not use NFL to argue that "all models are equally good in practice".

## 7. What practitioners use: Kaggle 2022

This is the most recent Kaggle ML & DS survey I found; I could not confirm whether a later one exists. It had **23,997 respondents**, which is HIGH because I counted the rows of the raw file. The figure of 173 countries is MEDIUM.

Report AI tabulated Q18 ("ML algorithms used on a regular basis") from a **third-party GitHub mirror** of Kaggle's raw CSV, because kaggle.com was blocked. Mark these figures **DERIVED / MEDIUM**. The denominator is the 15,864 people who answered the question. Shares of all 23,997 respondents are in brackets.

| Algorithm family | Share of question respondents |
|---|---|
| Linear or logistic regression | 71.5% (47.2%) |
| Decision trees / random forests | 59.1% (39.1%) |
| CNNs | 37.9% (25.0%) |
| Gradient boosting (XGBoost, LightGBM…) | 34.7% (22.9%) |
| Bayesian approaches | 23.1% |
| Dense NNs / MLPs | 21.9% |
| RNNs | 21.8% |
| Transformers (BERT, GPT-3…) | 13.8% (9.2%) |
| None | 8.4% |

Before publishing, check these against Kaggle's own executive-summary percentages, which may use a different base.

## 8. How these model families shape what people see

| Domain | Fact | Confidence |
|---|---|---|
| **Ads (Facebook 2014)** | He et al., ADKDD 2014: boosted decision trees feeding logistic regression beat either method alone by more than 3%. The key lesson was that the right features matter most. | MEDIUM |
| **YouTube (2016)** | Covington, Adams & Sargin, RecSys 2016: a deep candidate-generation network, then a separate deep ranking network. | MEDIUM |
| **Twitter (2023)** | Open-sourced code: a light ranker, then a heavy ranker. The heavy ranker is a parallel MaskNet predicting 10 engagement probabilities, combined by a weighted sum (5 Apr 2023 weights: like +0.5, report −369). About 50% of candidates come from in-network search. | HIGH (GitHub) |
| | Blog, 31 Mar 2023: about 1,500 candidates and a heavy ranker of about 48M parameters. | MEDIUM |
| **X (2026)** | xai-org/x-algorithm, updated to 14 Nov 2026: ranking uses a **transformer** ("Phoenix") with candidate isolation; retrieval uses a transformer two-tower model. Earlier releases shipped a sample transformer ported from Grok-1. | HIGH |
| | First release reported as 20 Jan 2026. | MEDIUM |
| **ByteDance Monolith (2022)** | Real-time online training with a collisionless embedding table, deployed in **BytePlus Recommend**. The abstract does not mention TikTok. | HIGH |
| **Meta HSTU (2024)** | ICML 2024: a 1.5-trillion-parameter generative recommender, +12.4% in online A/B tests, deployed on surfaces with billions of users. | HIGH |
| **Google Search BERT (2019)** | Applied to about 1 in 10 US English queries (Oct 2019). | MEDIUM |
| **Spam (Naive Bayes)** | Sahami et al., AAAI-98 workshop, was the first scholarly naive Bayes spam filter. Paul Graham's "A Plan for Spam" (2002) popularised the approach. | MEDIUM |
| **Gmail** | Google, 6 Feb 2019: more than 99.9% of spam, phishing and malware blocked, and TensorFlow added about 100M extra blocks per day. This is self-reported. | MEDIUM |
| **Credit** | BIS WP 834 (Dec 2019): a fintech's ML model beat traditional bank models at predicting defaults when credit supply was hit by a shock. | HIGH |
| | Logistic regression is "the most popular" scorecard technique (Wikipedia only). | MEDIUM |
| | Bank of England/FCA 2022: 72% of responding firms use or develop ML. | MEDIUM |

## 9. The video

**Not found and not verified.** Searches on the exact title, the caption phrase and the exact accuracy figures (79.5 / 74.0 / 73.5 / 42.1) returned nothing, and youtube.com was blocked. The video names no dataset, so its numbers cannot be checked or reproduced. Also note:
- The caption says 13 models, but the chart shows 9.
- The video is labelled as AI content.

Treat the chart as illustrative only. If the owner has the URL, it can be checked in an environment with YouTube or TikTok access.

## 10. Claims that are commonly repeated but wrong or misleading

1. **"Trees always beat neural networks on tabular data"** is outdated. That held in the 2021–23 papers, which were about tuned MLP-style networks on medium-sized data. On TabArena in Nov 2026 the top 21 entries are foundation models, and tuned-and-ensembled neural networks (TabM, RealMLP) rank above tuned GBDTs. The reverse claim, "deep learning has won", is also too strong: McElfresh found the gap negligible on many datasets.
2. **"TabPFN is open source / Apache"** is only half true. The code and the v2 weights are, with an attribution clause. The weights for 2.5, 2.6, 3 and 3.5 are non-commercial.
3. **"TabPFN works on any size of data"** is wrong for v2, which is limited to 10k rows and 500 features. The current 3.5 accepts up to 1M rows, but it needs a GPU (by default the CPU path is capped at 5k samples).
4. **"Beats XGBoost 100% of the time"** comes from the 2.5 report, and the comparison is with **default** XGBoost on small and medium classification data. It is not a comparison with tuned XGBoost.
5. **"TabPFN was trained on 100 million datasets"** conflicts with the "~130 million" figure. Check the Nature paper before using either.
6. **"One report on X cancels out N likes"** is a misreading. X's own README (Aug 2026) says the weights multiply each viewer's *predicted probability* of an action, not raw counts. Note also that the 2023 code had like +0.5 and report −369.
7. **"TikTok's algorithm is Monolith"**: the Monolith paper names BytePlus Recommend. It does not name TikTok.
8. **"Gmail blocks 99.9% of spam"** is Google's own unaudited metric. Always attribute it to Google and keep the date (2017 and 2019 statements).
9. **"No Free Lunch means every algorithm is equally good"** misreads the theorem. NFL averages over *all* possible problems. Real data has structure, which is exactly why some model families win consistently.
10. **"Naive Bayes is about 42% accurate"** comes from the video. No such general figure exists, because accuracy depends entirely on the dataset. Naive Bayes is still a strong baseline for text and spam.
11. **Grinsztajn "45 datasets" vs the HF dataset's "59 files"**: both numbers are right but they count different things. Some datasets appear in several task folders, in numerical-only and mixed-feature versions.

## Still to verify (needs blocked hosts)

- On nature.com: the Nature abstract's 2.8 s / 4 h wording, the count of synthetic datasets, and the benchmark dataset counts (AutoML Benchmark / OpenML-CTR23).
- Twitter blog figures: 1,500 candidates and 48M parameters (blog.x.com).
- The Facebook 2014 and YouTube 2016 paper texts.
- The Gmail 2019 blog text.
- Kaggle's official 2022 percentages, and whether a 2023 or later survey exists.
- The Bank of England/FCA 2022 report, for a credit-specific primary statistic.
- The video itself.
