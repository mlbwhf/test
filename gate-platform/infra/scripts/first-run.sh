#!/usr/bin/env bash
# First run on a fresh VPS, as root. Hardens the host, prepares /opt/gate for the
# deploy user, detects Traefik, writes .env with generated secrets, and prints what
# is still missing. Safe to re-run: it never overwrites an existing .env.
#
#   curl -fsSL https://raw.githubusercontent.com/mlbwhf/test/claude/confident-cray-JTbgD/gate-platform/infra/scripts/first-run.sh | bash -s -- enrollclass.com
set -euo pipefail
domain=${1:?usage: first-run.sh <domain>}
base=https://raw.githubusercontent.com/mlbwhf/test/claude/confident-cray-JTbgD/gate-platform/infra
[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }

tmp=$(mktemp -d)
curl -fsSL "$base/scripts/server-setup.sh" -o "$tmp/server-setup.sh"
curl -fsSL "$base/scripts/detect-traefik.sh" -o "$tmp/detect-traefik.sh"
curl -fsSL "$base/compose/.env.production.example" -o "$tmp/env.example"
curl -fsSL "$base/compose/docker-compose.prod.yml" -o "$tmp/docker-compose.yml"
curl -fsSL "$base/scripts/deploy.sh" -o "$tmp/deploy.sh"
curl -fsSL "$base/scripts/bootstrap-tenant.sh" -o "$tmp/bootstrap-tenant.sh"

bash "$tmp/server-setup.sh"

install -o deploy -g deploy -m 755 "$tmp/docker-compose.yml" /opt/gate/docker-compose.yml
install -o deploy -g deploy -m 755 "$tmp/deploy.sh" /opt/gate/deploy.sh
install -o deploy -g deploy -m 755 "$tmp/detect-traefik.sh" /opt/gate/detect-traefik.sh
install -o deploy -g deploy -m 755 "$tmp/bootstrap-tenant.sh" /opt/gate/bootstrap-tenant.sh

if [ -f /opt/gate/.env ]; then
  echo "== /opt/gate/.env already exists; leaving it untouched"
else
  traefik=$(bash "$tmp/detect-traefik.sh")
  net=$(echo "$traefik" | sed -n 's/^TRAEFIK_NETWORK=//p')
  ep=$(echo "$traefik" | sed -n 's/^TRAEFIK_ENTRYPOINT=//p')
  res=$(echo "$traefik" | sed -n 's/^TRAEFIK_CERT_RESOLVER=//p')
  sed -e "s|^GATE_DOMAIN=.*|GATE_DOMAIN=$domain|" \
      -e "s|^TRAEFIK_NETWORK=.*|TRAEFIK_NETWORK=$net|" \
      -e "s|^TRAEFIK_ENTRYPOINT=.*|TRAEFIK_ENTRYPOINT=$ep|" \
      -e "s|^TRAEFIK_CERT_RESOLVER=.*|TRAEFIK_CERT_RESOLVER=$res|" \
      -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" \
      -e "s|^GATE_ADMIN_KEY=.*|GATE_ADMIN_KEY=$(openssl rand -hex 32)|" \
      -e "s|^BACKUP_PASSPHRASE=.*|BACKUP_PASSPHRASE=$(openssl rand -hex 24)|" \
      "$tmp/env.example" >/opt/gate/.env
  chown deploy:deploy /opt/gate/.env
  chmod 600 /opt/gate/.env
  echo "== wrote /opt/gate/.env (Traefik: network=$net entrypoint=$ep resolver=$res)"
fi
rm -rf "$tmp"

echo
echo "== deploy user SSH key"
echo "Paste the PUBLIC half of the GitHub Actions key into /home/deploy/.ssh/authorized_keys:"
echo "    echo 'ssh-ed25519 AAAA... gate-deploy' >> /home/deploy/.ssh/authorized_keys"
echo
echo "== still empty in /opt/gate/.env (edit as deploy: nano /opt/gate/.env)"
grep -E '^(STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|STRIPE_PUBLISHABLE_KEY|RESEND_API_KEY|ANTHROPIC_API_KEY)=\s*$' /opt/gate/.env | cut -d= -f1 | sed 's/^/    /' || true
echo
echo "Then add DEPLOY_HOST, DEPLOY_USER=deploy and DEPLOY_SSH_KEY to GitHub secrets and run the gate-deploy workflow."
