#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Stopping e2e compose stack..."
podman compose down -v --remove-orphans 2>/dev/null || true
echo "==> Done."
