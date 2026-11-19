#!/usr/bin/env bash
# Install / upgrade the Ads Agent on a Linux VPS with systemd. Idempotent.
#
#   sudo bash deploy/install.sh            # install or upgrade; timers left OFF
#   sudo bash deploy/install.sh --enable   # ...and switch the daily + weekly timers on
#
# Runs as its own unprivileged user (adsagent) in /opt/ads-agent. It never touches
# the web server or other sites on this machine, and only writes to its logs/ dir
# and its own Airtable base. Phase 1: read-only on Google / Microsoft Ads.
set -euo pipefail

APP_USER=adsagent
APP_DIR=/opt/ads-agent
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"

[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)."; exit 1; }
command -v systemctl >/dev/null || { echo "systemd is required."; exit 1; }
command -v python3 >/dev/null || { echo "python3 is required."; exit 1; }
python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' \
  || { echo "Python 3.9+ is required (found $(python3 --version))."; exit 1; }
python3 -m venv --help >/dev/null 2>&1 \
  || { echo "python3-venv is missing (Debian/Ubuntu: apt install python3-venv)."; exit 1; }

id -u "$APP_USER" >/dev/null 2>&1 \
  || useradd --system --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP_DIR/logs"

# Code is replaced on every run; .env and logs/ are kept.
for d in src config deploy tests scripts; do
  rm -rf "${APP_DIR:?}/$d"
  cp -r "$SRC_DIR/$d" "$APP_DIR/$d"
done
cp "$SRC_DIR/requirements.txt" "$SRC_DIR/.env.example" "$APP_DIR/"

NEW_ENV=0
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  NEW_ENV=1
fi

python3 -m venv "$APP_DIR/venv"
"$APP_DIR/venv/bin/pip" install --quiet --upgrade pip
"$APP_DIR/venv/bin/pip" install --quiet -r "$APP_DIR/requirements.txt"

chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod 600 "$APP_DIR/.env"

install -m 644 "$SRC_DIR"/deploy/systemd/ads-agent-*.service "$SRC_DIR"/deploy/systemd/ads-agent-*.timer \
  /etc/systemd/system/
systemctl daemon-reload

echo "== Offline self-test (no network, nothing sent) =="
runuser -u "$APP_USER" -- "$APP_DIR/venv/bin/python" "$APP_DIR/tests/test_offline.py"

if [ "${1:-}" = "--enable" ]; then
  if [ "$NEW_ENV" -eq 1 ]; then
    echo "Not enabling timers: $APP_DIR/.env was just created from the template. Fill it in first."
    exit 1
  fi
  systemctl enable --now ads-agent-daily.timer ads-agent-weekly.timer
  systemctl list-timers 'ads-agent-*' --no-pager
else
  cat <<EOF

Installed in $APP_DIR. Timers are OFF.
  1. Fill in secrets:   sudo nano $APP_DIR/.env
  2. Live dry run:      sudo runuser -u $APP_USER -- $APP_DIR/venv/bin/python $APP_DIR/src/daily_run.py --dry-run
  3. Switch on:         sudo bash $SRC_DIR/deploy/install.sh --enable
Logs: journalctl -u ads-agent-daily -u ads-agent-weekly   and   $APP_DIR/logs/
EOF
fi
