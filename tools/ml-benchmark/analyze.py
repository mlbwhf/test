"""Summarise bench.py results into content-ops/ml-models/bench-summary.json."""
import json, os, sys
from collections import defaultdict
from itertools import combinations

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "results")
OUT = os.path.join(HERE, "..", "..", "content-ops", "ml-models", "bench-summary.json")
sys.path.insert(0, HERE)
from bench import MODEL_ORDER  # noqa: E402


def rows(exp):
    p = os.path.join(RES, f"{exp}.jsonl")
    if not os.path.exists(p):
        return []
    out = [json.loads(l) for l in open(p)]
    errs = [r for r in out if "error" in r]
    if errs:
        print(exp, "errors:", len(errs), errs[0]["model"], errs[0]["error"][:150])
    return [r for r in out if "error" not in r]


def kendall(a, b):
    """Kendall tau between two rankings given as dicts model->rank."""
    keys = [k for k in a if k in b]
    c = d = 0
    for x, y in combinations(keys, 2):
        s = (a[x] - a[y]) * (b[x] - b[y])
        c += s > 0
        d += s < 0
    return (c - d) / max(c + d, 1)


def ranks(scores):
    """Average ranks (1 = best) for a dict model->score, ties shared."""
    items = sorted(scores.items(), key=lambda kv: -kv[1])
    out, i = {}, 0
    while i < len(items):
        j = i
        while j + 1 < len(items) and abs(items[j + 1][1] - items[i][1]) < 1e-12:
            j += 1
        for k in range(i, j + 1):
            out[items[k][0]] = (i + j) / 2 + 1
        i = j + 1
    return out


def summarise_main(R, metric="acc"):
    by_ds = defaultdict(lambda: defaultdict(list))
    for r in R:
        by_ds[r["dataset"]][r["model"]].append(r[metric])
    models = [m for m in MODEL_ORDER if any(m in v for v in by_ds.values())]
    ds_mean = {d: {m: float(np.mean(v[m])) for m in models if m in v} for d, v in by_ds.items()}
    ds_rank = {d: ranks(s) for d, s in ds_mean.items()}
    table = []
    for m in models:
        vals = [ds_mean[d][m] for d in ds_mean if m in ds_mean[d]]
        table.append(dict(model=m, mean=float(np.mean(vals)), median=float(np.median(vals)),
                          mean_rank=float(np.mean([ds_rank[d][m] for d in ds_rank if m in ds_rank[d]])),
                          wins=sum(1 for d in ds_rank if ds_rank[d].get(m) == min(ds_rank[d].values())),
                          top3=sum(1 for d in ds_rank if ds_rank[d].get(m, 99) <= 3),
                          n_datasets=len(vals)))
    table.sort(key=lambda t: t["mean_rank"])
    return dict(table=table, per_dataset={d: {m: round(v, 4) for m, v in s.items()} for d, s in ds_mean.items()},
                per_dataset_rank=ds_rank, models=models)


def single_split(R):
    """How much one dataset + one random split can mislead."""
    overall = {t["model"]: t["mean_rank"] for t in summarise_main(R)["table"]}
    overall_rank = ranks({m: -v for m, v in overall.items()})
    best = min(overall_rank, key=overall_rank.get)
    runs = defaultdict(dict)
    for r in R:
        runs[(r["dataset"], r["seed"])][r["model"]] = r["acc"]
    winners = defaultdict(int)
    taus, best_first, spread = [], 0, []
    for key, sc in runs.items():
        rk = ranks(sc)
        top = [m for m, v in rk.items() if v == min(rk.values())]
        for m in top:
            winners[m] += 1 / len(top)
        taus.append(kendall(rk, overall_rank))
        best_first += best in top
        spread.append(max(sc.values()) - sorted(sc.values())[-2] if len(sc) > 1 else 0)
    # same dataset, different split: how often the winner changes
    by_ds = defaultdict(list)
    for (d, s), sc in runs.items():
        rk = ranks(sc)
        by_ds[d].append(min(rk, key=rk.get))
    distinct_winners_per_ds = {d: len(set(w)) for d, w in by_ds.items()}
    # seed-to-seed accuracy range per model per dataset
    rng = defaultdict(list)
    tmp = defaultdict(list)
    for r in R:
        tmp[(r["dataset"], r["model"])].append(r["acc"])
    for (d, m), v in tmp.items():
        rng[m].append(max(v) - min(v))
    return dict(n_runs=len(runs), overall_best=best,
                winner_share={m: round(v / len(runs), 4) for m, v in sorted(winners.items(), key=lambda kv: -kv[1])},
                distinct_winners=len(winners), mean_kendall_tau=float(np.mean(taus)),
                share_runs_overall_best_first=best_first / len(runs),
                mean_gap_first_second=float(np.mean(spread)),
                distinct_winners_per_dataset=distinct_winners_per_ds,
                mean_split_range_by_model={m: float(np.mean(v)) for m, v in rng.items()})


