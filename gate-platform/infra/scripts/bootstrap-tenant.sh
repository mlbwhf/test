#!/usr/bin/env bash
# Create the first organization on a fresh production deployment and print its API key.
# Needs GATE_ADMIN_KEY from /opt/gate/.env. Run on the VPS or anywhere with HTTPS access:
#   GATE_DOMAIN=example.com GATE_ADMIN_KEY=... ./bootstrap-tenant.sh "Agile Agilist" CA CAD
set -euo pipefail
name=${1:?organization name}
country=${2:?ISO country, e.g. CA}
currency=${3:?settlement currency, e.g. CAD}
# Defaults from /opt/gate/.env (or the .env beside this script) when not given in the environment.
envfile=${GATE_ENV_FILE:-$(dirname "$0")/.env}
envval() { sed -nE "s/^$1=([^#]*).*/\1/p" "$envfile" 2>/dev/null | head -n1 | sed -E 's/^[[:space:]]+|[[:space:]]+$//g'; }
GATE_DOMAIN=${GATE_DOMAIN:-$(envval GATE_DOMAIN)}
GATE_ADMIN_KEY=${GATE_ADMIN_KEY:-$(envval GATE_ADMIN_KEY)}
: "${GATE_DOMAIN:?set GATE_DOMAIN}" "${GATE_ADMIN_KEY:?set GATE_ADMIN_KEY}"

body=$(jq -n --arg n "$name" --arg c "$country" --arg cur "$currency" \
  '{name:$n, country:$c, currency:$cur, releasePolicy:"on_delivery", payoutDestination:"gate_account"}')
res=$(curl -fsS -X POST "https://api.${GATE_DOMAIN}/v1/organizations" \
  -H "content-type: application/json" -H "x-admin-key: ${GATE_ADMIN_KEY}" -d "$body")
echo "$res" | jq '{organization: .organization.id, name: .organization.name}'
echo
echo "Organization API key (store as GATE_ORG_API_KEY in /opt/gate/.env, then rerun deploy.sh):"
echo "$res" | jq -r .apiKey
