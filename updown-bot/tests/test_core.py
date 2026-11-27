import numpy as np
import pytest

from updown.calibrate import calibrate
from updown.fees import all_in_cost, taker_fee_per_share
from updown.har import fit_har
from updown.pricing import p_up
from updown.sim import simulate_returns
from updown.strategy import Config, complete_set_edge, decide


def test_p_up_symmetry_and_monotonic():
    assert p_up(100, 100, 1e-4) == pytest.approx(0.5)
    assert p_up(101, 100, 1e-4) > 0.5 > p_up(99, 100, 1e-4)
    # same gap is harder to close when vol is low
    assert p_up(99.9, 100, 1e-6) < p_up(99.9, 100, 1e-4)
    assert p_up(100, 100, 1e-4) + (1 - p_up(100, 100, 1e-4)) == pytest.approx(1)


def test_fee_peaks_mid():
    assert taker_fee_per_share(0.5) > taker_fee_per_share(0.9)
    assert all_in_cost(0.57) > 0.57


def test_decide_example_from_spec():
    # model 62c, ask 57c -> enters UP when edge clears threshold
    cfg = Config(min_edge=0.02, fee_rate=0.0)
    d = decide(0.62, 300, [(0.57, 500)], [(0.45, 500)], cfg)
    assert d.side == "UP" and d.edge == pytest.approx(0.05)
    assert d.stake <= cfg.max_stake
    assert decide(0.62, 300, [(0.61, 500)], [(0.45, 500)], cfg).side is None


def test_complete_set():
    e, n = complete_set_edge([(0.48, 10)], [(0.49, 20)], Config(fee_rate=0.0))
    assert e == pytest.approx(0.03) and n == 10


def test_har_fit_and_calibration_on_sim():
    r = simulate_returns(4 * 24 * 3600 // 4, seed=1)  # 24h
    m = fit_har(r)
    assert m.beta[1:].sum() > 0.3  # recent RV is informative
    res = calibrate(r)
    oos = res["oos"]
    assert oos["n"] > 100
    assert oos["brier"] < oos["brier_coinflip"]
    assert 2.5 <= res["nu"] <= 30
