"""Market data: Binance BTC 1s klines + Polymarket Gamma/CLOB.

The Polymarket "price to beat" is the Chainlink BTC/USD price at window start.
We approximate it with the Binance 1s open at the window start unless the Gamma
event exposes it; expect small basis error vs. Chainlink — measure it before
trusting tiny edges near the strike.
"""
from __future__ import annotations

import json
import time

import numpy as np
import requests

BINANCE = "https://api.binance.com"
GAMMA = "https://gamma-api.polymarket.com"
CLOB = "https://clob.polymarket.com"

_session = requests.Session()
_session.headers["User-Agent"] = "updown-bot/0.1"


def _get(url: str, params: dict | None = None, timeout: float = 5.0):
    r = _session.get(url, params=params, timeout=timeout)
    r.raise_for_status()
    return r.json()


# ---------------- BTC ----------------
def btc_klines_1s(end_ms: int | None = None, limit: int = 1000) -> np.ndarray:
    """Return array of [open_time_ms, open, close] for 1s BTCUSDT klines."""
    p = {"symbol": "BTCUSDT", "interval": "1s", "limit": limit}
    if end_ms:
        p["endTime"] = end_ms
    rows = _get(f"{BINANCE}/api/v3/klines", p)
    return np.array([[r[0], float(r[1]), float(r[4])] for r in rows])


def btc_history_1s(seconds: int) -> np.ndarray:
    """Page backwards to get `seconds` of 1s klines (oldest first)."""
    out, end = [], None
    while sum(len(c) for c in out) < seconds:
        chunk = btc_klines_1s(end_ms=end, limit=1000)
        if len(chunk) == 0:
            break
        out.insert(0, chunk)
        end = int(chunk[0, 0]) - 1
        time.sleep(0.05)
    arr = np.vstack(out)
    _, idx = np.unique(arr[:, 0], return_index=True)
    return arr[idx][-seconds:]


def btc_price() -> float:
    return float(_get(f"{BINANCE}/api/v3/ticker/price", {"symbol": "BTCUSDT"})["price"])


def log_returns(klines: np.ndarray) -> np.ndarray:
    return np.diff(np.log(klines[:, 2]))


# ---------------- Polymarket ----------------
def window_start(now: float, period: int = 900) -> int:
    return int(now // period * period)


def find_market(now: float, asset: str = "btc", period: int = 900) -> dict | None:
    """Look up the current Up/Down market by its deterministic slug.

    Slugs look like 'btc-updown-15m-<window_start_unix>' (5m: 'btc-updown-5m-...').
    """
    label = {300: "5m", 900: "15m", 3600: "1h"}[period]
    start = window_start(now, period)
    slug = f"{asset}-updown-{label}-{start}"
    events = _get(f"{GAMMA}/events", {"slug": slug})
    if not events:
        return None
    ev = events[0]
    m = ev["markets"][0]
    outcomes = json.loads(m["outcomes"]) if isinstance(m["outcomes"], str) else m["outcomes"]
    tokens = json.loads(m["clobTokenIds"]) if isinstance(m["clobTokenIds"], str) else m["clobTokenIds"]
    ids = dict(zip([o.upper() for o in outcomes], tokens))
    meta = ev.get("eventMetadata") or {}
    return {
        "slug": slug,
        "condition_id": m.get("conditionId"),
        "start": start,
        "end": start + period,
        "up_token": ids.get("UP"),
        "down_token": ids.get("DOWN"),
        "price_to_beat": meta.get("priceToBeat"),
        "neg_risk": bool(m.get("negRisk", False)),
        "tick_size": float(m.get("orderPriceMinTickSize") or 0.01),
    }


def order_book(token_id: str) -> dict:
    """{'asks': [(price, size)...] asc, 'bids': [(price, size)...] desc}."""
    b = _get(f"{CLOB}/book", {"token_id": token_id})
    asks = sorted((float(x["price"]), float(x["size"])) for x in b.get("asks", []))
    bids = sorted(((float(x["price"]), float(x["size"])) for x in b.get("bids", [])), reverse=True)
    return {"asks": asks, "bids": bids, "ts": time.time()}


def strike_from_binance(start_ts: int) -> float:
    k = btc_klines_1s(end_ms=(start_ts + 1) * 1000, limit=2)
    row = k[k[:, 0] == start_ts * 1000]
    return float(row[0, 1] if len(row) else k[-1, 2])
