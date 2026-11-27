"""Synthetic 1s BTC returns (GARCH-like with t innovations) for offline testing."""
from __future__ import annotations

import numpy as np


def simulate_returns(seconds: int, seed: int = 0, nu: float = 4.0,
                     base_vol_annual: float = 0.5) -> np.ndarray:
    rng = np.random.default_rng(seed)
    base = base_vol_annual ** 2 / (365 * 24 * 3600)    # per-second variance
    omega, alpha, beta = base * 0.002, 0.03, 0.968       # persistence 0.998
    var = base
    out = np.empty(seconds)
    scale = np.sqrt((nu - 2) / nu)
    for i in range(seconds):
        e = rng.standard_t(nu) * scale
        out[i] = np.sqrt(var) * e
        var = omega + alpha * out[i] ** 2 + beta * var
    return out


def simulate_book(fair: float, rng: np.random.Generator, noise: float = 0.04,
                  spread: float = 0.01, depth: float = 200.0):
    """Toy book: market's mid = fair + noise. Used only for pipeline tests."""
    mid = float(np.clip(fair + rng.normal(0, noise), 0.02, 0.98))
    up = [(round(min(0.99, mid + spread / 2 + 0.01 * i), 2), depth) for i in range(3)]
    dn = [(round(min(0.99, 1 - mid + spread / 2 + 0.01 * i), 2), depth) for i in range(3)]
    return up, dn
