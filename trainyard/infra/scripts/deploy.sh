#!/usr/bin/env bash
# Pull the requested images, roll the stack, and wait for the API health check.
# Runs on the VPS in /opt/trainyard. Used by GitHub Actions and by hand:
#   TRAINYARD_API_IMAGE=ghcr.io/mlbwhf/trainyard-api:<sha> TRAINYARD_WEB_IMAGE=ghcr.io/mlbwhf/trainyard-web:<sha> ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo ".env missing; copy env.production.example and fill it in" >&2; exit 1; }
# Read single values without sourcing: values are not shell-safe.
envval() { sed -nE "s/^$1=([^#]*).*/\1/p" .env | head -n1 | sed -E "s/^[[:space:]]+|[[:space:]]+\$//g; s/^\"(.*)\"\$/\1/; s/^'(.*)'\$/\1/"; }
TRAEFIK_NETWORK=$(envval TRAEFIK_NETWORK)
BACKUP_S3_BUCKET=$(envval BACKUP_S3_BUCKET)
LLM_PROFILE=$(envval LLM_PROFILE)

opts=(-f docker-compose.yml)
case "${TRAEFIK_NETWORK:-host}" in host|"") ;; *) opts+=(-f docker-compose.traefik-bridge.yml);; esac
[ -n "${BACKUP_S3_BUCKET:-}" ] && opts+=(--profile backup)
[ "${LLM_PROFILE:-}" = "llm" ] && opts+=(--profile llm)
compose() { docker compose "${opts[@]}" "$@"; }

for required in TRAINYARD_DOMAIN POSTGRES_PASSWORD TRAINYARD_ADMIN_KEY; do
  [ -n "$(envval $required)" ] || { echo "set $required in .env before deploying" >&2; exit 1; }
done
[ "$(stat -c %a .env)" = "600" ] || chmod 600 .env

echo "== pulling images"
compose pull --quiet || echo "pull failed; continuing with local images"

echo "== applying"
compose up -d --remove-orphans --wait --wait-timeout 180

echo "== health"
for i in $(seq 1 30); do
  if out=$(compose exec -T api wget -qO- http://127.0.0.1:4100/health 2>/dev/null); then
    echo "$out"
    docker image prune -f >/dev/null
    echo "deployed $(compose images api --format '{{.Repository}}:{{.Tag}}' 2>/dev/null || true)"
    exit 0
  fi
  sleep 3
done
echo "API did not become healthy; recent logs:" >&2
compose logs --tail=80 api >&2
exit 1
