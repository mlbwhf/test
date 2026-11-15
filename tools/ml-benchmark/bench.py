"""Report AI tabular benchmark: 13 classifiers on the Grinsztajn et al. (2022)
benchmark datasets (Hugging Face inria-soda/tabular-benchmark).

Usage:  python bench.py <experiment> [--data DIR] [--out DIR] [--jobs N]
Experiments:
  main       defaults, n_train=1000, 10 random splits per dataset
  noscale    scale-sensitive models without standardisation (n_train=1000, 10 splits)
  size       learning curve, n_train in {100,300,1000,3000,10000}, 3 splits
  imbalance  10% positive class in train and test, n_train=1000, 5 splits
  tune       20-config random search (3-fold CV) for 9 models, n_train=1000, 3 splits

Results are appended to <out>/<experiment>.jsonl, one line per (dataset, split,
n_train, model, variant); finished keys are skipped on restart.
"""
import argparse, json, os, sys, time, warnings
os.environ.setdefault("TABPFN_ALLOW_CPU_LARGE_DATASET", "1")
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from joblib import Parallel, delayed
from scipy.stats import loguniform, randint, uniform
from sklearn.base import clone
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis  # noqa: F401 (kept for experiments)
from sklearn.ensemble import (ExtraTreesClassifier, HistGradientBoostingClassifier,
                              RandomForestClassifier)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, roc_auc_score
from sklearn.model_selection import RandomizedSearchCV
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

# One version of each dataset: the clf_cat file where it exists (it keeps the
# categorical columns, ordinal-coded), otherwise clf_num.
DATASETS = [
    "clf_cat/albert", "clf_cat/compas-two-years", "clf_cat/default-of-credit-card-clients",
    "clf_cat/electricity", "clf_cat/eye_movements",
    "clf_num/Bioresponse", "clf_num/Diabetes130US", "clf_num/MagicTelescope",
    "clf_num/bank-marketing", "clf_num/california", "clf_num/credit", "clf_num/heloc",
    "clf_num/house_16H", "clf_num/pol",
]

MODEL_ORDER = ["TabPFN v2", "CatBoost", "LightGBM", "XGBoost", "Gradient boosting (HistGB)",
               "Random forest", "Extra trees", "Neural network (MLP)", "SVM (RBF)",
               "k-nearest neighbours", "Logistic regression", "Decision tree", "Naive Bayes"]
SCALE_SENSITIVE = {"Neural network (MLP)", "SVM (RBF)", "k-nearest neighbours", "Logistic regression"}


def make_model(name, seed, scale=True, threads=1):
    import catboost, lightgbm, xgboost
    m = {
        "Naive Bayes": lambda: GaussianNB(),
        "Logistic regression": lambda: LogisticRegression(max_iter=5000),
        "k-nearest neighbours": lambda: KNeighborsClassifier(),
        "SVM (RBF)": lambda: SVC(random_state=seed),
        "Decision tree": lambda: DecisionTreeClassifier(random_state=seed),
        "Random forest": lambda: RandomForestClassifier(random_state=seed, n_jobs=threads),
        "Extra trees": lambda: ExtraTreesClassifier(random_state=seed, n_jobs=threads),
        "Gradient boosting (HistGB)": lambda: HistGradientBoostingClassifier(random_state=seed),
        "XGBoost": lambda: xgboost.XGBClassifier(random_state=seed, n_jobs=threads, verbosity=0),
        "LightGBM": lambda: lightgbm.LGBMClassifier(random_state=seed, n_jobs=threads, verbose=-1),
        "CatBoost": lambda: catboost.CatBoostClassifier(random_seed=seed, thread_count=threads,
                                                        verbose=0, allow_writing_files=False),
        "Neural network (MLP)": lambda: MLPClassifier(max_iter=1000, random_state=seed),
        "TabPFN v2": lambda: make_tabpfn(seed),
    }[name]()
    if scale and name in SCALE_SENSITIVE:
        return make_pipeline(StandardScaler(), m)
    return m


def make_tabpfn(seed):
    from tabpfn import TabPFNClassifier
    path = os.environ.get("TABPFN_V2_CKPT")
    kw = dict(device="cpu", random_state=seed, ignore_pretraining_limits=True)
    if path:
        kw["model_path"] = path
    return TabPFNClassifier(**kw)


