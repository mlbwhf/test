#!/usr/bin/env bash
# Set (or replace) the login for the organizer dashboard at app.<domain>.
#   ./set-dashboard-password.sh [username]      (default username: admin)
# Prompts for the password without echoing it, stores only an apr1 hash in .env as
# DASHBOARD_BASIC_AUTH, then run ./deploy.sh to apply. Run as deploy, in /opt/gate.
set -euo pipefail
cd "$(dirname "$0")"
user=${1:-admin}
case "$user" in *[!A-Za-z0-9._@-]*|"") echo "username may contain letters, digits, . _ @ -" >&2; exit 1;; esac
[ -f .env ] || { echo ".env missing" >&2; exit 1; }

read -rsp "Password for $user (min 12 chars): " pw; echo
read -rsp "Again: " pw2; echo
[ "$pw" = "$pw2" ] || { echo "passwords differ" >&2; exit 1; }
[ ${#pw} -ge 12 ] || { echo "use at least 12 characters" >&2; exit 1; }

hash=$(printf '%s' "$pw" | openssl passwd -apr1 -stdin)
unset pw pw2
# Single quotes keep the $ signs of the hash out of Compose's .env interpolation.
line="DASHBOARD_BASIC_AUTH='$user:$hash'"
if grep -q '^DASHBOARD_BASIC_AUTH=' .env; then
  tmp=$(mktemp); trap 'rm -f "$tmp"' EXIT
  awk -v line="$line" '/^DASHBOARD_BASIC_AUTH=/ { print line; next } { print }' .env >"$tmp"
  cat "$tmp" >.env
else
  printf '%s\n' "$line" >>.env
fi
chmod 600 .env
echo "stored a hashed login for '$user' in .env; apply it with ./deploy.sh"
