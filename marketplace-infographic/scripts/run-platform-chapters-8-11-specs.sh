#!/usr/bin/env bash
# Chapters 8–11 platform layer tests
set -euo pipefail
cd "$(dirname "$0")/.."
SPECS=(
  src/lib/design-ai-book/design-ai-book-ch1-11.spec.ts
  src/lib/design-knowledge-platform/design-knowledge-platform.spec.ts
  src/lib/intelligent-orchestration-platform/intelligent-orchestration-platform.spec.ts
  src/lib/human-ai-collaboration/human-ai-collaboration.spec.ts
)
for f in "${SPECS[@]}"; do
  echo "==> $f"
  npx tsx "$f"
done
bash scripts/run-commercial-intelligence-specs.sh
echo "==> All platform chapters 8–11 specs OK"
