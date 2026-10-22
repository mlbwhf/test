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

# This box also runs EnrollClass (gate). Never start the local model when it would push the
# host into swap: that slows or kills gate's containers, not just ours.
if [ "${LLM_PROFILE:-}" = "llm" ]; then
  limit=$(envval OLLAMA_MEMORY_LIMIT); limit=${limit:-3g}
  to_mb() { case "$1" in *g|*G) echo $(( ${1%?} * 1024 ));; *m|*M) echo ${1%?};; *) echo $(( $1 / 1048576 ));; esac; }
  need=$(to_mb "$limit"); avail=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
  if [ "$avail" -lt $(( need + 1024 )) ]; then
    echo "refusing to start Ollama: it may use ${need} MB but only ${avail} MB is available (keeping 1 GB headroom for gate)." >&2
    echo "Set LLM_PROFILE= to deploy without the local model, use a smaller TRAINYARD_LLM_MODEL, or move to a bigger VPS." >&2
    exit 1
  fi
fi

# Gate's public health, before and after, so a routing problem shows up here and not from a customer.
gate_domain=$(sed -nE 's/^GATE_DOMAIN=([^ #]*).*/\1/p' /opt/gate/.env 2>/dev/null | head -n1)
gate_health() { [ -n "$gate_domain" ] && curl -fsS --max-time 10 "https://api.$gate_domain/health" >/dev/null 2>&1; }
gate_before=skipped
if [ -n "$gate_domain" ]; then gate_health && gate_before=ok || gate_before=down; echo "== gate (api.$gate_domain) before: $gate_before"; fi

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
    if [ "$gate_before" = ok ]; then
      for n in 1 2 3 4 5 6; do gate_health && { echo "== gate after: ok"; exit 0; }; sleep 5; done
      echo "== gate after: DOWN. EnrollClass was healthy before this deploy and is not now; check Traefik: docker logs \$(docker ps -q --filter ancestor=traefik) --tail 100" >&2
      exit 2
    fi
    exit 0
  fi
  sleep 3
done
echo "API did not become healthy; recent logs:" >&2
compose logs --tail=80 api >&2
exit 1
