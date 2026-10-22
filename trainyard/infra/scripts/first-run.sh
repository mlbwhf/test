#!/usr/bin/env bash
# First run on the VPS that already hosts EnrollClass (gate): prepares /opt/trainyard for
# the deploy user, copies the Traefik settings from /opt/gate/.env when present, writes
# .env with generated secrets, and prints what is left to fill in. Safe to re-run: it
# never overwrites an existing .env. Run as root or as the deploy user.
#
#   git clone --depth 1 -b claude/confident-cray-JTbgD https://github.com/mlbwhf/test.git /root/trainyard-src
#   bash /root/trainyard-src/trainyard/infra/scripts/first-run.sh agile-agilist.com
set -euo pipefail
domain=${1:?usage: first-run.sh <domain> [web host] [api host]}
web_host=${2:-plan.$domain}
api_host=${3:-plan-api.$domain}
here=$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)
src="$here/.."
dest=/opt/trainyard
owner=deploy
id "$owner" >/dev/null 2>&1 || owner=$(id -un)

command -v docker >/dev/null || { echo "docker is not installed; run gate-platform/infra/scripts/server-setup.sh first" >&2; exit 1; }
install -d -m 750 -o "$owner" -g "$owner" "$dest"
for f in compose/docker-compose.prod.yml:docker-compose.yml compose/docker-compose.traefik-bridge.yml:docker-compose.traefik-bridge.yml scripts/deploy.sh:deploy.sh scripts/detect-traefik.sh:detect-traefik.sh scripts/smoke.sh:smoke.sh; do
  install -m 750 -o "$owner" -g "$owner" "$src/${f%%:*}" "$dest/${f##*:}"
done

if [ -f "$dest/.env" ]; then
  echo "$dest/.env exists; leaving it alone"
else
  cp "$src/compose/env.production.example" "$dest/.env"
  set_kv() { sed -i -E "s|^$1=[^#]*|$1=$2|" "$dest/.env"; }
  set_kv TRAINYARD_DOMAIN "$domain"
  set_kv TRAINYARD_WEB_HOST "$web_host"
  set_kv TRAINYARD_API_HOST "$api_host"
  set_kv POSTGRES_PASSWORD "$(openssl rand -hex 24)"
  set_kv TRAINYARD_ADMIN_KEY "$(openssl rand -hex 32)"
  set_kv TRAINYARD_WEBHOOK_SECRET "$(openssl rand -hex 24)"
  set_kv TRAINYARD_SECRET "$(openssl rand -hex 32)"
  # Same Traefik as gate: copy its detected values, else detect them now.
  if [ -f /opt/gate/.env ]; then
    for k in TRAEFIK_NETWORK TRAEFIK_ENTRYPOINT TRAEFIK_CERT_RESOLVER; do
      v=$(sed -nE "s/^$k=([^#]*).*/\1/p" /opt/gate/.env | head -n1 | tr -d ' ')
      [ -n "$v" ] && set_kv "$k" "$v"
    done
  else
    bash "$dest/detect-traefik.sh" | while IFS='=' read -r k v; do set_kv "$k" "$v"; done
  fi
  chown "$owner:$owner" "$dest/.env"; chmod 600 "$dest/.env"
  echo "wrote $dest/.env"
fi

echo
echo "Admin key (sign in with it once at https://$web_host/login, then create users):"
sed -nE 's/^TRAINYARD_ADMIN_KEY=([^ #]*).*/  \1/p' "$dest/.env"
echo
echo "Next:"
echo "  1. DNS: A records for $web_host and $api_host -> this VPS"
echo "  2. Optional in $dest/.env: ANTHROPIC_API_KEY, or LLM_PROFILE=llm + TRAINYARD_LLM_URL=http://ollama:11434/v1"
echo "  3. Push to the deploy branch, or run: cd $dest && ./deploy.sh"
