#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# MCP idle-timeout test — report-ai.org
#
# Question 1: does anything arrive on the stream during a deliberate idle gap?
#             (i.e. does AI Engine send keepalive/heartbeat frames?)
# Question 2: how many seconds until the connection is closed?
#             That number IS the idle timeout, and it names the layer.
#
# Question 3 (the decisive one): does the same test behave differently when it
#             bypasses Hostinger's CDN? If through-CDN dies and direct-to-origin
#             survives, the edge is proven to be the cause. Run PART B for this.
#
# Usage:  chmod +x mcp-idle-test.sh && ./mcp-idle-test.sh
# ---------------------------------------------------------------------------

URL="https://report-ai.org/wp-json/mcp/v1/http"

# Bearer token from WP Admin → Meow Apps → AI Engine → (MCP section).
# Do NOT commit a real token to the repo.
TOKEN="${MCP_TOKEN:?Set MCP_TOKEN first:  export MCP_TOKEN='...'}"

# Origin IP for PART B — from hPanel → Websites → your site → server IP.
ORIGIN_IP="${ORIGIN_IP:-}"

MAXTIME="${MAXTIME:-900}"   # 15 minutes; raise if it survives that long

stamp() { while IFS= read -r l; do printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$l"; done; }

run_test() {
  local label="$1"; shift
  echo "=============================================================="
  echo "$label"
  echo "started: $(date -u +%H:%M:%S) UTC   (sending nothing after open)"
  echo "=============================================================="
  local start end
  start=$(date +%s)
  "$@" 2>&1 | stamp
  end=$(date +%s)
  echo "--------------------------------------------------------------"
  echo "CLOSED after $((end - start)) seconds of total connection life."
  echo "If no data lines appeared between open and close, AI Engine sends"
  echo "no keepalive — and the close time is the idle timeout."
  echo "--------------------------------------------------------------"
  echo
}

# ---------------------------------------------------------------------------
# PART A — through the normal path (Hostinger CDN in front)
# ---------------------------------------------------------------------------
# Try SSE (GET) first. If the server answers 405, use the POST variant below.
run_test "PART A1 — GET, SSE, via CDN" \
  curl -N -sS --no-buffer --max-time "$MAXTIME" -i \
       -H "Accept: text/event-stream" \
       -H "Authorization: Bearer $TOKEN" \
       "$URL"

# Streamable-HTTP variant: POST an MCP initialize and hold the response open.
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"idle-test","version":"1.0"}}}'

run_test "PART A2 — POST initialize, streamable HTTP, via CDN" \
  curl -N -sS --no-buffer --max-time "$MAXTIME" -i \
       -H "Accept: text/event-stream, application/json" \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer $TOKEN" \
       -d "$INIT" \
       "$URL"

# ---------------------------------------------------------------------------
# PART B — THE DECISIVE ONE: same request, bypassing the CDN
# ---------------------------------------------------------------------------
# Needs ORIGIN_IP. --resolve pins the hostname to the origin so TLS/SNI and the
# Host header stay correct while skipping the edge.
if [ -n "$ORIGIN_IP" ]; then
  run_test "PART B — POST initialize, DIRECT TO ORIGIN (CDN bypassed)" \
    curl -N -sS --no-buffer --max-time "$MAXTIME" -i \
         --resolve "report-ai.org:443:$ORIGIN_IP" \
         -H "Accept: text/event-stream, application/json" \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer $TOKEN" \
         -d "$INIT" \
         "$URL"
else
  echo "PART B skipped — set ORIGIN_IP to bypass the CDN:"
  echo "  export ORIGIN_IP=203.0.113.10   # from hPanel → your site → server IP"
fi
