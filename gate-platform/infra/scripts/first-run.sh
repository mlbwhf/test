#!/usr/bin/env bash
# First run on a fresh VPS, as root. Hardens the host, prepares /opt/gate for the
# deploy user, detects Traefik, writes .env with generated secrets, and prints what
# is still missing. Safe to re-run: it never overwrites an existing .env.
#
#   curl -fsSL https://raw.githubusercontent.com/mlbwhf/test/claude/confident-cray-JTbgD/gate-platform/infra/scripts/first-run.sh | bash -s -- enrollclass.com
set -euo pipefail
domain=${1:?usage: first-run.sh <domain> [public-key ...]}
shift || true
base=https://raw.githubusercontent.com/mlbwhf/test/claude/confident-cray-JTbgD/gate-platform/infra
[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }

tmp=$(mktemp -d)
curl -fsSL "$base/scripts/server-setup.sh" -o "$tmp/server-setup.sh"
curl -fsSL "$base/scripts/detect-traefik.sh" -o "$tmp/detect-traefik.sh"
curl -fsSL "$base/compose/.env.production.example" -o "$tmp/env.example"
curl -fsSL "$base/compose/docker-compose.prod.yml" -o "$tmp/docker-compose.yml"
curl -fsSL "$base/scripts/deploy.sh" -o "$tmp/deploy.sh"
curl -fsSL "$base/scripts/bootstrap-tenant.sh" -o "$tmp/bootstrap-tenant.sh"

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
echo "== SSH keys"
echo "root:   $(grep -cE '^(ssh-|ecdsa-|sk-)' /root/.ssh/authorized_keys 2>/dev/null || echo 0) key(s)"
echo "deploy: $(grep -cE '^(ssh-|ecdsa-|sk-)' /home/deploy/.ssh/authorized_keys 2>/dev/null || echo 0) key(s)"
echo "Add more later with: echo 'ssh-ed25519 AAAA... comment' >> /home/deploy/.ssh/authorized_keys"
echo
echo "== still empty in /opt/gate/.env (edit as deploy: nano /opt/gate/.env)"
grep -E '^(STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|STRIPE_PUBLISHABLE_KEY|RESEND_API_KEY|ANTHROPIC_API_KEY)=\s*$' /opt/gate/.env | cut -d= -f1 | sed 's/^/    /' || true
echo
echo "Then add DEPLOY_HOST, DEPLOY_USER=deploy and DEPLOY_SSH_KEY to GitHub secrets and run the gate-deploy workflow."
