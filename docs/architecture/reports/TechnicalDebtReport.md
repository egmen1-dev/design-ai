# Technical Debt Report

| ID | Severity | File | Issue | Recommendation |
|----|----------|------|-------|----------------|
| TD-001 | Critical | `scripts/architecture-scanner/detect-violations.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-049 | Critical | `src/components/PromptHints.tsx` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-051 | Critical | `src/components/PromptHintsPreview.tsx` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-056 | Critical | `src/lib/agents/art-director/agent.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-057 | Critical | `src/lib/agents/chief-design-director/agent.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-058 | Critical | `src/lib/agents/commercial-photo-director/agent.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-063 | Critical | `src/lib/agents/commercial-photographer/agent.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-069 | Critical | `src/lib/agents/marketplace-ctr-expert/agent.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-070 | Critical | `src/lib/agents/senior-art-director/agent.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-071 | Critical | `src/lib/agents/visual-story-director/agent.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-083 | Critical | `src/lib/design-brief/sanitize.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-095 | Critical | `src/lib/design-process/creative-director-prompt.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-101 | Critical | `src/lib/design-process/pipeline.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-104 | Critical | `src/lib/design-process/prompts.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-111 | Critical | `src/lib/design/design-constitution/types.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-112 | Critical | `src/lib/design/design-constitution/validators/pipeline.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-113 | Critical | `src/lib/design/design-constitution/validators/stages.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-114 | Critical | `src/lib/design/prompt-builder.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-117 | Critical | `src/lib/generation/diagnostic-report.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-317 | Critical | `src/lib/render-blueprint/render-adapter-engine.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-383 | Critical | `src/lib/sd-stored-payload.ts` | Prompt generation or import outside Provider Adapter | Move to Provider Adapter |
| TD-084 | High | `src/lib/design-governance/scores/generate-infographic-handler.ts` | Platform imports another platform directly | Exchange data via ProjectState only |
| TD-085 | High | `src/lib/design-governance/scores/generate-infographic-handler.ts` | Orchestration without ProjectState | Wire orchestration through ProjectState |
| TD-115 | High | `src/lib/design/visual-pipeline/catalogs/cover-concept.ts` | Platform imports another platform directly | Exchange data via ProjectState only |
| TD-116 | High | `src/lib/generate-infographic-handler.ts` | Orchestration without ProjectState | Wire orchestration through ProjectState |
| TD-121 | High | `src/lib/render-blueprint/agent-communication-protocol-engine.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-122 | High | `src/lib/render-blueprint/agent-confidence.spec.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-123 | High | `src/lib/render-blueprint/agent-context-engine.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-124 | High | `src/lib/render-blueprint/agent-contracts.spec.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-125 | High | `src/lib/render-blueprint/agent-contracts.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-126 | High | `src/lib/render-blueprint/agent-decision.spec.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-127 | High | `src/lib/render-blueprint/agent-dependency-engine.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-128 | High | `src/lib/render-blueprint/agent-dependency-graph.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-129 | High | `src/lib/render-blueprint/agent-dependency.spec.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-130 | High | `src/lib/render-blueprint/agent-design-philosophy-engine.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-131 | High | `src/lib/render-blueprint/agent-design-philosophy.spec.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-132 | High | `src/lib/render-blueprint/agent-discovery.spec.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-133 | High | `src/lib/render-blueprint/agent-discovery.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-134 | High | `src/lib/render-blueprint/agent-ecosystem-summary-engine.ts` | Provider logic inside platform module | Move provider logic to Provider Adapter |
| TD-135 | High | `src/lib/render-blueprint/agent-ecosystem-summary-engine.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-136 | High | `src/lib/render-blueprint/agent-ecosystem-summary-types.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-137 | High | `src/lib/render-blueprint/agent-ecosystem-summary.spec.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-138 | High | `src/lib/render-blueprint/agent-ecosystem.spec.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-139 | High | `src/lib/render-blueprint/agent-ecosystem.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-140 | High | `src/lib/render-blueprint/agent-implementation-spec-engine.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-141 | High | `src/lib/render-blueprint/agent-implementation-spec-types.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-142 | High | `src/lib/render-blueprint/agent-lifecycle.spec.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-143 | High | `src/lib/render-blueprint/agent-matrix.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-144 | High | `src/lib/render-blueprint/agent-memory-engine.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
| TD-145 | High | `src/lib/render-blueprint/agent-memory-model-engine.ts` | Render engine makes business decisions | Move decisions to Creative/Commercial platforms |
