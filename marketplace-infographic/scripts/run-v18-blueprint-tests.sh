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
  src/lib/render-blueprint/agent-registry-v43.spec.ts
  src/lib/render-blueprint/agent-discovery.spec.ts
  src/lib/render-blueprint/agent-dependency.spec.ts
  src/lib/render-blueprint/agent-context.spec.ts
  src/lib/render-blueprint/agent-memory.spec.ts
  src/lib/render-blueprint/agent-decision.spec.ts
  src/lib/render-blueprint/agent-confidence.spec.ts
  src/lib/render-blueprint/visual-story-director.spec.ts
  src/lib/render-blueprint/scene-director.spec.ts
  src/lib/render-blueprint/composition-director.spec.ts
  src/lib/render-blueprint/commercial-photo-director.spec.ts
  src/lib/render-blueprint/lighting-director.spec.ts
  src/lib/render-blueprint/camera-director.spec.ts
  src/lib/render-blueprint/material-director.spec.ts
  src/lib/render-blueprint/render-adapter.spec.ts
  src/lib/render-blueprint/vision-quality-director.spec.ts
  src/lib/render-blueprint/chief-design-director.spec.ts
  src/lib/render-blueprint/design-memory.spec.ts
  src/lib/render-blueprint/agent-communication-protocol.spec.ts
  src/lib/render-blueprint/blueprint-evolution.spec.ts
  src/lib/render-blueprint/consensus-engine.spec.ts
  src/lib/render-blueprint/retry-architecture.spec.ts
  src/lib/render-blueprint/provider-independence.spec.ts
  src/lib/render-blueprint/explainability-architecture.spec.ts
  src/lib/render-blueprint/failure-recovery-architecture.spec.ts
  src/lib/render-blueprint/agent-ecosystem-summary.spec.ts
  src/lib/render-blueprint/design-knowledge-philosophy.spec.ts
  src/lib/render-blueprint/knowledge-architecture.spec.ts
  src/lib/render-blueprint/knowledge-sources.spec.ts
  src/lib/render-blueprint/knowledge-layers.spec.ts
  src/lib/render-blueprint/marketplace-knowledge.spec.ts
  src/lib/render-blueprint/design-rules-engine.spec.ts
  src/lib/render-blueprint/style-knowledge.spec.ts
  src/lib/render-blueprint/composition-knowledge.spec.ts
  src/lib/render-blueprint/event-system.spec.ts
  src/lib/render-blueprint/snapshot-recovery.spec.ts
  src/lib/render-blueprint/lifecycle-manager.spec.ts
  src/lib/render-blueprint/render-pipeline.spec.ts
  src/lib/render-blueprint/recovery-engine.spec.ts
  src/lib/render-blueprint/observability.spec.ts
  src/lib/render-blueprint/vision-tests.spec.ts
  src/lib/render-blueprint/vision-qa.spec.ts
  src/lib/render-blueprint/architecture-validator.spec.ts
  src/lib/render-blueprint/agent-ecosystem.spec.ts
  src/lib/render-blueprint/universal-agent-contract.spec.ts
  src/lib/render-blueprint/agent-lifecycle.spec.ts
  src/lib/render-blueprint/testing-architecture.spec.ts
)
for f in "${SPECS[@]}"; do
  echo "==> $f"
  npx tsx "$f"
done
echo "==> All v18 RenderBlueprint specs OK"
