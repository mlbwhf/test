#!/usr/bin/env bash
# Replace an organization's API key and print the new one. The old key stops working at once.
#   ./rotate-api-key.sh org_XXXX
# Then put the printed key in /opt/gate/.env as GATE_ORG_API_KEY and run ./deploy.sh.
set -euo pipefail
org=${1:?organization id, e.g. org_V4uJRwPlvaXG}
envfile=${GATE_ENV_FILE:-$(dirname "$0")/.env}
envval() { sed -nE "s/^$1=([^#]*).*/\\1/p" "$envfile" 2>/dev/null | head -n1 | sed -E 's/^[[:space:]]+|[[:space:]]+$//g'; }
GATE_DOMAIN=${GATE_DOMAIN:-$(envval GATE_DOMAIN)}
GATE_ADMIN_KEY=${GATE_ADMIN_KEY:-$(envval GATE_ADMIN_KEY)}
: "${GATE_DOMAIN:?set GATE_DOMAIN}" "${GATE_ADMIN_KEY:?set GATE_ADMIN_KEY}"
res=$(curl -fsS -X POST "https://api.${GATE_DOMAIN}/v1/organizations/${org}/api-key" -H "x-admin-key: ${GATE_ADMIN_KEY}")
echo "$res" | jq '{organization: .organization.id, name: .organization.name}'
echo
echo "New API key (store as GATE_ORG_API_KEY in /opt/gate/.env, then ./deploy.sh). Do not paste it anywhere else:"
echo "$res" | jq -r .apiKey
