"""Paper and live executors. Live requires py-clob-client and env credentials."""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path


@dataclass
class Fill:
    ts: float
    slug: str
    side: str
    shares: float
    cost: float          # avg all-in cost per share
    fair: float
    limit_price: float
    mode: str
    settled: bool = False
    payout: float = 0.0


@dataclass
class PaperExecutor:
    log_path: Path
    fills: list[Fill] = field(default_factory=list)
    mode: str = "paper"

    def buy(self, slug, side, token_id, shares, limit_price, cost, fair) -> Fill:
        f = Fill(time.time(), slug, side, shares, cost, fair, limit_price, self.mode)
        self.fills.append(f)
        self._log({"event": "fill", **asdict(f)})
        return f

    def settle(self, slug: str, up_won: bool) -> float:
        pnl = 0.0
        for f in self.fills:
            if f.slug == slug and not f.settled:
                win = (f.side == "UP") == up_won
                f.payout = f.shares if win else 0.0
                f.settled = True
                pnl += f.payout - f.shares * f.cost
                self._log({"event": "settle", **asdict(f)})
        return pnl

    def _log(self, rec: dict):
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        with self.log_path.open("a") as fh:
            fh.write(json.dumps(rec) + "\n")


class LiveExecutor(PaperExecutor):
    """Fill-or-kill limit buys via the official Polymarket CLOB client.

    Env: POLY_PRIVATE_KEY, POLY_FUNDER (proxy wallet address), POLY_SIG_TYPE (default 1).
    """

    def __init__(self, log_path: Path):
        super().__init__(log_path=log_path, mode="live")
        from py_clob_client.client import ClobClient  # type: ignore
        self.client = ClobClient(
            "https://clob.polymarket.com", chain_id=137,
            key=os.environ["POLY_PRIVATE_KEY"],
            signature_type=int(os.environ.get("POLY_SIG_TYPE", "1")),
            funder=os.environ["POLY_FUNDER"],
        )
        self.client.set_api_creds(self.client.create_or_derive_api_creds())

    def buy(self, slug, side, token_id, shares, limit_price, cost, fair) -> Fill:
        from py_clob_client.clob_types import OrderArgs, OrderType  # type: ignore
        from py_clob_client.order_builder.constants import BUY  # type: ignore
        order = self.client.create_order(OrderArgs(
            token_id=token_id, price=round(limit_price, 2), size=round(shares, 2), side=BUY))
        resp = self.client.post_order(order, OrderType.FOK)
        self._log({"event": "order_resp", "slug": slug, "side": side, "resp": resp})
        if not resp or not resp.get("success"):
            raise RuntimeError(f"order rejected: {resp}")
        return super().buy(slug, side, token_id, shares, limit_price, cost, fair)
