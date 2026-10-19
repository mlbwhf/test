#!/usr/bin/env bash
# Pull the requested images, roll the stack, and wait for the API health check.
# Runs on the VPS in /opt/gate. Used by GitHub Actions and by hand:
#   GATE_API_IMAGE=ghcr.io/mlbwhf/gate-api:<sha> GATE_WEB_IMAGE=ghcr.io/mlbwhf/gate-web:<sha> ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo ".env missing; copy env.production.example and fill it in" >&2; exit 1; }
set -a; . ./.env; set +a

profiles=()
[ -n "${BACKUP_S3_BUCKET:-}" ] && profiles+=(--profile backup)

echo "== pulling images"
docker compose "${profiles[@]}" pull --quiet

echo "== applying"
docker compose "${profiles[@]}" up -d --remove-orphans --wait --wait-timeout 180

echo "== health"
for i in $(seq 1 30); do
  if docker compose exec -T api curl -fsS http://127.0.0.1:4000/health >/tmp/gate-health 2>/dev/null; then
    cat /tmp/gate-health; echo
    docker image prune -f >/dev/null
    echo "deployed $(docker compose images api --format '{{.Repository}}:{{.Tag}}' 2>/dev/null || true)"
    exit 0
  fi
  sleep 3
done
echo "API did not become healthy; recent logs:" >&2
docker compose logs --tail=80 api >&2
exit 1
