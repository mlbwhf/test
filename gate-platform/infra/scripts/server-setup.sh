#!/usr/bin/env bash
# One-time hardening for the EnrollClass VPS (Ubuntu 24.04, Hostinger "Docker and Traefik" template).
# Run as root once:  bash server-setup.sh
set -euo pipefail

echo "== packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q ufw fail2ban unattended-upgrades apt-listchanges curl jq

echo "== firewall: ssh, http, https only"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "== fail2ban for sshd"
cat >/etc/fail2ban/jail.d/sshd.local <<'JAIL'
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
JAIL
systemctl enable --now fail2ban

echo "== unattended security updates"
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'APT'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
APT

echo "== 2 GB swap"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
  sysctl -w vm.swappiness=10
  echo 'vm.swappiness=10' >/etc/sysctl.d/99-gate.conf
fi

echo "== docker log rotation"
mkdir -p /etc/docker
if [ -f /etc/docker/daemon.json ]; then
  jq '. + {"log-driver":"json-file","log-opts":{"max-size":"20m","max-file":"5"}}' /etc/docker/daemon.json >/etc/docker/daemon.json.new
  mv /etc/docker/daemon.json.new /etc/docker/daemon.json
else
  echo '{"log-driver":"json-file","log-opts":{"max-size":"20m","max-file":"5"}}' >/etc/docker/daemon.json
fi
systemctl reload docker || systemctl restart docker

echo "== deploy user and directory"
id -u deploy >/dev/null 2>&1 || useradd -m -s /bin/bash -G docker deploy
mkdir -p /opt/gate
chown deploy:deploy /opt/gate
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
if [ -f /root/.ssh/authorized_keys ] && [ ! -s /home/deploy/.ssh/authorized_keys ]; then
  cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
  chown deploy:deploy /home/deploy/.ssh/authorized_keys
  chmod 600 /home/deploy/.ssh/authorized_keys
fi

echo "== ssh: keys only"
mkdir -p /etc/ssh/sshd_config.d
cat >/etc/ssh/sshd_config.d/60-gate.conf <<'SSH'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
SSH
sshd -t && systemctl reload ssh

echo
echo "Done. Next: copy docker-compose.prod.yml and .env to /opt/gate as the deploy user,"
echo "then run detect-traefik.sh and deploy.sh."
