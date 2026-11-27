"""Fit HAR coefficients and Student-t nu from 1s BTC returns; evaluate calibration."""
from __future__ import annotations

import numpy as np

from .har import HARModel, WINDOWS, fit_har
from .pricing import fit_nu, p_up


def standardized_residuals(model: HARModel, r: np.ndarray, horizons=(60, 300, 600, 900),
                           step: int = 30) -> np.ndarray:
    z = []
    for t in range(WINDOWS[-1], len(r) - max(horizons), step):
        hist = r[:t]
        rate = model.rate(hist)
        for h in horizons:
            z.append(r[t:t + h].sum() / np.sqrt(rate * h))
    return np.asarray(z)


def calibrate(r: np.ndarray, train_frac: float = 0.7) -> dict:
    """Fit on the first part, report out-of-sample calibration on the rest."""
    n = int(len(r) * train_frac)
    model = fit_har(r[:n])
    nu = fit_nu(standardized_residuals(model, r[:n]))
    report = evaluate(model, nu, r[n - WINDOWS[-1]:])
    return {"har": model.to_dict(), "nu": nu, "oos": report}


def evaluate(model: HARModel, nu: float, r: np.ndarray, period: int = 900,
             check_every: int = 60) -> dict:
    """Simulate 15-min windows: at each check time price p_Up and score vs outcome.

    Strike = price at window start; outcome = sum of returns over the window >= 0.
    Reports Brier score vs. the naive 'last price vs strike with no model' baseline.
    """
    probs, outcomes, base = [], [], []
    logp = np.concatenate([[0.0], np.cumsum(r)])
    start0 = WINDOWS[-1]
    for ws in range(start0, len(r) - period, period):
        k = logp[ws]
        up = logp[ws + period] >= k
        for t in range(ws + check_every, ws + period, check_every):
            tau = ws + period - t
            v = model.variance(r[:t], tau)
            p = p_up(np.exp(logp[t]), np.exp(k), v, nu)
            probs.append(p)
            outcomes.append(float(up))
            base.append(0.5)
    probs, outcomes, base = map(np.asarray, (probs, outcomes, base))
    if len(probs) == 0:
        return {"n": 0}
    brier = float(np.mean((probs - outcomes) ** 2))
    bins = np.linspace(0, 1, 11)
    idx = np.clip(np.digitize(probs, bins) - 1, 0, 9)
    table = []
    for b in range(10):
        m = idx == b
        if m.sum() >= 5:
            table.append({"bin": f"{bins[b]:.1f}-{bins[b+1]:.1f}", "n": int(m.sum()),
                          "pred": round(float(probs[m].mean()), 3),
                          "realized": round(float(outcomes[m].mean()), 3)})
    return {"n": int(len(probs)), "brier": round(brier, 5),
            "brier_coinflip": round(float(np.mean((base - outcomes) ** 2)), 5),
            "reliability": table}
