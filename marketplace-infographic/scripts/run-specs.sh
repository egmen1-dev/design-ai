#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
SPECS=(
  src/lib/design-governance/scores/evaluate.spec.ts
  src/lib/design-governance/design-governance.spec.ts
  src/lib/design-governance/constitution/gate.spec.ts
  src/lib/design-governance/constitution/render-pass.spec.ts
  src/lib/render-engine/render-engine.spec.ts
  src/lib/render-engine/adapters/pollinations-compiler.spec.ts
  src/lib/render-engine/providers/pollinations/moderation.spec.ts
  src/lib/design/visual-pipeline/visual-pipeline.spec.ts
  src/lib/render-blueprint/render-blueprint.spec.ts
  src/lib/render-blueprint/lifecycle.spec.ts
  src/lib/render-blueprint/agent-contracts.spec.ts
  src/lib/render-blueprint/decision-graph.spec.ts
  src/lib/render-blueprint/lifecycle-manager.spec.ts
  src/lib/render-blueprint/mutation-engine.spec.ts
  src/lib/render-blueprint/validation-engine.spec.ts
)
for f in "${SPECS[@]}"; do
  echo "==> $f"
  npx tsx "$f"
done
echo "==> All specs OK"
