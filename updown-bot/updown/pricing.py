"""Student-t valuation of an Up/Down binary.

    p_Up = 1 - T_nu[(ln(K/S) - mu_tau) / s_tau]

s_tau is chosen so the t distribution's variance equals the HAR forecast:
    Var(t_nu * s) = s^2 * nu/(nu-2) = v_tau  =>  s_tau = sqrt(v_tau * (nu-2)/nu)
"""
from __future__ import annotations

import math

import numpy as np
from scipy import stats


def p_up(S: float, K: float, v_tau: float, nu: float = 4.0, mu_tau: float = 0.0) -> float:
    if S <= 0 or K <= 0:
        raise ValueError("prices must be positive")
    if v_tau <= 0:
        return 1.0 if S > K else (0.0 if S < K else 0.5)
    if nu <= 2:
        raise ValueError("nu must be > 2 for finite variance")
    s_tau = math.sqrt(v_tau * (nu - 2.0) / nu)
    z = (math.log(K / S) - mu_tau) / s_tau
    # Polymarket resolves Up if close >= open, so ties go to Up: P(r >= ln K/S)
    return float(stats.t.sf(z, nu))


def fit_nu(standardized: np.ndarray, grid=np.arange(2.5, 30.01, 0.25)) -> float:
    """MLE for nu on returns already divided by sqrt(v_tau) (unit variance)."""
    z = np.asarray(standardized, float)
    z = z[np.isfinite(z)]
    best, best_ll = 4.0, -np.inf
    for nu in grid:
        scale = math.sqrt((nu - 2) / nu)
        ll = stats.t.logpdf(z, nu, scale=scale).sum()
        if ll > best_ll:
            best, best_ll = float(nu), ll
    return best
