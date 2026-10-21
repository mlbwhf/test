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
expect "https://app.$d/login?mode=signup" 200 'Create your free EnrollClass account' || fail=1
expect "https://$d/classes" 200 'Search classes, providers, certifications' || fail=1
expect "https://app.$d/help/promote-a-class" 200 'Promote a course' || fail=1
expect "https://app.$d/help/schedule-builder" 200 'Schedule many dates at once' || fail=1
expect "https://app.$d/verify" 200 'Verify a badge' || fail=1
expect "https://api.$d/issuers/none/did.json" 404 '' || fail=1
expect "https://api.$d/public/v1/invoices/inv_none.bad" 404 '' || fail=1
expect "https://app.$d/help/corporate-invoices" 200 'Invoice a company' || fail=1
expect "https://app.$d/money" 307 "/login?returnTo=" || fail=1
expect "https://app.$d/my/seat/none?email=a@b.co" 200 '' || fail=1
expect "https://app.$d/fonts/instrument-sans-400-600-latin.woff2" 200 '' || fail=1
expect "https://api.$d/mcp" 405 'use POST' || fail=1
expect "https://app.$d/help" 200 'How can we help' || fail=1
expect "https://$d/help/quick-start" 200 'Quick start' || fail=1
expect "https://$d/faq" 200 'FAQPage' || fail=1
expect "https://$d/robots.txt" 200 'Sitemap:' || fail=1
expect "https://$d/sitemap.xml" 200 '<urlset' || fail=1
expect "https://$d/llms.txt" 200 '# EnrollClass' || fail=1
expect "https://app.$d/sitemap.xml" 200 '<urlset' || fail=1
expect "https://api.$d/public/v1/fees" 200 '"direct"' || fail=1
expect "https://$d/pricing" 200 'certification seat costs you' || fail=1
expect "https://$d/how-it-works" 200 'A course, step by step' || fail=1
expect "https://$d/instructors" 200 'Schedule builder' || fail=1
expect "https://$d/" 200 'On this page' || fail=1
expect "https://$d/help/payment-modes" 200 'Protected or Direct' || fail=1
exit $fail
