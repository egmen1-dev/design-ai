#!/usr/bin/env bash
# DESIGN AI v18 — full RenderBlueprint test suite (Chapter 3.17)
set -euo pipefail
cd "$(dirname "$0")/.."
SPECS=(
  src/lib/render-blueprint/serialization.spec.ts
  src/lib/render-blueprint/constraint-engine.spec.ts
  src/lib/render-blueprint/mutation-engine.spec.ts
  src/lib/render-blueprint/validation-engine.spec.ts
  src/lib/render-blueprint/performance-model.spec.ts
  src/lib/render-blueprint/render-blueprint.spec.ts
  src/lib/render-blueprint/blueprint-versioning.spec.ts
  src/lib/render-blueprint/decision-graph.spec.ts
  src/lib/render-blueprint/lifecycle.spec.ts
  src/lib/render-blueprint/agent-contracts.spec.ts
  src/lib/render-blueprint/agent-registry.spec.ts
  src/lib/render-blueprint/event-system.spec.ts
  src/lib/render-blueprint/snapshot-recovery.spec.ts
  src/lib/render-blueprint/lifecycle-manager.spec.ts
  src/lib/render-blueprint/render-pipeline.spec.ts
  src/lib/render-blueprint/recovery-engine.spec.ts
  src/lib/render-blueprint/observability.spec.ts
  src/lib/render-blueprint/vision-tests.spec.ts
  src/lib/render-blueprint/vision-qa.spec.ts
  src/lib/render-blueprint/testing-architecture.spec.ts
)
for f in "${SPECS[@]}"; do
  echo "==> $f"
  npx tsx "$f"
done
echo "==> All v18 RenderBlueprint specs OK"
