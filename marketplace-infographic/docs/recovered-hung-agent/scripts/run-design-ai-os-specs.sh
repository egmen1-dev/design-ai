#!/usr/bin/env bash
# Design AI OS — full audit test suite (Chapters 1–11)
set -euo pipefail
cd "$(dirname "$0")/.."
echo "==> OS Chapters 1-11 integration"
npx tsx src/lib/design-ai-os/design-ai-os-chapters-1-11.spec.ts
echo "==> Chapter 11 sub-modules (11.18-11.20)"
bash scripts/run-commercial-intelligence-specs.sh
echo "==> All Design AI OS Chapter 1-11 specs OK"
