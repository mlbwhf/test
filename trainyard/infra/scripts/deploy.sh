#!/usr/bin/env bash
# Pull the requested images, roll the stack, and wait for the API health check.
# Runs on the VPS in /opt/trainyard. Used by GitHub Actions and by hand:
#   TRAINYARD_API_IMAGE=ghcr.io/mlbwhf/trainyard-api:<sha> TRAINYARD_WEB_IMAGE=ghcr.io/mlbwhf/trainyard-web:<sha> ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo ".env missing; copy env.production.example and fill it in" >&2; exit 1; }
# Read single values without sourcing: values are not shell-safe.
envval() { sed -nE "s/^$1=([^#]*).*/\1/p" .env | head -n1 | sed -E "s/^[[:space:]]+|[[:space:]]+\$//g; s/^\"(.*)\"\$/\1/; s/^'(.*)'\$/\1/"; }
pin_env() { local var=$1 val=$2; if grep -qE "^$var=" .env; then sed -i -E "s|^$var=.*|$var=$val|" .env; else printf '\n%s=%s\n' "$var" "$val" >> .env; fi; }
# The canonical hosts and aliases can come from CI (the repository variables), so moving the
# site to a new domain is a change of variables and a deploy, not an edit on the server.
for pair in TRAINYARD_WEB_HOST:TRAINYARD_CI_WEB_HOST TRAINYARD_API_HOST:TRAINYARD_CI_API_HOST TRAINYARD_WEB_ALIASES:TRAINYARD_CI_WEB_ALIASES TRAINYARD_API_ALIASES:TRAINYARD_CI_API_ALIASES STRIPE_TRIAL_DAYS:TRAINYARD_CI_TRIAL_DAYS TRAINYARD_PLATFORM_ADMINS:TRAINYARD_CI_PLATFORM_ADMINS; do
  var=${pair%%:*}; src=${pair##*:}; val=${!src:-}
  [ -n "$val" ] || continue
  shown=$val; [ "$var" = TRAINYARD_PLATFORM_ADMINS ] && shown="(hidden)"
  [ "$(envval "$var")" = "$val" ] || { echo "== .env $var -> $shown"; pin_env "$var" "$val"; }
done
TRAEFIK_NETWORK=$(envval TRAEFIK_NETWORK)
BACKUP_S3_BUCKET=$(envval BACKUP_S3_BUCKET)
LLM_PROFILE=$(envval LLM_PROFILE)
FLOWISE_HOST=$(envval FLOWISE_HOST)

opts=(-f docker-compose.yml)
case "${TRAEFIK_NETWORK:-host}" in host|"") ;; *) opts+=(-f docker-compose.traefik-bridge.yml);; esac
[ -n "${BACKUP_S3_BUCKET:-}" ] && opts+=(--profile backup)
[ "${LLM_PROFILE:-}" = "llm" ] && opts+=(--profile llm)

