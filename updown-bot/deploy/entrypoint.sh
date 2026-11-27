#!/bin/sh
# Roles: run (trader), calibrate (refits model on a schedule), record (logs books for backtests).
set -e
cd /app
role="${1:-run}"
case "$role" in
  calibrate)
    exec python -m updown.bot calibrate --hours "${UPDOWN_CALIB_HOURS:-48}" --every "${UPDOWN_CALIB_EVERY:-24}" ;;
  record)
    exec python -m updown.bot record --period "${UPDOWN_PERIOD:-900}" --poll "${UPDOWN_RECORD_POLL:-5}" ;;
  run)
    # wait up to 15 min for the first calibration; fall back to the prior if it never lands
    i=0; while [ ! -f state/model.json ] && [ $i -lt 90 ]; do sleep 10; i=$((i+1)); done
    live=""
    if [ "${UPDOWN_MODE:-paper}" = "live" ]; then
      [ -n "$POLY_PRIVATE_KEY" ] && [ -n "$POLY_FUNDER" ] || { echo "UPDOWN_MODE=live needs POLY_PRIVATE_KEY and POLY_FUNDER"; exit 1; }
      live="--live"; echo "*** LIVE TRADING ENABLED ***"
    fi
    exec python -m updown.bot run $live \
      --period "${UPDOWN_PERIOD:-900}" --poll "${UPDOWN_POLL:-2}" \
      --min-edge "${UPDOWN_MIN_EDGE:-0.04}" --max-stake "${UPDOWN_MAX_STAKE:-25}" \
      --bankroll "${UPDOWN_BANKROLL:-1000}" --max-daily-loss "${UPDOWN_MAX_DAILY_LOSS:-100}" ;;
  *) exec "$@" ;;
esac
