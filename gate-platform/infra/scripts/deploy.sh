#!/usr/bin/env bash
# Pull the requested images, roll the stack, and wait for the API health check.
# Runs on the VPS in /opt/gate. Used by GitHub Actions and by hand:
#   GATE_API_IMAGE=ghcr.io/mlbwhf/gate-api:<sha> GATE_WEB_IMAGE=ghcr.io/mlbwhf/gate-web:<sha> ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo ".env missing; copy env.production.example and fill it in" >&2; exit 1; }
# Read single values without sourcing: values like "Name <email>" are not shell-safe.
envval() { sed -nE "s/^$1=([^#]*).*/\1/p" .env | head -n1 | sed -E "s/^[[:space:]]+|[[:space:]]+\$//g; s/^\"(.*)\"\$/\1/; s/^'(.*)'\$/\1/"; }
TRAEFIK_NETWORK=$(envval TRAEFIK_NETWORK)
BACKUP_S3_BUCKET=$(envval BACKUP_S3_BUCKET)

opts=(-f docker-compose.yml)
case "${TRAEFIK_NETWORK:-host}" in host|"") ;; *) opts+=(-f docker-compose.traefik-bridge.yml);; esac
[ -n "${BACKUP_S3_BUCKET:-}" ] && opts+=(--profile backup)
compose() { docker compose "${opts[@]}" "$@"; }

missing=$(grep -E '^(STRIPE_SECRET_KEY|STRIPE_PUBLISHABLE_KEY|RESEND_API_KEY|ANTHROPIC_API_KEY)=' .env | sed -E 's/#.*$//' | grep -E '=\s*$' | cut -d= -f1 || true)
[ -z "$missing" ] || { echo "fill these in .env before deploying:"; echo "$missing" | sed 's/^/    /'; exit 1; }
[ "$(stat -c %a .env)" = "600" ] || chmod 600 .env

echo "== pulling images"
compose pull --quiet || echo "pull failed; continuing with local images"

echo "== applying"
compose up -d --remove-orphans --wait --wait-timeout 180

echo "== health"
health=$(mktemp)
trap 'rm -f "$health"' EXIT
for i in $(seq 1 30); do
  if compose exec -T api curl -fsS http://127.0.0.1:4000/health >"$health" 2>/dev/null; then
    cat "$health"; echo
    docker image prune -f >/dev/null
    echo "deployed $(compose images api --format '{{.Repository}}:{{.Tag}}' 2>/dev/null || true)"
    exit 0
  fi
  sleep 3
done
echo "API did not become healthy; recent logs:" >&2
compose logs --tail=80 api >&2
exit 1
