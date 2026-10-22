#!/usr/bin/env bash
# Check the live site from the outside, the way a visitor reaches it.
#   ./smoke.sh plan.agile-agilist.com plan-api.agile-agilist.com
# Retries for up to two minutes while containers and certificates settle.
set -uo pipefail
web=${1:?usage: smoke.sh <web host> <api host>}
api=${2:?usage: smoke.sh <web host> <api host>}
deadline=$((SECONDS + 120))

expect() {
  local url=$1 want=$2 needle=${3:-} out code body
  while :; do
    out=$(curl -sS --max-time 20 -o /tmp/smoke.body -w '%{http_code}' "$url" 2>&1) || out="000"
    code=${out%% *}; body=$(cat /tmp/smoke.body 2>/dev/null || true)
    if [ "$code" = "$want" ] && { [ -z "$needle" ] || [[ "$body" == *"$needle"* ]]; }; then
      printf 'ok    %-50s %s\n' "$url" "$code"; return 0
    fi
    [ $SECONDS -ge $deadline ] && { printf 'FAIL  %-50s got %s (wanted %s %s)\n' "$url" "$code" "$want" "$needle"; return 1; }
    sleep 5
  done
}

fail=0
expect "https://$api/health" 200 '"ok":true' || fail=1
expect "https://$api/health" 200 '"persistence":"postgres"' || fail=1
expect "https://$api/v1/me" 401 'Bearer' || fail=1          # auth is on: admin key or users exist
expect "https://$api/docs/" 200 '' || fail=1
expect "https://$web/login" 200 'Sign in' || fail=1
expect "https://$web/login" 200 "window.__TRAINYARD_API__=\"https://$api\"" || fail=1
expect "https://$web/fonts/instrument-sans-400-600-latin.woff2" 200 '' || fail=1
exit $fail
