# DESIGN AI v18 — Chapter 4: Agent Ecosystem

> Реализация: `agent-ecosystem.ts`, `agent-ecosystem-validator.ts`

## Purpose

Agent Ecosystem определяет архитектуру интеллектуальных агентов Design AI. Агенты — **единственные** компоненты, принимающие дизайнерские решения. Они не генерируют изображения, не взаимодействуют с Provider и не создают Prompt.

## Golden Rule

> Агент не является генератором Prompt. Агент — профессиональный специалист, принимающий одно дизайнерское решение, записывающий его в RenderBlueprint и передающий управление следующему этапу Pipeline.

## Nine Principles

| Principle | Summary |
|-----------|---------|
| Single Responsibility | Одна область решений на агента |
| Stateless | Состояние только в RenderBlueprint |
| Deterministic Intent | Одинаковый blueprint → одинаковое решение |
| Blueprint Driven | Решения только из RenderBlueprint |
| Explainable Decision | decisionTrace + confidence + sections |
| No Direct Communication | Только через Blueprint и Lifecycle Manager |
| Provider Independence | Агент не знает FLUX/GPT Image/SDXL |
| Quality First | Качество важнее скорости |
| Contract Based | Единый Agent Contract |

## Five Categories

| Category | Agents |
|----------|--------|
| Creative Directors | creative-engine, visual-story-director, scene-director, commercial-photo-director |
| Technical Directors | product-analyzer, camera-director, lighting-director, material-director, composition-director |
| Critics | critics |
| Orchestrators | governance, chief-design-director |
| Learning Agents | (future — design memory) |

`flux-adapter` исключён из экосистемы — это Adapter, не агент принятия решений.

## API

```typescript
import {
  AgentEcosystemValidator,
  validateAgentEcosystem,
  recordAgentDecision,
  getAgentCategory,
  AGENT_ECOSYSTEM_GOLDEN_RULE,
} from "./render-blueprint";

const report = validateAgentEcosystem({
  agent: storyDirectorAgent,
  result: agentResult,
  sectionsWritten: ["story"],
});

const decision = recordAgentDecision({
  agentId: "visual-story-director",
  result: agentResult,
  sectionsUsed: ["story", "creative", "product"],
  reason: "Hook derived from creative goal",
});
```

## Validation

`AgentEcosystemValidator` проверяет принципы до/после выполнения агента:

- Contract structure (id, version, stage, toUpdates)
- Section ownership vs AGENT_WRITE_MATRIX
- Provider tokens in decisionTrace
- Cross-agent calls
- decisionTrace presence and confidence range

## Test

```bash
npx tsx src/lib/render-blueprint/agent-ecosystem.spec.ts
```