def load(data_dir, key):
    df = pd.read_csv(os.path.join(data_dir, key + ".csv"))
    y_raw = df.iloc[:, -1].astype(str)
    classes = sorted(y_raw.unique())
    y = (y_raw == classes[-1]).astype(int).to_numpy()
    X = df.iloc[:, :-1].to_numpy(dtype=np.float64)
    return X, y


def split(X, y, n_train, n_test, seed, pos_frac=None):
    rng = np.random.default_rng(seed)
    idx0, idx1 = np.flatnonzero(y == 0), np.flatnonzero(y == 1)
    rng.shuffle(idx0); rng.shuffle(idx1)
    f = 0.5 if pos_frac is None else pos_frac
    n1_tr, n1_te = int(round(n_train * f)), int(round(n_test * f))
    n0_tr, n0_te = n_train - n1_tr, n_test - n1_te
    if n0_tr + n0_te > len(idx0) or n1_tr + n1_te > len(idx1):
        return None
    tr = np.concatenate([idx0[:n0_tr], idx1[:n1_tr]])
    te = np.concatenate([idx0[n0_tr:n0_tr + n0_te], idx1[n1_tr:n1_tr + n1_te]])
    rng.shuffle(tr); rng.shuffle(te)
    return X[tr], y[tr], X[te], y[te]


def scores(model, Xte):
    if hasattr(model, "predict_proba"):
        try:
            return model.predict_proba(Xte)[:, 1]
        except Exception:
            pass
    return model.decision_function(Xte)


def evaluate(model, Xtr, ytr, Xte, yte):
    t0 = time.perf_counter(); model.fit(Xtr, ytr); t1 = time.perf_counter()
    pred = model.predict(Xte); s = scores(model, Xte); t2 = time.perf_counter()
    return dict(acc=float(accuracy_score(yte, pred)), bal_acc=float(balanced_accuracy_score(yte, pred)),
                auc=float(roc_auc_score(yte, s)), fit_s=round(t1 - t0, 4), pred_s=round(t2 - t1, 4))


TUNE_SPACES = {
    "Naive Bayes": {"var_smoothing": loguniform(1e-12, 1e-1)},
    "Logistic regression": {"logisticregression__C": loguniform(1e-4, 1e3)},
    "k-nearest neighbours": {"kneighborsclassifier__n_neighbors": randint(1, 101),
                             "kneighborsclassifier__weights": ["uniform", "distance"],
                             "kneighborsclassifier__p": [1, 2]},
    "SVM (RBF)": {"svc__C": loguniform(1e-2, 1e3), "svc__gamma": loguniform(1e-4, 1e1)},
    "Decision tree": {"max_depth": [None, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30],
                      "min_samples_leaf": randint(1, 51), "criterion": ["gini", "entropy"]},
    "Random forest": {"max_features": ["sqrt", "log2", 0.5, 1.0], "min_samples_leaf": randint(1, 11),
                      "max_depth": [None, 10, 20], "n_estimators": [100, 200, 400]},
    "Gradient boosting (HistGB)": {"learning_rate": loguniform(0.01, 0.3), "max_leaf_nodes": randint(4, 64),
                                   "min_samples_leaf": randint(5, 100), "l2_regularization": loguniform(1e-3, 10),
                                   "max_iter": [100, 300, 600]},
    "XGBoost": {"learning_rate": loguniform(0.01, 0.3), "max_depth": randint(2, 11),
                "subsample": uniform(0.5, 0.5), "colsample_bytree": uniform(0.5, 0.5),
                "n_estimators": [100, 300, 600, 1000], "min_child_weight": loguniform(1, 20),
                "reg_lambda": loguniform(1e-2, 10)},
    "Neural network (MLP)": {"mlpclassifier__hidden_layer_sizes": [(64,), (128,), (256,), (128, 128), (256, 128)],
                             "mlpclassifier__alpha": loguniform(1e-6, 1e-1),
                             "mlpclassifier__learning_rate_init": loguniform(1e-4, 1e-2),
                             "mlpclassifier__early_stopping": [True, False]},
}


