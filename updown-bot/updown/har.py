"""HAR realized-variance model.

    ln(v) = b0 + b1 ln(RV1) + b5 ln(RV5) + b15 ln(RV15)

All variances are expressed as *per-second rates* (RV_k / window_seconds) so a
single fitted model can be scaled to any remaining horizon tau:

    v_tau = exp(pred) * exp(sigma_resid^2 / 2) * tau      (log-normal bias fix)
"""
from __future__ import annotations

from dataclasses import dataclass, asdict

import numpy as np

WINDOWS = (60, 300, 900)  # 1, 5, 15 minutes in seconds
_EPS = 1e-14


def realized_var(log_ret: np.ndarray, window: int) -> float:
    """Sum of squared 1-second log returns over the last `window` seconds."""
    r = log_ret[-window:]
    return float(np.dot(r, r))


def har_features(log_ret: np.ndarray) -> np.ndarray:
    """[1, ln RV1/60, ln RV5/300, ln RV15/900] from trailing 1s returns."""
    if len(log_ret) < WINDOWS[-1]:
        raise ValueError(f"need >= {WINDOWS[-1]} seconds of returns, got {len(log_ret)}")
    feats = [1.0]
    for w in WINDOWS:
        feats.append(np.log(realized_var(log_ret, w) / w + _EPS))
    return np.array(feats)


@dataclass
class HARModel:
    beta: np.ndarray            # [b0, b1, b5, b15]
    resid_var: float            # variance of log-residuals (bias correction)
    n_obs: int = 0

    def rate(self, log_ret: np.ndarray) -> float:
        """Forecast per-second variance rate."""
        x = har_features(log_ret)
        return float(np.exp(x @ self.beta + 0.5 * self.resid_var))

    def variance(self, log_ret: np.ndarray, tau_seconds: float) -> float:
        """v_tau: forecast return variance over the remaining tau seconds."""
        return self.rate(log_ret) * max(tau_seconds, 1.0)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["beta"] = [float(b) for b in self.beta]
        return d

    @classmethod
    def from_dict(cls, d: dict) -> "HARModel":
        return cls(beta=np.asarray(d["beta"], float), resid_var=float(d["resid_var"]),
                   n_obs=int(d.get("n_obs", 0)))

    @classmethod
    def default(cls) -> "HARModel":
        """Uninformed prior: equal-weight average of the three RV rates."""
        return cls(beta=np.array([0.0, 0.3, 0.35, 0.35]), resid_var=0.25)


def fit_har(log_ret: np.ndarray, horizons=(60, 180, 300, 600, 900), step: int = 30) -> HARModel:
    """OLS fit of future per-second RV on trailing HAR features.

    Samples every `step` seconds; for each sample and each horizon h the target
    is ln(sum r^2 over next h seconds / h). Pooling horizons makes the model
    usable for any time-to-expiry inside a 15-minute market.
    """
    X, y = [], []
    n = len(log_ret)
    start = WINDOWS[-1]
    for t in range(start, n - max(horizons), step):
        x = har_features(log_ret[:t])
        for h in horizons:
            fut = log_ret[t:t + h]
            X.append(x)
            y.append(np.log(np.dot(fut, fut) / h + _EPS))
    X, y = np.asarray(X), np.asarray(y)
    if len(y) < 20:
        raise ValueError("not enough data to fit HAR")
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    resid = y - X @ beta
    return HARModel(beta=beta, resid_var=float(resid.var()), n_obs=len(y))
