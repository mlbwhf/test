#!/usr/bin/env bash
# One-time setup of Claude Code on the VPS, as an unprivileged "claudeops" user.
# Run as root AFTER deploy/install.sh (which creates the adsagent user and /opt/ads-agent):
#   sudo bash deploy/setup-claude-vps.sh
# Claude never gets root, never reads /opt/ads-agent/.env, and can't touch the web server.
# Its only sudo right: run the agent's dry runs and tests as adsagent.
set -euo pipefail

BRANCH="claude/ads-agent-deploy-eisu0m"
REPO="https://github.com/mlbwhf/test.git"

[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)."; exit 1; }
id adsagent >/dev/null 2>&1 || { echo "Run deploy/install.sh first (adsagent user missing)."; exit 1; }

# 1. Dedicated user, can read the agent's logs (not its .env)
id claudeops >/dev/null 2>&1 || adduser --disabled-password --gecos "" claudeops
usermod -aG adsagent claudeops
chmod 750 /opt/ads-agent/logs
chmod 600 /opt/ads-agent/.env 2>/dev/null || true

# 2. Narrow sudo: dry runs + offline tests only, as adsagent
cat >/etc/sudoers.d/claudeops-ads-agent <<'EOF'
claudeops ALL=(adsagent) NOPASSWD: /opt/ads-agent/venv/bin/python /opt/ads-agent/src/daily_run.py --dry-run, /opt/ads-agent/venv/bin/python /opt/ads-agent/src/weekly_run.py --dry-run, /opt/ads-agent/venv/bin/python /opt/ads-agent/tests/test_offline.py
EOF
chmod 440 /etc/sudoers.d/claudeops-ads-agent
visudo -c >/dev/null

# 3. tmux + git, then Claude Code (official native installer) and the repo, as claudeops
apt-get install -y -qq tmux git curl >/dev/null
runuser -l claudeops -c "curl -fsSL https://claude.ai/install.sh | bash"
runuser -l claudeops -c "[ -d ads-agent-src ] || git clone -q -b $BRANCH $REPO ads-agent-src; cd ads-agent-src && git pull -q"

cat <<'EOF'

Done. Last step is interactive (one time):
  su - claudeops
  tmux new -s claude
  cd ads-agent-src/ads-agent && claude      # /login: open the link, paste the code back, then /exit
  claude remote-control                     # the session now appears in your Claude app
Detach with Ctrl-b d. Reattach later: su - claudeops, then tmux attach -t claude
EOF
