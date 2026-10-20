#!/usr/bin/env bash
# Check the live site from the outside, the way a visitor reaches it.
#   ./smoke.sh enrollclass.com
# Retries for up to two minutes while containers and certificates settle.
set -uo pipefail
d=${1:-enrollclass.com}
deadline=$((SECONDS + 120))

# expect <url> <status> [text that must appear in the body | location prefix for redirects]
expect() {
  local url=$1 want=$2 needle=${3:-} out code loc body
  while :; do
    out=$(curl -sS --max-time 20 -o /tmp/smoke.body -w '%{http_code} %{redirect_url}' "$url" 2>&1) || out="000 $out"
    code=${out%% *}; loc=${out#* }; body=$(cat /tmp/smoke.body 2>/dev/null || true)
    if [ "$code" = "$want" ] && { [ -z "$needle" ] || [[ "$body" == *"$needle"* ]] || [[ "$loc" == *"$needle"* ]]; }; then
      printf 'ok    %-45s %s\n' "$url" "$code"; return 0
    fi
    [ $SECONDS -ge $deadline ] && { printf 'FAIL  %-45s got %s %s (wanted %s %s)\n' "$url" "$code" "$loc" "$want" "$needle"; return 1; }
    sleep 5
  done
}

fail=0
expect "https://api.$d/health" 200 '"ok":true' || fail=1
expect "https://api.$d/auth/providers" 200 '"providers"' || fail=1
expect "https://$d/" 200 'Start with one cohort' || fail=1
expect "https://$d/terms" 200 'Terms of service' || fail=1
expect "https://www.$d/" 308 "https://$d/" || fail=1
expect "https://app.$d/login" 200 'Sign in to EnrollClass' || fail=1
expect "https://app.$d/login?mode=signup" 200 'Create your EnrollClass account' || fail=1
expect "https://app.$d/money" 307 "/login?returnTo=" || fail=1
expect "https://app.$d/my/seat/none?email=a@b.co" 200 '' || fail=1
exit $fail
