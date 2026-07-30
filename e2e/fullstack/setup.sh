#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
PROJ_ROOT="$(cd ../.. && pwd)"

# Check gateway.env exists
if [ ! -f gateway.env ]; then
  echo "ERROR: gateway.env not found."
  echo "Copy gateway.env.example to gateway.env and fill in your SSO credentials."
  exit 1
fi

# Check agent is running on host
if ! curl -sf --max-time 3 http://127.0.0.1:5002/health > /dev/null 2>&1; then
  echo "WARNING: No agent detected on localhost:5002"
  echo "Start your template-agent before running the full stack."
fi

# Build template-ui and copy assets into gateway-dist
echo "==> Building template-ui..."
(cd "$PROJ_ROOT" && npm run build 2>&1) | tail -3

echo "==> Copying UI assets to gateway-dist..."
mkdir -p gateway-dist/frontend
cp "$PROJ_ROOT/dist/frontend/main.umd.js" gateway-dist/frontend/
cp "$PROJ_ROOT/dist/frontend/template-ui.css" gateway-dist/frontend/
cp "$PROJ_ROOT/dist/frontend/redhat-logo.svg" gateway-dist/frontend/ 2>/dev/null || true

echo "==> Starting compose stack (gateway + valkey)..."
podman compose up -d --build 2>&1

echo "==> Waiting for services to be healthy..."
MAX_WAIT=120
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
  TOTAL=$(podman compose ps 2>/dev/null | grep -c 'fullstack_' || echo 0)
  HEALTHY=$(podman compose ps 2>/dev/null | grep -c '(healthy)' || echo 0)

  echo "  Health: ${HEALTHY}/${TOTAL} (${ELAPSED}s elapsed)"

  if [ "$TOTAL" -ge 2 ] && [ "$HEALTHY" -ge 2 ]; then
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
echo "    Gateway serves UI directly (like production)."
echo "    SSO login → authenticate → app loads."
echo ""
echo "    Stack: Gateway(:8080) + Valkey(:6379) + Agent(host:5002)"