# Aliases: one router and certificate per name, so a name whose DNS is not ready cannot stop
# Let's Encrypt from issuing the others. Only names that already resolve to this server are
# added; the rest are listed and picked up by the next deploy.
alias_file=docker-compose.aliases.yml
rm -f "$alias_file"
local_ips=" $(hostname -I 2>/dev/null) $(curl -4 -fsS --max-time 5 https://ifconfig.me 2>/dev/null || true) "
# A name "points here" when it resolves to this server, or to the same address as the canonical
# web host (a CDN such as Cloudflare proxies the zone, so both resolve to the CDN, not to us).
canonical_ips=" $(getent ahostsv4 "$(envval TRAINYARD_WEB_HOST)" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ') "
points_here() { local ip; ip=$(getent ahostsv4 "$1" | awk 'NR==1{print $1}'); [ -n "$ip" ] && { [[ "$local_ips" == *" $ip "* ]] || [[ "$canonical_ips" == *" $ip "* ]]; }; }
web_labels=""; api_labels=""; n=0
canonical_web=$(envval TRAINYARD_WEB_HOST); canonical_api=$(envval TRAINYARD_API_HOST); seen=" "
# TRAINYARD_WEB_ALIASES and TRAINYARD_API_ALIASES take any number of space-separated names.
# A name listed twice, or equal to the canonical host, gets one router at most.
for name in $(envval TRAINYARD_WEB_ALT) $(envval TRAINYARD_WEB_ALT2) $(envval TRAINYARD_WEB_ALT3) $(envval TRAINYARD_WEB_ALT4) $(envval TRAINYARD_WEB_ALIASES); do
  [ "$name" = "$canonical_web" ] && continue
  [[ "$seen" == *" $name "* ]] && continue
  seen+="$name "
  n=$((n + 1))
  if points_here "$name"; then
    echo "== alias $name -> redirects to the canonical web host"
    web_labels+="      traefik.http.routers.trainyard-web-alias$n.rule: Host(\`$name\`)
      traefik.http.routers.trainyard-web-alias$n.entrypoints: \${TRAEFIK_ENTRYPOINT:-websecure}
      traefik.http.routers.trainyard-web-alias$n.tls: \"true\"
      traefik.http.routers.trainyard-web-alias$n.tls.certresolver: \${TRAEFIK_CERT_RESOLVER:-letsencrypt}
      traefik.http.routers.trainyard-web-alias$n.middlewares: trainyard-web-canonical
      traefik.http.routers.trainyard-web-alias$n.service: trainyard-web
"
  else echo "== alias $name skipped: its DNS does not point to this server yet"; fi
done
m=0
for name in $(envval TRAINYARD_API_ALT) $(envval TRAINYARD_API_ALIASES); do
  [ "$name" = "$canonical_api" ] && continue
  [[ "$seen" == *" $name "* ]] && continue
  seen+="$name "
  m=$((m + 1))
  if points_here "$name"; then
    echo "== alias $name -> answers as the API"
    api_labels+="      traefik.http.routers.trainyard-api-alias$m.rule: Host(\`$name\`)
      traefik.http.routers.trainyard-api-alias$m.entrypoints: \${TRAEFIK_ENTRYPOINT:-websecure}
      traefik.http.routers.trainyard-api-alias$m.tls: \"true\"
      traefik.http.routers.trainyard-api-alias$m.tls.certresolver: \${TRAEFIK_CERT_RESOLVER:-letsencrypt}
      traefik.http.routers.trainyard-api-alias$m.middlewares: trainyard-api-headers
      traefik.http.routers.trainyard-api-alias$m.service: trainyard-api
"
  else echo "== alias $name skipped: its DNS does not point to this server yet"; fi
done
# The mirror host (TRAINYARD_WEB_MIRROR, e.g. an older domain) serves the class paths as itself
# instead of redirecting, for networks that block the main domain as newly registered. Its API
# twin (TRAINYARD_API_MIRROR) must already answer as the API (an API alias). Higher priority than
# the alias redirect for the same host; every other path still redirects to the canonical site.
mirror=$(envval TRAINYARD_WEB_MIRROR); mirror_api=$(envval TRAINYARD_API_MIRROR)
if [ -n "$mirror" ]; then
  if [ -z "$mirror_api" ]; then echo "== mirror $mirror skipped: set TRAINYARD_API_MIRROR (an API alias, e.g. api.$mirror)"
  elif points_here "$mirror" && points_here "$mirror_api"; then
    echo "== mirror $mirror serves class links and boards as itself (API at $mirror_api)"
    web_labels+="      traefik.http.routers.trainyard-web-mirror.rule: Host(\`$mirror\`) && (PathPrefix(\`/join\`) || PathPrefix(\`/boards\`) || PathPrefix(\`/embed\`) || PathPrefix(\`/planning-room\`) || PathPrefix(\`/login\`) || PathPrefix(\`/_next\`) || PathPrefix(\`/fonts\`) || PathPrefix(\`/courses\`) || PathPrefix(\`/icon.svg\`) || PathPrefix(\`/favicon.ico\`))
      traefik.http.routers.trainyard-web-mirror.priority: \"200\"
      traefik.http.routers.trainyard-web-mirror.entrypoints: \${TRAEFIK_ENTRYPOINT:-websecure}
      traefik.http.routers.trainyard-web-mirror.tls: \"true\"
      traefik.http.routers.trainyard-web-mirror.tls.certresolver: \${TRAEFIK_CERT_RESOLVER:-letsencrypt}
      traefik.http.routers.trainyard-web-mirror.middlewares: trainyard-web-headers
      traefik.http.routers.trainyard-web-mirror.service: trainyard-web
