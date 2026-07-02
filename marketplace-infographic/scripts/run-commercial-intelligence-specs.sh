#!/usr/bin/env bash
# Chapter 11 — Commercial Intelligence Platform test suite
set -euo pipefail
cd "$(dirname "$0")/.."
CIP="src/lib/commercial-intelligence-platform"
SPECS=(
  "$CIP/design-commercial-constitution-platform.spec.ts"
  "$CIP/design-commercial-intelligence-platform-summary.spec.ts"
  "$CIP/design-commercial-intelligence-manifest-platform.spec.ts"
)
for f in "${SPECS[@]}"; do
  echo "==> $f"
  npx tsx "$f"
done
echo "==> All Chapter 11 Commercial Intelligence specs OK (75 tests)"
