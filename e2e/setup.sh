#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

E2E_PORT="${E2E_PORT:-3100}"

echo "==> Building and starting e2e compose stack..."
podman compose up -d --build 2>&1

echo "==> Waiting for all services to be healthy..."
MAX_WAIT=180
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
  # Count healthy containers using simple text parsing
  TOTAL=$(podman compose ps 2>/dev/null | grep -c 'e2e_' || echo 0)
  HEALTHY=$(podman compose ps 2>/dev/null | grep -c '(healthy)' || echo 0)

  echo "  Health: ${HEALTHY}/${TOTAL} (${ELAPSED}s elapsed)"

  if [ "$TOTAL" -ge 5 ] && [ "$HEALTHY" -ge 5 ]; then
    echo "==> All services healthy!"
    break
  fi

  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo "==> ERROR: Timed out waiting for services. Status:"
  podman compose ps 2>&1
  echo "==> Logs (last 20 lines per service):"
  podman compose logs --tail=20 2>&1
  exit 1
fi

# Verify gateway dev auth is available
echo "==> Verifying gateway dev auth..."
DEV_STATUS=$(curl -s "http://localhost:${E2E_PORT}/auth/dev/status" 2>/dev/null || echo '{}')
echo "  Dev auth status: $DEV_STATUS"

echo "==> E2E environment ready at http://localhost:${E2E_PORT}"
