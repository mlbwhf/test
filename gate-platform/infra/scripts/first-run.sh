#!/usr/bin/env bash
# First run on a fresh VPS, as root. Hardens the host, prepares /opt/gate for the
# deploy user, detects Traefik, writes .env with generated secrets, and prints what
# is still missing. Safe to re-run: it never overwrites an existing .env.
#
#   git clone --depth 1 -b claude/confident-cray-JTbgD https://github.com/mlbwhf/test.git /root/gate-src
#   bash /root/gate-src/gate-platform/infra/scripts/first-run.sh enrollclass.com "ssh-ed25519 ... laptop" "ssh-ed25519 ... gate-deploy"
set -euo pipefail
domain=${1:?usage: first-run.sh <domain> [public-key ...]}
shift || true
[ "$(id -u)" -eq 0 ] || { echo "run as root, on the VPS (not on your laptop)" >&2; exit 1; }

# Source files: the sibling files of this script when run from a checkout, otherwise a
# shallow clone of the repository (one short URL, no per-file raw fetches).
tmp=$(mktemp -d)
here=$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)
if [ -n "$here" ] && [ -f "$here/server-setup.sh" ] && [ -f "$here/../compose/docker-compose.prod.yml" ]; then
  src="$here/.."
else
  echo "== fetching deployment files"
  command -v git >/dev/null || apt-get install -y -q git >/dev/null
  git clone -q --depth 1 -b claude/confident-cray-JTbgD https://github.com/mlbwhf/test.git "$tmp/repo"
  src="$tmp/repo/gate-platform/infra"
fi
cp "$src/scripts/server-setup.sh" "$tmp/server-setup.sh"
cp "$src/scripts/detect-traefik.sh" "$tmp/detect-traefik.sh"
cp "$src/compose/env.production.example" "$tmp/env.example"
cp "$src/compose/docker-compose.prod.yml" "$tmp/docker-compose.yml"
cp "$src/compose/docker-compose.traefik-bridge.yml" "$tmp/docker-compose.traefik-bridge.yml"
cp "$src/scripts/deploy.sh" "$tmp/deploy.sh"
cp "$src/scripts/bootstrap-tenant.sh" "$tmp/bootstrap-tenant.sh"
cp "$src/scripts/rotate-api-key.sh" "$tmp/rotate-api-key.sh"
cp "$src/scripts/set-dashboard-password.sh" "$tmp/set-dashboard-password.sh"

# Any further arguments are SSH public keys ("ssh-ed25519 AAAA... comment"). Each is
# installed for root and for deploy before hardening, so password logins can be turned
# off safely in the same run. Keys whose comment contains "gate-deploy" go to deploy only.
install -d -m 700 /root/.ssh
for key in "$@"; do
  case "$key" in ssh-*|ecdsa-*|sk-*) ;; *) echo "skipping argument that is not a public key: ${key:0:30}..." >&2; continue;; esac
  if ! echo "$key" | grep -q gate-deploy; then
    grep -qxF "$key" /root/.ssh/authorized_keys 2>/dev/null || echo "$key" >>/root/.ssh/authorized_keys
  fi
  mkdir -p "$tmp/deploy-keys"; echo "$key" >>"$tmp/deploy-keys/authorized_keys"
done
chmod 600 /root/.ssh/authorized_keys 2>/dev/null || true

bash "$tmp/server-setup.sh"

if [ -f "$tmp/deploy-keys/authorized_keys" ]; then
  install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
  touch /home/deploy/.ssh/authorized_keys
  while read -r key; do grep -qxF "$key" /home/deploy/.ssh/authorized_keys || echo "$key" >>/home/deploy/.ssh/authorized_keys; done <"$tmp/deploy-keys/authorized_keys"
  chown deploy:deploy /home/deploy/.ssh/authorized_keys; chmod 600 /home/deploy/.ssh/authorized_keys
  echo "== installed $(wc -l </home/deploy/.ssh/authorized_keys) key(s) for deploy"
  # Hardening ran before the deploy keys existed only if root had none; rerun the ssh step now.
  bash "$tmp/server-setup.sh" >/dev/null 2>&1 || true
fi

install -o deploy -g deploy -m 755 "$tmp/docker-compose.yml" /opt/gate/docker-compose.yml
install -o deploy -g deploy -m 755 "$tmp/docker-compose.traefik-bridge.yml" /opt/gate/docker-compose.traefik-bridge.yml
install -o deploy -g deploy -m 755 "$tmp/deploy.sh" /opt/gate/deploy.sh
install -o deploy -g deploy -m 755 "$tmp/detect-traefik.sh" /opt/gate/detect-traefik.sh
install -o deploy -g deploy -m 755 "$tmp/bootstrap-tenant.sh" /opt/gate/bootstrap-tenant.sh
install -o deploy -g deploy -m 755 "$tmp/rotate-api-key.sh" /opt/gate/rotate-api-key.sh
install -o deploy -g deploy -m 755 "$tmp/set-dashboard-password.sh" /opt/gate/set-dashboard-password.sh

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
      -e "s|^GATE_TICKET_SECRET=.*|GATE_TICKET_SECRET=$(openssl rand -hex 32)|" \
      -e "s|^BACKUP_PASSPHRASE=.*|BACKUP_PASSPHRASE=$(openssl rand -hex 24)|" \
      "$tmp/env.example" >/opt/gate/.env
  chown deploy:deploy /opt/gate/.env
  chmod 600 /opt/gate/.env
  echo "== wrote /opt/gate/.env (Traefik: network=$net entrypoint=$ep resolver=$res)"
fi
rm -rf "$tmp"

echo
echo "== SSH keys"
echo "root:   $(grep -cE '^(ssh-|ecdsa-|sk-)' /root/.ssh/authorized_keys 2>/dev/null || echo 0) key(s)"
echo "deploy: $(grep -cE '^(ssh-|ecdsa-|sk-)' /home/deploy/.ssh/authorized_keys 2>/dev/null || echo 0) key(s)"
echo "Add more later with: echo 'ssh-ed25519 AAAA... comment' >> /home/deploy/.ssh/authorized_keys"
echo
echo "== still empty in /opt/gate/.env (edit as deploy: nano /opt/gate/.env)"
grep -E '^(STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|STRIPE_PUBLISHABLE_KEY|RESEND_API_KEY|ANTHROPIC_API_KEY)=' /opt/gate/.env | sed -E 's/#.*$//' | grep -E '=\s*$' | cut -d= -f1 | sed 's/^/    /' || true
echo
echo "Set the dashboard login as deploy: cd /opt/gate && ./set-dashboard-password.sh"
echo "Then add DEPLOY_HOST, DEPLOY_USER=deploy and DEPLOY_SSH_KEY to GitHub secrets and run the gate-deploy workflow."
