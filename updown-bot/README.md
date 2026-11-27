# updown-bot — HAR volatility + Student-t valuation for Polymarket BTC Up/Down

Holds each position to settlement. Paper trading is the default.

## How it works
1. **HAR volatility** (`updown/har.py`) — `ln v = b0 + b1 ln RV1 + b5 ln RV5 + b15 ln RV15`, with
   RV over the last 1/5/15 min of 1-second BTC returns, as per-second rates. Scaled by the
   time remaining τ (log-normal bias corrected) to get `v_τ`.
2. **Student-t valuation** (`updown/pricing.py`) — `p_Up = 1 − T_ν[(ln(K/S) − μ_τ)/s_τ]`, with
   `s_τ = sqrt(v_τ (ν−2)/ν)` so the t variance equals the HAR forecast. ν is fitted by MLE.
3. **Entry** (`updown/strategy.py`) — edge = fair − (ask + taker fee). Enters only if the edge is at least
   `--min-edge`. Walks the ask book level by level while each level still clears the threshold.
   Size = fractional Kelly, capped by `--max-stake`. One entry per market, held to settlement.
4. **Complete-set check** — logs whenever Up ask + Down ask, after fees, costs less than $1.

## Usage
```
pip install -r requirements.txt
python -m updown.bot calibrate --hours 48     # fit HAR + ν on Binance 1s data, prints OOS Brier/reliability
python -m updown.bot record                    # log real books + model value -> state/books.jsonl
python -m updown.bot run                       # paper trade -> state/paper.jsonl
pip install py-clob-client
POLY_PRIVATE_KEY=... POLY_FUNDER=0x... python -m updown.bot run --live --max-stake 10
python -m pytest -q tests
```

## Verify before going live
- **Strike basis**: Polymarket settles on the Chainlink BTC/USD price. This bot uses the event's
  `priceToBeat` when Gamma provides it, otherwise the Binance 1s open. A few dollars of basis is
  a lot of edge when S≈K and τ is small.
- **Fees**: `updown/fees.py` uses a configurable taker-fee curve. Check it against Polymarket's current fee docs.
- **Slugs/API fields** in `updown/feeds.py` (`btc-updown-15m-<ts>`, `eventMetadata.priceToBeat`)
  were written without live API access. Check them against a real response.
- Calibration only shows the model is *calibrated*. Profit depends on the market being *less*
  calibrated than the model at the prices you can actually fill. Use `record` for several days and
  backtest against those books before risking money.

## Deploy (VPS)
`.github/workflows/updown-deploy.yml` tests, builds `ghcr.io/mlbwhf/updown-bot`, and rolls it onto the
VPS over SSH with the existing `DEPLOY_*` secrets. It runs on every push to `updown-bot/**`, or by hand
from the Actions tab.
On the server, `~/updown` (the `deploy` user's home) holds:
- `docker-compose.yml` with three services: `calibrate` (refits every 24h), `trader` (paper by default)
  and `recorder` (logs real books to `state/books.jsonl` for backtests)
- `.env`, created from `env.example` on first deploy and never overwritten afterwards
- `state/`: `model.json`, `paper.jsonl` / `live.jsonl`, `books.jsonl`

```
ssh deploy@VPS 'cd ~/updown && docker compose logs -f trader'
ssh deploy@VPS 'cd ~/updown && tail -n 20 state/paper.jsonl'
```
To go live: in `~/updown/.env` set `UPDOWN_MODE=live`, `POLY_PRIVATE_KEY`, `POLY_FUNDER`, then
`docker compose up -d`. Polymarket blocks order placement from some countries (including the US),
so check where the VPS is located first.
