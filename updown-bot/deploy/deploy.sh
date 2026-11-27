#!/bin/sh
# Run on the VPS in ~/updown. Creates a paper-mode .env on first deploy; never overwrites it.
set -eu
cd "$(dirname "$0")"
mkdir -p state && chmod 777 state   # container runs as uid 10001
if [ ! -f .env ]; then cp env.example .env; chmod 600 .env; echo "created .env (paper mode)"; fi
docker compose pull
docker compose up -d --remove-orphans
sleep 5
docker compose ps
docker compose logs --tail 20 calibrate trader || true
