"""Entry decision: compare model fair value against the executable ask."""
from __future__ import annotations

from dataclasses import dataclass

from .fees import FEE_EXP, FEE_RATE, all_in_cost


@dataclass
class Config:
    min_edge: float = 0.04          # minimum modeled edge per contract, in $ (4c)
    max_stake: float = 100.0        # $ per trade cap
    bankroll: float = 1000.0
    kelly_fraction: float = 0.25    # fractional Kelly
    min_tau: float = 20.0           # don't enter in the last N seconds (feed/latency risk)
    max_tau: float = 900.0
    min_price: float = 0.03         # skip near-certain contracts
    max_price: float = 0.97
    fee_rate: float = FEE_RATE
    fee_exp: float = FEE_EXP


@dataclass
class Decision:
    side: str | None                # "UP", "DOWN" or None
    fair: float = 0.0
    cost: float = 0.0
    edge: float = 0.0
    shares: float = 0.0
    stake: float = 0.0
    limit_price: float = 0.0
    reason: str = ""


def walk_book(asks: list[tuple[float, float]], max_dollars: float, fair: float,
              min_edge: float, cfg: Config) -> tuple[float, float, float]:
    """Take ask levels (price asc) while each level still clears min_edge.

    Returns (shares, dollars_spent_incl_fees, worst_price).
    """
    shares = spent = worst = 0.0
    for price, size in sorted(asks):
        unit = all_in_cost(price, cfg.fee_rate, cfg.fee_exp)
        if fair - unit < min_edge or not (cfg.min_price <= price <= cfg.max_price):
            break
        take = min(size, (max_dollars - spent) / unit)
        if take <= 0:
            break
        shares += take
        spent += take * unit
        worst = price
        if spent >= max_dollars - 1e-9:
            break
    return shares, spent, worst


def kelly_stake(fair: float, cost: float, cfg: Config) -> float:
    """Kelly for a $1-payout binary bought at `cost`: f* = (p - c) / (1 - c)."""
    if cost >= 1.0 or fair <= cost:
        return 0.0
    f = (fair - cost) / (1.0 - cost)
    return min(cfg.max_stake, cfg.bankroll * f * cfg.kelly_fraction)


def decide(p_up: float, tau: float, up_asks: list[tuple[float, float]],
           down_asks: list[tuple[float, float]], cfg: Config) -> Decision:
    if not (cfg.min_tau <= tau <= cfg.max_tau):
        return Decision(None, reason=f"tau {tau:.0f}s outside window")
    best = Decision(None, reason="no edge")
    for side, fair, asks in (("UP", p_up, up_asks), ("DOWN", 1.0 - p_up, down_asks)):
        if not asks:
            continue
        top = min(p for p, _ in asks)
        cost = all_in_cost(top, cfg.fee_rate, cfg.fee_exp)
        edge = fair - cost
        if edge < cfg.min_edge or edge <= best.edge:
            continue
        budget = kelly_stake(fair, cost, cfg)
        shares, spent, worst = walk_book(asks, budget, fair, cfg.min_edge, cfg)
        if shares <= 0:
            continue
        best = Decision(side, fair=fair, cost=spent / shares, edge=fair - spent / shares,
                        shares=shares, stake=spent, limit_price=worst, reason="edge")
    return best


def complete_set_edge(up_asks: list[tuple[float, float]], down_asks: list[tuple[float, float]],
                      cfg: Config) -> tuple[float, float]:
    """Locked profit per pair from buying 1 Up + 1 Down at the top of book.

    A complete set always settles at $1, so if all-in cost < 1 the gap is riskless
    (apart from execution risk: one leg fills, the other moves). Returns
    (edge_per_pair, max_pairs_at_top).
    """
    if not up_asks or not down_asks:
        return 0.0, 0.0
    pu, su = min(up_asks)
    pd, sd = min(down_asks)
    cost = all_in_cost(pu, cfg.fee_rate, cfg.fee_exp) + all_in_cost(pd, cfg.fee_rate, cfg.fee_exp)
    return 1.0 - cost, min(su, sd)