def task(exp, key, data_dir, seed, n_train, n_test, models, done, threads):
    X, y = load(data_dir, key)
    out = []
    variants = {"main": ["default"], "noscale": ["no-scaling"], "size": ["default"],
                "imbalance": ["10pct-positive"], "tune": ["default", "tuned"]}[exp]
    s = split(X, y, n_train, n_test, seed, pos_frac=0.1 if exp == "imbalance" else None)
    if s is None:
        return out
    Xtr, ytr, Xte, yte = s
    if exp == "imbalance" and ("Majority class", "10pct-positive") not in done:
        pred = np.zeros_like(yte)
        out.append(dict(model="Majority class", variant="10pct-positive",
                        acc=float(accuracy_score(yte, pred)), bal_acc=float(balanced_accuracy_score(yte, pred)),
                        auc=0.5, fit_s=0.0, pred_s=0.0))
    for name in models:
        for v in variants:
            if (name, v) in done:
                continue
            try:
                if v == "tuned":
                    base = make_model(name, seed, scale=True, threads=threads)
                    search = RandomizedSearchCV(base, TUNE_SPACES[name], n_iter=20, cv=3, scoring="accuracy",
                                                random_state=seed, n_jobs=1, error_score=np.nan)
                    r = evaluate(search, Xtr, ytr, Xte, yte)
                    r["best_params"] = {k: (v2 if isinstance(v2, (int, float, str, type(None))) else str(v2))
                                        for k, v2 in search.best_params_.items()}
                else:
                    r = evaluate(make_model(name, seed, scale=(v != "no-scaling"), threads=threads),
                                 Xtr, ytr, Xte, yte)
            except Exception as e:  # record failures rather than crash the run
                r = dict(error=f"{type(e).__name__}: {e}"[:300])
            out.append(dict(model=name, variant=v, **r))
    for r in out:
        r.update(dataset=key.split("/")[1], seed=seed, n_train=n_train, n_test=n_test, exp=exp)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("exp")
    ap.add_argument("--data", default="/home/user/ml-data")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "results"))
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--models", default="")
    ap.add_argument("--datasets", default="")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    path = os.path.join(a.out, f"{a.exp}.jsonl")
    done = {}
    if os.path.exists(path):
        for line in open(path):
            r = json.loads(line)
            done.setdefault((r["dataset"], r["seed"], r["n_train"]), set()).add((r["model"], r["variant"]))

    models = [m for m in MODEL_ORDER if not a.models or m in a.models.split(",")]
    datasets = [d for d in DATASETS if not a.datasets or d.split("/")[1] in a.datasets.split(",")]
    plan = []
    if a.exp in ("main", "noscale"):
        ms = models if a.exp == "main" else [m for m in models if m in SCALE_SENSITIVE]
        plan = [(d, s, 1000, 2000, ms) for d in datasets for s in range(10)]
    elif a.exp == "size":
        plan = [(d, s, n, 2000, models) for n in (100, 300, 1000, 3000, 10000) for d in datasets for s in range(3)]
    elif a.exp == "imbalance":
        plan = [(d, s, 1000, 2000, models) for d in datasets for s in range(5)]
    elif a.exp == "tune":
        plan = [(d, s, 1000, 2000, [m for m in models if m in TUNE_SPACES]) for d in datasets for s in range(3)]

    # TabPFN runs in-process with all threads; everything else fans out one thread per job.
    heavy = [p for p in plan if "TabPFN v2" in p[4]]
    light = [(d, s, n, nt, [m for m in ms if m != "TabPFN v2"]) for d, s, n, nt, ms in plan]
    with open(path, "a") as fh:
        def write(rows):
            for r in rows:
                fh.write(json.dumps(r) + "\n")
            fh.flush()
        jobs = (delayed(task)(a.exp, d, a.data, s, n, nt, ms, done.get((d.split("/")[1], s, n), set()), 1)
                for d, s, n, nt, ms in light if ms)
        for rows in Parallel(n_jobs=a.jobs, return_as="generator_unordered")(jobs):
            write(rows)
        if heavy:
            import torch
            torch.set_num_threads(a.jobs)
            for i, (d, s, n, nt, _) in enumerate(heavy):
                write(task(a.exp, d, a.data, s, n, nt, ["TabPFN v2"],
                           done.get((d.split("/")[1], s, n), set()), a.jobs))
                print(f"tabpfn {i + 1}/{len(heavy)} {d} seed={s} n={n}", flush=True)
    print("done", path)


if __name__ == "__main__":
    sys.exit(main())
