# Run Claude Code on the VPS (82.180.155.101)

**Why:** the cloud session can't reach your APIs or the server, so today's work meant relaying data
through connectors (that dropped) and handing you steps to run. On the VPS, Claude Code runs the
scripts, reads the logs and deploys changes **directly**, which means fewer tokens and fewer
round-trips. With **Remote Control** you drive it from the Claude Code app on your phone or desktop.

Note: the daily and weekly agent itself uses **no Claude tokens** (Python + Groq). This is for the
maintenance and improvement work.

## Design: Claude never sees your keys
- Claude Code runs as its own non-root user, **`claudeops`**.
- The agent's secrets stay in `/opt/ads-agent/.env`, readable only by `adsagent`.
- A narrow sudo rule lets `claudeops` run **only** the agent's dry runs as `adsagent`. Claude can
  see what the agent sees, but can't read or print the keys, touch the web server, or administer
  the machine.

## One-time setup (as root, about 10 minutes)
**Shortcut:** after `deploy/install.sh`, run `sudo bash deploy/setup-claude-vps.sh`. It does steps
1-3 below plus the install and clone, then prints the one interactive login step.

```bash
# 1. Dedicated user (no sudo except the dry-run rule below)
adduser --disabled-password --gecos "" claudeops
usermod -aG adsagent claudeops                  # read agent logs
chmod 750 /opt/ads-agent/logs

# 2. Narrow sudo: dry runs only, as the agent user
cat >/etc/sudoers.d/claudeops-ads-agent <<'EOF'
claudeops ALL=(adsagent) NOPASSWD: /opt/ads-agent/venv/bin/python /opt/ads-agent/src/daily_run.py --dry-run, /opt/ads-agent/venv/bin/python /opt/ads-agent/src/weekly_run.py --dry-run, /opt/ads-agent/venv/bin/python /opt/ads-agent/tests/test_offline.py
EOF
chmod 440 /etc/sudoers.d/claudeops-ads-agent && visudo -c

# 3. tmux keeps the session alive after you disconnect
apt-get install -y tmux git
```

## Install Claude Code and start Remote Control (as claudeops)
```bash
su - claudeops
curl -fsSL https://claude.ai/install.sh | bash          # official native installer
git clone -b claude/ads-agent-deploy-eisu0m https://github.com/mlbwhf/test.git ads-agent-src
cd ads-agent-src/ads-agent
tmux new -s claude
claude                    # first run: /login prints a link; open it in your browser, paste the code back
# then exit claude and start Remote Control in this folder:
claude remote-control
```
Detach with `Ctrl-b d`; reattach later with `tmux attach -t claude`. The session appears in your
**Claude Code app**. Open it there and work as usual. `CLAUDE.md` in this folder is loaded
automatically, so each session starts knowing your rules, IDs and commands.

## Deploying code changes
`claudeops` deliberately has **no general sudo**. When Claude has changed and tested code, **you**
run `sudo bash deploy/install.sh` (it keeps `.env` and logs, and runs the offline tests first).
Grant more access only when you choose to.

## Token-saving habits
- Ask it to **run** things ("run the daily dry run and summarize the alerts") rather than paste data in.
- `/compact` when a session gets long; start a fresh session per topic.
- Leave permission prompts on. Don't use `--dangerously-skip-permissions` on a server that hosts
  your websites.
