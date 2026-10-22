#!/usr/bin/env bash
# Prints the Traefik network, entrypoint and certificate resolver names of the
# Traefik container already running on this host, in .env form.
set -euo pipefail

cid=$(docker ps --filter "ancestor=traefik" --format '{{.ID}}' | head -n1)
if [ -z "$cid" ]; then
  cid=$(docker ps --format '{{.ID}} {{.Image}}' | awk 'tolower($2) ~ /traefik/ {print $1; exit}')
fi
if [ -z "$cid" ]; then
  echo "No running Traefik container found. Is the Hostinger traefik project up?" >&2
  exit 1
fi

args=$(docker inspect "$cid" | jq -r '.[0].Args[]?, .[0].Config.Cmd[]?' 2>/dev/null || true)
network=$(docker inspect "$cid" | jq -r '.[0].NetworkSettings.Networks | keys[]' | grep -v '^bridge$' | head -n1)
resolver=$(echo "$args" | grep -oE 'certificatesresolvers\.[A-Za-z0-9_-]+' | head -n1 | cut -d. -f2 || true)
entrypoint=$(echo "$args" | grep -oE 'entrypoints\.[A-Za-z0-9_-]+\.address=:443' | head -n1 | cut -d. -f2 || true)

# Static config in a file instead of CLI args.
if [ -z "$resolver" ] || [ -z "$entrypoint" ]; then
  for f in /traefik.yml /etc/traefik/traefik.yml /etc/traefik/traefik.yaml /traefik.toml; do
    content=$(docker exec "$cid" cat "$f" 2>/dev/null || true)
    [ -z "$content" ] && continue
    [ -z "$resolver" ] && resolver=$(echo "$content" | awk '/certificatesResolvers:/{f=1;next} f && /^  [A-Za-z0-9_-]+:/{gsub(/[: ]/,"");print;exit}')
    [ -z "$entrypoint" ] && entrypoint=$(echo "$content" | awk '/entryPoints:/{f=1} f && /address: *":?443"/{print prev; exit} {if ($0 ~ /^  [A-Za-z0-9_-]+:/) {prev=$1; gsub(/:/,"",prev)}}')
  done
fi

echo "TRAEFIK_NETWORK=${network:-traefik}"
echo "TRAEFIK_ENTRYPOINT=${entrypoint:-websecure}"
echo "TRAEFIK_CERT_RESOLVER=${resolver:-letsencrypt}"
