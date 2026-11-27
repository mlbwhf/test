"""CLI: calibrate | run | record.

    python -m updown.bot calibrate --hours 24
    python -m updown.bot run              # paper trading (default)
    python -m updown.bot run --live       # real orders (needs py-clob-client + env)
    python -m updown.bot record           # log books + model fair value for later backtests
"""
from __future__ import annotations

import argparse
import json
import logging
import time
from dataclasses import asdict
from pathlib import Path

import numpy as np

from . import feeds
from .calibrate import calibrate
from .executor import LiveExecutor, PaperExecutor
from .har import HARModel
from .pricing import p_up
from .strategy import Config, complete_set_edge, decide

log = logging.getLogger("updown")
STATE = Path("state")
MODEL_PATH = STATE / "model.json"


def load_model() -> tuple[HARModel, float]:
    if MODEL_PATH.exists():
        d = json.loads(MODEL_PATH.read_text())
        return HARModel.from_dict(d["har"]), float(d["nu"])
    log.warning("no calibrated model at %s; using default prior (run `calibrate` first)", MODEL_PATH)
    return HARModel.default(), 4.0


def cmd_calibrate(a):
    while True:
        try:
            _calibrate_once(a)
        except Exception:  # noqa: BLE001
            log.exception("calibration failed")
            if not a.every:
                raise
        if not a.every:
            return
        time.sleep(a.every * 3600)


def _calibrate_once(a):
    kl = feeds.btc_history_1s(int(a.hours * 3600))
    r = feeds.log_returns(kl)
    res = calibrate(r)
    STATE.mkdir(exist_ok=True)
    tmp = MODEL_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(res, indent=2))
    tmp.replace(MODEL_PATH)  # atomic so the trader never reads a half-written file
    log.info("calibrated: nu=%.2f oos=%s", res["nu"], {k: res["oos"].get(k) for k in ("n", "brier", "brier_coinflip")})


def snapshot(model: HARModel, nu: float, asset: str, period: int, strikes: dict):
    now = time.time()
    m = feeds.find_market(now, asset, period)
    if not m:
        return None
    if m["slug"] not in strikes:
        strikes[m["slug"]] = float(m["price_to_beat"] or feeds.strike_from_binance(m["start"]))
    K = strikes[m["slug"]]
    kl = feeds.btc_klines_1s(limit=1000)
    r = feeds.log_returns(kl)
    S = float(kl[-1, 2])
    tau = m["end"] - now
    v = model.variance(r, tau)
    pu = p_up(S, K, v, nu)
    up = feeds.order_book(m["up_token"])
    dn = feeds.order_book(m["down_token"])
    return m, S, K, tau, v, pu, up, dn



