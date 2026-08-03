#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
PROJ_ROOT="$(cd ../.. && pwd)"
AGENT_DIR="${TEMPLATE_AGENT_PATH:-$(cd ../../../template-agent 2>/dev/null && pwd)}"

# Check gateway.env exists
if [ ! -f gateway.env ]; then
  echo "ERROR: gateway.env not found."
  echo "Copy gateway.env.example to gateway.env and fill in your SSO credentials."
  exit 1
fi

# Start template-agent if not running
if curl -sf --max-time 3 http://127.0.0.1:5002/health > /dev/null 2>&1; then
  echo "==> Agent already running on :5002"
else
  if [ -d "$AGENT_DIR" ]; then
    echo "==> Starting template-agent via 'make local' in $AGENT_DIR..."
    (cd "$AGENT_DIR" && make local > /tmp/template-agent.log 2>&1 &)
    echo "    Waiting for agent to be ready..."
    MAX_AGENT_WAIT=60
    AGENT_ELAPSED=0
    while [ $AGENT_ELAPSED -lt $MAX_AGENT_WAIT ]; do
      if curl -sf --max-time 2 http://127.0.0.1:5002/health > /dev/null 2>&1; then
        echo "    Agent healthy!"
        break
      fi
      sleep 3
      AGENT_ELAPSED=$((AGENT_ELAPSED + 3))
      echo "    Waiting... (${AGENT_ELAPSED}s)"
    done
    if [ $AGENT_ELAPSED -ge $MAX_AGENT_WAIT ]; then
      echo "    WARNING: Agent not ready after ${MAX_AGENT_WAIT}s. Check /tmp/template-agent.log"
      echo "    Last 10 lines:"
      tail -10 /tmp/template-agent.log 2>/dev/null || true
    fi
  else
    echo "WARNING: template-agent not found at $AGENT_DIR"
    echo "Set TEMPLATE_AGENT_PATH or start the agent manually on port 5002."
  fi
fi

# Build template-ui and copy assets into gateway-dist
echo "==> Building template-ui..."
(cd "$PROJ_ROOT" && npm run build 2>&1) | tail -3

echo "==> Copying UI assets to gateway-dist..."
mkdir -p gateway-dist/frontend
cp "$PROJ_ROOT/dist/frontend/main.umd.js" gateway-dist/frontend/
cp "$PROJ_ROOT/dist/frontend/template-ui.css" gateway-dist/frontend/
cp "$PROJ_ROOT/dist/frontend/redhat-logo.svg" gateway-dist/frontend/ 2>/dev/null || true

echo "==> Starting compose stack (gateway + valkey + template-ui + nginx)..."
podman compose up -d --build 2>&1

echo "==> Waiting for services to be healthy..."
MAX_WAIT=120
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
  TOTAL=$(podman compose ps 2>/dev/null | grep -c 'fullstack_' || echo 0)
  HEALTHY=$(podman compose ps 2>/dev/null | grep -c '(healthy)' || echo 0)

  echo "  Health: ${HEALTHY}/${TOTAL} (${ELAPSED}s elapsed)"

  if [ "$TOTAL" -ge 4 ] && [ "$HEALTHY" -ge 4 ]; then
    echo "==> All services healthy!"
    break
  fi

  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo "==> ERROR: Timed out."
  podman compose ps 2>&1
  podman compose logs --tail=20 2>&1
  exit 1
fi

echo ""
echo "==> Full stack ready at http://localhost:8080"
echo ""
echo "    Stack:"
echo "      nginx (:8080) → gateway (:8080 internal) → Valkey (:6379)"
echo "                     → template-ui (:5003) → agent (host:5002)"
echo ""
echo "    Open http://localhost:8080 — redirects to SSO login."
echo "    Agent logs: /tmp/template-agent.log"
