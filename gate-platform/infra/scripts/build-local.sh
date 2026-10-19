#!/usr/bin/env bash
# Fallback deploy without GitHub Actions: build both images on the VPS from the git
# checkout and roll the stack. Run as root. Takes 5 to 10 minutes on a 2 vCPU box.
#
#   bash /root/gate-src/gate-platform/infra/scripts/build-local.sh
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }
src=${GATE_SRC:-/root/gate-src}
branch=${GATE_BRANCH:-claude/confident-cray-JTbgD}

echo "== updating source"
if [ -d "$src/.git" ]; then git -C "$src" fetch -q origin "$branch" && git -C "$src" reset -q --hard "origin/$branch"; else git clone -q --depth 1 -b "$branch" https://github.com/mlbwhf/test.git "$src"; fi
sha=$(git -C "$src" rev-parse --short HEAD)
echo "   at $sha"

echo "== refreshing deploy files in /opt/gate"
install -o deploy -g deploy -m 755 "$src/gate-platform/infra/compose/docker-compose.prod.yml" /opt/gate/docker-compose.yml
install -o deploy -g deploy -m 755 "$src/gate-platform/infra/compose/docker-compose.traefik-bridge.yml" /opt/gate/docker-compose.traefik-bridge.yml
for f in deploy.sh detect-traefik.sh bootstrap-tenant.sh rotate-api-key.sh; do install -o deploy -g deploy -m 755 "$src/gate-platform/infra/scripts/$f" "/opt/gate/$f"; done

echo "== building images (this is the slow part)"
export DOCKER_BUILDKIT=1
docker build -f "$src/gate-platform/infra/docker/Dockerfile.api" -t "ghcr.io/mlbwhf/gate-api:$sha" -t ghcr.io/mlbwhf/gate-api:latest "$src/gate-platform"
docker build -f "$src/gate-platform/infra/docker/Dockerfile.web" -t "ghcr.io/mlbwhf/gate-web:$sha" -t ghcr.io/mlbwhf/gate-web:latest "$src/gate-platform"

echo "== deploying"
su - deploy -c "cd /opt/gate && GATE_API_IMAGE=ghcr.io/mlbwhf/gate-api:$sha GATE_WEB_IMAGE=ghcr.io/mlbwhf/gate-web:$sha ./deploy.sh"