def cmd_run(a):
    model, nu = load_model()
    cfg = Config(min_edge=a.min_edge, max_stake=a.max_stake, bankroll=a.bankroll)
    logp = STATE / ("live.jsonl" if a.live else "paper.jsonl")
    STATE.mkdir(exist_ok=True)
    ex = LiveExecutor(logp) if a.live else PaperExecutor(logp)
    traded = {f.slug for f in ex.fills}
    pending = {f.slug: (f.end, f.strike) for f in ex.fills if not f.settled and f.end}
    strikes = {}
    if traded:
        log.info("restored %d traded markets, %d awaiting settlement", len(traded), len(pending))
    day_pnl, errors = 0.0, 0
    log.info("starting %s mode, cfg=%s", ex.mode, asdict(cfg))
    model_mtime = MODEL_PATH.stat().st_mtime if MODEL_PATH.exists() else 0
    while True:
        (STATE / "heartbeat").write_text(str(time.time()))
        if MODEL_PATH.exists() and MODEL_PATH.stat().st_mtime != model_mtime:
            model, nu = load_model()
            model_mtime = MODEL_PATH.stat().st_mtime
            log.info("reloaded model nu=%.2f beta=%s", nu, model.beta.round(3).tolist())
        try:
            # settle finished markets (paper: settle off Binance close; live: Polymarket pays out)
            for slug, (end, K) in list(pending.items()):
                if time.time() > end + 5:
                    close = float(feeds.btc_klines_1s(end_ms=end * 1000, limit=1)[-1, 2])
                    pnl = ex.settle(slug, close >= K)
                    day_pnl += pnl
                    cfg.bankroll += pnl
                    log.info("settled %s up=%s pnl=%.2f day=%.2f", slug, close >= K, pnl, day_pnl)
                    del pending[slug]
            if day_pnl <= -a.max_daily_loss:
                log.error("daily loss limit hit (%.2f); stopping", day_pnl)
                return
            snap = snapshot(model, nu, a.asset, a.period, strikes)
            if snap is None:
                time.sleep(a.poll)
                continue
            m, S, K, tau, v, pu, up, dn = snap
            cs_edge, cs_size = complete_set_edge(up["asks"], dn["asks"], cfg)
            if cs_edge > 0:
                log.info("complete-set gap %.3f x %.0f on %s", cs_edge, cs_size, m["slug"])
            if m["slug"] not in traded:
                d = decide(pu, tau, up["asks"], dn["asks"], cfg)
                log.info("%s S=%.1f K=%.1f tau=%3.0f sd=%.4f%% pUp=%.3f upAsk=%s dnAsk=%s -> %s %.3f",
                         m["slug"], S, K, tau, 100 * np.sqrt(v), pu,
                         up["asks"][:1], dn["asks"][:1], d.side, d.edge)
                if d.side:
                    tok = m["up_token"] if d.side == "UP" else m["down_token"]
                    ex.buy(m["slug"], d.side, tok, d.shares, d.limit_price, d.cost, d.fair,
                           end=m["end"], strike=K)
                    traded.add(m["slug"])
                    pending[m["slug"]] = (m["end"], K)
            errors = 0
        except Exception as e:  # noqa: BLE001
            errors += 1
            log.exception("loop error (%d)", errors)
            if errors >= 5:
                log.error("5 consecutive errors, pausing 60s")
                time.sleep(60)
                errors = 0
        time.sleep(a.poll)


def cmd_record(a):
    model, nu = load_model()
    out = STATE / "books.jsonl"
    STATE.mkdir(exist_ok=True)
    strikes = {}
    model_mtime = MODEL_PATH.stat().st_mtime if MODEL_PATH.exists() else 0
    while True:
        if MODEL_PATH.exists() and MODEL_PATH.stat().st_mtime != model_mtime:
            model, nu = load_model()
            model_mtime = MODEL_PATH.stat().st_mtime
        try:
            snap = snapshot(model, nu, a.asset, a.period, strikes)
            if snap:
                m, S, K, tau, v, pu, up, dn = snap
                with out.open("a") as fh:
                    fh.write(json.dumps({"ts": time.time(), "slug": m["slug"], "S": S, "K": K,
                                         "tau": tau, "v": v, "p_up": pu,
                                         "up": up["asks"][:5], "down": dn["asks"][:5]}) + "\n")
        except Exception:  # noqa: BLE001
            log.exception("record error")
        time.sleep(a.poll)


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("calibrate"); c.add_argument("--hours", type=float, default=24)
    c.add_argument("--every", type=float, default=0, help="repeat every N hours (0 = once)")
    for name in ("run", "record"):
        s = sub.add_parser(name)
        s.add_argument("--asset", default="btc")
        s.add_argument("--period", type=int, default=900, choices=[300, 900, 3600])
        s.add_argument("--poll", type=float, default=2.0)
        if name == "run":
            s.add_argument("--live", action="store_true")
            s.add_argument("--min-edge", type=float, default=0.04)
            s.add_argument("--max-stake", type=float, default=50.0)
            s.add_argument("--bankroll", type=float, default=1000.0)
            s.add_argument("--max-daily-loss", type=float, default=200.0)
    a = p.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    {"calibrate": cmd_calibrate, "run": cmd_run, "record": cmd_record}[a.cmd](a)


if __name__ == "__main__":
    main()
