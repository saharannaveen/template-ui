#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
AGENT_DIR="${TEMPLATE_AGENT_PATH:-$(cd ../../../template-agent 2>/dev/null && pwd)}"

echo "==> Stopping full-stack compose..."
podman compose down -v --remove-orphans 2>/dev/null || true

echo "==> Stopping template-agent..."
lsof -ti:5002 | xargs kill -INT 2>/dev/null || true
sleep 2
lsof -ti:5002 | xargs kill -9 2>/dev/null || true

if [ -d "$AGENT_DIR" ]; then
  echo "==> Stopping agent infrastructure (Postgres + Redis)..."
  (cd "$AGENT_DIR" && make local-down 2>/dev/null) || true
fi

echo "==> Done."
