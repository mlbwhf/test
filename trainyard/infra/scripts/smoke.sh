#!/usr/bin/env bash
# Check the live site from the outside, the way a visitor reaches it.
#   ./smoke.sh trainyard.app api.trainyard.app [web alias ...]
# Any further arguments are web aliases that must redirect (308) to the first host.
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
expect "https://$web/" 200 'application/ld+json' || fail=1
expect "https://$web/robots.txt" 200 'Sitemap' || fail=1
shift 2
web_ips=" $(getent ahostsv4 "$web" | awk '{print $1}' | sort -u | tr '\n' ' ') "
for alias in "$@"; do
  alias_ip=$(getent ahostsv4 "$alias" | awk 'NR==1{print $1}')
  [ -n "$alias_ip" ] || { printf 'skip  %-50s DNS not resolving yet\n' "https://$alias/login"; continue; }
  # An alias that resolves elsewhere (a parking page, the registrar) is a DNS record still to
  # be made, not a broken deploy; deploy.sh skipped it for the same reason.
  # A CDN answers with several addresses per name; any shared address means the same front door.
  [[ "$web_ips" == *" $alias_ip "* ]] || { printf 'skip  %-50s DNS points to %s, not to%s yet\n' "https://$alias/login" "$alias_ip" "$web_ips"; continue; }
  loc=$(curl -sS --max-time 20 -o /dev/null -w '%{http_code} %{redirect_url}' "https://$alias/login" 2>/dev/null || echo "000")
  case "$loc" in 30[18]\ https://$web/login*) printf 'ok    %-50s %s\n' "https://$alias/login" "$loc";; *) printf 'FAIL  %-50s got %s (wanted 308 https://%s/login)\n' "https://$alias/login" "$loc" "$web"; fail=1;; esac
done
exit $fail