def by_model_mean(R, key, variant=None, group=None):
    acc = defaultdict(list)
    for r in R:
        if variant and r["variant"] != variant:
            continue
        acc[(r["model"],) + ((r[group],) if group else ())].append(r[key])
    return {k: float(np.mean(v)) for k, v in acc.items()}


def main():
    S = {"generated_from": "tools/ml-benchmark/results/*.jsonl"}
    R = rows("main")
    if R:
        S["main_acc"] = summarise_main(R, "acc")
        S["main_auc"] = summarise_main(R, "auc")
        S["single_split"] = single_split(R)
        t = defaultdict(list)
        for r in R:
            t[r["model"]].append(r["fit_s"] + r["pred_s"])
        S["time_median_s"] = {m: float(np.median(v)) for m, v in t.items()}
        S["datasets"] = sorted({r["dataset"] for r in R})
        from bench import DATASETS, load
        info = {}
        for key in DATASETS:
            X, y = load("/home/user/ml-data", key)
            info[key.split("/")[1]] = dict(rows=int(X.shape[0]), features=int(X.shape[1]), folder=key.split("/")[0])
        S["dataset_info"] = info
        S["n_rows_main"] = len(R)
    N = rows("noscale")
    if N and R:
        scaled = by_model_mean([r for r in R if r["model"] in {x["model"] for x in N}], "acc")
        raw = by_model_mean(N, "acc")
        S["noscale"] = {m[0]: dict(scaled=scaled[m], unscaled=raw[m], delta=raw[m] - scaled[m]) for m in raw}
    Z = rows("size")
    if Z:
        need = {100, 300, 1000, 3000, 10000}
        have = defaultdict(set)
        for r in Z:
            have[r["dataset"]].add(r["n_train"])
        common = sorted(d for d, s in have.items() if need <= s)
        curve = defaultdict(dict)
        for (m, n), v in by_model_mean([r for r in Z if r["dataset"] in common], "acc", group="n_train").items():
            curve[m][n] = v
        rk = {}
        for n in sorted(need):
            sc = {m: curve[m][n] for m in curve if n in curve[m]}
            rk[n] = ranks(sc)
        S["size"] = dict(common_datasets=common, curve=curve, rank_by_n=rk)
    I = rows("imbalance")
    if I:
        S["imbalance"] = {m[0]: dict(acc=v, bal_acc=by_model_mean(I, "bal_acc")[m], auc=by_model_mean(I, "auc")[m])
                          for m, v in by_model_mean(I, "acc").items()}
    T = rows("tune")
    if T:
        d = by_model_mean(T, "acc", variant="default")
        t = by_model_mean(T, "acc", variant="tuned")
        S["tune"] = {m[0]: dict(default=d[m], tuned=t[m], delta=t[m] - d[m]) for m in d if m in t}
        S["tune_rank_default"] = ranks({m[0]: v for m, v in d.items() if m in t})
        S["tune_rank_tuned"] = ranks({m[0]: v for m, v in t.items()})
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(S, open(OUT, "w"), indent=1, default=float)
    print("wrote", os.path.normpath(OUT))
    if "main_acc" in S:
        for t in S["main_acc"]["table"]:
            print(f"{t['model']:28s} acc {t['mean']:.4f} rank {t['mean_rank']:.2f} wins {t['wins']}")


if __name__ == "__main__":
    main()
