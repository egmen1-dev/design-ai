#!/usr/bin/env bash
# Full Design AI book audit test suite (chapters 3–7 v18 + chapters 8–11 platforms)
set -euo pipefail
cd "$(dirname "$0")/.."
echo "==> Chapters 3–7 (v18 render-blueprint)"
bash scripts/run-v18-blueprint-tests.sh
echo ""
echo "==> Chapters 8–11 (platform layer)"
bash scripts/run-platform-chapters-8-11-specs.sh
echo ""
echo "==> Design AI Book audit suite complete"