"
  else echo "== mirror $mirror skipped: $mirror or $mirror_api does not point to this server yet"; fi
fi
if [ -n "$web_labels$api_labels" ]; then
  {
    echo "# Written by deploy.sh on every deploy; do not edit."
    echo "services:"
    [ -n "$api_labels" ] && printf '  api:\n    labels:\n%s' "$api_labels"
    [ -n "$web_labels" ] && printf '  web:\n    labels:\n%s' "$web_labels"
  } > "$alias_file"
  opts+=(-f "$alias_file")
fi
# Flowise joins the stack once FLOWISE_HOST is set and its DNS points here (a name that does not
# resolve yet would make Let's Encrypt retry and the container start for nothing).
if [ -n "${FLOWISE_HOST:-}" ]; then
  if [ -z "$(envval FLOWISE_SECRET)" ]; then echo "== flowise skipped: set FLOWISE_SECRET in .env (openssl rand -hex 24)"
  elif points_here "$FLOWISE_HOST"; then echo "== flowise at https://$FLOWISE_HOST"; opts+=(--profile flowise)
  else echo "== flowise skipped: the DNS of $FLOWISE_HOST does not point to this server yet"; fi
fi
compose() { docker compose "${opts[@]}" "$@"; }

for required in TRAINYARD_DOMAIN POSTGRES_PASSWORD TRAINYARD_ADMIN_KEY; do
  [ -n "$(envval $required)" ] || { echo "set $required in .env before deploying" >&2; exit 1; }
done
# .env must belong to the deploy user: editing it as root (mv, cp) hands it to root and the deploy can no longer read or pin it.
[ -w .env ] || { echo "== .env is owned by $(stat -c %U .env) and not writable by $(id -un). On the server run: sudo chown $(id -un) /opt/trainyard/.env && sudo chmod 600 /opt/trainyard/.env" >&2; exit 1; }
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
# Do not stop here if a container is slow to report healthy: the loop below checks the API
# itself and prints its logs when it is really down.
compose up -d --remove-orphans --wait --wait-timeout 180 || echo "compose reported an unhealthy container; checking the API directly"

echo "== health"
for i in $(seq 1 30); do
  if out=$(compose exec -T api wget -qO- http://127.0.0.1:4100/health 2>/dev/null); then
    echo "$out"
    docker image prune -f >/dev/null
    echo "deployed $(compose images api --format '{{.Repository}}:{{.Tag}}' 2>/dev/null || true)"
    # Pin the deployed images in .env so a later manual `docker compose up -d` (after editing
    # .env, say) restarts the same images instead of whatever :latest is cached on this box.
    for var in TRAINYARD_API_IMAGE TRAINYARD_WEB_IMAGE; do
      val=${!var:-}; [ -n "$val" ] || continue
      pin_env "$var" "$val"
    done
    if [ "$gate_before" = ok ]; then
      for n in 1 2 3 4 5 6; do gate_health && { echo "== gate after: ok"; exit 0; }; sleep 5; done
      echo "== gate after: DOWN. EnrollClass was healthy before this deploy and is not now; check Traefik: docker logs \$(docker ps -q --filter ancestor=traefik) --tail 100" >&2
      exit 2
    fi
    exit 0
  fi
  sleep 3
done
echo "API did not become healthy; container state and recent logs:" >&2
compose ps >&2
compose logs --tail=80 api >&2
exit 1
