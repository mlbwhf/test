#!/usr/bin/env bash
# Make someone an owner of an existing organization and print a one-time sign-in link.
# For the operator: works before Google/Microsoft sign-in or email delivery are set up.
#   ./grant-owner.sh org_V4uJRwPlvaXG you@example.com
# Open the printed link within 20 minutes; it signs you in and adds you as owner.
set -euo pipefail
org=${1:?organization id, e.g. org_V4uJRwPlvaXG}
email=${2:?email address of the new owner}
envfile=${GATE_ENV_FILE:-$(dirname "$0")/.env}
envval() { sed -nE "s/^$1=([^#]*).*/\\1/p" "$envfile" 2>/dev/null | head -n1 | sed -E 's/^[[:space:]]+|[[:space:]]+$//g'; }
GATE_DOMAIN=${GATE_DOMAIN:-$(envval GATE_DOMAIN)}
GATE_ADMIN_KEY=${GATE_ADMIN_KEY:-$(envval GATE_ADMIN_KEY)}
: "${GATE_DOMAIN:?set GATE_DOMAIN}" "${GATE_ADMIN_KEY:?set GATE_ADMIN_KEY}"
res=$(curl -fsS -X POST "https://api.${GATE_DOMAIN}/v1/organizations/${org}/owner-link" \
  -H "x-admin-key: ${GATE_ADMIN_KEY}" -H 'content-type: application/json' \
  -d "{\"email\":\"${email}\"}")
echo "Open this link in your browser within 20 minutes (it works once). Do not share it:"
echo "$res" | sed -E 's/.*"signInUrl":"([^"]+)".*/\1/'
