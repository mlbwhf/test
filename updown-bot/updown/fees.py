"""Polymarket taker fee model for crypto Up/Down markets.

Polymarket charges taker fees on its short-dated crypto markets that peak near
50c and vanish toward 0/1. Default (configurable, VERIFY against current docs):

    fee_per_share = price * FEE_RATE * (price * (1 - price)) ** FEE_EXP

Makers pay no fee. Set FEE_RATE=0 for fee-free markets.
"""
from __future__ import annotations

FEE_RATE = 0.25
FEE_EXP = 2.0


def taker_fee_per_share(price: float, rate: float = FEE_RATE, exp: float = FEE_EXP) -> float:
    return price * rate * (price * (1.0 - price)) ** exp


def all_in_cost(price: float, rate: float = FEE_RATE, exp: float = FEE_EXP) -> float:
    """Cost per contract including the taker fee (pays $1 if it wins)."""
    return price + taker_fee_per_share(price, rate, exp)
